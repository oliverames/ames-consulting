function normalizeSiteUrl(siteUrl) {
  const normalized = (siteUrl || "https://ames.consulting").trim();
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function setMetaByName(name, content) {
  let node = document.querySelector(`meta[name="${name}"]`);

  if (!content) {
    node?.remove();
    return;
  }

  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("name", name);
    document.head.append(node);
  }

  node.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let node = document.querySelector(`meta[property="${property}"]`);

  if (!content) {
    node?.remove();
    return;
  }

  if (!node) {
    node = document.createElement("meta");
    node.setAttribute("property", property);
    document.head.append(node);
  }

  node.setAttribute("content", content);
}

function setLink(rel, href, extraAttributes = {}) {
  let node = document.querySelector(`link[rel="${rel}"]`);

  if (!href) {
    node?.remove();
    return;
  }

  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.append(node);
  }

  node.setAttribute("href", href);

  Object.entries(extraAttributes).forEach(([key, value]) => {
    if (value) {
      node.setAttribute(key, value);
    }
  });
}

function toAbsoluteUrl(input, siteUrl) {
  try {
    return new URL(input, `${siteUrl}/`).toString();
  } catch {
    return `${siteUrl}/`;
  }
}

function getBasePageMetadata(view, config) {
  const siteTitle = config.siteTitle;

  if (view === "blog") {
    return {
      title: `Blog | ${siteTitle}`,
      description: `All posts from ${siteTitle}, including writing and portfolio work.`,
      path: "/blog/"
    };
  }

  if (view === "work") {
    return {
      title: `Work | ${siteTitle}`,
      description: `Selected projects and work from ${siteTitle}.`,
      path: "/work/"
    };
  }

  return {
    title: siteTitle,
    description: config.siteDescription,
    path: "/"
  };
}

function toRobotsValue({ query, tag, view, portfolioTag }) {
  const hasSearchQuery = Boolean(query);
  const hasNonCanonicalTagView = view === "blog" && tag && tag !== portfolioTag;
  const base = "max-snippet:-1,max-image-preview:large,max-video-preview:-1";

  if (hasSearchQuery || hasNonCanonicalTagView) {
    return `noindex,follow,${base}`;
  }

  return `index,follow,${base}`;
}

function buildDynamicMetadata({ view, filters, config }) {
  const base = getBasePageMetadata(view, config);
  const query = filters.query.trim();
  const tag = filters.tag.trim();

  let title = base.title;
  let description = base.description;
  let canonicalPath = base.path;

  if (query) {
    title = `Search: ${query} | ${base.title}`;
    description = `Search results for “${query}” on ${config.siteTitle}.`;
  } else if (tag) {
    if (view === "blog" && tag === config.portfolioTag) {
      title = `Work | ${config.siteTitle}`;
      description = `Work-tagged posts from ${config.siteTitle}.`;
      canonicalPath = "/work/";
    } else {
      title = `#${tag} | ${base.title}`;
      description = `Posts tagged #${tag} on ${config.siteTitle}.`;
    }
  }

  const siteUrl = normalizeSiteUrl(config.siteUrl);
  const canonicalUrl = toAbsoluteUrl(canonicalPath, siteUrl);

  return {
    title,
    description,
    canonicalUrl,
    robots: toRobotsValue({
      query,
      tag,
      view,
      portfolioTag: config.portfolioTag
    })
  };
}

function buildStructuredData({ view, config, metadata, posts }) {
  const siteUrl = normalizeSiteUrl(config.siteUrl);

  const websiteNode = {
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: `${siteUrl}/`,
    name: config.siteTitle,
    description: config.siteDescription,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/blog/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const pageNode = {
    "@type": view === "home" ? "WebPage" : "CollectionPage",
    "@id": `${metadata.canonicalUrl}#page`,
    url: metadata.canonicalUrl,
    name: metadata.title,
    description: metadata.description,
    isPartOf: {
      "@id": `${siteUrl}/#website`
    },
    inLanguage: "en"
  };

  const graph = [websiteNode, pageNode];

  if (config.authorName) {
    graph.push({
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: config.authorName,
      url: `${siteUrl}/`,
      jobTitle: "Content Strategist & Software Developer",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Montpelier",
        addressRegion: "VT",
        addressCountry: "US"
      },
      sameAs: [
        "https://github.com/oliverames",
        "https://linkedin.com/in/oliverames",
        "https://bsky.app/profile/oliverames.bsky.social",
        "https://mastodon.social/@oliverames",
        "https://instagram.com/oliverames"
      ]
    });
  }

  if (view !== "home") {
    const itemList = {
      "@type": "ItemList",
      itemListElement: posts
        .slice(0, 20)
        .map((post, index) => {
          const absolutePostUrl = post.url ? toAbsoluteUrl(post.url, siteUrl) : "";
          const node = {
            "@type": "ListItem",
            position: index + 1,
            name: post.title
          };

          if (absolutePostUrl) {
            node.url = absolutePostUrl;
          }

          return node;
        })
    };

    pageNode.mainEntity = itemList;
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}

function setStructuredData(documentData) {
  let node = document.getElementById("ld-json");

  if (!node) {
    node = document.createElement("script");
    node.id = "ld-json";
    node.type = "application/ld+json";
    document.head.append(node);
  }

  node.textContent = JSON.stringify(documentData);
}

export function syncSeo({ view, filters, config, posts }) {
  const metadata = buildDynamicMetadata({ view, filters, config });
  const socialImage = config.defaultSocialImage
    ? toAbsoluteUrl(config.defaultSocialImage, normalizeSiteUrl(config.siteUrl))
    : "";

  document.title = metadata.title;

  setLink("canonical", metadata.canonicalUrl);
  setLink("sitemap", toAbsoluteUrl("/sitemap.xml", normalizeSiteUrl(config.siteUrl)), {
    type: "application/xml"
  });

  if (config.jsonFeedUrl) {
    setLink("alternate", config.jsonFeedUrl, {
      type: "application/feed+json",
      title: `${config.siteTitle} JSON Feed`
    });
  }

  setMetaByName("description", metadata.description);
  setMetaByName("robots", metadata.robots);
  setMetaByName("author", config.authorName || "");
  setMetaByName("twitter:card", socialImage ? "summary_large_image" : "summary");
  setMetaByName("twitter:title", metadata.title);
  setMetaByName("twitter:description", metadata.description);
  setMetaByName("twitter:image", socialImage);

  if (config.twitterHandle) {
    setMetaByName("twitter:site", config.twitterHandle);
    setMetaByName("twitter:creator", config.twitterHandle);
  }

  setMetaByProperty("og:site_name", config.siteTitle);
  setMetaByProperty("og:type", "website");
  setMetaByProperty("og:locale", config.locale || "en_US");
  setMetaByProperty("og:title", metadata.title);
  setMetaByProperty("og:description", metadata.description);
  setMetaByProperty("og:url", metadata.canonicalUrl);
  setMetaByProperty("og:image", socialImage);

  setStructuredData(buildStructuredData({
    view,
    config,
    metadata,
    posts
  }));
}

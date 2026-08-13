#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { workProjectTitleForRoute } from "./site-taxonomy.mjs";

const root = join(import.meta.dirname, "..");
const siteUrl = "https://ames.consulting";
const defaultImage = `${siteUrl}/assets/images/about/oliver-ames-profile.webp`;

const overrides = {
  "/": {
    title: "Ames Consulting | Vermont Commercial Photographer and Strategist",
    description: "Oliver Ames is a commercial photographer and strategist in Montpelier who also builds websites, automation, and software for Vermont organizations."
  },
  "/services/photography-and-video/": {
    title: "Commercial Photography and Video in Vermont | Oliver Ames",
    description: "Oliver Ames makes workplace photographs and portraits, covers events, and produces video for Vermont organizations.",
    image: `${siteUrl}/assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp`
  },
  "/services/": {
    title: "Photography, Content, and Practical Technology Services | Oliver Ames",
    description: "Oliver Ames provides photography, content strategy, and practical technology services for organizations in Vermont."
  },
  "/services/strategy-and-content/": {
    title: "Content Strategy and Campaigns in Vermont | Oliver Ames",
    description: "Oliver Ames helps Vermont organizations plan campaigns, write clearly, publish social content, and measure what worked."
  },
  "/services/practical-technology/": {
    title: "Websites, Automation, and Digital Systems in Vermont | Oliver Ames",
    description: "Oliver Ames helps Vermont organizations fix websites, automate routine work, understand their analytics, and build small software tools."
  },
  "/work/": {
    title: "Vermont Photography, Video, and Campaign Work | Oliver Ames",
    description: "Browse photography, video, communications, and software projects by Oliver Ames in Montpelier, Vermont."
  },
  "/work/neg-ecp-conference-2026/": {
    title: "47th NEG-ECP Conference Photography | Work by Oliver Ames",
    description: "Thirty-five photographs by Oliver Ames from the 47th Conference of New England Governors and Eastern Canadian Premiers at Shelburne Farms on August 10, 2026.",
    image: `${siteUrl}/assets/images/work/events/neg-ecp-conference-2026/dsc01378.webp`
  },
  "/work/credit-union-websites/": {
    title: "Credit Union Website Projects | Work by Oliver Ames",
    description: "Oliver Ames helped build the VSECU and EastRise websites through content, photography, migration, implementation, and quality assurance."
  },
  "/work/vsecu-website/": {
    title: "VSECU Website Redesign | Work by Oliver Ames",
    description: "For VSECU's 2021 website redesign, Oliver Ames worked on content, photography, migration, implementation, and quality assurance."
  },
  "/work/eastrise-website/": {
    title: "EastRise Website Launch | Work by Oliver Ames",
    description: "For EastRise's 2024 website launch, Oliver Ames worked on content, photography, migration, implementation, and quality assurance."
  },
  "/about/": {
    title: "Oliver Ames | Vermont Photographer, Strategist, and Developer",
    description: "Oliver Ames is a Montpelier-based photographer and strategist who also produces video and builds software."
  },
  "/contact/": {
    title: "Contact a Vermont Commercial Photographer | Oliver Ames",
    description: "Contact Oliver Ames about a photography, communications, website, or software project in Vermont."
  },
  "/blog/": {
    title: "Writing by Oliver Ames | Vermont Photography, Technology, and Work",
    description: "Oliver Ames writes about photography, communications, technology, and his work in Vermont."
  },
  "/blog/archive/": {
    title: "Writing Archive | Oliver Ames",
    description: "Every article and note by Oliver Ames, in reverse chronological order."
  },
  "/testimonials/": {
    title: "Client and Colleague Recommendations | Oliver Ames",
    description: "Read public LinkedIn recommendations from clients and colleagues who worked with Oliver Ames."
  },
  "/blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/": {
    title: "The Sunshine Trail Brand Campaign | Oliver Ames",
    description: "Oliver Ames built an interactive road trip from Waitsfield to Asheville as a speculative campaign for Lawson's Finest Liquids."
  }
};

const decodeEntities = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#39;", "'")
  .replaceAll("&nbsp;", " ");

const text = (html = "") => decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const attr = (value = "") => value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
const json = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

function sentenceSafeExcerpt(value, limit) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;

  const sentences = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(normalized)]
    .map(({ segment }) => segment.trim())
    .filter(Boolean);
  let excerpt = "";
  for (const sentence of sentences) {
    const candidate = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (candidate.length > limit) break;
    excerpt = candidate;
  }

  // A complete first sentence is more useful than a shorter fragment. This
  // fallback can exceed the preferred search-snippet length, but it never
  // publishes a sentence that stops halfway through a thought.
  return excerpt || sentences[0] || normalized;
}

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    // Keep in sync with apply-shared-ui.mjs, apply-image-dimensions.mjs, and
    // validate-structured-data.mjs.
    if (["node_modules", ".git", "_site", "playwright-report", "test-results", "output"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name === "index.html") files.push(path);
  }
  return files;
}

function routeFor(file) {
  const rel = relative(root, file).split(sep).join("/");
  return rel === "index.html" ? "/" : `/${rel.replace(/index\.html$/, "")}`;
}

function imageFor(route, html) {
  if (overrides[route]?.image) return overrides[route].image;
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (!match) return defaultImage;
  try { return new URL(match[1], siteUrl).toString(); } catch { return defaultImage; }
}

function metadataFor(route, html) {
  const h1Match = html.match(/<h1([^>]*)>([\s\S]*?)<\/h1>/i);
  const h1 = text(h1Match?.[2] || "Oliver Ames");
  // Take the last description on the page: when a stale hand-authored block
  // coexists with a previously generated one, the generated value is last.
  const oldDescription = [...html.matchAll(/<meta\s[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/gi)].at(-1)?.[1];
  const currentTitle = text(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
  const currentSubject = currentTitle.split(" | ")[0].trim();
  const projectTitle = workProjectTitleForRoute(route);
  const fallbackTitle = route.startsWith("/work/")
    ? `${projectTitle || currentSubject || h1} | Work by Oliver Ames`
    : `${h1} | Oliver Ames`;
  const rawDescription = (overrides[route]?.description || oldDescription || `${h1.replace(/[.!?]+$/, "")}. A project by Oliver Ames in Vermont.`).replaceAll("..", ".");
  const description = sentenceSafeExcerpt(rawDescription, 165);
  return {
    title: overrides[route]?.title || fallbackTitle,
    description,
    displayTitle: projectTitle || h1,
  };
}

function breadcrumbs(route, title, displayTitle) {
  if (route === "/") return [];
  const parts = route.split("/").filter(Boolean);
  const names = { work: "Work", services: "Services", blog: "Writing", about: "About", contact: "Contact", testimonials: "Testimonials" };
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` }];
  const navigableParts = parts.map((part, index) => ({ part, index }));
  navigableParts.forEach(({ part, index: partIndex }, index) => {
    const path = `/${parts.slice(0, partIndex + 1).join("/")}/`;
    const isLast = partIndex === parts.length - 1;
    const name = isLast
      ? (parts.length === 1 && names[part]) || displayTitle || title.split(" | ")[0]
      : names[part] || part;
    items.push({ "@type": "ListItem", position: index + 2, name, item: `${siteUrl}${path}` });
  });
  return items;
}

function isBlogPost(route) {
  return route.startsWith("/blog/") && !["/blog/", "/blog/archive/"].includes(route);
}

function graphFor(route, metadata, image, html) {
  const canonical = `${siteUrl}${route}`;
  const person = {
    "@type": "Person", "@id": `${siteUrl}/#oliver-ames`, name: "Oliver Ames", url: `${siteUrl}/about/`, image: defaultImage,
    jobTitle: ["Commercial Photographer", "Content Strategist", "Software Developer"],
    address: { "@type": "PostalAddress", addressLocality: "Montpelier", addressRegion: "VT", addressCountry: "US" },
    sameAs: ["https://github.com/oliverames", "https://www.linkedin.com/in/oliverames", "https://oliverames.micro.blog/", "https://mastodon.social/@oliverames", "https://bsky.app/profile/oliverames.bsky.social", "https://www.instagram.com/oliverames/"]
  };
  const organization = {
    "@type": "ProfessionalService", "@id": `${siteUrl}/#ames-consulting`, name: "Ames Consulting", url: `${siteUrl}/`, founder: { "@id": person["@id"] },
    areaServed: { "@type": "State", name: "Vermont" },
    knowsAbout: ["Commercial photography", "Workplace photography", "Corporate portraits", "Event photography", "Video production", "Content strategy", "Digital communications", "Web accessibility", "Software development"]
  };
  const pageType = isBlogPost(route) ? "BlogPosting" : ["/blog/archive/", "/services/"].includes(route) ? "CollectionPage" : route.startsWith("/work/") && route !== "/work/" ? "CreativeWork" : route.startsWith("/services/") ? "Service" : route === "/about/" ? "ProfilePage" : "WebPage";
  const page = {
    "@type": pageType, "@id": `${canonical}#page`, url: canonical, name: pageType === "CreativeWork" ? metadata.displayTitle : metadata.title, description: metadata.description, image,
    inLanguage: "en-US", isPartOf: { "@id": `${siteUrl}/#website` }, author: { "@id": person["@id"] }
  };
  if (pageType === "Service") {
    page.provider = { "@id": organization["@id"] };
    page.areaServed = { "@type": "State", name: "Vermont" };
  }
  if (pageType === "BlogPosting") {
    const headline = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]);
    const datePublished = html.match(/<time\b[^>]*\bdatetime="([^"]+)"[^>]*>/i)?.[1];
    if (!headline || !datePublished) {
      throw new Error(`Blog post ${route} must expose its headline and publication date in page content.`);
    }
    page.headline = headline;
    page.datePublished = datePublished;
  }
  const graph = [
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: `${siteUrl}/`, name: "Oliver Ames", alternateName: "Ames Consulting", publisher: { "@id": organization["@id"] }, inLanguage: "en-US" },
    person, organization, page
  ];
  const crumbs = breadcrumbs(route, metadata.title, metadata.displayTitle);
  if (crumbs.length) graph.push({ "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumbs`, itemListElement: crumbs });
  return { "@context": "https://schema.org", "@graph": graph };
}

function replaceOrAdd(head, pattern, markup) {
  return pattern.test(head) ? head.replace(pattern, markup) : `${head}${markup}`;
}

for (const file of await htmlFiles(root)) {
  const route = routeFor(file);
  let html = await readFile(file, "utf8");
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) continue;
  const metadata = metadataFor(route, html);
  const canonical = `${siteUrl}${route}`;
  const image = imageFor(route, html);
  let head = headMatch[1];
  head = replaceOrAdd(head, /<title>[\s\S]*?<\/title>/i, `<title>${attr(metadata.title)}</title>`);
  // Strip every existing description/robots/canonical — including
  // Prettier-formatted self-closing and multi-line tags — then append exactly
  // one generated instance, so hand-authored and generated blocks can never
  // coexist with conflicting values.
  // Preserve any deliberate noindex directive. Give all other pages the
  // standard search directives.
  const keepNoindex = /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"[^>]*>/i.test(head);
  head = head.replace(/<meta\s[^>]*name="description"[^>]*>/gi, "");
  head = head.replace(/<meta\s[^>]*name="robots"[^>]*>/gi, "");
  head = head.replace(/<link\s[^>]*rel="canonical"[^>]*>/gi, "");
  head += `<meta name="description" content="${attr(metadata.description)}">`;
  head += keepNoindex
    ? '<meta name="robots" content="noindex">'
    : '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">';
  head += `<link rel="canonical" href="${canonical}">`;
  if (route === "/" && !head.includes("HTxwL3I-JCGChYJ8VI-L6OO_au7B4873z3bWuYMBYro.woff2")) {
    const fontPreloads = '<link rel="preload" href="https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873z3bWuYMBYro.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuYMBYro.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7I_FMl_E.woff2" as="font" type="font/woff2" crossorigin>';
    head = head.replace(/(<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>)/i, `$1${fontPreloads}`);
  }
  head = head.replace(/<meta\s[^>]*property="og:[^"]*"[^>]*>/gi, "").replace(/<meta\s[^>]*name="twitter:[^"]*"[^>]*>/gi, "").replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");
  head += `<meta property="og:site_name" content="Oliver Ames"><meta property="og:locale" content="en_US"><meta property="og:type" content="${isBlogPost(route) ? "article" : "website"}"><meta property="og:title" content="${attr(metadata.title)}"><meta property="og:description" content="${attr(metadata.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${attr(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(metadata.title)}"><meta name="twitter:description" content="${attr(metadata.description)}"><meta name="twitter:image" content="${attr(image)}"><script type="application/ld+json">${json(graphFor(route, metadata, image, html))}</script>`;
  html = html.replace(headMatch[0], `<head>${head}</head>`).replace(/[ \t]+$/gm, "");
  if (route === "/") {
    html = html.replace(/\s*<script(?: type="module")? src="\.\/assets\/js\/hero-headline\.js"><\/script>/g, "");
    html = html.replace(/(<h1 data-hero-headline>[\s\S]*?<\/h1>)/, '$1<script src="./assets/js/hero-headline.js"></script>');
  }
  await writeFile(file, html);
}

console.log("Applied sitewide SEO metadata and structured data.");

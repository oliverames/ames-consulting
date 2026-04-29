import { loadSiteConfig } from "./site-config.js";
import { createSource } from "./content-sources.js";
import { syncSeo } from "./seo.js";
import {
  decorateContentMedia,
  wireAssetProtection,
  wireImageViewer
} from "./image-viewer.js";
import "./post-card.js";

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatReadTime(minutes) {
  const normalized = Number.isFinite(minutes) && minutes > 0 ? Math.ceil(minutes) : 1;
  return `${normalized} min read`;
}

function getView() {
  return document.documentElement.dataset.view || "home";
}

function normalizeSearchParams(config, view) {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  let tag = (params.get("tag") || "").trim().toLowerCase();

  if (!tag && view === "work") {
    tag = config.portfolioTag.toLowerCase();
  }

  return {
    query,
    tag
  };
}

function applyFilters(posts, filters, view, config) {
  const queryNeedle = filters.query.toLowerCase();

  let output = posts.filter((post) => {
    const matchesTag = !filters.tag || (post.tags || []).includes(filters.tag);
    if (!matchesTag) {
      return false;
    }

    if (!queryNeedle) {
      return true;
    }

    const haystack = `${post.title} ${post.summary} ${(post.tags || []).join(" ")}`.toLowerCase();
    return haystack.includes(queryNeedle);
  });

  if (view === "home") {
    output = output.slice(0, config.homePreviewLimit);
  }

  return output;
}

function syncFilterUi(filters) {
  const searchInput = document.getElementById("search-input");
  const tagInput = document.getElementById("tag-input");

  if (searchInput) {
    searchInput.value = filters.query;
  }

  if (tagInput) {
    tagInput.value = filters.tag;
  }
}

function updateQuery(filters) {
  const params = new URLSearchParams(window.location.search);

  if (filters.query) {
    params.set("q", filters.query);
  } else {
    params.delete("q");
  }

  if (filters.tag) {
    params.set("tag", filters.tag);
  } else {
    params.delete("tag");
  }

  const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
  window.history.replaceState({}, "", next);
}

function renderStatus(total, filters, provider) {
  const status = document.getElementById("stream-status");
  if (!status) {
    return;
  }

  const fragments = [];
  fragments.push(`${total} post${total === 1 ? "" : "s"}`);

  if (filters.tag) {
    fragments.push(`tagged #${filters.tag}`);
  }

  if (filters.query) {
    fragments.push(`matching “${filters.query}”`);
  }

  fragments.push(`source: ${provider}`);
  status.textContent = fragments.join(" • ");
}

function renderPosts(posts) {
  const stream = document.getElementById("post-stream");
  const template = document.getElementById("post-template");

  if (!stream || !(template instanceof HTMLTemplateElement)) {
    return;
  }

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No posts matched the current filters.";
    stream.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();

  posts.forEach((post) => {
    const node = template.content.firstElementChild?.cloneNode(true);
    if (!node) {
      return;
    }

    node.post = post;
    fragment.append(node);
  });

  // Atomic swap so the stream height never momentarily collapses between
  // wipe and refill. With statically pre-rendered cards in the HTML, this
  // keeps CLS at 0 during JS hydration since dimensions match.
  stream.replaceChildren(fragment);
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractImageFromPost(post) {
  if (post.imageUrl) {
    return post.imageUrl;
  }

  if (post.contentHtml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.contentHtml, "text/html");
    const firstImg = doc.querySelector("img");
    if (firstImg?.src) {
      return firstImg.src;
    }
  }

  return null;
}

function resolveAssetPath(url) {
  if (!url) {
    return "";
  }

  const normalized = String(url).replace(/^\.\//, "");

  if (!normalized.startsWith("assets/")) {
    return url;
  }

  const depth = window.location.pathname.split("/").filter(Boolean).length;
  const prefix = depth > 0 ? `${"../".repeat(depth)}` : "";
  return `${prefix}${normalized}`;
}

function renderBlogStrip(posts, container, config) {
  if (!container) {
    return;
  }

  const portfolioTag = config.portfolioTag.toLowerCase();
  const postsWithImages = posts
    .filter((post) => {
      const hasImage = extractImageFromPost(post) !== null;
      const isPortfolio = (post.tags || []).some((tag) => tag.toLowerCase() === portfolioTag);
      return hasImage && !isPortfolio;
    })
    .slice(0, 6);

  if (postsWithImages.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  postsWithImages.forEach((post) => {
    const imageUrl = extractImageFromPost(post);
    if (!imageUrl) {
      return;
    }

    const slug = generateSlug(post.title);
    const link = document.createElement("a");
    link.href = `blog/${slug}/`;
    link.className = "path-thumb";
    link.title = post.title;

    const imageWrap = document.createElement("div");
    imageWrap.className = "path-thumb__img";

    const img = document.createElement("img");
    img.src = resolveAssetPath(imageUrl);
    img.alt = post.title;
    img.loading = "lazy";
    img.width = 800;
    img.height = 600;

    const body = document.createElement("div");
    body.className = "path-thumb__body";

    const meta = document.createElement("span");
    meta.className = "path-thumb__meta";
    meta.textContent = `${formatDate(post.publishedAt)} · ${formatReadTime(post.readTimeMinutes)}`;

    const title = document.createElement("h4");
    title.className = "path-thumb__title";
    title.textContent = post.title;

    imageWrap.append(img);
    body.append(meta, title);
    link.append(imageWrap, body);
    fragment.append(link);
  });

  container.replaceChildren(fragment);
}

function sanitizeHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content
    .querySelectorAll("script, style, iframe, object, embed, link[rel='import'], meta")
    .forEach((node) => node.remove());

  template.content.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (name.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }

      if ((name === "href" || name === "src" || name === "xlink:href") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return template.content;
}

function wireDialog(posts) {
  const dialog = document.getElementById("post-dialog");
  const closeButton = document.getElementById("dialog-close");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogMeta = document.getElementById("dialog-meta");
  const dialogBody = document.getElementById("dialog-body");

  if (!(dialog instanceof HTMLDialogElement) || !dialogTitle || !dialogBody) {
    return;
  }

  closeButton?.addEventListener("click", () => dialog.close());

  const byId = new Map(posts.map((post) => [post.id, post]));
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.dataset.action !== "open-dialog") {
      return;
    }

    const id = target.dataset.postId || target.closest("[data-post-id]")?.getAttribute("data-post-id");
    const post = id ? byId.get(id) : undefined;
    if (!post) {
      return;
    }

    dialogTitle.textContent = post.title;
    if (dialogMeta) {
      dialogMeta.textContent = `${formatDate(post.publishedAt)} • ${formatReadTime(post.readTimeMinutes)}`;
    }
    dialogBody.replaceChildren();
    if (post.contentHtml) {
      dialogBody.append(sanitizeHtml(post.contentHtml));
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = post.summary || "";
      dialogBody.append(paragraph);
    }
    decorateContentMedia(dialogBody);
    dialog.showModal();
  });
}

function wireFilters(filters, onUpdate, view, config) {
  const form = document.getElementById("post-filter");
  const searchInput = document.getElementById("search-input");
  const tagInput = document.getElementById("tag-input");
  const clearButton = document.getElementById("clear-filters");

  if (!(form instanceof HTMLFormElement) || !searchInput || !tagInput) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    filters.query = searchInput.value.trim();
    filters.tag = tagInput.value.trim().toLowerCase();
    updateQuery(filters);
    onUpdate();
  });

  clearButton?.addEventListener("click", () => {
    const defaultTag = view === "work" ? config.portfolioTag : "";
    filters.query = "";
    filters.tag = defaultTag;
    searchInput.value = "";
    tagInput.value = defaultTag;
    updateQuery(filters);
    onUpdate();
  });
}

async function bootstrap() {
  const view = getView();
  const config = await loadSiteConfig();
  const source = createSource(config);
  let activeProvider = config.provider;

  let posts = await source.listPosts();
  if (posts.length === 0 && config.provider === "microblog") {
    const fallbackConfig = { ...config, provider: "local" };
    posts = await createSource(fallbackConfig).listPosts();
    activeProvider = "local-fallback";
  }

  if (view === "home") {
    const blogStrip = document.getElementById("blog-strip");
    renderBlogStrip(posts, blogStrip, config);
  }

  const filters = normalizeSearchParams(config, view);
  syncFilterUi(filters);

  const render = () => {
    const filtered = applyFilters(posts, filters, view, config);
    renderPosts(filtered);
    renderStatus(filtered.length, filters, activeProvider);
    syncSeo({
      view,
      filters,
      config,
      posts: filtered
    });
  };

  // Skip the initial render when statically pre-rendered cards already
  // satisfy the current filter state. This avoids a second round-trip
  // for full-size images (post-card.js doesn't know about -card thumbnail
  // variants) and keeps the LCP image as the only image fetched on /blog/.
  // Filter changes still call render() through wireFilters, so search and
  // tag filters work normally — the swap to original images only happens
  // when the user actively narrows the list.
  const stream = document.getElementById("post-stream");
  const hasStaticCards = stream?.querySelector("post-card") != null;
  const hasNoFilters = !filters.query && !filters.tag;

  if (hasStaticCards && hasNoFilters) {
    const filtered = applyFilters(posts, filters, view, config);
    renderStatus(filtered.length, filters, activeProvider);
    syncSeo({ view, filters, config, posts: filtered });
  } else {
    render();
  }

  wireImageViewer();
  wireAssetProtection();
  wireDialog(posts);
  wireFilters(filters, render, view, config);
}

bootstrap().catch((error) => {
  const status = document.getElementById("stream-status");
  if (status) {
    status.textContent = `Unable to load content: ${error.message}`;
  }
});

import { loadSiteConfig } from "./site-config.js";
import { createSource } from "./content-sources.js";
import { syncSeo } from "./seo.js";
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

  stream.replaceChildren();

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No posts matched the current filters.";
    stream.append(empty);
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

  stream.append(fragment);
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

function decorateContentMedia(container) {
  container.querySelectorAll("img").forEach((image) => {
    image.classList.add("zoomable-image", "protected-asset");
    image.dataset.protectedAsset = "image";
    image.setAttribute("draggable", "false");
    image.style.webkitUserDrag = "none";

    if (!image.hasAttribute("loading")) {
      image.loading = "lazy";
    }

    if (!image.hasAttribute("decoding")) {
      image.decoding = "async";
    }

    if (!image.hasAttribute("referrerpolicy")) {
      image.referrerPolicy = "no-referrer";
    }

    if (!image.hasAttribute("tabindex")) {
      image.tabIndex = 0;
    }

    if (!image.hasAttribute("role")) {
      image.setAttribute("role", "button");
    }

    if (!image.hasAttribute("aria-label")) {
      const accessibleLabel = image.alt?.trim() ? `Open larger image: ${image.alt.trim()}` : "Open larger image";
      image.setAttribute("aria-label", accessibleLabel);
    }
  });
}

function isProtectedAssetTarget(target) {
  return Boolean(target.closest(".protected-asset, #image-viewer-image"));
}

function wireImageViewer() {
  const viewer = document.getElementById("image-viewer");
  const closeButton = document.getElementById("image-viewer-close");
  const viewerImage = document.getElementById("image-viewer-image");
  const viewerCaption = document.getElementById("image-viewer-caption");

  if (!(viewer instanceof HTMLDialogElement) || !(viewerImage instanceof HTMLImageElement) || !viewerCaption) {
    return;
  }

  const openViewer = (sourceImage) => {
    const source = sourceImage.currentSrc || sourceImage.src;
    if (!source) {
      return;
    }

    viewerImage.src = source;
    viewerImage.alt = sourceImage.alt || "Image preview";
    viewerCaption.textContent = sourceImage.alt || sourceImage.getAttribute("title") || "";
    viewer.showModal();
  };

  const closeViewer = () => {
    viewer.close();
    viewerImage.src = "";
    viewerImage.alt = "";
    viewerCaption.textContent = "";
  };

  closeButton?.addEventListener("click", closeViewer);
  viewer.addEventListener("click", (event) => {
    if (event.target === viewer) {
      closeViewer();
    }
  });
  viewer.addEventListener("cancel", () => {
    viewerImage.src = "";
    viewerImage.alt = "";
    viewerCaption.textContent = "";
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const image = target.closest(".zoomable-image");
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    event.preventDefault();
    openViewer(image);
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) {
      return;
    }

    if (!target.classList.contains("zoomable-image")) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openViewer(target);
  });
}

function wireAssetProtection() {
  document.addEventListener("contextmenu", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (isProtectedAssetTarget(target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("dragstart", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (isProtectedAssetTarget(target)) {
      event.preventDefault();
    }
  });

  document.addEventListener("keydown", (event) => {
    const saveShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
    if (!saveShortcut) {
      return;
    }

    const viewer = document.getElementById("image-viewer");
    if (viewer instanceof HTMLDialogElement && viewer.open) {
      event.preventDefault();
    }
  });
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

    const card = target.closest("[data-post-id]");
    const id = card?.getAttribute("data-post-id");
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

  render();
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

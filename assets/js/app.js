import { loadSiteConfig } from "/assets/js/site-config.js";
import { createSource } from "/assets/js/content-sources.js";
import "/assets/js/post-card.js";

function getView() {
  return document.documentElement.dataset.view || "home";
}

function normalizeSearchParams(config, view) {
  const params = new URLSearchParams(window.location.search);
  const query = (params.get("q") || "").trim();
  let tag = (params.get("tag") || "").trim().toLowerCase();

  if (!tag && view === "portfolio") {
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

function wireDialog(posts) {
  const dialog = document.getElementById("post-dialog");
  const closeButton = document.getElementById("dialog-close");
  const dialogTitle = document.getElementById("dialog-title");
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
    dialogBody.replaceChildren();
    if (post.contentHtml) {
      dialogBody.append(sanitizeHtml(post.contentHtml));
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = post.summary || "";
      dialogBody.append(paragraph);
    }
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
    const defaultTag = view === "portfolio" ? config.portfolioTag : "";
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
  };

  render();
  wireDialog(posts);
  wireFilters(filters, render, view, config);
}

bootstrap().catch((error) => {
  const status = document.getElementById("stream-status");
  if (status) {
    status.textContent = `Unable to load content: ${error.message}`;
  }
});

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

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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

class PostCardElement extends HTMLElement {
  #post;

  #upgradeProperty(propName) {
    if (!Object.prototype.hasOwnProperty.call(this, propName)) {
      return;
    }

    const value = this[propName];
    delete this[propName];
    this[propName] = value;
  }

  set post(post) {
    this.#post = post;
    this.render();
  }

  get post() {
    return this.#post;
  }

  connectedCallback() {
    // If properties were set before custom element upgrade, re-apply them so setters run.
    this.#upgradeProperty("post");
    this.render();
  }

  render() {
    if (!this.#post) {
      return;
    }

    const tags = (this.#post.tags || []).slice(0, 4).map((tag) => `#${tag}`).join(" ");
    const slug = generateSlug(this.#post.title);
    const postUrl = `../blog/${slug}/`;

    const article = document.createElement("article");
    article.className = "post-card";
    article.dataset.postId = this.#post.id;

    const imageUrl = resolveAssetPath(this.#post.imageUrl || this.#post.featuredImage || "");
    if (imageUrl) {
      const imageLink = document.createElement("a");
      imageLink.href = postUrl;
      imageLink.className = "post-card__image";

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      image.width = 900;
      image.height = 506;

      imageLink.append(image);
      article.append(imageLink);
    }

    const heading = document.createElement("h3");
    const link = document.createElement("a");
    link.href = postUrl;
    link.textContent = this.#post.title;
    heading.append(link);

    const summary = document.createElement("p");
    summary.textContent = this.#post.summary || "";

    const footer = document.createElement("footer");
    const meta = document.createElement("span");
    meta.textContent = `${formatDate(this.#post.publishedAt)} • ${formatReadTime(this.#post.readTimeMinutes)}`;
    const tagList = document.createElement("span");
    tagList.textContent = tags;
    footer.append(meta, tagList);

    const readMore = document.createElement("a");
    readMore.href = postUrl;
    readMore.textContent = "Read more →";
    readMore.className = "post-read-more";

    article.append(heading, summary, footer, readMore);
    this.replaceChildren(article);
  }
}

if (!customElements.get("post-card")) {
  customElements.define("post-card", PostCardElement);
}

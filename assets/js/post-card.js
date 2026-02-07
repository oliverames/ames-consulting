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
    const article = document.createElement("article");
    article.className = "post-card";
    article.dataset.postId = this.#post.id;

    const heading = document.createElement("h3");
    if (this.#post.url) {
      const link = document.createElement("a");
      link.href = this.#post.url;
      link.textContent = this.#post.title;
      heading.append(link);
    } else {
      heading.textContent = this.#post.title;
    }

    const summary = document.createElement("p");
    summary.textContent = this.#post.summary || "";

    const footer = document.createElement("footer");
    const meta = document.createElement("span");
    meta.textContent = `${formatDate(this.#post.publishedAt)} • ${formatReadTime(this.#post.readTimeMinutes)}`;
    const tagList = document.createElement("span");
    tagList.textContent = tags;
    footer.append(meta, tagList);

    const preview = document.createElement("button");
    preview.type = "button";
    preview.dataset.action = "open-dialog";
    preview.textContent = "Preview";

    article.append(heading, summary, footer, preview);
    this.replaceChildren(article);
  }
}

if (!customElements.get("post-card")) {
  customElements.define("post-card", PostCardElement);
}

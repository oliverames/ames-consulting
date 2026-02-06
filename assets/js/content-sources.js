function stripHtml(input) {
  return (input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTags(item = {}) {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.map((tag) => String(tag).toLowerCase());
  }

  const text = `${item.content_text || ""} ${stripHtml(item.content_html || "")}`;
  const matches = text.match(/(^|\s)#([a-z0-9_-]+)/gi) || [];
  return [...new Set(matches.map((m) => m.replace(/^[^#]*#/, "").toLowerCase()))];
}

function normalizeItem(item) {
  const title = item.title || stripHtml(item.content_html || "").slice(0, 84) || "Untitled post";
  const contentHtml = item.content_html || "";
  const summary = item.summary || stripHtml(contentHtml).slice(0, 220);

  return {
    id: String(item.id || item.url || crypto.randomUUID()),
    title,
    summary,
    contentHtml,
    url: item.url || "",
    publishedAt: item.date_published || item.date_modified || new Date().toISOString(),
    tags: extractTags(item),
    source: "microblog"
  };
}

function sortByNewest(posts) {
  return [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export class LocalJsonSource {
  async listPosts() {
    const response = await fetch("/assets/data/content.example.json", { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return sortByNewest(data.posts || []);
  }
}

export class MicroblogJsonFeedSource {
  constructor(url) {
    this.url = url;
  }

  async listPosts() {
    if (!this.url) {
      return [];
    }

    const response = await fetch(this.url, { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    const feed = await response.json();
    const items = Array.isArray(feed.items) ? feed.items : [];
    return sortByNewest(items.map(normalizeItem));
  }
}

export function createSource(config) {
  if (config.provider === "microblog") {
    return new MicroblogJsonFeedSource(config.jsonFeedUrl);
  }

  return new LocalJsonSource();
}

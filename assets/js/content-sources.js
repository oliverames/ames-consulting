function stripHtml(input) {
  return (input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(resource, { timeoutMs = 7000, ...options } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(resource, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithRetry(url, { retries = 2, timeoutMs = 7000, retryDelayMs = 250 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        cache: "no-store",
        timeoutMs
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await delay(retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError || new Error("Unknown fetch failure");
}

function estimateReadTimeMinutes(text, wordsPerMinute = 220) {
  const words = (text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (words === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

function extractTags(item = {}) {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags.map((tag) => String(tag).toLowerCase());
  }

  const text = `${item.content_text || ""} ${stripHtml(item.content_html || "")}`;
  const matches = text.match(/(^|\s)#([a-z0-9_-]+)/gi) || [];
  return [...new Set(matches.map((m) => m.replace(/^[^#]*#/, "").toLowerCase()))];
}

function isLikelyFeedItem(item) {
  if (!item || typeof item !== "object") {
    return false;
  }

  const hasIdentity = Boolean(item.id || item.url);
  const hasContent = Boolean(item.content_text || item.content_html || item.summary || item.title);
  return hasIdentity && hasContent;
}

function normalizeItem(item) {
  const title = item.title || stripHtml(item.content_html || "").slice(0, 84) || "Untitled post";
  const contentHtml = item.content_html || "";
  const summary = item.summary || stripHtml(contentHtml).slice(0, 220);
  const attachmentImage = Array.isArray(item.attachments)
    ? item.attachments.find((attachment) => String(attachment?.mime_type || "").startsWith("image/"))?.url
    : "";

  return {
    id: String(item.id || item.url || crypto.randomUUID()),
    title,
    summary,
    contentHtml,
    url: item.url || "",
    publishedAt: item.date_published || item.date_modified || new Date().toISOString(),
    tags: extractTags(item),
    readTimeMinutes: estimateReadTimeMinutes(
      `${item.content_text || ""} ${stripHtml(contentHtml) || summary}`
    ),
    imageUrl: item.image || item.banner_image || attachmentImage || "",
    source: "microblog"
  };
}

function normalizeLocalPost(item) {
  const title = item.title || "Untitled post";
  const contentHtml = item.contentHtml || "";
  const summary = item.summary || stripHtml(contentHtml).slice(0, 220);
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];

  return {
    id: String(item.id || item.url || crypto.randomUUID()),
    title,
    summary,
    contentHtml,
    url: item.url || "",
    publishedAt: item.publishedAt || new Date().toISOString(),
    tags,
    readTimeMinutes:
      Number.isFinite(item.readTimeMinutes) && item.readTimeMinutes > 0
        ? Math.ceil(item.readTimeMinutes)
        : estimateReadTimeMinutes(`${stripHtml(contentHtml)} ${summary}`),
    imageUrl: item.imageUrl || "",
    source: item.source || "local"
  };
}

function sortByNewest(posts) {
  return [...posts].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export class LocalJsonSource {
  constructor({ preferAiSummaries = true } = {}) {
    this.preferAiSummaries = preferAiSummaries;
  }

  async listPosts() {
    let data;

    // Try AI-enhanced summaries first if preferred
    if (this.preferAiSummaries) {
      try {
        const aiDataUrl = new URL("../data/posts-with-ai-summaries.json", import.meta.url);
        data = await fetchJsonWithRetry(aiDataUrl, {
          retries: 0,
          timeoutMs: 3000
        });
        console.log("✓ Using AI-enhanced summaries");
      } catch {
        // Fall through to regular content
      }
    }

    // Fallback to example content
    if (!data) {
      try {
        const localDataUrl = new URL("../data/content.example.json", import.meta.url);
        data = await fetchJsonWithRetry(localDataUrl, {
          retries: 1,
          timeoutMs: 5000
        });
      } catch {
        return [];
      }
    }

    return sortByNewest((data.posts || []).map(normalizeLocalPost));
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

    let feed;

    try {
      feed = await fetchJsonWithRetry(this.url, {
        retries: 2,
        timeoutMs: 8000,
        retryDelayMs: 300
      });
    } catch {
      return [];
    }

    const items = Array.isArray(feed?.items) ? feed.items.filter(isLikelyFeedItem) : [];
    return sortByNewest(items.map(normalizeItem));
  }
}

export function createSource(config) {
  if (config.provider === "microblog") {
    return new MicroblogJsonFeedSource(config.jsonFeedUrl);
  }

  return new LocalJsonSource();
}

#!/usr/bin/env node

/**
 * Pre-render <post-card> elements into blog/index.html so first paint
 * matches the JS-hydrated state. Eliminates the layout shift caused by
 * the empty stream growing once app.js finishes its async post fetch.
 *
 * Idempotent: replaces content between BLOG_CARDS_START / BLOG_CARDS_END
 * sentinel comments. Run on every deploy and before Lighthouse CI.
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const START_MARKER = "<!-- BLOG_CARDS_START -->";
const END_MARKER = "<!-- BLOG_CARDS_END -->";

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatReadTime(minutes) {
  const normalized = Number.isFinite(minutes) && minutes > 0 ? Math.ceil(minutes) : 1;
  return `${normalized} min read`;
}

// Mirrors post-card.js resolveAssetPath() for a page at /blog/ (depth=1).
function resolveAssetPath(url) {
  if (!url) {
    return "";
  }
  const normalized = String(url).replace(/^\.\//, "");
  if (!normalized.startsWith("assets/")) {
    return url;
  }
  return `../${normalized}`;
}

async function loadPosts() {
  try {
    const aiPath = join(projectRoot, "assets/data/posts-with-ai-summaries.json");
    const content = await readFile(aiPath, "utf-8");
    const data = JSON.parse(content);
    console.log("✓ Loaded posts from AI summaries file");
    return data.posts || [];
  } catch {
    console.log("⚠️  AI summaries not found, falling back to example content");
  }
  const examplePath = join(projectRoot, "assets/data/content.example.json");
  const content = await readFile(examplePath, "utf-8");
  const data = JSON.parse(content);
  console.log("✓ Loaded posts from example content");
  return data.posts || [];
}

function renderCard(post) {
  const slug = generateSlug(post.title);
  const postUrl = `../blog/${slug}/`;
  const rawImage = post.imageUrl || post.featuredImage || "";
  const imageUrl = rawImage ? resolveAssetPath(rawImage) : "";
  const tags = (post.tags || []).slice(0, 4).map((tag) => `#${tag}`).join(" ");
  const meta = `${formatDate(post.publishedAt)} • ${formatReadTime(post.readTimeMinutes)}`;

  const imageHtml = imageUrl
    ? `\n            <a href="${escapeHtml(postUrl)}" class="post-card__image" aria-label="${escapeHtml(post.title)}"><img src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async" width="900" height="506"></a>`
    : "";

  return `        <post-card>
          <article class="post-card" data-post-id="${escapeHtml(post.id)}">${imageHtml}
            <h3><a href="${escapeHtml(postUrl)}">${escapeHtml(post.title)}</a></h3>
            <p>${escapeHtml(post.summary || "")}</p>
            <footer>
              <span>${escapeHtml(meta)}</span>
              <span>${escapeHtml(tags)}</span>
            </footer>
            <a href="${escapeHtml(postUrl)}" class="post-read-more">Read more →</a>
          </article>
        </post-card>`;
}

async function main() {
  console.log("📝 Generating static blog index cards...\n");

  const posts = await loadPosts();
  if (posts.length === 0) {
    console.error("❌ No posts found");
    process.exit(1);
  }

  // Match the runtime filter in app.js: blog view shows non-portfolio posts
  // (the work view filters by portfolio tag).
  const blogPosts = posts.filter((post) => {
    const tags = (post.tags || []).map((tag) => tag.toLowerCase());
    return !tags.includes("portfolio");
  });

  console.log(`Rendering ${blogPosts.length} cards into blog/index.html\n`);

  const cards = blogPosts.map(renderCard).join("\n");
  const replacement = `${START_MARKER}\n${cards}\n        ${END_MARKER}`;

  const indexPath = join(projectRoot, "blog/index.html");
  const html = await readFile(indexPath, "utf-8");

  if (!html.includes(START_MARKER) || !html.includes(END_MARKER)) {
    console.error(`❌ Sentinels missing in blog/index.html: expected ${START_MARKER} … ${END_MARKER}`);
    process.exit(1);
  }

  const pattern = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}`);
  const updated = html.replace(pattern, replacement);

  await writeFile(indexPath, updated, "utf-8");
  console.log(`✅ Updated blog/index.html with ${blogPosts.length} pre-rendered cards`);
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

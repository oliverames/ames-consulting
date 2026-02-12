#!/usr/bin/env node

/**
 * Generate individual blog post pages from template
 * Usage: node scripts/generate-blog-posts.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

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
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function generateTagsHtml(tags) {
  if (!tags || tags.length === 0) {
    return "";
  }

  const tagItems = tags
    .map((tag) => `<li><a href="../../blog/?tag=${encodeURIComponent(tag)}">${tag}</a></li>`)
    .join("\n          ");

  return `
      <footer class="project-tags">
        <h3>Tags</h3>
        <ul>
          ${tagItems}
        </ul>
      </footer>`;
}

async function loadPosts() {
  // Try AI summaries first
  try {
    const aiPath = join(projectRoot, "assets/data/posts-with-ai-summaries.json");
    const content = await readFile(aiPath, "utf-8");
    const data = JSON.parse(content);
    console.log("✓ Loaded posts from AI summaries file");
    return data.posts || [];
  } catch (error) {
    console.log("⚠️  AI summaries not found, trying fallback...");
  }

  // Fallback to example content
  try {
    const examplePath = join(projectRoot, "assets/data/content.example.json");
    const content = await readFile(examplePath, "utf-8");
    const data = JSON.parse(content);
    console.log("✓ Loaded posts from example content");
    return data.posts || [];
  } catch (error) {
    console.error("❌ Failed to load posts:", error.message);
    return [];
  }
}

async function generateBlogPost(post, template) {
  const slug = generateSlug(post.title);
  const formattedDate = formatDate(post.publishedAt);
  const tagsHtml = generateTagsHtml(post.tags);
  const readTime = post.readTimeMinutes
    ? `${post.readTimeMinutes} min read`
    : "1 min read";

  // Replace template placeholders
  let html = template
    .replace(/\{\{TITLE\}\}/g, post.title)
    .replace(/\{\{SUMMARY\}\}/g, post.summary || "")
    .replace(/\{\{SLUG\}\}/g, slug)
    .replace(/\{\{PUBLISHED_AT\}\}/g, post.publishedAt)
    .replace(/\{\{PUBLISHED_AT_FORMATTED\}\}/g, formattedDate)
    .replace(/\{\{CONTENT_HTML\}\}/g, post.contentHtml || "")
    .replace(/\{\{TAGS_HTML\}\}/g, tagsHtml)
    .replace(/\{\{READ_TIME\}\}/g, readTime);

  // Create directory
  const postDir = join(projectRoot, "blog", slug);
  await mkdir(postDir, { recursive: true });

  // Write HTML file
  const outputPath = join(postDir, "index.html");
  await writeFile(outputPath, html, "utf-8");

  console.log(`✓ Generated: blog/${slug}/`);
  return slug;
}

async function main() {
  console.log("📝 Generating blog post pages...\n");

  // Load template
  const templatePath = join(projectRoot, "templates/post-template.html");
  const template = await readFile(templatePath, "utf-8");

  // Load posts
  const posts = await loadPosts();

  if (posts.length === 0) {
    console.error("❌ No posts found to generate");
    process.exit(1);
  }

  console.log(`Found ${posts.length} posts\n`);

  // Filter out portfolio items
  const blogPosts = posts.filter((post) => {
    const tags = (post.tags || []).map((t) => t.toLowerCase());
    return !tags.includes("portfolio");
  });

  console.log(`Generating ${blogPosts.length} blog post pages...\n`);

  // Generate each post
  const slugs = [];
  for (const post of blogPosts) {
    const slug = await generateBlogPost(post, template);
    slugs.push(slug);
  }

  console.log(`\n✅ Generated ${slugs.length} blog post pages`);
  console.log("\nGenerated slugs:");
  slugs.forEach((slug) => console.log(`  - blog/${slug}/`));
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

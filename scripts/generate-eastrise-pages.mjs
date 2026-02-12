import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Generate individual HTML pages for EastRise blog posts
 * Creates work/eastrise-writing/{slug}/index.html for each post
 */

const TEMPLATE_PATH = "templates/eastrise-blog-post.html";
const DATA_PATH = "assets/data/eastrise-blogs.json";
const OUTPUT_DIR = "work/eastrise-writing";

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generatePages() {
  console.log("Reading template and data...");
  const template = readFileSync(TEMPLATE_PATH, "utf-8");
  const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

  console.log(`Generating ${data.posts.length} blog post pages...`);

  let generated = 0;
  for (const post of data.posts) {
    const outputPath = join(OUTPUT_DIR, post.slug, "index.html");

    // Create directory if it doesn't exist
    mkdirSync(join(OUTPUT_DIR, post.slug), { recursive: true });

    // Build categories HTML
    const categoriesHtml = post.categories.length
      ? `<span class="categories">${post.categories.map((cat) => `#${cat.toLowerCase().replace(/\s+/g, "-")}`).join(" ")}</span>`
      : "";

    // Build featured image HTML (pull from eastrise.com)
    const featuredImageHtml = post.featuredImage
      ? `<figure class="post-featured-image">
          <img src="${post.featuredImage}" alt="${post.title}" width="1200" height="675" loading="eager">
        </figure>`
      : "";

    // Build Open Graph image tags
    const featuredImageOg = post.featuredImage
      ? `<meta property="og:image" content="${post.featuredImage}">`
      : "";

    const featuredImageTwitter = post.featuredImage
      ? `<meta name="twitter:image" content="${post.featuredImage}">`
      : "";

    // Replace placeholders
    const html = template
      .replace(/{{TITLE}}/g, post.title)
      .replace(/{{SLUG}}/g, post.slug)
      .replace(/{{EXCERPT}}/g, post.excerpt)
      .replace(/{{PUBLISHED_DATE}}/g, post.publishedAt.split("T")[0])
      .replace(/{{PUBLISHED_DATE_FORMATTED}}/g, formatDate(post.publishedAt))
      .replace(/{{CATEGORIES}}/g, categoriesHtml)
      .replace(/{{CONTENT}}/g, post.content)
      .replace(/{{ORIGINAL_URL}}/g, post.originalUrl)
      .replace(/{{FEATURED_IMAGE_HTML}}/g, featuredImageHtml)
      .replace(/{{FEATURED_IMAGE_OG}}/g, featuredImageOg)
      .replace(/{{FEATURED_IMAGE_TWITTER}}/g, featuredImageTwitter);

    writeFileSync(outputPath, html);
    generated++;
  }

  console.log(`✓ Generated ${generated} pages in ${OUTPUT_DIR}/`);
}

generatePages();

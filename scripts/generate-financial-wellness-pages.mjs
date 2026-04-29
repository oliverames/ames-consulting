import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

/**
 * Generate individual HTML pages for Financial Wellness blog posts
 * Creates work/financial-wellness-library/{slug}/index.html for each post
 */

const TEMPLATE_PATH = "templates/financial-wellness-post.html";
const DATA_PATH = "assets/data/financial-wellness-posts.json";
const OUTPUT_DIR = "work/financial-wellness-library";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
};

function htmlEscape(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

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

    mkdirSync(join(OUTPUT_DIR, post.slug), { recursive: true });

    // Slugified category labels are pre-sanitized; the surrounding span is static.
    const categoriesHtml = post.categories.length
      ? `<span class="categories">${post.categories.map((cat) => `#${htmlEscape(cat).toLowerCase().replace(/\s+/g, "-")}`).join(" ")}</span>`
      : "";

    const safeTitle = htmlEscape(post.title);
    const safeFeaturedImage = htmlEscape(post.featuredImage);

    const featuredImageHtml = post.featuredImage
      ? `<figure class="post-featured-image">
          <img src="${safeFeaturedImage}" alt="${safeTitle}" width="1200" height="675" loading="eager">
        </figure>`
      : "";

    const featuredImageOg = post.featuredImage
      ? `<meta property="og:image" content="${safeFeaturedImage}">`
      : "";

    const featuredImageTwitter = post.featuredImage
      ? `<meta name="twitter:image" content="${safeFeaturedImage}">`
      : "";

    // post.content is pre-rendered trusted HTML and is intentionally not escaped.
    const html = template
      .replace(/{{TITLE}}/g, safeTitle)
      .replace(/{{SLUG}}/g, htmlEscape(post.slug))
      .replace(/{{EXCERPT}}/g, htmlEscape(post.excerpt))
      .replace(/{{PUBLISHED_DATE}}/g, htmlEscape(post.publishedAt.split("T")[0]))
      .replace(/{{PUBLISHED_DATE_FORMATTED}}/g, htmlEscape(formatDate(post.publishedAt)))
      .replace(/{{CATEGORIES}}/g, categoriesHtml)
      .replace(/{{CONTENT}}/g, post.content)
      .replace(/{{ORIGINAL_URL}}/g, htmlEscape(post.originalUrl))
      .replace(/{{FEATURED_IMAGE_HTML}}/g, featuredImageHtml)
      .replace(/{{FEATURED_IMAGE_OG}}/g, featuredImageOg)
      .replace(/{{FEATURED_IMAGE_TWITTER}}/g, featuredImageTwitter);

    writeFileSync(outputPath, html);
    generated++;
  }

  console.log(`✓ Generated ${generated} pages in ${OUTPUT_DIR}/`);
}

generatePages();

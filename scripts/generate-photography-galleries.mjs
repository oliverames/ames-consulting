#!/usr/bin/env node

/**
 * Generate individual photography gallery pages from template
 * Usage: node scripts/generate-photography-galleries.mjs
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function generateImagesHtml(images, gallerySlug) {
  return images
    .map((img) => {
      // Use relative path from photography/{slug}/ to assets/
      const imagePath = `../../assets/images/photography/${gallerySlug}/${img.filename}`;
      return `          <figure class="gallery-image">
            <img src="${imagePath}" alt="${img.alt}" width="${img.width}" height="${img.height}" loading="lazy">
          </figure>`;
    })
    .join("\n");
}

async function loadGalleries() {
  try {
    const dataPath = join(projectRoot, "assets/data/photography.json");
    const content = await readFile(dataPath, "utf-8");
    const data = JSON.parse(content);
    console.log("✓ Loaded photography galleries");
    return data.galleries || [];
  } catch (error) {
    console.error("❌ Failed to load photography galleries:", error.message);
    return [];
  }
}

async function generateGalleryPage(gallery, template) {
  const formattedDate = formatDate(gallery.date);
  const imagesHtml = generateImagesHtml(gallery.images, gallery.slug);

  // Replace template placeholders
  let html = template
    .replace(/\{\{TITLE\}\}/g, gallery.title)
    .replace(/\{\{DESCRIPTION\}\}/g, gallery.description)
    .replace(/\{\{SLUG\}\}/g, gallery.slug)
    .replace(/\{\{DATE\}\}/g, gallery.date)
    .replace(/\{\{DATE_FORMATTED\}\}/g, formattedDate)
    .replace(/\{\{COVER_IMAGE\}\}/g, gallery.coverImage)
    .replace(/\{\{IMAGES_HTML\}\}/g, imagesHtml);

  // Create directory
  const galleryDir = join(projectRoot, "photography", gallery.slug);
  await mkdir(galleryDir, { recursive: true });

  // Write HTML file
  const outputPath = join(galleryDir, "index.html");
  await writeFile(outputPath, html, "utf-8");

  console.log(`✓ Generated: photography/${gallery.slug}/`);
  return gallery.slug;
}

async function main() {
  console.log("📸 Generating photography gallery pages...\n");

  // Load template
  const templatePath = join(projectRoot, "templates/gallery-template.html");
  const template = await readFile(templatePath, "utf-8");

  // Load galleries
  const galleries = await loadGalleries();

  if (galleries.length === 0) {
    console.error("❌ No galleries found to generate");
    process.exit(1);
  }

  console.log(`Found ${galleries.length} galleries\n`);

  // Generate each gallery
  const slugs = [];
  for (const gallery of galleries) {
    const slug = await generateGalleryPage(gallery, template);
    slugs.push(slug);
  }

  console.log(`\n✅ Generated ${slugs.length} gallery pages`);
  console.log("\nGenerated slugs:");
  slugs.forEach((slug) => console.log(`  - photography/${slug}/`));
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

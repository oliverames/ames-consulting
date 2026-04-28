#!/usr/bin/env node

/**
 * Process Lab Open House photos:
 * - Resize to web-friendly dimensions (max 1200px width)
 * - Convert to WebP format for better compression
 * - Extract metadata and generate gallery configuration
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SOURCE_DIR = "/Users/demo-profile/My Drive/Innovation Lab /Career Day Project/Project 352 - LinkedIn Content/352 LinkedIn Posts Photos";
const OUTPUT_DIR = "assets/images/photography/lab-open-house-2026";

// Check if ImageMagick is installed
try {
  await execFileAsync("which", ["magick"]);
} catch {
  console.error("❌ ImageMagick not found. Install with: brew install imagemagick");
  process.exit(1);
}

async function processPhotos() {
  console.log("📸 Processing Lab Open House photos...\n");

  const files = await readdir(SOURCE_DIR);
  const jpgFiles = files
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort()
    .slice(0, 12); // Take first 12 photos for the gallery

  console.log(`Found ${jpgFiles.length} photos to process\n`);

  const metadata = [];

  for (let i = 0; i < jpgFiles.length; i++) {
    const filename = jpgFiles[i];
    const sourcePath = join(SOURCE_DIR, filename);
    const outputFilename = `lab-${String(i + 1).padStart(2, "0")}.webp`;
    const outputPath = join(OUTPUT_DIR, outputFilename);

    console.log(`Processing ${i + 1}/${jpgFiles.length}: ${filename}`);

    try {
      // Resize to max 1200px wide, convert to WebP, quality 85
      await execFileAsync("magick", [
        sourcePath,
        "-resize", "1200>",
        "-quality", "85",
        outputPath
      ]);

      // Get dimensions
      const { stdout } = await execFileAsync("magick", [
        "identify",
        "-format", "%w %h",
        outputPath
      ]);

      const [width, height] = stdout.trim().split(" ").map(Number);

      metadata.push({
        filename: outputFilename,
        originalName: filename,
        width,
        height,
        alt: `Innovation Lab Open House - Photo ${i + 1}`
      });
    } catch (error) {
      console.error(`Failed to process ${filename}:`, error.message);
    }
  }

  console.log(`\n✅ Processed ${metadata.length} photos`);
  console.log("\n📋 Gallery metadata:");
  console.log(JSON.stringify(metadata, null, 2));
}

processPhotos().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

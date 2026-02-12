#!/usr/bin/env node

/**
 * Analyze a photo folder and suggest shoot groupings
 * Usage: node scripts/analyze-photo-folder.mjs <folder-path>
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const folderPath = process.argv[2];

if (!folderPath) {
  console.error("Usage: node scripts/analyze-photo-folder.mjs <folder-path>");
  process.exit(1);
}

async function analyzeFolder(path) {
  try {
    const files = await readdir(path);
    const imageFiles = files.filter((f) =>
      /\.(jpg|jpeg|png|heic)$/i.test(f)
    );

    console.log(`\n📸 Found ${imageFiles.length} images in folder\n`);

    // Get file stats
    const fileStats = await Promise.all(
      imageFiles.map(async (filename) => {
        const stats = await stat(join(path, filename));
        return {
          filename,
          mtime: stats.mtime,
          size: stats.size
        };
      })
    );

    // Sort by modification time
    fileStats.sort((a, b) => a.mtime - b.mtime);

    // Group by date
    const byDate = new Map();
    fileStats.forEach((file) => {
      const dateKey = file.mtime.toISOString().split("T")[0];
      if (!byDate.has(dateKey)) {
        byDate.set(dateKey, []);
      }
      byDate.get(dateKey).push(file);
    });

    console.log("📅 Images by Date:");
    console.log("─".repeat(60));
    for (const [date, files] of byDate) {
      console.log(`\n${date}: ${files.length} images`);
      console.log(`  First: ${files[0].filename}`);
      console.log(`  Last: ${files[files.length - 1].filename}`);
    }

    // Suggest groupings (split into roughly equal thirds)
    const thirdSize = Math.ceil(fileStats.length / 3);
    console.log(`\n\n💡 Suggested 3-shoot grouping (${thirdSize} images each):`);
    console.log("─".repeat(60));

    const shoots = [
      { name: "Shoot 1", files: fileStats.slice(0, thirdSize) },
      { name: "Shoot 2", files: fileStats.slice(thirdSize, thirdSize * 2) },
      { name: "Shoot 3", files: fileStats.slice(thirdSize * 2) }
    ];

    shoots.forEach((shoot) => {
      console.log(`\n${shoot.name}:`);
      console.log(`  Count: ${shoot.files.length} images`);
      console.log(`  Range: ${shoot.files[0].filename} to ${shoot.files[shoot.files.length - 1].filename}`);
      console.log(`  Dates: ${shoot.files[0].mtime.toLocaleDateString()} to ${shoot.files[shoot.files.length - 1].mtime.toLocaleDateString()}`);
    });

    console.log("\n");
  } catch (error) {
    console.error("Error analyzing folder:", error.message);
    process.exit(1);
  }
}

analyzeFolder(folderPath);

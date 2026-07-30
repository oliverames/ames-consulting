#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "assets/data/eastrise-social.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

for (const post of manifest.posts) {
  const imagePath = path.join(root, post.screenshot);
  const dimensions = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", imagePath])).stdout
    .trim()
    .split(" ")
    .map(Number);
  [post.width, post.height] = dimensions;
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Updated dimensions for ${manifest.posts.length} social captures.`);

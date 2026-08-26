#!/usr/bin/env node

// Injects intrinsic width/height attributes into <img> tags that lack them so
// every page reserves layout space before images load (CLS prevention).
// Runs after the generators in build:site, so generated markup does not need
// to carry dimensions itself. Idempotent: tags that already have both
// attributes are left untouched.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { imageDimensions } from "./image-dimensions.mjs";

const root = new URL("../", import.meta.url).pathname;

// Keep in sync with apply-shared-ui.mjs, apply-seo.mjs, and
// validate-structured-data.mjs.
const EXCLUDED_DIRS = new Set(["node_modules", "_site", ".git", "playwright-report", "test-results", "output"]);

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name)) {
      files.push(...await collectHtml(path));
    }
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

let patched = 0;
const unresolved = [];

for (const file of await collectHtml(root)) {
  const html = await readFile(file, "utf8");
  let changed = false;
  const pieces = [];
  let cursor = 0;
  for (const match of html.matchAll(/<img\b[^>]*?>/gs)) {
    const tag = match[0];
    if (/\bwidth="/.test(tag) && /\bheight="/.test(tag)) continue;
    const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
    if (!src || /^(?:https?:|data:)/.test(src)) continue;
    const assetPath = join(dirname(file), src.split("?")[0]);
    let dims = null;
    try {
      dims = await imageDimensions(assetPath);
    } catch {
      // fall through to unresolved
    }
    if (!dims) {
      unresolved.push(`${relative(root, file).split(sep).join("/")} -> ${src}`);
      continue;
    }
    const attrs = ` width="${dims.width}" height="${dims.height}"`;
    const updated = tag.endsWith("/>") ? `${tag.slice(0, -2)}${attrs}/>` : `${tag.slice(0, -1)}${attrs}>`;
    pieces.push(html.slice(cursor, match.index), updated);
    cursor = match.index + tag.length;
    changed = true;
    patched += 1;
  }
  if (changed) {
    pieces.push(html.slice(cursor));
    await writeFile(file, pieces.join(""));
  }
}

console.log(`apply-image-dimensions: added dimensions to ${patched} image${patched === 1 ? "" : "s"}`);
if (unresolved.length > 0) {
  console.error(`apply-image-dimensions: ${unresolved.length} image(s) could not be measured:`);
  for (const entry of unresolved) console.error(`  ${entry}`);
  process.exitCode = 1;
}

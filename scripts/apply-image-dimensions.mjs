#!/usr/bin/env node

// Injects intrinsic width/height attributes into <img> tags that lack them so
// every page reserves layout space before images load (CLS prevention).
// Runs after the generators in build:site, so generated markup does not need
// to carry dimensions itself. Idempotent: tags that already have both
// attributes are left untouched.

import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

const root = new URL("../", import.meta.url).pathname;

function webpDimensions(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") return null;
  const format = buffer.toString("ascii", 12, 16);
  if (format === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (format === "VP8 ") {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (format === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    return { width, height };
  }
  return null;
}

function pngDimensions(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const size = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + size;
  }
  return null;
}

function svgDimensions(text) {
  const open = text.match(/<svg\b[^>]*>/);
  if (!open) return null;
  const attr = (name) => {
    const match = open[0].match(new RegExp(`\\b${name}="([0-9.]+)(?:px)?"`));
    return match ? Math.round(Number(match[1])) : null;
  };
  const width = attr("width");
  const height = attr("height");
  if (width && height) return { width, height };
  const viewBox = open[0].match(/\bviewBox="[0-9.\s-]*?([0-9.]+)\s+([0-9.]+)"/);
  if (viewBox) return { width: Math.round(Number(viewBox[1])), height: Math.round(Number(viewBox[2])) };
  return null;
}

async function imageDimensions(path) {
  const buffer = await readFile(path);
  if (path.endsWith(".svg")) return svgDimensions(buffer.toString("utf8"));
  return webpDimensions(buffer) ?? pngDimensions(buffer) ?? jpegDimensions(buffer);
}

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

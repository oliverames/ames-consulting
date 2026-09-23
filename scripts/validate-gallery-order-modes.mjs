#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_HTML_FILES } from "./publication-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const errors = [];
const allowedModes = new Set(["chronological", "editorial", "reverse-chronological"]);
const galleries = [];

function attribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] || "";
}

async function readPublicHtml(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

for (const relativePath of PUBLIC_HTML_FILES) {
  const html = await readPublicHtml(relativePath);
  for (const match of html.matchAll(/<[^>]+\sdata-gallery="([^"]+)"[^>]*>/g)) {
    const tag = match[0];
    const mode = attribute(tag, "data-order-mode");
    galleries.push({ relativePath, id: match[1], mode, tag });
    if (!mode) errors.push(`${relativePath} gallery ${match[1]} lacks data-order-mode.`);
    else if (!allowedModes.has(mode)) errors.push(`${relativePath} gallery ${match[1]} has unsupported order mode ${mode}.`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated declared order modes for ${galleries.length} public gallery containers.`);
}

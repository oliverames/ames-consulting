#!/usr/bin/env node

import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const outputDir = process.cwd();
const assetDirectory = join(outputDir, "assets", "images");
const assetOrigin =
  "https://assets.ames.consulting/ames-consulting/assets/images/";
const textExtensions = new Set([".css", ".html", ".js", ".json", ".xml"]);
const localAssetPattern =
  /(?:https:\/\/ames\.consulting\/|(?:\.\.\/)+|\.\/|\/)?assets\/images\//g;

async function listTextFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTextFiles(path)));
    } else if (textExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

let replacementCount = 0;
for (const file of await listTextFiles(outputDir)) {
  const source = await readFile(file, "utf8");
  const rewritten = source.replace(localAssetPattern, () => {
    replacementCount += 1;
    return assetOrigin;
  });
  if (rewritten !== source) {
    await writeFile(file, rewritten);
  }
}

if (replacementCount === 0) {
  throw new Error("The production build contained no website image references to rewrite.");
}

await rm(assetDirectory, { recursive: true, force: true });
console.log(`Rewrote ${replacementCount} image references to ${assetOrigin}`);

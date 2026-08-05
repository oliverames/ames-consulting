#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(root, "_site");
const allowedDataFiles = new Set(["site.config.json"]);
const noindexPattern = /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else files.push(filePath);
  }
  return files;
}

function resolveLocalReference(htmlPath, reference) {
  if (/^(?:data:|mailto:|tel:|https?:|#)/i.test(reference)) return null;
  const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!clean) return null;
  return clean.startsWith("/")
    ? path.join(siteRoot, clean)
    : path.resolve(path.dirname(htmlPath), clean);
}

const files = await listFiles(siteRoot);
const htmlFiles = files.filter((filePath) => filePath.endsWith(".html"));
const dataFiles = files
  .filter((filePath) => path.dirname(filePath) === path.join(siteRoot, "assets/data"))
  .map((filePath) => path.basename(filePath));
const unexpectedData = dataFiles.filter((filename) => !allowedDataFiles.has(filename));
if (unexpectedData.length) {
  throw new Error(`Non-runtime data published in _site/assets/data: ${unexpectedData.join(", ")}`);
}
for (const filename of allowedDataFiles) {
  if (!dataFiles.includes(filename)) throw new Error(`Missing runtime data file: ${filename}`);
}

const missingAssets = [];
let responsiveImages = 0;
for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  const relativePath = path.relative(siteRoot, htmlPath);
  if (relativePath !== "404.html" && noindexPattern.test(html)) {
    throw new Error(`Noindex route was published: ${relativePath}`);
  }
  if (/\/Users\/|captured_from|assets\.ames\.consulting/i.test(html)) {
    throw new Error(`Private or retired publication reference found in ${relativePath}.`);
  }

  for (const tag of html.match(/<(?:img|script|link)\b[^>]*>/gi) || []) {
    const reference = tag.match(/\b(?:src|href)="([^"]+)"/i)?.[1];
    const localPath = reference ? resolveLocalReference(htmlPath, reference) : null;
    if (localPath && !await stat(localPath).then(() => true, () => false)) {
      missingAssets.push(`${relativePath}: ${reference}`);
    }

    if (!/^<img/i.test(tag)) continue;
    const width = Number(tag.match(/\bwidth="(\d+)"/i)?.[1] || 0);
    if (width > 704 && /\bsrc="[^"]+\.(?:jpe?g|png|webp)(?:[?#][^"]*)?"/i.test(tag)) {
      if (!/\bsrcset="[^"]+"/i.test(tag)) {
        throw new Error(`Large image lacks a responsive srcset in ${relativePath}.`);
      }
      responsiveImages += 1;
    }

    const srcset = tag.match(/\bsrcset="([^"]+)"/i)?.[1];
    for (const candidate of srcset?.split(",") || []) {
      const candidateUrl = candidate.trim().split(/\s+/, 1)[0];
      const candidatePath = resolveLocalReference(htmlPath, candidateUrl);
      if (candidatePath && !await stat(candidatePath).then(() => true, () => false)) {
        missingAssets.push(`${relativePath}: ${candidateUrl}`);
      }
    }
  }
}
if (missingAssets.length) {
  throw new Error(`Built site has missing local assets:\n${missingAssets.slice(0, 20).join("\n")}`);
}

const sitemap = await readFile(path.join(siteRoot, "sitemap.xml"), "utf8");
const lastModified = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
if (!lastModified.length || lastModified.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
  throw new Error("Sitemap lastmod values must use stable YYYY-MM-DD dates.");
}

const artifactBytes = (await Promise.all(files.map((filePath) => stat(filePath)))).reduce(
  (total, fileStat) => total + fileStat.size,
  0,
);
console.log(
  `Validated ${htmlFiles.length} published HTML files, ${responsiveImages} responsive image uses, and ${(artifactBytes / 1024 / 1024).toFixed(1)} MiB of artifact data.`,
);

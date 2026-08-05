#!/usr/bin/env node

import { cpus } from "node:os";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--out-dir") {
      parsed.outDir = argv[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function listHtmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtmlFiles(filePath));
    else if (entry.name.endsWith(".html")) files.push(filePath);
  }
  return files;
}

function resolveImagePath(outDir, htmlPath, source) {
  if (source.startsWith("data:")) return null;
  if (/^https?:\/\//i.test(source)) {
    const url = new URL(source);
    if (!/^(?:www\.)?ames\.consulting$/i.test(url.hostname)) return null;
    return path.join(outDir, decodeURIComponent(url.pathname));
  }
  const cleanSource = decodeURIComponent(source.split(/[?#]/, 1)[0]);
  return cleanSource.startsWith("/")
    ? path.join(outDir, cleanSource)
    : path.resolve(path.dirname(htmlPath), cleanSource);
}

function variantSource(source, width) {
  const [withoutFragment, fragment = ""] = source.split("#", 2);
  const [pathname, query = ""] = withoutFragment.split("?", 2);
  const extension = path.extname(pathname);
  const variant = `${pathname.slice(0, -extension.length)}-${width}w.webp`;
  return `${variant}${query ? `?${query}` : ""}${fragment ? `#${fragment}` : ""}`;
}

function variantPath(originalPath, width) {
  const extension = path.extname(originalPath);
  return `${originalPath.slice(0, -extension.length)}-${width}w.webp`;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.outDir || "_site");
const imagesRoot = path.join(outDir, "assets/images");
const requestedWidths = [640, 960, 1440];
const htmlFiles = await listHtmlFiles(outDir);
const jobs = new Map();
const htmlUpdates = new Map();

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)];
  for (const match of tags) {
    if (/\bsrcset\s*=/i.test(match[0])) continue;
    const source = match[0].match(/\bsrc="([^"]+)"/i)?.[1];
    if (!source || !/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(source)) continue;
    const imagePath = resolveImagePath(outDir, htmlPath, source);
    if (!imagePath || !imagePath.startsWith(`${imagesRoot}${path.sep}`)) continue;
    if (!jobs.has(imagePath)) jobs.set(imagePath, { imagePath, references: [] });
    jobs.get(imagePath).references.push({ htmlPath, source, tag: match[0] });
  }
}

sharp.concurrency(Math.max(1, Math.min(4, cpus().length)));
let variantCount = 0;
let sourceBytes = 0;
let responsiveBytes = 0;

const queue = [...jobs.values()];
const worker = async () => {
  while (queue.length) {
    const job = queue.shift();
    const input = await readFile(job.imagePath);
    const metadata = await sharp(input).metadata();
    if (!metadata.width) continue;
    sourceBytes += input.byteLength;
    const widths = requestedWidths.filter((width) => metadata.width > width * 1.1);
    if (!widths.length) continue;

    const entries = [];
    for (const width of widths) {
      const destination = variantPath(job.imagePath, width);
      const info = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toFile(destination);
      entries.push({ width, bytes: info.size });
      responsiveBytes += info.size;
      variantCount += 1;
    }

    for (const reference of job.references) {
      const srcset = [
        ...entries.map(({ width }) => `${variantSource(reference.source, width)} ${width}w`),
        `${reference.source} ${metadata.width}w`,
      ].join(", ");
      const replacement = reference.tag.replace(
        /\s*(\/?)>$/,
        (_, slash) => ` srcset="${srcset}"${slash}>`,
      );
      if (!htmlUpdates.has(reference.htmlPath)) htmlUpdates.set(reference.htmlPath, []);
      htmlUpdates.get(reference.htmlPath).push([reference.tag, replacement]);
    }
  }
};

await Promise.all(Array.from({ length: Math.min(4, queue.length || 1) }, worker));

for (const [htmlPath, replacements] of htmlUpdates) {
  let html = await readFile(htmlPath, "utf8");
  for (const [before, after] of replacements) html = html.replace(before, after);
  await writeFile(htmlPath, html, "utf8");
}

const mib = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(
  `Generated ${variantCount} responsive image variants (${mib(responsiveBytes)} MiB) from ${jobs.size} referenced images (${mib(sourceBytes)} MiB).`,
);

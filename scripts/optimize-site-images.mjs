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

const imageProfiles = {
  thumbnail: {
    widths: [320, 480, 640, 720],
    sizes: "(max-width: 53.57rem) 15rem, (max-width: 75rem) 28vw, 21rem",
  },
  card: {
    widths: [320, 480, 512, 720, 960, 1024, 1440, 1600],
    sizes: "(max-width: 48rem) calc(100vw - 5rem), (max-width: 75rem) calc(46vw - 3rem), 31.5rem",
  },
  quarter: {
    widths: [240, 320, 480, 640, 800, 1200],
    sizes: "(max-width: 52rem) calc(50vw - 2rem), (max-width: 75rem) calc(23vw - 1.5rem), 16rem",
  },
  third: {
    widths: [320, 360, 480, 640, 800, 960, 1200],
    sizes: "(max-width: 52rem) calc(50vw - 2rem), (max-width: 75rem) calc(31vw - 1.5rem), 21rem",
  },
  half: {
    widths: [400, 560, 720, 960, 1120, 1440, 1600],
    sizes: "(max-width: 48rem) calc(100vw - 3rem), (max-width: 75rem) calc(46vw - 2rem), 32rem",
  },
  portrait: {
    widths: [320, 480, 640, 800, 960],
    sizes: "(max-width: 52rem) calc(100vw - 3rem), 23rem",
  },
  family: {
    widths: [360, 480, 640, 720, 960],
    sizes: "(max-width: 44rem) calc(100vw - 3rem), (max-width: 75rem) 36vw, 26rem",
  },
  full: {
    widths: [480, 720, 960, 1280, 1600, 1920],
    sizes: "(max-width: 75rem) 92vw, 69rem",
  },
};

const voidElements = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr",
]);

function classesFromTag(tag) {
  const value = tag.match(/\bclass=(?:"([^"]*)"|'([^']*)')/i)?.slice(1).find(Boolean) || "";
  return value.split(/\s+/).filter(Boolean);
}

function profileForClasses(classes) {
  const has = (...names) => names.some((name) => classes.has(name));
  if (has("path-thumb")) return "thumbnail";
  if (has("work-item", "software-card")) return "card";
  if (has("portrait-grid", "portrait-gallery")) {
    return has("portrait-gallery--featured") ? "third" : "quarter";
  }
  if (has("media-grid--three", "campaign-collage")) return "third";
  if (has("media-grid", "case-split", "software-hero")) return "half";
  if (has("hero__portrait")) return "portrait";
  if (has("photo-gallery", "gallery-image")) return "third";
  if (has("case-hero--family")) return "family";
  if (has("project-hero-card", "blog-post-hero", "writing-article__hero", "gallery-preview")) {
    return "full";
  }
  return "full";
}

function collectImageReferences(html) {
  const stack = [];
  const references = [];
  for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?[a-z][^>]*>/gi)) {
    const tag = match[0];
    if (tag.startsWith("<!--")) continue;
    const closing = /^<\//.test(tag);
    const name = tag.match(/^<\/?\s*([a-z0-9-]+)/i)?.[1].toLowerCase();
    if (!name) continue;
    if (closing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].name === name) {
          stack.length = index;
          break;
        }
      }
      continue;
    }

    const ownClasses = classesFromTag(tag);
    if (name === "img") {
      const classes = new Set(stack.flatMap((entry) => entry.classes));
      ownClasses.forEach((className) => classes.add(className));
      references.push({
        tag,
        start: match.index,
        end: match.index + tag.length,
        profile: profileForClasses(classes),
      });
    }
    if (!voidElements.has(name) && !/\/>$/.test(tag)) {
      stack.push({ name, classes: ownClasses });
    }
  }
  return references;
}

const args = parseArgs(process.argv.slice(2));
const outDir = path.resolve(args.outDir || "_site");
const imagesRoot = path.join(outDir, "assets/images");
const htmlFiles = await listHtmlFiles(outDir);
const jobs = new Map();
const htmlUpdates = new Map();

for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  for (const reference of collectImageReferences(html)) {
    if (/\bsrcset\s*=/i.test(reference.tag)) continue;
    const source = reference.tag.match(/\bsrc="([^"]+)"/i)?.[1];
    if (!source || !/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(source)) continue;
    const imagePath = resolveImagePath(outDir, htmlPath, source);
    if (!imagePath || !imagePath.startsWith(`${imagesRoot}${path.sep}`)) continue;
    if (!jobs.has(imagePath)) jobs.set(imagePath, { imagePath, references: [] });
    jobs.get(imagePath).references.push({ htmlPath, source, ...reference });
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
    const requestedWidths = new Set(
      job.references.flatMap((reference) => imageProfiles[reference.profile].widths),
    );
    const widths = [...requestedWidths]
      .filter((width) => metadata.width > width * 1.05)
      .sort((a, b) => a - b);
    if (!widths.length) continue;

    const entries = [];
    for (const width of widths) {
      const destination = variantPath(job.imagePath, width);
      const info = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: width <= 360 ? 64 : 74, effort: 4, smartSubsample: true })
        .toFile(destination);
      entries.push({ width, bytes: info.size });
      responsiveBytes += info.size;
      variantCount += 1;
    }

    for (const reference of job.references) {
      const profileWidths = new Set(imageProfiles[reference.profile].widths);
      const srcset = [
        ...entries
          .filter(({ width }) => profileWidths.has(width))
          .map(({ width }) => `${variantSource(reference.source, width)} ${width}w`),
        `${reference.source} ${metadata.width}w`,
      ].join(", ");
      const sizes = /\bsizes\s*=/i.test(reference.tag)
        ? ""
        : ` sizes="${imageProfiles[reference.profile].sizes}"`;
      const replacement = reference.tag.replace(
        /\s*(\/?)>$/,
        (_, slash) => ` srcset="${srcset}"${sizes}${slash}>`,
      );
      if (!htmlUpdates.has(reference.htmlPath)) htmlUpdates.set(reference.htmlPath, []);
      htmlUpdates.get(reference.htmlPath).push({
        start: reference.start,
        end: reference.end,
        replacement,
      });
    }
  }
};

await Promise.all(Array.from({ length: Math.min(4, queue.length || 1) }, worker));

for (const [htmlPath, replacements] of htmlUpdates) {
  let html = await readFile(htmlPath, "utf8");
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    html = `${html.slice(0, replacement.start)}${replacement.replacement}${html.slice(replacement.end)}`;
  }
  await writeFile(htmlPath, html, "utf8");
}

const mib = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(
  `Generated ${variantCount} responsive image variants (${mib(responsiveBytes)} MiB) from ${jobs.size} referenced images (${mib(sourceBytes)} MiB).`,
);

#!/usr/bin/env node

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  GENERATED_PUBLIC_FILES,
  PUBLIC_HTML_FILES,
  PUBLIC_RUNTIME_FILES,
  extractPublicImageReferences,
  isAllowedPublishedArtifactPath,
  isRetiredPublicPath,
  normalizePublicPath,
  resolvePublishedLocalReference,
} from "./publication-policy.mjs";
import {
  CLOUDFLARE_FUNCTION_EXCLUDES,
  CLOUDFLARE_FUNCTION_ROUTES,
} from "./publication-denylist.mjs";
import { hasRobotsDirective } from "./html-metadata.mjs";
import { SERVICES } from "./site-taxonomy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(root, "_site");
const allowedDataFiles = new Set(["site.config.json"]);
const responsiveWidthThreshold = 768;
const retiredResponsiveSizes = "(max-width: 960px) 100vw, 960px";

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else files.push(filePath);
  }
  return files;
}

const files = await listFiles(siteRoot);
const artifactPaths = files.map((filePath) => normalizePublicPath(path.relative(siteRoot, filePath)));
const artifactPathSet = new Set(artifactPaths);
const retiredArtifacts = artifactPaths.filter(isRetiredPublicPath);
if (retiredArtifacts.length) {
  throw new Error(`Retired paths were published:\n${retiredArtifacts.slice(0, 20).join("\n")}`);
}
const missingAllowlistedFiles = [
  ...PUBLIC_HTML_FILES,
  ...PUBLIC_RUNTIME_FILES,
  ...GENERATED_PUBLIC_FILES,
].filter((filePath) => !artifactPathSet.has(filePath));
if (missingAllowlistedFiles.length) {
  throw new Error(`Allowlisted public files are missing:\n${missingAllowlistedFiles.join("\n")}`);
}
const referencedImagePaths = new Set();
for (const relativePath of [...PUBLIC_HTML_FILES, ...PUBLIC_RUNTIME_FILES]) {
  if (!/\.(?:css|html|js|json)$/i.test(relativePath)) continue;
  const source = await readFile(path.join(siteRoot, relativePath), "utf8");
  for (const imagePath of extractPublicImageReferences(source)) referencedImagePaths.add(imagePath);
}
const unexpectedArtifacts = artifactPaths.filter(
  (filePath) => !isAllowedPublishedArtifactPath(filePath, referencedImagePaths),
);
if (unexpectedArtifacts.length) {
  throw new Error(`Unexpected files were published:\n${unexpectedArtifacts.slice(0, 20).join("\n")}`);
}
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

const functionRoutes = JSON.parse(await readFile(path.join(siteRoot, "_routes.json"), "utf8"));
const expectedFunctionRoutes = {
  version: 1,
  include: CLOUDFLARE_FUNCTION_ROUTES,
  exclude: CLOUDFLARE_FUNCTION_EXCLUDES,
};
if (JSON.stringify(functionRoutes) !== JSON.stringify(expectedFunctionRoutes)) {
  throw new Error("_site/_routes.json does not match the publication denylist.");
}

const missingAssets = [];
const responsiveProblems = [];
const rasterWidths = new Map();
let eligibleResponsiveImages = 0;
let responsiveImages = 0;
for (const htmlPath of htmlFiles) {
  const html = await readFile(htmlPath, "utf8");
  const relativePath = path.relative(siteRoot, htmlPath);
  if (relativePath !== "404.html" && hasRobotsDirective(html)) {
    throw new Error(`Noindex route was published: ${relativePath}`);
  }
  if (/\/Users\/|captured_from|assets\.ames\.consulting/i.test(html)) {
    throw new Error(`Private or retired publication reference found in ${relativePath}.`);
  }
  const orderedGalleries = html.match(/<[^>]+data-order-mode="[^"]+"/g) || [];
  const galleryOrderNotes = html.match(/<p class="gallery-order-note">/g) || [];
  if (galleryOrderNotes.length !== orderedGalleries.length) {
    throw new Error(
      `${relativePath} has ${orderedGalleries.length} ordered galleries but ${galleryOrderNotes.length} visible order notes.`,
    );
  }

  for (const tag of html.match(/<(?:img|script|link)\b[^>]*>/gi) || []) {
    const reference = tag.match(/\b(?:src|href)="([^"]+)"/i)?.[1];
    const localPath = reference
      ? resolvePublishedLocalReference(siteRoot, htmlPath, reference)
      : null;
    if (localPath && !await stat(localPath).then(() => true, () => false)) {
      missingAssets.push(`${relativePath}: ${reference}`);
    }

    if (!/^<img/i.test(tag)) continue;
    const srcset = tag.match(/\bsrcset="([^"]+)"/i)?.[1];
    const sizes = tag.match(/\bsizes="([^"]+)"/i)?.[1];
    const candidates = (srcset?.split(",") || []).map((candidate) => {
      const match = candidate.trim().match(/^(\S+)\s+(\d+)w$/);
      return match ? { url: match[1], width: Number(match[2]) } : null;
    });
    if (srcset && candidates.some((candidate) => !candidate)) {
      responsiveProblems.push(`${relativePath}: malformed srcset on ${reference}`);
    }
    if (srcset && (!sizes || sizes === retiredResponsiveSizes)) {
      responsiveProblems.push(`${relativePath}: missing or obsolete sizes on ${reference}`);
    }
    if (
      localPath
      && /\.(?:jpe?g|png|webp)$/i.test(localPath)
      && await stat(localPath).then(() => true, () => false)
    ) {
      if (!rasterWidths.has(localPath)) {
        rasterWidths.set(localPath, sharp(localPath).metadata().then((metadata) => metadata.width || 0));
      }
      const width = await rasterWidths.get(localPath);
      if (width > responsiveWidthThreshold) {
        eligibleResponsiveImages += 1;
        if (!srcset) {
          responsiveProblems.push(
            `${relativePath}: raster wider than ${responsiveWidthThreshold}px lacks srcset: ${reference}`,
          );
        } else {
          const validCandidates = candidates.filter(Boolean);
          const generatedCandidates = validCandidates.filter(({ url }) => /-\d+w\.webp(?:[?#]|$)/i.test(url));
          const descriptorWidths = validCandidates.map(({ width: candidateWidth }) => candidateWidth);
          if (generatedCandidates.length < 2) {
            responsiveProblems.push(`${relativePath}: fewer than two generated candidates for ${reference}`);
          }
          if (new Set(descriptorWidths).size !== descriptorWidths.length) {
            responsiveProblems.push(`${relativePath}: duplicate srcset descriptors for ${reference}`);
          }
          if (descriptorWidths.some((candidateWidth, index) => index > 0 && candidateWidth <= descriptorWidths[index - 1])) {
            responsiveProblems.push(`${relativePath}: srcset descriptors are not strictly ascending for ${reference}`);
          }
          if (Math.min(...descriptorWidths) > 480) {
            responsiveProblems.push(`${relativePath}: smallest srcset candidate exceeds 480px for ${reference}`);
          }
        }
      }
    }
    if (srcset) responsiveImages += 1;
    for (const candidate of candidates.filter(Boolean)) {
      const candidatePath = resolvePublishedLocalReference(siteRoot, htmlPath, candidate.url);
      if (candidatePath && !await stat(candidatePath).then(() => true, () => false)) {
        missingAssets.push(`${relativePath}: ${candidate.url}`);
      } else if (candidatePath && /\.(?:jpe?g|png|webp)$/i.test(candidatePath)) {
        if (!rasterWidths.has(candidatePath)) {
          rasterWidths.set(candidatePath, sharp(candidatePath).metadata().then((metadata) => metadata.width || 0));
        }
        const actualWidth = await rasterWidths.get(candidatePath);
        if (actualWidth !== candidate.width) {
          responsiveProblems.push(
            `${relativePath}: ${candidate.url} is ${actualWidth}px but declares ${candidate.width}w`,
          );
        }
      }
    }
  }
}
if (missingAssets.length) {
  throw new Error(`Built site has missing local assets:\n${missingAssets.slice(0, 20).join("\n")}`);
}
if (responsiveProblems.length) {
  throw new Error(`Built site has invalid responsive images:\n${responsiveProblems.slice(0, 20).join("\n")}`);
}
if (!responsiveImages || responsiveImages < eligibleResponsiveImages) {
  throw new Error(
    `Responsive image coverage is incomplete: ${responsiveImages} uses for ${eligibleResponsiveImages} eligible raster uses.`,
  );
}

const sitemap = await readFile(path.join(siteRoot, "sitemap.xml"), "utf8");
const lastModified = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((match) => match[1]);
if (!lastModified.length || lastModified.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value))) {
  throw new Error("Sitemap lastmod values must use stable YYYY-MM-DD dates.");
}

const llms = await readFile(path.join(siteRoot, "llms.txt"), "utf8");
for (const { title, slug } of SERVICES) {
  const link = `[${title}](https://ames.consulting/services/${slug}/)`;
  if (!llms.includes(link)) throw new Error(`llms.txt omits the canonical service link: ${link}`);
}

const artifactBytes = (await Promise.all(files.map((filePath) => stat(filePath)))).reduce(
  (total, fileStat) => total + fileStat.size,
  0,
);
console.log(
  `Validated ${htmlFiles.length} published HTML files, ${responsiveImages} responsive image uses for ${eligibleResponsiveImages} eligible raster uses, and ${(artifactBytes / 1024 / 1024).toFixed(1)} MiB of artifact data.`,
);

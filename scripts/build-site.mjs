#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PUBLIC_HTML_FILES,
  PUBLIC_ROUTE_ROOTS,
  PUBLIC_RUNTIME_FILES,
  assertPublicPathIsActive,
  extractPublicImageReferences,
  isAllowedPublicHtmlPath,
  isAllowedPublicImagePath,
  isAllowedRuntimePath,
  isRetiredPublicPath,
  normalizePublicPath,
} from "./publication-policy.mjs";
import {
  CLOUDFLARE_FUNCTION_EXCLUDES,
  CLOUDFLARE_FUNCTION_ROUTES,
} from "./publication-denylist.mjs";
import { hasRobotsDirective } from "./html-metadata.mjs";
import { createReleaseMarker, RELEASE_MARKER_FILE } from "./release-marker.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "_site");

async function pathExists(filePath) {
  return stat(filePath).then(() => true, () => false);
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else if (entry.isFile()) files.push(filePath);
  }
  return files;
}

async function auditSourceRoutes() {
  let excludedRoutes = 0;
  for (const routeRoot of PUBLIC_ROUTE_ROOTS) {
    const rootPath = join(projectRoot, routeRoot);
    for (const filePath of await listFiles(rootPath)) {
      if (basename(filePath) !== "index.html") continue;
      const relativePath = normalizePublicPath(relative(projectRoot, filePath));
      const html = await readFile(filePath, "utf8");
      if (isRetiredPublicPath(relativePath) || hasRobotsDirective(html)) {
        excludedRoutes += 1;
        continue;
      }
      if (!isAllowedPublicHtmlPath(relativePath)) {
        throw new Error(
          `Unlisted public route found: ${relativePath}. Add it to PUBLIC_HTML_FILES or mark it noindex.`,
        );
      }
    }
  }
  return excludedRoutes;
}

async function copyAllowlistedFile(relativePath) {
  const normalized = assertPublicPathIsActive(relativePath);
  const source = join(projectRoot, normalized);
  const destination = join(outputDir, normalized);
  const sourceStat = await stat(source).catch(() => null);
  if (!sourceStat?.isFile()) throw new Error(`Allowlisted public file is missing: ${normalized}`);
  await mkdir(dirname(destination), { recursive: true });
  await cp(source, destination);
}

function assertInside(base, target, label) {
  const relativePath = relative(base, target);
  if (relativePath.startsWith(`..${sep}`) || relativePath === ".." || resolve(target) === resolve(base)) {
    throw new Error(`${label} resolves outside ${base}: ${target}`);
  }
}

async function copyReferencedImages() {
  const referenced = new Set();
  let copied = 0;
  const textFiles = (await listFiles(outputDir)).filter((filePath) => /\.(?:css|html|js|json)$/i.test(filePath));

  for (const filePath of textFiles) {
    const source = await readFile(filePath, "utf8");
    for (const imagePath of extractPublicImageReferences(source)) referenced.add(imagePath);
  }

  const sourceImagesRoot = join(projectRoot, "assets/images");
  const outputImagesRoot = join(outputDir, "assets/images");
  for (const relativePath of [...referenced].sort()) {
    const normalized = assertPublicPathIsActive(relativePath);
    if (isAllowedRuntimePath(normalized)) continue;
    if (!isAllowedPublicImagePath(normalized)) {
      throw new Error(`Referenced image does not match the public image policy: ${normalized}`);
    }
    const source = join(projectRoot, normalized);
    const destination = join(outputDir, normalized);
    assertInside(sourceImagesRoot, source, "Image reference");
    assertInside(outputImagesRoot, destination, "Image destination");
    if (!await pathExists(source)) throw new Error(`Referenced public image is missing: ${normalized}`);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
    copied += 1;
  }

  return copied;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const skippedRoutes = await auditSourceRoutes();
for (const relativePath of PUBLIC_HTML_FILES) {
  const source = join(projectRoot, relativePath);
  if (relativePath !== "404.html" && hasRobotsDirective(await readFile(source, "utf8"))) {
    throw new Error(`Allowlisted public route is marked noindex: ${relativePath}`);
  }
  await copyAllowlistedFile(relativePath);
}

for (const relativePath of PUBLIC_RUNTIME_FILES) await copyAllowlistedFile(relativePath);

const copiedImages = await copyReferencedImages();
await writeFile(
  join(outputDir, "_routes.json"),
  `${JSON.stringify({
    version: 1,
    include: CLOUDFLARE_FUNCTION_ROUTES,
    exclude: CLOUDFLARE_FUNCTION_EXCLUDES,
  }, null, 2)}\n`,
);
await writeFile(join(outputDir, RELEASE_MARKER_FILE), createReleaseMarker());

for (const generator of ["optimize-site-images.mjs", "generate-seo-artifacts.mjs"]) {
  execFileSync(process.execPath, [join(projectRoot, "scripts", generator), "--out-dir", outputDir], {
    cwd: projectRoot,
    stdio: "inherit",
  });
}

console.log(
  `Built static site in ${outputDir}: ${PUBLIC_HTML_FILES.length} public HTML files, ${PUBLIC_RUNTIME_FILES.length} runtime files, ${copiedImages} referenced images, ${skippedRoutes} denied or noindex routes excluded.`,
);

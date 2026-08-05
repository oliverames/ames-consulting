#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "_site");
const publicEntries = ["404.html", "index.html", "about", "blog", "contact", "services", "testimonials", "work"];
const runtimeAssetDirectories = ["css", "icons", "js"];
const runtimeDataFiles = ["site.config.json"];
const noindexPattern = /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;
const imageReferencePattern = /(?:https?:\/\/ames\.consulting\/|(?:\.\.\/|\.\/|\/)*)?(assets\/images\/[^"'()<>{}\s?#]+)/g;

async function pathExists(filePath) {
  return stat(filePath).then(() => true, () => false);
}

async function copyPublicTree(source, destination, isRootEntry = false) {
  const sourceStat = await stat(source);
  if (sourceStat.isFile()) {
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
    return { copiedFiles: 1, skippedRoutes: 0 };
  }

  if (!isRootEntry) {
    const indexPath = join(source, "index.html");
    if (await pathExists(indexPath)) {
      const html = await readFile(indexPath, "utf8");
      if (noindexPattern.test(html)) return { copiedFiles: 0, skippedRoutes: 1 };
    }
  }

  await mkdir(destination, { recursive: true });
  let copiedFiles = 0;
  let skippedRoutes = 0;
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const result = await copyPublicTree(
      join(source, entry.name),
      join(destination, entry.name),
      false,
    );
    copiedFiles += result.copiedFiles;
    skippedRoutes += result.skippedRoutes;
  }
  return { copiedFiles, skippedRoutes };
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else files.push(filePath);
  }
  return files;
}

function assertInside(base, target, label) {
  const relativePath = relative(base, target);
  if (relativePath.startsWith(`..${sep}`) || relativePath === ".." || resolve(target) === resolve(base)) {
    throw new Error(`${label} resolves outside ${base}: ${target}`);
  }
}

async function copyReferencedImages() {
  const referenced = new Set();
  const textFiles = (await listFiles(outputDir)).filter((filePath) => /\.(?:css|html|js|json)$/i.test(filePath));

  for (const filePath of textFiles) {
    const source = await readFile(filePath, "utf8");
    for (const match of source.matchAll(imageReferencePattern)) referenced.add(match[1]);
  }

  const sourceImagesRoot = join(projectRoot, "assets/images");
  const outputImagesRoot = join(outputDir, "assets/images");
  for (const relativePath of [...referenced].sort()) {
    const source = join(projectRoot, relativePath);
    const destination = join(outputDir, relativePath);
    assertInside(sourceImagesRoot, source, "Image reference");
    assertInside(outputImagesRoot, destination, "Image destination");
    if (!await pathExists(source)) throw new Error(`Referenced public image is missing: ${relativePath}`);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination);
  }

  return referenced.size;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

let copiedFiles = 0;
let skippedRoutes = 0;
for (const entry of publicEntries) {
  const result = await copyPublicTree(join(projectRoot, entry), join(outputDir, entry), true);
  copiedFiles += result.copiedFiles;
  skippedRoutes += result.skippedRoutes;
}

await mkdir(join(outputDir, "assets"), { recursive: true });
for (const directory of runtimeAssetDirectories) {
  await cp(join(projectRoot, "assets", directory), join(outputDir, "assets", directory), { recursive: true });
}

await mkdir(join(outputDir, "assets/data"), { recursive: true });
for (const filename of runtimeDataFiles) {
  await cp(join(projectRoot, "assets/data", filename), join(outputDir, "assets/data", filename));
}

const copiedImages = await copyReferencedImages();

for (const generator of ["optimize-site-images.mjs", "generate-seo-artifacts.mjs"]) {
  execFileSync(process.execPath, [join(projectRoot, "scripts", generator), "--out-dir", outputDir], {
    cwd: projectRoot,
    stdio: "inherit",
  });
}

console.log(
  `Built static site in ${outputDir}: ${copiedFiles} public files, ${copiedImages} referenced images, ${skippedRoutes} noindex routes excluded.`,
);

#!/usr/bin/env node

import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "_site");
const generators = ["generate-seo-artifacts.mjs"];
const publicEntries = ["404.html", "index.html", "about", "blog", "contact", "services", "testimonials", "work"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of publicEntries) {
  await cp(join(projectRoot, entry), join(outputDir, entry), { recursive: true });
}

// Copy every assets/ subdirectory. Enumerating them dynamically prevents the
// class of bug where a new asset folder (e.g. icons/) ships in HTML but never
// reaches the deployed site.
await mkdir(join(outputDir, "assets"), { recursive: true });
const assetEntries = await readdir(join(projectRoot, "assets"), { withFileTypes: true });
for (const entry of assetEntries) {
  if (!entry.isDirectory()) continue;
  await cp(join(projectRoot, "assets", entry.name), join(outputDir, "assets", entry.name), {
    recursive: true
  });
}

for (const generator of generators) {
  execFileSync(process.execPath, [join(projectRoot, "scripts", generator), "--out-dir", outputDir], {
    cwd: projectRoot,
    stdio: "inherit"
  });
}

console.log(`Built static site in ${outputDir}`);

#!/usr/bin/env node

import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "_site");
const generators = ["generate-seo-artifacts.mjs"];
const publicEntries = [".nojekyll", "404.html", "CNAME", "index.html", "about", "blog", "contact", "services", "testimonials", "work"];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of publicEntries) {
  await cp(join(projectRoot, entry), join(outputDir, entry), { recursive: true });
}

await mkdir(join(outputDir, "assets"), { recursive: true });
await cp(join(projectRoot, "assets", "css"), join(outputDir, "assets", "css"), {
  recursive: true
});
await cp(join(projectRoot, "assets", "js"), join(outputDir, "assets", "js"), {
  recursive: true
});
await cp(join(projectRoot, "assets", "images"), join(outputDir, "assets", "images"), {
  recursive: true
});
await cp(join(projectRoot, "assets", "data"), join(outputDir, "assets", "data"), {
  recursive: true
});

for (const generator of generators) {
  execFileSync(process.execPath, [join(projectRoot, "scripts", generator), "--out-dir", outputDir], {
    cwd: projectRoot,
    stdio: "inherit"
  });
}

console.log(`Built static site in ${outputDir}`);

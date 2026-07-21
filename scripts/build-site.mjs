#!/usr/bin/env node

import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outputDir = join(projectRoot, "_site");
const excludedTopLevel = new Set([
  ".git",
  ".github",
  ".playwright-mcp",
  "_site",
  "node_modules",
  "output",
  "test-results"
]);

function includeInBuild(source) {
  const pathFromRoot = relative(projectRoot, source);
  if (!pathFromRoot) {
    return true;
  }

  const [topLevel] = pathFromRoot.split(sep);
  return !excludedTopLevel.has(topLevel);
}

const generators = [
  "generate-blog-posts.mjs",
  "generate-blog-index.mjs",
  "generate-photography-galleries.mjs",
  "generate-eastrise-pages.mjs",
  "generate-seo-artifacts.mjs"
];

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const entry of await readdir(projectRoot)) {
  if (excludedTopLevel.has(entry)) {
    continue;
  }

  await cp(join(projectRoot, entry), join(outputDir, entry), {
    recursive: true,
    filter: includeInBuild
  });
}

for (const generator of generators) {
  execFileSync(process.execPath, [join(outputDir, "scripts", generator)], {
    cwd: outputDir,
    stdio: "inherit"
  });
}

execFileSync(process.execPath, [join(outputDir, "scripts", "rewrite-r2-assets.mjs")], {
  cwd: outputDir,
  stdio: "inherit"
});

console.log(`Built static site in ${outputDir}`);

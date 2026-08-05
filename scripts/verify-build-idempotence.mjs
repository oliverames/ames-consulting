#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const siteRoot = path.join(root, "_site");

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else files.push(filePath);
  }
  return files;
}

async function hashSite() {
  const hash = createHash("sha256");
  for (const filePath of (await listFiles(siteRoot)).sort()) {
    hash.update(path.relative(siteRoot, filePath));
    hash.update("\0");
    hash.update(await readFile(filePath));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function build() {
  execFileSync("npm", ["run", "build:site"], { cwd: root, stdio: "inherit" });
}

build();
const first = await hashSite();
build();
const second = await hashSite();
if (first !== second) throw new Error(`Build output changed between runs: ${first} != ${second}`);
console.log(`Build output is content-idempotent: ${second}`);

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

async function snapshotSite() {
  const files = new Map();
  for (const filePath of (await listFiles(siteRoot)).sort()) {
    const relativePath = path.relative(siteRoot, filePath);
    files.set(relativePath, createHash("sha256").update(await readFile(filePath)).digest("hex"));
  }
  const hash = createHash("sha256");
  for (const [relativePath, fileHash] of files) {
    hash.update(relativePath);
    hash.update("\0");
    hash.update(fileHash);
    hash.update("\0");
  }
  return { files, hash: hash.digest("hex") };
}

function build() {
  execFileSync("npm", ["run", "build:site"], { cwd: root, stdio: "inherit" });
}

build();
const first = await snapshotSite();
build();
const second = await snapshotSite();
if (first.hash !== second.hash) {
  const filenames = new Set([...first.files.keys(), ...second.files.keys()]);
  const changed = [...filenames].filter((filename) => first.files.get(filename) !== second.files.get(filename));
  throw new Error(
    `Build output changed between runs (${first.hash} != ${second.hash}):\n${changed.slice(0, 30).join("\n")}`,
  );
}
console.log(`Build output is content-idempotent: ${second.hash}`);

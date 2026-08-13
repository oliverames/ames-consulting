#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_HTML_FILES, PUBLIC_RUNTIME_FILES } from "./publication-policy.mjs";

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

async function snapshotSource() {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "utf8",
  }).split("\0").filter(Boolean);
  const filenames = [...new Set([
    ...tracked,
    ...PUBLIC_HTML_FILES,
    ...PUBLIC_RUNTIME_FILES,
  ])].sort();
  const files = new Map();
  for (const relativePath of filenames) {
    const contents = await readFile(path.join(root, relativePath)).catch(() => null);
    files.set(
      relativePath,
      contents === null ? "<missing>" : createHash("sha256").update(contents).digest("hex"),
    );
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

function changedFiles(first, second) {
  const filenames = new Set([...first.files.keys(), ...second.files.keys()]);
  return [...filenames].filter((filename) => first.files.get(filename) !== second.files.get(filename));
}

function build() {
  execFileSync("npm", ["run", "build:site"], { cwd: root, stdio: "inherit" });
}

build();
const first = await snapshotSite();
const firstSource = await snapshotSource();
build();
const second = await snapshotSite();
const secondSource = await snapshotSource();
if (first.hash !== second.hash) {
  const changed = changedFiles(first, second);
  throw new Error(
    `Build output changed between runs (${first.hash} != ${second.hash}):\n${changed.slice(0, 30).join("\n")}`,
  );
}
if (firstSource.hash !== secondSource.hash) {
  const changed = changedFiles(firstSource, secondSource);
  throw new Error(
    `Generated source changed between runs (${firstSource.hash} != ${secondSource.hash}):\n${changed.slice(0, 30).join("\n")}`,
  );
}
console.log(`Build output is content-idempotent: ${second.hash}`);
console.log(`Generated source is content-idempotent: ${secondSource.hash}`);

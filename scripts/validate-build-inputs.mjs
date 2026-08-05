#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "assets/data");
const files = (await readdir(dataDir)).filter((filename) => filename.endsWith(".json")).sort();

for (const filename of files) {
  const filePath = path.join(dataDir, filename);
  const source = await readFile(filePath, "utf8");
  try {
    JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in assets/data/${filename}: ${error.message}`, { cause: error });
  }
  if (/\/Users\/|"captured_from"\s*:/.test(source)) {
    throw new Error(`Private filesystem data found in assets/data/${filename}.`);
  }
}

console.log(`Validated ${files.length} JSON build inputs and found no private filesystem fields.`);

#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "assets/data");
async function listJsonFiles(directory, relativeDirectory = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listJsonFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(relativePath);
    }
  }

  return files;
}

const files = (await listJsonFiles(dataDir)).sort();

for (const filename of files) {
  const filePath = path.join(dataDir, filename);
  const source = await readFile(filePath, "utf8");
  try {
    JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in assets/data/${filename}: ${error.message}`, { cause: error });
  }
  if (
    /\/Users\//.test(source)
    || /"(?:captured_from|source_record|source_screenshot)"\s*:/.test(source)
    || /"source"\s*:\s*"(?:Ames Consulting|Documents)\//.test(source)
    || /(?:Verify Safe To Delete|Legacy Source Records|Public Source Screenshots)/.test(source)
  ) {
    throw new Error(`Private filesystem data found in assets/data/${filename}.`);
  }
}

console.log(`Validated ${files.length} JSON build inputs and found no private filesystem fields.`);

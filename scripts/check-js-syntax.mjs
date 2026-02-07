import { readdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const TARGET_DIRS = ["assets/js", "scripts", "tests"];

async function collectJsFiles(dir) {
  const absolute = path.join(ROOT, dir);
  let entries;

  try {
    entries = await readdir(absolute, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await collectJsFiles(entryPath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(entryPath);
    }
  }

  return files;
}

function runNodeCheck(filePath) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["--check", filePath], { stdio: "inherit" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Syntax check failed: ${filePath}`));
      }
    });
  });
}

const files = (await Promise.all(TARGET_DIRS.map((dir) => collectJsFiles(dir))))
  .flat()
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  process.exit(0);
}

for (const file of files) {
  await runNodeCheck(file);
}

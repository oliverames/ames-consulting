#!/usr/bin/env node

import { execFile } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const documentsRoot = process.env.AMES_CONSULTING_DOCUMENTS_ROOT
  || path.join(homedir(), "Documents", "Ames Consulting");
const sourceDirectories = new Map([
  ["neg-ecp-conference-2026", path.join(documentsRoot, "Clients", "GBIC", "NEG-ECP Conference", "Favorites")],
  ["giron-family-fall-2025", path.join(documentsRoot, "Clients", "Giron Family", "2025-09-28 Fall Family Session", "Deliverables")],
  ["giron-family-christmas-tree-farm-2024", path.join(documentsRoot, "Clients", "Giron Family", "2024-12-01 Christmas Tree Farm Family Session")],
  ["giron-family-fall-2023", path.join(documentsRoot, "Clients", "Giron Family", "2023-10-08 Fall Family Session")],
  ["vermont-foodbank-volunteer-day-2026", path.join(documentsRoot, "Portfolio", "Vermont Foodbank")],
  ["london-2019", path.join(documentsRoot, "Portfolio", "London")],
  ["whale-dance-randolph", path.join(documentsRoot, "Portfolio", "Randolph Whale Tails")],
  ["drone-photography", path.join(documentsRoot, "Portfolio", "Drone Photography")],
]);

function outputFilename(sourceFile) {
  const extension = path.extname(sourceFile);
  const stem = path.basename(sourceFile, extension)
    .toLowerCase()
    .replace(/\s*\((\d+)\)$/u, "-$1");
  return `${stem}.webp`;
}

function isoCaptureDate(record) {
  const rawDate = String(record.SubSecDateTimeOriginal || record.DateTimeOriginal || "").trim();
  if (!rawDate) throw new Error(`Missing capture date: ${record.SourceFile}`);
  const normalized = rawDate.replace(
    /^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2}(?:\.\d+)?)/u,
    "$1-$2-$3T$4",
  );
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/u.test(normalized);
  const offset = hasOffset ? "" : String(record.OffsetTimeOriginal || "").trim();
  const capturedAt = `${normalized}${offset}`;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(capturedAt)) {
    throw new Error(`Incomplete ISO capture date for ${record.SourceFile}: ${capturedAt}`);
  }
  return capturedAt;
}

for (const [slug, sourceDirectory] of sourceDirectories) {
  const sourceFiles = (await readdir(sourceDirectory))
    .filter((file) => /\.jpe?g$/iu.test(file))
    .map((file) => path.join(sourceDirectory, file));
  const { stdout } = await exec("/opt/homebrew/bin/exiftool", [
    "-j",
    "-SubSecDateTimeOriginal",
    "-DateTimeOriginal",
    "-OffsetTimeOriginal",
    ...sourceFiles,
  ], { maxBuffer: 20 * 1024 * 1024 });
  const captureByFile = new Map();
  for (const record of JSON.parse(stdout)) {
    const outputFile = outputFilename(record.SourceFile);
    if (captureByFile.has(outputFile)) {
      throw new Error(`Multiple source photographs map to ${slug}/${outputFile}.`);
    }
    captureByFile.set(outputFile, isoCaptureDate(record));
  }

  const metadataPath = path.join(root, "assets", "data", "event-gallery-alt-text", `${slug}.json`);
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  const expectedFiles = new Set(metadata.images.map((image) => image.file));
  const missingFiles = [...expectedFiles].filter((file) => !captureByFile.has(file));
  const unexpectedFiles = [...captureByFile.keys()].filter((file) => !expectedFiles.has(file));
  if (missingFiles.length || unexpectedFiles.length) {
    throw new Error([
      `Capture-date coverage does not match ${slug}.`,
      missingFiles.length ? `Missing: ${missingFiles.join(", ")}` : "",
      unexpectedFiles.length ? `Unexpected: ${unexpectedFiles.join(", ")}` : "",
    ].filter(Boolean).join("\n"));
  }
  metadata.images = metadata.images.map((image) => ({
    ...image,
    capturedAt: captureByFile.get(image.file),
  }));
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(`${slug}: ${metadata.images.length} capture dates`);
}

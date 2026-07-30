#!/usr/bin/env node

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const libraryRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/EastRise Public Library";
const recordsRoot = join(libraryRoot, "Source Records");
const recordsScreenshots = join(recordsRoot, "Public Source Screenshots");
const siteScreenshots = join(root, "assets/images/provenance/source-screenshots");
const manifestPath = join(recordsRoot, "Manifests/Capture Manifest.json");
const provenancePath = join(root, "assets/data/media-provenance.json");
const captureMissing = process.argv.includes("--capture-missing");

const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
const captureManifest = JSON.parse(await readFile(manifestPath, "utf8"));
const records = Object.values(provenance.assets || {});
const sources = [...new Map(records.filter((record) => record.source_url).map((record) => [record.source_url, record])).entries()]
  .map(([source_url, record]) => ({ source_url, source_channel: record.source_channel }));

const canonicalUrl = (value) => {
  const url = new URL(value);
  url.hash = "";
  if (url.hostname === "www.instagram.com") url.pathname = url.pathname.replace(/^\/eastrisecu\//, "/");
  if (url.hostname === "www.linkedin.com") url.search = "";
  if (url.hostname === "www.youtube.com" && url.pathname === "/watch") {
    const videoId = url.searchParams.get("v");
    url.search = videoId ? `?v=${videoId}` : "";
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString();
};
const sourceId = (url, channel) => `${String(channel || "source").toLowerCase()}-${createHash("sha256").update(canonicalUrl(url)).digest("hex").slice(0, 16)}`;
const manifestByUrl = new Map(captureManifest.map((entry) => [canonicalUrl(entry.url), entry]));

async function walk(directory, predicate, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path, predicate, found);
    else if (predicate(path)) found.push(path);
  }
  return found;
}

await mkdir(siteScreenshots, { recursive: true });
await mkdir(recordsScreenshots, { recursive: true });

const archivedScreenshots = await walk(libraryRoot, (path) => basename(path) === "Page Screenshot.png");
const screenshotsBySequence = new Map();
for (const screenshot of archivedScreenshots) {
  const sequenceFolder = screenshot.split("/").find((part) => /^\d{3}(?:\s|$)/.test(part));
  if (!sequenceFolder) continue;
  const sequence = Number(sequenceFolder.slice(0, 3));
  if (!screenshotsBySequence.has(sequence)) screenshotsBySequence.set(sequence, []);
  screenshotsBySequence.get(sequence).push(screenshot);
}

const results = [];
const missing = [];
for (const source of sources) {
  const id = sourceId(source.source_url, source.source_channel);
  const filename = `${id}.png`;
  const sitePath = join(siteScreenshots, filename);
  const recordsPath = join(recordsScreenshots, filename);
  const manifestRecord = manifestByUrl.get(canonicalUrl(source.source_url));
  const archived = manifestRecord ? screenshotsBySequence.get(manifestRecord.sequence)?.[0] : undefined;
  let origin = archived;

  if (!origin) {
    try {
      await stat(recordsPath);
      origin = recordsPath;
    } catch {
      missing.push({ ...source, id, sitePath, recordsPath });
      continue;
    }
  }

  if (origin !== recordsPath) await copyFile(origin, recordsPath);
  await copyFile(origin, sitePath);
  results.push({
    ...source,
    source_screenshot: relative(root, sitePath),
    source_record: relative(recordsRoot, recordsPath),
    captured_from: origin,
  });
}

if (captureMissing && missing.length) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  for (const source of missing) {
    const page = await context.newPage();
    try {
      await page.goto(source.source_url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForTimeout(5_000);
      await page.screenshot({ path: source.recordsPath, fullPage: true, type: "png" });
      await copyFile(source.recordsPath, source.sitePath);
      results.push({
        source_url: source.source_url,
        source_channel: source.source_channel,
        source_screenshot: relative(root, source.sitePath),
        source_record: relative(recordsRoot, source.recordsPath),
        captured_from: source.source_url,
      });
    } catch (error) {
      source.error = error.message;
    } finally {
      await page.close();
    }
  }
  await browser.close();
}

const resolved = new Set(results.map((result) => canonicalUrl(result.source_url)));
const unresolved = missing.filter((source) => !resolved.has(canonicalUrl(source.source_url))).map(({ source_url, source_channel, error = "No archived capture was matched." }) => ({ source_url, source_channel, error }));
const output = {
  generated_at: new Date().toISOString(),
  screenshots: results.sort((a, b) => a.source_url.localeCompare(b.source_url)),
  missing: unresolved,
};
await writeFile(join(root, "assets/data/source-screenshot-manifest.json"), `${JSON.stringify(output, null, 2)}\n`);
await writeFile(join(recordsRoot, "Manifests/Site Source Screenshot Manifest.json"), `${JSON.stringify(output, null, 2)}\n`);
await copyFile(provenancePath, join(recordsRoot, "Manifests/Site Media Provenance.json"));
try {
  await copyFile(join(root, "assets/data/media-provenance-missing.json"), join(recordsRoot, "Manifests/Site Media Provenance Missing Fields.json"));
} catch {
  // The missing-fields report is created by generate-media-provenance.mjs.
}
console.log(`Synchronized ${results.length} source screenshots; ${unresolved.length} remain missing.`);

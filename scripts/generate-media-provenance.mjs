#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const screenshotManifestPath = join(root, "assets/data/source-screenshot-manifest.json");

async function readJson(filePath) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read required JSON input ${filePath}: ${error.message}`, { cause: error });
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`, { cause: error });
  }
}

const screenshotManifest = await readJson(screenshotManifestPath);
if (!Array.isArray(screenshotManifest.screenshots)) {
  throw new Error(`${screenshotManifestPath} must contain a screenshots array.`);
}
const screenshotBySource = new Map((screenshotManifest.screenshots || []).map((record) => [record.source_url, record.source_screenshot]));
const photography = await readJson(join(root, "assets/data/eastrise-photography.json"));
const social = await readJson(join(root, "assets/data/eastrise-social.json"));
const eastRiseCredit = "Made as Digital Content Strategist, EastRise Credit Union";
const blueCrossCredit = "Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont";
const assets = {};
const normalize = (value) => value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
const publicPage = (value) => /^https:\/\/(www\.)?(facebook\.com|instagram\.com|linkedin\.com|youtube\.com|youtu\.be)\//i.test(value || "") ? value : "";
const screenshotFor = (sourceUrl) => screenshotBySource.get(sourceUrl) || "";
const requiredFields = ["source_url", "source_channel", "published_date", "downloaded_date", "credit", "source_screenshot"];

for (const series of photography.series) for (const image of series.images) {
  assets[normalize(image.src)] = {
    source_url: publicPage(image.sourceUrl),
    source_channel: image.sourcePlatform || "",
    published_date: image.src.match(/\/(\d{4}-\d{2}-\d{2})_/)?.[1] || "",
    downloaded_date: photography.generatedAt || "",
    credit: eastRiseCredit,
    source_screenshot: screenshotFor(publicPage(image.sourceUrl)),
    archive_note: image.publicArchiveNote || "",
  };
}
for (const post of social.posts) {
  assets[normalize(post.screenshot)] = {
    source_url: publicPage(post.sourceUrl),
    source_channel: post.platform || "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: eastRiseCredit,
    source_screenshot: screenshotFor(publicPage(post.sourceUrl)),
  };
}

const profiles = {
  "assets/images/work/portraits/gallery/blue-cross/beth-roberts-executive.webp": "https://www.bluecrossvt.org/beth-roberts",
  "assets/images/work/portraits/gallery/blue-cross/barbara-demas-executive.webp": "https://www.bluecrossvt.org/barbara-demas",
  "assets/images/work/portraits/gallery/blue-cross/ruth-greene-executive.webp": "https://www.bluecrossvt.org/ruth-greene",
  "assets/images/work/portraits/gallery/blue-cross/rebecca-heintz-executive.webp": "https://www.bluecrossvt.org/rebecca-heintz",
  "assets/images/work/portraits/gallery/blue-cross/margaret-pinello-white-executive.webp": "https://www.bluecrossvt.org/margaret-pinello-white",
  "assets/images/work/portraits/gallery/blue-cross/tom-weigel-executive.webp": "https://www.bluecrossvt.org/tom-weigel",
};
for (const [asset, sourceUrl] of Object.entries(profiles)) assets[asset] = {
  source_url: sourceUrl,
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_screenshot: screenshotFor(sourceUrl),
};

assets["assets/images/work/campaigns/member-stories.webp"] = {
  source_url: "https://www.youtube.com/watch?v=A1oAN6Ox6A0",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_screenshot: screenshotFor("https://www.youtube.com/watch?v=A1oAN6Ox6A0"),
};
assets["assets/images/work/campaigns/will-barbecue.webp"] = {
  source_url: "https://www.youtube.com/watch?v=fAF3x-Iu2Bo",
  source_channel: "YouTube",
  published_date: "2025-12-30",
  downloaded_date: "2026-08-03",
  credit: eastRiseCredit,
  source_screenshot: screenshotFor("https://www.youtube.com/watch?v=fAF3x-Iu2Bo"),
};
assets["assets/images/work/campaigns/flight-paths.webp"] = {
  source_url: "https://www.youtube.com/watch?v=4r5N5DjmSCU",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_screenshot: screenshotFor("https://www.youtube.com/watch?v=4r5N5DjmSCU"),
};
assets["assets/images/work/campaigns/eastrise-writing.webp"] = {
  source_url: "",
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_screenshot: "",
};

await writeFile(join(root, "assets/data/media-provenance.json"), `${JSON.stringify({ generated_at: "2026-08-03", assets }, null, 2)}\n`);
const missing = Object.entries(assets).filter(([, data]) => requiredFields.some((field) => data[field] === "")).map(([asset, data]) => ({
  asset,
  missing_fields: requiredFields.filter((field) => data[field] === ""),
}));
await writeFile(join(root, "assets/data/media-provenance-missing.json"), `${JSON.stringify({ generated_at: "2026-08-03", missing }, null, 2)}\n`);
console.log(`Tracked ${Object.keys(assets).length} public-source assets; ${missing.length} have omitted fields.`);

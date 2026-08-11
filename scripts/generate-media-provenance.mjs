#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const captureManifestPath = join(root, "assets/data/source-screenshot-manifest.json");
const evidencePath = join(root, "assets/data/media-provenance-evidence.json");
const exceptionsPath = join(root, "assets/data/media-provenance-exceptions.json");

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

const captureManifest = await readJson(captureManifestPath);
if (!Array.isArray(captureManifest.captures)) {
  throw new Error(`${captureManifestPath} must contain a captures array.`);
}
const manifestKeys = Object.keys(captureManifest).sort();
if (JSON.stringify(manifestKeys) !== JSON.stringify(["captures", "generated_at", "missing"])) {
  throw new Error(`${captureManifestPath} contains unexpected fields.`);
}
for (const [index, record] of captureManifest.captures.entries()) {
  const keys = Object.keys(record).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["source_capture", "source_channel", "source_url"])) {
    throw new Error(`${captureManifestPath} capture ${index + 1} contains a private or unexpected field.`);
  }
  if (!/^https:\/\//.test(record.source_url) || typeof record.source_channel !== "string") {
    throw new Error(`${captureManifestPath} capture ${index + 1} has invalid public source metadata.`);
  }
  if (record.source_capture !== "private_archive") {
    throw new Error(`${captureManifestPath} capture ${index + 1} must use private_archive status.`);
  }
}
if (!Array.isArray(captureManifest.missing)) {
  throw new Error(`${captureManifestPath} must contain a missing array.`);
}
for (const [index, record] of captureManifest.missing.entries()) {
  const keys = Object.keys(record).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["error", "source_channel", "source_url"])) {
    throw new Error(`${captureManifestPath} missing record ${index + 1} contains a private or unexpected field.`);
  }
}
const canonicalSourceKey = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com") {
      const match = url.pathname.match(/\/(?:[^/]+\/)?(p|reel)\/([^/]+)/i);
      if (match) return `instagram:${match[1].toLowerCase()}:${match[2]}`;
    }
    if (host === "youtube.com") return `youtube:${url.searchParams.get("v") || url.pathname}`;
    if (host === "youtu.be") return `youtube:${url.pathname.replace(/^\//, "")}`;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return value || "";
  }
};
const captureBySource = new Map();
for (const record of captureManifest.captures) {
  captureBySource.set(record.source_url, record.source_capture);
  captureBySource.set(canonicalSourceKey(record.source_url), record.source_capture);
}

const photography = await readJson(join(root, "assets/data/eastrise-photography.json"));
const portraits = await readJson(join(root, "assets/data/portraits.json"));
const social = await readJson(join(root, "assets/data/eastrise-social.json"));
const evidence = await readJson(evidencePath);
const exceptions = await readJson(exceptionsPath);
const eastRiseCredit = "Made as Digital Content Strategist, EastRise Credit Union";
const blueCrossCredit = "Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont";
const assets = {};
const normalize = (value) => value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
const cleanSourceUrl = (value) => {
  if (!value) return "";
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || key.toLowerCase() === "rcm") url.searchParams.delete(key);
  }
  url.hash = "";
  return url.href;
};
const publicPage = (value) => /^https:\/\/(www\.)?(facebook\.com|instagram\.com|linkedin\.com|youtube\.com|youtu\.be)\//i.test(value || "") ? cleanSourceUrl(value) : "";
const captureFor = (sourceUrl) => captureBySource.get(sourceUrl) || captureBySource.get(canonicalSourceKey(sourceUrl)) || "";
const requiredFields = ["source_url", "source_channel", "published_date", "downloaded_date", "credit", "source_capture"];

for (const series of photography.series) for (const image of series.images) {
  const sourceUrl = publicPage(image.sourceUrl);
  assets[normalize(image.src)] = {
    source_url: sourceUrl,
    source_channel: image.sourcePlatform || "",
    published_date: image.src.match(/\/(\d{4}-\d{2}-\d{2})_/)?.[1] || "",
    downloaded_date: photography.generatedAt || "",
    credit: eastRiseCredit,
    source_capture: captureFor(sourceUrl),
    archive_note: image.publicArchiveNote || "",
  };
}
for (const post of social.posts) {
  const sourceUrl = publicPage(post.sourceUrl);
  assets[normalize(post.screenshot)] = {
    source_url: sourceUrl,
    source_channel: post.platform || "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: eastRiseCredit,
    source_capture: captureFor(sourceUrl),
  };
}

const blueCrossPortraits = portraits.series?.find((series) => series.slug === "blue-cross-cbss");
if (!blueCrossPortraits?.images?.length) throw new Error("portraits.json must contain the public Blue Cross portrait series.");
for (const image of blueCrossPortraits.images) {
  const sourceUrl = /^https:\/\//.test(image.source || "") ? cleanSourceUrl(image.source) : "";
  assets[normalize(image.src)] = {
    source_url: sourceUrl,
    source_channel: sourceUrl ? "website" : "",
    published_date: "",
    downloaded_date: sourceUrl ? "2026-07-29" : "",
    credit: blueCrossCredit,
    source_capture: captureFor(sourceUrl),
  };
}

assets["assets/images/work/campaigns/member-stories.webp"] = {
  source_url: "https://www.youtube.com/watch?v=A1oAN6Ox6A0",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=A1oAN6Ox6A0"),
};
assets["assets/images/work/campaigns/will-barbecue.webp"] = {
  source_url: "https://www.youtube.com/watch?v=fAF3x-Iu2Bo",
  source_channel: "YouTube",
  published_date: "2025-12-30",
  downloaded_date: "2026-08-03",
  credit: eastRiseCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=fAF3x-Iu2Bo"),
};
assets["assets/images/work/campaigns/flight-paths.webp"] = {
  source_url: "https://www.youtube.com/watch?v=4r5N5DjmSCU",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=4r5N5DjmSCU"),
};
assets["assets/images/work/campaigns/eastrise-writing.webp"] = {
  source_url: "",
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_capture: "",
};

for (const group of evidence.public_sources || []) {
  for (const asset of group.assets || []) {
    if (!assets[asset]) throw new Error(`${evidencePath} references unknown asset ${asset}.`);
    const sourceUrl = publicPage(group.source_url);
    if (!sourceUrl) throw new Error(`${evidencePath} has a non-public source URL for ${asset}.`);
    assets[asset].source_url = sourceUrl;
    assets[asset].source_channel = group.source_channel;
    assets[asset].source_capture = captureFor(sourceUrl);
  }
}
for (const group of evidence.published_dates || []) {
  for (const [asset, publishedDate] of Object.entries(group.records || {})) {
    if (!assets[asset]) throw new Error(`${evidencePath} references unknown asset ${asset}.`);
    assets[asset].published_date = publishedDate;
  }
}
for (const group of exceptions.exceptions || []) {
  for (const asset of group.assets || []) {
    if (!assets[asset]) throw new Error(`${exceptionsPath} references unknown asset ${asset}.`);
    assets[asset].accepted_exception = {
      reason: group.reason,
      missing_fields: group.missing_fields,
      note: group.note,
    };
    if (group.public_note && !assets[asset].archive_note) assets[asset].archive_note = group.public_note;
  }
}

const generatedAt = "2026-08-05";
await writeFile(join(root, "assets/data/media-provenance.json"), `${JSON.stringify({ generated_at: generatedAt, assets }, null, 2)}\n`);
const missing = Object.entries(assets).filter(([, data]) => requiredFields.some((field) => data[field] === "")).map(([asset, data]) => ({
  asset,
  missing_fields: requiredFields.filter((field) => data[field] === ""),
  accepted_exception: data.accepted_exception || null,
}));
await writeFile(join(root, "assets/data/media-provenance-missing.json"), `${JSON.stringify({ generated_at: generatedAt, missing }, null, 2)}\n`);
console.log(`Tracked ${Object.keys(assets).length} public-source assets; ${missing.length} have accepted omitted fields.`);

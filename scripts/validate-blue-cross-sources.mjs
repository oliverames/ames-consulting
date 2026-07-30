#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const portfolioRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/Blue Cross VT";
const events = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const portraits = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));
const provenance = JSON.parse(await readFile(path.join(root, "assets/data/media-provenance.json"), "utf8"));

const keyFiles = [
  "scripts/generate-blue-cross-assets.mjs",
  "scripts/generate-event-galleries.mjs",
  "scripts/generate-portrait-gallery.mjs",
  "assets/data/media-provenance.json",
];
for (const relative of keyFiles) {
  const content = await readFile(path.join(root, relative), "utf8");
  if (content.includes("/Users/oliverames/Desktop/review for deletion")) {
    throw new Error(`${relative} references the scraped review folder.`);
  }
  if (content.includes("/Users/oliverames/Documents/BCBS/Photography")) {
    throw new Error(`${relative} references the retired Blue Cross source tree.`);
  }
}

const eventSources = new Map([
  ["corporate-cup-2026", "2026-05-14 – Corporate Cup/Edited Selects"],
  ["girls-on-the-run-2026", "2026-05-30 – GOTR/Edited Selects"],
]);
let eventTotal = 0;
for (const [slug, sourceDirectory] of eventSources) {
  const campaign = events.campaigns.find((item) => item.slug === slug);
  if (!campaign) throw new Error(`Missing ${slug} gallery data.`);
  for (const image of campaign.images) {
    if (Math.max(image.width, image.height) < 2400) {
      throw new Error(`${image.src} is below the 2400px Blue Cross gallery target.`);
    }
    const filename = path.basename(image.src, ".webp").toUpperCase();
    await access(path.join(portfolioRoot, sourceDirectory, `${filename}.jpg`));
    await access(path.join(root, image.src.replace("../../", "")));
  }
  eventTotal += campaign.images.length;
}

const blueCrossPortraits = portraits.series.find((item) => item.slug === "blue-cross-cbss");
if (!blueCrossPortraits || blueCrossPortraits.images.length < 36) {
  throw new Error("The Blue Cross portrait collection does not include all 36 approved JPG and JPEG selections.");
}
for (const image of blueCrossPortraits.images) {
  await access(path.join(root, image.src.replace("../../", "")));
}

for (const item of provenance.blueCrossVermont) {
  if (!item.source.startsWith("Ames Consulting/Portfolio/Blue Cross VT/")) {
    throw new Error(`Noncanonical provenance for ${item.asset}.`);
  }
  const source = path.join("/Users/oliverames/Documents", item.source);
  const [width, height] = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", source])).stdout
    .trim()
    .split(" ")
    .map(Number);
  if (Math.max(width, height) < 3900) throw new Error(`${source} is not a full-resolution edited JPG.`);
  await access(path.join(root, item.asset));
}

console.log(`Validated ${eventTotal} Blue Cross event photographs, ${blueCrossPortraits.images.length} portraits, and ${provenance.blueCrossVermont.length} featured images against the edited Portfolio sources.`);

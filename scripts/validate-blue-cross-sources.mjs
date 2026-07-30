#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const portfolioRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/Blue Cross VT";
const events = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const portraits = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));
const portfolioAvailable = await access(portfolioRoot).then(() => true, () => false);

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
    if (portfolioAvailable) await access(path.join(portfolioRoot, sourceDirectory, `${filename}.jpg`));
    await access(path.join(root, image.src.replace("../../", "")));
  }
  eventTotal += campaign.images.length;
}

const blueCrossPortraits = portraits.series.find((item) => item.slug === "blue-cross-cbss");
const expectedPortraits = new Set([
  "Beth Roberts",
  "Barbara Demas",
  "Ruth Greene",
  "Rebecca Heintz",
  "Margaret Pinello-White",
  "Tom Weigel, M.D.",
  "Lindsay Segale",
]);
if (!blueCrossPortraits || blueCrossPortraits.images.length !== expectedPortraits.size) {
  throw new Error("The Blue Cross portrait collection must contain the six senior team headshots and Lindsay Segale.");
}
for (const image of blueCrossPortraits.images) {
  if (!expectedPortraits.delete(image.caption)) throw new Error(`Unexpected Blue Cross portrait: ${image.caption}`);
  await access(path.join(root, image.src.replace("../../", "")));
}
if (expectedPortraits.size) throw new Error(`Missing Blue Cross portraits: ${[...expectedPortraits].join(", ")}`);

const sourceCheck = portfolioAvailable ? "against the edited Portfolio sources" : "using checked-in provenance and high-resolution derivatives";
console.log(`Validated ${eventTotal} Blue Cross event photographs and ${blueCrossPortraits.images.length} portraits ${sourceCheck}.`);

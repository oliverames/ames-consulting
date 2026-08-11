#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const portfolioRoot = process.env.AMES_BLUE_CROSS_PORTFOLIO_ROOT
  || path.join(homedir(), "Documents", "Ames Consulting", "Portfolio", "Blue Cross VT");
const events = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const portraits = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));

const expectedProjects = new Map([
  ["senior-games-press-event-2026", "2026-03-18 – Senior Games Press Event"],
  ["arrayrx-press-conference-2026", "2026-03-26 – ArrayRx Press Conference"],
  ["blue-cross-portraits", "2026-04-08 – CBSS Headshots"],
  ["walk-at-lunch-and-green-up-2026", "2026-04-29 – Walk@Lunch and GreenUp"],
  ["be-well-at-work-2026", "2026-05-06 – Be Well at Work"],
  ["corporate-cup-2026", "2026-05-14 – Corporate Cup"],
  ["girls-on-the-run-2026", "2026-05-30 – GOTR"],
]);
const workIndex = await readFile(path.join(root, "work/index.html"), "utf8");
for (const [slug] of expectedProjects) {
  await access(path.join(root, "work", slug, "index.html"));
  if (!workIndex.includes(`data-organization="blue-cross-vermont" href="${slug}/"`)) {
    throw new Error(`${slug} is not attached to the Blue Cross Vermont organization filter.`);
  }
}

const keyFiles = [
  "scripts/generate-blue-cross-assets.mjs",
  "scripts/generate-event-galleries.mjs",
  "scripts/generate-portrait-gallery.mjs",
  "assets/data/media-provenance.json",
];
for (const relative of keyFiles) {
  const content = await readFile(path.join(root, relative), "utf8");
  if (/\/Users\/[^/]+\/Desktop\/review for deletion/.test(content)) {
    throw new Error(`${relative} references the scraped review folder.`);
  }
  if (/\/Users\/[^/]+\/Documents\/BCBS\/Photography/.test(content)) {
    throw new Error(`${relative} references the retired Blue Cross source tree.`);
  }
}

const eventSources = new Map([
  ["senior-games-press-event-2026", "2026-03-18 – Senior Games Press Event/Edited Selects"],
  ["arrayrx-press-conference-2026", "2026-03-26 – ArrayRx Press Conference/Edited Selects"],
  ["walk-at-lunch-and-green-up-2026", "2026-04-29 – Walk@Lunch and GreenUp/Edited Selects"],
  ["be-well-at-work-2026", "2026-05-06 – Be Well at Work/Edited Selects"],
  ["corporate-cup-2026", "2026-05-14 – Corporate Cup/Edited Selects"],
  ["girls-on-the-run-2026", "2026-05-30 – GOTR/Edited Selects"],
]);

const requiredPrivateSources = [];
for (const [slug, sourceDirectory] of eventSources) {
  const campaign = events.campaigns.find((item) => item.slug === slug);
  if (!campaign) throw new Error(`Missing ${slug} gallery data.`);
  for (const image of campaign.images) {
    const filename = path.basename(image.src, ".webp").toUpperCase();
    requiredPrivateSources.push(path.join(portfolioRoot, sourceDirectory, `${filename}.jpg`));
  }
}
const privateSourceChecks = await Promise.all(
  requiredPrivateSources.map((filePath) => access(filePath).then(() => true, () => false)),
);
const portfolioAvailable = privateSourceChecks.length > 0 && privateSourceChecks.every(Boolean);

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

const sourceCheck = portfolioAvailable
  ? "against every required edited Portfolio source"
  : "using checked-in provenance and derivatives because the private source set is incomplete or unavailable";
console.log(`Validated ${expectedProjects.size} Blue Cross projects, ${eventTotal} event photographs, and ${blueCrossPortraits.images.length} portraits ${sourceCheck}.`);

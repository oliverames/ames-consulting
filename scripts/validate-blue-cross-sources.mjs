#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import {
  PUBLIC_HTML_FILES,
  WITHHELD_ASSET_PREFIXES,
  isAllowedPublicHtmlPath,
  isAllowedPublicImagePath,
  isWithheldPublicPath,
} from "./publication-policy.mjs";

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

const noindexPattern = /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;
for (const [slug] of expectedProjects) {
  const route = `work/${slug}/index.html`;
  const html = await readFile(path.join(root, route), "utf8");
  if (!isWithheldPublicPath(route) || isAllowedPublicHtmlPath(route)) {
    throw new Error(`${slug} must remain withheld from the public route manifest.`);
  }
  if (!noindexPattern.test(html)) {
    throw new Error(`${slug} must remain in the source tree with a noindex directive.`);
  }
}

const flightPathsRoute = "work/flight-paths/index.html";
if (
  !PUBLIC_HTML_FILES.includes(flightPathsRoute)
  || !isAllowedPublicHtmlPath(flightPathsRoute)
  || isWithheldPublicPath(flightPathsRoute)
) {
  throw new Error("Flight Paths must remain public while the Blue Cross galleries are withheld.");
}
const flightPathsHtml = await readFile(path.join(root, flightPathsRoute), "utf8");
const flightPathsMain = flightPathsHtml.match(/<main\b[\s\S]*?<\/main>/i)?.[0] || "";
if (!/BETA Technologies/.test(flightPathsMain) || /Blue Cross Vermont/.test(flightPathsMain)) {
  throw new Error("Flight Paths must be presented as BETA Technologies work.");
}
if (!/youtube-nocookie\.com\/embed\/4r5N5DjmSCU/.test(flightPathsMain)) {
  throw new Error("Flight Paths must retain its verified public YouTube embed.");
}

for (const prefix of WITHHELD_ASSET_PREFIXES) {
  await access(path.join(root, prefix));
}

function assertWithheldSourceAsset(value) {
  const relativePath = value.replace(/^(?:\.\.\/)+/, "");
  if (!isWithheldPublicPath(relativePath) || isAllowedPublicImagePath(relativePath)) {
    throw new Error(`${relativePath} must remain available in source and denied from publication.`);
  }
  return relativePath;
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
  if (campaign.published !== false) throw new Error(`${slug} must record published: false.`);
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
    await access(path.join(root, assertWithheldSourceAsset(image.src)));
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
if (blueCrossPortraits.published !== false) {
  throw new Error("The Blue Cross portrait collection must record published: false.");
}
for (const image of blueCrossPortraits.images) {
  if (!expectedPortraits.delete(image.caption)) throw new Error(`Unexpected Blue Cross portrait: ${image.caption}`);
  await access(path.join(root, assertWithheldSourceAsset(image.src)));
}
if (expectedPortraits.size) throw new Error(`Missing Blue Cross portraits: ${[...expectedPortraits].join(", ")}`);

const sourceCheck = portfolioAvailable
  ? "against every required edited Portfolio source"
  : "using checked-in provenance and derivatives because the private source set is incomplete or unavailable";
console.log(`Validated ${expectedProjects.size} withheld Blue Cross galleries, ${eventTotal} event photographs, and ${blueCrossPortraits.images.length} portraits ${sourceCheck}. Flight Paths remains public.`);

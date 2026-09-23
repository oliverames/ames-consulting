#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { sortEntriesNewestFirst } from "./project-order.mjs";
import { SERVICES } from "./site-taxonomy.mjs";

const path = new URL("../index.html", import.meta.url);
let html = await readFile(path, "utf8");

// EastRise results stay on the homepage, but their project pages were retired;
// the About page carries the same figures in its career history.
for (const href of ["eastrise/", "taylor-hoar-racing/", "eastrise-writing/"]) {
  html = html.replaceAll(`<a class="proof__link" href="work/${href}"`, '<a class="proof__link" href="about/"');
}

html = html
  .replace('<section class="practice-section">', '<section class="practice-section" id="services">')
  .replaceAll(">Get in touch</a>", ">Send me a note</a>")
  .replaceAll("Open project ↗", "Open project →")
  .replaceAll('href="work/giron-family-fall-2025/"', 'href="work/giron-family/"')
  .replaceAll("Giron Family, Fall 2025</h3>", "Giron Family Portrait Sessions</h3>")
  .replaceAll("Giron Family</h3>", "Giron Family Portrait Sessions</h3>");

const practiceGridPattern = /<ul class="practice-grid">[\s\S]*?<\/ul>/;
if (!practiceGridPattern.test(html)) throw new Error("Homepage practice grid was not found.");
const practiceCards = SERVICES.map(({ slug, title, homeDescription }, index) => `<li><article class="practice-card${index === 0 ? " practice-card--primary" : ""}"><a class="practice-card__link" href="services/${slug}/"><h3>${title}</h3><p>${homeDescription}</p><span class="practice-cta">Read how →</span></a></article></li>`).join("");
html = html.replace(practiceGridPattern, `<ul class="practice-grid">${practiceCards}</ul>`);



if (!html.includes("hero__portrait")) {
  html = html.replace(
    '<div class="hero__ctas">',
    '<figure class="hero__portrait"><img src="assets/images/about/oliver-ames-profile.webp" alt="Oliver Ames" width="1400" height="1400" loading="eager" fetchpriority="high" decoding="async"></figure><div class="hero__ctas">',
  );
}


for (const href of [
  "corporate-cup-2026/",
  "girls-on-the-run-2026/",
  "blue-cross-portraits/",
  "wheels-for-warmth/",
  "taylor-hoar-racing/",
  "eastrise-portraits/",
  "community-photography/",
]) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(new RegExp(`<a class="path-thumb" href="work/${escapedHref}"\\s*>[\\s\\S]*?<\\/a\\s*>`, "g"), "");
}


if (!html.includes("Vermont Foodbank Volunteer Day</h3>")) {
  const foodbank = `<a class="path-thumb" href="work/vermont-foodbank-volunteer-day-2026/"><div class="path-thumb__img"><img src="assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp" alt="Vermont Foodbank volunteers together in the warehouse" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Vermont Foodbank · documentary photography</span><h3 class="path-thumb__title">Vermont Foodbank Volunteer Day</h3></div></a>`;
  html = html.replace(/(<div class="path-strip">[\s\S]*?)(<\/div>\s*<a class="path-browse")/, `$1${foodbank}$2`);
}

const requestedGalleryCards = [
  ["47th NEG-ECP Conference", `<a class="path-thumb" href="work/neg-ecp-conference-2026/"><div class="path-thumb__img"><img src="assets/images/work/events/neg-ecp-conference-2026/dsc00383.webp" alt="A row of delegates listens from behind microphones and nameplates inside the Coach Barn" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">NEG-ECP · event photography</span><h3 class="path-thumb__title">47th NEG-ECP Conference</h3></div></a>`],
  ["London at Dusk", `<a class="path-thumb" href="work/london-2019/"><div class="path-thumb__img"><img src="assets/images/work/events/london-2019/dsc02427.webp" alt="Tower Bridge spanning the River Thames as late sunlight breaks through dark clouds" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">London · travel photography</span><h3 class="path-thumb__title">London at Dusk</h3></div></a>`],
  ["Whale Dance in Randolph", `<a class="path-thumb" href="work/whale-dance-randolph/"><div class="path-thumb__img"><img src="assets/images/work/events/whale-dance-randolph/dsc06299.webp" alt="Jim Sardonis's Whale Dance sculpture above a stone wall with mist drifting through distant hills" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Randolph · landscape photography</span><h3 class="path-thumb__title">Whale Dance in Randolph</h3></div></a>`],
  ["Drone Photography", `<a class="path-thumb" href="work/drone-photography/"><div class="path-thumb__img"><img src="assets/images/work/events/drone-photography/dji_0053.webp" alt="Top-down aerial view of a vehicle turning through deep snow, its tracks curving beside a fence" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Aerial · landscape photography</span><h3 class="path-thumb__title">Drone Photography</h3></div></a>`],
];
for (const [, card] of requestedGalleryCards) {
  const href = card.match(/href="([^"]+)"/)?.[1];
  if (!href) throw new Error("A requested homepage gallery card is missing its href.");
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const existingCard = new RegExp(`<a class="path-thumb" href="${escapedHref}"\\s*>[\\s\\S]*?<\\/a\\s*>`);
  if (existingCard.test(html)) {
    html = html.replace(existingCard, card);
  } else {
    html = html.replace(/(<div class="path-strip">[\s\S]*?)(<\/div>\s*<a class="path-browse")/, `$1${card}$2`);
  }
}

html = html
  .replace(/^[ \t]*<div class="software-console__brand">[\s\S]*?<\/div>\r?\n?/gm, "")
  .replace(/<div class="software-console__brand">[\s\S]*?<\/div>/g, "")
  .replace(/^[ \t]+$/gm, "");

html = html.replace(/<div class="path-strip">([\s\S]*?)<\/div>\s*<a class="path-browse"/, (match, contents) => {
  const cards = [...contents.matchAll(/<a class="path-thumb"[\s\S]*?<\/a\s*>/g)].map((item) => ({
    href: item[0].match(/href="work\/([^"]+)"/)?.[1],
    html: item[0],
  }));
  const ordered = sortEntriesNewestFirst(cards, (card) => card.href);
  return `<div class="path-strip">${ordered.map((card) => card.html).join("")}</div><a class="path-browse"`;
});

await writeFile(path, html);

#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../index.html", import.meta.url);
let html = await readFile(path, "utf8");

html = html
  .replaceAll("assets/images/work/eastrise/taylor-milk-bowl-card.webp", "assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("assets/images/work/eastrise/photography/taylor-hoar-racing/2025-04-17_19-15-59_UTC_DIjx-o5p5N0-df7a815bc6ce.webp", "assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("Taylor Hoar racing at Thunder Road", "Taylor Hoar wearing her EastRise racing suit beside her race car");

html = html.replace(
  /(<a class="path-thumb" href="work\/taylor-hoar-racing\/"\s*>[\s\S]*?)<img[\s\S]*?>/,
  '$1<img src="assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp" alt="Taylor Hoar seated in her EastRise race suit, holding her helmet in front of the No. 48 car" width="1800" height="2400" loading="lazy">',
);

html = html.replace(/<div class="proof__controls">[\s\S]*?<\/div><\/div><\/div><\/section>/, "</div></div></section>");

if (!html.includes("hero__portrait")) {
  html = html.replace(
    '<div class="hero__ctas">',
    '<figure class="hero__portrait"><img src="assets/images/about/oliver-ames-profile.webp" alt="Oliver Ames" width="1400" height="1400" loading="eager" fetchpriority="high" decoding="async"></figure><div class="hero__ctas">',
  );
}

const cards = [...html.matchAll(/<li><article class="practice-card">[\s\S]*?<\/article><\/li>/g)].map((match) => match[0]);
if (cards.length === 3) {
  const photography = cards.find((card) => card.includes("Photography and video"));
  const others = cards.filter((card) => card !== photography);
  const reordered = [photography.replace('class="practice-card"', 'class="practice-card practice-card--primary"'), ...others].join("");
  html = html.replace(/<ul class="practice-grid">[\s\S]*?<\/ul>/, `<ul class="practice-grid">${reordered}</ul>`);
}

if (!html.includes("Corporate Cup 2026</h3>")) {
  const more = `<a class="path-thumb" href="work/corporate-cup-2026/"><div class="path-thumb__img"><img src="assets/images/work/blue-cross/corporate-cup.webp" alt="Vermont Corporate Cup" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Event · documentary photography</span><h3 class="path-thumb__title">Corporate Cup 2026</h3></div></a><a class="path-thumb" href="work/girls-on-the-run-2026/"><div class="path-thumb__img"><img src="assets/images/work/events/girls-on-the-run-2026/dsc05132.webp" alt="Girls on the Run Vermont" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Event · documentary photography</span><h3 class="path-thumb__title">Girls on the Run 2026</h3></div></a><a class="path-thumb" href="work/eastrise-portraits/"><div class="path-thumb__img"><img src="assets/images/work/portraits/amy-vaughan.webp" alt="EastRise portrait" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Portrait series · photography</span><h3 class="path-thumb__title">EastRise Portraits</h3></div></a><a class="path-thumb" href="work/blue-cross-portraits/"><div class="path-thumb__img"><img src="assets/images/work/portraits/beth-roberts.webp" alt="Blue Cross Vermont portrait" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Portrait series · photography</span><h3 class="path-thumb__title">Blue Cross Portraits</h3></div></a><a class="path-thumb" href="work/giron-family-fall-2025/"><div class="path-thumb__img"><img src="assets/images/work/events/giron-family-fall-2025/dsc06125.webp" alt="Giron family fall portrait session" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Family · photography</span><h3 class="path-thumb__title">Giron Family</h3></div></a><a class="path-thumb" href="work/sweat-heart-throwdown/"><div class="path-thumb__img"><img src="assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Fitness · event photography</span><h3 class="path-thumb__title">Sweat-Heart Throwdown</h3></div></a>`;
  html = html.replace(/(<div class="path-strip">[\s\S]*?)(<\/div><a class="path-browse")/, `$1${more}$2`);
}

if (!html.includes("Vermont Foodbank Volunteer Day</h3>")) {
  const foodbank = `<a class="path-thumb" href="work/vermont-foodbank-volunteer-day-2026/"><div class="path-thumb__img"><img src="assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp" alt="Vermont Foodbank volunteers together in the warehouse" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Vermont Foodbank · documentary photography</span><h3 class="path-thumb__title">Vermont Foodbank Volunteer Day</h3></div></a>`;
  html = html.replace(/(<div class="path-strip">[\s\S]*?)(<\/div>\s*<a class="path-browse")/, `$1${foodbank}$2`);
}

/*
 * Held pending written permission. Preserve these homepage preview cards in
 * source, but do not render them until permission is documented.
 *
 * const betaSeries = `<a class="path-thumb" href="work/beta-andrew/"><div class="path-thumb__img"><img src="assets/images/work/events/beta-andrew/dsc08015.webp" alt="Andrew working beside an aircraft structure at BETA Technologies" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">BETA Technologies · workplace photography</span><h3 class="path-thumb__title">Andrew at BETA</h3></div></a><a class="path-thumb" href="work/beta-emma/"><div class="path-thumb__img"><img src="assets/images/work/events/beta-emma/dsc07894.webp" alt="Emma holding a precision measuring tool at BETA Technologies" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">BETA Technologies · workplace photography</span><h3 class="path-thumb__title">Emma at BETA</h3></div></a><a class="path-thumb" href="work/beta-ethan/"><div class="path-thumb__img"><img src="assets/images/work/events/beta-ethan/dsc08105.webp" alt="Ethan at a workbench inside BETA Technologies" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">BETA Technologies · workplace photography</span><h3 class="path-thumb__title">Ethan at BETA</h3></div></a>`;
 */
for (const slug of ["beta-andrew", "beta-emma", "beta-ethan"]) {
  html = html.replace(new RegExp(`<a class="path-thumb" href="work/${slug}/"[\\s\\S]*?</a\\s*>`), "");
}

const recentProjectOrder = [
  "girls-on-the-run-2026/",
  "corporate-cup-2026/",
  "sweat-heart-throwdown/",
  "vermont-foodbank-volunteer-day-2026/",
  "giron-family-fall-2025/",
  "taylor-hoar-racing/",
  "wheels-for-warmth/",
  "eastrise-portraits/",
  "blue-cross-portraits/",
];
html = html.replace(/<div class="path-strip">([\s\S]*?)<\/div>\s*<a class="path-browse"/, (match, contents) => {
  const cards = [...contents.matchAll(/<a class="path-thumb"[\s\S]*?<\/a\s*>/g)].map((item) => item[0]);
  const byHref = new Map(cards.map((card) => [card.match(/href="work\/([^"]+)"/)?.[1], card]));
  const ordered = recentProjectOrder.map((href) => byHref.get(href)).filter(Boolean);
  const remaining = cards.filter((card) => !ordered.includes(card));
  return `<div class="path-strip">${[...ordered, ...remaining].join("")}</div><a class="path-browse"`;
});

await writeFile(path, html);

#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../index.html", import.meta.url);
let html = await readFile(path, "utf8");

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
  const more = `<a class="path-thumb" href="work/corporate-cup-2026/"><div class="path-thumb__img"><img src="assets/images/work/blue-cross/corporate-cup.webp" alt="Vermont Corporate Cup" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Event · documentary photography</span><h3 class="path-thumb__title">Corporate Cup 2026</h3></div></a><a class="path-thumb" href="work/girls-on-the-run-2026/"><div class="path-thumb__img"><img src="assets/images/work/blue-cross/gotr.webp" alt="Girls on the Run Vermont" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Event · documentary photography</span><h3 class="path-thumb__title">Girls on the Run 2026</h3></div></a><a class="path-thumb" href="work/eastrise-portraits/"><div class="path-thumb__img"><img src="assets/images/work/portraits/amy-vaughan.webp" alt="EastRise portrait" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Portrait series · photography</span><h3 class="path-thumb__title">EastRise Portraits</h3></div></a><a class="path-thumb" href="work/blue-cross-portraits/"><div class="path-thumb__img"><img src="assets/images/work/portraits/beth-roberts.webp" alt="Blue Cross Vermont portrait" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Portrait series · photography</span><h3 class="path-thumb__title">Blue Cross Portraits</h3></div></a><a class="path-thumb" href="work/giron-family-fall-2025/"><div class="path-thumb__img"><img src="assets/images/work/events/giron-family-fall-2025/dsc06125.webp" alt="Giron family fall portrait session" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Family · photography</span><h3 class="path-thumb__title">Giron Family</h3></div></a><a class="path-thumb" href="work/sweat-heart-throwdown/"><div class="path-thumb__img"><img src="assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown" loading="lazy"></div><div class="path-thumb__body"><span class="path-thumb__meta">Fitness · event photography</span><h3 class="path-thumb__title">Sweat-Heart Throwdown</h3></div></a>`;
  html = html.replace(/(<div class="path-strip">[\s\S]*?)(<\/div><a class="path-browse")/, `$1${more}$2`);
}

await writeFile(path, html);


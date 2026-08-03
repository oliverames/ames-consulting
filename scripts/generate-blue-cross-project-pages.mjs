#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const projects = [
  ["senior-games-press-event-2026", "March 18, 2026", "Senior Games Press Event", "senior-games.webp", "Vermont Senior Games press event", "I photographed the people and public announcement behind the Vermont Senior Games partnership."],
  ["arrayrx-press-conference-2026", "March 26, 2026", "ArrayRx Press Conference", "arrayrx.webp", "ArrayRx press conference in Vermont", "I documented the ArrayRx press conference, including the speakers, partners, and public setting."],
  ["walk-at-lunch-and-green-up-2026", "April 29, 2026", "Walk@Lunch and Green Up", "walk-at-lunch.webp", "Walk@Lunch and Green Up event", "I photographed employees taking part in a workplace walk and Green Up activity in Montpelier."],
  ["be-well-at-work-2026", "May 6, 2026", "Be Well at Work", "be-well-at-work.webp", "Be Well at Work program", "I documented a workplace wellness program through the people, activities, and practical details that made it useful."],
].map(([slug, date, title, image, alt, intro]) => ({ slug, date, title, image, alt, intro }));

const nav = `<a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Work by organization</h3><ul><li><a href="../?organization=blue-cross-vermont">Blue Cross Vermont</a></li><li><a href="../?organization=eastrise">EastRise</a></li><li><a href="../?organization=beta-technologies">BETA Technologies</a></li><li><a href="../?organization=green-mountain-community-fitness">Green Mountain Community Fitness</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Photography, communication, and practical technology from Montpelier, Vermont.</p></div></div></footer>`;

const render = (project) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${project.title} | Ames Consulting</title><meta name="description" content="${project.title}, photographed for Blue Cross and Blue Shield of Vermont by Oliver Ames."><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${project.slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body>${nav}<main id="main-content" tabindex="-1"><header class="case-hero"><p class="eyebrow">Documentary photography · Blue Cross Vermont · ${project.date}</p><h1>${project.title}</h1><p>${project.intro}</p></header><section class="case-section"><h2>The project</h2><div class="case-split"><div><p>The site organizes this work by the shoot itself, while Blue Cross Vermont remains attached as the organization.</p><p class="work-item__credit">Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont.</p></div><img src="../../assets/images/work/blue-cross/${project.image}" alt="${project.alt}" loading="eager"></div></section></main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script><script type="module" src="../../assets/js/content-protection.js"></script></body></html>`;

for (const project of projects) {
  const directory = new URL(`work/${project.slug}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(
    new URL("index.html", directory),
    render(project).replace('loading="eager"', 'loading="eager" fetchpriority="high"'),
  );
}

console.log(`Generated ${projects.length} Blue Cross project pages.`);

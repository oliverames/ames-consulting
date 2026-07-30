#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexPath = new URL("work/index.html", root);
let html = await readFile(indexPath, "utf8");
html = html.replace(
  /The organization provides the context\. The work itself provides the[\s\n]*structure\./,
  "I organize this work by the campaign, shoot, or series someone would actually want to explore. Start with the newest work, or keep going into the earlier jobs that taught me how to do it.",
);

if (!html.includes('href="connecticut-college/"')) {
  const additions = `<a class="work-item" href="connecticut-college/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>2013</strong></div><span class="work-item__context">Connecticut College · 2013–2015</span><h3>Early digital storytelling</h3><p>College blogs, social content, donor events, and work on a major website redesign.</p></a><a class="work-item" href="stowe-ski-instruction/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>6 yrs</strong></div><span class="work-item__context">Stowe Mountain Resort · 2013–2019</span><h3>Teaching technical ideas in real time</h3><p>Six seasons of turning complicated physical instructions into something a skier could use on the next turn.</p></a>`;
  html = html.replace(/(<section class="work-category work-category--earlier">[\s\S]*?<div class="work-list">)/, `$1${additions}`);
}
await writeFile(indexPath, html);

const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Work by organization</h3><ul><li><a href="../blue-cross-vermont/">Blue Cross Vermont campaigns</a></li><li><a href="../eastrise/">EastRise campaigns</a></li><li><a href="../beta-technologies/">BETA Technologies campaigns</a></li><li><a href="../green-mountain-community-fitness/">Green Mountain Community Fitness</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Photography, communication, and practical technology from Montpelier, Vermont.</p></div></div></footer>`;
const page = (slug, eyebrow, title, intro, sections) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${slug}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:wght@400;500&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"><title>${title} | Ames Consulting</title></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="page">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content"><header class="case-hero"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${intro}</p></header>${sections.map(([heading, body]) => `<section class="case-section"><h2>${heading}</h2><div class="case-section__body"><p>${body}</p></div></section>`).join("")}</main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;

const pages = [
  ["connecticut-college", "Digital storytelling · 2013–2015", "Where digital storytelling became the job.", "At Connecticut College, I developed content for college blogs and social channels, supported donor events, and contributed to a major website redesign.", [["The work", "The assignment moved between writing, publishing, event support, and the practical details of a large institutional website. It was the point when something I had been doing instinctively became a profession."], ["What stayed with me", "The audience was never one group. Students, alumni, donors, and prospective families each arrived with different questions, so the work had to be clear about who it was helping and why."]]],
  ["stowe-ski-instruction", "Instruction · Stowe Mountain Resort · 2013–2019", "The explanation had to work on the next turn.", "I spent six seasons teaching alpine skiing at Stowe Mountain Resort. It was technical communication with immediate feedback.", [["The work", "Every skier brought a different body, confidence level, and way of processing an instruction. I learned to change the explanation without changing the goal, then watch the next turn to see whether it worked."], ["Why it belongs here", "That habit still shapes my work. A clear explanation is useful only when the person receiving it can do something with it."]]],
];
for (const [slug, eyebrow, title, intro, sections] of pages) {
  const directory = new URL(`work/${slug}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), page(slug, eyebrow, title, intro, sections));
}


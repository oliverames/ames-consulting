#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexPath = new URL("work/index.html", root);
let html = await readFile(indexPath, "utf8");
const featuredImages = new Map([
  ["girls-on-the-run-2026/", ["../assets/images/work/events/girls-on-the-run-2026/dsc03810.webp", "Girls on the Run participants starting together"]],
  ["corporate-cup-2026/", ["../assets/images/work/events/corporate-cup-2026/dsc03213.webp", "Blue Cross Vermont team at the Corporate Cup"]],
  ["vermont-foodbank-volunteer-day-2026/", ["../assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08397.webp", "Mary volunteering at the Vermont Foodbank"]],
  ["beta-andrew/", ["../assets/images/work/events/beta-andrew/dsc08088.webp", "Andrew at BETA Technologies"]],
  ["beta-emma/", ["../assets/images/work/events/beta-emma/dsc07933.webp", "Emma at BETA Technologies"]],
  ["beta-ethan/", ["../assets/images/work/events/beta-ethan/dsc08199.webp", "Ethan at BETA Technologies"]],
  ["eastrise-portraits/", ["../assets/images/work/portraits/gallery/eastrise/christin-canter-b3dee8c4b314.webp", "Portrait of Christin Canter"]],
  ["sweat-heart-throwdown/", ["../assets/images/work/gmcf/sweat-heart/dsc01171.webp", "Sweat-Heart Throwdown at Green Mountain Community Fitness"]],
]);
html = html.replace(
  /The organization provides the context\. The work itself provides the[\s\n]*structure\./,
  "I organize this work by the campaign, shoot, or series someone would actually want to explore. Start with the newest work, or keep going into the earlier jobs that taught me how to do it.",
);

if (!html.includes('href="connecticut-college/"')) {
  const additions = `<a class="work-item" href="connecticut-college/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>2013</strong></div><span class="work-item__context">Connecticut College · 2013–2015</span><h3>Early digital storytelling</h3><p>College blogs, social content, donor events, and work on a major website redesign.</p></a><a class="work-item" href="stowe-ski-instruction/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>6 yrs</strong></div><span class="work-item__context">Stowe Mountain Resort · 2013–2019</span><h3>Teaching technical ideas in real time</h3><p>Six seasons of turning complicated physical instructions into something a skier could use on the next turn.</p></a>`;
  html = html.replace(/(<section class="work-category work-category--earlier">[\s\S]*?<div class="work-list">)/, `$1${additions}`);
}

const organizationByHref = new Map([
  ["girls-on-the-run-2026/", "blue-cross-vermont"],
  ["corporate-cup-2026/", "blue-cross-vermont"],
  ["flight-paths/", "blue-cross-vermont"],
  ["blue-cross-portraits/", "blue-cross-vermont"],
  ["vermont-foodbank-volunteer-day-2026/", "vermont-foodbank"],
  ["beta-andrew/", "beta-technologies"],
  ["beta-emma/", "beta-technologies"],
  ["beta-ethan/", "beta-technologies"],
  ["eastrise-portraits/", "eastrise"],
  ["member-banking-stories/", "eastrise"],
  ["eastrise-social/", "eastrise"],
  ["eastrise-writing/", "eastrise"],
  ["wheels-for-warmth/", "eastrise"],
  ["taylor-hoar-racing/", "eastrise"],
  ["bike-fitting/", "green-mountain-community-fitness"],
  ["sweat-heart-throwdown/", "green-mountain-community-fitness"],
  ["eastrise-launch-campaign/", "eastrise"],
  ["vsecu-website/", "eastrise"],
  ["eastrise-website/", "eastrise"],
  ["live-broadcasts/", "eastrise"],
  ["vtdigger-membership/", "vtdigger"],
  ["fairbanks-planetarium/", "fairbanks-museum"],
  ["connecticut-college/", "connecticut-college"],
  ["stowe-ski-instruction/", "stowe-mountain-resort"],
]);

const projectOrder = [
  "girls-on-the-run-2026/",
  "corporate-cup-2026/",
  "flight-paths/",
  "blue-cross-portraits/",
  "vermont-foodbank-volunteer-day-2026/",
  "beta-andrew/",
  "beta-emma/",
  "beta-ethan/",
  "sweat-heart-throwdown/",
  "member-banking-stories/",
  "giron-family-fall-2025/",
  "wheels-for-warmth/",
  "taylor-hoar-racing/",
  "eastrise-social/",
  "eastrise-writing/",
  "bike-fitting/",
  "live-broadcasts/",
  "eastrise-portraits/",
  "eastrise-website/",
  "eastrise-launch-campaign/",
  "vsecu-website/",
  "vtdigger-membership/",
  "stowe-ski-instruction/",
  "fairbanks-planetarium/",
  "connecticut-college/",
];

const campaignSectionPattern = /(<section class="work-category">\s*<h2(?: id="project-list-title")?>(?:Campaigns and series|All projects)<\/h2>(?:<p class="work-filter-status" id="work-filter-status" hidden><\/p>)?\s*<div class="work-list">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/;
const earlierSectionPattern = /<section class="work-category work-category--earlier">\s*<h2>Earlier work<\/h2>\s*<div class="work-list">([\s\S]*?)\s*<\/div>\s*<\/section>/;
const campaignMatch = html.match(campaignSectionPattern);
const earlierMatch = html.match(earlierSectionPattern);

if (campaignMatch && earlierMatch) {
  const cards = [...`${campaignMatch[2]}${earlierMatch[1]}`.matchAll(/<a class="work-item" href="([^"]+)"[\s\S]*?<\/a\s*>/g)]
    .map((match) => ({ href: match[1], html: match[0] }));
  const rank = new Map(projectOrder.map((href, index) => [href, index]));
  const cardRank = (href) => href.startsWith("eastrise-photography/") ? 12.5 : (rank.get(href) ?? 999);
  cards.sort((left, right) => cardRank(left.href) - cardRank(right.href));

  const markedCards = cards.map((card) => {
    const explicitOrganization = organizationByHref.get(card.href);
    const inferredOrganization = card.href.startsWith("eastrise-photography/") ? "eastrise" : "";
    const organization = explicitOrganization || inferredOrganization;
    let cardHtml = card.html;
    const feature = featuredImages.get(card.href);
    if (feature) {
      cardHtml = cardHtml.replace(/<img\s+src="[^"]+"\s+alt="[^"]*"/, `<img src="${feature[0]}" alt="${feature[1]}"`);
    }
    return organization
      ? cardHtml.replace('<a class="work-item"', `<a class="work-item" data-organization="${organization}"`)
      : cardHtml;
  }).join("");

  html = html.replace(
    campaignSectionPattern,
    (_section, _opening, _cards, closing) => `<section class="work-category"><h2 id="project-list-title">All projects</h2><nav class="work-filters" aria-label="Filter projects by organization"><a href="./" data-work-filter="all">All</a><a href="?organization=blue-cross-vermont" data-work-filter="blue-cross-vermont">Blue Cross Vermont</a><a href="?organization=eastrise" data-work-filter="eastrise">EastRise</a><a href="?organization=beta-technologies" data-work-filter="beta-technologies">BETA Technologies</a><a href="?organization=green-mountain-community-fitness" data-work-filter="green-mountain-community-fitness">GMCF</a></nav><p class="work-filter-status" id="work-filter-status" hidden></p><div class="work-list">${markedCards}${closing}`,
  );
  html = html.replace(earlierSectionPattern, "");
}

html = html.replace(
  /\s*<section class="work-category">\s*<h2>Client and institutional work<\/h2>[\s\S]*?<\/section>/,
  "",
);

if (!html.includes('src="../assets/js/work-filter.js"')) {
  html = html.replace(
    "</body>",
    '    <script type="module" src="../assets/js/work-filter.js"></script>\n  </body>',
  );
}
html = html.replace(/[ \t]+$/gm, "");
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

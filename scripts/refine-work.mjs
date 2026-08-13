#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { sortEntriesNewestFirst } from "./project-order.mjs";

const root = new URL("../", import.meta.url);
const indexPath = new URL("work/index.html", root);
const eastRiseHubPath = new URL("work/eastrise/index.html", root);
const eastRiseWritingPath = new URL("work/eastrise-writing/index.html", root);
let html = await readFile(indexPath, "utf8");
const existingPortraitCards = [...html.matchAll(/<section class="work-category work-category--portraits">[\s\S]*?<div class="work-list">([\s\S]*?)<\/div>\s*<\/section>/g)].map((match) => match[1]).join("");
const portraitFallbackCards = existingPortraitCards || `<a class="work-item" href="eastrise-portraits/"><img src="../assets/images/work/portraits/gallery/eastrise/christin-canter-b3dee8c4b314.webp" alt="Portrait of Christin Canter" loading="lazy"><span class="work-item__context">EastRise · 42 formal portraits</span><h3>EastRise Portraits</h3><p>Forty-two formal portraits of 41 people, organized into Leadership and Portraits galleries.</p></a>`;
html = html.replace(/<section class="work-category work-category--portraits">[\s\S]*?<\/section>/g, "");
const featuredImages = new Map([
  ["neg-ecp-conference-2026/", ["../assets/images/work/events/neg-ecp-conference-2026/dsc01378.webp", "A summit delegate gestures while speaking beneath United States and Canadian flags inside the Coach Barn"]],
  ["vermont-foodbank-volunteer-day-2026/", ["../assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08397.webp", "Mary volunteering at the Vermont Foodbank"]],
  ["london-2019/", ["../assets/images/work/events/london-2019/dsc02427.webp", "Tower Bridge spanning the River Thames as late sunlight breaks through dark clouds"]],
  ["whale-dance-randolph/", ["../assets/images/work/events/whale-dance-randolph/dsc06299.webp", "Jim Sardonis's Whale Dance sculpture above a stone wall with mist drifting through distant hills"]],
  ["drone-photography/", ["../assets/images/work/events/drone-photography/dji_0053.webp", "Top-down aerial view of a vehicle turning through deep snow, its tracks curving beside a fence"]],
  ["eastrise-portraits/", ["../assets/images/work/portraits/gallery/eastrise/christin-canter-b3dee8c4b314.webp", "Portrait of Christin Canter"]],
  ["sweat-heart-throwdown/", ["../assets/images/work/gmcf/sweat-heart/dsc01171.webp", "Sweat-Heart Throwdown at Green Mountain Community Fitness"]],
  ["wheels-for-warmth/", ["../assets/images/work/eastrise/photography/wheels-for-warmth-2024/2024-10-26_13-50-10_UTC_DBlvKpKtVEU_1-05c3cca5b111.webp", "A Wheels for Warmth volunteer waves during the 2024 tire collection"]],
  ["taylor-hoar-racing/", ["../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp", "Taylor Hoar seated in her EastRise race suit, holding her helmet in front of the No. 48 car"]],
]);
html = html.replace(
  /(?:Campaigns and series built around a useful story\.|I organize the work by project, not job title\.|Photography, video, communications, websites, and software\.|Work organized by project, not job title\.)/,
  "Here’s the work, newest first.",
);
html = html.replace(
  /(?:The organization provides the context\. The work itself provides the[\s\n]*structure\.|I organize this work by the campaign, shoot, or series someone would actually want to explore\. Start with the newest work, or keep going into the earlier jobs that taught me how to do it\.|The newest projects come first\. Each card names the organization and my role\.|Each campaign, shoot, and series has its own place\. Start with the newest work, or continue into the earlier jobs that taught me how to do it\.)/,
  "The projects include photography, video, communications, websites, and software. Each card names the organization and my role.",
);

if (!html.includes('href="connecticut-college/"')) {
  const additions = `<a class="work-item" href="connecticut-college/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>2013</strong></div><span class="work-item__context">Connecticut College · 2013–2015</span><h3>Connecticut College</h3><p>I wrote college blogs and social content, covered donor events, and worked on a major website redesign.</p></a><a class="work-item" href="stowe-ski-instruction/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>6 yrs</strong></div><span class="work-item__context">Stowe Mountain Resort · 2013–2019</span><h3>Stowe ski instruction</h3><p>I taught skiing at Stowe for six seasons.</p></a>`;
  html = html.replace(/(<section class="work-category work-category--earlier">[\s\S]*?<div class="work-list">)/, `$1${additions}`);
}

const organizationByHref = new Map([
  ["neg-ecp-conference-2026/", "gbic"],
  ["flight-paths/", "beta-technologies"],
  ["vermont-foodbank-volunteer-day-2026/", "vermont-foodbank"],
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

const inHouseCredits = {
  "blue-cross-vermont": "Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont.",
  eastrise: "Made as Digital Content Strategist, EastRise Credit Union.",
};
// Era-accurate overrides: the Digital Content Strategist title began in 2022,
// so 2021-and-earlier VSECU work carries the title held at the time.
const creditOverridesByHref = new Map([
  ["vsecu-website/", "Made as Social Media Specialist, VSECU (now EastRise Credit Union)."],
]);
const inHouseDescriptions = new Map([
  ["flight-paths/", "I produced this documentary about a person finding her way into Vermont’s growing aviation sector."],
  ["member-banking-stories/", "I co-produced eleven EastRise films, including nine with Urban Rhino."],
  ["wheels-for-warmth/", "I photographed the 2024 collection day, then planned and ran the 2025 public-service campaign."],
  ["taylor-hoar-racing/", "I covered the sponsorship through racing, portraits, community events, social posts, local history, and performance reports."],
  ["eastrise-social/", "I led this dated archive of member stories, community coverage, campaigns, and lighter posts."],
  ["eastrise-writing/", "I wrote 53 financial education articles for VSECU and EastRise."],
  ["eastrise-portraits/", "I built this in-house formal portrait library for public profiles and organizational communications."],
  ["eastrise-website/", "I worked on content, photography, migration, implementation, and quality assurance for the EastRise launch."],
  ["eastrise-launch-campaign/", "I co-produced the EastRise launch, selected talent and locations, and made the still photographs."],
  ["vsecu-website/", "I worked on content, imagery, migration, implementation, and quality assurance for the VSECU redesign."],
  ["live-broadcasts/", "I hosted and produced public and employee broadcasts about leadership updates and financial results."],
]);
const consultingHrefs = new Set(["flight-paths/"]);
const legacyCardCopy = new Map([
  ["stowe-ski-instruction/", ["Stowe ski instruction", "I taught alpine skiing at Stowe for six seasons."]],
  ["vtdigger-membership/", ["VTDigger membership", "I simplified the donation page and ran the tests that increased membership conversion by 137%."]],
  ["fairbanks-planetarium/", ["Fairbanks Museum Planetarium", "I ran the planetarium and helped organize a Guinness World Record astronomy lesson."]],
  ["connecticut-college/", ["Connecticut College", "I wrote college blogs and social content, covered donor events, and worked on a major website redesign."]],
]);

// Must tolerate every artifact of this script's own previous run: the framing
// paragraph inserted after the heading, the filters nav, and the filter
// status element. Otherwise the second build silently freezes all curated
// ordering, descriptions, and organization tagging.
const campaignSectionPattern = /(<section class="work-category">\s*<h2(?: id="project-list-title")?>(?:Campaigns and series|All projects|Projects)<\/h2>(?:<p class="work-category__framing">[\s\S]*?<\/p>)?(?:<nav class="work-filters"[\s\S]*?<\/nav>)?(?:<p class="work-filter-status" id="work-filter-status" hidden><\/p>)?\s*<div class="work-list">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/;
const earlierSectionPattern = /<section class="work-category work-category--earlier">\s*<h2>(?:Earlier work|Legacy work)<\/h2>\s*<div class="work-list">([\s\S]*?)\s*<\/div>\s*<\/section>/;
if (!html.includes('href="neg-ecp-conference-2026/"')) {
  const card = `<a class="work-item" href="neg-ecp-conference-2026/"><img src="../assets/images/work/events/neg-ecp-conference-2026/dsc01378.webp" alt="A summit delegate gestures while speaking beneath United States and Canadian flags inside the Coach Barn" loading="lazy"><span class="work-item__context">NEG-ECP · August 2026</span><h3>47th NEG-ECP Conference</h3><p>Thirty-five photographs from the regional summit at Shelburne Farms, from setup through the press conference.</p></a>`;
  html = html.replace(campaignSectionPattern, (_section, opening, cards, closing) => `${opening}${card}${cards}${closing}`);
}
const campaignMatch = html.match(campaignSectionPattern);
const earlierMatch = html.match(earlierSectionPattern);

if (!campaignMatch) {
  console.warn("refine-work: campaign section pattern did not match work/index.html — curated ordering, descriptions, and organization tags were NOT applied.");
}

if (campaignMatch) {
  // Remove the original earlier/legacy section before the campaign rewrite
  // appends a fresh Legacy section; replacing afterwards would delete the
  // freshly built section (the first match) and keep the stale one.
  if (earlierMatch) html = html.replace(earlierSectionPattern, "");
  const cards = [...`${campaignMatch[2]}${portraitFallbackCards}${earlierMatch?.[1] ?? ""}`.matchAll(/<a class="work-item"[^>]*href="([^"]+)"[\s\S]*?<\/a\s*>/g)]
    .map((match) => ({ href: match[1], html: match[0] }));
  const orderedCards = sortEntriesNewestFirst(cards, (card) => card.href);

  const legacyHrefs = new Set(["vtdigger-membership/", "stowe-ski-instruction/", "fairbanks-planetarium/", "connecticut-college/"]);
  const currentCards = orderedCards.filter((card) => !legacyHrefs.has(card.href));
  const legacyCards = orderedCards.filter((card) => legacyHrefs.has(card.href));
  const prepareCard = (card) => {
    const explicitOrganization = organizationByHref.get(card.href);
    const inferredOrganization = card.href.startsWith("eastrise-photography/") ? "eastrise" : "";
    const organization = explicitOrganization || inferredOrganization;
    let cardHtml = card.html.replace(/ data-organization="[^"]+"/g, "");
    const legacyCopy = legacyCardCopy.get(card.href);
    if (legacyCopy) {
      cardHtml = cardHtml
        .replace(/<h3>[\s\S]*?<\/h3>/, `<h3>${legacyCopy[0]}</h3>`)
        .replace(/<p>[\s\S]*?<\/p>/, `<p>${legacyCopy[1]}</p>`);
    }
    const feature = featuredImages.get(card.href);
    if (feature) {
      // Rebuild the whole tag: swapping only src/alt would leave the previous
      // image's width/height attributes attached to the new file.
      // apply-image-dimensions.mjs re-measures downstream.
      cardHtml = cardHtml.replace(/<img[^>]*>/, `<img src="${feature[0]}" alt="${feature[1]}" loading="lazy">`);
    }
    if (card.href === "eastrise-portraits/") {
      cardHtml = cardHtml.replace(
        /<span class="work-item__context">[\s\S]*?<\/span>/,
        '<span class="work-item__context">EastRise · 42 formal portraits</span>',
      );
    }
    // Strip any credit inserted by a previous run so the description replace
    // below cannot stack a second credit paragraph.
    cardHtml = cardHtml.replace(/<p class="work-item__credit">[\s\S]*?<\/p>/g, "");
    const credit = consultingHrefs.has(card.href) ? "" : (creditOverridesByHref.get(card.href) || inHouseCredits[organization]);
    if (credit) {
      const description = inHouseDescriptions.get(card.href);
      cardHtml = description
        ? cardHtml.replace(/<p>[\s\S]*?<\/p>/, `<p>${description}</p><p class="work-item__credit">${credit}</p>`)
        : cardHtml.replace(/(<p>[\s\S]*?<\/p>)/, `$1<p class="work-item__credit">${credit}</p>`);
    }
    return organization
      ? cardHtml.replace('<a class="work-item"', `<a class="work-item" data-organization="${organization}"`)
      : cardHtml;
  };
  const withheldGalleryHrefs = new Set([
    "senior-games-press-event-2026/",
    "arrayrx-press-conference-2026/",
    "walk-at-lunch-and-green-up-2026/",
    "be-well-at-work-2026/",
    "corporate-cup-2026/",
    "girls-on-the-run-2026/",
    "blue-cross-portraits/",
  ]);
  const publishableCards = currentCards.filter((card) => !withheldGalleryHrefs.has(card.href));
  const portraitHrefs = new Set(["eastrise-portraits/"]);
  const markedCards = publishableCards.filter((card) => !portraitHrefs.has(card.href)).map(prepareCard).join("");
  const portraitCards = publishableCards.filter((card) => portraitHrefs.has(card.href)).map(prepareCard).join("");
  const markedLegacyCards = legacyCards.map(prepareCard).join("");

  html = html.replace(
    campaignSectionPattern,
    (_section, _opening, _cards, closing) => `<section class="work-category"><h2 id="project-list-title">Projects</h2><nav class="work-filters" aria-label="Filter projects by organization"><a href="./" data-work-filter="all">All</a><a href="?organization=beta-technologies" data-work-filter="beta-technologies">BETA</a><a href="?organization=eastrise" data-work-filter="eastrise">EastRise</a><a href="?organization=green-mountain-community-fitness" data-work-filter="green-mountain-community-fitness">GMCF</a></nav><p class="work-filter-status" id="work-filter-status" hidden></p><div class="work-list">${markedCards}${closing}<section class="work-category work-category--portraits"><h2>Portraits</h2><div class="work-list">${portraitCards}</div></section><section class="work-category work-category--earlier"><h2>Legacy work</h2><div class="work-list">${markedLegacyCards}</div></section>`,
  );
  html = html.replace(
    '<h2 id="project-list-title">Projects</h2><nav class="work-filters"',
    '<h2 id="project-list-title">Projects</h2><p class="work-category__framing">These include in-house projects at EastRise Credit Union and BETA Technologies, plus commissioned work. Each card names the organization and my role.</p><nav class="work-filters"',
  );
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

let eastRiseHubHtml = await readFile(eastRiseHubPath, "utf8");
eastRiseHubHtml = eastRiseHubHtml
  .replaceAll("Portfolio update", "VSECU and EastRise · 2019–2025")
  .replaceAll("EastRise work is now organized by campaign.", "Work for VSECU and EastRise Credit Union")
  .replace(
    /This address remains available for old links\. Choose the body of work\s+you want to see\./,
    "I worked on campaigns, films, articles, social content, and website projects for VSECU and EastRise. This page links to each project.",
  );
for (const expected of [
  "VSECU and EastRise · 2019–2025",
  "Work for VSECU and EastRise Credit Union",
  "This page links to each project.",
]) {
  if (!eastRiseHubHtml.includes(expected)) {
    throw new Error(`refine-work: EastRise hub copy did not match: ${expected}`);
  }
}
await writeFile(eastRiseHubPath, eastRiseHubHtml);

let eastRiseWritingHtml = await readFile(eastRiseWritingPath, "utf8");
eastRiseWritingHtml = eastRiseWritingHtml
  .replaceAll("Fifty-three explanations built for real financial decisions.", "Fifty-three articles for VSECU and EastRise")
  .replaceAll(
    "I wrote about the questions people were actually facing: stimulus checks, fraud, debt, electric vehicles, home energy, budgeting, travel, and life in Vermont. This is the complete attributable archive.",
    "I wrote these articles between 2019 and 2025. They cover stimulus checks, fraud, debt, electric vehicles, home energy, budgeting, travel, and life in Vermont.",
  );
for (const expected of [
  "Fifty-three articles for VSECU and EastRise",
  "I wrote these articles between 2019 and 2025.",
]) {
  if (!eastRiseWritingHtml.includes(expected)) {
    throw new Error(`refine-work: EastRise writing copy did not match: ${expected}`);
  }
}
const unavailableArticleLink = /<li><a href="https:\/\/www\.eastrise\.com\/blog\/a-comprehensive-guide-ev-charging-apps\/" rel="noopener"><span>Technology &amp; Banking · Archived article<\/span><h2>A Comprehensive Guide to EV Charging Apps<\/h2><small>Original EastRise URL is no longer available<\/small><\/a><\/li>/;
const unavailableArticle = '<li><div class="writing-list__unavailable"><span>Technology &amp; Banking · Archived article</span><h2>A Comprehensive Guide to EV Charging Apps</h2><small>EastRise no longer publishes this article</small></div></li>';
if (unavailableArticleLink.test(eastRiseWritingHtml)) {
  eastRiseWritingHtml = eastRiseWritingHtml.replace(unavailableArticleLink, unavailableArticle);
} else if (!eastRiseWritingHtml.includes(unavailableArticle)) {
  throw new Error("refine-work: unavailable EastRise article markup did not match.");
}
eastRiseWritingHtml = eastRiseWritingHtml.replace(
  "Links go to the current EastRise versions. One migrated article is retained by title even though its original URL now returns a 404.",
  "Links go to the current EastRise versions. One article is retained by title because EastRise no longer publishes it.",
);
await writeFile(eastRiseWritingPath, eastRiseWritingHtml);

// apply-shared-ui.mjs later normalizes the colophon and Company column
// site-wide; this template just needs the same skeleton as its siblings.
const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Work by organization</h3><ul><li><a href="../blue-cross-vermont/">Blue Cross Vermont campaigns</a></li><li><a href="../eastrise/">EastRise campaigns</a></li><li><a href="../green-mountain-community-fitness/">Green Mountain Community Fitness</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Photography, communication, and practical technology from Montpelier, Vermont.</p></div></div></footer>`;
// Head/nav/main chrome mirrors generate-career-work-pages.mjs so these two
// late-generated pages stay identical to their siblings (CSP, referrer,
// view-transition, preconnects, ital Lora URL, Testimonials nav, tabindex).
const page = (slug, eyebrow, title, intro, sections) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; frame-src https://www.youtube-nocookie.com; form-action 'self';"><title>${title} | Ames Consulting</title><meta name="description" content="${intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1"><header class="case-hero"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${intro}</p></header>${sections.map(([heading, body]) => `<section class="case-section"><h2>${heading}</h2><div class="case-section__body"><p>${body}</p></div></section>`).join("")}</main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;

const pages = [
  ["connecticut-college", "Digital communications · 2013–2015", "Connecticut College", "At Connecticut College, I developed content for college blogs and social channels, supported donor events, and contributed to a major website redesign.", [["The work", "I wrote and published content, supported events, and worked on the practical details of a large institutional website. This was where digital communications became my job."], ["The audiences", "Students, alumni, donors, and prospective families came to the college with different questions, so the content had to account for who was reading it."]]],
  ["stowe-ski-instruction", "Instruction · Stowe Mountain Resort · 2013–2019", "Six seasons of ski instruction", "I spent six seasons teaching alpine skiing at Stowe Mountain Resort. It was technical communication with immediate feedback.", [["The work", "Every skier brought a different body, confidence level, and way of processing an instruction. I learned to change the explanation without changing the goal, then watch the next turn to see whether it worked."], ["What I learned", "An explanation only worked when the skier could use it on the next turn."]]],
];
for (const [slug, eyebrow, title, intro, sections] of pages) {
  const directory = new URL(`work/${slug}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), page(slug, eyebrow, title, intro, sections));
}

#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const indexPath = new URL("work/index.html", root);
const eastRiseWritingPath = new URL("work/eastrise-writing/index.html", root);
let html = await readFile(indexPath, "utf8");
const blueCrossProjectCards = [
  ["senior-games-press-event-2026/", "senior-games-card.webp", "Vermont Senior Games press event", "Blue Cross Vermont · March 18, 2026", "Senior Games Press Event", "I photographed the people and public announcement behind the Vermont Senior Games partnership."],
  ["arrayrx-press-conference-2026/", "arrayrx-card.webp", "ArrayRx press conference in Vermont", "Blue Cross Vermont · March 26, 2026", "ArrayRx Press Conference", "I photographed the speakers, partners, and public announcement at the ArrayRx press conference."],
  ["walk-at-lunch-and-green-up-2026/", "walk-at-lunch-card.webp", "Walk@Lunch and Green Up event", "Blue Cross Vermont · April 29, 2026", "Walk@Lunch and Green Up", "I photographed a workplace walk and Green Up activity in Montpelier."],
  ["be-well-at-work-2026/", "be-well-at-work-card.webp", "Be Well at Work program", "Blue Cross Vermont · May 6, 2026", "Be Well at Work", "I photographed the people and activities in a workplace wellness program."],
];
for (const [href, image, alt, context, title, description] of blueCrossProjectCards) {
  if (!html.includes(`href="${href}"`)) {
    html = html.replace(/(<section class="work-category">[\s\S]*?<div class="work-list">)/, `$1<a class="work-item" href="${href}"><img src="../assets/images/work/blue-cross/${image}" alt="${alt}" loading="lazy"><span class="work-item__context">${context}</span><h3>${title}</h3><p>${description}</p></a>`);
  }
}
const existingPortraitCards = [...html.matchAll(/<section class="work-category work-category--portraits">[\s\S]*?<div class="work-list">([\s\S]*?)<\/div>\s*<\/section>/g)].map((match) => match[1]).join("");
const portraitFallbackCards = existingPortraitCards || `<a class="work-item" href="eastrise-portraits/"><img src="../assets/images/work/portraits/gallery/eastrise/christin-canter-b3dee8c4b314.webp" alt="Portrait of Christin Canter" loading="lazy"><span class="work-item__context">EastRise · 2024–2025</span><h3>EastRise Portraits</h3><p>Leadership, board, and staff portraits built as one coherent public library.</p></a><a class="work-item" href="blue-cross-portraits/"><img src="../assets/images/work/portraits/gallery/blue-cross/beth-roberts-executive.webp" alt="Portrait of Beth Roberts" loading="lazy"><span class="work-item__context">Blue Cross Vermont · 2026</span><h3>Blue Cross Portraits</h3><p>Senior-team and staff portraits made for public profiles and organizational storytelling.</p></a>`;
html = html.replace(/<section class="work-category work-category--portraits">[\s\S]*?<\/section>/g, "");
const featuredImages = new Map([
  ["senior-games-press-event-2026/", ["../assets/images/work/blue-cross/senior-games-card.webp", "Vermont Senior Games press event"]],
  ["arrayrx-press-conference-2026/", ["../assets/images/work/blue-cross/arrayrx-card.webp", "ArrayRx press conference in Vermont"]],
  ["walk-at-lunch-and-green-up-2026/", ["../assets/images/work/blue-cross/walk-at-lunch-card.webp", "Walk@Lunch and Green Up event"]],
  ["be-well-at-work-2026/", ["../assets/images/work/blue-cross/be-well-at-work-card.webp", "Be Well at Work program"]],
  ["girls-on-the-run-2026/", ["../assets/images/work/events/girls-on-the-run-2026/dsc03810.webp", "Girls on the Run participants starting together"]],
  ["corporate-cup-2026/", ["../assets/images/work/events/corporate-cup-2026/dsc03213.webp", "Blue Cross Vermont team at the Corporate Cup"]],
  ["vermont-foodbank-volunteer-day-2026/", ["../assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08397.webp", "Mary volunteering at the Vermont Foodbank"]],
  ["eastrise-portraits/", ["../assets/images/work/portraits/gallery/eastrise/christin-canter-b3dee8c4b314.webp", "Portrait of Christin Canter"]],
  ["sweat-heart-throwdown/", ["../assets/images/work/gmcf/sweat-heart/dsc01171.webp", "Sweat-Heart Throwdown at Green Mountain Community Fitness"]],
]);
html = html.replace(
  "Campaigns and series built around a useful story.",
  "I organize the work by project, not job title.",
);
html = html.replace(
  /The organization provides the context\. The work itself provides the[\s\n]*structure\./,
  "I organize this work by the campaign, shoot, or series someone would actually want to explore. Start with the newest work, or keep going into the earlier jobs that taught me how to do it.",
);

if (!html.includes('href="connecticut-college/"')) {
  const additions = `<a class="work-item" href="connecticut-college/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>2013</strong></div><span class="work-item__context">Connecticut College · 2013–2015</span><h3>Early digital storytelling</h3><p>College blogs, social content, donor events, and work on a major website redesign.</p></a><a class="work-item" href="stowe-ski-instruction/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>6 yrs</strong></div><span class="work-item__context">Stowe Mountain Resort · 2013–2019</span><h3>Teaching technical ideas in real time</h3><p>Six seasons of turning complicated physical instructions into something a skier could use on the next turn.</p></a>`;
  html = html.replace(/(<section class="work-category work-category--earlier">[\s\S]*?<div class="work-list">)/, `$1${additions}`);
}

const organizationByHref = new Map([
  ["senior-games-press-event-2026/", "blue-cross-vermont"],
  ["arrayrx-press-conference-2026/", "blue-cross-vermont"],
  ["walk-at-lunch-and-green-up-2026/", "blue-cross-vermont"],
  ["be-well-at-work-2026/", "blue-cross-vermont"],
  ["girls-on-the-run-2026/", "blue-cross-vermont"],
  ["corporate-cup-2026/", "blue-cross-vermont"],
  ["flight-paths/", "blue-cross-vermont"],
  ["blue-cross-portraits/", "blue-cross-vermont"],
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
  ["senior-games-press-event-2026/", "I photographed the people and public announcement behind the Vermont Senior Games partnership."],
  ["arrayrx-press-conference-2026/", "I documented the ArrayRx press conference, including the speakers, partners, and public setting."],
  ["walk-at-lunch-and-green-up-2026/", "I photographed employees taking part in a workplace walk and Green Up activity in Montpelier."],
  ["be-well-at-work-2026/", "I documented a workplace wellness program through the people, activities, and practical details that made it useful."],
  ["girls-on-the-run-2026/", "I documented the full Vermont 5K in-house, building a 185-image library around the runners, volunteers, and Blue Cross presence."],
  ["corporate-cup-2026/", "I photographed the Blue Cross team in-house across the course, the crowd, and the rain-soaked finish in downtown Montpelier."],
  ["flight-paths/", "I produced this in-house video series around the people finding their way into Vermont’s growing aviation sector."],
  ["blue-cross-portraits/", "I built this in-house portrait collection for senior-team profiles and organizational storytelling."],
  ["wheels-for-warmth/", "I built this in-house public-service campaign around clear donation guidance, event coverage, and measurable social performance."],
  ["taylor-hoar-racing/", "I ran this in-house sponsorship story across race days, portrait sessions, social publishing, local history, and performance reporting."],
  ["eastrise-social/", "I led six years of in-house social publishing across member stories, community coverage, campaigns, and timely lighter moments."],
  ["eastrise-writing/", "I wrote this in-house financial-education archive to make complicated member decisions useful and understandable."],
  ["eastrise-portraits/", "I built this in-house leadership and board portrait system for public profiles and organizational communications."],
  ["eastrise-website/", "I helped launch this in-house public website through content strategy, photography, migration, implementation, and quality assurance."],
  ["eastrise-launch-campaign/", "I co-produced this in-house brand launch, selected talent and locations, and made the still photography that carried the new institution into public view."],
  ["vsecu-website/", "I helped deliver this in-house redesign through content, imagery, migration, implementation support, and quality assurance."],
  ["live-broadcasts/", "I hosted and produced these in-house broadcasts, translating leadership updates and financial results for public and employee audiences."],
]);
const consultingHrefs = new Set(["flight-paths/"]);

const projectOrder = [
  "girls-on-the-run-2026/",
  "corporate-cup-2026/",
  "be-well-at-work-2026/",
  "walk-at-lunch-and-green-up-2026/",
  "arrayrx-press-conference-2026/",
  "senior-games-press-event-2026/",
  "flight-paths/",
  "blue-cross-portraits/",
  "vermont-foodbank-volunteer-day-2026/",
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

// Must tolerate every artifact of this script's own previous run: the framing
// paragraph inserted after the heading, the filters nav, and the filter
// status element. Otherwise the second build silently freezes all curated
// ordering, descriptions, and organization tagging.
const campaignSectionPattern = /(<section class="work-category">\s*<h2(?: id="project-list-title")?>(?:Campaigns and series|All projects|Projects)<\/h2>(?:<p class="work-category__framing">[\s\S]*?<\/p>)?(?:<nav class="work-filters"[\s\S]*?<\/nav>)?(?:<p class="work-filter-status" id="work-filter-status" hidden><\/p>)?\s*<div class="work-list">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/;
const earlierSectionPattern = /<section class="work-category work-category--earlier">\s*<h2>(?:Earlier work|Legacy work)<\/h2>\s*<div class="work-list">([\s\S]*?)\s*<\/div>\s*<\/section>/;
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
  const rank = new Map(projectOrder.map((href, index) => [href, index]));
  const cardRank = (href) => href.startsWith("eastrise-photography/") ? 12.5 : (rank.get(href) ?? 999);
  cards.sort((left, right) => cardRank(left.href) - cardRank(right.href));

  const legacyHrefs = new Set(["vtdigger-membership/", "stowe-ski-instruction/", "fairbanks-planetarium/", "connecticut-college/"]);
  const currentCards = cards.filter((card) => !legacyHrefs.has(card.href));
  const legacyCards = cards.filter((card) => legacyHrefs.has(card.href));
  const prepareCard = (card) => {
    const explicitOrganization = organizationByHref.get(card.href);
    const inferredOrganization = card.href.startsWith("eastrise-photography/") ? "eastrise" : "";
    const organization = explicitOrganization || inferredOrganization;
    let cardHtml = card.html.replace(/ data-organization="[^"]+"/g, "");
    const feature = featuredImages.get(card.href);
    if (feature) {
      // Rebuild the whole tag: swapping only src/alt would leave the previous
      // image's width/height attributes attached to the new file.
      // apply-image-dimensions.mjs re-measures downstream.
      cardHtml = cardHtml.replace(/<img[^>]*>/, `<img src="${feature[0]}" alt="${feature[1]}" loading="lazy">`);
    }
    // Strip any credit inserted by a previous run so the description replace
    // below cannot stack a second credit paragraph.
    cardHtml = cardHtml.replace(/<p class="work-item__credit">[\s\S]*?<\/p>/g, "");
    const credit = consultingHrefs.has(card.href) ? "" : (creditOverridesByHref.get(card.href) || inHouseCredits[organization]);
    if (credit) {
      const description = inHouseDescriptions.get(card.href) || (card.href.startsWith("eastrise-photography/")
        ? "I made this in-house photography series as part of EastRise’s ongoing public storytelling."
        : "I made this work in-house as part of the organization’s public communications program.");
      cardHtml = cardHtml.replace(/<p>[\s\S]*?<\/p>/, `<p>${description}</p><p class="work-item__credit">${credit}</p>`);
    }
    return organization
      ? cardHtml.replace('<a class="work-item"', `<a class="work-item" data-organization="${organization}"`)
      : cardHtml;
  };
  const portraitHrefs = new Set(["eastrise-portraits/", "blue-cross-portraits/"]);
  const markedCards = currentCards.filter((card) => !portraitHrefs.has(card.href)).map(prepareCard).join("");
  const portraitCards = currentCards.filter((card) => portraitHrefs.has(card.href)).map(prepareCard).join("");
  const markedLegacyCards = legacyCards.map(prepareCard).join("");

  html = html.replace(
    campaignSectionPattern,
    (_section, _opening, _cards, closing) => `<section class="work-category"><h2 id="project-list-title">Projects</h2><nav class="work-filters" aria-label="Filter projects by organization"><a href="./" data-work-filter="all">All</a><a href="?organization=blue-cross-vermont" data-work-filter="blue-cross-vermont">Blue Cross Vermont</a><a href="?organization=eastrise" data-work-filter="eastrise">EastRise</a><a href="?organization=green-mountain-community-fitness" data-work-filter="green-mountain-community-fitness">GMCF</a></nav><p class="work-filter-status" id="work-filter-status" hidden></p><div class="work-list">${markedCards}${closing}<section class="work-category work-category--portraits"><h2>Portraits</h2><div class="work-list">${portraitCards}</div></section><section class="work-category work-category--earlier"><h2>Legacy work</h2><div class="work-list">${markedLegacyCards}</div></section>`,
  );
  html = html.replace(
    '<h2 id="project-list-title">Projects</h2><nav class="work-filters"',
    '<h2 id="project-list-title">Projects</h2><p class="work-category__framing">This work includes projects I made at EastRise Credit Union and Blue Cross and Blue Shield of Vermont, plus commissioned work. Each card names the employer or client.</p><nav class="work-filters"',
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

let eastRiseWritingHtml = await readFile(eastRiseWritingPath, "utf8");
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
  ["connecticut-college", "Digital storytelling · 2013–2015", "Where digital storytelling became the job.", "At Connecticut College, I developed content for college blogs and social channels, supported donor events, and contributed to a major website redesign.", [["The work", "The assignment moved between writing, publishing, event support, and the practical details of a large institutional website. It was the point when something I had been doing instinctively became a profession."], ["What stayed with me", "The audience was never one group. Students, alumni, donors, and prospective families each arrived with different questions, so the work had to be clear about who it was helping and why."]]],
  ["stowe-ski-instruction", "Instruction · Stowe Mountain Resort · 2013–2019", "The explanation had to work on the next turn.", "I spent six seasons teaching alpine skiing at Stowe Mountain Resort. It was technical communication with immediate feedback.", [["The work", "Every skier brought a different body, confidence level, and way of processing an instruction. I learned to change the explanation without changing the goal, then watch the next turn to see whether it worked."], ["Why it belongs here", "That habit still shapes my work. A clear explanation is useful only when the person receiving it can do something with it."]]],
];
for (const [slug, eyebrow, title, intro, sections] of pages) {
  const directory = new URL(`work/${slug}/`, root);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("index.html", directory), page(slug, eyebrow, title, intro, sections));
}

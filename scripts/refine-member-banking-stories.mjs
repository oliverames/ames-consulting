#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../work/member-banking-stories/index.html", import.meta.url);
let html = await readFile(pagePath, "utf8");

html = html
  .replaceAll(
    "Banking stories built around what people were trying to do.",
    "EastRise member stories and campaign films",
  )
  .replace(
    /The useful story was never the account itself\. It was the home,\s+business, savings habit, or next step the account made possible\./,
    "This page collects eleven EastRise films from 2025 and 2026, including nine member stories I co-produced with Urban Rhino.",
  )
  .replaceAll(
    "Eleven EastRise films, including nine member-story spots produced by Oliver Ames with Urban Rhino.",
    "Eleven EastRise films, including nine member-story spots co-produced by Oliver Ames with Urban Rhino.",
  )
  .replaceAll(
    "https://ames.consulting/assets/images/work/eastrise/brand-commercial.webp",
    "https://ames.consulting/assets/images/work/campaigns/will-barbecue.webp",
  )
  .replaceAll(
    "https://ames.consulting/assets/images/work/campaigns/member-stories.webp",
    "https://ames.consulting/assets/images/work/campaigns/will-barbecue.webp",
  )
  .replace(
    /I produced this series with Urban Rhino, starting with the member\s+stories and carrying them through interviews, filming, review, and\s+release\./,
    "I co-produced this series with Urban Rhino. I selected talent, organized shoot locations, developed the interview approach, coordinated filming, and carried each spot through review and release.",
  )
  .replace(
    "I supported the work through content development, image direction,\n              photography, social distribution, and quality assurance.",
    "My role also included content development, image direction, photography, social distribution, and quality assurance.",
  )
  .replace(
    "../../assets/images/work/eastrise/brand-commercial.webp",
    "../../assets/images/work/campaigns/will-barbecue.webp",
  )
  .replace(
    "../../assets/images/work/campaigns/member-stories.webp",
    "../../assets/images/work/campaigns/will-barbecue.webp",
  )
  .replace(
    "EastRise commercial production photographed by Oliver Ames",
    "Will working at a barbecue grill in an EastRise member story",
  )
  .replace(
    "A child riding a bicycle in an EastRise member story about homeownership",
    "Will working at a barbecue grill in an EastRise member story",
  )
  .replace(
    "Member Stories and Campaign Films",
    "Member stories, including Karina and Ryan",
  )
  .replaceAll(
    "Real settings and real members",
    "Photography and distribution",
  )
  .replace(
    /The visual system used Vermont places and people instead of\s+generic financial imagery\./,
    "We filmed and photographed members in Vermont homes and businesses.",
  );

html = html.replace(
  '<section class="case-section">\n        <h2>Photography and distribution</h2>',
  '<section class="case-section member-story-visual">\n        <h2>Photography and distribution</h2>',
);

for (const expected of [
  "EastRise member stories and campaign films",
  "This page collects eleven EastRise films from 2025 and 2026",
  "Photography and distribution",
  "We filmed and photographed members in Vermont homes and businesses.",
]) {
  if (!html.includes(expected)) {
    throw new Error(`refine-member-banking-stories: copy did not match: ${expected}`);
  }
}

await writeFile(pagePath, html);

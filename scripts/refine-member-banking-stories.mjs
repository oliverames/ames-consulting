#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const pagePath = new URL("../work/member-banking-stories/index.html", import.meta.url);
let html = await readFile(pagePath, "utf8");

html = html
  .replaceAll(
    "Eleven EastRise films, including nine member-story spots produced by Oliver Ames with Urban Rhino.",
    "Eleven EastRise films, including nine member-story spots co-produced by Oliver Ames with Urban Rhino.",
  )
  .replaceAll(
    "https://ames.consulting/assets/images/work/eastrise/brand-commercial.webp",
    "https://ames.consulting/assets/images/work/campaigns/member-stories.webp",
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
    "../../assets/images/work/campaigns/member-stories.webp",
  )
  .replace(
    "EastRise commercial production photographed by Oliver Ames",
    "Karina riding a bicycle in Karina and Ryan’s EastRise member story",
  )
  .replace(
    "Member Stories and Campaign Films",
    "Member stories, including Karina and Ryan",
  );

await writeFile(pagePath, html);

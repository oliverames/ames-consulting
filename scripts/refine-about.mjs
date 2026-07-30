#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../about/index.html", import.meta.url);
let html = await readFile(path, "utf8");
const marks = [
  ["scrumalliance", "Scrum Alliance", "Certified ScrumMaster", "Scrum Alliance"],
  ["hootsuite", "Hootsuite", "Advanced Social Media Strategy", "Hootsuite"],
  ["hubspot", "HubSpot", "Inbound Marketing", "HubSpot"],
  ["meta", "Meta", "Creative strategy and digital marketing", "Meta certifications"],
  ["googleanalytics", "Google Analytics", "Measurement", "Google Analytics"],
  ["wordpress", "WordPress", "Publishing and websites", "WordPress"],
].map(([slug, alt, title, label]) => `<article><img src="../assets/icons/brands/${slug}.svg" alt="${alt}" loading="lazy"><h3>${title}</h3><p>${label}</p></article>`).join("");
const credentials = `<section class="about-credentials"><div class="section-heading"><p class="eyebrow">Education, credentials, and tools</p><h2>The training and software behind the work.</h2><p>These are the credentials I have earned and the platforms I use regularly. The logos are here because they are faster to scan than another long sentence.</p></div><article class="about-education"><p class="eyebrow">Education</p><h3>Boston University</h3><p>Bachelor of Science in Science Education, cum laude</p></article><div class="brand-mark-grid">${marks}</div><div class="about-tool-list"><p class="eyebrow">Also in the toolkit</p><p>Adobe Creative Cloud, photography, video and podcast production, livestreaming, HTML and CSS, social publishing, A/B testing, accessibility review, and performance reporting.</p></div></section>`;
html = html.replace(/<section class="about-credentials">[\s\S]*?<\/section><section class="about-cta">/, `${credentials}<section class="about-cta">`);
await writeFile(path, html);

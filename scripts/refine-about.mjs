#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";

const path = new URL("../about/index.html", import.meta.url);
let html = await readFile(path, "utf8");
const marks = [
  ["scrumalliance", "Scrum Alliance", "Certified ScrumMaster", "Scrum Alliance · Issued March 2019"],
  ["hootsuite", "Hootsuite", "Advanced Social Media Strategy", "Hootsuite"],
  ["hubspot", "HubSpot", "Inbound Marketing", "HubSpot"],
  ["meta", "Meta", "Creative strategy and digital marketing", "Meta certifications"],
  ["googleanalytics", "Google Analytics", "Measurement", "Google Analytics"],
  ["wordpress", "WordPress", "Publishing and websites", "WordPress"],
].map(([slug, alt, title, label]) => `<article><img src="../assets/icons/brands/${slug}.svg" alt="${alt}" loading="lazy"><h3>${title}</h3><p>${label}</p></article>`).join("");
const credentials = `<section class="about-credentials"><div class="section-heading section-heading--standard"><h2>Education, credentials, and tools</h2><p class="section-heading__statement">What I studied and the tools I use.</p></div><article class="about-education"><p class="eyebrow">Education · 2013–2017</p><h3>Boston University</h3><p>Bachelor of Science in Science Education, cum laude</p></article><div class="brand-mark-grid">${marks}</div><div class="about-tool-list"><p class="eyebrow">Also in the toolkit</p><p>Adobe Creative Cloud, photography, video and podcast production, livestreaming, HTML and CSS, social publishing, A/B testing, accessibility review, and performance reporting.</p></div></section>`;
html = html.replace(/<section class="about-credentials">[\s\S]*?<\/section><section class="about-cta">/, `${credentials}<section class="about-cta">`);
html = html
  .replace('<div class="section-heading"><p class="eyebrow">Selected proof</p><h2>Each result links back to the project behind it.</h2></div>', '<div class="section-heading section-heading--standard"><h2>Selected proof</h2><p class="section-heading__statement">Each result links back to the project behind it.</p></div>')
  .replace('<div class="section-heading"><p class="eyebrow">What I do</p><h2>I do four kinds of work, and projects often use more than one.</h2></div>', '<div class="section-heading section-heading--standard"><h2>What I do</h2><p class="section-heading__statement">I do four kinds of work, and projects often use more than one.</p></div>')
  .replace(/<div class="section-heading"><p class="eyebrow">Experience<\/p><h2>Here’s the longer version\.<\/h2><\/div>/, '<div class="section-heading section-heading--standard"><h2>Experience</h2><p class="section-heading__statement">Here’s the longer version.</p></div>');
await writeFile(path, html);

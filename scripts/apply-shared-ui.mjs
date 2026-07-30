#!/usr/bin/env node

import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import {
  siGithub,
  siMicrodotblog,
  siMastodon,
  siBluesky,
  siThreads,
  siInstagram,
} from "simple-icons";

const root = new URL("../", import.meta.url).pathname;
const provenance = JSON.parse(await readFile(join(root, "assets/data/media-provenance.json"), "utf8"));
const linkedin = {
  title: "LinkedIn",
  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM6.814 20.452H3.861V9h2.953v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
};

const networks = [
  ["github.com", siGithub],
  ["linkedin.com", linkedin],
  ["micro.blog", siMicrodotblog],
  ["mastodon.social", siMastodon],
  ["bsky.app", siBluesky],
  ["threads.com", siThreads],
  ["instagram.com", siInstagram],
];

const constructionGate = `<div class="construction-gate" id="construction-gate" role="dialog" aria-modal="true" aria-labelledby="construction-gate-title" aria-describedby="construction-gate-description">
  <div class="construction-gate__mesh" aria-hidden="true"></div>
  <section class="construction-gate__card">
    <p class="construction-gate__eyebrow"><span aria-hidden="true"></span> Ames Consulting</p>
    <h1 id="construction-gate-title">The site is under construction.</h1>
    <p id="construction-gate-description">Enter the password to take a look around.</p>
    <form class="construction-gate__form" id="construction-gate-form" autocomplete="off">
      <label for="construction-gate-password">Password</label>
      <div class="construction-gate__controls">
        <input id="construction-gate-password" name="password" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" aria-describedby="construction-gate-error" required>
        <button type="submit">Enter <span aria-hidden="true">→</span></button>
      </div>
      <p class="construction-gate__error" id="construction-gate-error" role="alert" aria-live="polite"></p>
    </form>
  </section>
</div>`;

const icon = (brand) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="${brand.path}"></path></svg><span class="visually-hidden">${brand.title}</span>`;

function addIcons(html) {
  return html.replace(/<a href="([^"]+)"([^>]*)>(GitHub|LinkedIn|Micro\.blog|Mastodon|Bluesky|Threads|Instagram)<\/a>/g, (match, href, attrs) => {
    const brand = networks.find(([host]) => href.includes(host))?.[1];
    if (!brand) return match;
    return `<a href="${href}"${attrs} aria-label="${brand.title}">${icon(brand)}</a>`;
  });
}

function addSocialHeading(html) {
  return html.replace(
    /(<div class="site-footer__colophon">[\s\S]*?)(<ul class="site-footer__social">)/g,
    (match, before, list) => before.includes("site-footer__social-title")
      ? match
      : `${before}<h3 class="site-footer__social-title">Social</h3>${list}`,
  );
}

function updateFooterGroups(html, file) {
  const pathParts = relative(root, file).split(sep);
  const directoryDepth = pathParts.length - 1;
  const base = directoryDepth === 0 ? "./" : "../".repeat(directoryDepth);
  const workBase = `${base}work/`;
  return html.replace(
    /<nav class="site-footer__sitemap" aria-label="Footer">\s*<div>\s*<h3>(?:Campaigns|Services|Work by organization)<\/h3>\s*<ul>[\s\S]*?<\/ul>\s*<\/div>/,
    `<nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Work by organization</h3><ul><li><a href="${workBase}?organization=blue-cross-vermont">Blue Cross Vermont campaigns</a></li><li><a href="${workBase}?organization=eastrise">EastRise campaigns</a></li><li><a href="${workBase}?organization=beta-technologies">BETA Technologies campaigns</a></li><li><a href="${workBase}?organization=green-mountain-community-fitness">Green Mountain Community Fitness</a></li></ul></div>`,
  );
}

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";

function addProvenanceDisclosure(html, file) {
  const page = relative(root, file).split(sep).join("/");
  if (!page.startsWith("work/") || page === "work/index.html") return html;
  const cleaned = html.replace(/<footer class="asset-provenance"[\s\S]*?<\/footer>/, "");
  const lines = [];
  for (const match of cleaned.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    const asset = match[1].replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
    const data = provenance.assets?.[asset];
    if (!data) continue;
    const publisher = data.credit.includes("EastRise Credit Union") ? "EastRise Credit Union" : "Blue Cross and Blue Shield of Vermont";
    let sentence = `Image source: published by ${publisher}`;
    if (data.source_channel) sentence += data.source_url ? ` on <a href="${escapeHtml(data.source_url)}" rel="noopener">${escapeHtml(data.source_channel)}</a>` : ` on ${escapeHtml(data.source_channel)}`;
    else if (data.source_url) sentence += ` at <a href="${escapeHtml(data.source_url)}" rel="noopener">the source page</a>`;
    if (data.published_date) sentence += `, ${formatDate(data.published_date)}`;
    sentence += ".";
    if (data.downloaded_date) sentence += ` Retrieved ${formatDate(data.downloaded_date)}.`;
    lines.push(`<li>${sentence}</li>`);
  }
  if (!lines.length) return cleaned;
  return cleaned.replace("</main>", `<footer class="asset-provenance" aria-label="Image provenance"><h2>Image provenance</h2><ul>${lines.join("")}</ul></footer></main>`);
}

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "_site") files.push(...await collectHtml(path));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

for (const file of await collectHtml(root)) {
  const before = await readFile(file, "utf8");
  const pathParts = relative(root, file).split(sep);
  const directoryDepth = pathParts.length - 1;
  const base = directoryDepth === 0 ? "./" : "../".repeat(directoryDepth);
  let after = addProvenanceDisclosure(updateFooterGroups(addSocialHeading(addIcons(before)), file), file);
  if (!after.includes("assets/js/construction-gate.js")) {
    after = after.replace("</head>", `<script src="${base}assets/js/construction-gate.js"></script></head>`);
  }
  if (!after.includes('id="construction-gate"')) {
    after = after.replace(/<body([^>]*)>/, `<body$1>${constructionGate}`);
  }
  if (!after.includes("assets/js/content-protection.js")) {
    after = after.replace("</body>", `<script type="module" src="${base}assets/js/content-protection.js"></script></body>`);
  }
  if (after !== before) await writeFile(file, after);
}

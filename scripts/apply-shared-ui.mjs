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
  // Tolerates Prettier-formatted anchors (newlines inside the tag and around
  // the label), which the previous single-line pattern silently skipped.
  return html.replace(/<a href="([^"]+)"([^>]*)>\s*(GitHub|LinkedIn|Micro\.blog|Mastodon|Bluesky|Threads|Instagram)\s*<\/a\s*>/g, (match, href, attrs) => {
    const brand = networks.find(([host]) => href.includes(host))?.[1];
    if (!brand) return match;
    return `<a href="${href}"${attrs.replace(/\s+/g, " ").trimEnd()} aria-label="${brand.title}">${icon(brand)}</a>`;
  });
}

const socialProfiles = [
  ["GitHub", "https://github.com/oliverames"],
  ["LinkedIn", "https://www.linkedin.com/in/oliverames"],
  ["Micro.blog", "https://oliverames.micro.blog/"],
  ["Mastodon", "https://mastodon.social/@oliverames"],
  ["Bluesky", "https://bsky.app/profile/oliverames.bsky.social"],
  ["Threads", "https://www.threads.com/@oliverames"],
  ["Instagram", "https://www.instagram.com/oliverames/"],
];

const firmDescription = "Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.";

// Rebuild the footer colophon canonically on every page. Generators had
// drifted into three variants (full 7-icon, GitHub+LinkedIn only, and a
// minimal no-social version); one deterministic rebuild ends the drift.
// Text links here are converted to SVG icons by the addIcons pass.
function normalizeColophon(html) {
  const socialList = socialProfiles
    .map(([title, href]) => `<li><a href="${href}" rel="me noopener">${title}</a></li>`)
    .join("");
  const canonical = `<div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>${firmDescription}</p></div>`;
  let normalized = html.replace(/<div class="site-footer__colophon">[\s\S]*?<\/div>/, canonical);
  normalized = normalized.replace(/<div class="site-footer__social-column">[\s\S]*?<\/div>/, "");
  return normalized.replace(
    /<\/nav>\s*(<div class="site-footer__colophon">)/,
    `<div class="site-footer__social-column"><h3 class="site-footer__social-title">Social</h3><ul class="site-footer__social">${socialList}</ul></div></nav>$1`,
  );
}

// Every page's primary nav and footer Company column carry the same items.
// Late-running page rewrites (refine-work) used to drop the Testimonials
// entry that generate-testimonials added earlier in the build.
function normalizeNavAndCompany(html, base) {
  let out = html;
  if (!/<ul class="site-nav">[\s\S]*?Testimonials/.test(out)) {
    out = out.replace(
      /(<ul class="site-nav">[\s\S]*?<li><a href="[^"]*about\/"[^>]*>About<\/a><\/li>)/,
      `$1<li><a href="${base}testimonials/">Testimonials</a></li>`,
    );
  }
  out = out.replace(/(<h3>Company<\/h3>\s*<ul>)([\s\S]*?)(<\/ul>)/, (match, openTag, items, closeTag) => {
    let list = items.replace(/(<a href="[^"]*work\/"[^>]*>)(?:All projects|Work)(<\/a>)/, "$1All work$2");
    if (!list.includes("Testimonials")) {
      list = list.replace(
        /(<li><a href="[^"]*contact\/"[^>]*>Contact<\/a><\/li>)/,
        `<li><a href="${base}testimonials/">Testimonials</a></li>$1`,
      );
    }
    return `${openTag}${list}${closeTag}`;
  });
  return out;
}

// Pages that load Google Fonts CSS need the matching preconnect hints; six
// generator templates drifted apart on this.
function ensureFontPreconnects(html) {
  if (!html.includes("fonts.googleapis.com/css2")) return html;
  if (html.includes('rel="preconnect" href="https://fonts.googleapis.com"')) return html;
  return html.replace(
    /(<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2)/,
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>$1',
  );
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
  const groups = new Map();
  for (const match of cleaned.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    const asset = match[1].replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
    const data = provenance.assets?.[asset];
    if (!data) continue;
    const publisher = data.credit.includes("EastRise Credit Union") ? "EastRise Credit Union" : "Blue Cross and Blue Shield of Vermont";
    const key = `${publisher}|${data.source_channel || "source page"}|${data.published_date || ""}|${data.downloaded_date || ""}`;
    const current = groups.get(key) || { count: 0, publisher, channel: data.source_channel, sourceUrl: data.source_url, publishedDate: data.published_date, downloadedDate: data.downloaded_date };
    current.count += 1;
    groups.set(key, current);
  }
  if (!groups.size) return cleaned;
  const items = [...groups.values()].map((group) => {
    let sentence = `${group.count} image${group.count === 1 ? "" : "s"} published by ${group.publisher}`;
    if (group.channel) sentence += group.sourceUrl ? ` on <a href="${escapeHtml(group.sourceUrl)}" rel="noopener">${escapeHtml(group.channel)}</a>` : ` on ${escapeHtml(group.channel)}`;
    else if (group.sourceUrl) sentence += ` at <a href="${escapeHtml(group.sourceUrl)}" rel="noopener">the source page</a>`;
    if (group.publishedDate) sentence += `, ${formatDate(group.publishedDate)}`;
    sentence += ".";
    if (group.downloadedDate) sentence += ` Retrieved ${formatDate(group.downloadedDate)}.`;
    return `<li>${sentence}</li>`;
  }).join("");
  return cleaned.replace("</main>", `<footer class="asset-provenance" aria-label="Image provenance"><h2>Image provenance</h2><ul>${items}</ul></footer></main>`);
}

// Shared with apply-image-dimensions.mjs, apply-seo.mjs, and
// validate-structured-data.mjs — keep the four lists identical so no sweeper
// ever mutates a Playwright report or scratch output.
const EXCLUDED_DIRS = new Set(["node_modules", "_site", ".git", "playwright-report", "test-results", "output"]);

async function collectHtml(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !EXCLUDED_DIRS.has(entry.name)) files.push(...await collectHtml(path));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

for (const file of await collectHtml(root)) {
  const before = await readFile(file, "utf8");
  const pathParts = relative(root, file).split(sep);
  const directoryDepth = pathParts.length - 1;
  const base = directoryDepth === 0 ? "./" : "../".repeat(directoryDepth);
  let after = normalizeColophon(before);
  after = normalizeNavAndCompany(after, base);
  after = ensureFontPreconnects(after);
  after = addProvenanceDisclosure(updateFooterGroups(addSocialHeading(addIcons(after)), file), file);
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

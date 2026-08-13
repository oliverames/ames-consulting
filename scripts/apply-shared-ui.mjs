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
import { projectDateFor, sortEntriesNewestFirst } from "./project-order.mjs";
import { applyYoutubeFacades } from "./youtube-facade.mjs";

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

const icon = (brand) => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="${brand.path}"></path></svg><span class="visually-hidden">${brand.title}</span>`;

function decorateNetworkAnchors(html) {
  // Tolerates Prettier-formatted anchors (newlines inside the tag and around
  // the label), which the previous single-line pattern silently skipped.
  return html.replace(/<a href="([^"]+)"([^>]*)>\s*(GitHub|LinkedIn|Micro\.blog|Mastodon|Bluesky|Threads|Instagram)\s*<\/a\s*>/g, (match, href, attrs) => {
    const brand = networks.find(([host]) => href.includes(host))?.[1];
    if (!brand) return match;
    return `<a href="${href}"${attrs.replace(/\s+/g, " ").trimEnd()} aria-label="${brand.title}">${icon(brand)}</a>`;
  });
}

function addIcons(html) {
  // Keep network icons in profile controls. Inline prose links retain their
  // visible text, underline, and surrounding context.
  return html.replace(
    /<(ul|nav)\b[^>]*class="[^"]*(?:site-footer__social|profile-links)[^"]*"[^>]*>[\s\S]*?<\/\1>|<(?:aside|section) class="about-contact-card">[\s\S]*?<\/(?:aside|section)>/g,
    decorateNetworkAnchors,
  );
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

const firmDescription = "Ames Consulting is my photography and communications practice in Montpelier, Vermont. I also build websites and apps when a project needs them.";

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
    `<div class="site-footer__social-column"><h2 class="site-footer__social-title">Social</h2><ul class="site-footer__social">${socialList}</ul></div></nav>$1`,
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
  out = out.replace(/(<h[23]>Company<\/h[23]>\s*<ul>)([\s\S]*?)(<\/ul>)/, (match, openTag, items, closeTag) => {
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

function ensureFavicon(html, href) {
  const favicon = `<link rel="icon" href="${href}" type="image/svg+xml">`;
  if (/<link\s[^>]*rel="icon"/i.test(html)) {
    return html.replace(/<link\s[^>]*rel="icon"[^>]*>/i, favicon);
  }
  return html.replace("</head>", `${favicon}</head>`);
}

function addSocialHeading(html) {
  return html.replace(
    /(<div class="site-footer__colophon">[\s\S]*?)(<ul class="site-footer__social">)/g,
    (match, before, list) => before.includes("site-footer__social-title")
      ? match
      : `${before}<h2 class="site-footer__social-title">Social</h2>${list}`,
  );
}

function normalizeFooterHeadingLevels(html) {
  return html.replace(
    /<footer class="site-footer">[\s\S]*?<\/footer>/g,
    (footer) => footer.replaceAll("<h3", "<h2").replaceAll("</h3>", "</h2>"),
  );
}

function ensureHubSectionHeadings(html, file) {
  const page = relative(root, file).split(sep).join("/");
  const headings = new Map([
    ["work/eastrise/index.html", ["work-category legacy-campaigns", "EastRise campaigns and projects"]],
    ["work/blue-cross-vermont/index.html", ["work-category legacy-campaigns", "Blue Cross Vermont series"]],
    ["work/portraits-and-people/index.html", ["work-category", "Portrait collections"]],
  ]);
  const setting = headings.get(page);
  if (!setting) return html;
  const [className, heading] = setting;
  return html.replace(
    `<section class="${className}"><div class="work-list">`,
    `<section class="${className}"><h2>${heading}</h2><div class="work-list">`,
  );
}

function updateFooterGroups(html, file) {
  const pathParts = relative(root, file).split(sep);
  const directoryDepth = pathParts.length - 1;
  const base = directoryDepth === 0 ? "./" : "../".repeat(directoryDepth);
  const workBase = `${base}work/`;
  return html.replace(
    /<nav class="site-footer__sitemap" aria-label="Footer">\s*<div>\s*<h[23]>(?:Campaigns|Services|Work by organization)<\/h[23]>\s*<ul>[\s\S]*?<\/ul>\s*<\/div>/,
    `<nav class="site-footer__sitemap" aria-label="Footer"><div><h2>Work by organization</h2><ul><li><a href="${workBase}blue-cross-vermont/">Blue Cross Vermont</a></li><li><a href="${workBase}?organization=eastrise">EastRise</a></li><li><a href="${workBase}?organization=beta-technologies">BETA Technologies</a></li><li><a href="${workBase}?organization=green-mountain-community-fitness">Green Mountain Community Fitness</a></li></ul></div>`,
  );
}

function sortGalleryNavigation(html, file) {
  const pageHref = relative(root, file)
    .split(sep).join("/")
    .replace(/^work\//, "")
    .replace(/index\.html$/, "");
  if (!projectDateFor(pageHref)) return html;

  return html.replace(
    /(<h[23]>Galleries<\/h[23]>\s*<ul>)([\s\S]*?)(<\/ul>)/,
    (match, opening, items, closing) => {
      const links = [...items.matchAll(/<li><a href="([^"]+)"[\s\S]*?<\/a><\/li>/g)]
        .map((item) => ({ href: item[1], html: item[0] }));
      if (!links.length) return match;
      const ordered = sortEntriesNewestFirst(links, (item) => item.href);
      return `${opening}${ordered.map((item) => item.html).join("")}${closing}`;
    },
  );
}

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const formatDate = (value) => value ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "";

function normalizeSourceUrl(value) {
  if (!value) return "";
  try {
    const source = new URL(value);
    for (const key of [...source.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key.toLowerCase() === "rcm") source.searchParams.delete(key);
    }
    source.hash = "";
    return source.href;
  } catch {
    return value;
  }
}

function agreeArchiveNote(note, count) {
  const normalized = String(note || "").trim();
  if (count === 1) {
    return normalized.replace(/^were\b/i, "was").replace(/^are\b/i, "is").replace(/^have\b/i, "has");
  }
  return normalized.replace(/^was\b/i, "were").replace(/^is\b/i, "are").replace(/^has\b/i, "have");
}

function addProvenanceDisclosure(html, file) {
  const page = relative(root, file).split(sep).join("/");
  if (!page.startsWith("work/") || page === "work/index.html") return html;
  const cleaned = html.replace(/<footer class="asset-provenance"[\s\S]*?<\/footer>/, "");
  const groups = new Map();
  const seenAssets = new Set();
  for (const match of cleaned.matchAll(/<img\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) {
    const asset = match[1].replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
    if (seenAssets.has(asset)) continue;
    seenAssets.add(asset);
    const data = provenance.assets?.[asset];
    if (!data) continue;
    const publisher = data.credit.includes("EastRise Credit Union")
      ? "EastRise Credit Union"
      : data.credit.includes("Blue Cross")
        ? "Blue Cross and Blue Shield of Vermont"
        : "Oliver Ames";
    const sourceUrl = normalizeSourceUrl(data.source_url);
    const key = `${publisher}|${data.source_channel || "source page"}|${sourceUrl}|${data.published_date || ""}|${data.downloaded_date || ""}|${data.archive_note || ""}`;
    const current = groups.get(key) || { count: 0, publisher, channel: data.source_channel, sourceUrl, publishedDate: data.published_date, downloadedDate: data.downloaded_date, archiveNote: data.archive_note };
    current.count += 1;
    groups.set(key, current);
  }
  if (!groups.size) return cleaned;
  const items = [...groups.values()].map((group) => {
    let sentence = group.archiveNote
      ? `${group.count} image${group.count === 1 ? "" : "s"} ${agreeArchiveNote(group.archiveNote, group.count)}`
      : `${group.count} image${group.count === 1 ? "" : "s"} published by ${group.publisher}`;
    if (group.archiveNote) return `<li>${sentence}</li>`;
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
  const faviconBase = relative(root, file) === "404.html" ? "/" : base;
  let after = normalizeColophon(before);
  after = normalizeNavAndCompany(after, base);
  after = ensureFontPreconnects(after);
  after = ensureFavicon(after, `${faviconBase}assets/images/brand/oa-social-mark.svg`);
  after = ensureHubSectionHeadings(after, file);
  after = applyYoutubeFacades(after);
  after = addProvenanceDisclosure(
    normalizeFooterHeadingLevels(
      sortGalleryNavigation(updateFooterGroups(addSocialHeading(addIcons(after)), file), file),
    ),
    file,
  );
  if (!after.includes("assets/js/content-protection.js")) {
    after = after.replace("</body>", `<script type="module" src="${base}assets/js/content-protection.js"></script></body>`);
  }
  if (after !== before) await writeFile(file, after);
}

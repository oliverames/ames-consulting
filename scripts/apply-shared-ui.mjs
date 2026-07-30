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

function addIcons(html) {
  return html.replace(/<a href="([^"]+)"([^>]*)>(GitHub|LinkedIn|Micro\.blog|Mastodon|Bluesky|Threads|Instagram)<\/a>/g, (match, href, attrs) => {
    const brand = networks.find(([host]) => href.includes(host))?.[1];
    if (!brand) return match;
    return `<a href="${href}"${attrs} aria-label="${brand.title}">${icon(brand)}</a>`;
  });
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
  let after = updateFooterGroups(addIcons(before), file);
  if (!after.includes("assets/js/content-protection.js")) {
    after = after.replace("</body>", `<script type="module" src="${base}assets/js/content-protection.js"></script></body>`);
  }
  if (after !== before) await writeFile(file, after);
}

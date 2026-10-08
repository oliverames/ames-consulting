#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { projectRootFromScriptUrl } from "./script-paths.mjs";

const root = projectRootFromScriptUrl(import.meta.url);
const input = JSON.parse(await readFile(join(root, "assets/data/redlink-pages.json"), "utf8"));
const routes = new Set(["/redlink/", "/redlink/privacy/"]);
if (input.schema_version !== 1 || input.project !== "redlink" || input.pages?.length !== routes.size) {
  throw new Error("RedLink content must contain the support and privacy pages.");
}

const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function bodySections(html) {
  const body = html.replace(/^<h1>[^<]+<\/h1>\n/, "");
  const [intro, ...sections] = body.split(/(?=<h2>)/);
  return intro + sections.map((section) => section.replace(
    /^(<h2>[\s\S]*?<\/h2>)([\s\S]*)$/,
    '<section>$1<div>$2</div></section>',
  )).join("\n");
}

for (const page of input.pages) {
  if (!routes.delete(page.route)) {
    throw new Error("Unexpected or duplicate RedLink route.");
  }
  if (!page.title || !page.description || !/^<h1>[^<]+<\/h1>\n/.test(page.body_html)) {
    throw new Error("RedLink content is missing its title, description, or source heading.");
  }
  const depth = page.route.split("/").filter(Boolean).length;
  const base = "../".repeat(depth);
  const title = escape(page.title);
  const description = escape(page.description);
  const support = page.route === "/redlink/";
  const appNav = `<nav aria-label="RedLink"><a href="/redlink/"${support ? ' aria-current="page"' : ""}>Support</a> · <a href="/redlink/privacy/"${!support ? ' aria-current="page"' : ""}>Privacy</a> · <a href="/contact/">Contact Oliver</a></nav>`;
  const websiteNote = support ? "" : '<p>This policy describes the RedLink app. These pages are hosted on Oliver Ames’s website, which uses Google Analytics.</p>';
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${title} | Oliver Ames</title><meta name="description" content="${description}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting${page.route}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="${base}assets/css/main.css"><style>.redlink-content section { padding-block: var(--space-3); border-top: 1px solid color-mix(in srgb, var(--accent) 40%, transparent); } .redlink-content > p + section { margin-top: var(--space-3); } .redlink-content h2 { margin-bottom: var(--space-2); } .redlink-content p { overflow-wrap: anywhere; }</style></head>
<body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="${base}" class="site-name">ames.consulting</a><ul class="site-nav"></ul></nav></header>
<main id="main-content" tabindex="-1"><article class="writing-article"><header class="writing-article__header"><p class="eyebrow">RedLink</p><h1>${title}</h1>${appNav}</header><div class="writing-article__body redlink-content">${websiteNote}${bodySections(page.body_html)}</div><footer class="writing-article__footer"><a href="/contact/">Contact Support</a><a href="${support ? "/redlink/privacy/" : "/redlink/"}">${support ? "RedLink Privacy Policy" : "RedLink Support"}</a></footer></article></main>
<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul></ul></div><div><h3>Company</h3><ul></ul></div></nav><div class="site-footer__colophon"></div></div></footer><script type="module" src="${base}assets/js/header-scroll.js"></script></body></html>\n`;
  const destination = join(root, page.route.slice(1), "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html);
}
console.log("Generated RedLink support and privacy pages.");

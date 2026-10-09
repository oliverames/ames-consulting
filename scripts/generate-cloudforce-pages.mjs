#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { projectRootFromScriptUrl } from "./script-paths.mjs";

const root = projectRootFromScriptUrl(import.meta.url);
const input = JSON.parse(await readFile(join(root, "assets/data/cloudforce-pages.json"), "utf8"));
const routes = new Set(["/cloudforce/", "/cloudforce/privacy/"]);
if (input.schema_version !== 1 || input.project !== "cloud-force" || input.pages?.length !== routes.size) {
  throw new Error("CloudForce content must come from the app repository's prepare-app-store.py exporter.");
}

const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// Preserve the app's original legal snapshot above as provenance. Production
// uses exact _redirects entries; these noindex notices are source-preview only.
for (const page of input.pages) {
  if (!routes.delete(page.route) || !/^[a-f0-9]{64}$/.test(page.source_sha256 || "")) {
    throw new Error("Unexpected CloudForce route or missing source digest.");
  }
  if (!page.title || !page.description || !/^<h1>[^<]+<\/h1>\n/.test(page.body_html)) {
    throw new Error("CloudForce content is missing its title, description, or source heading.");
  }
  const depth = page.route.split("/").filter(Boolean).length;
  const base = "../".repeat(depth);
  const support = page.route === "/cloudforce/";
  const title = escape(`CloudLink for GeForce NOW ${support ? "Support" : "Privacy Policy"}`);
  const target = `https://cloudlink.games/${support ? "support" : "privacy"}/`;
  const description = escape(`CloudForce is now CloudLink for GeForce NOW. ${support ? "Support information" : "The privacy policy"} is available at cloudlink.games.`);
  const appNav = '<nav aria-label="CloudLink"><a href="https://cloudlink.games/support/">Support</a> · <a href="https://cloudlink.games/privacy/">Privacy</a> · <a href="/contact/">Contact Oliver</a></nav>';
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${title} | Oliver Ames</title><meta name="description" content="${description}"><meta name="author" content="Oliver Ames"><meta name="robots" content="noindex"><link rel="canonical" href="${target}"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="${base}assets/css/main.css"></head>
<body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="${base}" class="site-name">ames.consulting</a><ul class="site-nav"></ul></nav></header>
<main id="main-content" tabindex="-1"><article class="writing-article"><header class="writing-article__header"><p class="eyebrow">CloudLink for GeForce NOW</p><h1>${title}</h1>${appNav}</header><div class="writing-article__body"><p>CloudForce is now CloudLink for GeForce NOW. ${support ? "Support information has" : "The privacy policy has"} moved to cloudlink.games.</p><p><a href="${target}">Read the CloudLink ${support ? "support information" : "privacy policy"}</a>.</p></div><footer class="writing-article__footer"><a href="/contact/">Contact Support</a><a href="https://cloudlink.games/">CloudLink website</a></footer></article></main>
<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul></ul></div><div><h3>Company</h3><ul></ul></div></nav><div class="site-footer__colophon"></div></div></footer><script type="module" src="${base}assets/js/header-scroll.js"></script></body></html>\n`;
  const destination = join(root, page.route.slice(1), "index.html");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, html);
}
console.log("Generated noindex CloudLink migration notices; the original app content snapshot is preserved.");

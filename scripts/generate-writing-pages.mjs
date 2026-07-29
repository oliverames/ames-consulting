#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const feed = JSON.parse(await readFile(join(root, "assets/data/writing-feed.json"), "utf8"));

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function dateLabel(value, long = false) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(new Date(value));
}

function isLongForm(post) {
  return post.platforms.includes("Micro.blog") && (post.title || post.text.length >= 800);
}

function linkify(value) {
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" rel="noopener">$1</a>'
  );
}

function renderArticleText(value) {
  return value
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${linkify(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function excerpt(value, limit = 420) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

const socialLinks = `<ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul>`;

function header(depth, current = "Writing") {
  const base = "../".repeat(depth);
  const item = (label, path) => `<li><a href="${base}${path}"${current === label ? ' aria-current="page"' : ""}>${label}</a></li>`;
  return `<a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="${base}" class="site-name">ames.consulting</a><ul class="site-nav">${item("Home", "")}${item("Work", "work/")}${item("Writing", "blog/")}${item("About", "about/")}${item("Testimonials", "testimonials/")}${item("Contact", "contact/")}</ul></nav></header>`;
}

function footer(depth) {
  const base = "../".repeat(depth);
  return `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="${base}work/taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="${base}work/wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="${base}work/eastrise-writing/">EastRise Writing</a></li><li><a href="${base}work/portraits-and-people/">Portraits and People</a></li></ul></div><div><h3>Company</h3><ul><li><a href="${base}work/">All work</a></li><li><a href="${base}blog/">Writing</a></li><li><a href="${base}about/">About</a></li><li><a href="${base}testimonials/">Testimonials</a></li><li><a href="${base}contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p>${socialLinks}</div></div></footer>`;
}

function page({ title, description, path, depth, body, type = "website" }) {
  const base = "../".repeat(depth);
  const canonical = `https://ames.consulting/${path}`;
  const schema = { "@context": "https://schema.org", "@type": type === "article" ? "BlogPosting" : "WebPage", name: title, headline: type === "article" ? title : undefined, url: canonical, description, author: { "@type": "Person", name: "Oliver Ames" } };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${escapeHtml(title)} | Ames Consulting</title><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${type}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="${base}assets/css/main.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body>${header(depth)}<main id="main-content" tabindex="-1">${body}</main>${footer(depth)}<script type="module" src="${base}assets/js/header-scroll.js"></script><script type="module" src="${base}assets/js/image-viewer.js"></script></body></html>`;
}

function localImage(post, depth) {
  if (!post.image) return "";
  const filename = `${createHash("sha256").update(post.id).digest("hex").slice(0, 12)}.webp`;
  return `${"../".repeat(depth)}assets/images/writing/${filename}`;
}

function renderCard(post) {
  const longForm = isLongForm(post);
  const slug = longForm ? slugify(post.title || post.id) : "";
  const platforms = post.platforms.map((platform) => `<span>${escapeHtml(platform)}</span>`).join("");
  const links = post.links.map((link) => `<a href="${escapeHtml(link.url)}" rel="noopener">View on ${escapeHtml(link.platform)} →</a>`).join("");
  const imageSrc = localImage(post, 1);
  const image = imageSrc ? `<img class="social-card__media" src="${imageSrc}" alt="Media attached to Oliver Ames's ${escapeHtml(post.platforms[0])} post" loading="lazy" width="1400" height="900">` : "";
  const title = post.title ? `<h2>${longForm ? `<a href="${slug}/">${escapeHtml(post.title)}</a>` : escapeHtml(post.title)}</h2>` : "";
  const action = longForm ? `<a class="social-card__read" href="${slug}/">Read on ames.consulting →</a>` : "";
  return `<article class="social-card${longForm ? " social-card--article" : ""}"><header class="social-card__header"><img src="../assets/images/about/oliver-ames-profile.webp" alt="" width="48" height="48" loading="lazy"><div><strong>Oliver Ames</strong><div class="social-card__platforms">${platforms}</div></div><time datetime="${escapeHtml(post.date)}">${dateLabel(post.date)}</time></header><div class="social-card__body">${title}<p>${linkify(longForm ? excerpt(post.text) : post.text).replaceAll("\n", "<br>")}</p>${image}</div><footer class="social-card__footer">${action}<div class="social-card__sources">${links}</div></footer></article>`;
}

function renderLongFormPage(post) {
  const slug = slugify(post.title || post.id);
  const description = excerpt(post.text, 155);
  const original = post.links.find((link) => link.platform === "Micro.blog") || post.links[0];
  const body = `<article class="writing-article"><header class="writing-article__header"><p class="eyebrow">Personal writing · ${dateLabel(post.date, true)}</p><h1>${escapeHtml(post.title)}</h1><p>Originally published on <a href="${escapeHtml(original.url)}" rel="noopener">Micro.blog</a>.</p></header><div class="writing-article__body">${renderArticleText(post.text)}</div><footer class="writing-article__footer"><a class="btn btn--ghost" href="../">← Back to Writing</a><a href="${escapeHtml(original.url)}" rel="noopener">View the original on Micro.blog →</a></footer></article>`;
  return { slug, html: page({ title: post.title, description, path: `blog/${slug}/`, depth: 2, body, type: "article" }) };
}

const profileLinks = feed.profiles.map((profile) => `<a href="${escapeHtml(profile.url)}" rel="me noopener">${escapeHtml(profile.platform)}</a>`).join("");
const cards = feed.posts.map(renderCard).join("");
const indexBody = `<header class="page-header writing-header"><p class="eyebrow">Writing</p><h1>Notes, essays, and things I wanted to say in my own name.</h1><p><a href="${escapeHtml(feed.canonicalBlog)}" rel="me noopener">Micro.blog is my blog</a>. This page also gathers my original posts from the other places where I write publicly.</p><nav class="profile-links" aria-label="Writing profiles">${profileLinks}</nav></header><section class="writing-stream" aria-labelledby="recent-writing-title"><div class="section-heading writing-stream__heading"><p class="eyebrow">The feed</p><h2 id="recent-writing-title">Recent writing</h2></div><div class="social-card-grid">${cards}</div></section><section class="reading-section writing-work-link"><div><p class="eyebrow">Professional archive</p><h2>Writing for organizations</h2><p>The personal feed lives above. The complete professional archive is organized with the work it belonged to.</p></div><a class="btn btn--ghost" href="../work/eastrise-writing/">See all 53 EastRise articles →</a></section>`;

await mkdir(join(root, "blog"), { recursive: true });
await writeFile(join(root, "blog/index.html"), page({ title: "Writing", description: "The personal blog and original social posts of Oliver Ames.", path: "blog/", depth: 1, body: indexBody }));

let articleCount = 0;
for (const post of feed.posts.filter(isLongForm)) {
  const article = renderLongFormPage(post);
  const output = join(root, "blog", article.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, article.html);
  articleCount += 1;
}

console.log(`Generated ${feed.posts.length} writing cards and ${articleCount} on-site article pages.`);

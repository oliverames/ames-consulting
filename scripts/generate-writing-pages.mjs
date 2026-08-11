#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const feed = JSON.parse(
  await readFile(join(root, "assets/data/writing-feed.json"), "utf8"),
);

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
    timeZone: "UTC",
  }).format(new Date(value));
}

function isLongForm(post) {
  return (
    post.platforms.includes("Micro.blog") &&
    (post.title || post.text.length >= 800)
  );
}

function linkify(value) {
  return escapeHtml(value).replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" rel="noopener">$1</a>',
  );
}

function renderArticleText(value) {
  return value
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((paragraph) => `<p>${linkify(paragraph).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function truncateWords(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).replace(/\s+\S*$/, "")}…`;
}

function sentenceSafeExcerpt(value, limit = 420) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= limit) return normalized;

  const sentences = [...new Intl.Segmenter("en", { granularity: "sentence" }).segment(normalized)]
    .map(({ segment }) => segment.trim())
    .filter(Boolean);
  let excerpt = "";
  for (const sentence of sentences) {
    const candidate = excerpt ? `${excerpt} ${sentence}` : sentence;
    if (candidate.length > limit) break;
    excerpt = candidate;
  }

  return excerpt || sentences[0] || normalized;
}

const socialLinks = `<ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul>`;

function header(depth, current = "Writing") {
  const base = "../".repeat(depth);
  const item = (label, path) =>
    `<li><a href="${base}${path}"${current === label ? ' aria-current="page"' : ""}>${label}</a></li>`;
  return `<a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="${base}" class="site-name">ames.consulting</a><ul class="site-nav">${item("Home", "")}${item("Work", "work/")}${item("Writing", "blog/")}${item("About", "about/")}${item("Testimonials", "testimonials/")}${item("Contact", "contact/")}</ul></nav></header>`;
}

function footer(depth) {
  const base = "../".repeat(depth);
  return `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="${base}work/taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="${base}work/wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="${base}work/eastrise-writing/">EastRise Writing</a></li><li><a href="${base}work/portraits-and-people/">Portraits and People</a></li></ul></div><div><h3>Company</h3><ul><li><a href="${base}work/">All work</a></li><li><a href="${base}blog/">Writing</a></li><li><a href="${base}about/">About</a></li><li><a href="${base}testimonials/">Testimonials</a></li><li><a href="${base}contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p>${socialLinks}</div></div></footer>`;
}

function page({ title, description, path, depth, body, type = "website" }) {
  const base = "../".repeat(depth);
  const canonical = `https://ames.consulting/${path}`;
  const documentTitle = type === "article" ? truncateWords(title, 50) : title;
  const schema = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "BlogPosting" : "WebPage",
    name: title,
    headline: type === "article" ? title : undefined,
    url: canonical,
    description,
    author: { "@type": "Person", name: "Oliver Ames" },
  };
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${escapeHtml(documentTitle)} | Ames Consulting</title><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${type}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="${base}assets/css/main.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body>${header(depth)}<main id="main-content" tabindex="-1">${body}</main>${footer(depth)}<script type="module" src="${base}assets/js/header-scroll.js"></script><script type="module" src="${base}assets/js/image-viewer.js"></script></body></html>`;
}

function localImage(post, depth, sourcePost = post) {
  if (!sourcePost.image) return "";
  const filename = `${createHash("sha256").update(sourcePost.id).digest("hex").slice(0, 12)}.webp`;
  return `${"../".repeat(depth)}assets/images/writing/${filename}`;
}

function cardImagePost(post) {
  if (post.image) return post;
  if (!isLongForm(post)) return post;
  return feed.posts.find((candidate) =>
    candidate.image && candidate.platforms.includes("Micro.blog") && new Date(candidate.date) <= new Date(post.date)
  ) || post;
}

function renderCard(post, depth = 1) {
  const longForm = isLongForm(post);
  const slug = longForm ? slugify(post.title || post.id) : "";
  const articleHref = longForm
    ? `${"../".repeat(Math.max(0, depth - 1))}${slug}/`
    : "";
  const platforms = post.platforms
    .map((platform) => `<span>${escapeHtml(platform)}</span>`)
    .join("");
  const links = post.links
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" rel="noopener">View on ${escapeHtml(link.platform)} →</a>`,
    )
    .join("");
  const imagePost = cardImagePost(post);
  const imageSrc = localImage(post, depth, imagePost);
  const image = imageSrc
    ? `<img class="social-card__media" src="${imageSrc}" alt="${post.image ? `Media attached to Oliver Ames&#39;s ${escapeHtml(post.platforms[0])} post` : `Recent image from Oliver Ames&#39;s blog`}" loading="lazy" width="1400" height="900">`
    : "";
  const sharedPost = post.sharedPost
    ? `<div class="social-card__shared"><strong>Shared from <a href="${escapeHtml(post.sharedPost.url)}" rel="noopener">${escapeHtml(post.sharedPost.author)}</a></strong><p>${linkify(post.sharedPost.text).replaceAll("\n", "<br>")}</p></div>`
    : "";
  const title = post.title
    ? `<h2>${longForm ? `<a href="${articleHref}">${escapeHtml(post.title)}</a>` : escapeHtml(post.title)}</h2>`
    : "";
  const action = longForm
    ? `<a class="social-card__read" href="${articleHref}">Read on ames.consulting →</a>`
    : "";
  return `<article class="social-card${longForm ? " social-card--article" : ""}"><header class="social-card__header"><img src="${"../".repeat(depth)}assets/images/about/oliver-ames-profile.webp" alt="" width="48" height="48" loading="lazy" data-no-zoom><div><strong>Oliver Ames</strong><div class="social-card__platforms">${platforms}</div></div><time datetime="${escapeHtml(post.date)}">${dateLabel(post.date)}</time></header><div class="social-card__body">${image}${title}<p>${linkify(longForm ? sentenceSafeExcerpt(post.text) : post.text).replaceAll("\n", "<br>")}</p>${sharedPost}</div><footer class="social-card__footer">${action}<div class="social-card__sources">${links}</div></footer></article>`;
}

function renderLongFormPage(post) {
  const slug = slugify(post.title || post.id);
  const description = sentenceSafeExcerpt(post.text, 155);
  const original =
    post.links.find((link) => link.platform === "Micro.blog") || post.links[0];
  const imageSrc = localImage(post, 2);
  const heroImage = imageSrc ? `<img class="writing-article__hero" src="${imageSrc}" alt="Image published with ${escapeHtml(post.title)}" width="1400" height="900" loading="eager" fetchpriority="high">` : "";
  const body = `<article class="writing-article"><header class="writing-article__header"><p class="eyebrow">Personal writing · <time datetime="${escapeHtml(post.date)}">${dateLabel(post.date, true)}</time></p><h1>${escapeHtml(post.title)}</h1><p>Originally published on <a href="${escapeHtml(original.url)}" rel="noopener">Micro.blog</a>.</p>${heroImage}</header><div class="writing-article__body">${renderArticleText(post.text)}</div><footer class="writing-article__footer"><a class="btn btn--ghost" href="../">← Back to Writing</a><a href="${escapeHtml(original.url)}" rel="noopener">View the original on Micro.blog →</a></footer></article>`;
  return {
    slug,
    html: page({
      title: post.title,
      description,
      path: `blog/${slug}/`,
      depth: 2,
      body,
      type: "article",
    }),
  };
}

const profileLinks = feed.profiles
  .map(
    (profile) =>
      `<a href="${escapeHtml(profile.url)}" rel="me noopener">${escapeHtml(profile.platform)}</a>`,
  )
  .join("");
const longFormPosts = feed.posts.filter(isLongForm);
const recentMicroPosts = feed.posts.filter((post) => post.platforms.includes("Micro.blog"));
const socialPosts = feed.posts.filter((post) => !isLongForm(post));
const linkedinPosts = socialPosts.filter((post) => post.platforms.includes("LinkedIn"));
const indexBody = `<header class="page-header writing-header"><p class="eyebrow">Writing</p><h1>Notes, essays, and things I wanted to say in my own name.</h1><p><a href="${escapeHtml(feed.canonicalBlog)}" rel="me noopener">Micro.blog is my blog</a>. I also keep the public posts I write elsewhere in one place.</p><nav class="profile-links" aria-label="Writing profiles">${profileLinks}</nav></header><section class="writing-stream writing-stream--articles" aria-labelledby="recent-articles-title"><div class="section-heading writing-stream__heading"><p class="eyebrow">From Micro.blog</p><h2 id="recent-articles-title">Recent posts</h2></div><div class="social-card-stack">${recentMicroPosts.slice(0, 6).map((post) => renderCard(post)).join("")}</div><a class="writing-stream__more" href="archive/#microblog">Browse every Micro.blog post →</a></section><section class="writing-stream writing-stream--social" aria-labelledby="recent-social-title"><div class="section-heading writing-stream__heading"><p class="eyebrow">LinkedIn</p><h2 id="recent-social-title">Recent LinkedIn posts</h2></div><div class="social-card-stack">${linkedinPosts.slice(0, 8).map((post) => renderCard(post)).join("")}</div><a class="writing-stream__more" href="https://www.linkedin.com/in/oliverames/recent-activity/all/" rel="me noopener">See more on LinkedIn →</a></section><section class="reading-section writing-work-link"><div><p class="eyebrow">Professional archive</p><h2>Writing for organizations</h2><p>The complete professional archive is organized with the work it belonged to.</p></div><a class="btn btn--ghost" href="../work/eastrise-writing/">See all 53 EastRise articles →</a></section>`;

await mkdir(join(root, "blog"), { recursive: true });
await writeFile(
  join(root, "blog/index.html"),
  page({
    title: "Writing",
    description: "The personal blog and original social posts of Oliver Ames.",
    path: "blog/",
    depth: 1,
    body: indexBody,
  }),
);

await mkdir(join(root, "blog", "archive"), { recursive: true });
await writeFile(
  join(root, "blog", "archive", "index.html"),
  page({
    title: "Writing archive",
    description: "The complete personal writing and social archive of Oliver Ames.",
    path: "blog/archive/",
    depth: 2,
    body: `<header class="page-header"><p class="eyebrow">Writing archive</p><h1>Everything, in reverse chronological order.</h1><p>Long-form posts stay separate from shorter social notes so each is easier to browse.</p></header><section class="writing-stream" id="microblog"><div class="section-heading"><p class="eyebrow">Micro.blog</p><h2>Blog posts</h2></div><div class="social-card-grid">${longFormPosts.map((post) => renderCard(post, 2)).join("")}</div></section><section class="writing-stream" id="social"><div class="section-heading"><p class="eyebrow">Social</p><h2>Original public posts</h2></div><div class="social-card-grid">${socialPosts.map((post) => renderCard(post, 2)).join("")}</div></section>`,
  }),
);

let articleCount = 0;
for (const post of feed.posts.filter(isLongForm)) {
  const article = renderLongFormPage(post);
  const output = join(root, "blog", article.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, article.html);
  articleCount += 1;
}

console.log(
  `Generated ${feed.posts.length} writing cards and ${articleCount} on-site article pages.`,
);

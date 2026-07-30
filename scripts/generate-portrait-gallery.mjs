#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const archiveManifestPath = "/Users/oliverames/Desktop/Archive Folder/EastRise/Public Photography/Public Photography Manifest.json";
const blueCrossRoot = "/Users/oliverames/Documents/BCBS/Photography";
const outputRoot = path.join(root, "assets/images/work/portraits/gallery");

const eastRiseNamePattern = /(Headshot|Bio|Alvah-Newhall|Arthur-G\.-Woolf|Frank-G\.-Harris|George-Sales|Greg\.|Ian-Squirrell|Jim-Towne|Margaret-H\.-ODonnell|Mark\.|Rob\.|Sue\.|Valerie\.)/i;
const archive = JSON.parse(await readFile(archiveManifestPath, "utf8"));
const eastRiseCandidates = archive.filter((item) => item.group.startsWith("Verification Pending") && eastRiseNamePattern.test(path.basename(item.source)));
const eastRise = [];
const eastRiseHashes = new Set();
for (const item of eastRiseCandidates) {
  const hash = createHash("sha256").update(await readFile(item.source)).digest("hex");
  if (!eastRiseHashes.has(hash)) eastRise.push(item);
  eastRiseHashes.add(hash);
}

const { stdout } = await exec("find", [blueCrossRoot, "-path", "*Headshot*", "-type", "f", "-iname", "*.jpg"]);
const blueCross = stdout.split("\n").filter(Boolean).filter((file) => !file.includes("/RAWs and XMPs/"));

function personName(file) {
  return path.basename(file, path.extname(file))
    .replace(/-?(Headshot|Bio)(-\d+)?/gi, "")
    .replace(/-?500x571-?\d*/gi, "")
    .replace(/ - (LinkedIn.*|Option \d+|Reduced Hair Test)$/i, "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function processPortrait(source, organization, index) {
  const data = await readFile(source);
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
  const name = personName(source);
  const base = `${name || `portrait-${index + 1}`}-${hash}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const directory = organization === "EastRise" ? "eastrise" : "blue-cross";
  const destination = path.join(outputRoot, directory, `${base}.webp`);
  await mkdir(path.dirname(destination), { recursive: true });
  await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", "1600x1600>", "-strip", "-quality", "86", destination]);
  const [width, height] = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim().split(" ").map(Number);
  const generic = /^DSC\d+$/i.test(name) || !name;
  return {
    src: `../../assets/images/work/portraits/gallery/${directory}/${path.basename(destination)}`,
    alt: generic ? `${organization} team portrait ${index + 1}` : `Portrait of ${name}`,
    caption: generic ? `${organization} portrait ${index + 1}` : name,
    width,
    height,
    wide: width / height > 1.18,
  };
}

const uniqueBlueCross = [];
const blueCrossHashes = new Set();
for (const file of blueCross) {
  const hash = createHash("sha256").update(await readFile(file)).digest("hex");
  if (!blueCrossHashes.has(hash)) uniqueBlueCross.push(file);
  blueCrossHashes.add(hash);
}

async function processSeries(sources, organization) {
  const images = [];
  for (const [index, source] of sources.entries()) {
    images.push(await processPortrait(source, organization, index));
  }
  return images;
}

const series = [
  {
    title: "EastRise leadership and board",
    slug: "eastrise-leadership-board",
    images: await processSeries(eastRise.map((item) => item.source), "EastRise"),
  },
  {
    title: "Blue Cross Vermont and CBSS",
    slug: "blue-cross-cbss",
    images: await processSeries(uniqueBlueCross, "Blue Cross Vermont"),
  },
];

const data = { generatedAt: "2026-07-29", totalImages: series.reduce((total, item) => total + item.images.length, 0), series };
await writeFile(path.join(root, "assets/data/portraits.json"), `${JSON.stringify(data, null, 2)}\n`);

const gallery = (item) => `<section class="case-section portrait-series" aria-labelledby="${item.slug}-title"><h2 id="${item.slug}-title">The complete collection</h2><p>${item.images.length} publicly used and approved portrait selections.</p><div class="portrait-gallery" data-gallery="${item.slug}">${item.images.map((image) => `<figure${image.wide ? ' class="portrait-gallery__wide"' : ""}><img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"><figcaption>${image.caption}</figcaption></figure>`).join("")}</div></section>`;

const pageShell = ({ title, description, canonical, body }) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${title} | Ames Consulting</title><meta name="description" content="${description}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${canonical}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="page">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${body}</main><footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-portraits/">EastRise Portraits</a></li><li><a href="../blue-cross-portraits/">Blue Cross Portraits</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p></div></div></footer><script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;

const [eastRiseSeries, blueCrossSeries] = series;
const pages = [
  {
    slug: "eastrise-portraits",
    html: pageShell({
      title: "EastRise Portraits",
      description: "EastRise leadership and board portrait photography by Oliver Ames.",
      canonical: "eastrise-portraits",
      body: `<header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait collection · EastRise · 2024–2025</p><h1>EastRise leadership and board portraits.</h1><p>A consistent portrait library made for the website, LinkedIn, press materials, and internal communications without asking every person to look the same.</p><p class="portrait-count">${eastRiseSeries.images.length} portraits in this collection.</p></header>${gallery(eastRiseSeries)}<section class="case-section"><h2>The system behind the portraits</h2><p>Repeatable lighting and framing made the library useful as a system. Careful editing and room for each person made it feel human.</p></section>`,
    }),
  },
  {
    slug: "blue-cross-portraits",
    html: pageShell({
      title: "Blue Cross Vermont Portraits",
      description: "Blue Cross Vermont and CBSS portrait photography by Oliver Ames.",
      canonical: "blue-cross-portraits",
      body: `<header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait collection · Blue Cross Vermont and CBSS · 2026</p><h1>Blue Cross Vermont and CBSS portraits.</h1><p>Staff and leadership portraits made for public profiles, organizational storytelling, and communications work.</p><p class="portrait-count">${blueCrossSeries.images.length} portraits in this collection.</p></header>${gallery(blueCrossSeries)}<section class="case-section"><h2>The system behind the portraits</h2><p>The collection mixes formal headshots with environmental portraits while keeping the editing and visual language connected.</p></section>`,
    }),
  },
];

for (const page of pages) {
  const directory = path.join(root, "work", page.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.html"), page.html);
}

const indexHtml = pageShell({
  title: "Portrait Collections",
  description: "Separate EastRise and Blue Cross Vermont portrait collections by Oliver Ames.",
  canonical: "portraits-and-people",
  body: `<header class="case-hero"><p class="eyebrow">Portrait collections · 2024–2026</p><h1>Two organizations. Two portrait systems.</h1><p>Browse each collection separately.</p></header><section class="work-category"><div class="work-list"><a class="work-item" href="../eastrise-portraits/"><img src="../../assets/images/work/portraits/amy-vaughan.webp" alt="Portrait of Amy Vaughan" loading="lazy"><span class="work-item__context">EastRise · 2024–2025</span><h3>EastRise Portraits</h3><p>${eastRiseSeries.images.length} leadership and board portraits.</p></a><a class="work-item" href="../blue-cross-portraits/"><img src="../../assets/images/work/portraits/beth-roberts.webp" alt="Portrait of Beth Roberts" loading="lazy"><span class="work-item__context">Blue Cross Vermont and CBSS · 2026</span><h3>Blue Cross Portraits</h3><p>${blueCrossSeries.images.length} staff and leadership portraits.</p></a></div></section>`,
});
await writeFile(path.join(root, "work/portraits-and-people/index.html"), indexHtml);
console.log(`Generated ${data.totalImages} portraits across ${series.length} series.`);

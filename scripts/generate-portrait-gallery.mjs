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

const gallery = (item) => `<section class="case-section portrait-series" aria-labelledby="${item.slug}-title"><h2 id="${item.slug}-title">${item.title}</h2><p>${item.images.length} publicly used and approved portrait selections.</p><div class="portrait-gallery" data-gallery="${item.slug}">${item.images.map((image) => `<figure${image.wide ? ' class="portrait-gallery__wide"' : ""}><img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"><figcaption>${image.caption}</figcaption></figure>`).join("")}</div></section>`;
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>Portraits and People | Ames Consulting</title><meta name="description" content="Leadership, board, and staff portrait photography by Oliver Ames."><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/portraits-and-people/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="page">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1"><header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait series · 2024–2026</p><h1>Consistent enough for a system. Human enough to remember.</h1><p>I photographed leadership, board members, and staff for EastRise, Blue Cross Vermont, and CBSS. The framing stays consistent without asking every person to look the same.</p><p class="portrait-count">${data.totalImages} portraits across two organizational series.</p></header>${series.map(gallery).join("")}<section class="case-section"><h2>The system behind the portraits</h2><p>The work included repeatable lighting and framing, careful editing, and enough variation for each person to look like themselves rather than a template.</p></section></main><footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-writing/">EastRise Writing</a></li><li><a href="../community-photography/">Community Photography</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p></div></div></footer><script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;
await writeFile(path.join(root, "work/portraits-and-people/index.html"), html);
console.log(`Generated ${data.totalImages} portraits across ${series.length} series.`);

#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const archiveManifestPath = "/Users/oliverames/Desktop/Archive Folder/EastRise/Public Photography/Public Photography Manifest.json";
const outputRoot = path.join(root, "assets/images/work/portraits/gallery");
const existingData = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));

const eastRiseNamePattern = /(Headshot|Bio|Alvah-Newhall|Arthur-G\.-Woolf|Frank-G\.-Harris|George-Sales|Greg\.|Ian-Squirrell|Jim-Towne|Margaret-H\.-ODonnell|Mark\.|Rob\.|Sue\.|Valerie\.)/i;
let archive = [];
try {
  archive = JSON.parse(await readFile(archiveManifestPath, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const eastRiseCandidates = archive.filter((item) => item.group.startsWith("Verification Pending") && eastRiseNamePattern.test(path.basename(item.source)));
const eastRise = [];
const eastRiseHashes = new Set();
for (const item of eastRiseCandidates) {
  const hash = createHash("sha256").update(await readFile(item.source)).digest("hex");
  if (!eastRiseHashes.has(hash)) eastRise.push(item);
  eastRiseHashes.add(hash);
}

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

async function processSeries(sources, organization) {
  const images = [];
  for (const [index, source] of sources.entries()) {
    images.push(await processPortrait(source, organization, index));
  }
  return images;
}

const existingEastRise = existingData.series.find((item) => item.slug === "eastrise-leadership-board");
const eastRiseSeries = eastRise.length > 0
  ? {
      title: "EastRise leadership and board",
      slug: "eastrise-leadership-board",
      images: await processSeries(eastRise.map((item) => item.source), "EastRise"),
    }
  : existingEastRise;

const eastRiseNameOverrides = new Map([
  ["Greg", "Greg Hahr"],
  ["Margaret H. ODonnell", "Margaret H. O’Donnell"],
  ["Mark", "Mark Ackerly"],
  ["Rob", "Robert Miller"],
  ["Sue", "Sue Leonard"],
  ["Valerie", "Valerie Beaudin"],
]);
const eastRiseExcluded = new Set([
  "Frank G. Harris",
  "Jim Oberg",
  "Kelley Colby",
  "Lori Grego",
  "Marty DiVenuti",
  "Mike Bouffard",
  "Pamela Wooster",
  "Samantha Waters",
]);
const eastRiseFeatured = new Set([
  "Amanda Seeholzer",
  "Christin Canter",
  "Ian Squirrell",
  "Jim Towne",
  "Kathleen S. Emery Ginn",
  "Margaret H. O’Donnell",
  "Penny Overton",
  "Robert Miller",
  "Shauna Allen",
  "Valerie Beaudin",
  "Yvonne Garand",
]);
eastRiseSeries.images = eastRiseSeries.images.map((image) => {
  const caption = eastRiseNameOverrides.get(image.caption) || image.caption;
  return {
    ...image,
    caption,
    alt: `Portrait of ${caption}`,
    context: caption === "Valerie Beaudin"
      ? "EastRise senior team"
      : caption === "Yvonne Garand"
        ? "Former EastRise senior vice president"
        : "EastRise leadership and board",
    featured: eastRiseFeatured.has(caption),
  };
}).filter((image) => !eastRiseExcluded.has(image.caption));

const canonicalEastRiseRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/EastRise Public Library/Photography/Leadership and Board Headshots/Original Portraits";
const missingCanonicalPortraits = ["Elizabeth Morton.jpg", "Rick Hommel.jpg"];
for (const filename of missingCanonicalPortraits) {
  const name = personName(filename);
  if (!eastRiseSeries.images.some((image) => image.caption === name)) {
    const image = await processPortrait(path.join(canonicalEastRiseRoot, filename), "EastRise", eastRiseSeries.images.length);
    eastRiseSeries.images.push({
      ...image,
      context: "EastRise leadership and board",
      featured: false,
    });
  }
}

if (!eastRiseSeries.images.some((image) => image.caption === "Yvonne Garand")) {
  eastRiseSeries.images.push({
    src: "../../assets/images/testimonials/yvonne-garand.webp",
    alt: "Portrait of Yvonne Garand",
    caption: "Yvonne Garand",
    width: 400,
    height: 400,
    wide: false,
    context: "Former EastRise senior vice president",
    featured: true,
  });
}

const blueCrossSeries = {
  title: "Blue Cross Vermont senior team and Lindsay Segale",
  slug: "blue-cross-cbss",
  images: [
    ["Beth Roberts", "beth-roberts-executive.webp", 1500, 2130, "https://www.bluecrossvt.org/beth-roberts"],
    ["Barbara Demas", "barbara-demas-executive.webp", 1500, 2082, "https://www.bluecrossvt.org/barbara-demas"],
    ["Ruth Greene", "ruth-greene-executive.webp", 1500, 1914, "https://www.bluecrossvt.org/ruth-greene"],
    ["Rebecca Heintz", "rebecca-heintz-executive.webp", 1500, 2010, "https://www.bluecrossvt.org/rebecca-heintz"],
    ["Margaret Pinello-White", "margaret-pinello-white-executive.webp", 1500, 1496, "https://www.bluecrossvt.org/margaret-pinello-white"],
    ["Tom Weigel, M.D.", "tom-weigel-executive.webp", 2000, 1333, "https://www.bluecrossvt.org/tom-weigel"],
    ["Lindsay Segale", "lindsay-segale.webp", 2400, 1600, "Ames Consulting/Portfolio/Blue Cross VT/Headshots/Lindsay Segale/Edited Selects/DSC03351.jpg"],
  ].map(([name, filename, width, height, source]) => ({
    src: `../../assets/images/work/portraits/gallery/blue-cross/${filename}`,
    alt: `Portrait of ${name}`,
    caption: name,
    width,
    height,
    source,
    wide: width / height > 1.18,
  })),
};

const series = [
  eastRiseSeries,
  blueCrossSeries,
];

const data = { generatedAt: "2026-07-30", totalImages: series.reduce((total, item) => total + item.images.length, 0), series };
await writeFile(path.join(root, "assets/data/portraits.json"), `${JSON.stringify(data, null, 2)}\n`);

const gallery = (item) => {
  const isBlueCross = item.slug === "blue-cross-cbss";
  const heading = isBlueCross ? "Senior team and Lindsay Segale" : "The complete collection";
  const description = isBlueCross
    ? "Six senior team headshots and one portrait of Lindsay Segale."
    : `${item.images.length} publicly used and approved portrait selections.`;
  const card = (image) => `<figure><div class="portrait-card__image"><img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></div><figcaption>${image.caption}${image.context ? ` · ${image.context}` : ""}</figcaption></figure>`;
  if (isBlueCross) return `<section class="case-section portrait-series" aria-labelledby="${item.slug}-title"><h2 id="${item.slug}-title">${heading}</h2><p>${description}</p><div class="portrait-gallery portrait-gallery--natural" data-gallery="${item.slug}">${item.images.map(card).join("")}</div></section>`;
  const featured = item.images.filter((image) => image.featured);
  const remaining = item.images.filter((image) => !image.featured);
  return `<section class="case-section portrait-series" aria-labelledby="${item.slug}-title"><h2 id="${item.slug}-title">${heading}</h2><p>${description}</p><h3>Featured portraits</h3><div class="portrait-gallery portrait-gallery--featured" data-gallery="${item.slug}-featured">${featured.map(card).join("")}</div><h3 class="portrait-gallery__subheading">More from the collection</h3><div class="portrait-gallery" data-gallery="${item.slug}-collection">${remaining.map(card).join("")}</div></section>`;
};

const pageShell = ({ title, description, canonical, body }) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${title} | Ames Consulting</title><meta name="description" content="${description}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${canonical}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="page">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${body}</main><footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-portraits/">EastRise Portraits</a></li><li><a href="../blue-cross-portraits/">Blue Cross Portraits</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p></div></div></footer><script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;

const pages = [
  {
    slug: "eastrise-portraits",
    html: pageShell({
      title: "EastRise Portraits",
      description: "EastRise leadership and board portrait photography by Oliver Ames.",
      canonical: "eastrise-portraits",
      body: `<header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait collection · EastRise · 2024–2025</p><h1>EastRise leadership and board portraits.</h1><p>A consistent portrait library made for the website, LinkedIn, press materials, and internal communications without asking every person to look the same.</p><p class="portrait-count">${eastRiseSeries.images.length} portraits in this collection.</p></header>${gallery(eastRiseSeries)}<section class="case-section"><h2>The system behind the portraits</h2><p>Consistent framing and a shared black-and-white treatment made the library useful across channels. Natural light, careful editing, and room for each person kept the portraits human.</p></section>`,
    }),
  },
  {
    slug: "blue-cross-portraits",
    html: pageShell({
      title: "Blue Cross Vermont Portraits",
      description: "Blue Cross Vermont senior team and staff portrait photography by Oliver Ames.",
      canonical: "blue-cross-portraits",
      body: `<header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait collection · Blue Cross Vermont · 2026</p><h1>Blue Cross Vermont portraits.</h1><p>Senior team headshots and a portrait of Lindsay Segale, made for public profiles and organizational storytelling.</p><p class="portrait-count">${blueCrossSeries.images.length} portraits in this collection.</p></header>${gallery(blueCrossSeries)}<section class="case-section"><h2>The system behind the portraits</h2><p>Consistent lighting and careful editing keep the headshots connected while preserving each person’s expression and posture.</p></section>`,
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
  body: `<header class="case-hero"><p class="eyebrow">Portrait collections · 2024–2026</p><h1>Two organizations. Two portrait systems.</h1><p>Browse each collection separately.</p></header><section class="work-category"><div class="work-list"><a class="work-item" href="../eastrise-portraits/"><img src="../../assets/images/work/portraits/amy-vaughan.webp" alt="Portrait of Amy Vaughan" loading="lazy"><span class="work-item__context">EastRise · 2024–2025</span><h3>EastRise Portraits</h3><p>${eastRiseSeries.images.length} leadership and board portraits.</p></a><a class="work-item" href="../blue-cross-portraits/"><img src="../../assets/images/work/portraits/beth-roberts.webp" alt="Portrait of Beth Roberts" loading="lazy"><span class="work-item__context">Blue Cross Vermont · 2026</span><h3>Blue Cross Portraits</h3><p>Seven selected portraits from the senior team and Lindsay Segale.</p></a></div></section>`,
});
await writeFile(path.join(root, "work/portraits-and-people/index.html"), indexHtml);
console.log(`Generated ${data.totalImages} portraits across ${series.length} series.`);

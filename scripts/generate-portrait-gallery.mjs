#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { isWithheldPublicPath } from "./publication-policy.mjs";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const documentsRoot = process.env.AMES_CONSULTING_DOCUMENTS_ROOT
  || path.join(homedir(), "Documents", "Ames Consulting");
const eastRiseReferenceRoot = process.env.AMES_EASTRISE_PORTRAIT_ROOT
  || path.join(documentsRoot, "Portfolio", "EastRise", "Leadership and Board Headshots");
const eastRisePortfolioRoot = process.env.AMES_EASTRISE_PORTFOLIO_ROOT
  || path.join(documentsRoot, "Portfolio", "EastRise");
const eastRiseOriginalRoot = path.join(eastRiseReferenceRoot, "Original Portraits");
const eastRisePageDataPath = process.env.AMES_EASTRISE_PORTRAIT_PAGE_DATA
  || path.join(eastRiseReferenceRoot, "Page Data.json");
const eastRiseYvonneSourcePath = process.env.AMES_EASTRISE_YVONNE_SOURCE
  || path.join(eastRiseReferenceRoot, "033 Facebook Post", "033 Original 148037c2f051.jpg");
const outputRoot = path.join(root, "assets/images/work/portraits/gallery");
const existingData = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));
const eastRiseSourceData = JSON.parse(await readFile(
  path.join(root, "assets/data/eastrise-portrait-sources.json"),
  "utf8",
));

function personName(file) {
  return path.basename(file, path.extname(file))
    .replace(/-?(Headshot|Bio)(-\d+)?/gi, "")
    .replace(/-?500x571-?\d*/gi, "")
    .replace(/ - (LinkedIn.*|Option \d+|Reduced Hair Test)$/i, "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function processPortrait(source, organization, index, metadata = {}) {
  const data = await readFile(source);
  const hash = createHash("sha256").update(data).digest("hex").slice(0, 12);
  const { displayName, outputName, ...storedMetadata } = metadata;
  const name = displayName || personName(source);
  const base = `${outputName || name || `portrait-${index + 1}`}-${hash}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    ...storedMetadata,
  };
}

const eastRiseNameOverrides = new Map([
  ["Greg", "Greg Hahr"],
  ["Margaret H. ODonnell", "Margaret H. O’Donnell"],
  ["Mark", "Mark Ackerly"],
  ["Rob", "Robert Miller"],
  ["Sue", "Sue Leonard"],
  ["Valerie", "Valerie Beaudin"],
]);
const currentLeadershipNames = new Set([
  "Amy Vaughan",
  "Arthur G. Woolf",
  "Elizabeth Morton",
  "Frank G. Harris",
  "George Sales",
  "Greg Hahr",
  "Julie Lineberger",
  "Margaret H. O’Donnell",
  "Mark Ackerly",
  "Michael Hogan",
  "Rick Hommel",
  "Robert Miller",
  "Spencer Newman",
  "Stephanie Meunier",
  "Subha Luck",
  "Sue Leonard",
  "Valerie Beaudin",
]);
const yvonneSourcePage = "https://www.facebook.com/photo/?fbid=6062881253790078&set=a.556826133310535";

function normalizedPersonKey(value) {
  return value.normalize("NFKD").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

async function officialEastRisePortraits() {
  let pageData;
  try {
    pageData = JSON.parse(await readFile(eastRisePageDataPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
  if (
    pageData.sourceUrl !== "https://www.eastrise.com/leadership/"
    || pageData.photographer !== "Oliver Ames"
    || !/^\d{4}-\d{2}-\d{2}$/.test(pageData.captureDate)
    || pageData.portraits?.length !== 17
  ) {
    throw new Error(`${eastRisePageDataPath} does not match the verified 17-portrait EastRise reference.`);
  }

  const files = await readdir(eastRiseOriginalRoot);
  const fileByPerson = new Map(
    files.map((filename) => [normalizedPersonKey(personName(filename)), filename]),
  );
  const images = [];
  for (const [index, record] of pageData.portraits.entries()) {
    const urlName = personName(decodeURIComponent(new URL(record.originalUrl).pathname));
    const expectedName = record.alt || urlName;
    const filename = fileByPerson.get(normalizedPersonKey(expectedName));
    if (!filename) throw new Error(`Missing official EastRise portrait source for ${expectedName}.`);
    const image = await processPortrait(
      path.join(eastRiseOriginalRoot, filename),
      "EastRise",
      index,
      {
        source: record.originalUrl,
        sourcePage: pageData.sourceUrl,
        portraitGroup: "leadership",
        publicContext: "current leadership profile",
        publishedDate: null,
        dateEvidence: {
          date: pageData.captureDate,
          basis: "source-page-verification",
        },
      },
    );
    const caption = eastRiseNameOverrides.get(image.caption) || image.caption;
    images.push({ ...image, caption, alt: `Portrait of ${caption}` });
  }
  return {
    images,
    sourcePage: pageData.sourceUrl,
    sourceCaptureDate: pageData.captureDate,
    photographer: pageData.photographer,
  };
}

const existingEastRise = existingData.series.find((item) => item.slug === "eastrise-leadership-board");
const officialEastRise = await officialEastRisePortraits();
if (!existingEastRise) throw new Error("portraits.json is missing the EastRise portrait series.");
if (
  eastRiseSourceData.verificationDate !== "2026-03-20"
  || eastRiseSourceData.evidenceBasis !== "source-page-verification"
  || eastRiseSourceData.images?.length !== 23
) {
  throw new Error("eastrise-portrait-sources.json must contain the 23 verified public portrait sources.");
}
if (eastRiseSourceData.publishedVariants?.length !== 1) {
  throw new Error("eastrise-portrait-sources.json must contain the verified published LinkedIn portrait variant.");
}

const sourceByCaption = new Map(eastRiseSourceData.images.map((image) => [image.caption, image]));
if (sourceByCaption.size !== 23) {
  throw new Error("eastrise-portrait-sources.json contains duplicate portrait names.");
}
const [lukeSuitSource] = eastRiseSourceData.publishedVariants;
if (
  lukeSuitSource.variantId !== "luke-buglion-gluck-suit"
  || lukeSuitSource.caption !== "Luke Buglion Gluck"
  || lukeSuitSource.outputName !== "Luke Buglion Gluck Suit"
  || lukeSuitSource.insertAfterCaption !== "Luke Buglion Gluck"
  || lukeSuitSource.publishedDate !== "2024-05-21"
  || lukeSuitSource.dateBasis !== "public-source-url-timestamp"
  || !/^https:\/\/media\.licdn\.com\//.test(lukeSuitSource.source)
  || lukeSuitSource.sourcePage !== "https://www.facebook.com/EastRiseCU/posts/pfbid02JLDQ9Hs9s2PdKoaeYg3XWvaJh9Wa4Ta8suMSALxZraZa7N4puMyqACDqqbySNeDtl"
  || !/^[a-f0-9]{64}$/.test(lukeSuitSource.sourceSha256)
) {
  throw new Error("The published Luke Buglion Gluck variant source metadata is incomplete.");
}

const leadershipImages = officialEastRise?.images
  || existingEastRise.images.filter((image) => currentLeadershipNames.has(image.caption));
if (leadershipImages.length !== 17) {
  throw new Error(`Expected 17 current leadership portraits, found ${leadershipImages.length}.`);
}

const portraitImages = existingEastRise.images
  .filter((image) => sourceByCaption.has(image.caption) && !image.variantId)
  .map((image) => {
    const publicSource = sourceByCaption.get(image.caption);
    const {
      archiveNote: _archiveNote,
      context: _context,
      featured: _featured,
      ...portrait
    } = image;
    return {
      ...portrait,
      alt: `Portrait of ${image.caption}`,
      source: publicSource.source,
      sourcePage: publicSource.sourcePage,
      portraitGroup: "portrait",
      publicContext: publicSource.publicContext,
      publishedDate: null,
      dateEvidence: {
        date: eastRiseSourceData.verificationDate,
        basis: eastRiseSourceData.evidenceBasis,
      },
      ...(publicSource.capturedDate ? { capturedDate: publicSource.capturedDate } : {}),
      ...(publicSource.captureDateBasis ? { captureDateBasis: publicSource.captureDateBasis } : {}),
    };
  });
if (portraitImages.length !== 23) {
  throw new Error(`Expected 23 additional formal portraits, found ${portraitImages.length}.`);
}

async function publishedVariantPortrait(record, index) {
  const sourcePath = path.resolve(eastRisePortfolioRoot, record.sourceFile);
  const relativeSourcePath = path.relative(eastRisePortfolioRoot, sourcePath);
  if (relativeSourcePath.startsWith("..") || path.isAbsolute(relativeSourcePath)) {
    throw new Error(`Published portrait source escapes the EastRise portfolio root: ${record.sourceFile}`);
  }
  const metadata = {
    displayName: record.caption,
    outputName: record.outputName,
    variantId: record.variantId,
    source: record.source,
    sourcePage: record.sourcePage,
    portraitGroup: "portrait",
    publicContext: record.publicContext,
    publishedDate: record.publishedDate,
    dateEvidence: {
      date: record.publishedDate,
      basis: record.dateBasis,
    },
    sourceEvidence: record.dateEvidence,
    sourceSha256: record.sourceSha256,
    sourceManifestFilename: record.sourceManifestFilename,
    sourceManifestVerifiedAt: record.sourceManifestVerifiedAt,
  };
  try {
    const sourceData = await readFile(sourcePath);
    const sourceSha256 = createHash("sha256").update(sourceData).digest("hex");
    if (sourceSha256 !== record.sourceSha256) {
      throw new Error(`Published portrait source hash does not match ${record.sourceFile}.`);
    }
    return await processPortrait(sourcePath, "EastRise", index, metadata);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const existing = existingEastRise.images.find((image) => image.variantId === record.variantId);
    if (!existing) {
      throw new Error(`Missing published portrait source: ${sourcePath}`);
    }
    const { displayName, outputName: _outputName, ...storedMetadata } = metadata;
    return {
      ...existing,
      alt: `Portrait of ${displayName}`,
      caption: displayName,
      ...storedMetadata,
    };
  }
}

const publishedVariantImages = await Promise.all(
  eastRiseSourceData.publishedVariants.map((record, index) => publishedVariantPortrait(record, 41 + index)),
);
const allPortraitImages = portraitImages.flatMap((image) => [
  image,
  ...publishedVariantImages.filter((variant) => (
    eastRiseSourceData.publishedVariants.find((record) => record.variantId === variant.variantId)
      ?.insertAfterCaption === image.caption
  )),
]);
if (allPortraitImages.length !== 24) {
  throw new Error(`Expected 24 additional formal portraits, found ${allPortraitImages.length}.`);
}

async function yvonnePortrait() {
  const metadata = {
    displayName: "Yvonne Garand",
    source: yvonneSourcePage,
    sourcePage: yvonneSourcePage,
    portraitGroup: "leadership",
    publicContext: "VSECU public recognition post",
    publishedDate: "2023-03-08",
    dateEvidence: {
      date: "2023-03-08",
      basis: "public-post-publication",
    },
  };
  try {
    return await processPortrait(eastRiseYvonneSourcePath, "EastRise", 17, metadata);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const existing = existingEastRise.images.find((image) => image.caption === "Yvonne Garand");
    if (!existing) {
      throw new Error(`Missing Yvonne Garand source portrait: ${eastRiseYvonneSourcePath}`);
    }
    const { displayName, ...storedMetadata } = metadata;
    return {
      ...existing,
      alt: `Portrait of ${displayName}`,
      caption: displayName,
      ...storedMetadata,
    };
  }
}

const eastRiseSeries = {
  title: "EastRise formal portraits",
  slug: "eastrise-leadership-board",
  sourcePage: officialEastRise?.sourcePage || existingEastRise.sourcePage,
  sourceCaptureDate: officialEastRise?.sourceCaptureDate || existingEastRise.sourceCaptureDate,
  photographer: officialEastRise?.photographer || existingEastRise.photographer,
  orderMode: "editorial",
  dateStatus: "dated",
  orderNote: "Every portrait includes dated public-source or native-capture evidence. The gallery order remains editorial.",
  images: [...leadershipImages, await yvonnePortrait(), ...allPortraitImages],
};
if (eastRiseSeries.images.length !== 42) {
  throw new Error(`Expected 42 verified EastRise portraits, found ${eastRiseSeries.images.length}.`);
}

const blueCrossSeries = {
  title: "Blue Cross Vermont senior team and Lindsay Segale",
  slug: "blue-cross-cbss",
  published: false,
  images: [
    ["Beth Roberts", "beth-roberts-executive.webp", 1500, 2130, "https://www.bluecrossvt.org/beth-roberts"],
    ["Barbara Demas", "barbara-demas-executive.webp", 1500, 2082, "https://www.bluecrossvt.org/barbara-demas"],
    ["Ruth Greene", "ruth-greene-executive.webp", 1500, 1914, "https://www.bluecrossvt.org/ruth-greene"],
    ["Rebecca Heintz", "rebecca-heintz-executive.webp", 1500, 2010, "https://www.bluecrossvt.org/rebecca-heintz"],
    ["Margaret Pinello-White", "margaret-pinello-white-executive.webp", 1500, 1496, "https://www.bluecrossvt.org/margaret-pinello-white"],
    ["Tom Weigel, M.D.", "tom-weigel-executive.webp", 2000, 1333, "https://www.bluecrossvt.org/tom-weigel"],
    ["Lindsay Segale", "lindsay-segale.webp", 2400, 1600, ""],
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

const data = { generatedAt: "2026-08-11", totalImages: series.reduce((total, item) => total + item.images.length, 0), series };
await writeFile(path.join(root, "assets/data/portraits.json"), `${JSON.stringify(data, null, 2)}\n`);

const gallery = (item) => {
  const isBlueCross = item.slug === "blue-cross-cbss";
  const dateMetadata = (image) => {
    if (image.publishedDate) return { date: image.publishedDate, basis: "publication" };
    if (image.capturedDate) return { date: image.capturedDate, basis: "native-capture" };
    return image.dateEvidence;
  };
  const card = (image) => {
    if (isBlueCross) {
      return `<figure${image.wide ? ' class="portrait-gallery__wide"' : ""}><div class="portrait-card__image"><img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async"></div><figcaption>${image.caption}</figcaption></figure>`;
    }
    const date = dateMetadata(image);
    if (!date?.date || !date?.basis) throw new Error(`Missing dated portrait evidence for ${image.caption}.`);
    return `<figure${image.wide ? ' class="portrait-gallery__wide"' : ""}><div class="portrait-card__image"><img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" data-date-status="dated" data-date="${date.date}" data-date-basis="${date.basis}"${image.publishedDate ? ` data-published-at="${image.publishedDate}"` : ""}></div><figcaption>${image.caption}</figcaption></figure>`;
  };
  if (isBlueCross) return `<section class="case-section portrait-series" aria-labelledby="${item.slug}-title"><h2 id="${item.slug}-title">Senior team and Lindsay Segale</h2><p>Six senior team headshots and one portrait of Lindsay Segale.</p><div class="portrait-gallery portrait-gallery--natural" data-gallery="${item.slug}">${item.images.map(card).join("")}</div></section>`;
  const leadership = item.images.filter((image) => image.portraitGroup === "leadership");
  const portraits = item.images.filter((image) => image.portraitGroup === "portrait");
  if (leadership.length !== 18 || portraits.length !== 24) {
    throw new Error(`Expected 18 leadership and 24 additional portraits, found ${leadership.length} and ${portraits.length}.`);
  }
  return `<section class="case-section portrait-series" aria-labelledby="eastrise-leadership-title"><h2 id="eastrise-leadership-title">Leadership</h2><p>Eighteen formal portraits, including the 17 people on EastRise’s verified leadership page and Yvonne Garand.</p><div class="portrait-gallery" data-gallery="eastrise-leadership" data-order-mode="${item.orderMode}" data-date-status="dated">${leadership.map(card).join("")}</div></section><section class="case-section portrait-series" aria-labelledby="eastrise-portraits-title"><h2 id="eastrise-portraits-title">Portraits</h2><p>Twenty-four additional formal portraits made for public EastRise profiles, directories, and stories.</p><div class="portrait-gallery" data-gallery="eastrise-portraits" data-order-mode="${item.orderMode}" data-date-status="dated">${portraits.map(card).join("")}</div></section>`;
};

const pageShell = ({ title, description, canonical, body }) => `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${title} | Ames Consulting</title><meta name="description" content="${description}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${canonical}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${body}</main><footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-portraits/">EastRise Portraits</a></li><li><a href="../vermont-foodbank-volunteer-day-2026/">Vermont Foodbank</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p></div></div></footer><script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;

const applyPublicationPolicy = (canonical, html) => isWithheldPublicPath(`work/${canonical}/`)
  ? html.replace("<title>", '<meta name="robots" content="noindex"><title>')
  : html;

const pages = [
  {
    slug: "eastrise-portraits",
    html: pageShell({
      title: "EastRise Portraits",
      description: "EastRise leadership and formal portrait photography by Oliver Ames.",
      canonical: "eastrise-portraits",
      body: `<header class="case-hero case-hero--portrait"><p class="eyebrow">Portrait collection · EastRise</p><h1>EastRise formal portraits.</h1><p>A consistent portrait library made for public profiles, press materials, and organizational communications.</p><p class="portrait-count">${eastRiseSeries.images.length} portraits in this collection.</p></header>${gallery(eastRiseSeries)}<section class="case-section"><h2>The system behind the portraits</h2><p>Consistent framing and careful editing made the library useful across channels while preserving both color and black-and-white portraits. Natural light and room for each person kept the portraits human.</p></section><section class="case-section"><h2>Collection provenance</h2><p>Seventeen leadership portraits were verified against <a href="${eastRiseSeries.sourcePage}" rel="noopener">EastRise’s leadership page</a> on July 29, 2026. Yvonne Garand’s portrait was published by VSECU on <a href="${yvonneSourcePage}" rel="noopener">Facebook</a> on March 8, 2023. Twenty-three portraits were verified on their public EastRise source pages on March 20, 2026. Luke Buglion Gluck’s additional suit portrait was published by EastRise on <a href="${lukeSuitSource.sourcePage}" rel="noopener">LinkedIn</a> on May 21, 2024.</p></section>`,
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
  await writeFile(path.join(directory, "index.html"), applyPublicationPolicy(page.slug, page.html));
}

const indexHtml = pageShell({
  title: "EastRise Portraits",
  description: "The EastRise leadership and formal portrait collection by Oliver Ames.",
  canonical: "portraits-and-people",
  body: `<header class="case-hero"><p class="eyebrow">Portrait collection · EastRise</p><h1>EastRise portraits.</h1><p>Browse 42 formal portraits of 41 people made for EastRise and VSECU.</p></header><section class="work-category"><h2>Portrait collection</h2><div class="work-list"><a class="work-item" href="../eastrise-portraits/"><img src="../../assets/images/work/portraits/amy-vaughan.webp" alt="Portrait of Amy Vaughan" loading="lazy"><span class="work-item__context">EastRise</span><h3>EastRise Portraits</h3><p>18 leadership portraits and 24 additional formal portraits.</p></a></div></section>`,
});
await writeFile(path.join(root, "work/portraits-and-people/index.html"), indexHtml);
console.log(`Generated ${data.totalImages} portraits across ${series.length} series.`);

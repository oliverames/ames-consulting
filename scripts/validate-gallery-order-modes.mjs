#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { PUBLIC_HTML_FILES } from "./publication-policy.mjs";

const root = path.resolve(import.meta.dirname, "..");
const photography = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-photography.json"), "utf8"));
const portraits = JSON.parse(await readFile(path.join(root, "assets/data/portraits.json"), "utf8"));
const social = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-social.json"), "utf8"));
const website = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-website-gallery.json"), "utf8"));
const errors = [];
const allowedModes = new Set(["chronological", "editorial", "reverse-chronological"]);
const galleries = [];

function attribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1] || "";
}

function galleryOpeningTag(html, id) {
  return html.match(new RegExp(`<[^>]+\\sdata-gallery="${id}"[^>]*>`))?.[0] || "";
}

function galleryBlock(html, id) {
  return html.match(new RegExp(`<div[^>]+\\sdata-gallery="${id}"[^>]*>([\\s\\S]*?)<\\/div>`))?.[1] || "";
}

function validateSeriesImages(html, galleryId, series, relativePath, requireDateStatus = true) {
  const renderedImages = [...galleryBlock(html, galleryId).matchAll(/<img\s[^>]*>/g)].map((match) => {
    const tag = match[0];
    return {
      file: path.basename(attribute(tag, "src")),
      publishedAt: attribute(tag, "data-published-at"),
      capturedAt: attribute(tag, "data-captured-at"),
      dateBasis: attribute(tag, "data-date-basis"),
      dateStatus: attribute(tag, "data-date-status"),
    };
  });
  if (JSON.stringify(renderedImages.map((image) => image.file)) !== JSON.stringify(series.images.map((image) => path.basename(image.src)))) {
    errors.push(`${relativePath} gallery ${galleryId} does not preserve its declared image order.`);
  }
  for (const [index, rendered] of renderedImages.entries()) {
    const source = series.images[index];
    if (!source) continue;
    if (source.publishedDate) {
      if (
        rendered.publishedAt !== source.publishedDate
        || (requireDateStatus && rendered.dateStatus !== "dated")
      ) {
        errors.push(`${relativePath} gallery ${galleryId} has incorrect date metadata for ${rendered.file}.`);
      }
    } else if (source.capturedDate) {
      if (
        rendered.capturedAt !== source.capturedDate
        || (requireDateStatus && rendered.dateStatus !== "dated")
      ) {
        errors.push(`${relativePath} gallery ${galleryId} has incorrect capture metadata for ${rendered.file}.`);
      }
    } else if (rendered.dateStatus !== "undated" || rendered.publishedAt) {
      errors.push(`${relativePath} gallery ${galleryId} has incorrect undated metadata for ${rendered.file}.`);
    }
    if (source.dateBasis && rendered.dateBasis !== source.dateBasis) {
      errors.push(`${relativePath} gallery ${galleryId} has incorrect date basis for ${rendered.file}.`);
    }
  }
}

function portraitGalleryImages(html, galleryId) {
  const block = html.match(
    new RegExp(`<div class="portrait-gallery"[^>]*data-gallery="${galleryId}"[^>]*>([\\s\\S]*?)<\\/div><\\/section>`),
  )?.[1] || "";
  return [...block.matchAll(/<img\s[^>]*>/g)].map((match) => {
    const tag = match[0];
    return {
      file: path.basename(attribute(tag, "src")),
      alt: attribute(tag, "alt"),
      date: attribute(tag, "data-date"),
      dateBasis: attribute(tag, "data-date-basis"),
      dateStatus: attribute(tag, "data-date-status"),
      publishedAt: attribute(tag, "data-published-at"),
    };
  });
}

function validatePortraitGroup(html, galleryId, images, relativePath) {
  const renderedImages = portraitGalleryImages(html, galleryId);
  const expectedFiles = images.map((image) => path.basename(image.src));
  if (JSON.stringify(renderedImages.map((image) => image.file)) !== JSON.stringify(expectedFiles)) {
    errors.push(`${relativePath} gallery ${galleryId} does not preserve its declared portrait order.`);
  }
  for (const [index, rendered] of renderedImages.entries()) {
    const source = images[index];
    if (!source) continue;
    const expectedDate = source.publishedDate || source.capturedDate || source.dateEvidence?.date || "";
    const expectedBasis = source.publishedDate
      ? "publication"
      : source.capturedDate
        ? "native-capture"
        : source.dateEvidence?.basis || "";
    if (
      rendered.alt !== source.alt
      || rendered.dateStatus !== "dated"
      || rendered.date !== expectedDate
      || rendered.dateBasis !== expectedBasis
      || rendered.publishedAt !== (source.publishedDate || "")
    ) {
      errors.push(`${relativePath} gallery ${galleryId} has incorrect portrait metadata for ${rendered.file}.`);
    }
  }
}

async function readPublicHtml(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

for (const relativePath of PUBLIC_HTML_FILES) {
  const html = await readPublicHtml(relativePath);
  for (const match of html.matchAll(/<[^>]+\sdata-gallery="([^"]+)"[^>]*>/g)) {
    const tag = match[0];
    const mode = attribute(tag, "data-order-mode");
    galleries.push({ relativePath, id: match[1], mode, tag });
    if (!mode) errors.push(`${relativePath} gallery ${match[1]} lacks data-order-mode.`);
    else if (!allowedModes.has(mode)) errors.push(`${relativePath} gallery ${match[1]} has unsupported order mode ${mode}.`);
  }
}

function expectGallery(relativePath, id, mode, dateStatus = "") {
  const matches = galleries.filter((gallery) => gallery.relativePath === relativePath && gallery.id === id);
  if (matches.length !== 1) {
    errors.push(`${relativePath} must contain exactly one ${id} gallery.`);
    return;
  }
  if (matches[0].mode !== mode) errors.push(`${relativePath} gallery ${id} must use ${mode} order.`);
  if (dateStatus && attribute(matches[0].tag, "data-date-status") !== dateStatus) {
    errors.push(`${relativePath} gallery ${id} must use ${dateStatus} date status.`);
  }
}

const photographyPath = "work/eastrise-photography/index.html";
const photographyHtml = await readPublicHtml(photographyPath);
if (photography.totalImages !== 136 || photography.series.length !== 13) {
  errors.push("EastRise photography must contain 136 images across 13 series.");
}
if (photography.series.some((series) => series.slug === "formal-headshots")) {
  errors.push("Formal EastRise portraits must not remain in the photography archive.");
}
const candidPortraitSeries = photography.series.find((series) => series.slug === "eastrise-candid-portraits");
if (!candidPortraitSeries || candidPortraitSeries.images.length !== 1) {
  errors.push("The EastRise candid portrait must remain a separate one-image photography series.");
}
for (const series of photography.series) {
  const galleryId = `eastrise-${series.slug}`;
  expectGallery(photographyPath, galleryId, "editorial");
  validateSeriesImages(photographyHtml, galleryId, series, photographyPath);
}
const renderedPhotographyOrder = galleries
  .filter((gallery) => gallery.relativePath === photographyPath)
  .map((gallery) => gallery.id);
const expectedPhotographyOrder = photography.series.map((series) => `eastrise-${series.slug}`);
if (JSON.stringify(renderedPhotographyOrder) !== JSON.stringify(expectedPhotographyOrder)) {
  errors.push("The EastRise photography page does not render its newest-first series order.");
}

for (const { relativePath, id, slug } of [
  { relativePath: "work/eastrise-launch-campaign/index.html", id: "eastrise-launch-campaign", slug: "eastrise-launch" },
  { relativePath: "work/taylor-hoar-racing/index.html", id: "eastrise-taylor-hoar-racing", slug: "taylor-hoar-racing" },
  { relativePath: "work/taylor-hoar-racing/index.html", id: "eastrise-veggievango-taylor-hoar", slug: "veggievango-taylor-hoar" },
  { relativePath: "work/wheels-for-warmth/index.html", id: "eastrise-wheels-for-warmth-2024", slug: "wheels-for-warmth-2024" },
]) {
  const series = photography.series.find((item) => item.slug === slug);
  if (!series) {
    errors.push(`${relativePath} lacks source series ${slug}.`);
    continue;
  }
  expectGallery(relativePath, id, "editorial");
  validateSeriesImages(
    await readPublicHtml(relativePath),
    id,
    series,
    relativePath,
    relativePath !== "work/eastrise-launch-campaign/index.html",
  );
}

const portraitPath = "work/eastrise-portraits/index.html";
const portraitHtml = await readPublicHtml(portraitPath);
const eastRisePortraits = portraits.series.find((series) => series.slug === "eastrise-leadership-board");
const leadershipNames = [
  "Elizabeth Morton",
  "Greg Hahr",
  "Mark Ackerly",
  "Valerie Beaudin",
  "Rick Hommel",
  "Sue Leonard",
  "Robert Miller",
  "Subha Luck",
  "Frank G. Harris",
  "Margaret H. O’Donnell",
  "Stephanie Meunier",
  "Julie Lineberger",
  "Amy Vaughan",
  "Michael Hogan",
  "George Sales",
  "Spencer Newman",
  "Arthur G. Woolf",
  "Yvonne Garand",
];
const leadershipPortraits = eastRisePortraits?.images.filter((image) => image.portraitGroup === "leadership") || [];
const additionalPortraits = eastRisePortraits?.images.filter((image) => image.portraitGroup === "portrait") || [];
if (!eastRisePortraits || eastRisePortraits.images.length !== 42) {
  errors.push("The EastRise portrait order check requires all 42 formal portraits.");
} else if (new Set(eastRisePortraits.images.map((image) => image.caption)).size !== 41) {
  errors.push("The 42 EastRise formal portraits must represent 41 people.");
}
if (
  leadershipPortraits.length !== 18
  || JSON.stringify(leadershipPortraits.map((image) => image.caption)) !== JSON.stringify(leadershipNames)
) {
  errors.push("The Leadership gallery must contain the 17 current EastRise leaders plus Yvonne Garand.");
}
if (
  additionalPortraits.length !== 24
  || new Set(additionalPortraits.map((image) => image.caption)).size !== 23
  || additionalPortraits.filter((image) => image.caption === "Luke Buglion Gluck").length !== 2
) {
  errors.push("The Portraits gallery must contain 24 images of 23 people, including both Luke Buglion Gluck portraits.");
}
expectGallery(portraitPath, "eastrise-leadership", "editorial", "dated");
expectGallery(portraitPath, "eastrise-portraits", "editorial", "dated");
validatePortraitGroup(portraitHtml, "eastrise-leadership", leadershipPortraits, portraitPath);
validatePortraitGroup(portraitHtml, "eastrise-portraits", additionalPortraits, portraitPath);

const socialPath = "work/eastrise-social/index.html";
const socialHtml = await readPublicHtml(socialPath);
expectGallery(socialPath, "eastrise-social", "reverse-chronological");
const socialTag = galleryOpeningTag(socialHtml, "eastrise-social");
if (attribute(socialTag, "data-undated-placement") !== "after-dated") {
  errors.push("The EastRise social gallery must put undated posts after dated posts.");
}
const socialPosts = new Map(social.posts.map((post) => [path.basename(post.screenshot), post]));
const renderedSocial = [...galleryBlock(socialHtml, "eastrise-social").matchAll(/<img\s[^>]*>/g)].map((match) => {
  const tag = match[0];
  const file = path.basename(attribute(tag, "src"));
  return {
    file,
    post: socialPosts.get(file),
    publishedAt: attribute(tag, "data-published-at"),
    dateStatus: attribute(tag, "data-date-status"),
  };
});
if (JSON.stringify(renderedSocial.map((item) => item.post?.id)) !== JSON.stringify(social.highlightIds)) {
  errors.push("The rendered EastRise social highlights do not match their newest-first manifest order.");
}
for (const item of renderedSocial) {
  if (!item.post) {
    errors.push(`The EastRise social gallery contains an unknown screenshot: ${item.file}`);
  } else if (item.post.publishedDate) {
    if (item.dateStatus !== "dated" || item.publishedAt !== item.post.publishedDate) {
      errors.push(`Dated social post lacks matching date metadata: ${item.post.id}`);
    }
  } else if (item.dateStatus !== "undated" || item.publishedAt) {
    errors.push(`Undated social post has incorrect date metadata: ${item.post.id}`);
  }
}
const renderedUndatedSocialIds = renderedSocial.filter((item) => item.dateStatus === "undated").map((item) => item.post?.id);
if (JSON.stringify(renderedUndatedSocialIds) !== JSON.stringify(social.undatedHighlightIds)) {
  errors.push("The rendered EastRise social gallery undated records do not match the declared exceptions.");
}

const websitePath = "work/eastrise-website/index.html";
const websiteHtml = await readPublicHtml(websitePath);
expectGallery(websitePath, "eastrise-website", website.orderMode);
const renderedWebsiteImages = [...galleryBlock(websiteHtml, "eastrise-website").matchAll(/<img\s[^>]*src="([^"]+)"[^>]*>/g)]
  .map((match) => path.basename(match[1]));
const expectedWebsiteImages = website.images.map((image) => path.basename(image.src));
if (JSON.stringify(renderedWebsiteImages) !== JSON.stringify(expectedWebsiteImages)) {
  errors.push("The EastRise website screenshots do not match the declared editorial order.");
}
for (const [index, image] of website.images.entries()) {
  if (image.position !== index + 1) errors.push(`Invalid EastRise website screenshot position: ${image.src}`);
  try {
    await access(path.join(root, image.src));
  } catch {
    errors.push(`Missing EastRise website screenshot: ${image.src}`);
  }
}
if (website.schemaVersion !== 1 || website.orderMode !== "editorial" || website.dateStatus !== "not-applicable" || !website.orderNote?.trim()) {
  errors.push("The EastRise website gallery must declare a documented editorial, non-chronological order.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated declared order modes for ${galleries.length} public gallery containers.`);
}

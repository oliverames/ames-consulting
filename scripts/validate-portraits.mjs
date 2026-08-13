import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/portraits.json", "utf8"));
const sourceData = JSON.parse(await readFile("assets/data/eastrise-portrait-sources.json", "utf8"));
const eastRiseHtml = await readFile("work/eastrise-portraits/index.html", "utf8");
const errors = [];
const sources = new Set();
const officialEastRiseNames = [
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
];
const yvonneSourcePage = "https://www.facebook.com/photo/?fbid=6062881253790078&set=a.556826133310535";

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function sameValues(actual, expected) {
  return JSON.stringify(sorted(actual)) === JSON.stringify(sorted(expected));
}

function galleryBlock(html, id) {
  const start = html.search(new RegExp(`<div[^>]+data-gallery="${id}"[^>]*>`));
  if (start < 0) return "";
  const end = html.indexOf("</section>", start);
  return end < 0 ? "" : html.slice(start, end);
}

function galleryOpeningTag(html, id) {
  return html.match(new RegExp(`<div[^>]+data-gallery="${id}"[^>]*>`))?.[0] || "";
}

function renderedSources(html, id) {
  return [...galleryBlock(html, id).matchAll(/<img\s[^>]*src="([^"]+)"[^>]*>/g)]
    .map((match) => match[1]);
}

if (data.series.length !== 2) errors.push(`Expected 2 portrait series, found ${data.series.length}.`);
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("Portrait total does not match the series image count.");
}
if (data.totalImages !== 49) errors.push(`Expected 49 retained portraits, found ${data.totalImages}.`);

const eastRiseSeries = data.series.find((series) => series.slug === "eastrise-leadership-board");
const blueCrossSeries = data.series.find((series) => series.slug === "blue-cross-cbss");
const eastRiseImages = eastRiseSeries?.images || [];
const leadership = eastRiseImages.filter((image) => image.portraitGroup === "leadership");
const portraits = eastRiseImages.filter((image) => image.portraitGroup === "portrait");
const sourceByCaption = new Map(sourceData.images?.map((image) => [image.caption, image]) || []);
const publishedVariants = sourceData.publishedVariants || [];
const publishedVariantById = new Map(publishedVariants.map((image) => [image.variantId, image]));

if (eastRiseImages.length !== 42) errors.push(`Expected 42 EastRise portraits, found ${eastRiseImages.length}.`);
if (leadership.length !== 18) errors.push(`Expected 18 EastRise leadership portraits, found ${leadership.length}.`);
if (portraits.length !== 24) errors.push(`Expected 24 additional formal portraits, found ${portraits.length}.`);
if (blueCrossSeries?.images.length !== 7 || blueCrossSeries.published !== false) {
  errors.push("Expected seven preserved, withheld Blue Cross portraits.");
}
if (
  eastRiseSeries?.sourcePage !== "https://www.eastrise.com/leadership/"
  || eastRiseSeries?.sourceCaptureDate !== "2026-07-29"
  || eastRiseSeries?.photographer !== "Oliver Ames"
) {
  errors.push("EastRise portrait source metadata does not match the supplied leadership-page reference.");
}
if (
  eastRiseSeries?.orderMode !== "editorial"
  || eastRiseSeries?.dateStatus !== "dated"
  || !eastRiseSeries?.orderNote?.trim()
) {
  errors.push("EastRise portraits must declare an editorial collection with dated evidence.");
}
if (sourceData.verificationDate !== "2026-03-20" || sourceData.evidenceBasis !== "source-page-verification") {
  errors.push("The public portrait source map must identify the March 20, 2026 source-page verification.");
}
if (sourceData.images?.length !== 23 || sourceByCaption.size !== 23) {
  errors.push("The public portrait source map must contain 23 unique formal portraits.");
}
if (publishedVariants.length !== 1 || publishedVariantById.size !== 1) {
  errors.push("The public portrait source map must contain one unique published portrait variant.");
}

const expectedLeadershipNames = [...officialEastRiseNames, "Yvonne Garand"];
if (!sameValues(leadership.map((image) => image.caption), expectedLeadershipNames)) {
  errors.push("The Leadership gallery must contain the verified 17-person leadership page plus Yvonne Garand.");
}
if (!sameValues(
  portraits.map((image) => image.caption),
  [...sourceByCaption.keys(), ...publishedVariants.map((image) => image.caption)],
)) {
  errors.push("The Portraits gallery does not match the 23 public source records and one published variant.");
}
if (new Set(eastRiseImages.map((image) => image.caption)).size !== 41) {
  errors.push("The 42 EastRise portraits must represent 41 people.");
}
const repeatedCaptions = eastRiseImages
  .map((image) => image.caption)
  .filter((caption, index, captions) => captions.indexOf(caption) !== index);
if (!sameValues(new Set(repeatedCaptions), ["Luke Buglion Gluck"])) {
  errors.push("Luke Buglion Gluck must be the only person represented by two formal portraits.");
}

for (const image of leadership.filter((item) => item.caption !== "Yvonne Garand")) {
  if (!officialEastRiseNames.includes(image.caption)) {
    errors.push(`Unsupported Leadership portrait: ${image.caption}.`);
  }
  if (!/^https:\/\/www\.eastrise\.com\/files\//.test(image.source)) {
    errors.push(`Invalid direct EastRise image URL: ${image.caption}.`);
  }
  if (image.sourcePage !== "https://www.eastrise.com/leadership/") {
    errors.push(`Invalid leadership source page: ${image.caption}.`);
  }
  if (
    image.publishedDate !== null
    || image.dateEvidence?.date !== "2026-07-29"
    || image.dateEvidence?.basis !== "source-page-verification"
  ) {
    errors.push(`Leadership portrait date evidence is incorrect: ${image.caption}.`);
  }
}

const yvonne = leadership.find((image) => image.caption === "Yvonne Garand");
if (
  yvonne?.source !== yvonneSourcePage
  || yvonne?.sourcePage !== yvonneSourcePage
  || yvonne?.publishedDate !== "2023-03-08"
  || yvonne?.dateEvidence?.date !== "2023-03-08"
  || yvonne?.dateEvidence?.basis !== "public-post-publication"
  || path.basename(yvonne?.src || "") !== "yvonne-garand-9858f4aa5ee3.webp"
) {
  errors.push("Yvonne Garand must use the preserved Facebook portrait and its March 8, 2023 publication evidence.");
}

for (const image of portraits.filter((item) => !item.variantId)) {
  const expected = sourceByCaption.get(image.caption);
  if (!expected) continue;
  if (image.source !== expected.source || !/^https:\/\/www\.eastrise\.com\/files\//.test(image.source)) {
    errors.push(`Incorrect direct public image URL: ${image.caption}.`);
  }
  if (image.sourcePage !== expected.sourcePage || !/^https:\/\/www\.eastrise\.com\//.test(image.sourcePage)) {
    errors.push(`Incorrect public source page: ${image.caption}.`);
  }
  if (image.publicContext !== expected.publicContext) {
    errors.push(`Incorrect public-use classification: ${image.caption}.`);
  }
  if (
    image.publishedDate !== null
    || image.dateEvidence?.date !== "2026-03-20"
    || image.dateEvidence?.basis !== "source-page-verification"
  ) {
    errors.push(`Public portrait verification evidence is incorrect: ${image.caption}.`);
  }
  if (
    image.caption === "Jim Towne"
    && (
      image.capturedDate !== "2025-08-14"
      || image.captureDateBasis !== "native-exif-datetime-original"
    )
  ) {
    errors.push("Jim Towne must retain the August 14, 2025 native EXIF capture date.");
  }
  if (image.caption !== "Jim Towne" && (image.capturedDate || image.captureDateBasis)) {
    errors.push(`Unsupported capture-date claim: ${image.caption}.`);
  }
}

const lukeSuitSource = publishedVariantById.get("luke-buglion-gluck-suit");
if (
  lukeSuitSource?.caption !== "Luke Buglion Gluck"
  || lukeSuitSource?.outputName !== "Luke Buglion Gluck Suit"
  || lukeSuitSource?.insertAfterCaption !== "Luke Buglion Gluck"
  || !/^https:\/\/media\.licdn\.com\//.test(lukeSuitSource?.source || "")
  || lukeSuitSource?.sourcePage !== "https://www.facebook.com/EastRiseCU/posts/pfbid02JLDQ9Hs9s2PdKoaeYg3XWvaJh9Wa4Ta8suMSALxZraZa7N4puMyqACDqqbySNeDtl"
  || lukeSuitSource?.publicContext !== "EastRise LinkedIn published portrait"
  || lukeSuitSource?.publishedDate !== "2024-05-21"
  || lukeSuitSource?.dateBasis !== "public-source-url-timestamp"
  || !lukeSuitSource?.dateEvidence?.trim()
  || lukeSuitSource?.sourceFile !== "Headshots/li_f23578cab800.jpg"
  || lukeSuitSource?.sourceSha256 !== "08f0d5347838546f9603c2eed8ed38ffccdc93fb98d7d5525c01c1ce71fa3b86"
  || lukeSuitSource?.sourceManifestFilename !== "posts/li_f23578cab800.jpg"
  || lukeSuitSource?.sourceManifestVerifiedAt !== "2026-03-20T17:57:08.043209Z"
) {
  errors.push("The published Luke Buglion Gluck source record is incomplete or unsupported.");
}

const lukeSuit = portraits.find((image) => image.variantId === "luke-buglion-gluck-suit");
if (
  lukeSuit?.caption !== "Luke Buglion Gluck"
  || lukeSuit?.source !== lukeSuitSource?.source
  || lukeSuit?.sourcePage !== lukeSuitSource?.sourcePage
  || lukeSuit?.publicContext !== lukeSuitSource?.publicContext
  || lukeSuit?.publishedDate !== "2024-05-21"
  || lukeSuit?.dateEvidence?.date !== "2024-05-21"
  || lukeSuit?.dateEvidence?.basis !== "public-source-url-timestamp"
  || lukeSuit?.sourceEvidence !== lukeSuitSource?.dateEvidence
  || lukeSuit?.sourceSha256 !== lukeSuitSource?.sourceSha256
  || lukeSuit?.sourceManifestFilename !== lukeSuitSource?.sourceManifestFilename
  || lukeSuit?.sourceManifestVerifiedAt !== lukeSuitSource?.sourceManifestVerifiedAt
  || path.basename(lukeSuit?.src || "") !== "luke-buglion-gluck-suit-08f0d5347838.webp"
) {
  errors.push("The Portraits gallery must retain the verified May 21, 2024 Luke Buglion Gluck suit portrait.");
}
const canonicalLuke = portraits.find((image) => image.caption === "Luke Buglion Gluck" && !image.variantId);
if (path.basename(canonicalLuke?.src || "") !== "luke-buglion-gluck-d4bac0e9c5f2.webp") {
  errors.push("The canonical EastRise website crop for Luke Buglion Gluck must remain in the Portraits gallery.");
}

if (eastRiseImages.some((image) => image.archiveNote)) {
  errors.push("EastRise portraits must not retain the disproven archive-unavailable note.");
}
if (/original page URLs|native captures are unavailable|retained from Oliver Ames’s archive/i.test(JSON.stringify(data))) {
  errors.push("Portrait data contains false archive-unavailable copy.");
}

for (const [galleryId, expectedImages, dateStatus] of [
  ["eastrise-leadership", leadership, "dated"],
  ["eastrise-portraits", portraits, "dated"],
]) {
  const openingTag = galleryOpeningTag(eastRiseHtml, galleryId);
  if (!openingTag.includes('data-order-mode="editorial"') || !openingTag.includes(`data-date-status="${dateStatus}"`)) {
    errors.push(`${galleryId} must expose editorial order and ${dateStatus} date status.`);
  }
  const rendered = renderedSources(eastRiseHtml, galleryId);
  if (JSON.stringify(rendered) !== JSON.stringify(expectedImages.map((image) => image.src))) {
    errors.push(`${galleryId} does not render the declared portrait order.`);
  }
  for (const image of expectedImages) {
    const expectedDate = image.publishedDate || image.capturedDate || image.dateEvidence?.date;
    const expectedBasis = image.publishedDate
      ? "publication"
      : image.capturedDate
        ? "native-capture"
        : image.dateEvidence?.basis;
    const imageTag = galleryBlock(eastRiseHtml, galleryId)
      .match(new RegExp(`<img[^>]+src="${image.src.replaceAll(".", "\\.")}"[^>]*>`))?.[0] || "";
    if (
      !imageTag.includes('data-date-status="dated"')
      || !imageTag.includes(`data-date="${expectedDate}"`)
      || !imageTag.includes(`data-date-basis="${expectedBasis}"`)
    ) {
      errors.push(`Rendered date evidence is incorrect: ${image.caption}.`);
    }
    const publishedAt = imageTag.match(/data-published-at="([^"]+)"/)?.[1] || "";
    if (publishedAt !== (image.publishedDate || "")) {
      errors.push(`Published-at metadata is incorrect: ${image.caption}.`);
    }
  }
}
if (!eastRiseHtml.includes("Eighteen formal portraits") || !eastRiseHtml.includes("Twenty-four additional formal portraits")) {
  errors.push("The EastRise page must state the 18-person Leadership and 24-image Portraits totals.");
}
if (!eastRiseHtml.includes("on July 29, 2026") || !eastRiseHtml.includes("on March 20, 2026")) {
  errors.push("The EastRise page must state the source-page verification dates.");
}
if (!eastRiseHtml.includes("on March 8, 2023")) {
  errors.push("The EastRise page must state Yvonne Garand’s public-post publication date.");
}
if (!eastRiseHtml.includes("on May 21, 2024")) {
  errors.push("The EastRise page must state Luke Buglion Gluck’s LinkedIn publication date.");
}
if (/original page URLs|native captures are unavailable|retained from Oliver Ames’s archive/i.test(eastRiseHtml)) {
  errors.push("The EastRise page contains false archive-unavailable copy.");
}
if (/\b(?:40|41) portraits\b/i.test(eastRiseHtml)) {
  errors.push("Generated portrait pages retain an obsolete portrait total.");
}

const eastRiseAssetDirectory = "assets/images/work/portraits/gallery/eastrise";
const retainedEastRiseAssets = new Set(eastRiseImages.map((image) => path.basename(image.src)));
for (const entry of await readdir(eastRiseAssetDirectory, { withFileTypes: true })) {
  if (entry.isFile() && !entry.name.startsWith(".") && !retainedEastRiseAssets.has(entry.name)) {
    errors.push(`Unreferenced EastRise portrait derivative: ${entry.name}`);
  }
}

for (const [seriesIndex, series] of data.series.entries()) {
  const pageDirectory = seriesIndex === 0 ? "work/eastrise-portraits" : "work/blue-cross-portraits";
  for (const image of series.images) {
    if (sources.has(image.src)) errors.push(`Duplicate portrait source: ${image.src}`);
    sources.add(image.src);
    if (!image.alt || !image.caption) errors.push(`Missing portrait description: ${image.src}`);
    if (!(image.width > 0 && image.height > 0)) errors.push(`Invalid portrait dimensions: ${image.src}`);
    try {
      await access(path.resolve(pageDirectory, image.src));
    } catch {
      errors.push(`Missing portrait asset: ${image.src}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("Validated 42 EastRise portraits of 41 people in the 18-person Leadership and 24-image Portraits galleries, plus seven withheld Blue Cross portraits.");
}

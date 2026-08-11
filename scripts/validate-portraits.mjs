import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/portraits.json", "utf8"));
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

if (data.series.length !== 2) errors.push(`Expected 2 portrait series, found ${data.series.length}.`);
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("Portrait total does not match the series image count.");
}
if (data.totalImages !== 47) errors.push(`Expected 47 retained portraits, found ${data.totalImages}.`);

const eastRiseSeries = data.series.find((series) => series.slug === "eastrise-leadership-board");
const blueCrossSeries = data.series.find((series) => series.slug === "blue-cross-cbss");
if (eastRiseSeries?.images.length !== 40) errors.push(`Expected 40 EastRise portraits, found ${eastRiseSeries?.images.length || 0}.`);
if (blueCrossSeries?.images.length !== 7 || blueCrossSeries.published !== false) {
  errors.push("Expected seven preserved, withheld Blue Cross portraits.");
}
if (
  eastRiseSeries?.sourcePage !== "https://www.eastrise.com/leadership/"
  || eastRiseSeries?.sourceCaptureDate !== "2026-07-29"
  || eastRiseSeries?.photographer !== "Oliver Ames"
) {
  errors.push("EastRise portrait source metadata does not match the supplied public-page reference.");
}
const officialEastRise = (eastRiseSeries?.images || []).filter((image) => image.source);
if (officialEastRise.length !== 17) errors.push(`Expected 17 current-page EastRise portraits, found ${officialEastRise.length}.`);
if (JSON.stringify(officialEastRise.map((image) => image.caption).sort()) !== JSON.stringify(officialEastRiseNames.sort())) {
  errors.push("EastRise current-page portrait names do not match Page Data.json.");
}
for (const image of officialEastRise) {
  if (!/^https:\/\/www\.eastrise\.com\/files\//.test(image.source)) {
    errors.push(`Invalid EastRise source image URL: ${image.src}`);
  }
}
const archivedEastRise = (eastRiseSeries?.images || []).filter((image) => !image.source);
if (archivedEastRise.length !== 23 || archivedEastRise.some((image) => !image.archiveNote)) {
  errors.push("Expected 23 EastRise archive portraits with honest provenance notes.");
}
if ((eastRiseSeries?.images || []).some((image) => image.caption === "Yvonne Garand")) {
  errors.push("Yvonne Garand belongs on the testimonial page, not in the 40-portrait EastRise collection.");
}
const eastRiseAssetDirectory = "assets/images/work/portraits/gallery/eastrise";
const retainedEastRiseAssets = new Set((eastRiseSeries?.images || []).map((image) => path.basename(image.src)));
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
  console.log(`Validated ${data.totalImages} portraits across ${data.series.length} separate collections.`);
}

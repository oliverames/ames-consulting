import { access, readFile } from "node:fs/promises";
import path from "node:path";

const dataPath = "assets/data/eastrise-photography.json";
const data = JSON.parse(await readFile(dataPath, "utf8"));
const errors = [];
const seriesSlugs = new Set();

if (!data.publicSourceOnly) errors.push("The photography manifest must be restricted to public-source images.");
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("The totalImages value does not match the gallery image count.");
}

for (const series of data.series) {
  if (seriesSlugs.has(series.slug)) errors.push(`Duplicate series slug: ${series.slug}`);
  seriesSlugs.add(series.slug);
  const imageSources = new Set();
  for (const image of series.images) {
    if (imageSources.has(image.src)) errors.push(`Duplicate image in ${series.title}: ${image.src}`);
    imageSources.add(image.src);
    if (!image.alt || image.alt.length < 12) errors.push(`Missing useful alt text: ${image.src}`);
    if (!/^https:\/\//.test(image.sourceUrl)) errors.push(`Missing public source URL: ${image.src}`);
    if (!(image.width > 0 && image.height > 0)) errors.push(`Invalid dimensions: ${image.src}`);
    const filePath = path.resolve("work/eastrise-photography", image.src);
    try {
      await access(filePath);
    } catch {
      errors.push(`Missing image file: ${filePath}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${data.totalImages} public photographs across ${data.series.length} series.`);
}

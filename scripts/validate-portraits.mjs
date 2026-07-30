import { access, readFile } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/portraits.json", "utf8"));
const errors = [];
const sources = new Set();

if (data.series.length !== 2) errors.push(`Expected 2 portrait series, found ${data.series.length}.`);
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("Portrait total does not match the series image count.");
}
if (data.totalImages < 40) errors.push(`Portrait gallery unexpectedly contains only ${data.totalImages} images.`);

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

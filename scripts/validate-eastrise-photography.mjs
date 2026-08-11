import { access, readFile } from "node:fs/promises";
import path from "node:path";

const dataPath = "assets/data/eastrise-photography.json";
const data = JSON.parse(await readFile(dataPath, "utf8"));
const errors = [];
const seriesSlugs = new Set();
const nonVisualAltPattern = /^(?:meet\b|stop by\b|we(?:'|’)re thrilled\b|we had an incredible\b|grateful to have\b|there(?:'|’)s a special kind\b|members of the eastrise team\b|each year, vermont foodbank\b|join us in barre\b|new suit goofin\b|we(?:'|’)re out here\b|thank you for voting\b|looking to build\b|happy new year\b|happy national girl\b|swipe to see\b|great picture of brother\b|first race week\b|thunder road international speedbowl$)/i;

if (!data.publicSourceOnly) errors.push("The photography manifest must be restricted to public-source images.");
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("The totalImages value does not match the gallery image count.");
}

for (const series of data.series) {
  if (seriesSlugs.has(series.slug)) errors.push(`Duplicate series slug: ${series.slug}`);
  seriesSlugs.add(series.slug);
  const imageSources = new Set();
  const altCounts = new Map();
  for (const image of series.images) {
    if (imageSources.has(image.src)) errors.push(`Duplicate image in ${series.title}: ${image.src}`);
    imageSources.add(image.src);
    if (path.basename(path.dirname(image.src)) !== series.slug) {
      errors.push(`Image is outside its collection folder (${series.slug}): ${image.src}`);
    }
    if (!image.alt || image.alt.length < 12) errors.push(`Missing useful alt text: ${image.src}`);
    if (image.alt?.length > 180) errors.push(`Alt text is too long: ${image.src}`);
    if (nonVisualAltPattern.test(image.alt || "") || /public photograph|@\w+/.test(image.alt || "")) {
      errors.push(`Alt text describes promotional copy instead of the image: ${image.src}`);
    }
    altCounts.set(image.alt, (altCounts.get(image.alt) || 0) + 1);
    if (!/^https:\/\//.test(image.sourceUrl || "") && !image.publicArchiveNote) {
      errors.push(`Missing public source evidence: ${image.src}`);
    }
    if (!(image.width > 0 && image.height > 0)) errors.push(`Invalid dimensions: ${image.src}`);
    const filePath = path.resolve("work/eastrise-photography", image.src);
    try {
      await access(filePath);
    } catch {
      errors.push(`Missing image file: ${filePath}`);
    }
  }
  for (const [alt, count] of altCounts) {
    if (count > 2) errors.push(`Alt text is reused ${count} times in ${series.title}: ${alt}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${data.totalImages} public photographs across ${data.series.length} series.`);
}

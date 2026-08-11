import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dataPath = "assets/data/eastrise-photography.json";
const data = JSON.parse(await readFile(dataPath, "utf8"));
const errors = [];
const seriesSlugs = new Set();
const withheld = data.confirmedOliverPhotographsWithheld;
const publishedAssetPaths = new Set();
const nonVisualAltPattern = /^(?:meet\b|stop by\b|we(?:'|’)re thrilled\b|we had an incredible\b|grateful to have\b|there(?:'|’)s a special kind\b|members of the eastrise team\b|each year, vermont foodbank\b|join us in barre\b|new suit goofin\b|we(?:'|’)re out here\b|thank you for voting\b|looking to build\b|happy new year\b|happy national girl\b|swipe to see\b|great picture of brother\b|first race week\b|thunder road international speedbowl$)/i;

if (!data.publicSourceOnly) errors.push("The photography manifest must be restricted to public-source images.");
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("The totalImages value does not match the gallery image count.");
}
if (!Array.isArray(withheld) || withheld.length !== 5) {
  errors.push("The manifest must preserve the five confirmed Oliver Ames photographs withheld for incomplete public-source evidence.");
} else {
  const expectedWithheldFiles = new Set([
    "2024-09-30_14-07-13_UTC_DAi0dDkJcT__4.jpg",
    "2024-09-30_14-07-13_UTC_DAi0dDkJcT__5.jpg",
    "2024-09-30_14-07-13_UTC_DAi0dDkJcT__6.jpg",
    "2024-09-30_14-07-13_UTC_DAi0dDkJcT__7.jpg",
    "li_3f3606b341d7.jpg",
  ]);
  const publishedSources = data.series.flatMap((series) => series.images.map((image) => path.basename(image.src, path.extname(image.src)).toLowerCase()));
  for (const image of withheld) {
    if (!expectedWithheldFiles.delete(image.sourceFilename)) {
      errors.push(`Unexpected or duplicate withheld photograph: ${image.sourceFilename}.`);
    }
    if (image.authorship !== "Oliver Ames" || image.releaseStatus !== "withheld") {
      errors.push(`Incorrect authorship or release status for ${image.sourceFilename}.`);
    }
    if (!image.alt || image.alt.length < 12 || !image.expectedSeries || !image.sourcePlatform) {
      errors.push(`Incomplete review record for ${image.sourceFilename}.`);
    }
    if (!Array.isArray(image.missingEvidence) || image.missingEvidence.length === 0) {
      errors.push(`Missing evidence classification for ${image.sourceFilename}.`);
    }
    const sourceStem = path.basename(image.sourceFilename, path.extname(image.sourceFilename)).toLowerCase();
    if (publishedSources.some((published) => published.startsWith(sourceStem))) {
      errors.push(`A withheld photograph appears in a public series: ${image.sourceFilename}.`);
    }
  }
  if (expectedWithheldFiles.size) errors.push(`Missing confirmed withheld photographs: ${[...expectedWithheldFiles].join(", ")}.`);
}

for (const series of data.series) {
  if (seriesSlugs.has(series.slug)) errors.push(`Duplicate series slug: ${series.slug}`);
  seriesSlugs.add(series.slug);
  const imageSources = new Set();
  const altCounts = new Map();
  const visualFingerprints = [];
  for (const image of series.images) {
    if (imageSources.has(image.src)) errors.push(`Duplicate image in ${series.title}: ${image.src}`);
    imageSources.add(image.src);
    publishedAssetPaths.add(path.resolve("work/eastrise-photography", image.src));
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
      const fingerprint = await sharp(filePath)
        .resize(32, 32, { fit: "fill" })
        .greyscale()
        .raw()
        .toBuffer();
      visualFingerprints.push({ src: image.src, fingerprint });
    } catch {
      errors.push(`Missing image file: ${filePath}`);
    }
  }
  for (const [alt, count] of altCounts) {
    if (count > 2) errors.push(`Alt text is reused ${count} times in ${series.title}: ${alt}`);
  }
  for (let left = 0; left < visualFingerprints.length; left += 1) {
    for (let right = left + 1; right < visualFingerprints.length; right += 1) {
      const first = visualFingerprints[left];
      const second = visualFingerprints[right];
      let squaredDifference = 0;
      for (let index = 0; index < first.fingerprint.length; index += 1) {
        const difference = first.fingerprint[index] - second.fingerprint[index];
        squaredDifference += difference * difference;
      }
      const normalizedRmse = Math.sqrt(squaredDifference / first.fingerprint.length) / 255;
      if (normalizedRmse < 0.01) {
        errors.push(`Near-duplicate photographs in ${series.title}: ${first.src} and ${second.src}`);
      }
    }
  }
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(entryPath));
    else if (entry.isFile() && !entry.name.startsWith(".")) files.push(path.resolve(entryPath));
  }
  return files;
}

const assetRoot = "assets/images/work/eastrise/photography";
for (const file of await collectFiles(assetRoot)) {
  if (!publishedAssetPaths.has(file)) errors.push(`Unreferenced EastRise photograph derivative: ${file}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${data.totalImages} public photographs across ${data.series.length} series.`);
}

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const dataPath = "assets/data/eastrise-photography.json";
const data = JSON.parse(await readFile(dataPath, "utf8"));
const social = JSON.parse(await readFile("assets/data/eastrise-social.json", "utf8"));
const socialPhotography = JSON.parse(await readFile("assets/data/eastrise-social-photography.json", "utf8"));
const provenance = JSON.parse(await readFile("assets/data/media-provenance.json", "utf8"));
const provenanceEvidence = JSON.parse(await readFile("assets/data/media-provenance-evidence.json", "utf8"));
const errors = [];
const seriesSlugs = new Set();
const withheld = data.confirmedOliverPhotographsWithheld;
const publishedAssetPaths = new Set();
const publishedManifestAssets = new Set();
const nonVisualAltPattern = /^(?:meet\b|stop by\b|we(?:'|’)re thrilled\b|we had an incredible\b|grateful to have\b|there(?:'|’)s a special kind\b|members of the eastrise team\b|each year, vermont foodbank\b|join us in barre\b|new suit goofin\b|we(?:'|’)re out here\b|thank you for voting\b|looking to build\b|happy new year\b|happy national girl\b|swipe to see\b|great picture of brother\b|first race week\b|thunder road international speedbowl$)/i;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const supportedDateBases = new Set([
  "native-capture",
  "public-platform-metadata",
  "public-source-url-timestamp",
]);
const evidenceCategoryByDateBasis = new Map([
  ["public-platform-metadata", "public_platform_metadata"],
  ["public-source-url-timestamp", "public_source_url_timestamp"],
]);
const evidenceDates = new Map(
  provenanceEvidence.published_dates.flatMap((group) => Object.entries(group.records).map(([asset, publishedDate]) => [
    asset,
    { publishedDate, evidence: group.evidence },
  ])),
);

function assetPath(src) {
  return path.posix.normalize(path.posix.join("work/eastrise-photography", src));
}

function canonicalSocialSourceKey(value) {
  try {
    const source = new URL(value);
    const host = source.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com") {
      const shortcode = source.pathname.match(/^\/(?:[^/]+\/)?(?:p|reel)\/([^/]+)/i)?.[1];
      if (shortcode) return `instagram:${shortcode}`;
    }
    source.hash = "";
    source.search = "";
    source.pathname = source.pathname.replace(/\/$/, "");
    return source.href;
  } catch {
    return value || "";
  }
}

function carouselPosition(src) {
  return Number(src.match(/_(\d+)-[a-f0-9]{12}\.webp$/i)?.[1] || Number.MAX_SAFE_INTEGER);
}

function isValidDate(value) {
  return isoDatePattern.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function publicSourceTimestampDate(sourceUrl) {
  const timestamp = String(sourceUrl || "").match(/\/0\/(\d{13})(?:\?|$)/)?.[1];
  return timestamp ? new Date(Number(timestamp)).toISOString().slice(0, 10) : "";
}

if (data.releaseEvidencePolicy !== "public-source-or-verified-native-capture") {
  errors.push("The photography manifest must require public-source evidence or a verified native capture date.");
}
if (data.archiveOrder !== "newest-first" || data.undatedSeriesPlacement !== "after-dated-series") {
  errors.push("EastRise series must use newest-first archive dates with undated series last.");
}
if (data.archiveDateSource !== "latest verified public publication date") {
  errors.push("EastRise series must identify verified public publication dates as the archive-date source.");
}
if (data.displayOrderMode !== "editorial") {
  errors.push("The EastRise photography archive must identify its display order as editorial.");
}
if (data.totalImages !== data.series.reduce((total, series) => total + series.images.length, 0)) {
  errors.push("The totalImages value does not match the gallery image count.");
}
if (data.totalImages !== 173 || data.series.length !== 16) {
  errors.push("The EastRise photography archive must contain 173 images across 16 series.");
}
const manifestImageByAsset = new Map(data.series.flatMap((series) => (
  series.images.map((image) => [assetPath(image.src), image])
)));
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

let previousArchiveDate = null;
let reachedUndatedSeries = false;
for (const series of data.series) {
  if (series.archiveDate === null) {
    reachedUndatedSeries = true;
  } else if (!isValidDate(series.archiveDate)) {
    errors.push(`Invalid archive date for ${series.title}: ${series.archiveDate}`);
  } else {
    if (reachedUndatedSeries) errors.push(`Dated series follows an undated series: ${series.title}`);
    if (previousArchiveDate && series.archiveDate > previousArchiveDate) {
      errors.push(`Series are not newest-first: ${series.title} follows ${previousArchiveDate}.`);
    }
    previousArchiveDate = series.archiveDate;
  }
}

for (const series of data.series) {
  if (seriesSlugs.has(series.slug)) errors.push(`Duplicate series slug: ${series.slug}`);
  seriesSlugs.add(series.slug);
  const imageSources = new Set();
  const altCounts = new Map();
  const visualFingerprints = [];
  const verifiedDates = [];
  if (series.displayOrderMode !== "editorial") errors.push(`${series.title} must declare editorial display order.`);
  if (!["oldest-first", "curated", "undated"].includes(series.imageOrder)) {
    errors.push(`${series.title} has an unsupported image-order policy.`);
  }
  if (!series.imageOrderNote?.trim()) errors.push(`${series.title} requires an image-order note.`);
  for (const [imageIndex, image] of series.images.entries()) {
    if (imageSources.has(image.src)) errors.push(`Duplicate image in ${series.title}: ${image.src}`);
    imageSources.add(image.src);
    publishedAssetPaths.add(path.resolve("work/eastrise-photography", image.src));
    publishedManifestAssets.add(assetPath(image.src));
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
    if (image.samePublicMediaAs) {
      const targetAsset = assetPath(image.samePublicMediaAs);
      const targetImage = manifestImageByAsset.get(targetAsset);
      if (!targetImage) {
        errors.push(`Duplicate public-media target is absent: ${image.samePublicMediaAs}`);
      } else if (targetAsset === assetPath(image.src)) {
        errors.push(`Image cannot identify itself as duplicate public media: ${image.src}`);
      } else if (
        canonicalSocialSourceKey(image.sourcePage || image.sourceUrl)
        !== canonicalSocialSourceKey(targetImage.sourcePage || targetImage.sourceUrl)
      ) {
        errors.push(`Duplicate public-media records do not share a source post: ${image.src}`);
      }
    }
    const hasPublishedDate = typeof image.publishedDate === "string" && image.publishedDate.length > 0;
    const hasCapturedDate = typeof image.capturedDate === "string" && image.capturedDate.length > 0;
    if (!hasPublishedDate && !hasCapturedDate) {
      errors.push(`Missing publication or native capture date: ${image.src}`);
    }
    if (hasPublishedDate && !isValidDate(image.publishedDate)) {
      errors.push(`Invalid published date: ${image.src}`);
    }
    if (hasCapturedDate && !isValidDate(image.capturedDate)) {
      errors.push(`Invalid captured date: ${image.src}`);
    }
    if (image.dateBasis !== undefined && !supportedDateBases.has(image.dateBasis)) {
      errors.push(`Unsupported date basis for ${image.src}: ${image.dateBasis}`);
    }
    if (image.dateBasis !== undefined && !image.dateEvidence?.trim()) {
      errors.push(`Missing date evidence for ${image.src}`);
    }
    if (!hasPublishedDate) {
      if (image.dateBasis !== "native-capture") {
        errors.push(`Capture-only image must declare native-capture basis: ${image.src}`);
      }
      if (!image.dateEvidence?.trim()) {
        errors.push(`Capture-only image must preserve concise evidence: ${image.src}`);
      }
    } else if (image.dateBasis === "native-capture") {
      errors.push(`Publication date must take precedence over native capture basis: ${image.src}`);
    }
    if (
      image.dateBasis === "public-source-url-timestamp"
      && publicSourceTimestampDate(image.sourceUrl) !== image.publishedDate
    ) {
      errors.push(`Public source timestamp does not match the published date: ${image.src}`);
    }
    const provenanceRecord = provenance.assets?.[assetPath(image.src)];
    if (!provenanceRecord) {
      errors.push(`Missing provenance record: ${image.src}`);
    } else {
      const evidenceRecord = evidenceDates.get(assetPath(image.src));
      const expectedPublishedDate = evidenceRecord?.publishedDate || provenanceRecord.published_date || null;
      if (image.publishedDate !== expectedPublishedDate) {
        errors.push(`Published date does not match provenance: ${image.src}`);
      }
      if (
        evidenceCategoryByDateBasis.has(image.dateBasis)
        && evidenceRecord?.evidence !== evidenceCategoryByDateBasis.get(image.dateBasis)
      ) {
        errors.push(`Date basis does not match provenance evidence: ${image.src}`);
      }
    }
    if (image.publishedDate) verifiedDates.push(image.publishedDate);
    if (series.imageOrder === "oldest-first" && imageIndex > 0) {
      const previous = series.images[imageIndex - 1];
      if (!previous.publishedDate && image.publishedDate) {
        errors.push(`A dated image follows an undated image in ${series.title}: ${image.src}`);
      } else if (previous.publishedDate && image.publishedDate) {
        if (image.publishedDate < previous.publishedDate) {
          errors.push(`Images are not oldest-first in ${series.title}: ${image.src}`);
        } else if (
          image.publishedDate === previous.publishedDate
          && carouselPosition(image.src) < carouselPosition(previous.src)
        ) {
          errors.push(`Source carousel order is not oldest-first in ${series.title}: ${image.src}`);
        }
      }
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
  const latestVerifiedDate = verifiedDates.sort().at(-1) || null;
  if (series.archiveDate !== latestVerifiedDate) {
    errors.push(`${series.title} archive date does not match its latest verified publication date.`);
  }
  if (series.archiveDate && series.archiveDateBasis !== "latest-verified-publication-date") {
    errors.push(`${series.title} has an incorrect archive-date basis.`);
  }
  if (!series.archiveDate && series.archiveDateBasis !== "unverified") {
    errors.push(`${series.title} must identify its archive date as unverified.`);
  }
  if (series.imageOrder === "undated" && verifiedDates.length) {
    errors.push(`${series.title} is marked undated but has verified publication dates.`);
  }
}

const protectedPostIds = new Set([
  "facebook-002", "facebook-003", "facebook-004", "facebook-005", "facebook-007", "facebook-008", "facebook-010", "facebook-011", "facebook-012", "facebook-013", "facebook-015", "facebook-016", "facebook-017", "facebook-018", "facebook-019", "facebook-020", "facebook-021", "facebook-022", "facebook-040",
  "instagram-103", "instagram-117", "instagram-118", "instagram-121",
  "linkedin-073", "linkedin-074", "linkedin-081", "linkedin-083", "linkedin-084", "linkedin-089",
]);
const expectedPendingAuthorshipAssets = new Set([
  "assets/images/work/eastrise/photography/eastrise-launch/2024-10-16_facebook-021_07-d1002ac0db50.webp",
  "assets/images/work/eastrise/photography/eastrise-launch/2024-10-16_facebook-021_08-1e1e3b4d39ef.webp",
  "assets/images/work/eastrise/photography/veggievango-east-rise/2024-10-25_facebook-019_01-b3aabc6a2690.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_01-38dd625691ee.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_02-42fa91fc359a.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_03-796111b6c01f.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_04-07ad3eed74b3.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_05-60509f26621b.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_06-cc42f9afc3c3.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_07-17876fe1e466.webp",
  "assets/images/work/eastrise/photography/wheels-for-warmth-2025/2025-10-24_linkedin-083_08-63cc87dd36b8.webp",
]);
const socialPostsById = new Map(social.posts.map((post) => [post.id, post]));
const coveragePosts = Array.isArray(socialPhotography.posts) ? socialPhotography.posts : [];
const observedPostIds = new Set(coveragePosts.map((post) => post.postId));
for (const postId of protectedPostIds) {
  if (!observedPostIds.delete(postId)) errors.push(`Missing black-and-white social-post coverage record: ${postId}.`);
}
if (observedPostIds.size || coveragePosts.length !== protectedPostIds.size) {
  errors.push(`Unexpected or duplicate black-and-white social-post coverage records: ${[...observedPostIds].join(", ") || "duplicate records"}.`);
}
if (
  socialPhotography.photographicPostCount !== 28
  || socialPhotography.excludedPostCount !== 1
  || socialPhotography.photographicPlacements !== 165
  || socialPhotography.distinctPortfolioAssets !== 126
  || socialPhotography.newlyImportedAssets !== 37
) {
  errors.push("The black-and-white social-post coverage summary must remain 28 photographic posts, one exclusion, 165 placements, 126 distinct assets, and 37 imports.");
}

let calculatedPlacements = 0;
const calculatedDistinctAssets = new Set();
for (const post of coveragePosts) {
  if (!socialPostsById.has(post.postId)) errors.push(`Coverage record does not resolve to an EastRise social post: ${post.postId}.`);
  if (post.status === "excluded") {
    if (
      post.postId !== "facebook-040"
      || post.sourceMediaCount !== 1
      || post.exclusionReason !== "third-party-artwork"
      || post.credit !== "Nathan W. Pyle"
      || post.coverageAssets.length !== 0
    ) {
      errors.push("facebook-040 must remain a one-item Nathan W. Pyle artwork exclusion with no portfolio asset.");
    }
    continue;
  }
  if (post.status !== "complete") errors.push(`Unsupported coverage status for ${post.postId}: ${post.status}.`);
  if (!Array.isArray(post.coverageAssets) || post.coverageAssets.length !== post.sourceMediaCount || post.sourceMediaCount < 1) {
    errors.push(`${post.postId} does not map every photographic media item.`);
    continue;
  }
  if (new Set(post.coverageAssets).size !== post.coverageAssets.length) {
    errors.push(`${post.postId} repeats a portfolio asset.`);
  }
  calculatedPlacements += post.coverageAssets.length;
  for (const asset of post.coverageAssets) {
    calculatedDistinctAssets.add(asset);
    if (!publishedManifestAssets.has(asset)) errors.push(`${post.postId} maps to an asset outside the photography manifest: ${asset}.`);
    if (!provenance.assets?.[asset]) errors.push(`${post.postId} maps to an asset without provenance: ${asset}.`);
  }
}
if (calculatedPlacements !== 165 || calculatedDistinctAssets.size !== 126) {
  errors.push(`Calculated social coverage is ${calculatedPlacements} placements and ${calculatedDistinctAssets.size} distinct assets; expected 165 and 126.`);
}

const authorshipReview = socialPhotography.newlyImportedAuthorshipReview || {};
const independentlyCorroboratedAssets = authorshipReview.independentlyCorroboratedAssets || [];
const pendingIndependentEvidenceAssets = authorshipReview.pendingIndependentEvidenceAssets || [];
if (
  authorshipReview.independentlyCorroboratedCount !== 26
  || authorshipReview.pendingIndependentEvidenceCount !== 11
  || independentlyCorroboratedAssets.length !== 26
  || pendingIndependentEvidenceAssets.length !== 11
  || !authorshipReview.inclusionBasis?.includes("2026-08-14")
) {
  errors.push("The 37 imported photographs must preserve their 26 corroborated and 11 pending independent-authorship classifications.");
}
const observedPendingAuthorshipAssets = new Set(pendingIndependentEvidenceAssets);
for (const asset of expectedPendingAuthorshipAssets) {
  if (!observedPendingAuthorshipAssets.delete(asset)) errors.push(`Missing pending independent-authorship flag: ${asset}.`);
}
if (observedPendingAuthorshipAssets.size) {
  errors.push(`Unexpected pending independent-authorship flags: ${[...observedPendingAuthorshipAssets].join(", ")}.`);
}
const reviewedImports = [...independentlyCorroboratedAssets, ...pendingIndependentEvidenceAssets];
if (new Set(reviewedImports).size !== 37) errors.push("The imported authorship review must identify 37 unique assets.");
for (const asset of reviewedImports) {
  if (!publishedManifestAssets.has(asset)) errors.push(`Reviewed import is absent from the photography manifest: ${asset}.`);
  if (!calculatedDistinctAssets.has(asset)) errors.push(`Reviewed import is absent from the social-post coverage map: ${asset}.`);
  const record = provenance.assets?.[asset];
  if (!record) {
    errors.push(`Reviewed import lacks provenance: ${asset}.`);
    continue;
  }
  for (const field of ["source_url", "source_channel", "published_date", "downloaded_date", "credit", "source_capture"]) {
    if (!record[field]) errors.push(`Reviewed import lacks provenance field ${field}: ${asset}.`);
  }
  if (record.accepted_exception) errors.push(`Reviewed import must not use a provenance exception: ${asset}.`);
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

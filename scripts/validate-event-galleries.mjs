import { access, readFile } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/event-galleries.json", "utf8"));
const errors = [];
const orderModes = new Set(["chronological", "editorial", "source"]);
const timestamp = (value) => {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : null;
};
for (const campaign of data.campaigns) {
  if (!campaign.images.length) errors.push(`${campaign.title} has no photographs.`);
  const isPublic = campaign.published !== false;
  if (!orderModes.has(campaign.orderMode)) {
    errors.push(`${campaign.title} has no valid orderMode.`);
  }
  if (isPublic && campaign.orderMode === "source") {
    errors.push(`${campaign.title} is public and cannot rely on unverified source order.`);
  }
  if (isPublic && campaign.orderMode === "editorial" && !campaign.orderNote) {
    errors.push(`${campaign.title} needs an orderNote for its editorial sequence.`);
  }
  if (
    isPublic
    && /\b(?:documentary|event) photography\b/iu.test(campaign.eyebrow || "")
    && campaign.orderMode !== "chronological"
  ) {
    errors.push(`${campaign.title} is a public documentary or event gallery and must use chronological order.`);
  }
  const sources = new Set();
  const altCounts = new Map();
  for (const image of campaign.images) {
    if (sources.has(image.src)) errors.push(`Duplicate image in ${campaign.title}: ${image.src}`);
    sources.add(image.src);
    const alt = String(image.alt || "").trim();
    const wordCount = alt.split(/\s+/).filter(Boolean).length;
    if (wordCount < 8 || wordCount > 25 || alt.length > 180) {
      errors.push(`Invalid alt-text length in ${campaign.title}: ${image.src}`);
    }
    if (/\b(?:public photograph|photograph \d+ of|image \d+ of|@\w+)\b/i.test(alt)) {
      errors.push(`Generic or promotional alt text in ${campaign.title}: ${image.src}`);
    }
    if (image.capturedAt && timestamp(image.capturedAt) === null) {
      errors.push(`Invalid capture date in ${campaign.title}: ${image.src}`);
    }
    if (image.publishedAt && timestamp(image.publishedAt) === null) {
      errors.push(`Invalid publication date in ${campaign.title}: ${image.src}`);
    }
    if (isPublic && campaign.orderMode === "chronological" && !image.capturedAt) {
      errors.push(`Missing capture date in chronological gallery ${campaign.title}: ${image.src}`);
    }
    if (isPublic && campaign.orderMode === "editorial" && !image.capturedAt && !image.publishedAt) {
      errors.push(`Missing date metadata in editorial gallery ${campaign.title}: ${image.src}`);
    }
    altCounts.set(alt, (altCounts.get(alt) || 0) + 1);
    try { await access(path.resolve("work", campaign.slug, image.src)); }
    catch { errors.push(`Missing image in ${campaign.title}: ${image.src}`); }
  }
  for (const [alt, count] of altCounts) {
    if (alt && count > 2) errors.push(`Alt text is reused ${count} times in ${campaign.title}: ${alt}`);
  }
  if (campaign.orderMode === "chronological") {
    for (let index = 1; index < campaign.images.length; index += 1) {
      const previous = campaign.images[index - 1];
      const current = campaign.images[index];
      if (timestamp(previous.capturedAt) > timestamp(current.capturedAt)) {
        errors.push(`Capture chronology reverses in ${campaign.title}: ${previous.src} then ${current.src}`);
      }
    }
  }

  if (campaign.images.some((image) => image.src.includes("/assets/images/work/events/"))) {
    const sourcePath = path.join("assets/data/event-gallery-alt-text", `${campaign.slug}.json`);
    const sourceData = JSON.parse(await readFile(sourcePath, "utf8"));
    const expected = new Map(sourceData.images.map((image) => [image.file, image]));
    if (sourceData.slug !== campaign.slug || expected.size !== campaign.images.length) {
      errors.push(`Alt-text source coverage does not match ${campaign.title}.`);
    }
    for (const image of campaign.images) {
      const sourceImage = expected.get(path.basename(image.src));
      if (sourceImage?.alt !== image.alt) {
        errors.push(`Generated alt text drifted in ${campaign.title}: ${image.src}`);
      }
      if ((sourceImage?.capturedAt || undefined) !== (image.capturedAt || undefined)) {
        errors.push(`Generated capture date drifted in ${campaign.title}: ${image.src}`);
      }
    }
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Validated ${data.campaigns.length} event galleries and ${data.campaigns.reduce((n, campaign) => n + campaign.images.length, 0)} photographs.`);

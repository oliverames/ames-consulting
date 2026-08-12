import { readFile } from "node:fs/promises";

const data = JSON.parse(
  await readFile(new URL("../assets/data/project-dates.json", import.meta.url), "utf8"),
);
const eastRisePhotography = JSON.parse(
  await readFile(new URL("../assets/data/eastrise-photography.json", import.meta.url), "utf8"),
);

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const isoTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function assertIsoDate(value, label) {
  if (!isoDatePattern.test(value)) throw new Error(`${label} must use YYYY-MM-DD: ${value}`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid calendar date: ${value}`);
  }
}

if (data.schemaVersion !== 1) throw new Error("project-dates.json has an unsupported schema version.");

for (const [slug, gallery] of Object.entries(data.galleryImageOrder)) {
  assertIsoDate(gallery.date, `gallery date for ${slug}`);
  if (gallery.order !== "oldest-first") throw new Error(`${slug} must use oldest-first image order.`);
  for (const [field, timestamp] of [["captureStart", gallery.captureStart], ["captureEnd", gallery.captureEnd]]) {
    if (!isoTimestampPattern.test(timestamp) || Number.isNaN(Date.parse(timestamp)) || !timestamp.startsWith(`${gallery.date}T`)) {
      throw new Error(`${field} for ${slug} must be an ISO timestamp on ${gallery.date}: ${timestamp}`);
    }
  }
  if (gallery.captureStart > gallery.captureEnd) throw new Error(`${slug} capture timestamps are reversed.`);
  if (!gallery.files.length || new Set(gallery.files).size !== gallery.files.length) {
    throw new Error(`${slug} must declare a non-empty, duplicate-free file order.`);
  }
  const timestampFiles = Object.keys(gallery.capturedAt || {});
  if (timestampFiles.length !== gallery.files.length || gallery.files.some((file) => !gallery.capturedAt[file])) {
    throw new Error(`${slug} must declare one capture timestamp for every ordered file.`);
  }
  for (const file of gallery.files) {
    const timestamp = gallery.capturedAt[file];
    if (!isoTimestampPattern.test(timestamp) || Number.isNaN(Date.parse(timestamp)) || !timestamp.startsWith(`${gallery.date}T`)) {
      throw new Error(`capturedAt for ${slug}/${file} must be an ISO timestamp on ${gallery.date}: ${timestamp}`);
    }
  }
  const orderedTimestamps = gallery.files.map((file) => gallery.capturedAt[file]);
  if (orderedTimestamps.some((timestamp, index) => index > 0 && timestamp < orderedTimestamps[index - 1])) {
    throw new Error(`${slug} file timestamps are not oldest first.`);
  }
  if (orderedTimestamps[0] !== gallery.captureStart || orderedTimestamps.at(-1) !== gallery.captureEnd) {
    throw new Error(`${slug} capture range does not match its ordered file timestamps.`);
  }
}

const projectDates = new Map();
for (const project of data.projects) {
  assertIsoDate(project.sortDate, `sortDate for ${project.href}`);
  if (!new Set(["exact", "range-end"]).has(project.dateBasis)) {
    throw new Error(`Unsupported dateBasis for ${project.href}: ${project.dateBasis}`);
  }
  if (!String(project.dateEvidence || "").trim()) {
    throw new Error(`Missing dateEvidence for ${project.href}`);
  }
  if (projectDates.has(project.href)) throw new Error(`Duplicate project date: ${project.href}`);
  projectDates.set(project.href, Object.freeze({ ...project }));
}

for (const series of eastRisePhotography.series) {
  const href = `eastrise-photography/#${series.slug}-title`;
  if (projectDates.has(href)) throw new Error(`Duplicate project date: ${href}`);
  if (series.archiveDate) assertIsoDate(series.archiveDate, `archiveDate for ${series.slug}`);
  projectDates.set(href, Object.freeze({
    href,
    sortDate: series.archiveDate || null,
    dateBasis: series.archiveDateBasis || "unverified",
    dateEvidence: series.archiveDate
      ? "assets/data/eastrise-photography.json archiveDate from verified public publication evidence"
      : "assets/data/eastrise-photography.json explicitly marks this series unverified and undated",
  }));
}

export const galleryImageOrder = Object.freeze(data.galleryImageOrder);
export const projectDateRecords = Object.freeze([...projectDates.values()]);

export function galleryOrderFor(slug) {
  return galleryImageOrder[slug] || null;
}

export function normalizeProjectHref(value) {
  return String(value || "")
    .replace(/^https?:\/\/ames\.consulting\/work\//, "")
    .replace(/^\.\.\//, "")
    .replace(/^\.\//, "")
    .replace(/^work\//, "");
}

export function projectDateFor(value) {
  return projectDates.get(normalizeProjectHref(value));
}

export function compareProjectHrefsNewestFirst(left, right) {
  const leftHref = normalizeProjectHref(left);
  const rightHref = normalizeProjectHref(right);
  const leftRecord = projectDates.get(leftHref);
  const rightRecord = projectDates.get(rightHref);
  if (!leftRecord) throw new Error(`Missing project sort date: ${leftHref}`);
  if (!rightRecord) throw new Error(`Missing project sort date: ${rightHref}`);

  if (leftRecord.sortDate && rightRecord.sortDate && leftRecord.sortDate !== rightRecord.sortDate) {
    return rightRecord.sortDate.localeCompare(leftRecord.sortDate);
  }
  if (leftRecord.sortDate && !rightRecord.sortDate) return -1;
  if (!leftRecord.sortDate && rightRecord.sortDate) return 1;
  return 0;
}

export function sortEntriesNewestFirst(entries, hrefForEntry) {
  return [...entries].sort((left, right) =>
    compareProjectHrefsNewestFirst(hrefForEntry(left), hrefForEntry(right))
  );
}

export function orderedGalleryFiles(slug, availableFiles) {
  const metadata = galleryOrderFor(slug);
  if (!metadata) return [...availableFiles].sort();

  const available = new Set(availableFiles);
  const expected = new Set(metadata.files);
  const missing = metadata.files.filter((file) => !available.has(file));
  const unexpected = availableFiles.filter((file) => !expected.has(file));
  if (missing.length || unexpected.length) {
    throw new Error(`${slug} gallery order mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`);
  }
  return [...metadata.files];
}

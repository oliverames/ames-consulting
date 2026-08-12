#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/eastrise-social.json", "utf8"));
const provenance = JSON.parse(await readFile("assets/data/media-provenance.json", "utf8"));
const errors = [];
const ids = new Set();
const highlights = new Set(data.highlightIds || []);
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const recoveredDateEvidenceIds = new Set([
  "facebook-016",
  "facebook-020",
  "facebook-021",
  "facebook-025",
  "facebook-039",
  "facebook-043",
  "facebook-067",
]);

function isValidDate(value) {
  return isoDatePattern.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function sameList(actual, expected) {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function hasEvidenceBackedDateException(provenanceRecord) {
  const exception = provenanceRecord?.accepted_exception;
  return exception?.reason === "publication_date_not_verifiable"
    && exception.missing_fields?.includes("published_date")
    && Boolean(String(exception.note || "").trim());
}

if (!data.publicSourceOnly) errors.push("The EastRise social project must use public-source captures only.");
if (
  data.postOrder !== "newest-first"
  || data.undatedPostPlacement !== "after-dated-posts"
  || data.undatedPostOrder !== "stable-id"
  || data.highlightOrder !== "newest-first"
) {
  errors.push("EastRise social posts must use newest-first dates with stable undated posts last.");
}
if (data.publishedDateSource !== "verified media provenance") {
  errors.push("EastRise social posts must identify verified media provenance as their date source.");
}
if (data.totalPosts !== 51 || data.posts.length !== 51) {
  errors.push("The EastRise social archive must retain exactly 51 dated posts.");
}
if (data.totalPosts !== data.posts.length) errors.push("The total post count does not match the manifest.");
if (Object.values(data.platformCounts).reduce((sum, count) => sum + count, 0) !== data.totalPosts) {
  errors.push("The platform counts do not match the total post count.");
}

let previousDate = null;
let previousDatedId = null;
let previousUndatedId = null;
let reachedUndated = false;
for (const post of data.posts) {
  if (ids.has(post.id)) errors.push(`Duplicate post id: ${post.id}`);
  ids.add(post.id);
  if (!/^https:\/\//.test(post.sourceUrl)) errors.push(`Missing public source URL: ${post.id}`);
  if (!post.title) errors.push(`Missing post title: ${post.id}`);
  if (!(post.width > 0 && post.height > 0)) errors.push(`Invalid screenshot dimensions: ${post.id}`);
  const provenanceRecord = provenance.assets?.[post.screenshot];
  if (!provenanceRecord) errors.push(`Missing media provenance: ${post.id}`);
  const expectedDate = provenanceRecord?.published_date || null;
  if (post.publishedDate !== expectedDate) errors.push(`Published date does not match provenance: ${post.id}`);
  if (recoveredDateEvidenceIds.has(post.id) && !String(post.publishedDateEvidence || "").trim()) {
    errors.push(`Missing recovered-date evidence note: ${post.id}`);
  }
  if (post.publishedDate === null) {
    if (!hasEvidenceBackedDateException(provenanceRecord)) {
      errors.push(`Missing published date without an evidence-backed exception: ${post.id}`);
    }
    reachedUndated = true;
    if (previousUndatedId && post.id.localeCompare(previousUndatedId, undefined, { numeric: true }) < 0) {
      errors.push(`Undated posts are not in stable id order: ${post.id}`);
    }
    previousUndatedId = post.id;
  } else if (!isValidDate(post.publishedDate)) {
    errors.push(`Invalid published date: ${post.id}`);
  } else {
    if (reachedUndated) errors.push(`Dated post follows an undated post: ${post.id}`);
    if (previousDate && post.publishedDate > previousDate) {
      errors.push(`Posts are not newest-first: ${post.id}`);
    }
    if (
      previousDate === post.publishedDate
      && previousDatedId
      && post.id.localeCompare(previousDatedId, undefined, { numeric: true }) < 0
    ) {
      errors.push(`Same-day posts are not in stable id order: ${post.id}`);
    }
    previousDate = post.publishedDate;
    previousDatedId = post.id;
  }
  try {
    await access(path.resolve(post.screenshot));
  } catch {
    errors.push(`Missing screenshot: ${post.screenshot}`);
  }
}

const actualUndatedPostIds = data.posts.filter((post) => post.publishedDate === null).map((post) => post.id);
if (actualUndatedPostIds.length !== 0 || data.undatedPostIds.length !== 0) {
  errors.push("Every EastRise social record must have a verified publication date.");
}
if (!sameList(data.undatedPostIds, actualUndatedPostIds)) {
  errors.push("The explicit undated social-post list does not match the archive.");
}

if (highlights.size !== 12) errors.push("Social highlights must contain exactly 12 posts.");
for (const id of highlights) {
  if (!ids.has(id)) errors.push(`Unknown social highlight id: ${id}`);
}
const displayedHighlights = data.posts.filter((post) => highlights.has(post.id));
if (!sameList(data.highlightIds, displayedHighlights.map((post) => post.id))) {
  errors.push("Social highlight ids must follow the rendered archive order.");
}
const actualUndatedHighlightIds = displayedHighlights
  .filter((post) => post.publishedDate === null)
  .map((post) => post.id);
if (actualUndatedHighlightIds.length !== 0 || data.undatedHighlightIds.length !== 0) {
  errors.push("Every displayed EastRise social highlight must have a verified publication date.");
}
if (!sameList(data.undatedHighlightIds, actualUndatedHighlightIds)) {
  errors.push("The displayed undated-exception list does not match the highlighted archive records.");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated one EastRise Social project with ${data.totalPosts} public posts.`);
}

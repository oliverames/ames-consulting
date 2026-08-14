#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";

const root = path.resolve(import.meta.dirname, "..");
const readJson = async (relativePath) => JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
const provenance = await readJson("assets/data/media-provenance.json");
const missingReport = await readJson("assets/data/media-provenance-missing.json");
const evidence = await readJson("assets/data/media-provenance-evidence.json");
const exceptionConfig = await readJson("assets/data/media-provenance-exceptions.json");
const captureManifest = await readJson("assets/data/source-screenshot-manifest.json");
const portraits = await readJson("assets/data/portraits.json");
const photography = await readJson("assets/data/eastrise-photography.json");
const eventGalleries = await readJson("assets/data/event-galleries.json");
const writingFeed = await readJson("assets/data/writing-feed.json");
const fields = ["source_url", "source_channel", "published_date", "downloaded_date", "credit", "source_capture"];
const channels = new Set(["", "website", "Facebook", "Instagram", "LinkedIn", "YouTube"]);
const dateFields = new Set(["published_date", "downloaded_date"]);
const dateEvidence = new Set(["private_archive_capture", "repository_archive_note", "public_platform_metadata", "public_source_url_timestamp"]);
const exceptionRules = new Map([
  ["publication_date_not_verifiable", ["published_date"]],
  ["public_source_page_not_identified", ["source_url", "published_date", "source_capture"]],
  ["personal_archive_source_not_identified", ["source_url", "source_channel", "published_date", "source_capture"]],
  ["source_capture_not_available", ["source_capture"]],
  ["collection_asset_without_single_source", ["source_url", "published_date", "source_capture"]],
  ["portfolio_original_without_public_source", ["source_url", "source_channel", "published_date", "downloaded_date", "source_capture"]],
  ["client_work_portfolio_rights", ["source_url", "source_channel", "published_date", "source_capture"]],
  ["portfolio_photograph_without_retained_public_source", ["source_url", "source_channel", "published_date", "source_capture"]],
  ["first_party_profile_asset_without_source", ["source_url", "source_channel", "published_date", "source_capture"]],
  ["profile_image_capture_and_date_not_retained", ["published_date", "source_capture"]],
]);

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
}

function assertExactKeys(value, allowedKeys, label) {
  const unexpected = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unexpected.length) throw new Error(`${label} has unexpected fields: ${unexpected.join(", ")}.`);
}

function assertDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid ISO date.`);
  }
}

function assertCleanSourceUrl(value, label) {
  const url = new URL(value);
  const trackingKeys = [...url.searchParams.keys()].filter((key) => /^utm_/i.test(key) || key.toLowerCase() === "rcm");
  if (trackingKeys.length) throw new Error(`${label} contains tracking parameters: ${trackingKeys.join(", ")}.`);
}

function expectedChannelForSource(value) {
  const hostname = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  if (hostname === "facebook.com") return "Facebook";
  if (hostname === "instagram.com") return "Instagram";
  if (hostname === "linkedin.com") return "LinkedIn";
  if (hostname === "youtube.com" || hostname === "youtu.be") return "YouTube";
  if (hostname === "eastrise.com" || hostname === "pixelspoke.coop") return "website";
  return "";
}

assertObject(captureManifest, "source-screenshot-manifest.json");
assertExactKeys(captureManifest, ["generated_at", "captures", "missing"], "source-screenshot-manifest.json");
if (!Array.isArray(captureManifest.captures) || !Array.isArray(captureManifest.missing)) {
  throw new Error("source-screenshot-manifest.json must contain captures and missing arrays.");
}
for (const [index, record] of captureManifest.captures.entries()) {
  const label = `Source capture ${index + 1}`;
  assertObject(record, label);
  assertExactKeys(record, ["source_url", "source_channel", "source_capture"], label);
  if (!/^https:\/\//.test(record.source_url) || typeof record.source_channel !== "string") {
    throw new Error(`${label} has invalid public source metadata.`);
  }
  assertCleanSourceUrl(record.source_url, `${label} source_url`);
  if (record.source_capture !== "private_archive") throw new Error(`${label} must use private_archive status.`);
}
for (const [index, record] of captureManifest.missing.entries()) {
  const label = `Missing source capture ${index + 1}`;
  assertObject(record, label);
  assertExactKeys(record, ["source_url", "source_channel", "error"], label);
  if (!/^https:\/\//.test(record.source_url)) throw new Error(`${label} has an invalid source_url.`);
  assertCleanSourceUrl(record.source_url, `${label} source_url`);
}

function linkedInDate(sourceUrl) {
  const activityId = sourceUrl.match(/activity-(\d{16,})/)?.[1];
  if (activityId) return new Date(Number(BigInt(activityId) >> 22n)).toISOString().slice(0, 10);
  const mediaTimestamp = sourceUrl.match(/\/0\/(\d{13})(?:\?|$)/)?.[1];
  return mediaTimestamp ? new Date(Number(mediaTimestamp)).toISOString().slice(0, 10) : "";
}

const linkedInEvidenceUrls = new Map();
for (const series of photography.series || []) {
  for (const image of series.images || []) {
    const asset = image.src.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
    if (image.dateBasis === "public-source-url-timestamp") linkedInEvidenceUrls.set(asset, image.sourceUrl);
  }
}
for (const series of portraits.series || []) {
  for (const image of series.images || []) {
    const asset = image.src.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
    if (image.dateEvidence?.basis === "public-source-url-timestamp") linkedInEvidenceUrls.set(asset, image.source);
  }
}

assertObject(exceptionConfig, "media-provenance-exceptions.json");
assertExactKeys(exceptionConfig, ["schema_version", "exceptions"], "media-provenance-exceptions.json");
if (exceptionConfig.schema_version !== 1 || !Array.isArray(exceptionConfig.exceptions)) {
  throw new Error("media-provenance-exceptions.json must use schema_version 1 and contain an exceptions array.");
}
const exceptionsByAsset = new Map();
for (const [index, group] of exceptionConfig.exceptions.entries()) {
  const label = `Exception group ${index + 1}`;
  assertObject(group, label);
  assertExactKeys(group, ["reason", "missing_fields", "note", "public_note", "assets", "asset_prefixes"], label);
  const allowedMissing = exceptionRules.get(group.reason);
  if (!allowedMissing) throw new Error(`${label} has unsupported reason ${group.reason}.`);
  if (!isDeepStrictEqual(group.missing_fields, allowedMissing)) {
    throw new Error(`${label} must classify exactly ${allowedMissing.join(", ")}.`);
  }
  if (typeof group.note !== "string" || !group.note.trim()) throw new Error(`${label} requires a note.`);
  if (group.public_note !== undefined && (typeof group.public_note !== "string" || !group.public_note.trim())) {
    throw new Error(`${label} has an invalid public_note.`);
  }
  if (group.assets !== undefined && !Array.isArray(group.assets)) throw new Error(`${label} assets must be an array.`);
  if (group.asset_prefixes !== undefined && !Array.isArray(group.asset_prefixes)) throw new Error(`${label} asset_prefixes must be an array.`);
  if (!(group.assets?.length || group.asset_prefixes?.length)) throw new Error(`${label} requires an asset or asset prefix.`);
  const configuredAssets = new Set(group.assets || []);
  for (const prefix of group.asset_prefixes || []) {
    if (typeof prefix !== "string" || !prefix.startsWith("assets/images/") || !prefix.endsWith("/")) {
      throw new Error(`${label} has an invalid asset prefix ${prefix}.`);
    }
    const matches = Object.keys(provenance.assets || {}).filter((asset) => asset.startsWith(prefix));
    if (!matches.length) throw new Error(`${label} prefix ${prefix} does not match a provenance asset.`);
    for (const asset of matches) configuredAssets.add(asset);
  }
  for (const asset of configuredAssets) {
    if (exceptionsByAsset.has(asset)) throw new Error(`${asset} has more than one accepted exception.`);
    exceptionsByAsset.set(asset, {
      reason: group.reason,
      missing_fields: group.missing_fields,
      note: group.note,
      public_note: group.public_note || "",
    });
  }
}

assertObject(evidence, "media-provenance-evidence.json");
assertExactKeys(evidence, ["schema_version", "published_dates", "public_sources"], "media-provenance-evidence.json");
if (evidence.schema_version !== 1 || !Array.isArray(evidence.published_dates) || !Array.isArray(evidence.public_sources)) {
  throw new Error("media-provenance-evidence.json must use schema_version 1 and contain published_dates and public_sources arrays.");
}
const datesByAsset = new Map();
for (const [index, group] of evidence.published_dates.entries()) {
  const label = `Published-date evidence group ${index + 1}`;
  assertObject(group, label);
  assertExactKeys(group, ["evidence", "records"], label);
  if (!dateEvidence.has(group.evidence)) throw new Error(`${label} has unsupported evidence ${group.evidence}.`);
  assertObject(group.records, `${label} records`);
  if (!Object.keys(group.records).length) throw new Error(`${label} must contain at least one record.`);
  for (const [asset, publishedDate] of Object.entries(group.records)) {
    if (datesByAsset.has(asset)) throw new Error(`${asset} has more than one published-date evidence record.`);
    assertDate(publishedDate, `${asset} published_date`);
    datesByAsset.set(asset, { publishedDate, evidence: group.evidence });
  }
}
const sourcesByAsset = new Map();
for (const [index, group] of evidence.public_sources.entries()) {
  const label = `Public-source evidence group ${index + 1}`;
  assertObject(group, label);
  assertExactKeys(group, ["evidence", "source_url", "source_channel", "assets"], label);
  if (group.evidence !== "private_archive_capture") throw new Error(`${label} has unsupported evidence ${group.evidence}.`);
  if (!/^https:\/\//.test(group.source_url)) throw new Error(`${label} has an invalid source_url.`);
  assertCleanSourceUrl(group.source_url, `${label} source_url`);
  if (!channels.has(group.source_channel) || !group.source_channel) throw new Error(`${label} has an invalid source_channel.`);
  if (!Array.isArray(group.assets) || !group.assets.length) throw new Error(`${label} requires at least one asset.`);
  for (const asset of group.assets) {
    if (sourcesByAsset.has(asset)) throw new Error(`${asset} has more than one public-source evidence record.`);
    sourcesByAsset.set(asset, group);
  }
}

assertObject(provenance, "media-provenance.json");
assertExactKeys(provenance, ["generated_at", "assets"], "media-provenance.json");
assertDate(provenance.generated_at, "media-provenance.json generated_at");
assertObject(provenance.assets, "media-provenance.json assets");
const provenanceAssets = provenance.assets;
const acceptedCounts = new Map([...exceptionRules.keys()].map((reason) => [reason, 0]));
const incompleteByAsset = new Map();
let complete = 0;
for (const [asset, data] of Object.entries(provenanceAssets)) {
  if (!/^assets\/images\//.test(asset) || asset.includes("..")) throw new Error(`${asset} is not a repository image path.`);
  assertObject(data, asset);
  assertExactKeys(data, [...fields, "archive_note", "accepted_exception"], asset);
  const missingFields = [];
  for (const field of fields) {
    if (!(field in data)) throw new Error(`${asset} is missing the ${field} field.`);
    if (typeof data[field] !== "string") throw new Error(`${asset} has a non-string ${field} value.`);
    if (!data[field].trim()) missingFields.push(field);
    if (data[field] && dateFields.has(field)) assertDate(data[field], `${asset} ${field}`);
  }
  if (data.archive_note !== undefined && typeof data.archive_note !== "string") throw new Error(`${asset} has a non-string archive_note.`);
  if (!channels.has(data.source_channel)) throw new Error(`${asset} has unsupported source_channel ${data.source_channel}.`);
  if ([...fields, "archive_note"].some((field) => String(data[field] || "").toLowerCase() === "unknown")) {
    throw new Error(`${asset} contains an unknown placeholder.`);
  }
  if (data.source_url && !/^https:\/\//.test(data.source_url)) throw new Error(`${asset} has an invalid source_url.`);
  if (data.source_url) assertCleanSourceUrl(data.source_url, `${asset} source_url`);
  if (data.source_url && expectedChannelForSource(data.source_url) && data.source_channel !== expectedChannelForSource(data.source_url)) {
    throw new Error(`${asset} source_channel does not match its public source URL.`);
  }
  if (data.source_capture && data.source_capture !== "private_archive") throw new Error(`${asset} has an invalid source_capture value.`);

  const configuredException = exceptionsByAsset.get(asset);
  if (missingFields.length === 0) {
    complete += 1;
    if (configuredException || data.accepted_exception) throw new Error(`${asset} is complete but still carries an accepted exception.`);
  } else {
    if (!configuredException) throw new Error(`${asset} has unclassified omissions: ${missingFields.join(", ")}.`);
    if (!isDeepStrictEqual(missingFields, configuredException.missing_fields)) {
      throw new Error(`${asset} omissions do not match its ${configuredException.reason} exception.`);
    }
    const embeddedException = {
      reason: configuredException.reason,
      missing_fields: configuredException.missing_fields,
      note: configuredException.note,
    };
    if (!isDeepStrictEqual(data.accepted_exception, embeddedException)) throw new Error(`${asset} has stale accepted_exception metadata.`);
    if (["public_source_page_not_identified", "personal_archive_source_not_identified", "collection_asset_without_single_source"].includes(configuredException.reason) && !data.archive_note) {
      throw new Error(`${asset} requires honest public archive wording for ${configuredException.reason}.`);
    }
    if (configuredException.public_note && data.archive_note !== configuredException.public_note) {
      throw new Error(`${asset} does not contain the configured public exception wording.`);
    }
    if (configuredException.reason === "public_source_page_not_identified" && data.source_channel !== "LinkedIn") {
      throw new Error(`${asset} uses public_source_page_not_identified without a retained LinkedIn channel.`);
    }
    if (configuredException.reason === "collection_asset_without_single_source" && asset !== "assets/images/work/campaigns/eastrise-writing.webp") {
      throw new Error(`${asset} cannot use the collection-only exception.`);
    }
    if (configuredException.reason === "portfolio_original_without_public_source" && asset !== "assets/images/work/portraits/gallery/blue-cross/lindsay-segale.webp") {
      throw new Error(`${asset} cannot use the portfolio-original exception.`);
    }
    if (configuredException.reason === "client_work_portfolio_rights") {
      if (!asset.startsWith("assets/images/work/events/neg-ecp-conference-2026/") || !data.archive_note) {
        throw new Error(`${asset} cannot use the NEG-ECP client-work exception.`);
      }
    }
    if (configuredException.reason === "portfolio_photograph_without_retained_public_source" && !data.archive_note) {
      throw new Error(`${asset} requires an archive note for its retained portfolio provenance.`);
    }
    if (configuredException.reason === "first_party_profile_asset_without_source") {
      if (asset !== "assets/images/about/oliver-ames-profile.webp" || !data.archive_note) {
        throw new Error(`${asset} cannot use the first-party profile exception.`);
      }
    }
    if (configuredException.reason === "profile_image_capture_and_date_not_retained" && !asset.startsWith("assets/images/testimonials/")) {
      throw new Error(`${asset} cannot use the testimonial profile-image exception.`);
    }
    acceptedCounts.set(configuredException.reason, acceptedCounts.get(configuredException.reason) + 1);
    incompleteByAsset.set(asset, { missingFields, embeddedException });
  }
}

for (const [asset, record] of datesByAsset) {
  const data = provenanceAssets[asset];
  if (!data) throw new Error(`Published-date evidence references unknown asset ${asset}.`);
  if (data.published_date !== record.publishedDate) throw new Error(`${asset} does not contain its evidence-backed published_date.`);
  if (record.evidence === "private_archive_capture" && data.source_capture !== "private_archive") throw new Error(`${asset} lacks the private archive capture used for its date.`);
  if (record.evidence === "repository_archive_note" && !data.archive_note) throw new Error(`${asset} lacks the repository archive note used for its date.`);
  if (record.evidence === "public_platform_metadata" && !data.source_url) throw new Error(`${asset} lacks the public platform URL used for its date.`);
  if (record.evidence === "public_source_url_timestamp" && linkedInDate(linkedInEvidenceUrls.get(asset) || data.source_url) !== record.publishedDate) {
    throw new Error(`${asset} published_date does not match its LinkedIn URL timestamp.`);
  }
}
for (const [asset, record] of sourcesByAsset) {
  const data = provenanceAssets[asset];
  if (!data) throw new Error(`Public-source evidence references unknown asset ${asset}.`);
  if (data.source_url !== record.source_url || data.source_channel !== record.source_channel || data.source_capture !== "private_archive") {
    throw new Error(`${asset} does not contain its private public-source evidence record.`);
  }
}
for (const asset of exceptionsByAsset.keys()) {
  if (!provenanceAssets[asset]) throw new Error(`Accepted exception references unknown asset ${asset}.`);
}

const blueCrossPortraits = portraits.series?.find((series) => series.slug === "blue-cross-cbss");
if (!blueCrossPortraits?.images?.length) throw new Error("portraits.json lacks the public Blue Cross portrait series.");
for (const image of blueCrossPortraits.images) {
  const asset = image.src.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
  if (!provenanceAssets[asset]) throw new Error(`Public Blue Cross portrait lacks provenance: ${asset}.`);
  if (image.source && !/^https:\/\//.test(image.source)) throw new Error(`Public Blue Cross portrait exposes a non-public source path: ${asset}.`);
}

const normalizeAsset = (value) => value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
const expectedPortraitAndCandidAssets = new Set();
const expectAsset = (value) => expectedPortraitAndCandidAssets.add(normalizeAsset(value));
for (const series of photography.series || []) for (const image of series.images || []) expectAsset(image.src);
for (const image of portraits.series?.find((series) => series.slug === "eastrise-leadership-board")?.images || []) expectAsset(image.src);
for (const slug of [
  "neg-ecp-conference-2026",
  "giron-family-fall-2025",
  "giron-family-christmas-tree-farm-2024",
  "giron-family-fall-2023",
  "vermont-foodbank-volunteer-day-2026",
]) {
  const campaign = eventGalleries.campaigns?.find((candidate) => candidate.slug === slug);
  if (!campaign?.images?.length) throw new Error(`Portrait/candid coverage lacks event gallery ${slug}.`);
  for (const image of campaign.images) expectAsset(image.src);
}
for (const directory of ["assets/images/work/gmcf/sweat-heart", "assets/images/work/gmcf/bike-fitting"]) {
  for (const name of await readdir(path.join(root, directory))) if (name.endsWith(".webp")) expectAsset(`${directory}/${name}`);
}
for (const asset of [
  "assets/images/work/gmcf/sweat-heart-card.webp",
  "assets/images/work/gmcf/bike-fitting-card.webp",
  "assets/images/work/gmcf/gmcf-card.webp",
  "assets/images/about/oliver-ames-profile.webp",
  "assets/images/work/portraits/amy-vaughan.webp",
  "assets/images/work/eastrise/uvm-soccer.webp",
  "assets/images/work/eastrise/point-to-point.webp",
  "assets/images/work/eastrise/wheels-for-warmth-card.webp",
  "assets/images/work/campaigns/member-stories.webp",
  "assets/images/work/campaigns/will-barbecue.webp",
  "assets/images/work/campaigns/flight-paths.webp",
]) expectAsset(asset);
for (const name of await readdir(path.join(root, "assets/images/testimonials"))) {
  if (name.endsWith(".webp")) expectAsset(`assets/images/testimonials/${name}`);
}
for (const post of writingFeed.posts || []) {
  for (const media of post.media || []) if (media.type === "image") expectAsset(media.src);
  for (const media of post.sharedPost?.media || []) if (media.type === "image") expectAsset(media.src);
  if (post.image || post.localImage) {
    const filename = `${createHash("sha256").update(post.assetId || post.id).digest("hex").slice(0, 12)}.webp`;
    expectAsset(`assets/images/writing/${filename}`);
  }
}
for (const asset of expectedPortraitAndCandidAssets) {
  if (!provenanceAssets[asset]) throw new Error(`Public portrait or candid lacks provenance: ${asset}.`);
  await access(path.join(root, asset)).catch(() => {
    throw new Error(`Portrait/candid provenance references a missing asset: ${asset}.`);
  });
}

assertObject(missingReport, "media-provenance-missing.json");
assertExactKeys(missingReport, ["generated_at", "missing"], "media-provenance-missing.json");
if (missingReport.generated_at !== provenance.generated_at) throw new Error("Generated provenance files have different generated_at dates.");
if (!Array.isArray(missingReport.missing)) throw new Error("media-provenance-missing.json must contain a missing array.");
const reportedAssets = new Set();
for (const row of missingReport.missing) {
  if (reportedAssets.has(row.asset)) throw new Error(`${row.asset} appears twice in media-provenance-missing.json.`);
  reportedAssets.add(row.asset);
  const actual = incompleteByAsset.get(row.asset);
  if (!actual) throw new Error(`${row.asset} is reported incomplete but is not incomplete in media-provenance.json.`);
  if (!isDeepStrictEqual(row.missing_fields, actual.missingFields) || !isDeepStrictEqual(row.accepted_exception, actual.embeddedException)) {
    throw new Error(`${row.asset} has stale data in media-provenance-missing.json.`);
  }
}
for (const asset of incompleteByAsset.keys()) {
  if (!reportedAssets.has(asset)) throw new Error(`${asset} is absent from media-provenance-missing.json.`);
}

const accepted = incompleteByAsset.size;
const breakdown = [...acceptedCounts].filter(([, count]) => count).map(([reason, count]) => `${reason}=${count}`).join(", ");
console.log(`Validated ${Object.keys(provenanceAssets).length} provenance records: ${complete} complete and ${accepted} accepted exceptions (${breakdown}).`);
console.log(`Verified exact provenance coverage for ${expectedPortraitAndCandidAssets.size} public portrait, candid, and adjacent collection assets.`);

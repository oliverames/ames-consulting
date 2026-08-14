#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const captureManifestPath = join(root, "assets/data/source-screenshot-manifest.json");
const evidencePath = join(root, "assets/data/media-provenance-evidence.json");
const exceptionsPath = join(root, "assets/data/media-provenance-exceptions.json");

async function readJson(filePath) {
  let source;
  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Cannot read required JSON input ${filePath}: ${error.message}`, { cause: error });
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`, { cause: error });
  }
}

const captureManifest = await readJson(captureManifestPath);
if (!Array.isArray(captureManifest.captures)) {
  throw new Error(`${captureManifestPath} must contain a captures array.`);
}
const manifestKeys = Object.keys(captureManifest).sort();
if (JSON.stringify(manifestKeys) !== JSON.stringify(["captures", "generated_at", "missing"])) {
  throw new Error(`${captureManifestPath} contains unexpected fields.`);
}
for (const [index, record] of captureManifest.captures.entries()) {
  const keys = Object.keys(record).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["source_capture", "source_channel", "source_url"])) {
    throw new Error(`${captureManifestPath} capture ${index + 1} contains a private or unexpected field.`);
  }
  if (!/^https:\/\//.test(record.source_url) || typeof record.source_channel !== "string") {
    throw new Error(`${captureManifestPath} capture ${index + 1} has invalid public source metadata.`);
  }
  if (record.source_capture !== "private_archive") {
    throw new Error(`${captureManifestPath} capture ${index + 1} must use private_archive status.`);
  }
}
if (!Array.isArray(captureManifest.missing)) {
  throw new Error(`${captureManifestPath} must contain a missing array.`);
}
for (const [index, record] of captureManifest.missing.entries()) {
  const keys = Object.keys(record).sort();
  if (JSON.stringify(keys) !== JSON.stringify(["error", "source_channel", "source_url"])) {
    throw new Error(`${captureManifestPath} missing record ${index + 1} contains a private or unexpected field.`);
  }
}
const canonicalSourceKey = (value) => {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com") {
      const match = url.pathname.match(/\/(?:[^/]+\/)?(p|reel)\/([^/]+)/i);
      if (match) return `instagram:${match[1].toLowerCase()}:${match[2]}`;
    }
    if (host === "youtube.com") return `youtube:${url.searchParams.get("v") || url.pathname}`;
    if (host === "youtu.be") return `youtube:${url.pathname.replace(/^\//, "")}`;
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return value || "";
  }
};
const captureBySource = new Map();
for (const record of captureManifest.captures) {
  captureBySource.set(record.source_url, record.source_capture);
  captureBySource.set(canonicalSourceKey(record.source_url), record.source_capture);
}

const photography = await readJson(join(root, "assets/data/eastrise-photography.json"));
const portraits = await readJson(join(root, "assets/data/portraits.json"));
const social = await readJson(join(root, "assets/data/eastrise-social.json"));
const eventGalleries = await readJson(join(root, "assets/data/event-galleries.json"));
const writingFeed = await readJson(join(root, "assets/data/writing-feed.json"));
const evidence = await readJson(evidencePath);
const exceptions = await readJson(exceptionsPath);
const eastRiseCredit = "Made as Digital Content Strategist, EastRise Credit Union";
const eastRisePortraitCredit = "Photographed by Oliver Ames for EastRise Credit Union";
const blueCrossCredit = "Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont";
const negEcpCredit = "Photographed by Oliver Ames for Cynosure, Inc. and GBIC";
const gironCredit = "Photographed by Oliver Ames for the Giron family";
const foodbankCredit = "Photographed by Oliver Ames at Vermont Foodbank";
const gmcfCredit = "Photographed by Oliver Ames for Green Mountain Community Fitness";
const assets = {};
const normalize = (value) => value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
const cleanSourceUrl = (value) => {
  if (!value) return "";
  const url = new URL(value);
  for (const key of [...url.searchParams.keys()]) {
    if (/^utm_/i.test(key) || key.toLowerCase() === "rcm") url.searchParams.delete(key);
  }
  url.hash = "";
  return url.href;
};
const publicHttpsPage = (value) => {
  if (!value) return "";
  try {
    return new URL(value).protocol === "https:" ? cleanSourceUrl(value) : "";
  } catch {
    return "";
  }
};
const publicPage = (value) => /^https:\/\/(www\.)?(eastrise\.com|facebook\.com|instagram\.com|linkedin\.com|pixelspoke\.coop|youtube\.com|youtu\.be)\//i.test(value || "") ? cleanSourceUrl(value) : "";
const channelFor = (sourceUrl, fallback = "") => {
  if (!sourceUrl) return fallback;
  const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "").toLowerCase();
  if (hostname === "facebook.com") return "Facebook";
  if (hostname === "instagram.com") return "Instagram";
  if (hostname === "linkedin.com") return "LinkedIn";
  if (hostname === "youtube.com" || hostname === "youtu.be") return "YouTube";
  if (hostname === "eastrise.com" || hostname === "pixelspoke.coop") return "website";
  return fallback;
};
const captureFor = (sourceUrl) => captureBySource.get(sourceUrl) || captureBySource.get(canonicalSourceKey(sourceUrl)) || "";
const requiredFields = ["source_url", "source_channel", "published_date", "downloaded_date", "credit", "source_capture"];
const linkedInDate = (sourceUrl) => {
  const activityId = String(sourceUrl || "").match(/(?:activity:|activity-)(\d{16,})/)?.[1];
  return activityId ? new Date(Number(BigInt(activityId) >> 22n)).toISOString().slice(0, 10) : "";
};
const formatDate = (value) => new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
}).format(new Date(`${value}T00:00:00Z`));
const webpAssets = async (relativeDirectory) => (await readdir(join(root, relativeDirectory)))
  .filter((name) => name.endsWith(".webp"))
  .sort()
  .map((name) => `${relativeDirectory}/${name}`);

for (const series of photography.series) for (const image of series.images) {
  const sourceUrl = publicPage(image.sourcePage || image.sourceUrl);
  assets[normalize(image.src)] = {
    source_url: sourceUrl,
    source_channel: channelFor(sourceUrl, image.sourcePlatform || ""),
    published_date: image.publishedDate || image.src.match(/\/(\d{4}-\d{2}-\d{2})_/)?.[1] || "",
    downloaded_date: photography.generatedAt || "",
    credit: eastRiseCredit,
    source_capture: captureFor(sourceUrl),
    archive_note: image.publicArchiveNote || "",
    ...(image.samePublicMediaAs ? { same_public_media_as: normalize(image.samePublicMediaAs) } : {}),
  };
}
for (const post of social.posts) {
  const sourceUrl = publicPage(post.sourceUrl);
  assets[normalize(post.screenshot)] = {
    source_url: sourceUrl,
    source_channel: post.platform || "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: eastRiseCredit,
    source_capture: captureFor(sourceUrl),
  };
}

const eastRisePortraits = portraits.series?.find((series) => series.slug === "eastrise-leadership-board");
if (eastRisePortraits?.images?.length !== 42) throw new Error("portraits.json must contain 42 EastRise portraits.");
for (const image of eastRisePortraits.images) {
  const sourceUrl = publicPage(image.sourcePage || image.source);
  if (!sourceUrl) throw new Error(`EastRise portrait ${image.caption} lacks a public source URL.`);
  const sourceChannel = channelFor(sourceUrl);
  const sourceVerificationDate = image.dateEvidence?.basis === "source-page-verification"
    ? image.dateEvidence.date
    : portraits.generatedAt;
  assets[normalize(image.src)] = {
    source_url: sourceUrl,
    source_channel: sourceChannel,
    published_date: image.publishedDate || "",
    downloaded_date: sourceVerificationDate,
    credit: eastRisePortraitCredit,
    source_capture: sourceChannel === "LinkedIn" ? captureFor(sourceUrl) : "private_archive",
    archive_note: image.archiveNote || "",
  };
}

const amyPortraitAsset = normalize(eastRisePortraits.images.find((image) => image.caption === "Amy Vaughan")?.src || "");
if (!amyPortraitAsset || !assets[amyPortraitAsset]) throw new Error("portraits.json must identify Amy Vaughan's canonical portrait.");
assets["assets/images/work/portraits/amy-vaughan.webp"] = { ...assets[amyPortraitAsset] };

const blueCrossPortraits = portraits.series?.find((series) => series.slug === "blue-cross-cbss");
if (!blueCrossPortraits?.images?.length) throw new Error("portraits.json must contain the withheld Blue Cross portrait series.");
for (const image of blueCrossPortraits.images) {
  const sourceUrl = /^https:\/\//.test(image.source || "") ? cleanSourceUrl(image.source) : "";
  assets[normalize(image.src)] = {
    source_url: sourceUrl,
    source_channel: sourceUrl ? "website" : "",
    published_date: "",
    downloaded_date: sourceUrl ? "2026-07-29" : "",
    credit: blueCrossCredit,
    source_capture: captureFor(sourceUrl),
  };
}

const portraitAndCandidCollections = [
  {
    slugs: ["giron-family-fall-2025", "giron-family-christmas-tree-farm-2024", "giron-family-fall-2023"],
    downloadedDate: "2026-08-03",
    credit: gironCredit,
    archiveNote: (campaign) => `were photographed by Oliver Ames during the ${campaign.title} session on ${formatDate(campaign.shootDate)}; no public source record was retained.`,
  },
  {
    slugs: ["vermont-foodbank-volunteer-day-2026"],
    downloadedDate: "2026-07-29",
    credit: foodbankCredit,
    archiveNote: () => "were photographed by Oliver Ames at Vermont Foodbank on January 21, 2026; no public source record was retained.",
  },
];
for (const collection of portraitAndCandidCollections) {
  for (const slug of collection.slugs) {
    const campaign = eventGalleries.campaigns?.find((candidate) => candidate.slug === slug);
    if (!campaign?.images?.length) throw new Error(`event-galleries.json lacks ${slug}.`);
    for (const image of campaign.images) {
      assets[normalize(image.src)] = {
        source_url: "",
        source_channel: "",
        published_date: "",
        downloaded_date: collection.downloadedDate,
        credit: collection.credit,
        source_capture: "",
        archive_note: collection.archiveNote(campaign),
      };
    }
  }
}

for (const asset of [
  ...await webpAssets("assets/images/work/gmcf/sweat-heart"),
  ...await webpAssets("assets/images/work/gmcf/bike-fitting"),
  "assets/images/work/gmcf/sweat-heart-card.webp",
  "assets/images/work/gmcf/bike-fitting-card.webp",
  "assets/images/work/gmcf/gmcf-card.webp",
]) {
  const isBikeFitting = asset.includes("bike-fitting");
  assets[asset] = {
    source_url: "",
    source_channel: "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: gmcfCredit,
    source_capture: "",
    archive_note: isBikeFitting
      ? "was photographed by Oliver Ames during a 2025 bike-fitting assignment for Green Mountain Community Fitness; no public source record was retained."
      : "was photographed by Oliver Ames during the 2026 Sweat-Heart Throwdown for Green Mountain Community Fitness; no public source record was retained.",
  };
}

for (const [asset, note] of [
  ["assets/images/work/eastrise/uvm-soccer.webp", "was photographed by Oliver Ames during EastRise community work; no public source record was retained."],
  ["assets/images/work/eastrise/point-to-point.webp", "was photographed by Oliver Ames during EastRise community work; no public source record was retained."],
]) {
  assets[asset] = {
    source_url: "",
    source_channel: "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: eastRisePortraitCredit,
    source_capture: "",
    archive_note: note,
  };
}

assets["assets/images/about/oliver-ames-profile.webp"] = {
  source_url: "",
  source_channel: "",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: "Portrait of Oliver Ames; original photographer not recorded",
  source_capture: "",
  archive_note: "is the first-party profile portrait used by Ames Consulting; its original photographer and source file are not recorded.",
};

const testimonialPortraitSources = new Map([
  ["abigail-stevenson.webp", ["Abigail Stevenson", "https://www.linkedin.com/in/abigail-rose-stevenson"]],
  ["brad-meerholz.webp", ["Brad Meerholz", "https://www.linkedin.com/in/bradmeerholz"]],
  ["diana-clarke.webp", ["Diana Clarke", "https://www.linkedin.com/in/dianamclarke"]],
  ["dylan-woodrow.webp", ["Dylan Woodrow", "https://www.linkedin.com/in/dylan-woodrow-0b974774"]],
  ["heidi-white.webp", ["Heidi White", "https://www.linkedin.com/in/heidiwhitevt"]],
  ["jennifer-leeson.webp", ["Jennifer Leeson", "https://www.linkedin.com/in/jenniferleeson"]],
  ["mitch-berriman.webp", ["Mitch Berriman", "https://www.linkedin.com/in/mitch-berriman"]],
  ["rachel-feldman.webp", ["Rachel Feldman", "https://www.linkedin.com/in/rachel-feldman-070bb515"]],
  ["randy-repass-jr.webp", ["Randy Repass Jr.", "https://www.linkedin.com/in/radmacdaddy"]],
  ["simeon-chapin.webp", ["Simeon Chapin", "https://www.linkedin.com/in/simeonchapin"]],
  ["stephanie-loscalzo.webp", ["Stephanie Loscalzo", "https://www.linkedin.com/in/stephanie-loscalzo-185652a2"]],
  ["yvonne-garand.webp", ["Yvonne Garand", "https://www.linkedin.com/in/yvonnegarand"]],
]);
const testimonialPortraitAssets = await webpAssets("assets/images/testimonials");
if (testimonialPortraitAssets.length !== testimonialPortraitSources.size) {
  throw new Error("Every testimonial portrait must have a LinkedIn source mapping.");
}
for (const asset of testimonialPortraitAssets) {
  const filename = asset.split("/").at(-1);
  const source = testimonialPortraitSources.get(filename);
  if (!source) throw new Error(`Missing testimonial portrait source mapping for ${filename}.`);
  const [name, sourceUrl] = source;
  assets[asset] = {
    source_url: sourceUrl,
    source_channel: "LinkedIn",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: `Public LinkedIn profile image for ${name}; photographer not identified`,
    source_capture: "",
    archive_note: `is the public LinkedIn profile image for ${name}; its photographer, publication date, and source capture are not recorded.`,
  };
}

const wheelsSourceUrl = "https://www.instagram.com/p/DBlvKpKtVEU/";
assets["assets/images/work/eastrise/wheels-for-warmth-card.webp"] = {
  source_url: wheelsSourceUrl,
  source_channel: "Instagram",
  published_date: "2024-10-26",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_capture: captureFor(wheelsSourceUrl),
  archive_note: "",
};

const addWritingImage = (asset, post, sourceUrl, publisher) => {
  if (!asset?.startsWith("assets/images/writing/") || assets[asset]) return;
  const cleanUrl = publicHttpsPage(sourceUrl);
  if (!cleanUrl) throw new Error(`Writing image ${asset} lacks a public HTTPS source.`);
  assets[asset] = {
    source_url: cleanUrl,
    source_channel: channelFor(cleanUrl, post.platforms?.includes("LinkedIn") ? "LinkedIn" : "website"),
    published_date: linkedInDate(cleanUrl) || String(post.date || "").slice(0, 10),
    downloaded_date: String(writingFeed.refreshedAt || "").slice(0, 10),
    credit: publisher ? `Published by ${publisher}; shared by Oliver Ames` : "Published by Oliver Ames",
    source_capture: "",
    archive_note: "",
  };
};
for (const post of writingFeed.posts || []) {
  const postUrl = post.mediaSource || post.links?.[0]?.url || "";
  for (const media of post.media || []) {
    if (media.type === "image") addWritingImage(media.src, post, postUrl, "");
  }
  for (const media of post.sharedPost?.media || []) {
    if (media.type === "image") addWritingImage(media.src, post, post.sharedPost.url || postUrl, post.sharedPost.author || "");
  }
  if (post.image || post.localImage) {
    const filename = `${createHash("sha256").update(post.assetId || post.id).digest("hex").slice(0, 12)}.webp`;
    addWritingImage(`assets/images/writing/${filename}`, post, postUrl, "");
  }
}

assets["assets/images/work/campaigns/member-stories.webp"] = {
  source_url: "https://www.youtube.com/watch?v=A1oAN6Ox6A0",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=A1oAN6Ox6A0"),
};
assets["assets/images/work/campaigns/will-barbecue.webp"] = {
  source_url: "https://www.youtube.com/watch?v=fAF3x-Iu2Bo",
  source_channel: "YouTube",
  published_date: "2025-12-30",
  downloaded_date: "2026-08-03",
  credit: eastRiseCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=fAF3x-Iu2Bo"),
};
assets["assets/images/work/campaigns/flight-paths.webp"] = {
  source_url: "https://www.youtube.com/watch?v=4r5N5DjmSCU",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_capture: captureFor("https://www.youtube.com/watch?v=4r5N5DjmSCU"),
};
assets["assets/images/work/campaigns/eastrise-writing.webp"] = {
  source_url: "",
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_capture: "",
};
for (const asset of [
  "assets/images/work/credit-union-websites/eastrise-feature.webp",
  "assets/images/work/credit-union-websites/eastrise-desktop.webp",
  "assets/images/work/credit-union-websites/eastrise-mobile.webp",
  "assets/images/work/credit-union-websites/eastrise-homepage.webp",
]) {
  const sourceUrl = "https://www.pixelspoke.coop/eastrise-credit-union-case-study";
  assets[asset] = {
    source_url: sourceUrl,
    source_channel: "website",
    published_date: "",
    downloaded_date: "2026-08-11",
    credit: eastRiseCredit,
    source_capture: captureFor(sourceUrl),
  };
}

const negEcpCampaign = eventGalleries.campaigns?.find((campaign) => campaign.slug === "neg-ecp-conference-2026");
if (negEcpCampaign?.images?.length !== 35) {
  throw new Error("event-galleries.json must contain 35 NEG-ECP conference photographs.");
}
for (const image of negEcpCampaign.images) {
  assets[normalize(image.src)] = {
    source_url: "",
    source_channel: "",
    published_date: "",
    downloaded_date: "2026-08-11",
    credit: negEcpCredit,
    source_capture: "",
    archive_note: "",
  };
}

for (const group of evidence.public_sources || []) {
  for (const asset of group.assets || []) {
    if (!assets[asset]) throw new Error(`${evidencePath} references unknown asset ${asset}.`);
    const sourceUrl = publicPage(group.source_url);
    if (!sourceUrl) throw new Error(`${evidencePath} has a non-public source URL for ${asset}.`);
    assets[asset].source_url = sourceUrl;
    assets[asset].source_channel = group.source_channel;
    assets[asset].source_capture = captureFor(sourceUrl);
  }
}
for (const group of evidence.published_dates || []) {
  for (const [asset, publishedDate] of Object.entries(group.records || {})) {
    if (!assets[asset]) throw new Error(`${evidencePath} references unknown asset ${asset}.`);
    assets[asset].published_date = publishedDate;
  }
}
for (const group of exceptions.exceptions || []) {
  const configuredAssets = new Set(group.assets || []);
  for (const prefix of group.asset_prefixes || []) {
    const matches = Object.keys(assets).filter((asset) => asset.startsWith(prefix));
    if (!matches.length) throw new Error(`${exceptionsPath} prefix ${prefix} does not match a provenance asset.`);
    for (const asset of matches) configuredAssets.add(asset);
  }
  for (const asset of configuredAssets) {
    if (!assets[asset]) throw new Error(`${exceptionsPath} references unknown asset ${asset}.`);
    assets[asset].accepted_exception = {
      reason: group.reason,
      missing_fields: group.missing_fields,
      note: group.note,
    };
    if (group.public_note && !assets[asset].archive_note) assets[asset].archive_note = group.public_note;
  }
}

const generatedAt = "2026-08-14";
await writeFile(join(root, "assets/data/media-provenance.json"), `${JSON.stringify({ generated_at: generatedAt, assets }, null, 2)}\n`);
const missing = Object.entries(assets).filter(([, data]) => requiredFields.some((field) => data[field] === "")).map(([asset, data]) => ({
  asset,
  missing_fields: requiredFields.filter((field) => data[field] === ""),
  accepted_exception: data.accepted_exception || null,
}));
await writeFile(join(root, "assets/data/media-provenance-missing.json"), `${JSON.stringify({ generated_at: generatedAt, missing }, null, 2)}\n`);
console.log(`Tracked ${Object.keys(assets).length} public-source assets; ${missing.length} have accepted omitted fields.`);

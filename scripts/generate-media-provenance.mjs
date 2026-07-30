#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const screenshotManifest = JSON.parse(await readFile(join(root, "assets/data/source-screenshot-manifest.json"), "utf8").catch(() => '{"screenshots":[]}'));
const screenshotBySource = new Map((screenshotManifest.screenshots || []).map((record) => [record.source_url, record.source_screenshot]));
const photography = JSON.parse(await readFile(join(root, "assets/data/eastrise-photography.json"), "utf8"));
const social = JSON.parse(await readFile(join(root, "assets/data/eastrise-social.json"), "utf8"));
const eastRiseCredit = "Made as Digital Content Strategist, EastRise Credit Union";
const blueCrossCredit = "Made as Social Media Strategist, Blue Cross and Blue Shield of Vermont";
const assets = {};
const normalize = (value) => value.replace(/^\.\.\/\.\.\//, "").replace(/^\.\.\//, "").replace(/^\//, "");
const publicPage = (value) => /^https:\/\/(www\.)?(facebook\.com|instagram\.com|linkedin\.com|youtube\.com|youtu\.be)\//i.test(value || "") ? value : "";
const screenshotFor = (sourceUrl) => screenshotBySource.get(sourceUrl) || "";

for (const series of photography.series) for (const image of series.images) {
  assets[normalize(image.src)] = {
    source_url: publicPage(image.sourceUrl),
    source_channel: image.sourcePlatform || "",
    published_date: image.src.match(/\/(\d{4}-\d{2}-\d{2})_/)?.[1] || "",
    downloaded_date: photography.generatedAt || "",
    credit: eastRiseCredit,
    source_screenshot: screenshotFor(publicPage(image.sourceUrl)),
  };
}
for (const post of social.posts) {
  assets[normalize(post.screenshot)] = {
    source_url: publicPage(post.sourceUrl),
    source_channel: post.platform || "",
    published_date: "",
    downloaded_date: "2026-07-29",
    credit: eastRiseCredit,
    source_screenshot: screenshotFor(publicPage(post.sourceUrl)),
  };
}

const profiles = {
  "assets/images/work/portraits/gallery/blue-cross/beth-roberts-executive.webp": "https://www.bluecrossvt.org/beth-roberts",
  "assets/images/work/portraits/gallery/blue-cross/barbara-demas-executive.webp": "https://www.bluecrossvt.org/barbara-demas",
  "assets/images/work/portraits/gallery/blue-cross/ruth-greene-executive.webp": "https://www.bluecrossvt.org/ruth-greene",
  "assets/images/work/portraits/gallery/blue-cross/rebecca-heintz-executive.webp": "https://www.bluecrossvt.org/rebecca-heintz",
  "assets/images/work/portraits/gallery/blue-cross/margaret-pinello-white-executive.webp": "https://www.bluecrossvt.org/margaret-pinello-white",
  "assets/images/work/portraits/gallery/blue-cross/tom-weigel-executive.webp": "https://www.bluecrossvt.org/tom-weigel",
};
for (const [asset, sourceUrl] of Object.entries(profiles)) assets[asset] = {
  source_url: sourceUrl,
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_screenshot: screenshotFor(sourceUrl),
};

assets["assets/images/work/campaigns/member-stories.webp"] = {
  source_url: "https://www.youtube.com/watch?v=A1oAN6Ox6A0",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_screenshot: screenshotFor("https://www.youtube.com/watch?v=A1oAN6Ox6A0"),
};
assets["assets/images/work/campaigns/flight-paths.webp"] = {
  source_url: "https://www.youtube.com/watch?v=4r5N5DjmSCU",
  source_channel: "YouTube",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: blueCrossCredit,
  source_screenshot: screenshotFor("https://www.youtube.com/watch?v=4r5N5DjmSCU"),
};
assets["assets/images/work/campaigns/eastrise-writing.webp"] = {
  source_url: "",
  source_channel: "website",
  published_date: "",
  downloaded_date: "2026-07-29",
  credit: eastRiseCredit,
  source_screenshot: "",
};

await writeFile(join(root, "assets/data/media-provenance.json"), `${JSON.stringify({ generated_at: "2026-07-30", assets }, null, 2)}\n`);
const missing = Object.entries(assets).filter(([, data]) => Object.values(data).some((value) => value === "")).map(([asset, data]) => ({
  asset,
  missing_fields: Object.entries(data).filter(([, value]) => value === "").map(([field]) => field),
}));
await writeFile(join(root, "assets/data/media-provenance-missing.json"), `${JSON.stringify({ generated_at: "2026-07-30", missing }, null, 2)}\n`);
console.log(`Tracked ${Object.keys(assets).length} public-source assets; ${missing.length} have omitted fields.`);

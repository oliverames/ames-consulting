#!/usr/bin/env node

import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const archiveRoot = process.env.EASTRISE_ARCHIVE_ROOT
  || process.argv.find((argument) => argument.startsWith("--archive-root="))?.slice("--archive-root=".length);

if (!archiveRoot) {
  throw new Error("Set EASTRISE_ARCHIVE_ROOT or pass --archive-root=/path/to/EastRise.");
}

const photographyPath = path.join(root, "assets/data/eastrise-photography.json");
const socialPath = path.join(root, "assets/data/eastrise-social.json");
const evidencePath = path.join(root, "assets/data/media-provenance-evidence.json");
const photography = JSON.parse(await readFile(photographyPath, "utf8"));
const social = JSON.parse(await readFile(socialPath, "utf8"));
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const socialById = new Map(social.posts.map((post) => [post.id, post]));

const imports = [
  {
    postId: "linkedin-073",
    position: 1,
    series: "smokin-somethin-bbq",
    source: "Products and Financial Guidance/073 LinkedIn Post/Image 01.jpg",
    alt: "A bearded man in a cap and apron stands with folded arms outside Smokin’ Somethin’ BBQ.",
  },
  {
    postId: "facebook-002",
    position: 1,
    series: "uvm-mens-soccer-2025",
    source: "UVM Soccer/002 Congrats to UVM Men's Soccer for another... - EastRise Credit Union/588804272_1144168184576324_6649684450435828917_n.jpg",
    alt: "UVM men’s soccer players embrace near the goal after a play.",
  },
  {
    postId: "facebook-002",
    position: 4,
    series: "uvm-mens-soccer-2025",
    source: "UVM Soccer/002 Congrats to UVM Men's Soccer for another... - EastRise Credit Union/589114364_1144168284576314_7399837545723688300_n.jpg",
    alt: "Three UVM men’s soccer players talk together on the field.",
  },
  {
    postId: "facebook-002",
    position: 2,
    series: "uvm-mens-soccer-2025",
    source: "UVM Soccer/002 Congrats to UVM Men's Soccer for another... - EastRise Credit Union/589355928_1144168221242987_6721195646447767408_n.jpg",
    alt: "UVM men’s soccer players huddle in front of a cheering crowd.",
  },
  {
    postId: "facebook-002",
    position: 3,
    series: "uvm-mens-soccer-2025",
    source: "UVM Soccer/002 Congrats to UVM Men's Soccer for another... - EastRise Credit Union/589401556_1144168254576317_2778578618300649244_n.jpg",
    alt: "UVM men’s soccer players gather near a packed stand at Virtue Field.",
  },
  {
    postId: "facebook-003",
    position: 1,
    series: "uvm-mens-soccer-2025",
    source: "UVM Soccer/003 Congratulations to UVM Men's Soccer for... - EastRise Credit Union/585512453_1138943788432097_4985613878514972590_n.jpg",
    alt: "Soccer players contest the ball during a snowy night match at UVM.",
  },
  {
    postId: "facebook-004",
    position: 1,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/577821358_1130783349248141_5012169093201497831_n.jpg",
    alt: "A volunteer stacks tires among rows collected for Wheels for Warmth.",
  },
  {
    postId: "facebook-004",
    position: 4,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/579297412_1130783462581463_6646912072258063903_n.jpg",
    alt: "A volunteer carries tires through a crowded Wheels for Warmth collection site.",
  },
  {
    postId: "facebook-004",
    position: 7,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/578265941_1130783599248116_2567970719549844880_n.jpg",
    alt: "A volunteer in a safety vest carries two tires at Wheels for Warmth.",
  },
  {
    postId: "facebook-004",
    position: 3,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/576849244_1130783429248133_8951889076026411265_n.jpg",
    alt: "Two volunteers pose together while holding tires at Wheels for Warmth.",
  },
  {
    postId: "facebook-004",
    position: 8,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/578070852_1130783635914779_6763968991915107461_n.jpg",
    alt: "Volunteers talk beside rows of tires at the Wheels for Warmth collection.",
  },
  {
    postId: "facebook-004",
    position: 5,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/578274801_1130783499248126_7592231162043072390_n.jpg",
    alt: "A volunteer kneels while handling a tire at Wheels for Warmth.",
  },
  {
    postId: "facebook-004",
    position: 6,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/579217496_1130783539248122_5352646295283930634_n.jpg",
    alt: "Volunteers sort rows of donated tires at Wheels for Warmth.",
  },
  {
    postId: "facebook-004",
    position: 2,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/004 $108,000 raised. This was the best year on... - EastRise Credit Union/578253143_1130783389248137_5411234050616238155_n.jpg",
    alt: "Volunteers push a stack of tires on a hand truck at Wheels for Warmth.",
  },
  {
    postId: "linkedin-083",
    position: 1,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331005422.jpg",
    alt: "Volunteers stack tires beside a warehouse during a rainy collection day.",
  },
  {
    postId: "linkedin-083",
    position: 2,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331006875.jpg",
    alt: "Two volunteers handle tires beside an open trailer in the rain.",
  },
  {
    postId: "linkedin-083",
    position: 3,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331007746.jpg",
    alt: "A volunteer walks toward a donated tire in a wet parking lot.",
  },
  {
    postId: "linkedin-083",
    position: 4,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331008763.jpg",
    alt: "A volunteer lifts a tire from an open trailer during the donation drive.",
  },
  {
    postId: "linkedin-083",
    position: 5,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331009087.jpg",
    alt: "A volunteer carries a stack of tires across the collection site.",
  },
  {
    postId: "linkedin-083",
    position: 6,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331009940.jpg",
    alt: "Two volunteers pose together outside a Wheels for Warmth donation site.",
  },
  {
    postId: "linkedin-083",
    position: 7,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331010895.jpg",
    alt: "Stacks of donated tires fill an open truck container.",
  },
  {
    postId: "linkedin-083",
    position: 8,
    series: "wheels-for-warmth-2025",
    source: "Wheels for Warmth/083 LinkedIn Post/083 1761331012043.jpg",
    alt: "A volunteer carries two tires past the collection warehouse.",
  },
  {
    postId: "facebook-007",
    position: 1,
    series: "taylor-hoar-racing",
    source: "Taylor Hoar Racing/007 We’re excited to present this year’s Labor... - EastRise Credit Union/539425069_1071108605215616_5229805506101875476_n.jpg",
    alt: "A Labor Day race graphic shows stock cars at speed beside a hand-drawn results card.",
  },
  {
    postId: "facebook-011",
    position: 2,
    series: "veggievango-taylor-hoar",
    source: "VeggieVanGo/011 Each year, Vermont Foodbank's VeggieVanGo... - EastRise Credit Union/514643076_1027245222935288_697029873877927827_n.jpg",
    alt: "A volunteer stands with her hands on her hips beside a VeggieVanGo truck and distribution sign.",
  },
  {
    postId: "facebook-011",
    position: 4,
    series: "veggievango-taylor-hoar",
    source: "VeggieVanGo/011 Each year, Vermont Foodbank's VeggieVanGo... - EastRise Credit Union/514740920_1027245332935277_3936642214671826544_n.jpg",
    alt: "A braided volunteer wears a shirt reading ‘Let’s Make a Difference’ at a food distribution.",
  },
  {
    postId: "instagram-103",
    position: 4,
    series: "taylor-hoar-racing",
    source: "Taylor Hoar Racing/103 Instagram Post/495022565_18407849323096567_1418035549078241408_n.jpg",
    alt: "The driver’s seat, steering wheel, gauges, and roll cage inside a stock car.",
  },
  {
    postId: "instagram-103",
    position: 5,
    series: "taylor-hoar-racing",
    source: "Taylor Hoar Racing/103 Instagram Post/495499812_18407849335096567_5630833857934015135_n.jpg",
    alt: "A close detail of the EastRise Credit Union logo on red race-car bodywork.",
  },
  {
    postId: "facebook-015",
    position: 7,
    series: "eastrise-launch",
    source: "Member and Business Stories/015 Meet Susi Ryan, a fiber artist whose work... - EastRise Credit Union/483531912_943920241267787_48400306603640815_n.jpg",
    alt: "A colorful felt landscape shows two sheep beneath a rainbow sky.",
  },
  {
    postId: "facebook-017",
    position: 3,
    series: "eastrise-launch",
    source: "Member and Business Stories/017 Meet Johnny McArdle, a true force on the... - EastRise Credit Union/483365387_943143491345462_6625875062485156762_n.jpg",
    alt: "A handcyclist raises one fist while riding on an outdoor track.",
  },
  {
    postId: "facebook-017",
    position: 4,
    series: "eastrise-launch",
    source: "Member and Business Stories/017 Meet Johnny McArdle, a true force on the... - EastRise Credit Union/483485218_943143488012129_2195277331564937578_n.jpg",
    alt: "A smiling handcyclist wears a helmet during an outdoor ride.",
  },
  {
    postId: "facebook-017",
    position: 2,
    series: "eastrise-launch",
    source: "Member and Business Stories/017 Meet Johnny McArdle, a true force on the... - EastRise Credit Union/483487341_943143578012120_4788397828783332369_n.jpg",
    alt: "A handcyclist sits beside his cycle while holding his helmet.",
  },
  {
    postId: "facebook-019",
    position: 1,
    series: "veggievango-east-rise",
    source: "EastRise Staff at Work/019 Members of the EastRise team, including... - EastRise Credit Union/482209933_943137721346039_9064564972939625213_n.jpg",
    alt: "A volunteer stands beside stacked boxes of produce at a food distribution.",
  },
  {
    postId: "facebook-021",
    position: 4,
    series: "eastrise-launch",
    source: "EastRise Launch/021 If you’ve seen our latest commercial,... - EastRise Credit Union/482249336_943132928013185_597790541992957327_n.jpg",
    alt: "A man examines an unfinished acoustic guitar in his workshop.",
  },
  {
    postId: "facebook-021",
    position: 9,
    series: "eastrise-launch",
    source: "EastRise Launch/021 If you’ve seen our latest commercial,... - EastRise Credit Union/482253171_943132828013195_4410752366723378297_n.jpg",
    alt: "Hands rest on the strings and wooden body of an upright bass.",
  },
  {
    postId: "facebook-021",
    position: 2,
    series: "eastrise-launch",
    source: "EastRise Launch/021 If you’ve seen our latest commercial,... - EastRise Credit Union/482358829_943132911346520_5726448972762843531_n.jpg",
    alt: "A craftsman shapes wood at a workbench in his instrument shop.",
  },
  {
    postId: "facebook-021",
    position: 8,
    series: "eastrise-launch",
    source: "EastRise Launch/021 If you’ve seen our latest commercial,... - EastRise Credit Union/483508864_943132648013213_7752068130084055723_n.jpg",
    alt: "A woman sits outdoors beside a barn with her hands folded in her lap.",
  },
  {
    postId: "facebook-021",
    position: 7,
    series: "eastrise-launch",
    source: "EastRise Launch/021 If you’ve seen our latest commercial,... - EastRise Credit Union/483916831_943132894679855_6288094732156205622_n.jpg",
    alt: "A smiling man wearing a plaid shirt stands beside a barn post.",
  },
];

const pendingIndependentAuthorshipKeys = new Set([
  ...Array.from({ length: 8 }, (_, index) => `linkedin-083:${index + 1}`),
  "facebook-019:1",
  "facebook-021:7",
  "facebook-021:8",
]);

const newSeries = [
  {
    slug: "smokin-somethin-bbq",
    title: "Smokin’ Somethin’ BBQ",
    description: "A small-business member portrait from the Smokin’ Somethin’ BBQ story.",
  },
  {
    slug: "uvm-mens-soccer-2025",
    title: "UVM Men’s Soccer, 2025",
    description: "Match and celebration photographs from the 2025 UVM men’s soccer season.",
  },
  {
    slug: "wheels-for-warmth-2025",
    title: "Wheels for Warmth, 2025",
    description: "Tire-donation and collection-day photographs from the 2025 Wheels for Warmth campaign.",
  },
];

for (const definition of newSeries) {
  if (!photography.series.some((series) => series.slug === definition.slug)) {
    photography.series.push({
      ...definition,
      archiveDate: null,
      archiveDateBasis: "latest-verified-publication-date",
      imageOrder: "curated",
      imageOrderNote: "The sequence follows an editorial selection from the public social-post media.",
      images: [],
      displayOrderMode: "editorial",
    });
  }
}

const importedAssets = [];
for (const item of imports) {
  const post = socialById.get(item.postId);
  if (!post) throw new Error(`Missing social post ${item.postId}.`);
  const sourcePath = path.join(archiveRoot, item.source);
  await access(sourcePath);
  const sourceBuffer = await readFile(sourcePath);
  const sha256 = createHash("sha256").update(sourceBuffer).digest("hex");
  const outputName = `${post.publishedDate}_${post.id}_${String(item.position).padStart(2, "0")}-${sha256.slice(0, 12)}.webp`;
  const outputDirectory = path.join(root, "assets/images/work/eastrise/photography", item.series);
  const outputPath = path.join(outputDirectory, outputName);
  await mkdir(outputDirectory, { recursive: true });
  await sharp(sourceBuffer).rotate().webp({ quality: 86, effort: 6 }).toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  const src = `../../assets/images/work/eastrise/photography/${item.series}/${outputName}`;
  const series = photography.series.find((candidate) => candidate.slug === item.series);
  const record = {
    src,
    alt: item.alt,
    width: metadata.width,
    height: metadata.height,
    sourceUrl: post.sourceUrl,
    sourcePlatform: post.platform,
    publishedDate: post.publishedDate,
    dateBasis: "public-platform-metadata",
    dateEvidence: "The archived public post capture and social manifest identify the source URL and publication date.",
  };
  const existingIndex = series.images.findIndex((image) => (
    image.src === src || (image.alt === item.alt && image.sourceUrl === post.sourceUrl)
  ));
  if (existingIndex === -1) series.images.push(record);
  else series.images[existingIndex] = record;
  importedAssets.push({
    postId: item.postId,
    position: item.position,
    asset: src.replace("../../", ""),
    sourceSha256: sha256,
    authorshipStatus: pendingIndependentAuthorshipKeys.has(`${item.postId}:${item.position}`)
      ? "user-directed-pending-independent-evidence"
      : "independently-corroborated",
  });
}

for (const series of photography.series) {
  if (series.slug === "veggievango-east-rise") {
    series.imageOrder = "curated";
    series.imageOrderNote = "The sequence combines the public Instagram carousel with an additional photograph from the related Facebook post.";
  }
  const latestDate = series.images.map((image) => image.publishedDate).filter(Boolean).sort().at(-1) || null;
  series.archiveDate = latestDate;
  series.archiveDateBasis = latestDate ? "latest-verified-publication-date" : "unverified";
}
photography.series.sort((left, right) => {
  if (!left.archiveDate) return right.archiveDate ? 1 : 0;
  if (!right.archiveDate) return -1;
  return right.archiveDate.localeCompare(left.archiveDate);
});
photography.generatedAt = "2026-08-14";
photography.totalImages = photography.series.reduce((total, series) => total + series.images.length, 0);

const platformEvidence = evidence.published_dates.find((group) => group.evidence === "public_platform_metadata");
if (!platformEvidence) throw new Error("Missing public_platform_metadata evidence group.");
const importedPostIds = new Set(importedAssets.map((item) => item.postId));
const expectedImportedAssets = new Set(importedAssets.map((item) => item.asset));
for (const asset of Object.keys(platformEvidence.records)) {
  const importedPostId = [...importedPostIds].find((postId) => asset.includes(`_${postId}_`));
  if (importedPostId && asset.includes("/eastrise/photography/") && !expectedImportedAssets.has(asset)) {
    delete platformEvidence.records[asset];
  }
}
for (const imported of importedAssets) {
  const post = socialById.get(imported.postId);
  platformEvidence.records[imported.asset] = post.publishedDate;
}
platformEvidence.records = Object.fromEntries(Object.entries(platformEvidence.records).sort(([left], [right]) => left.localeCompare(right)));

const normalizeAsset = (src) => src.replace(/^\.\.\/\.\.\//, "");
const seriesAssets = (slug, predicate = () => true) => {
  const series = photography.series.find((candidate) => candidate.slug === slug);
  if (!series) throw new Error(`Missing photography series ${slug}.`);
  return series.images.filter(predicate).map((image) => normalizeAsset(image.src));
};
const importedFor = (postId) => importedAssets
  .filter((item) => item.postId === postId)
  .sort((left, right) => left.position - right.position)
  .map((item) => item.asset);
const basenameMatches = (...parts) => (image) => parts.some((part) => path.basename(image.src).includes(part));

const posts = [
  { postId: "linkedin-073", sourceMediaCount: 1, coverageAssets: importedFor("linkedin-073") },
  { postId: "linkedin-074", sourceMediaCount: 1, coverageAssets: seriesAssets("eastrise-candid-portraits") },
  { postId: "facebook-002", sourceMediaCount: 4, coverageAssets: importedFor("facebook-002") },
  { postId: "facebook-003", sourceMediaCount: 1, coverageAssets: importedFor("facebook-003") },
  { postId: "facebook-004", sourceMediaCount: 8, coverageAssets: importedFor("facebook-004") },
  { postId: "linkedin-081", sourceMediaCount: 8, coverageAssets: importedFor("facebook-004") },
  { postId: "linkedin-083", sourceMediaCount: 8, coverageAssets: importedFor("linkedin-083") },
  {
    postId: "facebook-005",
    sourceMediaCount: 3,
    coverageAssets: seriesAssets("wheels-for-warmth-2024", basenameMatches("_9-868dd7b2c527", "_4-9af79752e714", "_1-05c3cca5b111")),
  },
  { postId: "facebook-007", sourceMediaCount: 1, coverageAssets: importedFor("facebook-007") },
  { postId: "facebook-008", sourceMediaCount: 9, coverageAssets: seriesAssets("john-and-donia") },
  { postId: "linkedin-084", sourceMediaCount: 9, coverageAssets: seriesAssets("john-and-donia") },
  { postId: "instagram-117", sourceMediaCount: 1, coverageAssets: seriesAssets("people-and-financial-counseling", basenameMatches("DMxmCwUtjLJ")) },
  {
    postId: "facebook-010",
    sourceMediaCount: 8,
    coverageAssets: seriesAssets("karina-and-ryan", (image) => !path.basename(image.src).includes("_5-0102c7a3381e")),
  },
  { postId: "linkedin-089", sourceMediaCount: 9, coverageAssets: seriesAssets("karina-and-ryan") },
  {
    postId: "facebook-011",
    sourceMediaCount: 4,
    coverageAssets: [
      ...seriesAssets("veggievango-taylor-hoar", basenameMatches("_1-c65c2345c153", "_3-f9390a248be7")),
      ...importedFor("facebook-011"),
    ],
  },
  {
    postId: "instagram-118",
    sourceMediaCount: 4,
    coverageAssets: seriesAssets("veggievango-taylor-hoar", (image) => path.basename(image.src).includes("UTC_DLnR3ETN4pV_")),
  },
  {
    postId: "facebook-012",
    sourceMediaCount: 8,
    coverageAssets: seriesAssets("winooski-development", (image) => (
      path.basename(image.src).startsWith("2025-06-26_") && !path.basename(image.src).includes("_9-100de47661fc")
    )),
  },
  { postId: "facebook-013", sourceMediaCount: 9, coverageAssets: seriesAssets("wood-for-good") },
  { postId: "instagram-121", sourceMediaCount: 9, coverageAssets: seriesAssets("wood-for-good") },
  {
    postId: "instagram-103",
    sourceMediaCount: 5,
    coverageAssets: [
      ...seriesAssets("taylor-hoar-racing", (image) => path.basename(image.src).includes("UTC_DJJ9BxStqip_")),
      ...importedFor("instagram-103"),
    ],
  },
  {
    postId: "facebook-015",
    sourceMediaCount: 7,
    coverageAssets: [
      ...seriesAssets("eastrise-launch", (image) => path.basename(image.src).includes("UTC_DCU2dHrsDfy_")),
      ...importedFor("facebook-015"),
    ],
  },
  {
    postId: "facebook-016",
    sourceMediaCount: 6,
    coverageAssets: seriesAssets("eastrise-launch", (image) => path.basename(image.src).includes("UTC_DCE8lP9RE_L_")),
  },
  {
    postId: "facebook-017",
    sourceMediaCount: 4,
    coverageAssets: [
      ...seriesAssets("eastrise-launch", basenameMatches("UTC_DB_og-ipG9A_1")),
      ...importedFor("facebook-017"),
    ],
  },
  { postId: "facebook-018", sourceMediaCount: 10, coverageAssets: seriesAssets("wheels-for-warmth-2024") },
  { postId: "facebook-019", sourceMediaCount: 11, coverageAssets: seriesAssets("veggievango-east-rise") },
  { postId: "facebook-020", sourceMediaCount: 1, coverageAssets: seriesAssets("eastrise-launch", basenameMatches("DBeK1grsBXs")) },
  {
    postId: "facebook-021",
    sourceMediaCount: 9,
    coverageAssets: [
      ...seriesAssets("eastrise-launch", basenameMatches("DBMo23Cundt_1-", "DBMo23Cundt_3-", "DBMo23Cundt_6-", "DBMo23Cundt_8-")),
      ...importedFor("facebook-021"),
    ],
  },
  {
    postId: "facebook-022",
    sourceMediaCount: 7,
    coverageAssets: seriesAssets("taylor-hoar-racing", (image) => path.basename(image.src).includes("UTC_DAWNuHROhIO_")),
  },
  {
    postId: "facebook-040",
    status: "excluded",
    sourceMediaCount: 1,
    exclusionReason: "third-party-artwork",
    credit: "Nathan W. Pyle",
    coverageAssets: [],
  },
].map((post) => ({ status: "complete", ...post }));

const selectedPostIds = new Set([
  "facebook-002", "facebook-003", "facebook-004", "facebook-005", "facebook-007", "facebook-008", "facebook-010", "facebook-011", "facebook-012", "facebook-013", "facebook-015", "facebook-016", "facebook-017", "facebook-018", "facebook-019", "facebook-020", "facebook-021", "facebook-022", "facebook-040",
  "instagram-103", "instagram-117", "instagram-118", "instagram-121",
  "linkedin-073", "linkedin-074", "linkedin-081", "linkedin-083", "linkedin-084", "linkedin-089",
]);
if (posts.length !== selectedPostIds.size || posts.some((post) => !selectedPostIds.delete(post.postId)) || selectedPostIds.size) {
  throw new Error("The social-photography coverage map must contain the exact 29-post review set.");
}
for (const post of posts) {
  if (post.status === "complete" && post.coverageAssets.length !== post.sourceMediaCount) {
    throw new Error(`${post.postId} maps ${post.coverageAssets.length} of ${post.sourceMediaCount} photographs.`);
  }
  if (new Set(post.coverageAssets).size !== post.coverageAssets.length) {
    throw new Error(`${post.postId} repeats a portfolio asset.`);
  }
}
const photographicPosts = posts.filter((post) => post.status === "complete");
const pendingIndependentAuthorshipAssets = importedAssets
  .filter((item) => item.authorshipStatus === "user-directed-pending-independent-evidence")
  .map((item) => item.asset)
  .sort();
const independentlyCorroboratedAssets = importedAssets
  .filter((item) => item.authorshipStatus === "independently-corroborated")
  .map((item) => item.asset)
  .sort();
const joinManifest = {
  generatedAt: "2026-08-14",
  selectionBasis: "29 full-post screenshots with predominantly black-and-white imagery",
  photographicPostCount: photographicPosts.length,
  excludedPostCount: posts.length - photographicPosts.length,
  photographicPlacements: photographicPosts.reduce((total, post) => total + post.coverageAssets.length, 0),
  distinctPortfolioAssets: new Set(photographicPosts.flatMap((post) => post.coverageAssets)).size,
  newlyImportedAssets: importedAssets.length,
  newlyImportedAuthorshipReview: {
    independentlyCorroboratedCount: independentlyCorroboratedAssets.length,
    pendingIndependentEvidenceCount: pendingIndependentAuthorshipAssets.length,
    inclusionBasis: "Oliver Ames explicitly directed that the photographs shown in these posts be listed in the portfolio on 2026-08-14.",
    independentlyCorroboratedAssets,
    pendingIndependentEvidenceAssets: pendingIndependentAuthorshipAssets,
  },
  posts,
};

await writeFile(photographyPath, `${JSON.stringify(photography, null, 2)}\n`);
await writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(path.join(root, "assets/data/eastrise-social-photography.json"), `${JSON.stringify(joinManifest, null, 2)}\n`);
console.log(`Imported ${imports.length} photographs. The archive now contains ${photography.totalImages} images across ${photography.series.length} series.`);

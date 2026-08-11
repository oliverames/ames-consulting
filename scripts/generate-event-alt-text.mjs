#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const eventRoot = path.join(root, "assets/images/work/events");
const outputRoot = path.join(root, "assets/data/event-gallery-alt-text");
const eventData = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const apiKey = process.env.MISTRAL_API_KEY;
const model = process.env.MISTRAL_VISION_MODEL || "mistral-medium-latest";

const options = {
  batchSize: 8,
  concurrency: 1,
  force: false,
  repairDuplicates: false,
  slugs: [],
};

for (const argument of process.argv.slice(2)) {
  if (argument === "--force") options.force = true;
  else if (argument === "--repair-duplicates") options.repairDuplicates = true;
  else if (argument.startsWith("--slug=")) options.slugs.push(argument.slice("--slug=".length));
  else if (argument.startsWith("--batch-size=")) options.batchSize = Number(argument.slice("--batch-size=".length));
  else if (argument.startsWith("--concurrency=")) options.concurrency = Number(argument.slice("--concurrency=".length));
  else throw new Error(`Unknown argument: ${argument}`);
}

if (!apiKey) throw new Error("MISTRAL_API_KEY is required.");
if (!Number.isInteger(options.batchSize) || options.batchSize < 1 || options.batchSize > 12) {
  throw new Error("--batch-size must be an integer from 1 through 12.");
}
if (options.concurrency !== 1) {
  throw new Error("--concurrency must be 1 so each batch can avoid all accepted descriptions.");
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalizeAlt = (value) => String(value || "")
  .replace(/\s+/g, " ")
  .replace(/^["“]|["”]$/g, "")
  .trim();

function validateAlt(file, alt) {
  const words = alt.split(/\s+/).filter(Boolean);
  if (words.length < 8 || words.length > 25) {
    throw new Error(`${file} has ${words.length} words instead of 8 through 25.`);
  }
  if (alt.length > 160) throw new Error(`${file} exceeds 160 characters.`);
  if (/^(?:(?:a|an|the)\s+)?(?:photo(?:graph)?|image|picture)\s+(?:of|showing|depicting)\b/i.test(alt)
    || /\b(?:depicts|shows|appears)\b/i.test(alt)) {
    throw new Error(`${file} uses generic image wording: ${alt}`);
  }
  if (/\b(?:item|frame)\s+\d+\b/i.test(alt)) {
    throw new Error(`${file} uses an item number: ${alt}`);
  }
}

function batches(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function imageContent(filePath) {
  const source = await readFile(filePath);
  const thumbnail = await sharp(source)
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 3, smartSubsample: true })
    .toBuffer();
  return `data:image/webp;base64,${thumbnail.toString("base64")}`;
}

async function requestDescriptions(campaign, files, descriptionsToAvoid, attempt = 1) {
  const prompt = [
    "Write factual accessibility alt text for each portfolio photograph.",
    "Return only JSON as {\"descriptions\":[{\"file\":\"exact basename\",\"alt\":\"...\"}]}",
    "Write 8 to 25 words and no more than 160 characters for each item.",
    "Describe the primary visible subjects, action, setting, and useful composition details. Count people carefully.",
    "Every description in this response must be distinct. Use visible differences in angle, gesture, gaze, action, or framing.",
    "Do not infer a person's identity, relationship, emotion, age, disability, race, or another sensitive trait.",
    "Do not use the words photo, photograph, image, picture, depicts, shows, or appears.",
    "Do not repeat the event title, mention a filename, or add an item number.",
    `Event context: ${campaign.title}. ${campaign.intro}`,
    descriptionsToAvoid.length
      ? `Avoid repeating these recent descriptions: ${JSON.stringify(descriptionsToAvoid)}`
      : "",
  ].filter(Boolean).join(" ");
  const content = [{ type: "text", text: prompt }];

  for (const [index, file] of files.entries()) {
    content.push({ type: "text", text: `Item ${index + 1}: ${file}` });
    content.push({
      type: "image_url",
      image_url: await imageContent(path.join(eventRoot, campaign.slug, file)),
    });
  }

  let response;
  try {
    response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content }],
      }),
    });
  } catch (error) {
    if (attempt < 4) {
      await wait(1_500 * (2 ** (attempt - 1)));
      return requestDescriptions(campaign, files, descriptionsToAvoid, attempt + 1);
    }
    throw error;
  }

  if (!response.ok) {
    const detail = await response.text();
    if (attempt < 4 && (response.status === 429 || response.status >= 500)) {
      await wait(1_500 * (2 ** (attempt - 1)));
      return requestDescriptions(campaign, files, descriptionsToAvoid, attempt + 1);
    }
    throw new Error(`Mistral returned ${response.status}: ${detail.slice(0, 500)}`);
  }

  const result = await response.json();
  const rawContent = result.choices?.[0]?.message?.content;
  const parsed = JSON.parse(typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent));
  if (!Array.isArray(parsed.descriptions)) throw new Error("Mistral response omitted descriptions.");

  const expected = new Set(files);
  const received = new Map();
  for (const item of parsed.descriptions) {
    const file = path.basename(String(item?.file || ""));
    const alt = normalizeAlt(item?.alt);
    if (!expected.has(file)) throw new Error(`Mistral returned an unexpected file: ${file}`);
    if (received.has(file)) throw new Error(`Mistral returned ${file} more than once.`);
    validateAlt(file, alt);
    received.set(file, alt);
  }
  if (received.size !== expected.size) {
    const missing = files.filter((file) => !received.has(file));
    throw new Error(`Mistral omitted: ${missing.join(", ")}`);
  }
  return received;
}

async function readExisting(campaign) {
  if (options.force) return new Map();
  const outputPath = path.join(outputRoot, `${campaign.slug}.json`);
  const existing = await readFile(outputPath, "utf8").then(JSON.parse, () => null);
  if (!existing) return new Map();
  if (existing.slug !== campaign.slug || !Array.isArray(existing.images)) {
    throw new Error(`Invalid existing alt-text file: ${outputPath}`);
  }
  return new Map(existing.images.map((image) => [image.file, normalizeAlt(image.alt)]));
}

async function writeCampaign(campaign, files, descriptions, { requireComplete = false } = {}) {
  const images = files.filter((file) => descriptions.has(file)).map((file) => {
    const alt = descriptions.get(file);
    validateAlt(file, alt);
    return { file, alt };
  });
  if (requireComplete && images.length !== files.length) {
    const missing = files.filter((file) => !descriptions.has(file));
    throw new Error(`Missing generated alt text for ${campaign.slug}: ${missing.join(", ")}`);
  }
  const counts = new Map();
  for (const { alt } of images) counts.set(alt, (counts.get(alt) || 0) + 1);
  const excessiveDuplicates = [...counts].filter(([, count]) => count > 2);
  if (excessiveDuplicates.length) {
    throw new Error(
      `Repeated event alt text in ${campaign.slug}: ${excessiveDuplicates.map(([alt, count]) => `${count} × ${alt}`).join("; ")}`,
    );
  }
  await mkdir(outputRoot, { recursive: true });
  await writeFile(
    path.join(outputRoot, `${campaign.slug}.json`),
    `${JSON.stringify({ slug: campaign.slug, images }, null, 2)}\n`,
  );
}

const campaigns = eventData.campaigns.filter((campaign) =>
  campaign.images.some((image) => image.src.includes("/assets/images/work/events/"))
  && (!options.slugs.length || options.slugs.includes(campaign.slug))
);
if (options.slugs.some((slug) => !campaigns.some((campaign) => campaign.slug === slug))) {
  throw new Error("One or more requested slugs are not checked-in event galleries.");
}

for (const campaign of campaigns) {
  const files = campaign.images.map((image) => path.basename(image.src)).sort();
  const descriptions = await readExisting(campaign);
  const descriptionsToAvoid = [];
  for (const [file, alt] of descriptions) {
    if (!files.includes(file)) descriptions.delete(file);
    else validateAlt(file, alt);
  }
  if (options.repairDuplicates) {
    const filesByAlt = new Map();
    for (const [file, alt] of descriptions) {
      if (!filesByAlt.has(alt)) filesByAlt.set(alt, []);
      filesByAlt.get(alt).push(file);
    }
    for (const [alt, duplicateFiles] of filesByAlt) {
      if (duplicateFiles.length <= 2) continue;
      descriptionsToAvoid.push(alt);
      duplicateFiles.forEach((file) => descriptions.delete(file));
    }
  }
  const remaining = files.filter((file) => !descriptions.has(file));
  const queue = batches(remaining, options.batchSize);

  for (let index = 0; index < queue.length; index += options.concurrency) {
    const group = queue.slice(index, index + options.concurrency);
    const recent = [...new Set([
      ...descriptionsToAvoid,
      ...descriptions.values(),
    ])];
    const results = await Promise.all(
      group.map((batch) => requestDescriptions(campaign, batch, recent)),
    );
    for (const result of results) {
      for (const [file, alt] of result) descriptions.set(file, alt);
    }
    await writeCampaign(campaign, files, descriptions);
    console.log(`${campaign.slug}: ${descriptions.size}/${files.length}`);
  }

  await writeCampaign(campaign, files, descriptions, { requireComplete: true });
}

console.log(`Generated scene-level alt text with ${model} for ${campaigns.length} event galleries.`);

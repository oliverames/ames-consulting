#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const provenance = JSON.parse(await readFile(path.join(root, "assets/data/media-provenance.json"), "utf8"));
const fields = ["source_url", "source_channel", "published_date", "downloaded_date", "credit"];
const channels = new Set(["", "website", "Facebook", "Instagram", "LinkedIn", "YouTube"]);
let complete = 0;
for (const [asset, data] of Object.entries(provenance.assets || {})) {
  for (const field of fields) if (!(field in data)) throw new Error(`${asset} is missing the ${field} field.`);
  if (!channels.has(data.source_channel)) throw new Error(`${asset} has unsupported source_channel ${data.source_channel}.`);
  if (Object.values(data).some((value) => String(value).toLowerCase() === "unknown")) throw new Error(`${asset} contains an unknown placeholder.`);
  if (data.source_url && !/^https:\/\//.test(data.source_url)) throw new Error(`${asset} has an invalid source_url.`);
  if (Object.values(data).every(Boolean)) complete += 1;
}
console.log(`Validated ${Object.keys(provenance.assets || {}).length} provenance records; ${complete} contain every field value.`);

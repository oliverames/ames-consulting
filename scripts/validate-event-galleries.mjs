import { access, readFile } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/event-galleries.json", "utf8"));
const errors = [];
for (const campaign of data.campaigns) {
  if (!campaign.images.length) errors.push(`${campaign.title} has no photographs.`);
  const sources = new Set();
  for (const image of campaign.images) {
    if (sources.has(image.src)) errors.push(`Duplicate image in ${campaign.title}: ${image.src}`);
    sources.add(image.src);
    try { await access(path.resolve("work", campaign.slug, image.src)); }
    catch { errors.push(`Missing image in ${campaign.title}: ${image.src}`); }
  }
}
if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
else console.log(`Validated ${data.campaigns.length} event galleries and ${data.campaigns.reduce((n, campaign) => n + campaign.images.length, 0)} photographs.`);

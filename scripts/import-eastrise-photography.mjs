import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const archiveRoot = "/Users/oliverames/Desktop/Archive Folder";
const sourceRoot = "/Users/oliverames/My Drive (Personal)/SanDisk Takeout/Oliver's Career/EastRise Credit Union 2019–2025/Scraped Imagery";
const archiveManifest = JSON.parse(await readFile(`${archiveRoot}/EastRise/Public Photography/Public Photography Manifest.json`, "utf8"));
const instagram = JSON.parse(await readFile(`${sourceRoot}/instagram/manifest.json`, "utf8"));
const linkedIn = JSON.parse(await readFile(`${sourceRoot}/linkedin/manifest.json`, "utf8"));
const website = JSON.parse(await readFile(`${sourceRoot}/website/manifest.json`, "utf8"));

const metadata = new Map();
for (const entry of [...instagram.images, ...linkedIn.images, ...website.images]) {
  metadata.set(path.basename(entry.filename), entry);
}

const slug = (value) => value.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const approved = archiveManifest.filter((entry) => !entry.group.startsWith("Verification Pending"));
const approvedWithHash = await Promise.all(approved.map(async (entry) => ({
  ...entry,
  sourceHash: createHash("sha256").update(await readFile(entry.source)).digest("hex"),
})));
const unique = [...new Map(approvedWithHash.map((entry) => [`${entry.group}:${entry.sourceHash}`, entry])).values()];
const groups = new Map();

async function captureMetadata(source) {
  if (!source.startsWith(archiveRoot)) return {};
  const captureRoot = source.split(`${path.sep}Media${path.sep}`)[0];
  try {
    const pageData = JSON.parse(await readFile(path.join(captureRoot, "Page Data.json"), "utf8"));
    const copy = String(pageData.text || "").split("\n").map((line) => line.trim()).find((line) => line.length > 30);
    return {
      sourceUrl: pageData.sourceUrl || "",
      alt: copy || "",
    };
  } catch {
    return {};
  }
}

for (const [index, entry] of unique.entries()) {
  const groupSlug = slug(entry.group);
  const source = entry.source;
  const sourceMeta = metadata.get(path.basename(entry.source));
  const captureMeta = await captureMetadata(source);
  const sourceStem = path.basename(source, path.extname(source)).replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || `image-${index + 1}`;
  const stem = `${sourceStem}-${entry.sourceHash.slice(0, 12)}`;
  const relative = `assets/images/work/eastrise/photography/${groupSlug}/${stem}.webp`;
  const destination = path.resolve(relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", "1800x1800>", "-strip", "-quality", "86", destination]);
  const dimensions = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim().split(" ").map(Number);
  const caption = String(sourceMeta?.caption || sourceMeta?.alt || captureMeta.alt || "").split(/\n|(?<=[.!?])\s/)[0].trim();
  const item = {
    src: `../../${relative}`,
    alt: caption && caption !== "No photo description available." ? caption : `${entry.group} public photograph`,
    width: dimensions[0],
    height: dimensions[1],
    sourceUrl: captureMeta.sourceUrl || sourceMeta?.original_url || "",
    sourcePlatform: source.includes("Instagram") || entry.source.includes("instagram") ? "Instagram" : source.includes("Facebook") ? "Facebook" : entry.source.includes("linkedin") ? "LinkedIn" : "EastRise website",
  };
  if (!groups.has(entry.group)) groups.set(entry.group, []);
  groups.get(entry.group).push(item);
  if ((index + 1) % 20 === 0) console.log(`Processed ${index + 1}/${unique.length}`);
}

const descriptions = {
  "Taylor Hoar Racing": "Race days, portraits, and sponsor storytelling from Thunder Road and the wider Vermont racing community.",
  "Community and Volunteer Work": "People giving their time to food access, firewood programs, adaptive sports, and community events.",
  "Member and Business Stories": "Vermont members, makers, and small businesses photographed where their work happens.",
  "LinkedIn Published Photography": "Publicly published EastRise photography recovered from LinkedIn.",
  "Member Stories": "Member photography used to tell practical stories about homes, families, and financial decisions.",
  "Winooski Development": "A public series documenting housing and economic development in Winooski.",
  "Shred Fest": "A public document-destruction and community service series.",
  "VeggieVanGo": "Food access and volunteer work with the Vermont Foodbank's VeggieVanGo program.",
  "People and Financial Counseling": "EastRise staff and financial counselors photographed for public education work.",
  "People and Portraits": "Public portraits of EastRise staff.",
  "Wood for Good": "Volunteer firewood work photographed in the field.",
};

const output = {
  generatedAt: "2026-07-29",
  publicSourceOnly: true,
  totalImages: unique.length,
  series: [...groups].map(([title, images]) => ({ slug: slug(title), title, description: descriptions[title], images })),
};
await mkdir("assets/data", { recursive: true });
await writeFile("assets/data/eastrise-photography.json", `${JSON.stringify(output, null, 2)}\n`);
console.log(`Imported ${output.totalImages} public-source images across ${output.series.length} series.`);

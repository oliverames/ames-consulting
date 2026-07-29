#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const archiveRoot = "/Users/oliverames/Desktop/Archive Folder";
const outputDirectory = join(root, "assets", "images", "work", "eastrise", "social");
const manifestPath = join(root, "assets", "data", "eastrise-social.json");
const archiveProjectDirectory = join(archiveRoot, "EastRise", "EastRise Social");

const platformRules = [
  { name: "Facebook", matches: (url) => url.includes("facebook.com/EastRiseCU/") },
  { name: "Instagram", matches: (url) => url.includes("instagram.com/eastrisecu/") },
  { name: "LinkedIn", matches: (url) => url.includes("linkedin.com/posts/eastrisecu_") },
];

const memeTitlePatterns = [
  /almost payday/i,
  /anyone else/i,
  /chris pine/i,
  /huge improvement/i,
];

function cleanTitle(platform, directoryName, data) {
  const raw = data.bookmarkTitle || data.title || directoryName;
  const cleaned = raw
    .replace(/^\(\d+\+?\)\s*/, "")
    .replace(/\s+-\s+EastRise Credit Union(?:\s+\|\s+Facebook)?$/i, "")
    .replace(/\s+\|\s+(?:Facebook|LinkedIn)$/i, "")
    .trim();
  if (cleaned && !/^(Facebook|Instagram|Post)$/i.test(cleaned)) return cleaned;
  const number = directoryName.match(/^\d+/)?.[0] || "post";
  return `EastRise ${platform} post ${number}`;
}

function imageDimensions(path) {
  const output = execFileSync("/usr/bin/sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], {
    encoding: "utf8",
  });
  const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
  const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
  return { width, height };
}

await mkdir(outputDirectory, { recursive: true });
await mkdir(archiveProjectDirectory, { recursive: true });

const posts = [];
for (const rule of platformRules) {
  const platformDirectory = join(archiveRoot, rule.name);
  for (const directoryName of (await readdir(platformDirectory)).sort()) {
    const postDirectory = join(platformDirectory, directoryName);
    const dataPath = join(postDirectory, "Page Data.json");
    const screenshotPath = join(postDirectory, "Page Screenshot.png");
    try {
      await access(dataPath);
      await access(screenshotPath);
    } catch {
      continue;
    }

    const data = JSON.parse(await readFile(dataPath, "utf8"));
    const sourceUrl = data.sourceUrl || "";
    if (!rule.matches(sourceUrl)) continue;

    const number = directoryName.match(/^\d+/)?.[0] || String(posts.length + 1).padStart(3, "0");
    const filename = `${rule.name.toLowerCase()}-${number}.webp`;
    const outputPath = join(outputDirectory, filename);
    execFileSync("/opt/homebrew/bin/magick", [
      screenshotPath,
      "-resize", "1600x1600>",
      "-quality", "82",
      outputPath,
    ], { stdio: "ignore" });

    const title = cleanTitle(rule.name, directoryName, data);
    posts.push({
      id: `${rule.name.toLowerCase()}-${number}`,
      platform: rule.name,
      title,
      sourceUrl,
      archiveDirectory: relative(archiveRoot, postDirectory),
      screenshot: `assets/images/work/eastrise/social/${filename}`,
      ...imageDimensions(outputPath),
      isMeme: memeTitlePatterns.some((pattern) => pattern.test(title)),
    });
  }
}

posts.sort((left, right) => left.platform.localeCompare(right.platform) || left.id.localeCompare(right.id));
const platformCounts = Object.fromEntries(
  platformRules.map(({ name }) => [name, posts.filter((post) => post.platform === name).length]),
);
const manifest = {
  title: "EastRise Social",
  description: "EastRise social posts, carousels, videos, and memes treated as one campaign and project.",
  publicSourceOnly: true,
  totalPosts: posts.length,
  memePosts: posts.filter((post) => post.isMeme).length,
  platformCounts,
  posts,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(join(archiveProjectDirectory, "Project Index.json"), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(join(archiveProjectDirectory, "README.md"), `# EastRise Social\n\nAll EastRise social posts and memes in the public archive belong to this single campaign/project. The original captures remain in their platform folders so screenshots, metrics, copy, and media stay together.\n\n- Facebook posts: ${platformCounts.Facebook}\n- Instagram posts: ${platformCounts.Instagram}\n- LinkedIn posts: ${platformCounts.LinkedIn}\n- Total archived posts: ${posts.length}\n- Posts identified as memes: ${manifest.memePosts}\n\nSee \`Project Index.json\` for the source URL, archive location, and website image for every item.\n`);

console.log(`Imported ${posts.length} EastRise social posts into one project (${basename(manifestPath)}).`);

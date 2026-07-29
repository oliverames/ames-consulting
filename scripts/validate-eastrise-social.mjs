#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";

const data = JSON.parse(await readFile("assets/data/eastrise-social.json", "utf8"));
const errors = [];
const ids = new Set();

if (!data.publicSourceOnly) errors.push("The EastRise social project must use public-source captures only.");
if (data.totalPosts !== data.posts.length) errors.push("The total post count does not match the manifest.");
if (Object.values(data.platformCounts).reduce((sum, count) => sum + count, 0) !== data.totalPosts) {
  errors.push("The platform counts do not match the total post count.");
}

for (const post of data.posts) {
  if (ids.has(post.id)) errors.push(`Duplicate post id: ${post.id}`);
  ids.add(post.id);
  if (!/^https:\/\//.test(post.sourceUrl)) errors.push(`Missing public source URL: ${post.id}`);
  if (!post.title) errors.push(`Missing post title: ${post.id}`);
  if (!(post.width > 0 && post.height > 0)) errors.push(`Invalid screenshot dimensions: ${post.id}`);
  try {
    await access(path.resolve(post.screenshot));
  } catch {
    errors.push(`Missing screenshot: ${post.screenshot}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated one EastRise Social project with ${data.totalPosts} public posts.`);
}

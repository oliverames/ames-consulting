#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const manifestPath = path.join(root, "assets/data/eastrise-social.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const temporaryDirectory = await mkdir(path.join(os.tmpdir(), "ames-social-captures"), { recursive: true }).then(() => path.join(os.tmpdir(), "ames-social-captures"));
const browser = await chromium.launch({ headless: true });

async function dismissBlockingDialogs(page, platform) {
  if (platform === "Instagram") {
    const signup = page.locator('[role="dialog"]');
    if (await signup.count()) {
      const close = signup.locator('[role="button"]').first();
      if (await close.count()) await close.click({ timeout: 2_000 }).catch(() => {});
    }
  }

  if (platform === "LinkedIn") {
    await page.locator('[role="dialog"]').evaluateAll((dialogs) => dialogs.forEach((dialog) => dialog.remove()));
  }
}

async function expandPostCopy(page) {
  for (const label of ["See more", "…more", "more"]) {
    const controls = page.getByText(label, { exact: true });
    for (let index = 0; index < await controls.count(); index += 1) {
      await controls.nth(index).click({ timeout: 1_000 }).catch(() => {});
    }
  }
}

async function instagramPost(page) {
  const handles = await page.locator("main div").elementHandles();
  const candidates = [];
  for (const handle of handles) {
    const box = await handle.boundingBox();
    if (!box || box.y > 260 || box.width < 650 || box.width > 1_050 || box.height < 350 || box.height > 1_600) continue;
    const text = await handle.innerText().catch(() => "");
    if (!text.toLowerCase().includes("eastrisecu")) continue;
    candidates.push({ handle, box, area: box.width * box.height });
  }
  candidates.sort((left, right) => left.area - right.area);
  if (!candidates.length) throw new Error("Instagram post card not found");
  return candidates[0].handle;
}

async function visiblePost(page, selector, minimumWidth = 500, minimumHeight = 300) {
  const handles = await page.locator(selector).elementHandles();
  const candidates = [];
  for (const handle of handles) {
    const box = await handle.boundingBox();
    if (!box || box.width < minimumWidth || box.height < minimumHeight) continue;
    candidates.push({ handle, area: box.width * box.height });
  }
  candidates.sort((left, right) => right.area - left.area);
  if (!candidates.length) throw new Error(`Complete post card not found for ${selector}`);
  return candidates[0].handle;
}

async function capturePost(post, index) {
  const page = await browser.newPage({ viewport: { width: 1_440, height: 1_400 }, deviceScaleFactor: 1 });
  try {
    await page.goto(post.sourceUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(3_500);
    await dismissBlockingDialogs(page, post.platform);
    await expandPostCopy(page);
    await page.waitForTimeout(500);

    let target;
    if (post.platform === "Facebook") target = await visiblePost(page, '[role="article"]');
    else if (post.platform === "LinkedIn") target = await visiblePost(page, "article");
    else target = await instagramPost(page);

    const pngPath = path.join(temporaryDirectory, `${post.id}.png`);
    if ("screenshot" in target) await target.screenshot({ path: pngPath });
    else throw new Error(`No screenshot target for ${post.id}`);

    const destination = path.join(root, post.screenshot);
    await exec("/opt/homebrew/bin/magick", [pngPath, "-strip", "-quality", "86", destination]);
    const dimensions = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim();
    process.stdout.write(`[${index + 1}/${manifest.posts.length}] ${post.id} ${dimensions}\n`);
  } finally {
    await page.close();
  }
}

try {
  const startIndex = Number(process.env.SOCIAL_CAPTURE_START || 0);
  for (let index = startIndex; index < manifest.posts.length; index += 1) {
    try {
      await capturePost(manifest.posts[index], index);
    } catch (error) {
      process.stderr.write(`[${index + 1}/${manifest.posts.length}] ${manifest.posts[index].id} FAILED: ${error.message}\n`);
    }
  }
} finally {
  await browser.close();
  await rm(temporaryDirectory, { recursive: true, force: true });
}

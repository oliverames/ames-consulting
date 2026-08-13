import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  galleryOrderFor,
  projectDateFor,
  projectDateRecords,
  sortEntriesNewestFirst,
} from "../scripts/project-order.mjs";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const workItemHrefs = (markup) => [...markup.matchAll(/<a class="work-item"[^>]*href="([^"]+)"[\s\S]*?<\/a\s*>/g)].map((match) => match[1]);
const pathThumbHrefs = (markup) => [...markup.matchAll(/<a class="path-thumb"[^>]*href="work\/([^"]+)"[\s\S]*?<\/a\s*>/g)].map((match) => match[1]);

function assertNewestFirst(hrefs, label) {
  for (const href of hrefs) assert.ok(projectDateFor(href), `${label} lacks a date for ${href}`);
  assert.deepEqual(hrefs, sortEntriesNewestFirst(hrefs, (href) => href), `${label} is not newest first`);
}

function galleryImageFiles(html, slug) {
  const gallery = html.match(new RegExp(`<div class="campaign-collage"[^>]*data-gallery="${slug}"[^>]*>([\\s\\S]*?)<\\/div>`));
  assert.ok(gallery, `Missing ${slug} gallery`);
  return [...gallery[1].matchAll(/<img[^>]*src="[^"]*\/([^/"]+\.webp)"/g)].map((match) => match[1]);
}

test("project registry uses valid normalized dates and explicit range ends", () => {
  const seen = new Set();
  for (const record of projectDateRecords) {
    assert.ok(!seen.has(record.href), `Duplicate project record: ${record.href}`);
    seen.add(record.href);
    assert.ok(record.dateEvidence?.trim(), `Missing date evidence for ${record.href}`);
    if (!record.sortDate) continue;
    assert.match(record.sortDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(`${record.sortDate}T00:00:00Z`).toISOString().slice(0, 10), record.sortDate);
    if (record.dateBasis === "range-end") assert.match(record.sortDate, /-12-31$/);
  }
});

test("same-date records preserve their explicit source order", () => {
  const sameDate = ["wheels-for-warmth/", "live-broadcasts/"];
  assert.deepEqual(sortEntriesNewestFirst(sameDate, (href) => href), sameDate);
});

test("portrait sorting uses a photo date rather than a source verification date", () => {
  const portraits = projectDateFor("eastrise-portraits/");
  assert.equal(portraits.sortDate, "2025-08-14");
  assert.equal(portraits.dateBasis, "exact");
  assert.match(portraits.dateEvidence, /native capture date/);
});

test("home, work, and EastRise project cards render newest first", async () => {
  const home = await read("index.html");
  const homeStrip = home.match(/<div class="path-strip">([\s\S]*?)<\/div>\s*<a class="path-browse"/)?.[1];
  assert.ok(homeStrip, "Missing homepage project strip");
  assertNewestFirst(pathThumbHrefs(homeStrip), "Homepage project strip");

  const work = await read("work/index.html");
  const projects = work.match(/<h2 id="project-list-title">Projects<\/h2>[\s\S]*?<div class="work-list">([\s\S]*?)<section class="work-category work-category--portraits">/)?.[1];
  assert.ok(projects, "Missing Work projects list");
  const projectHrefs = workItemHrefs(projects);
  const deferredHrefs = ["eastrise-social/", "member-banking-stories/", "live-broadcasts/"];
  assert.deepEqual(projectHrefs.slice(-deferredHrefs.length), deferredHrefs, "Work archive projects are not grouped at the end");
  assertNewestFirst(projectHrefs.slice(0, -deferredHrefs.length), "Work primary projects list");
  assertNewestFirst(projectHrefs.slice(-deferredHrefs.length), "Work archive projects list");

  const legacy = work.match(/<section class="work-category work-category--earlier">[\s\S]*?<div class="work-list">([\s\S]*?)<\/div>\s*<\/section>/)?.[1];
  assert.ok(legacy, "Missing Work legacy list");
  assertNewestFirst(workItemHrefs(legacy), "Work legacy list");

  const eastRise = await read("work/eastrise/index.html");
  const eastRiseCards = eastRise.match(/<section class="work-category legacy-campaigns">[\s\S]*?<div class="work-list">([\s\S]*?)<\/div>\s*<\/section>/)?.[1];
  assert.ok(eastRiseCards, "Missing EastRise project archive");
  assertNewestFirst(workItemHrefs(eastRiseCards), "EastRise project archive");
});

test("EastRise photography archive renders dated series first, newest first", async () => {
  const html = await read("work/eastrise-photography/index.html");
  const hrefs = [...html.matchAll(/<section class="case-section photo-series" aria-labelledby="([^"]+)">/g)]
    .map((match) => `eastrise-photography/#${match[1]}`);
  assert.equal(hrefs.length, 13);
  assertNewestFirst(hrefs, "EastRise photography archive");
  assert.ok(hrefs.every((href) => projectDateFor(href)?.sortDate));
});

test("public gallery pages use the shared organization footer", async () => {
  const html = await read("work/neg-ecp-conference-2026/index.html");
  assert.match(html, /<h2>Work by organization<\/h2>/);
  assert.doesNotMatch(html, /<h2>Galleries<\/h2>/);
});

test("GMCF galleries declare and follow authoritative oldest-first capture order", async () => {
  for (const [slug, page] of [
    ["sweat-heart-throwdown", "work/sweat-heart-throwdown/index.html"],
    ["bike-fitting", "work/bike-fitting/index.html"],
  ]) {
    const metadata = galleryOrderFor(slug);
    const html = await read(page);
    assert.ok(metadata, `Missing ${slug} gallery metadata`);
    assert.match(html, new RegExp(`data-gallery="${slug}"[^>]*data-order-mode="chronological"`));
    assert.ok(html.includes(`data-capture-start="${metadata.captureStart}"`));
    assert.ok(html.includes(`data-capture-end="${metadata.captureEnd}"`));
    assert.deepEqual(galleryImageFiles(html, slug), metadata.files);
    for (const file of metadata.files) {
      assert.match(html, new RegExp(`${file.replace(".", "\\.")}"[^>]*data-captured-at="${metadata.capturedAt[file].replace("+", "\\+")}"`));
    }
  }
});

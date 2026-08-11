import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  PUBLIC_HTML_FILES,
  PUBLIC_IMAGE_PREFIXES,
  PUBLIC_ROUTE_ROOTS,
  PUBLIC_RUNTIME_FILES,
  RETIRED_ASSET_PREFIXES,
  RETIRED_ROUTE_PREFIXES,
  extractPublicImageReferences,
  isAllowedPublicHtmlPath,
  isAllowedPublicImagePath,
  isAllowedPublishedArtifactPath,
  isAllowedRuntimePath,
  isRetiredPublicPath,
  normalizePublicPath,
  resolvePublishedLocalReference,
} from "../scripts/publication-policy.mjs";

const root = process.cwd();
const noindexPattern = /<meta\s[^>]*name="robots"[^>]*content="[^"]*noindex[^"]*"/i;

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(filePath));
    else if (entry.isFile()) files.push(filePath);
  }
  return files;
}

test("retired route and asset prefixes remain denied", () => {
  assert.deepEqual(RETIRED_ROUTE_PREFIXES, [
    "work/beta-andrew/",
    "work/beta-emma/",
    "work/beta-ethan/",
  ]);
  assert.deepEqual(RETIRED_ASSET_PREFIXES, [
    "assets/images/provenance/source-screenshots/",
    "assets/images/work/events/beta-andrew/",
    "assets/images/work/events/beta-emma/",
    "assets/images/work/events/beta-ethan/",
    "assets/images/work/eastrise/photography/_unassigned-public-assets/",
  ]);

  for (const prefix of [...RETIRED_ROUTE_PREFIXES, ...RETIRED_ASSET_PREFIXES]) {
    assert.equal(isRetiredPublicPath(prefix), true);
    assert.equal(isRetiredPublicPath(`${prefix}private-instructions.webp`), true);
    assert.equal(isAllowedPublishedArtifactPath(`${prefix}private-instructions.webp`), false);
  }
  assert.equal(isRetiredPublicPath("WORK/BETA-ANDREW/index.html"), true);
  assert.equal(
    isRetiredPublicPath("ASSETS/IMAGES/PROVENANCE/SOURCE-SCREENSHOTS/private-review.webp"),
    true,
  );
  assert.equal(isRetiredPublicPath("assets/images/work/events/%62eta-emma/photo.webp"), true);
  assert.equal(isRetiredPublicPath("work/beta-technologies/index.html"), false);
});

test("public route and runtime manifests reject arbitrary files", () => {
  assert.equal(isAllowedPublicHtmlPath("work/ping-warden/index.html"), true);
  assert.equal(isAllowedRuntimePath("assets/js/header-scroll.js"), true);

  for (const filePath of [
    "work/ping-warden/private-notes.md",
    "work/private-preview/index.html",
    "assets/css/draft.css",
    "assets/icons/private.svg",
    "assets/js/private-instructions.js",
    "assets/data/source-screenshot-manifest.json",
  ]) {
    assert.equal(isAllowedPublishedArtifactPath(filePath), false, filePath);
  }
  assert.throws(() => normalizePublicPath("work/../private/index.html"), /traversal/);
});

test("built references cannot escape the published artifact", () => {
  const siteRoot = path.join(root, "_site");
  const htmlPath = path.join(siteRoot, "work", "ping-warden", "index.html");

  assert.equal(
    resolvePublishedLocalReference(siteRoot, htmlPath, "../../assets/css/main.css"),
    path.join(siteRoot, "assets", "css", "main.css"),
  );
  assert.throws(
    () => resolvePublishedLocalReference(siteRoot, htmlPath, "../../../package.json"),
    /outside the site artifact/,
  );
  assert.equal(
    resolvePublishedLocalReference(siteRoot, htmlPath, "https://example.com/image.webp"),
    null,
  );
});

test("public images require an approved root and an exact public reference", () => {
  assert.deepEqual(PUBLIC_IMAGE_PREFIXES, [
    "assets/images/about/",
    "assets/images/testimonials/",
    "assets/images/work/",
    "assets/images/writing/",
  ]);

  const approvedImage = "assets/images/work/software/ping-warden-icon.webp";
  const unreferencedImage = "assets/images/work/software/unreferenced-draft.webp";
  const arbitraryImage = "assets/images/private/review-screenshot.webp";
  const restrictedImage = "assets/images/provenance/source-screenshots/private-review.webp";
  const references = new Set([approvedImage, arbitraryImage, restrictedImage]);

  assert.equal(isAllowedPublicImagePath(approvedImage), true);
  assert.equal(isRetiredPublicPath(arbitraryImage), false);
  assert.equal(isAllowedPublicImagePath(arbitraryImage), false);
  assert.equal(isAllowedPublicImagePath(restrictedImage), false);
  assert.equal(isAllowedPublishedArtifactPath(approvedImage), false);
  assert.equal(isAllowedPublishedArtifactPath(approvedImage, references), true);
  assert.equal(isAllowedPublishedArtifactPath(unreferencedImage, references), false);
  assert.equal(isAllowedPublishedArtifactPath(arbitraryImage, references), false);
  assert.equal(isAllowedPublishedArtifactPath(restrictedImage, references), false);

  assert.deepEqual(
    [...extractPublicImageReferences(`
      <img src="../../${approvedImage}"
        srcset="../../assets/images/work/software/ping-warden-icon-320w.webp 320w">
    `)],
    [approvedImage, "assets/images/work/software/ping-warden-icon-320w.webp"],
  );
});

test("source routes match the explicit public HTML manifest", async () => {
  const discovered = new Set(["index.html"]);
  for (const routeRoot of PUBLIC_ROUTE_ROOTS) {
    for (const filePath of await listFiles(path.join(root, routeRoot))) {
      if (path.basename(filePath) !== "index.html") continue;
      const relativePath = normalizePublicPath(path.relative(root, filePath));
      const html = await readFile(filePath, "utf8");
      if (!isRetiredPublicPath(relativePath) && !noindexPattern.test(html)) discovered.add(relativePath);
    }
  }

  const expected = PUBLIC_HTML_FILES.filter((filePath) => filePath !== "404.html");
  assert.deepEqual([...discovered].sort(), [...expected].sort());
});

test("runtime source trees match the explicit runtime manifest", async () => {
  const discovered = new Set([
    "_headers",
    "assets/data/site.config.json",
    "assets/images/brand/oa-social-mark.svg",
  ]);
  for (const runtimeRoot of ["assets/css", "assets/icons", "assets/js"]) {
    for (const filePath of await listFiles(path.join(root, runtimeRoot))) {
      discovered.add(normalizePublicPath(path.relative(root, filePath)));
    }
  }

  assert.deepEqual([...discovered].sort(), [...PUBLIC_RUNTIME_FILES].sort());
});

test("Cloudflare response headers enforce the documented browser protections", async () => {
  const headers = await readFile(path.join(root, "_headers"), "utf8");

  for (const requiredPolicy of [
    "frame-ancestors 'none'",
    "object-src 'none'",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "X-Content-Type-Options: nosniff",
    "X-Frame-Options: DENY",
  ]) {
    assert.match(headers, new RegExp(requiredPolicy.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("manual production deploys are restricted to main", async () => {
  const workflow = await readFile(path.join(root, ".github/workflows/deploy-pages.yml"), "utf8");
  const mainGuard = "if: github.ref == 'refs/heads/main'";

  assert.equal(workflow.split(mainGuard).length - 1, 3);
  assert.match(workflow, /group: cloudflare-pages-\$\{\{ github\.ref \}\}/);
  assert.match(workflow, /deploy:\n\s+if: github\.ref == 'refs\/heads\/main'\n\s+needs:/);
});

import path from "node:path";

export const PUBLIC_ROUTE_ROOTS = Object.freeze([
  "about",
  "blog",
  "contact",
  "services",
  "testimonials",
  "work",
]);

export const PUBLIC_HTML_FILES = Object.freeze([
  "404.html",
  "about/index.html",
  "blog/archive/index.html",
  "blog/how-i-used-ai-to-find-what-two-service-calls-missed/index.html",
  "blog/index.html",
  "blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/index.html",
  "contact/index.html",
  "index.html",
  "services/photography-and-video/index.html",
  "services/practical-technology/index.html",
  "services/strategy-and-content/index.html",
  "testimonials/index.html",
  "work/apple-core/index.html",
  "work/beta-technologies/index.html",
  "work/bike-fitting/index.html",
  "work/blue-cross-vermont/index.html",
  "work/bridgeport/index.html",
  "work/community-photography/index.html",
  "work/connecticut-college/index.html",
  "work/credit-union-websites/index.html",
  "work/drone-photography/index.html",
  "work/eastrise-launch-campaign/index.html",
  "work/eastrise-photography/index.html",
  "work/eastrise-portraits/index.html",
  "work/eastrise-social/index.html",
  "work/eastrise-website/index.html",
  "work/eastrise-writing/index.html",
  "work/eastrise/index.html",
  "work/fairbanks-planetarium/index.html",
  "work/flight-paths/index.html",
  "work/giron-family-christmas-tree-farm-2024/index.html",
  "work/giron-family-fall-2023/index.html",
  "work/giron-family-fall-2025/index.html",
  "work/green-mountain-community-fitness/index.html",
  "work/index.html",
  "work/live-broadcasts/index.html",
  "work/london-2019/index.html",
  "work/member-banking-stories/index.html",
  "work/meta-mcp-server/index.html",
  "work/neg-ecp-conference-2026/index.html",
  "work/ping-warden/index.html",
  "work/portraits-and-people/index.html",
  "work/skylight-bridge/index.html",
  "work/stowe-ski-instruction/index.html",
  "work/sweat-heart-throwdown/index.html",
  "work/taylor-hoar-racing/index.html",
  "work/vermont-foodbank-volunteer-day-2026/index.html",
  "work/vsecu-website/index.html",
  "work/vtdigger-membership/index.html",
  "work/whale-dance-randolph/index.html",
  "work/wheels-for-warmth/index.html",
  "work/ynab-mcp-server/index.html",
]);

export const PUBLIC_RUNTIME_FILES = Object.freeze([
  "_headers",
  "assets/css/main.css",
  "assets/data/site.config.json",
  "assets/icons/brands/googleanalytics.svg",
  "assets/icons/brands/hootsuite.svg",
  "assets/icons/brands/hubspot.svg",
  "assets/icons/brands/meta.svg",
  "assets/icons/brands/scrumalliance.svg",
  "assets/icons/brands/wordpress.svg",
  "assets/images/brand/oa-social-mark.svg",
  "assets/js/contact-form.js",
  "assets/js/content-protection.js",
  "assets/js/gallery-card-scrub.js",
  "assets/js/header-scroll.js",
  "assets/js/hero-headline.js",
  "assets/js/image-viewer.js",
  "assets/js/inbound-prompt.js",
  "assets/js/proof-rotator.js",
  "assets/js/recommendation-dialog.js",
  "assets/js/site-config.js",
  "assets/js/work-filter.js",
]);

export const GENERATED_PUBLIC_FILES = Object.freeze([
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
]);

export const PUBLIC_IMAGE_PREFIXES = Object.freeze([
  "assets/images/about/",
  "assets/images/testimonials/",
  "assets/images/work/",
  "assets/images/writing/",
]);

export const RETIRED_ROUTE_PREFIXES = Object.freeze([
  "work/beta-andrew/",
  "work/beta-emma/",
  "work/beta-ethan/",
]);

export const RETIRED_ASSET_PREFIXES = Object.freeze([
  "assets/images/provenance/source-screenshots/",
  "assets/images/work/events/beta-andrew/",
  "assets/images/work/events/beta-emma/",
  "assets/images/work/events/beta-ethan/",
  "assets/images/work/eastrise/photography/_unassigned-public-assets/",
]);

export const RETIRED_PUBLIC_PREFIXES = Object.freeze([
  ...RETIRED_ROUTE_PREFIXES,
  ...RETIRED_ASSET_PREFIXES,
]);

export const WITHHELD_ROUTE_PREFIXES = Object.freeze([
  "work/arrayrx-press-conference-2026/",
  "work/be-well-at-work-2026/",
  "work/blue-cross-portraits/",
  "work/corporate-cup-2026/",
  "work/girls-on-the-run-2026/",
  "work/senior-games-press-event-2026/",
  "work/walk-at-lunch-and-green-up-2026/",
]);

export const WITHHELD_ASSET_PREFIXES = Object.freeze([
  "assets/images/work/campaigns/flight-paths.webp",
  "assets/images/work/blue-cross/",
  "assets/images/work/events/arrayrx-press-conference-2026/",
  "assets/images/work/events/be-well-at-work-2026/",
  "assets/images/work/events/corporate-cup-2026/",
  "assets/images/work/events/girls-on-the-run-2026/",
  "assets/images/work/events/senior-games-press-event-2026/",
  "assets/images/work/events/walk-at-lunch-and-green-up-2026/",
  "assets/images/work/portraits/beth-roberts.webp",
  "assets/images/work/portraits/gallery/blue-cross/",
]);

export const WITHHELD_PUBLIC_PREFIXES = Object.freeze([
  ...WITHHELD_ROUTE_PREFIXES,
  ...WITHHELD_ASSET_PREFIXES,
]);

const publicHtmlFiles = new Set(PUBLIC_HTML_FILES);
const publicRuntimeFiles = new Set(PUBLIC_RUNTIME_FILES);
const generatedPublicFiles = new Set(GENERATED_PUBLIC_FILES);

export function normalizePublicPath(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError("Public paths must be nonempty strings.");
  }

  const normalizedSlashes = decodeURIComponent(value.trim())
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");
  const segments = normalizedSlashes.split("/");
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error(`Public paths cannot contain traversal segments: ${value}`);
  }

  return normalizedSlashes;
}

export function resolvePublishedLocalReference(siteRoot, htmlPath, reference) {
  if (/^(?:data:|mailto:|tel:|https?:|#)/i.test(reference)) return null;
  const clean = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  if (!clean) return null;

  const resolved = clean.startsWith("/")
    ? path.resolve(siteRoot, `.${clean}`)
    : path.resolve(path.dirname(htmlPath), clean);
  const relativePath = path.relative(siteRoot, resolved);
  if (
    relativePath === ".."
    || relativePath.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativePath)
  ) {
    throw new Error(`Published reference resolves outside the site artifact: ${reference}`);
  }
  return resolved;
}

function matchesPrefix(value, prefix) {
  const normalizedValue = normalizePublicPath(value).replace(/\/$/, "").toLowerCase();
  const normalizedPrefix = normalizePublicPath(prefix).replace(/\/$/, "").toLowerCase();
  return normalizedValue === normalizedPrefix || normalizedValue.startsWith(`${normalizedPrefix}/`);
}

export function isRetiredPublicPath(value) {
  return RETIRED_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(value, prefix));
}

export function isWithheldPublicPath(value) {
  return WITHHELD_PUBLIC_PREFIXES.some((prefix) => matchesPrefix(value, prefix));
}

export function isUnpublishedPublicPath(value) {
  return isRetiredPublicPath(value) || isWithheldPublicPath(value);
}

export function assertPublicPathIsActive(value) {
  const normalized = normalizePublicPath(value);
  if (isRetiredPublicPath(normalized)) {
    throw new Error(`Retired public path is denied: ${normalized}`);
  }
  if (isWithheldPublicPath(normalized)) {
    throw new Error(`Withheld public path is denied: ${normalized}`);
  }
  return normalized;
}

export function isAllowedPublicHtmlPath(value) {
  const normalized = normalizePublicPath(value);
  return !isUnpublishedPublicPath(normalized) && publicHtmlFiles.has(normalized);
}

export function isAllowedRuntimePath(value) {
  const normalized = normalizePublicPath(value);
  return !isUnpublishedPublicPath(normalized) && publicRuntimeFiles.has(normalized);
}

export function isAllowedPublicImagePath(value) {
  const normalized = normalizePublicPath(value);
  return !isUnpublishedPublicPath(normalized)
    && PUBLIC_IMAGE_PREFIXES.some((prefix) => matchesPrefix(normalized, prefix))
    && path.posix.extname(normalized).toLowerCase() === ".webp";
}

export function extractPublicImageReferences(source) {
  const references = new Set();
  const imageReferencePattern = /(?:https?:\/\/ames\.consulting\/|(?:\.\.\/|\.\/|\/)*)?(assets\/images\/[^"'()<>{}\s?#]+)/g;
  for (const match of String(source).matchAll(imageReferencePattern)) {
    references.add(normalizePublicPath(match[1]));
  }
  return references;
}

export function isAllowedPublishedArtifactPath(value, referencedImagePaths = new Set()) {
  const normalized = normalizePublicPath(value);
  return !isUnpublishedPublicPath(normalized) && (
    publicHtmlFiles.has(normalized)
    || publicRuntimeFiles.has(normalized)
    || generatedPublicFiles.has(normalized)
    || (isAllowedPublicImagePath(normalized) && referencedImagePaths.has(normalized))
  );
}

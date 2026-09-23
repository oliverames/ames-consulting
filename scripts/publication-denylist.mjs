export const RETIRED_ROUTE_PREFIXES = Object.freeze([
  "work/beta-andrew/",
  "work/beta-emma/",
  "work/beta-ethan/",
  // EastRise, VSECU, and Blue Cross Vermont project pages were removed on
  // 2026-09-23 so Oliver can rebuild them. Delete an entry here before
  // republishing a page at the same route.
  "work/arrayrx-press-conference-2026/",
  "work/be-well-at-work-2026/",
  "work/blue-cross-portraits/",
  "work/blue-cross-vermont/",
  "work/community-photography/",
  "work/corporate-cup-2026/",
  "work/credit-union-websites/",
  "work/eastrise-launch-campaign/",
  "work/eastrise-photography/",
  "work/eastrise-portraits/",
  "work/eastrise-social/",
  "work/eastrise-website/",
  "work/eastrise-writing/",
  "work/eastrise/",
  "work/girls-on-the-run-2026/",
  "work/live-broadcasts/",
  "work/member-banking-stories/",
  "work/senior-games-press-event-2026/",
  "work/taylor-hoar-racing/",
  "work/vsecu-website/",
  "work/walk-at-lunch-and-green-up-2026/",
  "work/wheels-for-warmth/",
]);

export const RETIRED_ASSET_PREFIXES = Object.freeze([
  "assets/images/provenance/source-screenshots/",
  "assets/images/work/blue-cross/",
  "assets/images/work/campaigns/eastrise-writing.webp",
  "assets/images/work/campaigns/member-stories.webp",
  "assets/images/work/credit-union-websites/",
  "assets/images/work/eastrise/",
  "assets/images/work/events/arrayrx-press-conference-2026/",
  "assets/images/work/events/be-well-at-work-2026/",
  "assets/images/work/events/beta-andrew/",
  "assets/images/work/events/beta-emma/",
  "assets/images/work/events/beta-ethan/",
  "assets/images/work/events/corporate-cup-2026/",
  "assets/images/work/events/girls-on-the-run-2026/",
  "assets/images/work/events/senior-games-press-event-2026/",
  "assets/images/work/events/walk-at-lunch-and-green-up-2026/",
  "assets/images/work/portraits/",
]);

export const WITHHELD_ROUTE_PREFIXES = Object.freeze([]);

export const WITHHELD_ASSET_PREFIXES = Object.freeze([]);

export const PUBLIC_RUNTIME_EXCEPTIONS = Object.freeze([
  "assets/data/site.config.json",
]);

export const PRIVATE_RUNTIME_PREFIXES = Object.freeze([
  "assets/data/",
]);

export const PRIVATE_RUNTIME_PATHS = Object.freeze([
  "assets/js/construction-gate.js",
]);

// The retired assets/images/work/portraits/ prefix now covers the former
// beth-roberts responsive variants.
export const BLOCKED_PUBLIC_FILE_STEMS = Object.freeze([]);

export const BLOCKED_PUBLIC_PREFIXES = Object.freeze([
  ...RETIRED_ROUTE_PREFIXES,
  ...RETIRED_ASSET_PREFIXES,
  ...WITHHELD_ROUTE_PREFIXES,
  ...WITHHELD_ASSET_PREFIXES,
]);

const functionDirectoryPrefixes = [
  ...RETIRED_ROUTE_PREFIXES,
  ...RETIRED_ASSET_PREFIXES,
  ...WITHHELD_ROUTE_PREFIXES,
  ...WITHHELD_ASSET_PREFIXES.filter((prefix) => prefix.endsWith("/")),
];

export const CLOUDFLARE_FUNCTION_ROUTES = Object.freeze([
  "/api/*",
  "/assets/data/*",
  ...BLOCKED_PUBLIC_FILE_STEMS.map((stem) => `/${stem}*`),
  ...functionDirectoryPrefixes.map((prefix) => `/${prefix}*`),
  ...PRIVATE_RUNTIME_PATHS.map((filePath) => `/${filePath}`),
].sort());

export const CLOUDFLARE_FUNCTION_EXCLUDES = Object.freeze([
  "/assets/data/site.config.json",
]);

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

export const PUBLIC_RUNTIME_EXCEPTIONS = Object.freeze([
  "assets/data/site.config.json",
]);

export const PRIVATE_RUNTIME_PREFIXES = Object.freeze([
  "assets/data/",
]);

export const PRIVATE_RUNTIME_PATHS = Object.freeze([
  "assets/js/construction-gate.js",
]);

export const BLOCKED_PUBLIC_FILE_STEMS = Object.freeze([
  "assets/images/work/portraits/beth-roberts",
]);

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

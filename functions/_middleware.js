import {
  BLOCKED_PUBLIC_FILE_STEMS,
  BLOCKED_PUBLIC_PREFIXES,
  PRIVATE_RUNTIME_PREFIXES,
  PRIVATE_RUNTIME_PATHS,
  PUBLIC_RUNTIME_EXCEPTIONS,
} from "../scripts/publication-denylist.mjs";
import { SECURITY_HEADERS } from "../scripts/security-headers.mjs";

const normalizePolicyPath = (value) => value.replace(/^\/+|\/+$/g, "").toLowerCase();
const normalizedBlockedPrefixes = BLOCKED_PUBLIC_PREFIXES.map((prefix) => ({
  directory: prefix.endsWith("/"),
  value: normalizePolicyPath(prefix),
}));
const normalizedBlockedFileStems = BLOCKED_PUBLIC_FILE_STEMS.map(normalizePolicyPath);
const normalizedPrivatePrefixes = PRIVATE_RUNTIME_PREFIXES.map(normalizePolicyPath);
const normalizedPrivatePaths = new Set(PRIVATE_RUNTIME_PATHS.map((filePath) => (
  normalizePolicyPath(filePath)
)));
const normalizedRuntimeExceptions = new Set(PUBLIC_RUNTIME_EXCEPTIONS.map(normalizePolicyPath));

function matchesResponsiveFileStem(pathname, stem) {
  if (pathname === `${stem}.webp`) return true;
  const suffix = pathname.slice(stem.length);
  return pathname.startsWith(`${stem}-`) && /^-\d+w\.webp$/.test(suffix);
}

export function isBlockedPublicPath(pathname) {
  let normalized;
  try {
    normalized = decodeURIComponent(pathname)
      .replaceAll("\\", "/")
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();
  } catch {
    return true;
  }

  if (normalizedRuntimeExceptions.has(normalized)) return false;
  if (normalizedPrivatePaths.has(normalized)) return true;
  if (normalizedPrivatePrefixes.some((prefix) => (
    normalized === prefix || normalized.startsWith(`${prefix}/`)
  ))) return true;
  if (normalizedBlockedFileStems.some((stem) => matchesResponsiveFileStem(normalized, stem))) {
    return true;
  }
  return normalizedBlockedPrefixes.some(({ directory, value }) => (
    normalized === value || (directory && normalized.startsWith(`${value}/`))
  ));
}

export function onRequest({ request, next }) {
  if (!isBlockedPublicPath(new URL(request.url).pathname)) return next();

  return new Response("Not found", {
    status: 404,
    headers: {
      ...SECURITY_HEADERS,
      "cache-control": "no-store",
      "content-type": "text/plain; charset=utf-8",
      "x-ames-tombstone": "1",
      "x-robots-tag": "noindex",
    },
  });
}

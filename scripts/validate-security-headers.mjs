import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { SECURITY_HEADERS } from "./security-headers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const headersPath = join(root, "_headers");

function parseHeadersFile(content) {
  const parsed = new Map();
  let currentPattern = null;
  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    if (!/^\s/.test(rawLine)) {
      currentPattern = rawLine.trim();
      continue;
    }
    const line = rawLine.trim();
    const separator = line.indexOf(":");
    if (currentPattern !== "/*" || separator === -1) continue;
    parsed.set(
      line.slice(0, separator).trim().toLowerCase(),
      line.slice(separator + 1).trim(),
    );
  }
  return parsed;
}

const actual = parseHeadersFile(await readFile(headersPath, "utf8"));
const failures = [];

for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
  if (!actual.has(name)) {
    failures.push(`_headers is missing "${name}" under the /* pattern.`);
  } else if (actual.get(name) !== expected) {
    failures.push(
      `_headers value for "${name}" drifted.\n  expected: ${expected}\n  actual:   ${actual.get(name)}`,
    );
  }
}

for (const name of actual.keys()) {
  if (!(name in SECURITY_HEADERS)) {
    failures.push(
      `_headers sets "${name}", which scripts/security-headers.mjs does not define. Add it to the shared map so the middleware serves it too.`,
    );
  }
}

if (failures.length > 0) {
  console.error("Security header policy drift between _headers and scripts/security-headers.mjs:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Security headers in sync: ${Object.keys(SECURITY_HEADERS).length} headers match between _headers and scripts/security-headers.mjs.`);

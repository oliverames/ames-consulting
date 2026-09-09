import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

// Version only local JS/CSS references. Preserve page-relative paths and any
// existing query/fragment while replacing our version instead of appending it.
export async function versionAssetReferences(html, pagePath, root) {
  const origin = "https://build.invalid";
  const pageUrl = new URL(pagePath, `${origin}/`);
  const replacements = new Map();
  const pattern = /<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/gi;
  for (const [tag, reference] of html.matchAll(pattern)) {
    // Module URLs must match their relative imports to preserve one instance.
    if (/\btype="module"/i.test(tag)) continue;
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference)) continue;
    const decoded = reference.replaceAll("&amp;", "&");
    const url = new URL(decoded, pageUrl);
    if (!/^\/assets\/(?:js|css)\/.+\.(?:js|css)$/.test(url.pathname)) continue;
    const assetPath = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!assetPath.startsWith(`${resolve(root)}${sep}`)) throw new Error(`Asset outside site: ${reference}`);
    const hash = createHash("sha256").update(await readFile(assetPath)).digest("hex").slice(0, 16);
    url.searchParams.set("v", hash);
    const pathname = decoded.split(/[?#]/)[0];
    replacements.set(reference, `${pathname}${url.search}${url.hash}`.replaceAll("&", "&amp;"));
  }
  return html.replace(pattern, (tag, reference) => replacements.has(reference)
    ? tag.replace(`"${reference}"`, `"${replacements.get(reference)}"`)
    : tag);
}

#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { siScrumalliance, siHootsuite, siHubspot, siMeta, siGoogleanalytics, siWordpress } from "simple-icons";

const output = new URL("../assets/icons/brands/", import.meta.url);
await mkdir(output, { recursive: true });
const icons = [siScrumalliance, siHootsuite, siHubspot, siMeta, siGoogleanalytics, siWordpress];
for (const brand of icons) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${brand.title}" viewBox="0 0 24 24"><title>${brand.title}</title><path fill="currentColor" d="${brand.path}"/></svg>`;
  await writeFile(new URL(`${brand.slug}.svg`, output), svg);
}


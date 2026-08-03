#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const portfolioRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/Blue Cross VT";
const outputRoot = path.join(root, "assets/images/work/blue-cross");

const assets = [
  ["senior-games.webp", "2026-03-18 – Senior Games Press Event/Edited Selects/DSC01867.jpg"],
  ["arrayrx.webp", "2026-03-26 – ArrayRx Press Conference/Edited Selects/DSC02517.jpg"],
  ["walk-at-lunch.webp", "2026-04-29 – Walk@Lunch and GreenUp/Edited Selects/DSC02728.jpg"],
  ["be-well-at-work.webp", "2026-05-06 – Be Well at Work/Edited Selects/DSC03152.jpg"],
  ["corporate-cup.webp", "2026-05-14 – Corporate Cup/Edited Selects/DSC03225.jpg"],
  ["gotr.webp", "2026-05-30 – GOTR/Edited Selects/DSC05523.jpg"],
  ["headshot.webp", "2026-04-08 – CBSS Headshots/Edited Selects/DSC02660.jpg"],
];

const portfolioAvailable = await access(portfolioRoot).then(() => true, () => false);

if (portfolioAvailable) {
  await mkdir(outputRoot, { recursive: true });
  for (const [filename, relativeSource] of assets) {
    const source = path.join(portfolioRoot, relativeSource);
    const destination = path.join(outputRoot, filename);
    await exec("/opt/homebrew/bin/magick", [
      source,
      "-auto-orient",
      "-resize",
      "2400x2400>",
      "-strip",
      "-quality",
      "88",
      destination,
    ]);
  }

  for (const filename of ["senior-games", "arrayrx", "walk-at-lunch", "be-well-at-work"]) {
    await exec("/opt/homebrew/bin/magick", [
      path.join(outputRoot, `${filename}.webp`),
      "-resize",
      "960x640^",
      "-gravity",
      "center",
      "-extent",
      "960x640",
      "-strip",
      "-quality",
      "84",
      path.join(outputRoot, `${filename}-card.webp`),
    ]);
  }
  console.log(`Generated ${assets.length} Blue Cross portfolio images from full-resolution edited JPGs.`);
} else {
  for (const [filename] of assets) await access(path.join(outputRoot, filename));
  console.log("Blue Cross portfolio source is not mounted; using checked-in high-resolution derivatives.");
}

await import("./generate-blue-cross-project-pages.mjs");

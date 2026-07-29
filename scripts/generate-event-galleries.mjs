#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const blueCrossRoot = "/Users/oliverames/Documents/BCBS/Photography";
const eastRiseData = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-photography.json"), "utf8"));

const definitions = [
  {
    slug: "corporate-cup-2026",
    title: "Corporate Cup 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 14, 2026",
    intro: "A workday in Montpelier turned into a citywide race. I photographed the Blue Cross Vermont team, the start, the course, and the moments around the finish.",
    source: `${blueCrossRoot}/2026-05-14 – Corporate Cup/Edited Selects`,
    organization: "Blue Cross Vermont",
  },
  {
    slug: "girls-on-the-run-2026",
    title: "Girls on the Run 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 30, 2026",
    intro: "The finish line mattered, but the story was everywhere: teams arriving together, handmade signs, nervous starts, muddy shoes, and people making room for every runner.",
    source: `${blueCrossRoot}/2026-05-30 – GOTR/Edited Selects`,
    organization: "Blue Cross Vermont",
  },
];

async function processImages(definition) {
  const files = (await readdir(definition.source)).filter((file) => /\.jpe?g$/i.test(file)).sort();
  const images = [];
  for (const [index, file] of files.entries()) {
    const source = path.join(definition.source, file);
    const destination = path.join(root, "assets/images/work/events", definition.slug, `${path.basename(file, path.extname(file)).toLowerCase()}.webp`);
    await mkdir(path.dirname(destination), { recursive: true });
    await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", "1600x1600>", "-strip", "-quality", "82", destination]);
    const [width, height] = (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim().split(" ").map(Number);
    images.push({ src: `../../assets/images/work/events/${definition.slug}/${path.basename(destination)}`, alt: `${definition.title}, photograph ${index + 1} of ${files.length}`, width, height });
  }
  return images;
}

const campaigns = [];
for (const definition of definitions) campaigns.push({ ...definition, images: await processImages(definition) });

const launchSeries = eastRiseData.series.find((series) => series.title === "Member and Business Stories");
const launchImages = launchSeries.images.filter((image) => /2024-10-(16|23)_/.test(image.src));
campaigns.push({
  slug: "eastrise-launch-campaign",
  title: "EastRise Launch Campaign",
  eyebrow: "Brand launch photography · EastRise · 2024",
  intro: "The new name needed to feel rooted in real people and real places immediately. This launch series paired the first brand commercial with still photography built for the website, social channels, and ongoing campaign work.",
  organization: "EastRise Credit Union",
  images: launchImages,
});

const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../corporate-cup-2026/">Corporate Cup 2026</a></li><li><a href="../girls-on-the-run-2026/">Girls on the Run 2026</a></li><li><a href="../eastrise-launch-campaign/">EastRise Launch Campaign</a></li><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing 2025</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Photography, communication, and practical technology from Montpelier, Vermont.</p></div></div></footer>`;
for (const campaign of campaigns) {
  const gallery = campaign.images.map((image) => `<img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">`).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${campaign.title} | Ames Consulting</title><meta name="description" content="${campaign.intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${campaign.slug}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="page">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1"><header class="case-hero case-hero--portrait"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></header><section class="case-section case-section--gallery"><h2>Complete gallery</h2><div class="campaign-collage" data-gallery="${campaign.slug}">${gallery}</div></section></main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;
  const output = path.join(root, "work", campaign.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html);
}
await writeFile(path.join(root, "assets/data/event-galleries.json"), `${JSON.stringify({ generatedAt: "2026-07-29", campaigns: campaigns.map(({ source: _source, ...campaign }) => campaign) }, null, 2)}\n`);
console.log(campaigns.map((campaign) => `${campaign.title}: ${campaign.images.length}`).join("\n"));

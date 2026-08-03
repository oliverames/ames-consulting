#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const blueCrossRoot = "/Users/oliverames/Documents/Ames Consulting/Portfolio/Blue Cross VT";
const gironRoot = "/Users/oliverames/Documents/Ames Consulting/Clients/Giron Family/Kevin and Kayla Fall 2025/Deliverables";
const eastRiseData = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-photography.json"), "utf8"));
const existingEventData = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const blueCrossSourcesAvailable = !process.env.CI && await access(blueCrossRoot).then(() => true, () => false);
const gironSourcesAvailable = !process.env.CI && await access(gironRoot).then(() => true, () => false);
const existingDimensions = new Map(existingEventData.campaigns.flatMap((campaign) => campaign.images.filter((image) => image?.src).map((image) => [
  `${campaign.slug}/${path.basename(image.src)}`,
  [image.width, image.height],
])));

function blueCrossSource(slug, source) {
  return blueCrossSourcesAvailable
    ? { source: path.join(blueCrossRoot, source) }
    : { source: path.join(root, "assets/images/work/events", slug), prepared: true };
}

const definitions = [
  {
    slug: "corporate-cup-2026",
    title: "Corporate Cup 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 14, 2026",
    intro: "A workday in Montpelier turned into a citywide race. I photographed the Blue Cross Vermont team, the start, the course, and the moments around the finish.",
    ...blueCrossSource("corporate-cup-2026", "2026-05-14 – Corporate Cup/Edited Selects"),
    organization: "Blue Cross Vermont",
    featuredFile: "dsc03213.webp",
  },
  {
    slug: "girls-on-the-run-2026",
    title: "Girls on the Run 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 30, 2026",
    intro: "The finish line mattered, but the story was everywhere: teams arriving together, handmade signs, nervous starts, muddy shoes, and people making room for every runner.",
    ...blueCrossSource("girls-on-the-run-2026", "2026-05-30 – GOTR/Edited Selects"),
    organization: "Blue Cross Vermont",
    featuredFile: "dsc03810.webp",
  },
  {
    slug: "giron-family-fall-2025",
    title: "Giron Family, Fall 2025",
    eyebrow: "Family photography · Vermont · Fall 2025",
    intro: "A family session that moved from open fields into the fall woods, leaving room for the posed photographs and the much better moments that happened between them.",
    source: gironSourcesAvailable ? gironRoot : path.join(root, "assets/images/work/events/giron-family-fall-2025"),
    prepared: !gironSourcesAvailable,
    organization: "Giron family",
  },
  {
    slug: "vermont-foodbank-volunteer-day-2026",
    title: "Vermont Foodbank Volunteer Day",
    eyebrow: "Documentary photography · Vermont Foodbank · January 21, 2026",
    intro: "Volunteers packed food for distribution inside the Vermont Foodbank warehouse. I photographed the work itself, the people moving through it, and the small details that made the day feel specific.",
    source: path.join(root, "assets/images/work/events/vermont-foodbank-volunteer-day-2026"),
    prepared: true,
    organization: "Vermont Foodbank",
    featuredFile: "dsc08397.webp",
    openingSequence: ["DSC08460.jpg", "DSC08342.jpg", "DSC08358.jpg", "DSC08434.jpg", "DSC08364.jpg"],
  },
  {
    slug: "beta-andrew",
    title: "Andrew at BETA",
    eyebrow: "Workplace photography · BETA Technologies · January 16, 2026",
    intro: "Andrew at work inside BETA Technologies, photographed with the aircraft, tools, and manufacturing environment that give his role its context.",
    source: path.join(root, "assets/images/work/events/beta-andrew"),
    prepared: true,
    organization: "BETA Technologies",
    featuredFile: "dsc08088.webp",
    // Held pending written permission. Preserve the gallery data and assets, but do not render them publicly.
    heldPendingWrittenPermission: true,
  },
  {
    slug: "beta-emma",
    title: "Emma at BETA",
    eyebrow: "Workplace photography · BETA Technologies · January 16, 2026",
    intro: "A workplace portrait series following Emma inside BETA Technologies, moving between portraiture, hands-on detail, and the larger manufacturing floor.",
    source: path.join(root, "assets/images/work/events/beta-emma"),
    prepared: true,
    organization: "BETA Technologies",
    featuredFile: "dsc07933.webp",
    // Held pending written permission. Preserve the gallery data and assets, but do not render them publicly.
    heldPendingWrittenPermission: true,
  },
  {
    slug: "beta-ethan",
    title: "Ethan at BETA",
    eyebrow: "Workplace photography · BETA Technologies · January 16, 2026",
    intro: "Ethan at work inside BETA Technologies, photographed as a person within a much larger system of tools, components, and aircraft manufacturing.",
    source: path.join(root, "assets/images/work/events/beta-ethan"),
    prepared: true,
    organization: "BETA Technologies",
    featuredFile: "dsc08199.webp",
    // Held pending written permission. Preserve the gallery data and assets, but do not render them publicly.
    heldPendingWrittenPermission: true,
  },
];

async function processImages(definition) {
  const sourcePattern = definition.prepared ? /\.webp$/i : /\.jpe?g$/i;
  let files = (await readdir(definition.source)).filter((file) => sourcePattern.test(file)).sort();
  if (definition.slug === "giron-family-fall-2025") {
    const sourceOpeningSequence = ["DSC06144.jpg", "DSC06117.jpg", "DSC06125.jpg", "DSC06145.jpg", "DSC06162.jpg"];
    const openingSequence = definition.prepared
      ? sourceOpeningSequence.map((file) => `${path.basename(file, path.extname(file)).toLowerCase()}.webp`)
      : sourceOpeningSequence;
    files = [...openingSequence, ...files.filter((file) => !openingSequence.includes(file))];
  }
  if (definition.openingSequence) {
    const openingSequence = definition.prepared
      ? definition.openingSequence.map((file) => `${path.basename(file, path.extname(file)).toLowerCase()}.webp`)
      : definition.openingSequence;
    files = [...openingSequence, ...files.filter((file) => !openingSequence.includes(file))];
  }
  const images = [];
  for (const [index, file] of files.entries()) {
    const source = path.join(definition.source, file);
    const destination = definition.prepared
      ? source
      : path.join(root, "assets/images/work/events", definition.slug, `${path.basename(file, path.extname(file)).toLowerCase()}.webp`);
    if (!definition.prepared) {
      await mkdir(path.dirname(destination), { recursive: true });
      const maximumSize = definition.organization === "Blue Cross Vermont" ? "2400x2400>" : "1600x1600>";
      const quality = definition.organization === "Blue Cross Vermont" ? "86" : "82";
      await exec("/opt/homebrew/bin/magick", [source, "-auto-orient", "-resize", maximumSize, "-strip", "-quality", quality, destination]);
    }
    const [width, height] = definition.prepared
      ? existingDimensions.get(`${definition.slug}/${path.basename(destination)}`) || []
      : (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim().split(" ").map(Number);
    if (!width || !height) throw new Error(`Missing checked-in dimensions for ${destination}`);
    const alt = definition.slug === "giron-family-fall-2025"
      ? `Giron family fall portrait session, photograph ${index + 1} of ${files.length}`
      : `${definition.title}, photograph ${index + 1} of ${files.length}`;
    images.push({ src: `../../assets/images/work/events/${definition.slug}/${path.basename(destination)}`, alt, width, height });
  }
  return images;
}

const campaigns = [];
for (const definition of definitions) campaigns.push({ ...definition, images: await processImages(definition) });

const launchSeries = eastRiseData.series.find((series) => series.slug === "eastrise-launch");
const launchImages = launchSeries.images;
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
  const gallery = campaign.heldPendingWrittenPermission
    ? "<!-- Held pending written permission. Gallery images intentionally do not render. -->"
    : campaign.images.map((image) => `<img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async">`).join("");
  const familyStory = campaign.slug === "giron-family-fall-2025"
    ? `<section class="case-section"><h2>A walk, not a pose list</h2><div class="case-section__body"><p>We started with the photographs every family needs, then kept moving. The children had room to run, the parents could settle into the session, and the landscape changed from open sky to leaf-covered paths.</p><p>The result is a useful family record with enough movement, quiet, and personality to feel like this particular afternoon.</p></div></section><section class="case-section"><h2>View the session</h2><div class="case-section__body">Select any photograph to open it full size. Use the buttons or the left and right arrow keys to move through all ${campaign.images.length} images.</div></section>`
    : campaign.slug === "vermont-foodbank-volunteer-day-2026"
      ? `<section class="case-section"><h2>Work with a rhythm of its own</h2><div class="case-section__body"><p>The warehouse already had a visual system: pallets, rollers, open boxes, stacked cans, and people finding a pace together. I moved between the full process and the moments that showed concentration, cooperation, and the occasional laugh.</p><p>The final set gives the Vermont Foodbank a complete record of the volunteer day, with individual photographs that can also work across future stories, volunteer recruitment, and social posts.</p></div></section>`
      : "";
  const featuredImage = campaign.featuredFile && !campaign.heldPendingWrittenPermission
    ? campaign.images.find((image) => path.basename(image.src) === campaign.featuredFile)
    : null;
  const hero = campaign.heldPendingWrittenPermission
    ? `<header class="case-hero case-hero--portrait"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p></header>`
    : campaign.slug === "giron-family-fall-2025"
    ? `<header class="case-hero case-hero--family"><div class="case-hero--family__copy"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></div><img src="../../assets/images/work/events/giron-family-fall-2025/dsc06125.webp" alt="The Giron family together during their fall portrait session" width="1067" height="1600" loading="eager" fetchpriority="high" decoding="async"></header>`
    : featuredImage
        ? `<header class="case-hero case-hero--family"><div class="case-hero--family__copy"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></div><img src="${featuredImage.src}" alt="${featuredImage.alt}" width="${featuredImage.width}" height="${featuredImage.height}" loading="eager" fetchpriority="high" decoding="async"></header>`
        : `<header class="case-hero case-hero--portrait"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></header>`;
  const gallerySection = campaign.heldPendingWrittenPermission
    ? gallery
    : `<section class="case-section case-section--gallery"><h2>Complete gallery</h2><div class="campaign-collage" data-gallery="${campaign.slug}">${gallery}</div></section>`;
  const robotsMeta = campaign.heldPendingWrittenPermission
    ? '<meta name="robots" content="noindex">'
    : "";
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';">${robotsMeta}<title>${campaign.title} | Ames Consulting</title><meta name="description" content="${campaign.intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${campaign.slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${hero}${familyStory}${gallerySection}</main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;
  const output = path.join(root, "work", campaign.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html);
}
await writeFile(path.join(root, "assets/data/event-galleries.json"), `${JSON.stringify({ generatedAt: "2026-07-29", campaigns: campaigns.map(({ source: _source, prepared: _prepared, ...campaign }) => campaign) }, null, 2)}\n`);
console.log(campaigns.map((campaign) => `${campaign.title}: ${campaign.images.length}`).join("\n"));

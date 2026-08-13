#!/usr/bin/env node

import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { isWithheldPublicPath } from "./publication-policy.mjs";

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, "..");
const escapeAttribute = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const documentsRoot = process.env.AMES_CONSULTING_DOCUMENTS_ROOT
  || path.join(homedir(), "Documents", "Ames Consulting");
const blueCrossRoot = process.env.AMES_BLUE_CROSS_PORTFOLIO_ROOT
  || path.join(documentsRoot, "Portfolio", "Blue Cross VT");
const gironRoot = process.env.AMES_GIRON_CLIENT_ROOT
  || path.join(documentsRoot, "Clients", "Giron Family");
const negEcpRoot = process.env.AMES_NEG_ECP_CLIENT_ROOT
  || path.join(documentsRoot, "Clients", "GBIC", "NEG-ECP Conference", "Favorites");
const gironRoots = {
  "giron-family-fall-2025": path.join(gironRoot, "2025-09-28 Fall Family Session", "Deliverables"),
  "giron-family-christmas-tree-farm-2024": path.join(gironRoot, "2024-12-01 Christmas Tree Farm Family Session"),
  "giron-family-fall-2023": path.join(gironRoot, "2023-10-08 Fall Family Session"),
};
const eastRiseData = JSON.parse(await readFile(path.join(root, "assets/data/eastrise-photography.json"), "utf8"));
const existingEventData = JSON.parse(await readFile(path.join(root, "assets/data/event-galleries.json"), "utf8"));
const eventAltTextRoot = path.join(root, "assets/data/event-gallery-alt-text");
const blueCrossSourcesAvailable = !process.env.CI && await access(blueCrossRoot).then(() => true, () => false);
const negEcpSourceAvailable = !process.env.CI && await access(negEcpRoot).then(() => true, () => false);
const gironSourcesAvailable = new Map(await Promise.all(Object.entries(gironRoots).map(async ([slug, source]) => [
  slug,
  !process.env.CI && await access(source).then(() => true, () => false),
])));
const existingDimensions = new Map(existingEventData.campaigns.flatMap((campaign) => campaign.images.filter((image) => image?.src).map((image) => [
  `${campaign.slug}/${path.basename(image.src)}`,
  [image.width, image.height],
])));

function blueCrossSource(slug, source) {
  return blueCrossSourcesAvailable
    ? { source: path.join(blueCrossRoot, source) }
    : { source: path.join(root, "assets/images/work/events", slug), prepared: true };
}

function gironSource(slug) {
  return gironSourcesAvailable.get(slug)
    ? { source: gironRoots[slug] }
    : { source: path.join(root, "assets/images/work/events", slug), prepared: true };
}

function negEcpSource() {
  return negEcpSourceAvailable
    ? { source: negEcpRoot }
    : { source: path.join(root, "assets/images/work/events/neg-ecp-conference-2026"), prepared: true };
}

const definitions = [
  {
    slug: "neg-ecp-conference-2026",
    title: "47th NEG-ECP Conference",
    eyebrow: "Commissioned event photography · Shelburne Farms · August 10, 2026",
    intro: "I photographed the 47th New England Governors and Eastern Canadian Premiers conference at Shelburne Farms, from the empty Coach Barn and arrivals through the working sessions and press conference.",
    ...negEcpSource(),
    organization: "Cynosure, Inc. and GBIC",
    orderMode: "chronological",
    featuredFile: "dsc01378.webp",
    featuredAlt: "A summit delegate gestures while speaking beneath United States and Canadian flags inside the Coach Barn.",
    story: {
      title: "From setup through the press conference",
      paragraphs: [
        "The empty Coach Barn established the setting. Once the conference began, I moved between wide views, individual speakers, reactions, and smaller exchanges around the table.",
        "Cynosure, Inc. commissioned the photography through its sister organization, Greater Burlington Industrial Corporation.",
      ],
    },
  },
  {
    slug: "senior-games-press-event-2026",
    title: "Senior Games Press Event",
    eyebrow: "Documentary photography · Blue Cross Vermont · March 18, 2026",
    intro: "I photographed the speakers, attendees, and press event for the Senior Games announcement.",
    ...blueCrossSource("senior-games-press-event-2026", "2026-03-18 – Senior Games Press Event/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc01867.webp",
    featuredAlt: "A man in a suit smiles while speaking with attendees inside the Vermont State House.",
  },
  {
    slug: "arrayrx-press-conference-2026",
    title: "ArrayRx Press Conference",
    eyebrow: "Documentary photography · Blue Cross Vermont · March 26, 2026",
    intro: "I photographed the ArrayRx announcement at the Vermont State House, covering the speakers, press activity, and conversations around the event.",
    ...blueCrossSource("arrayrx-press-conference-2026", "2026-03-26 – ArrayRx Press Conference/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc02517.webp",
    featuredAlt: "A woman speaks to reporters at the ArrayRx press conference inside the Vermont State House.",
  },
  {
    slug: "walk-at-lunch-and-green-up-2026",
    title: "Walk@Lunch and Green Up",
    eyebrow: "Documentary photography · Blue Cross Vermont · April 29, 2026",
    intro: "I photographed employees taking part in a workplace walk and Green Up activity in Montpelier.",
    ...blueCrossSource("walk-at-lunch-and-green-up-2026", "2026-04-29 – Walk@Lunch and GreenUp/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc02728.webp",
    featuredAlt: "Blue Cross Vermont employees collect gloves and safety vests before a Green Up walk in Montpelier.",
  },
  {
    slug: "be-well-at-work-2026",
    title: "Be Well at Work",
    eyebrow: "Documentary photography · Blue Cross Vermont · May 6, 2026",
    intro: "I photographed the people, activities, and practical details of a workplace wellness program.",
    ...blueCrossSource("be-well-at-work-2026", "2026-05-06 – Be Well at Work/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc03152.webp",
    featuredAlt: "Employees listen during a Be Well at Work workshop around tables covered with notes and water bottles.",
  },
  {
    slug: "corporate-cup-2026",
    title: "Corporate Cup 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 14, 2026",
    intro: "I photographed the Blue Cross Vermont team at the start, on the course, and around the finish of the 2026 Corporate Cup in Montpelier.",
    ...blueCrossSource("corporate-cup-2026", "2026-05-14 – Corporate Cup/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc03213.webp",
    featuredAlt: "The Blue Cross Vermont Corporate Cup team waves from the Vermont State House steps in the rain.",
  },
  {
    slug: "girls-on-the-run-2026",
    title: "Girls on the Run 2026",
    eyebrow: "Event photography · Blue Cross Vermont · May 30, 2026",
    intro: "I photographed teams arriving together, handmade signs, the start, muddy shoes, and the finish line at Girls on the Run 2026.",
    ...blueCrossSource("girls-on-the-run-2026", "2026-05-30 – GOTR/Edited Selects"),
    published: false,
    orderMode: "source",
    organization: "Blue Cross Vermont",
    featuredFile: "dsc03810.webp",
    featuredAlt: "Girls on the Run participants surge across the starting line together.",
  },
  {
    slug: "giron-family-fall-2025",
    title: "Giron Family, Fall 2025",
    eyebrow: "Family photography · Vermont · Fall 2025",
    intro: "This family session moved from open fields into the fall woods and included both posed portraits and candid photographs.",
    ...gironSource("giron-family-fall-2025"),
    organization: "Giron family",
    orderMode: "editorial",
    orderNote: "The opening family portraits lead the sequence, followed by the remaining photographs in source order.",
    featuredFile: "dsc06125.webp",
    featuredAlt: "The Giron family stands in a sunny field with Vermont's fall hills behind them.",
    story: {
      title: "Open fields and fall woods",
      paragraphs: [
        "We made the family portraits in the open field first, while the light still reached the hills behind them.",
        "Then we walked into the woods. I followed the children between the trees and made portraits when the family came together.",
      ],
    },
  },
  {
    slug: "giron-family-christmas-tree-farm-2024",
    title: "Giron Family at the Christmas Tree Farm",
    eyebrow: "Family photography · Vermont · December 1, 2024",
    intro: "A snowy family session at a Christmas tree farm. We made portraits between the rows while the children explored and the family chose a tree.",
    ...gironSource("giron-family-christmas-tree-farm-2024"),
    organization: "Giron family",
    orderMode: "chronological",
    featuredFile: "dsc06782.webp",
    featuredAlt: "The Giron family holds their children beside a snow-covered Christmas tree.",
    story: {
      title: "Snow and Christmas trees",
      paragraphs: [
        "Fresh snow gave the session its setting, but it also kept everyone moving. We worked between the tree rows and stopped for portraits when the children were ready.",
        "The photographs include the snow, winter coats, tree rows, and the tree the family chose.",
      ],
    },
  },
  {
    slug: "giron-family-fall-2023",
    title: "Giron Family, Fall 2023",
    eyebrow: "Family photography · Vermont · October 8, 2023",
    intro: "An autumn family session across the farm, moving between portraits, play, pumpkins, and the landscape around them.",
    ...gironSource("giron-family-fall-2023"),
    organization: "Giron family",
    orderMode: "chronological",
    featuredFile: "dsc03800.webp",
    featuredAlt: "The Giron family sits together on a wooden farm chair in late-afternoon autumn light.",
    story: {
      title: "Around the farm",
      paragraphs: [
        "We moved between the pumpkin field and open grass, then used the farm's oversized wooden chair for the family portrait.",
        "The children played between portraits, and I photographed them as we moved around the farm.",
      ],
    },
  },
  {
    slug: "vermont-foodbank-volunteer-day-2026",
    title: "Vermont Foodbank Volunteer Day",
    eyebrow: "Documentary photography · Vermont Foodbank · January 21, 2026",
    intro: "Volunteers packed food for distribution inside the Vermont Foodbank warehouse. I photographed each step of the packing line and the people doing the work.",
    source: path.join(root, "assets/images/work/events/vermont-foodbank-volunteer-day-2026"),
    prepared: true,
    organization: "Vermont Foodbank",
    orderMode: "chronological",
    featuredFile: "dsc08397.webp",
    featuredAlt: "A Vermont Foodbank volunteer lifts an empty box above a warehouse packing line.",
    story: {
      title: "The packing line",
      paragraphs: [
        "Volunteers opened boxes, sorted food, and moved packed cases toward the pallets waiting at the end of the line.",
        "I worked beside the line so the photographs show both the full warehouse and the work at each station.",
      ],
    },
  },
  {
    slug: "london-2019",
    title: "London at Dusk",
    eyebrow: "Travel photography · London · September 6, 2019",
    intro: "Eight photographs along the River Thames as late sunlight, storm clouds, and blue hour changed the city around Tower Bridge.",
    source: path.join(root, "assets/images/work/events/london-2019"),
    prepared: true,
    organization: "Personal work",
    orderMode: "editorial",
    orderNote: "The hero frame opens the sequence, followed by the remaining photographs in capture order.",
    featuredFile: "dsc02427.webp",
    featuredAlt: "Tower Bridge spanning the River Thames as late sunlight breaks through dark clouds.",
    openingSequence: ["DSC02427.jpeg"],
    story: {
      title: "Late sun, storm clouds, and blue hour",
      paragraphs: [
        "The weather moved from broken sunlight to a dark blue evening, changing the river and skyline from one frame to the next.",
        "Tower Bridge and the Shard became fixed points as the light shifted around them.",
      ],
    },
  },
  {
    slug: "whale-dance-randolph",
    title: "Whale Dance in Randolph",
    eyebrow: "Landscape photography · Randolph, Vermont · September 24, 2021",
    intro: "Eight photographs of Jim Sardonis’s bronze Whale Dance sculpture against fog, autumn trees, and the layered hills around Randolph.",
    source: path.join(root, "assets/images/work/events/whale-dance-randolph"),
    prepared: true,
    organization: "Personal work",
    orderMode: "editorial",
    orderNote: "The hero frame opens the sequence, followed by the remaining photographs in capture order.",
    featuredFile: "dsc06299.webp",
    featuredAlt: "Jim Sardonis's Whale Dance sculpture above a stone wall with mist drifting through distant hills.",
    openingSequence: ["DSC06299.jpeg"],
    story: {
      title: "The sculpture and the hillside",
      paragraphs: [
        "The bronze forms shift as the view moves around them, sometimes reading as whale tails and sometimes as an opening onto the hills.",
        "Sculptor Jim Sardonis identifies Whale Dance as the bronze work installed in Randolph in July 2019. <a href=\"https://www.sardonis.com/whale-dance/\" rel=\"noopener\">Read the artist’s description.</a>",
      ],
    },
  },
  {
    slug: "drone-photography",
    title: "Drone Photography",
    eyebrow: "Aerial photography · 2018–2020",
    intro: "Sixty-two aerial photographs made above winter fields, cities, coastlines, mountains, civic places, and rail yards.",
    source: path.join(root, "assets/images/work/events/drone-photography"),
    prepared: true,
    organization: "Personal work",
    orderMode: "editorial",
    orderNote: "The hero frame opens the collection, followed by the original camera-file sequence across several years and locations.",
    featuredFile: "dji_0053.webp",
    featuredAlt: "Top-down aerial view of a vehicle turning through deep snow, its tracks curving beside a fence.",
    openingSequence: ["DJI_0053.jpeg"],
    story: {
      title: "Patterns from above",
      paragraphs: [
        "From above, the photographs show roads through valleys, tracks across snow, and buildings arranged around water.",
        "The collection spans several years and places and returns to lines, shapes, and changes in scale.",
      ],
    },
  },
];

async function processImages(definition) {
  const altDataPath = path.join(eventAltTextRoot, `${definition.slug}.json`);
  const altData = JSON.parse(await readFile(altDataPath, "utf8"));
  if (altData.slug !== definition.slug || !Array.isArray(altData.images)) {
    throw new Error(`Invalid event alt-text data: ${altDataPath}`);
  }
  const metadataByFile = new Map(altData.images.map((image) => [image.file, image]));
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
  for (const file of files) {
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
    let [width, height] = definition.prepared
      ? existingDimensions.get(`${definition.slug}/${path.basename(destination)}`) || []
      : (await exec("/opt/homebrew/bin/magick", ["identify", "-format", "%w %h", destination])).stdout.trim().split(" ").map(Number);
    if ((!width || !height) && definition.prepared) {
      ({ width, height } = await sharp(destination).metadata());
    }
    if (!width || !height) throw new Error(`Missing checked-in dimensions for ${destination}`);
    const outputFile = path.basename(destination);
    const metadata = metadataByFile.get(outputFile);
    const alt = String(metadata?.alt || "").trim();
    if (!alt) throw new Error(`Missing event alt text for ${definition.slug}/${outputFile}`);
    images.push({
      src: `../../assets/images/work/events/${definition.slug}/${outputFile}`,
      alt,
      width,
      height,
      ...(metadata?.capturedAt ? { capturedAt: metadata.capturedAt } : {}),
    });
  }
  const unexpectedMetadataFiles = [...metadataByFile.keys()].filter(
    (file) => !images.some((image) => path.basename(image.src) === file),
  );
  if (unexpectedMetadataFiles.length) {
    throw new Error(`Unexpected event metadata files for ${definition.slug}: ${unexpectedMetadataFiles.join(", ")}`);
  }
  if (definition.orderMode === "chronological") {
    const missingCaptureDates = images.filter((image) => !image.capturedAt).map((image) => path.basename(image.src));
    if (missingCaptureDates.length) {
      throw new Error(`Missing capture dates for chronological gallery ${definition.slug}: ${missingCaptureDates.join(", ")}`);
    }
    images.sort((left, right) => Date.parse(left.capturedAt) - Date.parse(right.capturedAt));
  }
  return images;
}

const campaigns = [];
for (const definition of definitions) campaigns.push({ ...definition, images: await processImages(definition) });

const launchSeries = eastRiseData.series.find((series) => series.slug === "eastrise-launch");
const launchImages = launchSeries.images.map((image) => {
  const publishedAt = image.src.match(/\/(\d{4}-\d{2}-\d{2})_/u)?.[1];
  if (!publishedAt) throw new Error(`Missing publication date in EastRise launch asset name: ${image.src}`);
  return { ...image, publishedAt };
});
campaigns.push({
  slug: "eastrise-launch-campaign",
  title: "EastRise Launch Campaign",
  eyebrow: "Brand launch photography · EastRise · 2024",
  intro: "I co-produced the first EastRise brand commercial and made the still photographs used on the website, social channels, and later campaigns.",
  organization: "EastRise Credit Union",
  orderMode: "editorial",
  orderNote: "The campaign preserves the published carousel sequence instead of treating publication dates as capture dates.",
  images: launchImages,
});

const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Galleries</h3><ul><li><a href="../neg-ecp-conference-2026/">47th NEG-ECP Conference</a></li><li><a href="../vermont-foodbank-volunteer-day-2026/">Vermont Foodbank Volunteer Day</a></li><li><a href="../drone-photography/">Drone Photography</a></li><li><a href="../eastrise-launch-campaign/">EastRise Launch Campaign</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Photography, communication, and practical technology from Montpelier, Vermont.</p></div></div></footer>`;
for (const campaign of campaigns) {
  const route = `work/${campaign.slug}/`;
  const robotsMeta = isWithheldPublicPath(route)
    ? '<meta name="robots" content="noindex">'
    : "";
  const gallery = campaign.images.map((image, index) => {
    const description = String(image.alt || "").trim();
    const label = description
      ? `Open larger image: ${description}`
      : `Open photograph ${index + 1} of ${campaign.images.length} from ${campaign.title}`;
    const dateMetadata = image.capturedAt
      ? ` data-captured-at="${escapeAttribute(image.capturedAt)}"`
      : image.publishedAt
        ? ` data-published-at="${escapeAttribute(image.publishedAt)}"`
        : "";
    return `<img src="${escapeAttribute(image.src)}" alt="${escapeAttribute(description)}" aria-label="${escapeAttribute(label)}" width="${image.width}" height="${image.height}"${dateMetadata} loading="lazy" decoding="async">`;
  }).join("");
  const story = campaign.story
    ? `<section class="case-section"><h2>${campaign.story.title}</h2><div class="case-section__body">${campaign.story.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div></section>`
    : "";
  const featuredImage = campaign.featuredFile
    ? campaign.images.find((image) => path.basename(image.src) === campaign.featuredFile)
    : null;
  const hero = featuredImage
        ? `<header class="case-hero case-hero--family"><div class="case-hero--family__copy"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></div><img src="${featuredImage.src}" alt="${campaign.featuredAlt || campaign.title}" width="${featuredImage.width}" height="${featuredImage.height}" loading="eager" fetchpriority="high" decoding="async" data-no-zoom></header>`
        : `<header class="case-hero case-hero--portrait"><p class="eyebrow">${campaign.eyebrow}</p><h1>${campaign.title}</h1><p>${campaign.intro}</p><p class="portrait-count">${campaign.images.length} photographs</p></header>`;
  const gallerySummaryId = `${campaign.slug}-gallery-summary`;
  const orderSummary = campaign.orderMode === "chronological"
    ? " Photographs appear in capture order, oldest first."
    : campaign.orderMode === "editorial"
      ? " Photographs appear in an editorial sequence."
      : "";
  const gallerySection = `<section class="case-section case-section--gallery"><h2>Complete gallery</h2><p class="visually-hidden" id="${gallerySummaryId}">${campaign.intro} This gallery contains ${campaign.images.length} photographs.${orderSummary}</p><div class="campaign-collage" data-gallery="${campaign.slug}" data-order-mode="${campaign.orderMode}" aria-describedby="${gallerySummaryId}">${gallery}</div></section>`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';">${robotsMeta}<title>${campaign.title} | Ames Consulting</title><meta name="description" content="${campaign.intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${campaign.slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${hero}${story}${gallerySection}</main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;
  const output = path.join(root, "work", campaign.slug, "index.html");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, html);
}
await writeFile(path.join(root, "assets/data/event-galleries.json"), `${JSON.stringify({ generatedAt: "2026-08-11", campaigns: campaigns.map(({ source: _source, prepared: _prepared, ...campaign }) => campaign) }, null, 2)}\n`);
console.log(campaigns.map((campaign) => `${campaign.title}: ${campaign.images.length}`).join("\n"));

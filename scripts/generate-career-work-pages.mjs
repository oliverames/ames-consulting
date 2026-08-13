#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { galleryOrderFor, orderedGalleryFiles, sortEntriesNewestFirst } from "./project-order.mjs";
import { youtubeFacade } from "./youtube-facade.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workIndexPath = join(root, "work", "index.html");
const eastRisePhotography = JSON.parse(await readFile(join(root, "assets", "data", "eastrise-photography.json"), "utf8"));
const eastRiseSocial = JSON.parse(await readFile(join(root, "assets", "data", "eastrise-social.json"), "utf8"));
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const eastRiseSeries = (slug) => {
  const series = eastRisePhotography.series.find((item) => item.slug === slug);
  if (!series) throw new Error(`Missing required EastRise photography series: ${slug}`);
  return series;
};
const wheelsPhotoSeries = eastRiseSeries("wheels-for-warmth-2024");
const taylorRacingSeries = eastRiseSeries("taylor-hoar-racing");
const taylorVeggieVanGoSeries = eastRiseSeries("veggievango-taylor-hoar");

const institutional = `<section class="work-category"><h2>Client and institutional work</h2><div class="work-list"><a class="work-item" href="eastrise/"><img src="../assets/images/work/eastrise/photography/wheels-for-warmth-2024/2024-10-26_13-50-10_UTC_DBlvKpKtVEU_1-05c3cca5b111.webp" alt="A Wheels for Warmth volunteer waves during the 2024 tire collection" loading="lazy"><span class="work-item__context">VSECU and EastRise · 2019–2025</span><h3>EastRise Credit Union</h3><p>Six years of audience strategy, brand photography, campaigns, writing, video, and two website redesigns.</p></a><a class="work-item" href="beta-technologies/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>BETA</strong><small>documentary video</small></div><span class="work-item__context">BETA Technologies · 2026</span><h3>BETA Technologies</h3><p>Documentary video about a Vermont aviation career built through an unexpected route.</p></a></div></section>`;

const fairbanksCard = `<a class="work-item" href="fairbanks-planetarium/"><div class="work-item__placeholder work-item__placeholder--metric"><strong>1,580</strong><small>participants</small></div><span class="work-item__context">Fairbanks Museum &amp; Planetarium · 2015–2018</span><h3>Fairbanks Museum Planetarium</h3><p>I ran the planetarium and helped organize a Guinness World Record astronomy lesson.</p></a>`;
const liveBroadcastCard = `<a class="work-item" data-organization="eastrise" href="live-broadcasts/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>Live</strong><small>broadcasts</small></div><span class="work-item__context">VSECU and EastRise · 2019–2025</span><h3>Live broadcasts</h3><p>Hosting, creative direction, and technical production for public programs and employee updates.</p></a>`;
const earlier = `<section class="work-category work-category--earlier"><h2>Earlier work</h2><div class="work-list"><a class="work-item" href="vtdigger-membership/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>137%</strong></div><span class="work-item__context">VTDigger · 2018–2019</span><h3>VTDigger membership</h3><p>I simplified the donation page and ran the tests that increased membership conversion by 137%.</p></a>${fairbanksCard}${liveBroadcastCard}</div></section>`;

const gmcfCampaignCards = `<a class="work-item" href="sweat-heart-throwdown/"><img src="../assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown competitors and volunteers" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2026</span><h3>Sweat-Heart Throwdown</h3><p>A Valentine’s Day competition photographed from warmup through the final heat.</p></a><a class="work-item" href="bike-fitting/"><img src="../assets/images/work/gmcf/bike-fitting/dsc09620.webp" alt="A professional bike fitting at Green Mountain Community Fitness" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2025</span><h3>Bike Fitting</h3><p>I photographed a one-to-one bike fitting, including the measurements, tools, and repeated adjustments.</p></a>`;

const eastRiseStandaloneSlugs = new Set([
  "taylor-hoar-racing",
  "veggievango-taylor-hoar",
  "wheels-for-warmth-2024",
  "eastrise-launch",
  "eastrise-candid-portraits",
]);
const eastRiseSocialCard = `<a class="work-item" href="eastrise-social/"><img src="../assets/images/work/eastrise/social/facebook-028.webp" alt="EastRise social post screenshot" loading="lazy"><span class="work-item__context">VSECU and EastRise · 2020–2026</span><h3>Social Highlights</h3><p>Selected member stories, community coverage, campaigns, and lighter moments from the dated social archive.</p></a>`;
const flightPathsCard = `<a class="work-item" data-organization="beta-technologies" href="flight-paths/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>Video</strong><small>Flight Paths</small></div><span class="work-item__context">BETA Technologies · 2026</span><h3>Flight Paths</h3><p>A documentary about a person finding her way into Vermont’s growing aviation sector.</p></a>`;
const wheelsCard = `<a class="work-item" data-organization="eastrise" href="wheels-for-warmth/"><img src="../assets/images/work/eastrise/photography/wheels-for-warmth-2024/2024-10-26_13-50-10_UTC_DBlvKpKtVEU_1-05c3cca5b111.webp" alt="A Wheels for Warmth volunteer waves during the 2024 tire collection" loading="lazy"><span class="work-item__context">EastRise · 2024–2025</span><h3>Wheels for Warmth</h3><p>Collection-day photography from 2024 and a public-service campaign with measurable results from 2025.</p></a>`;
const taylorCard = `<a class="work-item" data-organization="eastrise" href="taylor-hoar-racing/"><img src="../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp" alt="Taylor Hoar seated in her EastRise race suit, holding her helmet in front of the No. 48 car" loading="lazy"><span class="work-item__context">EastRise · 2024–2025</span><h3>Taylor Hoar Racing</h3><p>Racing, portraits, community work, social publishing, local history, and campaign results from the full sponsorship.</p></a>`;
const gironFamilyCards = [
  `<a class="work-item" href="giron-family-fall-2025/"><img src="../assets/images/work/events/giron-family-fall-2025/dsc06125.webp" alt="The Giron family during a fall portrait session" loading="lazy"><span class="work-item__context">Family photography · Fall 2025</span><h3>Giron Family, Fall 2025</h3><p>A 36-image family session moving from open fields into the fall woods.</p></a>`,
  `<a class="work-item" href="giron-family-christmas-tree-farm-2024/"><img src="../assets/images/work/events/giron-family-christmas-tree-farm-2024/dsc06782.webp" alt="The Giron family together at a snowy Christmas tree farm" loading="lazy"><span class="work-item__context">Family photography · December 2024</span><h3>Christmas Tree Farm Family Session</h3><p>A snowy family session among the Christmas trees, with 122 photographs from the afternoon.</p></a>`,
  `<a class="work-item" href="giron-family-fall-2023/"><img src="../assets/images/work/events/giron-family-fall-2023/dsc03800.webp" alt="The Giron family together during an autumn farm session" loading="lazy"><span class="work-item__context">Family photography · October 2023</span><h3>Giron Family, Fall 2023</h3><p>A 228-image family session across the farm, from portraits and play to pumpkins and open fields.</p></a>`,
];
const foodbankCard = `<a class="work-item" href="vermont-foodbank-volunteer-day-2026/"><img src="../assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp" alt="Vermont Foodbank volunteers together in the warehouse" loading="lazy"><span class="work-item__context">Vermont Foodbank · January 2026</span><h3>Vermont Foodbank Volunteer Day</h3><p>A 38-image documentary series about the people and process behind a volunteer packing day.</p></a>`;
const londonCard = `<a class="work-item" href="london-2019/"><img src="../assets/images/work/events/london-2019/dsc02427.webp" alt="Tower Bridge spanning the River Thames as late sunlight breaks through dark clouds" loading="lazy"><span class="work-item__context">London · September 2019</span><h3>London at Dusk</h3><p>Eight photographs along the Thames as daylight gave way to a stormy blue hour.</p></a>`;
const whaleDanceCard = `<a class="work-item" href="whale-dance-randolph/"><img src="../assets/images/work/events/whale-dance-randolph/dsc06299.webp" alt="Jim Sardonis's Whale Dance sculpture above a stone wall with mist drifting through distant hills" loading="lazy"><span class="work-item__context">Randolph, Vermont · September 2021</span><h3>Whale Dance in Randolph</h3><p>Eight photographs of Jim Sardonis’s bronze sculpture against fog and autumn hills.</p></a>`;
const droneCard = `<a class="work-item" href="drone-photography/"><img src="../assets/images/work/events/drone-photography/dji_0053.webp" alt="Top-down aerial view of a vehicle turning through deep snow, its tracks curving beside a fence" loading="lazy"><span class="work-item__context">Aerial photography · 2018–2020</span><h3>Drone Photography</h3><p>Sixty-two aerial photographs from winter fields, cities, coastlines, mountains, and rail yards.</p></a>`;
const vsecuWebsiteCard = `<a class="work-item" href="vsecu-website/"><img src="../assets/images/work/credit-union-websites/vsecu-redesign.webp" alt="VSECU website redesign" loading="lazy"><span class="work-item__context">VSECU · 2021</span><h3>VSECU Website Redesign</h3><p>Content, imagery, migration, implementation, and quality assurance for the 2021 redesign.</p></a>`;
const eastRiseWebsiteCard = `<a class="work-item" href="eastrise-website/"><img src="../assets/images/work/credit-union-websites/eastrise-feature.webp" alt="EastRise website launch" loading="lazy"><span class="work-item__context">EastRise · 2024</span><h3>EastRise Website Launch</h3><p>A new public website built to introduce a new institution without losing its Vermont history.</p></a>`;

const gmcfInstitution = `<a class="work-item" href="green-mountain-community-fitness/"><img src="../assets/images/work/gmcf/sweat-heart/dsc01706.webp" alt="Athletes competing at Green Mountain Community Fitness" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2025–2026</span><h3>Green Mountain Community Fitness</h3><p>Event and documentary photography from a fitness competition and a bike fitting.</p></a>`;

const sourceLink = (href, label) => `<a href="${href}" rel="noopener">${label}</a>`;

// refine-work.mjs (which runs later in build:site and whose output is
// committed) renames these section headings, so every pattern must match both
// the original and the refined state or the surgery silently no-ops.
const headingAliases = {
  "Campaigns and series": ["Campaigns and series", "Projects"],
  "Earlier work": ["Earlier work", "Legacy work"],
};

function workSectionPattern(heading) {
  const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alternatives = (headingAliases[heading] || [heading]).map(escape).join("|");
  return new RegExp(
    `(<section class="work-category(?: work-category--earlier)?">\\s*<h2(?: id="project-list-title")?>(?:${alternatives})</h2>(?:<p class="work-category__framing">[\\s\\S]*?</p>)?(?:<nav class="work-filters"[\\s\\S]*?</nav>)?(?:<p class="work-filter-status"[^>]*></p>)?\\s*<div class="work-list">)([\\s\\S]*?)(\\s*</div>\\s*</section>)`,
  );
}

function sortWorkSection(html, heading) {
  const sectionPattern = workSectionPattern(heading);
  if (!sectionPattern.test(html)) {
    console.warn(`generate-career-work-pages: no "${heading}" section found — sort skipped.`);
    return html;
  }

  return html.replace(sectionPattern, (section, opening, cardMarkup, closing) => {
    const cards = [...cardMarkup.matchAll(/<a class="work-item"[^>]*?href="([^"]+)"[\s\S]*?<\/a\s*>/g)].map(
      (match) => ({ href: match[1], html: match[0] }),
    );
    if (cards.length === 0) return section;

    const ordered = sortEntriesNewestFirst(cards, (card) => card.href);
    return `${opening}${ordered.map((card) => card.html).join("")}${closing}`;
  });
}

function upsertWorkCard(html, heading, href, card) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sectionPattern = workSectionPattern(heading);
  if (!sectionPattern.test(html)) {
    console.warn(`generate-career-work-pages: no "${heading}" section found — card ${href} not upserted.`);
    return html;
  }

  return html.replace(sectionPattern, (section, opening, cardMarkup, closing) => {
    const cardPattern = new RegExp(`<a class="work-item"[^>]*?href="${escapedHref}"[\\s\\S]*?</a\\s*>`);
    const updatedCards = cardPattern.test(cardMarkup)
      ? cardMarkup.replace(cardPattern, card)
      : `${card}${cardMarkup}`;
    return `${opening}${updatedCards}${closing}`;
  });
}

const pages = [
  { slug: "vtdigger-membership", eyebrow: "Membership strategy · VTDigger · 2018–2019", title: "Donation conversion increased 137%.", intro: "VTDigger joined the Facebook Journalism Project Membership Accelerator with a practical goal: make it easier for readers to support independent Vermont journalism.", sections: [
    ["What changed", "I worked across the membership funnel, including campaign messaging, analytics, email, and the donation experience. The team simplified the donation page layout and checkout process, then measured what visitors did instead of relying on instinct."],
    ["What happened", "The redesigned page increased the share of visitors who proceeded to donate by 137%. Personalized email work also produced a 21% lift in open rate, and segmented campaigns helped increase new email subscribers by 20% within four months."],
    ["Why it worked", "The revised page gave readers one decision and made the checkout easier to complete. We measured the whole path from the first message through the donation."],
    ["Sources", `${sourceLink("https://www.lenfestinstitute.org/solutions-resources/participants-share-their-results-increasing-membership/", "Lenfest Institute: Participants share their results increasing membership")}<br>${sourceLink("https://www.lenfestinstitute.org/solutions-resources/facebook-membership-accelerator-lifetime-value-results/", "Lenfest Institute: Membership Accelerator lifetime value results")}`]
  ]},
  { slug: "fairbanks-planetarium", eyebrow: "Science communication · Fairbanks Museum · 2015–2018", title: "1,580 people joined an astronomy lesson.", intro: "Running the planetarium meant teaching astronomy, managing staff and grants, improving ticketing, and helping the museum stage a Guinness World Record event.", sections: [
    ["The work", "As Planetarium Director, I managed programming, staff development, grants, and the planetarium's relationship with museum leadership. I also helped implement a museum-wide point-of-sale system and represented the museum in local media."],
    ["The public result", "On August 10, 2018, Fairbanks Museum and Planetarium brought 1,580 people together for a 30-minute astronomy lesson and earned the Guinness World Record."],
    ["Planning the record attempt", "I helped plan the event for five months, including public relations, web work, vendors, and crowd management."],
    ["Breaking Records in Science Education", youtubeFacade("lSi35li8dCg", "Breaking Records in Science Education")],
    ["Sources", `${sourceLink("https://www.guinnessworldrecords.com/world-records/largest-astronomy-lesson", "Guinness World Records: Largest astronomy lesson")}<br>${sourceLink("https://www.wcax.com/content/news/Fairbanks-Museum-claims-record-for-largest-astronomy-lesson-490731831.html", "WCAX: Fairbanks Museum claims record for largest astronomy lesson")}`]
  ]},
  { slug: "live-broadcasts", eyebrow: "Hosting and production · VSECU and EastRise · 2019–2025", title: "Live broadcasts", intro: "I hosted and produced public programs and employee updates for VSECU and EastRise.", sections: [
    ["Production and hosting", "I served as host, brand spokesperson, and technical lead for major livestreams. That included creative direction, production, live facilitation, and explaining quarterly financial results and organizational goals to employees."],
    ["Facilitation", "I turned leadership updates into a conversation that employees and public audiences could follow."],
    ["Preparation", "I built the run of show, learned the material, and planned for technical failures. That preparation let me adjust when a live conversation changed."]
  ]},
  { slug: "beta-technologies", eyebrow: "Documentary video · BETA Technologies · 2026", title: "BETA Technologies", intro: "I produced Flight Paths, a documentary about how Emma found her way into Vermont aviation.", sections: [
    ["Emma’s story", "Emma joined BETA through its partnership with the Vermont Adult Learning Center. In the documentary, she explains how the program led her to BETA and her work in electric aviation."],
    ["The production", "Emma’s interview tells the story. I used BETA’s aircraft, technology, and workforce program to show where her work takes place."],
    ["Watch", '<a class="btn btn--primary" href="../flight-paths/">Watch Flight Paths →</a>'],
    ["Source", sourceLink("https://beta.team/video-library", "BETA Technologies video library")]
  ]},
  { slug: "flight-paths", eyebrow: "Documentary video · BETA Technologies · 2026", title: "Flight Paths: Emma at BETA", intro: "Emma joined BETA Technologies through its partnership with the Vermont Adult Learning Center.", sections: [
    ["The film", `<p>I produced this documentary about Emma’s route into electric aviation work in Vermont.</p>${youtubeFacade("4r5N5DjmSCU", "Flight Paths: Emma at BETA")}`]
  ]},
  { slug: "wheels-for-warmth", eyebrow: "Public-service campaign · EastRise · 2024–2025", title: "Wheels for Warmth", intro: "This project combines my photographs from the 2024 tire collection with the campaign I ran in 2025.", metrics: [
    ["65,906", "Views on the leading 2025 post"],
    ["274", "Shares on the leading 2025 post"],
    ["138,563", "October 2025 impressions"],
    ["4,553", "October 2025 engagements"],
  ], sections: [
    ["The 2025 campaign", "<p>I wrote donation instructions and event reminders, then tracked the campaign results. The most-viewed post told people which tires they could donate and where to bring them.</p>"],
    ["The photography", "<p>The ten photographs below document the 2024 collection day through the volunteers, donors, tires, and work that made the event possible.</p>"],
  ], photoSeries: [{
    ...wheelsPhotoSeries,
    title: "The 2024 collection day",
    description: "Ten published photographs from the Wheels for Warmth tire collection.",
  }]},
  { slug: "taylor-hoar-racing", eyebrow: "Sponsorship series · EastRise · 2024–2025", title: "Taylor Hoar Racing", intro: "I covered the EastRise sponsorship through race days, portraits, community events, social posts, and performance reports in 2024 and 2025.", metrics: [
    ["80", "Pieces of 2025 content"],
    ["22", "Race and event days in 2025"],
    ["248,491", "Total 2025 views"],
    ["2,847", "2025 engagement actions"],
  ], sections: [
    ["Coverage throughout the season", "<p>I published race-day coverage, portraits, short-form posts, community events, and stories from Thunder Road history between races.</p>"],
    ["The Milk Bowl", "<p>In 2025, Taylor raced in Tracie Bellerose’s colors, connecting a current driver with the woman who became the first to qualify for the Milk Bowl on her own merit 25 years earlier.</p>"],
  ], photoSeries: [
    {
      ...taylorRacingSeries,
      title: "Racing and portraits",
      description: "Race-day, race-shop, and portrait photographs from the public series.",
    },
    {
      ...taylorVeggieVanGoSeries,
      title: "VeggieVanGo with Taylor Hoar",
      description: "Four published photographs of Taylor joining EastRise and the Vermont Foodbank for a VeggieVanGo distribution.",
    },
  ]},
  { slug: "sweat-heart-throwdown", eyebrow: "Event photography · Green Mountain Community Fitness · 2026", title: "Sweat-Heart Throwdown", intro: "The Sweat-Heart Throwdown brought teams, volunteers, judges, and spectators together for a Valentine’s Day competition at Green Mountain Community Fitness.", featuredFile: "dsc01171.webp", gallery: { directory: "sweat-heart", alt: "Sweat-Heart Throwdown at Green Mountain Community Fitness" }, sections: [
    ["The assignment", "I needed to photograph the competition, but I also watched for encouragement between teammates, volunteers resetting equipment, judges at work, and the moment after each heat ended."],
    ["The photographs", "I moved between wide views of the room and close frames of individual competitors. GMCF received an event record and a set it can reuse in social posts and promotions."]
  ]},
  { slug: "bike-fitting", eyebrow: "Documentary photography · Green Mountain Community Fitness · 2025", title: "Bike fitting at GMCF", intro: "I photographed the one-to-one process of fitting a rider to a bike at Green Mountain Community Fitness.", gallery: { directory: "bike-fitting", alt: "Bike fitting at Green Mountain Community Fitness" }, sections: [
    ["The assignment", "A prospective rider should be able to look through the photographs and understand what happens during a fitting."],
    ["The photographs", "I followed the full process, including posture, measurements, observation, tools, contact points, and repeated adjustments. The sequence works as a complete set, and individual frames can stand alone on a service page or social post."],
    ["The gallery", "Select any photograph to open the full viewer. Use the buttons or the left and right arrow keys to move through the complete set."]
  ]},
  { slug: "green-mountain-community-fitness", eyebrow: "Client work · 2025–2026", title: "Green Mountain Community Fitness", intro: "This page collects two photography assignments for Green Mountain Community Fitness.", sections: [
    ["Projects and series", `<div class="work-list"><a class="work-item" href="../sweat-heart-throwdown/"><img src="../../assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown competitors and volunteers" loading="lazy"><span class="work-item__context">Event photography · 2026</span><h3>Sweat-Heart Throwdown</h3><p>A Valentine’s Day competition photographed from warmup through the final heat.</p></a><a class="work-item" href="../bike-fitting/"><img src="../../assets/images/work/gmcf/bike-fitting/dsc09620.webp" alt="A professional bike fitting" loading="lazy"><span class="work-item__context">Documentary photography · 2025</span><h3>Bike Fitting</h3><p>A step-by-step look at a professional bike fitting.</p></a></div>`]
  ]},
  { slug: "blue-cross-vermont", eyebrow: "Communications · Blue Cross Vermont · 2026–present", title: "Blue Cross Vermont", intro: "My current role includes brand communications, social content, community photography, and production systems.", sections: [
    ["Current role", "<p>I write and produce public communications and build the workflows used to publish them.</p>"]
  ]},
  { slug: "community-photography", eyebrow: "Documentary photography · Vermont · 2023–2025", title: "Community photography", intro: "These photographs come from public events and community programs in Vermont.", sections: [
    ["Credit union community work", `<div class="media-grid"><img src="../../assets/images/work/eastrise/uvm-soccer.webp" alt="A University of Vermont soccer event" loading="lazy"><img src="../../assets/images/work/eastrise/point-to-point.webp" alt="Cyclists at the Point to Point event" loading="lazy"></div>`]
  ]}
];

const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-writing/">EastRise Writing</a></li><li><a href="../vermont-foodbank-volunteer-day-2026/">Vermont Foodbank</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p><ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul></div></div></footer>`;

pages.push({
  slug: "eastrise-photography",
  eyebrow: "Dated photography archive · EastRise · 2024–2026",
  title: "EastRise photography archive",
  intro: `This archive contains ${eastRisePhotography.totalImages} photographs from EastRise projects dated from 2024 through 2026.`,
  photoSeries: eastRisePhotography.series,
  sections: [],
});

pages.push({
  slug: "eastrise-social",
  eyebrow: "Social media · VSECU and EastRise · 2020–2026",
  title: "Selected social posts from VSECU and EastRise",
  intro: "I selected these dated posts from work published for VSECU and EastRise between 2020 and 2026.",
  socialPosts: eastRiseSocial.posts.filter((post) => eastRiseSocial.highlightIds.includes(post.id)),
  sections: [],
});

let workIndex = await readFile(workIndexPath, "utf8");
for (const href of [
  "senior-games-press-event-2026/",
  "arrayrx-press-conference-2026/",
  "walk-at-lunch-and-green-up-2026/",
  "be-well-at-work-2026/",
  "corporate-cup-2026/",
  "girls-on-the-run-2026/",
  "blue-cross-portraits/",
  "eastrise-photography/#wheels-for-warmth-2024-title",
  "eastrise-photography/#veggievango-taylor-hoar-title",
]) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  workIndex = workIndex.replace(
    new RegExp(`<a class="work-item"[^>]*?href="${escapedHref}"[\\s\\S]*?<\\/a\\s*>`, "g"),
    "",
  );
}
const legacyProof = /<section class="proof-band"><h2>Earlier work<\/h2>.*?<\/section>/;
const currentCategories = /<section class="work-category"><h2>Client and institutional work<\/h2>.*?<\/section><section class="work-category work-category--earlier"><h2>Earlier work<\/h2>.*?<\/section>/;
if (legacyProof.test(workIndex) || currentCategories.test(workIndex)) {
  workIndex = workIndex.replace(legacyProof.test(workIndex) ? legacyProof : currentCategories, `${institutional}${earlier}`);
} else if (!workIndex.includes('id="project-list-title"')) {
  // In the refined layout (refine-work.mjs) these sections were merged into
  // "Projects"/"Legacy work" — only warn when neither format is present.
  console.warn("generate-career-work-pages: neither the legacy nor the refined work-index layout was found; institutional/earlier sections not rebuilt.");
}
if (!workIndex.includes('href="sweat-heart-throwdown/"')) {
  workIndex = workIndex.replace('<section class="work-category"><h2>Campaigns and series</h2><div class="work-list">', `<section class="work-category"><h2>Campaigns and series</h2><div class="work-list">${gmcfCampaignCards}`);
}
workIndex = workIndex.replace(/<a class="work-item"[^>]*?href="eastrise-photography\/"\s*>[\s\S]*?<\/a\s*>/, "");
workIndex = workIndex.replace(/<a class="work-item"[^>]*?href="eastrise-photography\/#bike-shop-member-story-title"\s*>[\s\S]*?<\/a\s*>/, "");
for (const series of eastRisePhotography.series.filter((item) =>
  !eastRiseStandaloneSlugs.has(item.slug)
)) {
  const href = `eastrise-photography/#${series.slug}-title`;
  const image = series.images[0];
  const dateMatch = image.src.match(/\/(\d{4})-(\d{2})-(\d{2})_/);
  const published = dateMatch ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`)) : "";
  const card = `<a class="work-item" href="${href}"><img src="${image.src.replace("../../assets/", "../assets/")}" alt="${escapeHtml(image.alt)}" loading="lazy"><span class="work-item__context">EastRise${published ? ` · ${published}` : ""} · ${series.images.length} photographs</span><h3>${series.title}</h3><p>${series.description}</p></a>`;
  workIndex = upsertWorkCard(workIndex, "Campaigns and series", href, card);
}
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "eastrise-social/", eastRiseSocialCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "flight-paths/", flightPathsCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "wheels-for-warmth/", wheelsCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "taylor-hoar-racing/", taylorCard);
for (const card of gironFamilyCards) {
  const href = card.match(/href="([^"]+)"/)?.[1];
  workIndex = upsertWorkCard(workIndex, "Campaigns and series", href, card);
}
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "vermont-foodbank-volunteer-day-2026/", foodbankCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "drone-photography/", droneCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "whale-dance-randolph/", whaleDanceCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "london-2019/", londonCard);
workIndex = workIndex.replace(/<a class="work-item"[^>]*?href="credit-union-websites\/"\s*>[\s\S]*?<\/a\s*>/, "");
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "vsecu-website/", vsecuWebsiteCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "eastrise-website/", eastRiseWebsiteCard);
workIndex = upsertWorkCard(workIndex, "Earlier work", "fairbanks-planetarium/", fairbanksCard);
const liveBroadcastPattern = /<a class="work-item"[^>]*?href="live-broadcasts\/"[\s\S]*?<\/a\s*>/;
workIndex = liveBroadcastPattern.test(workIndex)
  ? workIndex.replace(liveBroadcastPattern, liveBroadcastCard)
  : upsertWorkCard(workIndex, "Campaigns and series", "live-broadcasts/", liveBroadcastCard);
if (!workIndex.includes('href="green-mountain-community-fitness/"')) {
  workIndex = workIndex.replace('<section class="work-category"><h2>Client and institutional work</h2><div class="work-list">', `<section class="work-category"><h2>Client and institutional work</h2><div class="work-list">${gmcfInstitution}`);
}
workIndex = workIndex
  .replaceAll("../assets/images/work/eastrise/taylor-milk-bowl-card.webp", "../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("../assets/images/work/eastrise/photography/taylor-hoar-racing/2025-04-17_19-15-59_UTC_DIjx-o5p5N0-df7a815bc6ce.webp", "../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("Taylor Hoar racing at Thunder Road", "Taylor Hoar wearing her EastRise racing suit beside her race car")
  .replace("../assets/images/work/gmcf/sweat-heart/dsc01141.webp", "../assets/images/work/gmcf/sweat-heart-card.webp")
  .replace("../assets/images/work/gmcf/bike-fitting/dsc09620.webp", "../assets/images/work/gmcf/bike-fitting-card.webp")
  .replace("../assets/images/work/gmcf/sweat-heart/dsc01706.webp", "../assets/images/work/gmcf/gmcf-card.webp");
workIndex = workIndex.replace(
  /(<a class="work-item"[^>]*href="taylor-hoar-racing\/"[\s\S]*?)<img[\s\S]*?>/,
  '$1<img src="../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp" alt="Taylor Hoar seated in her EastRise race suit, holding her helmet in front of the No. 48 car" width="1800" height="2400" loading="lazy">',
);
workIndex = sortWorkSection(workIndex, "Campaigns and series");
// In the refined layout these cards live inside "Projects" and refine-work
// owns their ordering; only sort when the legacy section actually exists.
if (workIndex.includes("<h2>Client and institutional work</h2>")) {
  workIndex = sortWorkSection(workIndex, "Client and institutional work");
}
workIndex = sortWorkSection(workIndex, "Earlier work");
await writeFile(workIndexPath, workIndex);

for (const page of pages) {
  let content = page.sections.map(([title, body]) => `<section class="case-section"><h2>${title}</h2><div class="case-section__body">${body}</div></section>`).join("");
  if (page.metrics) {
    const metrics = page.metrics.map(([value, label]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("");
    content = `<section class="metric-grid" aria-label="Campaign results">${metrics}</section>${content}`;
  }
  if (page.photoSeries) {
    content += page.photoSeries.map((series) => `<section class="case-section photo-series" aria-labelledby="${series.slug}-title"><h2 id="${series.slug}-title">${series.title}</h2><p>${series.description}</p>${series.videoId ? youtubeFacade(series.videoId, `${series.title} member story`, "video-embed photo-series__video") : ""}<div class="campaign-collage" data-gallery="eastrise-${series.slug}" data-order-mode="${escapeHtml(series.displayOrderMode)}">${series.images.map((image, index) => `<img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" data-orientation="${image.height > image.width ? "portrait" : "landscape"}" data-series-position="${index + 1}" data-date-status="${image.publishedDate || image.capturedDate ? "dated" : "undated"}"${image.publishedDate ? ` data-published-at="${escapeHtml(image.publishedDate)}"` : ""}${image.capturedDate ? ` data-captured-at="${escapeHtml(image.capturedDate)}"` : ""}${image.dateBasis ? ` data-date-basis="${escapeHtml(image.dateBasis)}"` : ""}>`).join("")}</div></section>`).join("");
  }
  if (page.gallery) {
    const galleryDirectory = join(root, "assets", "images", "work", "gmcf", page.gallery.directory);
    const availableImages = (await readdir(galleryDirectory)).filter((file) => file.endsWith(".webp"));
    const images = orderedGalleryFiles(page.slug, availableImages);
    const orderMetadata = galleryOrderFor(page.slug);
    const gallery = images.map((file, index) => `<img src="../../assets/images/work/gmcf/${page.gallery.directory}/${file}" alt="${page.gallery.alt}, photograph ${index + 1} of ${images.length}" data-captured-at="${orderMetadata.capturedAt[file]}" loading="lazy" decoding="async">`).join("");
    content += `<section class="case-section case-section--gallery" aria-labelledby="${page.slug}-gallery"><h2 id="${page.slug}-gallery">Complete photo series</h2><div class="campaign-collage" data-gallery="${page.slug}" data-order-mode="chronological" data-capture-start="${orderMetadata.captureStart}" data-capture-end="${orderMetadata.captureEnd}">${gallery}</div></section>`;
  }
  if (page.socialPosts) {
    const screenshots = page.socialPosts.map((post, index) => `<img src="../../${post.screenshot}" alt="${escapeHtml(post.title)}, ${post.platform} capture ${index + 1} of ${page.socialPosts.length}" width="${post.width}" height="${post.height}" loading="lazy" decoding="async" data-date-status="${post.publishedDate ? "dated" : "undated"}"${post.publishedDate ? ` data-published-at="${escapeHtml(post.publishedDate)}"` : ""}>`).join("");
    content += `<section class="case-section case-section--gallery" aria-labelledby="${page.slug}-gallery"><h2 id="${page.slug}-gallery">Selected posts</h2><p>Select any post to open the full viewer.</p><div class="campaign-collage campaign-collage--screenshots" data-gallery="${page.slug}" data-order-mode="reverse-chronological" data-undated-placement="after-dated">${screenshots}</div></section>`;
  }
  const featuredImage = page.featuredFile
    ? `<img src="../../assets/images/work/gmcf/${page.gallery.directory}/${page.featuredFile}" alt="${page.gallery.alt}" loading="eager" fetchpriority="high" decoding="async">`
    : "";
  const hero = featuredImage
    ? `<header class="case-hero case-hero--family"><div class="case-hero--family__copy"><p class="eyebrow">${page.eyebrow}</p><h1>${page.title}</h1><p>${page.intro}</p></div>${featuredImage}</header>`
    : `<header class="case-hero"><p class="eyebrow">${page.eyebrow}</p><h1>${page.title}</h1><p>${page.intro}</p></header>`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; frame-src https://www.youtube-nocookie.com; form-action 'self';"><title>${page.title} | Ames Consulting</title><meta name="description" content="${page.intro}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${page.slug}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1">${hero}${content}</main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script><script type="module" src="../../assets/js/image-viewer.js"></script></body></html>`;
  const output = join(root, "work", page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

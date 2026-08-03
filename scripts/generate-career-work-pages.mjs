#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workIndexPath = join(root, "work", "index.html");
const eastRisePhotography = JSON.parse(await readFile(join(root, "assets", "data", "eastrise-photography.json"), "utf8"));
const eastRiseSocial = JSON.parse(await readFile(join(root, "assets", "data", "eastrise-social.json"), "utf8"));
const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const institutional = `<section class="work-category"><h2>Client and institutional work</h2><div class="work-list"><a class="work-item" href="eastrise/"><img src="../assets/images/work/eastrise/wheels-for-warmth-card.webp" alt="Wheels for Warmth tire collection" loading="lazy"><span class="work-item__context">VSECU and EastRise · 2019–2025</span><h3>EastRise Credit Union</h3><p>Six years of audience strategy, brand photography, campaigns, writing, video, and two website redesigns.</p></a><a class="work-item" href="blue-cross-vermont/"><img src="../assets/images/work/blue-cross/arrayrx-card.webp" alt="ArrayRx press conference photographed for Blue Cross Vermont" loading="lazy"><span class="work-item__context">Blue Cross Vermont · 2026</span><h3>Blue Cross Vermont</h3><p>Photography, community storytelling, video, social content, and digital infrastructure.</p></a><a class="work-item" href="beta-technologies/"><img src="../assets/images/work/campaigns/flight-paths.webp" alt="Flight Paths: Emma at BETA Technologies" loading="lazy"><span class="work-item__context">BETA Technologies · 2026</span><h3>BETA Technologies</h3><p>Documentary video about a Vermont aviation career built through an unexpected route.</p></a></div></section>`;

const earlier = `<section class="work-category work-category--earlier"><h2>Earlier work</h2><div class="work-list"><a class="work-item" href="vtdigger-membership/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>137%</strong></div><span class="work-item__context">VTDigger · 2018–2019</span><h3>Membership conversion</h3><p>A simpler donation page and a disciplined testing program increased membership conversion by 137%.</p></a><a class="work-item" href="fairbanks-planetarium/"><div class="work-item__placeholder work-item__placeholder--metric" aria-hidden="true"><strong>134.8%</strong></div><span class="work-item__context">Fairbanks Museum &amp; Planetarium · 2015–2018</span><h3>Planetarium growth</h3><p>Programming, operations, staff development, and better systems helped planetarium revenue grow from $13,359.80 to $31,363.40.</p></a><a class="work-item" href="live-broadcasts/"><div class="work-item__placeholder work-item__placeholder--metric" aria-label="More than 10,000 live viewers"><strong>10,000+</strong><small>live viewers</small></div><span class="work-item__context">VSECU and EastRise · 2019–2025</span><h3>Live broadcasts</h3><p>Hosting, creative direction, and technical production for major public and employee broadcasts.</p></a></div></section>`;

const gmcfCampaignCards = `<a class="work-item" href="sweat-heart-throwdown/"><img src="../assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown competitors and volunteers" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2026</span><h3>Sweat-Heart Throwdown</h3><p>A Valentine’s Day competition photographed from warmup through the last exhausted finish.</p></a><a class="work-item" href="bike-fitting/"><img src="../assets/images/work/gmcf/bike-fitting/dsc09620.webp" alt="A professional bike fitting at Green Mountain Community Fitness" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2025</span><h3>Bike Fitting</h3><p>A close, practical photo story about expertise, adjustment, and the small details that help a rider fit the bike.</p></a>`;

const eastRiseStandaloneSlugs = new Set(["taylor-hoar-racing", "eastrise-launch", "formal-headshots", "eastrise-candid-portraits"]);
const eastRiseSocialCard = `<a class="work-item" href="eastrise-social/"><img src="../assets/images/work/eastrise/social/facebook-028.webp" alt="EastRise social post screenshot" loading="lazy"><span class="work-item__context">VSECU and EastRise · 2019–2025</span><h3>Social Highlights</h3><p>Selected member stories, community coverage, campaigns, and lighter moments from six years of social publishing.</p></a>`;
const gironFamilyCards = [
  `<a class="work-item" href="giron-family-fall-2025/"><img src="../assets/images/work/events/giron-family-fall-2025/dsc06125.webp" alt="The Giron family during a fall portrait session" loading="lazy"><span class="work-item__context">Family photography · Fall 2025</span><h3>Giron Family, Fall 2025</h3><p>A 36-image family session moving from open fields into the fall woods.</p></a>`,
  `<a class="work-item" href="giron-family-christmas-tree-farm-2024/"><img src="../assets/images/work/events/giron-family-christmas-tree-farm-2024/dsc06782.webp" alt="The Giron family together at a snowy Christmas tree farm" loading="lazy"><span class="work-item__context">Family photography · December 2024</span><h3>Christmas Tree Farm Family Session</h3><p>A snowy family session among the Christmas trees, with 122 photographs from the afternoon.</p></a>`,
  `<a class="work-item" href="giron-family-fall-2023/"><img src="../assets/images/work/events/giron-family-fall-2023/dsc03800.webp" alt="The Giron family together during an autumn farm session" loading="lazy"><span class="work-item__context">Family photography · October 2023</span><h3>Giron Family, Fall 2023</h3><p>A 228-image family session across the farm, from portraits and play to pumpkins and open fields.</p></a>`,
];
const foodbankCard = `<a class="work-item" href="vermont-foodbank-volunteer-day-2026/"><img src="../assets/images/work/events/vermont-foodbank-volunteer-day-2026/dsc08460.webp" alt="Vermont Foodbank volunteers together in the warehouse" loading="lazy"><span class="work-item__context">Vermont Foodbank · January 2026</span><h3>Vermont Foodbank Volunteer Day</h3><p>A 38-image documentary series about the people and process behind a volunteer packing day.</p></a>`;
/*
 * Held pending written permission. Keep these gallery cards in source so they
 * can be restored without rebuilding their content, but do not render them in
 * the public portfolio.
 *
 * const betaAndrewCard = `<a class="work-item" href="beta-andrew/"><img src="../assets/images/work/events/beta-andrew/dsc08015.webp" alt="Andrew working beside an aircraft structure at BETA Technologies" loading="lazy"><span class="work-item__context">BETA Technologies · January 2026</span><h3>Andrew at BETA</h3><p>A 17-image workplace series built around a person, an aircraft, and the process connecting them.</p></a>`;
 * const betaEmmaCard = `<a class="work-item" href="beta-emma/"><img src="../assets/images/work/events/beta-emma/dsc07894.webp" alt="Emma holding a precision measuring tool at BETA Technologies" loading="lazy"><span class="work-item__context">BETA Technologies · January 2026</span><h3>Emma at BETA</h3><p>A 40-image workplace series moving between portraiture, detail, and the manufacturing floor.</p></a>`;
 * const betaEthanCard = `<a class="work-item" href="beta-ethan/"><img src="../assets/images/work/events/beta-ethan/dsc08105.webp" alt="Ethan at a workbench inside BETA Technologies" loading="lazy"><span class="work-item__context">BETA Technologies · January 2026</span><h3>Ethan at BETA</h3><p>A 30-image workplace series about the person inside a larger manufacturing system.</p></a>`;
 */
const betaPhotographyHrefs = ["beta-andrew/", "beta-emma/", "beta-ethan/"];
const vsecuWebsiteCard = `<a class="work-item" href="vsecu-website/"><img src="../assets/images/work/credit-union-websites/vsecu-redesign.webp" alt="VSECU website redesign" loading="lazy"><span class="work-item__context">VSECU · 2021</span><h3>VSECU Website Redesign</h3><p>Content, imagery, migration, and quality assurance for a clearer digital member experience.</p></a>`;
const eastRiseWebsiteCard = `<a class="work-item" href="eastrise-website/"><img src="../assets/images/work/credit-union-websites/eastrise-feature.webp" alt="EastRise website launch" loading="lazy"><span class="work-item__context">EastRise · 2024</span><h3>EastRise Website Launch</h3><p>A new public website built to introduce a new institution without losing its Vermont history.</p></a>`;

const gmcfInstitution = `<a class="work-item" href="green-mountain-community-fitness/"><img src="../assets/images/work/gmcf/sweat-heart/dsc01706.webp" alt="Athletes competing at Green Mountain Community Fitness" loading="lazy"><span class="work-item__context">Green Mountain Community Fitness · 2025–2026</span><h3>Green Mountain Community Fitness</h3><p>Photography built around the people, expertise, and communities that make a fitness center feel like a place to belong.</p></a>`;

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

function sortWorkSection(html, heading, order) {
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

    const rank = new Map(order.map((href, index) => [href, index]));
    cards.sort(
      (left, right) =>
        (rank.get(left.href) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(right.href) ?? Number.MAX_SAFE_INTEGER),
    );
    return `${opening}${cards.map((card) => card.html).join("")}${closing}`;
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

const campaignOrder = [
  "girls-on-the-run-2026/",
  "corporate-cup-2026/",
  "flight-paths/",
  "vermont-foodbank-volunteer-day-2026/",
  "beta-andrew/",
  "beta-emma/",
  "beta-ethan/",
  "eastrise-portraits/",
  "blue-cross-portraits/",
  "giron-family-fall-2025/",
  "giron-family-christmas-tree-farm-2024/",
  "giron-family-fall-2023/",
  "member-banking-stories/",
  "sweat-heart-throwdown/",
  "eastrise-social/",
  "eastrise-writing/",
  "wheels-for-warmth/",
  "taylor-hoar-racing/",
  ...eastRisePhotography.series.filter((series) => !eastRiseStandaloneSlugs.has(series.slug)).map((series) => `eastrise-photography/#${series.slug}-title`),
  "bike-fitting/",
  "eastrise-launch-campaign/",
  "vsecu-website/",
  "eastrise-website/",
];
const institutionalOrder = [
  "blue-cross-vermont/",
  "beta-technologies/",
  "green-mountain-community-fitness/",
  "eastrise/",
];
const earlierWorkOrder = [
  "live-broadcasts/",
  "vtdigger-membership/",
  "fairbanks-planetarium/",
];
const pages = [
  { slug: "vtdigger-membership", eyebrow: "Membership strategy · VTDigger · 2018–2019", title: "Donation conversion increased 137%.", intro: "VTDigger joined the Facebook Journalism Project Membership Accelerator with a practical goal: make it easier for readers to support independent Vermont journalism.", sections: [
    ["What changed", "I worked across the membership funnel, including campaign messaging, analytics, email, and the donation experience. The team simplified the donation page layout and checkout process, then measured what visitors did instead of relying on instinct."],
    ["What happened", "The redesigned page increased the share of visitors who proceeded to donate by 137%. Personalized email work also produced a 21% lift in open rate, and segmented campaigns helped increase new email subscribers by 20% within four months."],
    ["Why it worked", "The page asked people to do one clear thing and removed friction around that decision. The larger program treated membership as a connected system, from the first message through the completed donation."],
    ["Sources", `${sourceLink("https://www.lenfestinstitute.org/solutions-resources/participants-share-their-results-increasing-membership/", "Lenfest Institute: Participants share their results increasing membership")}<br>${sourceLink("https://www.lenfestinstitute.org/solutions-resources/facebook-membership-accelerator-lifetime-value-results/", "Lenfest Institute: Membership Accelerator lifetime value results")}<br><span>Local evidence: archived VTDigger work sample, 2025 resume, and October 2025 LinkedIn export.</span>`]
  ]},
  { slug: "fairbanks-planetarium", eyebrow: "Science communication · Fairbanks Museum · 2015–2018", title: "Planetarium revenue grew 134.8% in four years.", intro: "Running a small planetarium meant doing the astronomy, the staffing, the ticketing, the promotion, and the unglamorous systems work that kept everything moving.", sections: [
    ["The work", "As Planetarium Director, I managed programming, staff development, revenue, grants, and the planetarium's relationship with museum leadership. I also helped implement a museum-wide point-of-sale system and represented the museum in local media."],
    ["The result", "Archived revenue records show planetarium sales growing from $13,359.80 in 2014 to $31,363.40 in 2018. That is an $18,003.60 increase, or 134.8%. The planetarium's share of combined planetarium and museum admission revenue rose from 18.5% to 30.6%."],
    ["A much bigger night", "In 2018, I helped lead the museum's largest event to that point, a Guinness World Record attempt for the largest astronomy lesson. The official record counted 1,580 participants. The planning took five months and involved logistics, public relations, web work, vendors, crowd management, and a great deal of paperwork."],
    ["Breaking Records in Science Education", "<div class=\"video-embed\"><iframe src=\"https://www.youtube-nocookie.com/embed/lSi35li8dCg\" title=\"Breaking Records in Science Education\" loading=\"lazy\" allow=\"accelerometer; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe></div>"],
    ["Sources", `${sourceLink("https://www.guinnessworldrecords.com/world-records/largest-astronomy-lesson", "Guinness World Records: Largest astronomy lesson")}<br>${sourceLink("https://www.wcax.com/content/news/Fairbanks-Museum-claims-record-for-largest-astronomy-lesson-490731831.html", "WCAX: Fairbanks Museum claims record for largest astronomy lesson")}<br><span>Revenue source: archived Fairbanks Museum planetarium sales records summarized in the Career work-sample archive.</span>`]
  ]},
  { slug: "live-broadcasts", eyebrow: "Hosting and production · VSECU and EastRise · 2019–2025", title: "Live broadcasts reached 10,000+ viewers.", intro: "A livestream is part interview, part live production, and part contingency plan. I handled all three while keeping the conversation understandable for the people watching.", sections: [
    ["Production and hosting", "I served as host, brand spokesperson, and technical lead for major livestreams. That included creative direction, production, live facilitation, and explaining quarterly financial results and organizational goals to employees."],
    ["Reach", "The largest broadcasts reached more than 10,000 live viewers. I also facilitated company-wide meetings for more than 200 employees, translating leadership updates into a conversation people could follow."],
    ["Preparation", "The technology mattered, but preparation mattered more. I built a clear run of show, understood the material well enough to move when a conversation changed, and kept the production invisible to the audience."],
    ["Source", "The 10,000+ audience figure is documented in Oliver Ames's 2025 resume and LinkedIn profile."]
  ]},
  { slug: "beta-technologies", eyebrow: "Documentary video · BETA Technologies · 2026", title: "People building Vermont aviation.", intro: "A Flight Paths film puts a person inside BETA Technologies at the center of the story.", sections: [
    /*
     * Held pending written permission. The Andrew, Emma, and Ethan photography
     * gallery links remain here in version history and their pages remain on
     * disk, but this section must not render in the public portfolio.
     * ["Workplace photography", `<div class="work-list"><a class="work-item" href="../beta-andrew/"><img src="../../assets/images/work/events/beta-andrew/dsc08015.webp" alt="Andrew working beside an aircraft structure at BETA Technologies" loading="lazy"><span class="work-item__context">17 photographs</span><h3>Andrew at BETA</h3></a><a class="work-item" href="../beta-emma/"><img src="../../assets/images/work/events/beta-emma/dsc07894.webp" alt="Emma holding a precision measuring tool at BETA Technologies" loading="lazy"><span class="work-item__context">40 photographs</span><h3>Emma at BETA</h3></a><a class="work-item" href="../beta-ethan/"><img src="../../assets/images/work/events/beta-ethan/dsc08105.webp" alt="Ethan at a workbench inside BETA Technologies" loading="lazy"><span class="work-item__context">30 photographs</span><h3>Ethan at BETA</h3></a></div>`],
     */
    ["The story", "I produced Emma's Flight Paths story at BETA Technologies. She joined BETA through its partnership with the Vermont Adult Learning Center, bringing a real workforce pathway into a story about the people building electric aviation in Vermont."],
    ["The approach", "The larger company was important, but Emma was the reason to watch. I built the piece around her own route into the work so the workforce program, the technology, and the organization arrived through a person instead of a list of claims."],
    ["Watch", "<div class=\"video-embed\"><iframe src=\"https://www.youtube-nocookie.com/embed/4r5N5DjmSCU\" title=\"Flight Paths: Emma at BETA\" loading=\"lazy\" allow=\"accelerometer; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen></iframe></div>"],
    ["Source", sourceLink("https://beta.team/video-library", "BETA Technologies video library")]
  ]},
  { slug: "sweat-heart-throwdown", eyebrow: "Event photography · Green Mountain Community Fitness · 2026", title: "Hard work, photographed with humanity.", intro: "The Sweat-Heart Throwdown brought teams, volunteers, judges, and spectators together for a Valentine’s Day competition at Green Mountain Community Fitness.", featuredFile: "dsc01171.webp", gallery: { directory: "sweat-heart", alt: "Sweat-Heart Throwdown at Green Mountain Community Fitness" }, sections: [
    ["The assignment", "Photograph the whole event without flattening it into a string of action shots. The competition mattered, but so did the encouragement, the waiting, the judging, the laughter, and the moment after someone finally put the weight down."],
    ["The approach", "I moved between wide views that establish the room and close frames that show effort and connection. The resulting set gives GMCF both an event record and a useful library for future social posts, promotions, and community storytelling."]
  ]},
  { slug: "bike-fitting", eyebrow: "Documentary photography · Green Mountain Community Fitness · 2025", title: "A bike fitting is a story told in small adjustments.", intro: "This shoot followed the practical, one-to-one work of fitting a rider to a bike at Green Mountain Community Fitness.", gallery: { directory: "bike-fitting", alt: "Bike fitting at Green Mountain Community Fitness" }, sections: [
    ["The assignment", "Show the service clearly enough that a prospective rider can understand what happens, while keeping the photographs grounded in the relationship between the fitter, the rider, and the machine."],
    ["The approach", "I photographed the full process and the details that make the expertise visible: posture, measurement, observation, tools, contact points, and repeated adjustments. The series works as a sequence, but each frame can also stand alone in a service page or social post."],
    ["The gallery", "Select any photograph to open the full viewer. Use the buttons or the left and right arrow keys to move through the complete set."]
  ]},
  { slug: "green-mountain-community-fitness", eyebrow: "Client work · 2025–2026", title: "Green Mountain Community Fitness work.", intro: "The photography work is organized by shoot so each assignment can keep its own people, purpose, and rhythm.", sections: [
    ["Projects and series", `<div class="work-list"><a class="work-item" href="../sweat-heart-throwdown/"><img src="../../assets/images/work/gmcf/sweat-heart/dsc01141.webp" alt="Sweat-Heart Throwdown competitors and volunteers" loading="lazy"><span class="work-item__context">Event photography · 2026</span><h3>Sweat-Heart Throwdown</h3><p>A competition story built from effort, encouragement, volunteers, and the moments between heats.</p></a><a class="work-item" href="../bike-fitting/"><img src="../../assets/images/work/gmcf/bike-fitting/dsc09620.webp" alt="A professional bike fitting" loading="lazy"><span class="work-item__context">Documentary photography · 2025</span><h3>Bike Fitting</h3><p>A service story told through posture, measurement, expertise, and small adjustments.</p></a></div>`]
  ]}
];

const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../eastrise-writing/">EastRise Writing</a></li><li><a href="../community-photography/">Community Photography</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../">All work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p><ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul></div></div></footer>`;

pages.push({
  slug: "eastrise-photography",
  eyebrow: "Public photography archive · EastRise · 2019–2025",
  title: "The photographs behind six years of public work.",
  intro: `${eastRisePhotography.totalImages} publicly published photographs, organized by the campaign or series they belonged to. Private RAW files were used only to check authorship and are not published here.`,
  photoSeries: eastRisePhotography.series,
  sections: [],
});

pages.push({
  slug: "eastrise-social",
  eyebrow: "Social media · VSECU and EastRise · 2019–2025",
  title: "Social highlights.",
  intro: "Selected member stories, community coverage, campaigns, and lighter moments from six years of social publishing.",
  socialPosts: eastRiseSocial.posts.filter((post) => eastRiseSocial.highlightIds.includes(post.id)),
  sections: [],
});

let workIndex = await readFile(workIndexPath, "utf8");
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
  !eastRiseStandaloneSlugs.has(item.slug) &&
  item.slug !== "people-and-financial-counseling"
)) {
  const href = `eastrise-photography/#${series.slug}-title`;
  const image = series.images[0];
  const dateMatch = image.src.match(/\/(\d{4})-(\d{2})-(\d{2})_/);
  const published = dateMatch ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}T00:00:00Z`)) : "";
  const card = `<a class="work-item" href="${href}"><img src="${image.src.replace("../../assets/", "../assets/")}" alt="${escapeHtml(image.alt)}" loading="lazy"><span class="work-item__context">EastRise${published ? ` · ${published}` : ""} · ${series.images.length} photographs</span><h3>${series.title}</h3><p>${series.description}</p></a>`;
  workIndex = upsertWorkCard(workIndex, "Campaigns and series", href, card);
}
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "eastrise-social/", eastRiseSocialCard);
for (const card of gironFamilyCards) {
  const href = card.match(/href="([^"]+)"/)?.[1];
  workIndex = upsertWorkCard(workIndex, "Campaigns and series", href, card);
}
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "vermont-foodbank-volunteer-day-2026/", foodbankCard);
// Held pending written permission. Remove only the rendered cards; preserve the gallery pages and assets.
for (const href of betaPhotographyHrefs) {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  workIndex = workIndex.replace(new RegExp(`<a class="work-item"[^>]*href="${escapedHref}"[\\s\\S]*?</a\\s*>`), "");
}
workIndex = workIndex.replace(/<a class="work-item"[^>]*?href="credit-union-websites\/"\s*>[\s\S]*?<\/a\s*>/, "");
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "vsecu-website/", vsecuWebsiteCard);
workIndex = upsertWorkCard(workIndex, "Campaigns and series", "eastrise-website/", eastRiseWebsiteCard);
if (!workIndex.includes('href="green-mountain-community-fitness/"')) {
  workIndex = workIndex.replace('<section class="work-category"><h2>Client and institutional work</h2><div class="work-list">', `<section class="work-category"><h2>Client and institutional work</h2><div class="work-list">${gmcfInstitution}`);
}
workIndex = workIndex
  .replaceAll("../assets/images/work/eastrise/taylor-milk-bowl-card.webp", "../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("../assets/images/work/eastrise/photography/taylor-hoar-racing/2025-04-17_19-15-59_UTC_DIjx-o5p5N0-df7a815bc6ce.webp", "../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp")
  .replaceAll("Taylor Hoar racing at Thunder Road", "Taylor Hoar wearing her EastRise racing suit beside her race car")
  .replaceAll("../assets/images/work/blue-cross/gotr.webp", "../assets/images/work/events/girls-on-the-run-2026/dsc05132.webp")
  .replace("../assets/images/work/gmcf/sweat-heart/dsc01141.webp", "../assets/images/work/gmcf/sweat-heart-card.webp")
  .replace("../assets/images/work/gmcf/bike-fitting/dsc09620.webp", "../assets/images/work/gmcf/bike-fitting-card.webp")
  .replace("../assets/images/work/gmcf/sweat-heart/dsc01706.webp", "../assets/images/work/gmcf/gmcf-card.webp");
workIndex = workIndex.replace(
  /(<a class="work-item"[^>]*href="taylor-hoar-racing\/"[\s\S]*?)<img[\s\S]*?>/,
  '$1<img src="../assets/images/work/eastrise/photography/taylor-hoar-racing/featured-2025-dsc07501.webp" alt="Taylor Hoar seated in her EastRise race suit, holding her helmet in front of the No. 48 car" width="1800" height="2400" loading="lazy">',
);
workIndex = sortWorkSection(workIndex, "Campaigns and series", campaignOrder);
// In the refined layout these cards live inside "Projects" and refine-work
// owns their ordering; only sort when the legacy section actually exists.
if (workIndex.includes("<h2>Client and institutional work</h2>")) {
  workIndex = sortWorkSection(workIndex, "Client and institutional work", institutionalOrder);
}
workIndex = sortWorkSection(workIndex, "Earlier work", earlierWorkOrder);
await writeFile(workIndexPath, workIndex);

for (const page of pages) {
  let content = page.sections.map(([title, body]) => `<section class="case-section"><h2>${title}</h2><div class="case-section__body">${body}</div></section>`).join("");
  if (page.photoSeries) {
    content += page.photoSeries.map((series) => `<section class="case-section photo-series" aria-labelledby="${series.slug}-title"><h2 id="${series.slug}-title">${series.title}</h2><p>${series.description}</p>${series.videoId ? `<div class="video-embed photo-series__video"><iframe src="https://www.youtube-nocookie.com/embed/${series.videoId}" title="${series.title} member story" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : ""}<div class="campaign-collage" data-gallery="eastrise-${series.slug}">${series.images.map((image, index) => `<img src="${image.src}" alt="${image.alt}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" data-orientation="${image.height > image.width ? "portrait" : "landscape"}" data-series-position="${index + 1}">`).join("")}</div></section>`).join("");
  }
  if (page.gallery) {
    const galleryDirectory = join(root, "assets", "images", "work", "gmcf", page.gallery.directory);
    const images = (await readdir(galleryDirectory)).filter((file) => file.endsWith(".webp")).sort();
    const gallery = images.map((file, index) => `<img src="../../assets/images/work/gmcf/${page.gallery.directory}/${file}" alt="${page.gallery.alt}, photograph ${index + 1} of ${images.length}" loading="lazy" decoding="async">`).join("");
    content += `<section class="case-section case-section--gallery" aria-labelledby="${page.slug}-gallery"><h2 id="${page.slug}-gallery">Complete photo series</h2><div class="campaign-collage" data-gallery="${page.slug}">${gallery}</div></section>`;
  }
  if (page.socialPosts) {
    const screenshots = page.socialPosts.map((post, index) => `<img src="../../${post.screenshot}" alt="${escapeHtml(post.title)}, ${post.platform} capture ${index + 1} of ${page.socialPosts.length}" width="${post.width}" height="${post.height}" loading="lazy" decoding="async">`).join("");
    content += `<section class="case-section case-section--gallery" aria-labelledby="${page.slug}-gallery"><h2 id="${page.slug}-gallery">Selected posts</h2><p>Select any post to open the full viewer.</p><div class="campaign-collage campaign-collage--screenshots" data-gallery="${page.slug}">${screenshots}</div></section>`;
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

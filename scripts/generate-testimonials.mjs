#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const people = {
  yvonne: {
    name: "Yvonne Garand",
    role: "Former senior vice president, VSECU and EastRise",
    profile: "https://www.linkedin.com/in/yvonnegarand",
    image: "yvonne-garand.webp",
    date: "January 21, 2026"
  },
  brad: {
    name: "Brad Meerholz",
    role: "Creative executive and former Adrenaline creative director",
    profile: "https://www.linkedin.com/in/bradmeerholz",
    image: "brad-meerholz.webp",
    date: "December 25, 2025"
  },
  simeon: {
    name: "Simeon Chapin",
    role: "SVP and chief community officer, American Eagle Financial Credit Union",
    profile: "https://www.linkedin.com/in/simeonchapin",
    image: "simeon-chapin.webp",
    date: "November 5, 2025"
  },
  abigail: {
    name: "Abigail Stevenson",
    role: "Content and communications strategist, EastRise",
    profile: "https://www.linkedin.com/in/abigail-rose-stevenson",
    image: "abigail-stevenson.webp",
    date: "November 5, 2025"
  },
  stephanie: {
    name: "Stephanie Loscalzo",
    role: "Financial education program manager, EastRise",
    profile: "https://www.linkedin.com/in/stephanie-loscalzo-185652a2",
    image: "stephanie-loscalzo.webp",
    date: "January 25, 2023"
  },
  jennifer: {
    name: "Jennifer Leeson",
    role: "Senior consumer loan officer, EastRise",
    profile: "https://www.linkedin.com/in/jenniferleeson",
    image: "jennifer-leeson.webp",
    date: "January 15, 2020"
  },
  dylan: {
    name: "Dylan Woodrow",
    role: "Digital marketing specialist",
    profile: "https://www.linkedin.com/in/dylan-woodrow-0b974774",
    image: "dylan-woodrow.webp",
    date: "December 27, 2019"
  },
  rachel: {
    name: "Rachel Feldman",
    role: "Community organizer",
    profile: "https://www.linkedin.com/in/rachel-feldman-070bb515",
    image: "rachel-feldman.webp",
    date: "December 27, 2019"
  },
  heidi: {
    name: "Heidi White",
    role: "Community advocate",
    profile: "https://www.linkedin.com/in/heidiwhitevt",
    image: "heidi-white.webp",
    date: "December 19, 2019"
  },
  mitch: {
    name: "Mitch Berriman",
    role: "Owner, Berriman Web Marketing",
    profile: "https://www.linkedin.com/in/mitch-berriman",
    image: "mitch-berriman.webp",
    date: "October 25, 2019"
  },
  diana: {
    name: "Diana Clarke",
    role: "Creative strategist, EastRise",
    profile: "https://www.linkedin.com/in/dianamclarke",
    image: "diana-clarke.webp",
    date: "October 5, 2019"
  },
  jan: {
    name: "Jan Reynolds",
    role: "Author, lecturer, and photographer",
    profile: "https://www.linkedin.com/in/jan-reynolds-36012124",
    initials: "JR",
    date: "September 4, 2012"
  },
  randy: {
    name: "Randy Repass Jr.",
    role: "Founder, West Marine",
    profile: "https://www.linkedin.com/in/radmacdaddy",
    image: "randy-repass-jr.webp",
    date: "September 10, 2008"
  }
};

const portrait = (person, depth) => person.image
  ? `<a class="testimonial-card__portrait-link" href="${person.profile}" rel="noopener" aria-label="${person.name} on LinkedIn"><img src="${"../".repeat(depth)}assets/images/testimonials/${person.image}" alt="${person.name}" width="400" height="400" loading="lazy" data-no-zoom></a>`
  : `<span class="testimonial-card__initials" aria-hidden="true">${person.initials}</span>`;

const card = ({ person, quote, depth, featured = false }) => `<figure class="testimonial-card${featured ? " testimonial-card--featured" : ""}"><blockquote><p>“${quote}”</p></blockquote><figcaption>${portrait(person, depth)}<span><strong><a href="${person.profile}" rel="noopener">${person.name}</a></strong><small>${person.role}</small><a href="${person.profile}" rel="noopener">LinkedIn recommendation · ${person.date}</a></span></figcaption></figure>`;

const quotes = {
  yvonneLead: "Oliver is a rare talent, bringing energy, enthusiasm, and a true ‘can-do’ mindset to every project he takes on.",
  yvonneCreative: "His true strength lies in strategic creative content development. He has a natural eye for capturing moments through photography and videography.",
  yvonneFull: "I often describe Oliver as an ‘intrapreneur,’ someone who can independently ideate and execute with confidence and accountability, all while operating effectively within the structure of an organization.",
  bradLead: "Oliver is a true creative strategist and brand steward. He brings together strategy, photography, design thinking, and hands-on execution.",
  bradFull: "During the EastRise launch, he demonstrated a deep respect for the brand, a clear understanding of its purpose, and an exceptional ability to translate that vision into compelling, authentic creative work.",
  simeon: "Oliver built a digital practice at the credit union that was experimental, data driven, and focused on outcomes and learning for the next objective.",
  abigail: "Beyond his technical skills, Oliver is a true team player who is always ready to support others and share ideas."
};

const insertOnce = async (relative, marker, section) => {
  const path = join(root, relative);
  let html = await readFile(path, "utf8");
  if (html.includes(section.id)) return;
  html = html.replace(marker, `${section.html}${marker}`);
  await writeFile(path, html);
};

await insertOnce("index.html", '<section class="home-paths">', {
  id: "home-testimonial",
  html: `<section class="testimonial-band home-testimonial" aria-labelledby="home-testimonial-title"><div class="section-heading section-heading--standard"><h2 id="home-testimonial-title">Testimonials</h2><p class="section-heading__statement">People trust me with the stories that matter to them.</p></div>${card({ person: people.yvonne, quote: quotes.yvonneLead, depth: 0, featured: true })}</section>`
});

const aboutTestimonialsHtml = `<section class="testimonial-band about-testimonials" aria-labelledby="about-testimonials-title"><div class="section-heading section-heading--standard"><h2 id="about-testimonials-title">Testimonials</h2><p class="section-heading__statement">People who have seen the work up close.</p></div><div class="testimonial-grid">${card({ person: people.yvonne, quote: quotes.yvonneFull, depth: 1, featured: true })}${card({ person: people.brad, quote: quotes.bradFull, depth: 1 })}</div><p class="testimonial-band__more"><a class="btn btn--ghost" href="../testimonials/">View more testimonials →</a></p></section>`;
const aboutPath = join(root, "about/index.html");
let aboutHtml = await readFile(aboutPath, "utf8");
if (aboutHtml.includes("about-testimonials")) {
  aboutHtml = aboutHtml.replace(/<section class="testimonial-band about-testimonials"[\s\S]*?<\/section>(?=<section class="about-proof">)/, aboutTestimonialsHtml);
} else {
  aboutHtml = aboutHtml.replace('<section class="about-proof">', `${aboutTestimonialsHtml}<section class="about-proof">`);
}
await writeFile(aboutPath, aboutHtml);

await insertOnce("services/strategy-and-content/index.html", '<section class="service-cta">', {
  id: "strategy-testimonial",
  html: `<section class="testimonial-band strategy-testimonial" aria-label="Recommendation from Simeon Chapin">${card({ person: people.simeon, quote: quotes.simeon, depth: 2, featured: true })}</section>`
});

await insertOnce("services/photography-and-video/index.html", '<section class="service-cta">', {
  id: "photography-testimonial",
  html: `<section class="testimonial-band photography-testimonial" aria-label="Recommendation from Yvonne Garand">${card({ person: people.yvonne, quote: quotes.yvonneCreative, depth: 2, featured: true })}</section>`
});

await insertOnce("work/eastrise/index.html", "</main>", {
  id: "eastrise-testimonials",
  html: `<section class="testimonial-band eastrise-testimonials" aria-labelledby="eastrise-testimonials-title"><div class="section-heading"><p class="eyebrow">From the people behind the work</p><h2 id="eastrise-testimonials-title">Creative judgment, backed by follow-through.</h2></div><div class="testimonial-grid testimonial-grid--two">${card({ person: people.yvonne, quote: quotes.yvonneLead, depth: 2, featured: true })}${card({ person: people.brad, quote: quotes.bradLead, depth: 2 })}</div></section>`
});

await insertOnce("work/eastrise-website/index.html", '<section class="case-section website-role">', {
  id: "website-testimonial",
  html: `<section class="testimonial-band website-testimonial" aria-label="Recommendation from Brad Meerholz">${card({ person: people.brad, quote: quotes.bradFull, depth: 2, featured: true })}</section>`
});

const recommendationArchive = [
  [people.yvonne, quotes.yvonneLead, "Yvonne frequently sought Oliver out for troubleshooting beyond his formal scope."],
  [people.brad, quotes.bradFull, "Brad worked with Oliver during the EastRise brand launch while serving as a creative director at Adrenaline."],
  [people.simeon, "Oliver is a gem. His attention to detail and contribution to high functioning team culture stands out from our work together.", "Simeon worked with Oliver at VSECU."],
  [people.abigail, "Oliver is an exceptionally talented photographer, social media expert, and content creator whose creativity and professionalism allow him to shine through in every project.", "Abigail worked with Oliver at EastRise."],
  [people.stephanie, "He puts in concerted effort to ensure his videos are pristine and professional, just as the social media accounts he oversees.", "Stephanie worked with Oliver at VSECU."],
  [people.jennifer, "Oliver shares his passion of social media in the workplace with others by having a genuine interest in helping them learn.", "Jennifer worked with Oliver at VSECU."],
  [people.dylan, "He loves problems because he attacks them head on and won’t stop until a solution is found.", "Dylan worked with Oliver at VTDigger."],
  [people.rachel, "Working with him has changed our team for the better in countless ways.", "Rachel worked with Oliver at VTDigger."],
  [people.heidi, "I am struck by the breadth of his knowledge, his capacity to draw on that knowledge base to create engaging social marketing posts, and his wisdom in analyzing and improving on his work.", "Heidi worked with Oliver at VTDigger."],
  [people.mitch, "His engaging personality and knowledge of the social media and digital landscape make him a perfect fit for any social media marketing role.", "Mitch worked with Oliver at VTDigger."],
  [people.diana, "Oliver is an extremely hard-working and driven individual, who is always searching for, strategizing, and implementing new and better ideas.", "Diana worked with Oliver at VSECU."],
  [people.jan, "Oliver is very detailed and knowledgeable, has patience to explain the nuts and bolts, but likes to suggest ways to get beyond basics.", "Jan hired Oliver for consulting work."],
  [people.randy, "Oliver has shown not only a strong understanding of the use of such tools to share his knowledge, but regularly strives to offer his assistance to others in technological need.", "Randy wrote one of Oliver’s earliest professional recommendations."]
];

const fullRecommendations = new Map([
  ["Yvonne Garand", "Oliver is a rare talent, bringing energy, enthusiasm, and a true ‘can-do’ mindset to every project he takes on. During our time working together, I often sought him out for troubleshooting and problem-solving even in areas outside his formal scope because of his sharp intellect and ability to quickly absorb and apply complex information. While Oliver is versatile and multifaceted, his true strength lies in strategic creative content development. He has a natural eye for capturing moments through photography and videography, using visual storytelling to bring brand narratives to life in a way that genuinely resonates with audiences. He isn’t afraid to experiment, embraces iteration, and continuously pushes creative boundaries to elevate the work. I often describe Oliver as an ‘intrapreneur,’ someone who can independently ideate and execute with confidence and accountability, all while operating effectively within the structure of an organization. He is a valuable asset to any team looking to pair creativity with initiative and impact."],
  ["Brad Meerholz", "Oliver is a true creative strategist and brand steward. He brings together strategy, photography, design thinking, and hands-on execution in a way that feels both intentional and effortless. During the EastRise launch, he demonstrated a deep respect for the brand, a clear understanding of its purpose, and an exceptional ability to translate that vision into compelling, authentic creative work. What truly sets Oliver apart is his energy and work ethic. His enthusiasm is infectious, his attention to detail is unmatched, and his willingness to step in wherever needed makes him an invaluable collaborator. He approaches every challenge with curiosity, care, and a solutions-first mindset, all while maintaining a high bar for quality and consistency. Oliver is a true jack of all trades in the best sense of the phrase, grounded in strategy and fueled by creativity. Any company fortunate enough to hire him will gain not just a talented creative, but a passionate, thoughtful, and tireless advocate for their brand."],
  ["Simeon Chapin", "Oliver is a gem. His attention to detail and contribution to high functioning team culture stands out from our work together. Oliver built a digital practice at the credit union that was experimental, data driven, and focused on outcomes and learning for the next objective. Driven by values that build community, he is that wonderful combination of both self-reflective and bold. Oliver would be a valued asset on any team."],
  ["Abigail Stevenson", "Oliver is an exceptionally talented photographer, social media expert, and content creator whose creativity and professionalism allow him to shine through in every project. I appreciate his guidance and ability to pivot when something urgent arises. Beyond his technical skills, Oliver is a true team player who is always ready to support others and share ideas. He is a true pleasure to work with!"],
]);

const recommendationId = (name) => `recommendation-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

const archiveCards = recommendationArchive.map(([person, quote, context]) => {
  const fullRecommendationButton = fullRecommendations.has(person.name)
    ? `<button class="recommendation-entry__more" type="button" aria-haspopup="dialog" aria-controls="recommendation-dialog" data-recommendation-dialog="${recommendationId(person.name)}" aria-label="Read the full recommendation from ${person.name}">Read the full recommendation</button>`
    : "";
  const profileLink = person.profile
    ? `<a href="${person.profile}" rel="noopener">View LinkedIn profile →</a>`
    : "";
  const actions = fullRecommendationButton || profileLink
    ? `<div class="recommendation-entry__actions">${fullRecommendationButton}${profileLink}</div>`
    : "";
  return `<article class="recommendation-entry"><div class="recommendation-entry__person">${portrait(person, 1)}<div><h3>${person.name}</h3><p>${person.role}</p><small>${person.date}</small></div></div><blockquote><p>“${quote}”</p></blockquote><p class="recommendation-entry__context">${context}</p>${actions}</article>`;
}).join("");

const recommendationDialogTemplates = [...fullRecommendations.entries()].map(([name, text]) => {
  const person = recommendationArchive.find(([candidate]) => candidate.name === name)?.[0];
  return `<template id="${recommendationId(name)}"><div class="recommendation-dialog__content"><div class="recommendation-dialog__header"><p class="eyebrow">Full recommendation</p><h2 data-recommendation-dialog-title>Recommendation from ${name}</h2><p class="recommendation-dialog__meta">${person.role} · ${person.date}</p></div><blockquote><p>“${text}”</p></blockquote></div></template>`;
}).join("");

const recommendationDialog = `<dialog class="recommendation-dialog" id="recommendation-dialog" aria-label="Full recommendation"><article class="recommendation-dialog__surface"><button class="recommendation-dialog__close" type="button" aria-label="Close full recommendation">×</button><div data-recommendation-dialog-content></div></article></dialog>${recommendationDialogTemplates}`;
const testimonialsFooter = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Campaigns</h3><ul><li><a href="../work/taylor-hoar-racing/">Taylor Hoar Racing</a></li><li><a href="../work/wheels-for-warmth/">Wheels for Warmth</a></li><li><a href="../work/eastrise-writing/">EastRise Writing</a></li><li><a href="../work/community-photography/">Community Photography</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../work/">All work</a></li><li><a href="../blog/">Writing</a></li><li><a href="../about/">About</a></li><li><a href="../testimonials/" aria-current="page">Testimonials</a></li><li><a href="../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p></div></div></footer>`;
const testimonialsHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self';"><title>Testimonials | Ames Consulting</title><meta name="description" content="Public LinkedIn recommendations about Oliver Ames and his work."><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/testimonials/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../">Home</a></li><li><a href="../work/">Work</a></li><li><a href="../blog/">Writing</a></li><li><a href="../about/">About</a></li><li><a href="../testimonials/" aria-current="page">Testimonials</a></li><li><a href="../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1"><header class="page-header"><p class="eyebrow">Testimonials</p><h1>What people say after working with me.</h1><p>These public LinkedIn recommendations come from people who have worked with me across several organizations.</p></header><section class="recommendation-archive" aria-labelledby="linkedin-recommendations"><div class="section-heading"><p class="eyebrow">LinkedIn recommendations</p><h2 id="linkedin-recommendations">Public recommendations, with the person and context attached.</h2></div><div class="recommendation-grid">${archiveCards}</div></section></main>${recommendationDialog}${testimonialsFooter}<script type="module" src="../assets/js/header-scroll.js"></script><script type="module" src="../assets/js/recommendation-dialog.js"></script></body></html>`;
await mkdir(join(root, "testimonials"), { recursive: true });
await writeFile(join(root, "testimonials", "index.html"), testimonialsHtml);

const htmlFiles = ["index.html"];
for (const directory of ["about", "blog", "contact", "services", "testimonials", "work"]) {
  const entries = await readdir(join(root, directory), { recursive: true, withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && entry.name === "index.html") {
      htmlFiles.push(join(directory, entry.parentPath.slice(join(root, directory).length + 1), entry.name));
    }
  }
}
for (const relative of htmlFiles) {
  const path = join(root, relative);
  let html = await readFile(path, "utf8");
  if (html.includes('>Testimonials</a>')) continue;
  const depth = relative === "index.html" ? 0 : relative.split("/").length - 1;
  const href = `${"../".repeat(depth)}testimonials/`;
  html = html.replace(/(<a href="[^"]*about\/"[^>]*>About<\/a><\/li>)/, `$1<li><a href="${href}">Testimonials</a></li>`);
  await writeFile(path, html);
}

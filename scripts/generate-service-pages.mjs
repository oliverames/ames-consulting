#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const social = `<ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Services</h3><ul><li><a href="../strategy-and-content/">Strategy and content</a></li><li><a href="../photography-and-video/">Photography and video</a></li><li><a href="../practical-technology/">Practical technology</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p>${social}</div></div></footer>`;

const pages = [
  {
    slug: "strategy-and-content",
    title: "Strategy and content",
    intro: "The useful story usually starts with a practical question. I find that question, answer it plainly, and build a system that can keep answering it.",
    articles: [
      ["Why the useful story wins", "People rarely wake up hoping to hear from an organization. They are trying to donate old tires, understand a bill, choose a snow tire, or figure out what happens next. The work gets easier when the content starts there.", "For Wheels for Warmth, a direct guide to acceptable tires earned 65,906 views and 274 shares. It worked because people could use it."],
      ["How I build an editorial system", "A good post is helpful. A repeatable way to find, make, review, publish, and measure good posts is much more useful. I map the questions, formats, owners, and evidence before the calendar fills up.", "At EastRise, that approach supported 53 published articles and a social program that grew annual Facebook impressions by 319%."],
      ["What measurement is actually for", "The point of measurement is not to make a report look busy. It tells us whether people understood the story well enough to act, share it, or come back.", "The Taylor Hoar series connected 80 pieces of content across 22 event days. The final report showed 248,491 views and 2,847 engagement actions."],
      ["Why instructions are part of the story", "Organizations often separate useful information from brand storytelling. I think that is backwards. Helping someone do the thing is one of the clearest ways to show what an organization values.", "That is why practical explainers, financial education, and event guidance sit beside portraits and campaign films in my work."]
    ]
  },
  {
    slug: "photography-and-video",
    title: "Photography and video",
    intro: "I photograph real people doing real work. The result should feel specific to the organization, not like something pulled from the same stock library as everyone else.",
    articles: [
      ["Why real people matter", "A photograph carries information before anyone reads the caption. The room, the weather, the expression, and the slightly persnickety details of a real place all tell the viewer this actually happened.", "My EastRise and Blue Cross Vermont libraries replaced generic imagery with members, staff, board members, community events, and Vermont settings."],
      ["How I cover an event", "I start with the story the event needs to tell, then make room for the moments nobody could schedule. Establishing photographs explain the place. Details show the work. People give it a reason to matter.", "That approach has covered press conferences, road races, workplace wellness events, tire collections, soccer matches, and race days at Thunder Road."],
      ["What makes a portrait system work", "Consistency matters because the photographs need to live together. Humanity matters because the people should still look like themselves. The lighting and framing can repeat without turning everyone into a template.", "I used that balance for leadership, board, and staff portraits across EastRise and Blue Cross Vermont."],
      ["Why video needs a clear point", "A beautiful video can still leave people wondering what they watched. I decide what the viewer should understand first, then build the interview, visuals, pacing, and distribution around that answer.", "Flight Paths and the EastRise member films use individual lives to explain a larger organization without making the organization the main character."]
    ]
  },
  {
    slug: "practical-technology",
    title: "Practical technology",
    intro: "Technology should remove friction from the work. I fix the path, document what changed, and leave the people using it with something they can actually maintain.",
    articles: [
      ["Why I start with the bottleneck", "A new tool is not automatically an improvement. I look for the repeated manual step, the missing handoff, the broken measurement, or the part everyone quietly works around.", "Sometimes the fix is code. Sometimes it is a better form, a naming convention, or deleting one unnecessary step."],
      ["How quality assurance protects the story", "A website can have good writing and still fail because the link is broken, the image is wrong, or the checkout makes people work too hard. Quality assurance is part of communication because the experience changes what the words mean.", "I supported the VSECU and EastRise PixelSpoke redesigns through content migration, extensive QA, image curation, photography, and coding support."],
      ["Where small automation helps", "The best automation handles the dull, repeatable part and leaves judgment with the person who understands the work. It should be easy to see what happened and easy to take over when something changes.", "I build small tools for content intake, reporting, asset organization, publishing checks, and the other invisible work behind a dependable public site."],
      ["Why accessible foundations matter", "Accessibility, performance, security, and clear forms are not finishing touches. They decide whether the thing works for the person who showed up.", "This site is tested across its public routes for critical accessibility issues, valid structure, and the interactions people rely on."]
    ]
  }
];

for (const page of pages) {
  const body = page.articles.map(([title, why, example]) => `<article class="service-article"><h2>${title}</h2><p>${why}</p><p>${example}</p></article>`).join("");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${page.title} | Ames Consulting</title><meta name="description" content="How Oliver Ames approaches ${page.title.toLowerCase()}."><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/services/${page.slug}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" tabindex="-1"><header class="page-header service-header"><p class="eyebrow">What I do</p><h1>${page.title}</h1><p>${page.intro}</p></header><section class="service-articles" aria-label="Articles about ${page.title.toLowerCase()}">${body}</section><section class="service-cta"><h2>Have a project that needs this?</h2><a class="btn btn--primary" href="../../contact/">Tell me about it →</a></section></main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;
  const output = join(root, "services", page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

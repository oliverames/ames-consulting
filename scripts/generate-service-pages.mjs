#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SERVICES, SERVICE_TITLES } from "./site-taxonomy.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const social = `<ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul>`;
const serviceFooterLinks = SERVICES.map(({ slug, title }) => `<li><a href="../${slug}/">${title}</a></li>`).join("");
const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Services</h3><ul>${serviceFooterLinks}</ul></div><div><h3>Company</h3><ul><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p>${social}</div></div></footer>`;

const pages = [
  {
    slug: "strategy-and-content",
    title: SERVICE_TITLES["strategy-and-content"],
    kicker: "I plan, write, publish, and measure content.",
    intro: "I plan and write content for organizations with complicated work to explain. I start with the question a reader is trying to answer, then decide what to make and how to measure it.",
    proof: { value: "319%", label: "year-over-year impression growth", href: "../../work/eastrise-social/", action: "See the social program →" },
    sections: [
      {
        eyebrow: "The starting point",
        title: "The reader’s question",
        paragraphs: [
          "A request may arrive as a campaign, an article, or a content calendar. I start by finding out what the reader is trying to do. For Wheels for Warmth, people needed to know which tires they could donate and where to bring them. A direct guide earned 65,906 views and 274 shares.",
          "Once I know the question, I can choose the writing, photographs, format, and distribution around it."
        ]
      },
      {
        eyebrow: "The process",
        title: "An editorial plan the team can maintain",
        paragraphs: [
          "I list the recurring questions, the people who can answer them, the formats, the owners, and the publishing dates. The team can then make the next piece without rebuilding the plan each time.",
          "At VSECU, now EastRise, this approach supported 53 published financial education articles. It also helped grow annual Facebook impressions by 319%."
        ]
      }
    ],
    projects: [
      ["Wheels for Warmth", "Donation instructions, reminders, photography, and campaign reporting.", "../../work/wheels-for-warmth/"],
      ["EastRise Writing", "Fifty-three published financial education articles.", "../../work/eastrise-writing/"],
      ["Taylor Hoar Racing", "A season of racing coverage measured across 80 pieces of content.", "../../work/taylor-hoar-racing/"]
    ],
  },
  {
    slug: "photography-and-video",
    title: SERVICE_TITLES["photography-and-video"],
    kicker: "I photograph people, places, events, and work in progress.",
    intro: "Most of my photography happens on location with people who are busy doing something. I plan the shot list and lighting, but I leave room for the moments nobody could schedule.",
    proof: { value: "500+", label: "photographs in current public galleries", href: "../../work/", action: "Browse the galleries →" },
    sections: [
      {
        eyebrow: "On location",
        title: "Planning an on-location shoot",
        paragraphs: [
          "Before a shoot, I work out where we are, what’s happening, and who needs to be in the final set. That gives me a shot list and enough flexibility to follow the day.",
          "I’ve used this approach at volunteer days, family sessions, public art installations, tire collections, and race days at Thunder Road. I deliver a selection for websites, print, social media, and future projects."
        ]
      },
      {
        eyebrow: "Portraits and film",
        title: "Portraits and documentary film",
        paragraphs: [
          "A portrait library needs enough consistency to work across a website, annual report, and LinkedIn. I made the EastRise library with one repeatable lighting and backdrop setup.",
          "For video, I start with what the viewer needs to understand. Flight Paths and the EastRise member films use one person’s experience to explain a larger organization."
        ]
      }
    ],
    projects: [
      ["Vermont Foodbank Volunteer Day", "A volunteer packing day photographed from the group portrait through the production line.", "../../work/vermont-foodbank-volunteer-day-2026/"],
      ["EastRise Portraits", "Eighteen leadership portraits and 24 additional formal portraits in one public library.", "../../work/eastrise-portraits/"],
      ["Giron Family Portrait Sessions", "Three complete family sessions organized by shoot.", "../../work/giron-family/"]
    ],
  },
  {
    slug: "practical-technology",
    title: SERVICE_TITLES["practical-technology"],
    kicker: "I work on websites, forms, analytics, automations, and software.",
    intro: "I work on websites, forms, analytics, and small automations when the problem sits behind what the public sees. I’m usually looking for a repeated manual step or broken path that everyone has learned to tolerate.",
    proof: { value: "8", label: "public website and software projects", href: "../../work/", action: "See the projects →" },
    sections: [
      {
        eyebrow: "The diagnosis",
        title: "Start with the repeated problem",
        paragraphs: [
          "I look for the manual step people repeat, the handoff that gets missed, the measurement that stopped working, or the form everyone complains about. I may write code, change the content, or remove an unnecessary step.",
          "The people who use the system should be able to understand what changed and maintain it."
        ]
      },
      {
        eyebrow: "The public side",
        title: "Check the path from one page to the next",
        paragraphs: [
          "A page can be well written and still fail when a link is broken, an image is wrong, or a form is hard to use. I check accessibility, performance, content, and the path between pages together.",
          "For the VSECU and EastRise PixelSpoke redesigns, I worked on content migration, quality assurance, image direction, photography, and coding support."
        ]
      }
    ],
    projects: [
      ["Credit Union Website Projects", "My role in the VSECU and EastRise website projects.", "../../work/credit-union-websites/"],
      ["EastRise Social", "A dated archive of social posts, publishing, and performance reports.", "../../work/eastrise-social/"],
      ["Live Broadcasts", "Public programs and employee broadcasts that I hosted and produced.", "../../work/live-broadcasts/"]
    ],
  }
];

const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

for (const page of pages) {
  const sections = page.sections.map((section, index) => `<article class="service-story"><div class="service-story__number" aria-hidden="true">0${index + 1}</div><div class="service-story__copy"><p class="eyebrow">${section.eyebrow}</p><h2>${section.title}</h2>${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div></article>`).join("");
  const questions = {
    "strategy-and-content": [
      ["What does a content strategy project include?", "I start with the questions people already ask. Then I plan who will write, photograph, publish, own, and measure each part."],
      ["Can you run the campaign as well as plan it?", "Yes. I can write, photograph, publish, check the finished work, and report on what happened."],
      ["Where do you work?", "I’m based in Montpelier and work with organizations across Vermont. I’ll travel farther for the right project."]
    ],
    "photography-and-video": [
      ["What kind of commercial photography do you do?", "I photograph people at work, portraits, public events, campaigns, community programs, and documentary projects. I deliver a set that clients can use beyond one launch day."],
      ["Do you photograph on location?", "Yes. Most of my work happens where people already work, gather, build, race, or volunteer. I bring a plan and stay flexible when the day changes."],
      ["Do you also produce video?", "Yes. I produce interviews, documentary profiles, campaign films, and event video. I can also plan the content around the finished video."],
      ["Where are you available?", "I’m based in Montpelier and work across Vermont. I’m also available elsewhere in New England when the project calls for it."]
    ],
    "practical-technology": [
      ["What kinds of digital systems do you work on?", "I work on websites, accessibility, analytics, forms, content operations, small automations, and open-source software."],
      ["Can you improve an existing website instead of replacing it?", "Often, yes. I start with the bottleneck. The fix may be better content, repaired analytics, a simpler path, or a small piece of code instead of a full rebuild."],
      ["Who is this work for?", "I work best with Vermont organizations that need one experienced person who can understand the public message and the technology behind it."]
    ]
  };
  const projectCards = page.projects.map(([title, summary, href]) => `<a class="service-project" href="${href}"><h3>${title}</h3><p>${summary}</p><span class="service-project__link">See the project <span aria-hidden="true">→</span></span></a>`).join("");
  const answerCards = questions[page.slug].map(([question, answer]) => `<article class="service-answer"><h3>${question}</h3><p>${answer}</p></article>`).join("");
  const testimonial = page.slug === "photography-and-video" ? `<figure class="testimonial-card testimonial-card--featured photography-testimonial"><blockquote><p>“His true strength lies in strategic creative content development. He has a natural eye for capturing moments through photography and videography.”</p></blockquote><figcaption><img src="../../assets/images/testimonials/yvonne-garand.webp" alt="Yvonne Garand" width="400" height="400" loading="lazy" data-no-zoom><span><strong>Yvonne Garand</strong><small>Former senior vice president, VSECU and EastRise</small><a href="https://www.linkedin.com/in/yvonnegarand" rel="noopener">LinkedIn recommendation · January 21, 2026</a></span></figcaption></figure>` : "";
  const projects = `${projectCards}<div class="service-answer-heading"><p class="eyebrow">Before we start</p><h3>Common questions</h3></div>${answerCards}${testimonial}`;
  const contactHref = `../../contact/?project=${encodeURIComponent(page.title)}#contact-form`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${page.title} | Ames Consulting</title><meta name="description" content="${escapeAttribute(page.intro)}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/services/${page.slug}/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" class="service-page" tabindex="-1"><header class="service-hero"><div class="service-hero__mesh" aria-hidden="true"></div><div class="service-hero__copy"><p class="hero__eyebrow"><span class="hero__dot" aria-hidden="true"></span>What I do</p><h1>${page.title}</h1><p class="service-hero__kicker">${page.kicker}</p><p class="service-hero__intro">${page.intro}</p><div class="service-hero__actions"><a class="btn btn--primary" href="${contactHref}">Send me a note →</a><a class="btn btn--ghost" href="#selected-work">See related work</a></div></div><a class="service-proof" href="${page.proof.href}"><strong>${page.proof.value}</strong><span>${page.proof.label}</span><small>${page.proof.action}</small></a></header><section class="service-stories" aria-label="How I approach ${page.title.toLowerCase()}">${sections}</section><section class="service-projects" id="selected-work" aria-labelledby="service-projects-title"><div class="section-heading"><p class="eyebrow">Selected work</p><h2 id="service-projects-title">Projects related to this service</h2></div><div class="service-projects__grid">${projects}</div></section><section class="service-cta"><div><p class="eyebrow">Have something in mind?</p><h2>Tell me what you’re working on.</h2><p>Send me the short version, including what you’re making and where you need help.</p></div><a class="btn btn--primary" href="${contactHref}">Send me a note →</a></section></main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;
  const output = join(root, "services", page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

const serviceBySlug = new Map(pages.map((page) => [page.slug, page]));
const indexCards = SERVICES.map(({ slug, title }) => {
  const page = serviceBySlug.get(slug);
  if (!page) throw new Error(`Missing service page data for ${slug}.`);
  return `<a class="service-project" href="./${slug}/"><h3>${title}</h3><p>${page.intro}</p><span class="service-project__link">Read about this work <span aria-hidden="true">→</span></span></a>`;
}).join("");
const indexHtml = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>Services | Ames Consulting</title><meta name="description" content="Photography, content strategy, and practical technology services from Oliver Ames in Montpelier, Vermont."><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/services/"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../">Home</a></li><li><a href="../work/">Work</a></li><li><a href="./" aria-current="page">Services</a></li><li><a href="../blog/">Writing</a></li><li><a href="../about/">About</a></li><li><a href="../testimonials/">Testimonials</a></li><li><a href="../contact/">Contact</a></li></ul></nav></header><main id="main-content" class="service-page service-index-page" tabindex="-1"><header class="service-hero service-hero--index"><div class="service-hero__mesh" aria-hidden="true"></div><div class="service-hero__copy"><p class="hero__eyebrow"><span class="hero__dot" aria-hidden="true"></span>What I do</p><h1>Three ways I can help.</h1><p class="service-hero__kicker">Most projects use more than one.</p><p class="service-hero__intro">I photograph people and work, plan and write content, and build or repair the websites and systems behind it.</p><div class="service-hero__actions"><a class="btn btn--primary" href="../contact/">Send me a note →</a><a class="btn btn--ghost" href="../work/">See my work</a></div></div></header><section class="service-projects" aria-labelledby="service-index-title"><div class="section-heading"><p class="eyebrow">Services</p><h2 id="service-index-title">Choose a starting point.</h2></div><div class="service-projects__grid">${indexCards}</div></section></main><footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h2>Services</h2><ul>${SERVICES.map(({ slug, title }) => `<li><a href="./${slug}/">${title}</a></li>`).join("")}</ul></div><div><h2>Company</h2><ul><li><a href="../work/">All work</a></li><li><a href="../blog/">Writing</a></li><li><a href="../about/">About</a></li><li><a href="../testimonials/">Testimonials</a></li><li><a href="../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is my photography and communications practice in Montpelier, Vermont. I also build websites and apps when a project needs them.</p>${social}</div></div></footer><script type="module" src="../assets/js/header-scroll.js"></script></body></html>`;
await writeFile(join(root, "services", "index.html"), indexHtml);

#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const social = `<ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li><li><a href="https://oliverames.micro.blog/" rel="me noopener">Micro.blog</a></li><li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li><li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li><li><a href="https://www.threads.com/@oliverames" rel="me noopener">Threads</a></li><li><a href="https://www.instagram.com/oliverames/" rel="me noopener">Instagram</a></li></ul>`;
const footer = `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Services</h3><ul><li><a href="../strategy-and-content/">Strategy and content</a></li><li><a href="../photography-and-video/">Photography and video</a></li><li><a href="../practical-technology/">Practical technology</a></li></ul></div><div><h3>Company</h3><ul><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p>${social}</div></div></footer>`;

const pages = [
  {
    slug: "strategy-and-content",
    title: "Strategy and content",
    kicker: "Make the useful thing easier to understand.",
    intro: "Most people are not waiting to hear from an organization. They are trying to solve a problem, make a decision, or figure out what happens next. I start there, then build the editorial system that keeps the answer useful after one good post.",
    proof: { value: "319%", label: "year-over-year impression growth", href: "../../work/eastrise/" },
    sections: [
      {
        eyebrow: "The starting point",
        title: "Find the question hiding inside the assignment.",
        paragraphs: [
          "A request for a campaign, article, or content calendar usually arrives with a practical question buried inside it. For Wheels for Warmth, people needed to know which tires could be donated and where to bring them. A direct guide to acceptable tires earned 65,906 views and 274 shares because it gave people an answer they could use.",
          "That is the kind of specificity I am after. Once the question is clear, the writing, photography, format, and distribution have a job to do."
        ]
      },
      {
        eyebrow: "The system",
        title: "Give good work a way to repeat itself.",
        paragraphs: [
          "One useful post can disappear as quickly as it arrived. I map the recurring questions, the people who can answer them, the formats that fit, and the evidence we will use to judge the result. Then the calendar reflects actual needs instead of becoming a blank grid everyone has to feed.",
          "At EastRise, that approach supported 53 published financial education articles and a social program that grew annual Facebook impressions by 319%. The numbers mattered because they showed which explanations people returned to, shared, and acted on."
        ]
      }
    ],
    projects: [
      ["Wheels for Warmth", "A public-service campaign built around clear donation instructions.", "../../work/wheels-for-warmth/"],
      ["EastRise Writing", "Fifty-three articles that made financial subjects easier to use.", "../../work/eastrise-writing/"],
      ["Taylor Hoar Racing", "A season-long story measured across 80 pieces of content.", "../../work/taylor-hoar-racing/"]
    ],
    contactProject: "Strategy and content"
  },
  {
    slug: "photography-and-video",
    title: "Photography and video",
    kicker: "Show the people who make the work real.",
    intro: "I photograph people as themselves, in places that belong to the story. The lighting can be consistent and the production can be careful without sanding away the details that make a person or organization recognizable.",
    proof: { value: "240+", label: "event photographs in current public galleries", href: "../../work/" },
    sections: [
      {
        eyebrow: "On location",
        title: "Plan enough to notice what was never on the schedule.",
        paragraphs: [
          "Before an event, I work out what the photographs need to explain: where we are, what is happening, and who is doing the work. That gives me a structure. It also leaves room for the expression, small gesture, or odd Vermont weather that makes the final set feel like this event instead of any event.",
          "I have used that approach at press conferences, road races, workplace events, tire collections, family sessions, and race days at Thunder Road. Each shoot becomes a useful library, not a folder with one hero image and a hundred near-duplicates."
        ]
      },
      {
        eyebrow: "Portraits and film",
        title: "Consistency should help people look like themselves.",
        paragraphs: [
          "A portrait system needs enough visual consistency to work across a website, annual report, and LinkedIn. The person still has to be there. I built separate portrait libraries for EastRise and Blue Cross Vermont around that balance.",
          "Video starts with the same discipline. I decide what the viewer should understand, then shape the interview, visuals, pacing, and distribution around it. Flight Paths and the EastRise member films explain the organization through individual lives, which is where the interesting part usually is."
        ]
      }
    ],
    projects: [
      ["EastRise Portraits", "Leadership, board, and staff portraits made as one coherent library.", "../../work/eastrise-portraits/"],
      ["Blue Cross Portraits", "A separate portrait collection for Blue Cross Vermont.", "../../work/blue-cross-portraits/"],
      ["Giron Family", "A fall family session designed as a complete, browsable gallery.", "../../work/giron-family-fall-2025/"]
    ],
    contactProject: "Photography and video"
  },
  {
    slug: "practical-technology",
    title: "Practical technology",
    kicker: "Fix the path behind the public experience.",
    intro: "I like technology when it removes friction from useful work. That might mean rebuilding a website path, automating a dull handoff, or documenting the system that only one person knows how to operate.",
    proof: { value: "2", label: "credit union websites rebuilt with PixelSpoke", href: "../../work/credit-union-websites/" },
    sections: [
      {
        eyebrow: "The diagnosis",
        title: "Start with the part everyone quietly works around.",
        paragraphs: [
          "A new tool is not automatically an improvement. I look for the repeated manual step, the missing handoff, the broken measurement, or the form that makes a simple task feel like paperwork. Sometimes the answer is code. Sometimes it is a naming convention or one unnecessary step that can finally go away.",
          "The goal is a system people can understand and maintain. If the fix creates a new mystery, it is not finished."
        ]
      },
      {
        eyebrow: "The public side",
        title: "The experience changes what the words mean.",
        paragraphs: [
          "A website can have clear writing and still fail when the link is broken, the image is wrong, or the form asks people to fight it. I treat quality assurance, accessibility, performance, and content as parts of the same public experience.",
          "For the VSECU and EastRise PixelSpoke redesigns, my work included content migration, extensive quality assurance, image direction, photography, and coding support. The useful story still needed a dependable way to reach someone."
        ]
      }
    ],
    projects: [
      ["Credit Union Website Redesigns", "The VSECU and EastRise rebuilds, with the work and source trail attached.", "../../work/credit-union-websites/"],
      ["EastRise Social", "The editorial, publishing, and measurement system behind six years of social work.", "../../work/eastrise-social/"],
      ["Live Broadcasts", "Production systems that brought major public programs to more than 10,000 viewers.", "../../work/live-broadcasts/"]
    ],
    contactProject: "Website or digital system"
  }
];

const escapeAttribute = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

for (const page of pages) {
  const sections = page.sections.map((section, index) => `<article class="service-story"><div class="service-story__number" aria-hidden="true">0${index + 1}</div><div class="service-story__copy"><p class="eyebrow">${section.eyebrow}</p><h2>${section.title}</h2>${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div></article>`).join("");
  const questions = {
    "strategy-and-content": [
      ["What does a content strategy project include?", "I start with the questions people are already asking, then map the writing, photography, publishing, ownership, and measurement needed to answer them consistently."],
      ["Can you run the campaign as well as plan it?", "Yes. I can move from the plan into writing, photography, social publishing, quality assurance, and reporting, so the strategy stays connected to the work people actually see."],
      ["Where do you work?", "I am based in Montpelier and work with organizations across Vermont. I can travel farther when the project makes sense."]
    ],
    "photography-and-video": [
      ["What kind of commercial photography do you do?", "I photograph people at work, corporate and leadership portraits, public events, campaigns, community programs, and documentary stories. The goal is a complete image library that can keep working after launch day."],
      ["Do you photograph on location?", "Yes. Most of my work happens in the places where people actually work, gather, build, race, volunteer, or make decisions. I bring a plan and enough flexibility to notice what the schedule missed."],
      ["Do you also produce video?", "Yes. I produce interviews, documentary profiles, campaign films, and event video, and I can connect the production to the surrounding content and distribution plan."],
      ["Where are you available?", "I am based in Montpelier and available for commercial photography and video across Vermont and elsewhere in New England when the project calls for it."]
    ],
    "practical-technology": [
      ["What kinds of digital systems do you work on?", "Websites, accessibility, analytics, forms, content operations, small automations, and software that removes a repeated manual step. I also build and maintain open-source tools."],
      ["Can you improve an existing website instead of replacing it?", "Often, yes. I start with the bottleneck and the evidence. The useful fix may be a clearer path, better content, repaired measurement, or a small piece of code rather than a full rebuild."],
      ["Who is this work for?", "I work best with Vermont organizations that need a senior generalist who can understand the public message and the system carrying it."]
    ]
  };
  const projectCards = page.projects.map(([title, summary, href]) => `<a class="service-project" href="${href}"><span class="service-project__arrow" aria-hidden="true">↗</span><h3>${title}</h3><p>${summary}</p><span class="service-project__link">See the project</span></a>`).join("");
  const answerCards = questions[page.slug].map(([question, answer]) => `<article class="service-answer"><h3>${question}</h3><p>${answer}</p></article>`).join("");
  const testimonial = page.slug === "photography-and-video" ? `<figure class="testimonial-card testimonial-card--featured photography-testimonial"><blockquote><p>“His true strength lies in strategic creative content development. He has a natural eye for capturing moments through photography and videography.”</p></blockquote><figcaption><img src="../../assets/images/testimonials/yvonne-garand.webp" alt="Yvonne Garand" width="800" height="800" loading="lazy" data-no-zoom><span><strong>Yvonne Garand</strong><small>Former senior vice president, VSECU and EastRise</small><a href="https://www.linkedin.com/in/yvonnegarand" rel="noopener">LinkedIn recommendation · January 21, 2026</a></span></figcaption></figure>` : "";
  const projects = `${projectCards}<div class="service-answer-heading"><p class="eyebrow">The practical questions</p><h3>What to expect.</h3></div>${answerCards}${testimonial}`;
  const contactHref = `../../contact/?project=${encodeURIComponent(page.contactProject)}#contact-form`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${page.title} | Ames Consulting</title><meta name="description" content="${escapeAttribute(page.intro)}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/services/${page.slug}/"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../../work/">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" class="service-page" tabindex="-1"><header class="service-hero"><div class="service-hero__mesh" aria-hidden="true"></div><div class="service-hero__copy"><p class="hero__eyebrow"><span class="hero__dot" aria-hidden="true"></span>What I do</p><h1>${page.title}</h1><p class="service-hero__kicker">${page.kicker}</p><p class="service-hero__intro">${page.intro}</p><div class="service-hero__actions"><a class="btn btn--primary" href="${contactHref}">Start a conversation →</a><a class="btn btn--ghost" href="#selected-work">See related work</a></div></div><a class="service-proof" href="${page.proof.href}"><strong>${page.proof.value}</strong><span>${page.proof.label}</span><small>See the source →</small></a></header><section class="service-stories" aria-label="How I approach ${page.title.toLowerCase()}">${sections}</section><section class="service-projects" id="selected-work" aria-labelledby="service-projects-title"><div class="section-heading"><p class="eyebrow">Selected work</p><h2 id="service-projects-title">See how this works in practice.</h2></div><div class="service-projects__grid">${projects}</div></section><section class="service-cta"><div><p class="eyebrow">Have something in mind?</p><h2>Tell me what you are trying to make clearer.</h2><p>A useful first message can be short. Tell me what you are making and where it is getting stuck.</p></div><a class="btn btn--primary" href="${contactHref}">Start a conversation →</a></section></main>${footer}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;
  const output = join(root, "services", page.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

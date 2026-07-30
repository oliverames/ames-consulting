#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const root = join(import.meta.dirname, "..");
const siteUrl = "https://ames.consulting";
const defaultImage = `${siteUrl}/assets/images/about/oliver-ames-profile.webp`;

const overrides = {
  "/": {
    title: "Ames Consulting | Vermont Commercial Photographer and Strategist",
    description: "Documentary commercial photography, video, content strategy, and practical technology for Vermont organizations, from Oliver Ames in Montpelier."
  },
  "/services/photography-and-video/": {
    title: "Commercial Photography and Video in Vermont | Oliver Ames",
    description: "Documentary workplace photography, corporate portraits, event coverage, and video production for Vermont organizations. See complete galleries and campaign work."
  },
  "/services/strategy-and-content/": {
    title: "Content Strategy and Campaigns in Vermont | Oliver Ames",
    description: "Content strategy, campaign planning, writing, social media, and measurement for Vermont organizations with useful work to explain."
  },
  "/services/practical-technology/": {
    title: "Websites, Automation, and Digital Systems in Vermont | Oliver Ames",
    description: "Practical website, accessibility, analytics, automation, and software work for Vermont organizations that need clearer, maintainable digital systems."
  },
  "/work/": {
    title: "Vermont Photography, Video, and Campaign Work | Oliver Ames",
    description: "Commercial photography, portraits, events, video, campaigns, websites, and software by Montpelier-based photographer and strategist Oliver Ames."
  },
  "/work/credit-union-websites/": {
    title: "Credit Union Website Projects | Oliver Ames",
    description: "Separate VSECU and EastRise website projects covering content, photography, migration, implementation, and quality assurance."
  },
  "/work/vsecu-website/": {
    title: "VSECU Website Redesign | Oliver Ames",
    description: "Oliver Ames's content, photography, migration, implementation, and quality-assurance role in the 2021 VSECU website redesign."
  },
  "/work/eastrise-website/": {
    title: "EastRise Website Launch | Oliver Ames",
    description: "Oliver Ames's content, photography, migration, implementation, and quality-assurance role in the 2024 EastRise website launch."
  },
  "/about/": {
    title: "Oliver Ames | Vermont Photographer, Strategist, and Developer",
    description: "Meet Oliver Ames, a Montpelier-based commercial photographer, content strategist, video producer, and software developer working across Vermont."
  },
  "/contact/": {
    title: "Contact a Vermont Commercial Photographer | Oliver Ames",
    description: "Contact Oliver Ames about commercial photography, corporate portraits, event coverage, video, content strategy, or practical technology work in Vermont."
  },
  "/blog/": {
    title: "Writing by Oliver Ames | Vermont Photography, Technology, and Work",
    description: "Essays and notes from Oliver Ames about photography, communications, technology, Vermont organizations, and the systems behind useful work."
  },
  "/testimonials/": {
    title: "Client and Colleague Recommendations | Oliver Ames",
    description: "Recommendations and performance feedback about Oliver Ames's photography, creative strategy, problem-solving, initiative, and collaboration."
  },
  "/blog/the-sunshine-trail-a-speculative-brand-campaign-for-lawsons-finest-liquids/": {
    title: "The Sunshine Trail Brand Campaign | Oliver Ames",
    description: "A speculative Vermont brand campaign by Oliver Ames, with an interactive route, community stories, impact data, and a practical marketing system."
  }
};

const decodeEntities = (value) => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", "\"")
  .replaceAll("&#39;", "'")
  .replaceAll("&nbsp;", " ");

const text = (html = "") => decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
const attr = (value = "") => value.replaceAll("&", "&amp;").replaceAll("\"", "&quot;");
const json = (value) => JSON.stringify(value).replaceAll("<", "\\u003c");

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", ".git", "_site"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name === "index.html") files.push(path);
  }
  return files;
}

function routeFor(file) {
  const rel = relative(root, file).split(sep).join("/");
  return rel === "index.html" ? "/" : `/${rel.replace(/index\.html$/, "")}`;
}

function imageFor(html) {
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  if (!match) return defaultImage;
  try { return new URL(match[1], siteUrl).toString(); } catch { return defaultImage; }
}

function metadataFor(route, html) {
  const h1 = text(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "Oliver Ames");
  const oldDescription = html.match(/<meta\s+name="description"\s+content="([^"]*)"\s*\/?>/i)?.[1];
  const slug = route.split("/").filter(Boolean).at(-1) || "home";
  const slugTitle = slug.split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(" ")
    .replaceAll("Eastrise", "EastRise").replaceAll("Vtdigger", "VTDigger").replaceAll("Ynab", "YNAB").replaceAll("Mcp", "MCP").replaceAll("Beta", "BETA");
  const fallbackTitle = route.startsWith("/work/") ? `${slugTitle} | Work by Oliver Ames` : `${h1} | Oliver Ames`;
  const rawDescription = (overrides[route]?.description || oldDescription || `${h1.replace(/[.!?]+$/, "")}. Photography, content, video, and technology work by Oliver Ames in Vermont.`).replaceAll("..", ".");
  const description = rawDescription.length <= 165 ? rawDescription : `${rawDescription.slice(0, 162).replace(/\s+\S*$/, "")}…`;
  return {
    title: overrides[route]?.title || fallbackTitle,
    description
  };
}

function breadcrumbs(route, title) {
  if (route === "/") return [];
  const parts = route.split("/").filter(Boolean);
  const names = { work: "Work", services: "Services", blog: "Writing", about: "About", contact: "Contact", testimonials: "Testimonials" };
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` }];
  parts.forEach((part, index) => {
    const path = `/${parts.slice(0, index + 1).join("/")}/`;
    items.push({ "@type": "ListItem", position: index + 2, name: index === parts.length - 1 ? title.split(" | ")[0] : (names[part] || part), item: `${siteUrl}${path}` });
  });
  return items;
}

function graphFor(route, metadata, image) {
  const canonical = `${siteUrl}${route}`;
  const person = {
    "@type": "Person", "@id": `${siteUrl}/#oliver-ames`, name: "Oliver Ames", url: `${siteUrl}/about/`, image: defaultImage,
    jobTitle: ["Commercial Photographer", "Content Strategist", "Software Developer"],
    address: { "@type": "PostalAddress", addressLocality: "Montpelier", addressRegion: "VT", addressCountry: "US" },
    sameAs: ["https://github.com/oliverames", "https://www.linkedin.com/in/oliverames", "https://oliverames.micro.blog/", "https://mastodon.social/@oliverames", "https://bsky.app/profile/oliverames.bsky.social", "https://www.instagram.com/oliverames/"]
  };
  const organization = {
    "@type": "ProfessionalService", "@id": `${siteUrl}/#ames-consulting`, name: "Ames Consulting", url: `${siteUrl}/`, founder: { "@id": person["@id"] },
    areaServed: { "@type": "State", name: "Vermont" },
    knowsAbout: ["Commercial photography", "Workplace photography", "Corporate portraits", "Event photography", "Video production", "Content strategy", "Digital communications", "Web accessibility", "Software development"]
  };
  const pageType = route.startsWith("/blog/") && route !== "/blog/" ? "BlogPosting" : route.startsWith("/work/") && route !== "/work/" ? "CreativeWork" : route.startsWith("/services/") ? "Service" : route === "/about/" ? "ProfilePage" : "WebPage";
  const page = {
    "@type": pageType, "@id": `${canonical}#page`, url: canonical, name: metadata.title, description: metadata.description, image,
    inLanguage: "en-US", isPartOf: { "@id": `${siteUrl}/#website` }, author: { "@id": person["@id"] }
  };
  if (pageType === "Service") {
    page.provider = { "@id": organization["@id"] };
    page.areaServed = { "@type": "State", name: "Vermont" };
  }
  const graph = [
    { "@type": "WebSite", "@id": `${siteUrl}/#website`, url: `${siteUrl}/`, name: "Oliver Ames", alternateName: "Ames Consulting", publisher: { "@id": organization["@id"] }, inLanguage: "en-US" },
    person, organization, page
  ];
  const crumbs = breadcrumbs(route, metadata.title);
  if (crumbs.length) graph.push({ "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumbs`, itemListElement: crumbs });
  return { "@context": "https://schema.org", "@graph": graph };
}

function replaceOrAdd(head, pattern, markup) {
  return pattern.test(head) ? head.replace(pattern, markup) : `${head}${markup}`;
}

for (const file of await htmlFiles(root)) {
  const route = routeFor(file);
  let html = await readFile(file, "utf8");
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) continue;
  const metadata = metadataFor(route, html);
  const canonical = `${siteUrl}${route}`;
  const image = imageFor(html);
  let head = headMatch[1];
  head = replaceOrAdd(head, /<title>[\s\S]*?<\/title>/i, `<title>${attr(metadata.title)}</title>`);
  head = replaceOrAdd(head, /<meta name="description" content="[^"]*">/i, `<meta name="description" content="${attr(metadata.description)}">`);
  head = replaceOrAdd(head, /<meta name="robots" content="[^"]*">/i, '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">');
  head = replaceOrAdd(head, /<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonical}">`);
  if (route === "/" && !head.includes("HTxwL3I-JCGChYJ8VI-L6OO_au7B4873z3bWuYMBYro.woff2")) {
    const fontPreloads = '<link rel="preload" href="https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4873z3bWuYMBYro.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuYMBYro.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7I_FMl_E.woff2" as="font" type="font/woff2" crossorigin>';
    head = head.replace(/(<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>)/i, `$1${fontPreloads}`);
  }
  head = head.replace(/<meta property="og:[^"]+" content="[^"]*">/gi, "").replace(/<meta name="twitter:[^"]+" content="[^"]*">/gi, "").replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");
  head += `<meta property="og:site_name" content="Oliver Ames"><meta property="og:locale" content="en_US"><meta property="og:type" content="${route.startsWith("/blog/") && route !== "/blog/" ? "article" : "website"}"><meta property="og:title" content="${attr(metadata.title)}"><meta property="og:description" content="${attr(metadata.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${attr(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${attr(metadata.title)}"><meta name="twitter:description" content="${attr(metadata.description)}"><meta name="twitter:image" content="${attr(image)}"><script type="application/ld+json">${json(graphFor(route, metadata, image))}</script>`;
  html = html.replace(headMatch[0], `<head>${head}</head>`).replace(/[ \t]+$/gm, "");
  if (route === "/") {
    html = html.replace(/\s*<script(?: type="module")? src="\.\/assets\/js\/hero-headline\.js"><\/script>/g, "");
    html = html.replace(/(<h1 data-hero-headline>[\s\S]*?<\/h1>)/, '$1<script src="./assets/js/hero-headline.js"></script>');
  }
  await writeFile(file, html);
}

console.log("Applied sitewide SEO metadata and structured data.");

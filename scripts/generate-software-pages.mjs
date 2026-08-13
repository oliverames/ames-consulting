#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const workIndexPath = join(root, "work", "index.html");

const projects = [
  {
    slug: "ping-warden",
    name: "Ping Warden",
    type: "macOS app",
    period: "2025–2026",
    summary: "Ping Warden is a native menu bar app that keeps local wireless discovery traffic from disrupting latency-sensitive work.",
    dek: "I built Ping Warden because AirDrop, AirPlay, and Handoff can cause latency spikes during games, calls, and cloud streaming.",
    repo: "https://github.com/oliverames/ping-warden",
    icon: "ping-warden-icon.webp",
    facts: ["Swift", "macOS 13+", "Open source"],
    screenshot: "ping-warden-dashboard.webp",
    screenshotAlt: "Ping Warden dashboard showing latency, jitter, probes, and interventions",
    sections: [
      ["Why it exists", "AirDrop, AirPlay, and Handoff use a local wireless interface that can cause noticeable latency spikes. Ping Warden watches for that traffic and temporarily quiets it while a protected app runs."],
      ["What it does", "The app monitors latency and jitter and detects protected apps automatically. An event-driven helper makes the network change, and the app records every intervention. Supported versions of macOS also get a Control Center widget."],
      ["What pauses", "AirDrop, AirPlay, and Handoff pause while protection is active, then return when the session ends."],
    ],
  },
  {
    slug: "apple-core",
    name: "Apple Core",
    type: "macOS MCP app",
    period: "2026",
    summary: "Apple Core is a personal MCP server that gives assistants controlled access to local Apple services.",
    dek: "Apple Core lets an assistant use Calendar, Notes, Mail, Messages, and other services, but it doesn’t decide which services or remote routes are available.",
    repo: "https://github.com/oliverames/apple-core",
    facts: ["Swift", "77 tools", "Local by default"],
    icon: "apple-core-icon.webp",
    commands: ["notes.search", "mail.search", "calendar.events", "reminders.list"],
    sections: [
      ["What it connects", "Apple Core is a signed and notarized menu bar app that serves 77 tools across Calendar, Reminders, Contacts, Location, Maps, Messages, Capture, Shortcuts, Notes, and Mail. Local clients connect over authenticated HTTP, with a bundled bridge for clients that still require standard input and output."],
      ["The controls", "Each service has its own enable switch and another switch for remote access. Remote access is off by default and always requires authentication. It can run through an optional Cloudflare Tunnel with bearer authentication or OAuth 2.1 with PKCE."],
      ["How it started", "Apple Core began as a hard fork of iMCP. I expanded its Notes and Mail tools, then replaced the original network transport with the serving approach from Bridgeport. The repository keeps the upstream licenses and documents each design it borrowed."],
    ],
  },
  {
    slug: "bridgeport",
    name: "Bridgeport",
    type: "Personal MCP gateway",
    period: "2026",
    summary: "Bridgeport is a native gateway that finds MCP servers on a Mac and exposes only the connectors its owner chooses.",
    dek: "Bridgeport lets one always-on Mac host private MCP connectors for local command-line tools and authenticated cloud clients.",
    repo: "https://github.com/oliverames/bridgeport",
    facts: ["Swift", "macOS 26+", "OAuth 2.1"],
    icon: "bridgeport-icon.webp",
    commands: ["connectors.discover", "routes.publish", "clients.export", "secrets.resolve"],
    sections: [
      ["How it works", "Bridgeport finds MCP servers in plugin folders and client configuration files. It starts a connector only when a client needs it, then serves modern HTTP or legacy event-stream routes from one menu bar app and background daemon."],
      ["Public access is optional", "Discovered connectors remain private unless their owner enables public access. Bridgeport supports bearer authentication, OAuth 2.1 with PKCE, session limits, idle cleanup, and per-connector public routes through an optional Cloudflare Tunnel."],
      ["Client setup and secrets", "Bridgeport generates setup details for Claude, ChatGPT, Anthropic’s API, Mistral, and Vibe Code. It can also resolve declared secrets from environment files and 1Password references, so each connector process doesn’t need its own copy."],
    ],
  },
  {
    slug: "meta-mcp-server",
    name: "Meta MCP",
    type: "Developer platform",
    period: "2025–2026",
    summary: "Meta MCP is one Model Context Protocol server for publishing, analytics, advertising, and commerce across Meta platforms.",
    dek: "Meta MCP wraps seven Meta platforms in 200 tools, but it still exposes each platform’s permissions and failure modes.",
    repo: "https://github.com/oliverames/meta-mcp-server",
    facts: ["TypeScript", "200 tools", "7 platforms"],
    icon: "meta-mcp-icon.webp",
    commands: ["pages.publish", "instagram.insights", "threads.create", "ads.report"],
    sections: [
      ["What it covers", "Meta MCP connects Facebook Pages, Instagram, Threads, Ads Manager, Commerce, the Conversions API, Insights, and the Ad Library through one server. Its tools handle routine publishing as well as reporting and advertising."],
      ["Errors you can act on", "A failed API request should say what went wrong. The server reports expired tokens, missing permissions, and unsupported actions with a specific next step."],
      ["How it’s built", "The project is written in TypeScript, with platform-specific modules behind one Model Context Protocol server. It’s open source under the MIT license."],
    ],
  },
  {
    slug: "ynab-mcp-server",
    name: "YNAB MCP",
    type: "Financial tooling",
    period: "2025–2026",
    summary: "YNAB MCP is a Model Context Protocol server for reading and updating a YNAB budget. It starts in read-only mode.",
    dek: "YNAB MCP starts in read-only mode. When writes are enabled, it records supported changes so they can be undone.",
    repo: "https://github.com/oliverames/ynab-mcp-server",
    facts: ["JavaScript", "58 tools", "Read-only by default"],
    icon: "ynab-mcp-icon.webp",
    commands: ["budget.health", "transactions.search", "category.plan", "changes.undo"],
    sections: [
      ["Before anything changes", "YNAB MCP starts in read-only mode. Writes need an explicit opt-in and confirmation, and the server keeps an undo journal for supported changes."],
      ["Tools and numbers", "The server exposes 58 tools and six guided prompts for budgets, accounts, transactions, categories, payees, months, scheduled transactions, and reporting. It converts YNAB milliunits into ordinary currency values at the boundary so calculations stay predictable."],
      ["Where it runs", "You can run it through a local standard-input connection or a hosted OAuth connector. Both use the same YNAB API and the same write controls."],
    ],
  },
  {
    slug: "skylight-bridge",
    name: "Skylight Bridge",
    type: "macOS app",
    period: "2025–2026",
    summary: "Skylight Bridge is a native macOS app that connects selected Apple Photos, Reminders, and Notes content to a Skylight family calendar.",
    dek: "A family chooses exactly which albums, reminder lists, recipes, and chores can sync. The rest of its Apple data stays private.",
    repo: "https://github.com/oliverames/skylight-bridge",
    icon: "skylight-bridge-icon.webp",
    facts: ["Swift", "macOS 26+", "Signed and notarized"],
    screenshot: "skylight-bridge-overview.webp",
    screenshotAlt: "Skylight Bridge overview showing connected Apple services and sync activity",
    sections: [
      ["What it connects", "Skylight Bridge connects selected albums, reminder lists, recipes, and chores without asking a family to leave the Apple apps it already uses."],
      ["How sync works", "Photos move one way to Skylight. Reminders, recipes, and chores can sync in both directions, and every connection is opt-in. The activity log shows the most recent changes."],
      ["What it is", "Skylight Bridge uses Skylight’s private API, so it isn’t an official integration. The macOS app is signed and notarized, and an iOS companion is in development."],
    ],
  },
];

const escapeHtml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function visual(project, depth) {
  if (project.screenshot) {
    return `<div class="software-visual software-visual--screen"><div class="software-window-bar" aria-hidden="true"><span></span><span></span><span></span><b>${escapeHtml(project.type)}</b></div><img src="${depth}assets/images/work/software/${project.screenshot}" alt="${escapeHtml(project.screenshotAlt)}" loading="lazy"></div>`;
  }
  return `<div class="software-visual software-console"><div class="software-window-bar" aria-hidden="true"><span></span><span></span><span></span><b>tool explorer</b></div><div class="software-console__brand"><img src="${depth}assets/images/work/software/${project.icon}" alt="" width="76" height="76" loading="lazy"><strong>${escapeHtml(project.name)}</strong></div><ul>${project.commands.map((command) => `<li><code>${escapeHtml(command)}</code><span aria-hidden="true">ready</span></li>`).join("")}</ul></div>`;
}

function facts(project) {
  return `<ul class="software-facts">${project.facts.map((fact) => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>`;
}

function footer(depth) {
  return `<footer class="site-footer"><div class="site-footer__inner"><nav class="site-footer__sitemap" aria-label="Footer"><div><h3>Work by organization</h3><ul><li><a href="${depth}work/blue-cross-vermont/">Blue Cross Vermont campaigns</a></li><li><a href="${depth}work/eastrise/">EastRise campaigns</a></li><li><a href="${depth}work/green-mountain-community-fitness/">Green Mountain Community Fitness</a></li></ul></div><div><h3>Company</h3><ul><li><a href="${depth}work/">All work</a></li><li><a href="${depth}blog/">Writing</a></li><li><a href="${depth}about/">About</a></li><li><a href="${depth}contact/">Contact</a></li></ul></div></nav><div class="site-footer__colophon"><span class="site-footer__monogram" aria-hidden="true">OA</span><p>Ames Consulting is a Vermont-based communications and technology firm that helps organizations with digital strategy, content, photography, and practical technology solutions.</p><ul class="site-footer__social"><li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li><li><a href="https://www.linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li></ul></div></div></footer>`;
}

const cards = projects.map((project, index) => `<a class="software-card" href="${project.slug}/"><span class="software-card__number" aria-hidden="true">0${index + 1}</span>${visual(project, "../")}<div class="software-card__body"><p class="software-card__meta">${escapeHtml(project.type)} · ${escapeHtml(project.period)}</p><div class="software-card__title"><img src="../assets/images/work/software/${project.icon}" alt="" width="52" height="52" loading="lazy"><h3>${escapeHtml(project.name)}</h3></div><p>${escapeHtml(project.summary)}</p>${facts(project)}<span class="software-card__open">Open project <span aria-hidden="true">↗</span></span></div></a>`).join("");

const section = `<section class="software-work" id="software-development" aria-labelledby="software-development-title"><div class="software-work__heading"><div><p class="eyebrow">Software development</p><h2 id="software-development-title">Software for problems I kept running into.</h2></div><p>I build software when a document can't solve the problem. These projects include native Mac apps and API integrations, especially tools that give assistants controlled access to local services.</p></div><div class="software-grid">${cards}</div></section>`;

let workIndex = await readFile(workIndexPath, "utf8");
workIndex = workIndex.replace(/<section class="software-work"[\s\S]*?<\/section>/, "");
if (/<section class="work-category">\s*<h2>Client and institutional work<\/h2>/.test(workIndex)) {
  workIndex = workIndex.replace(/(<section class="work-category">\s*<h2>Client and institutional work<\/h2>)/, `${section}\n      $1`);
} else {
  workIndex = workIndex.replace(/\s*<\/main>/, `\n      ${section}\n    </main>`);
}
workIndex = workIndex.replace(/\n[ \t]+\n(?=[ \t]*<section class="work-category">\s*<h2>Client and institutional work<\/h2>)/, "\n");
workIndex = workIndex.replace(
  /\n(?:[ \t]*\n)+(?=[ \t]*<section class="(?:software-work|work-category)")/g,
  "\n\n"
);
workIndex = workIndex.replace(/^[ \t]+$/gm, "");
await writeFile(workIndexPath, workIndex);

for (const project of projects) {
  const sections = project.sections.map(([title, copy]) => `<article class="software-story"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p></article>`).join("");
  const title = `${project.name} | Ames Consulting`;
  const description = project.summary;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin"><meta name="referrer" content="strict-origin-when-cross-origin"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; script-src 'self'; form-action 'self';"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="author" content="Oliver Ames"><link rel="canonical" href="https://ames.consulting/work/${project.slug}/"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="https://ames.consulting/work/${project.slug}/"><meta property="og:type" content="website"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&amp;family=Lora:ital,wght@0,400;0,500;1,400&amp;display=swap"><link rel="stylesheet" href="../../assets/css/main.css"><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "SoftwareSourceCode", name: project.name, description, author: { "@type": "Person", name: "Oliver Ames" }, codeRepository: project.repo, url: `https://ames.consulting/work/${project.slug}/` })}</script></head><body><a class="skip-link" href="#main-content">Skip to content</a><header class="site-header"><nav class="site-header__inner" aria-label="Primary"><a href="../../" class="site-name">ames.consulting</a><ul class="site-nav"><li><a href="../../">Home</a></li><li><a href="../" aria-current="true">Work</a></li><li><a href="../../blog/">Writing</a></li><li><a href="../../about/">About</a></li><li><a href="../../testimonials/">Testimonials</a></li><li><a href="../../contact/">Contact</a></li></ul></nav></header><main id="main-content" class="software-detail" tabindex="-1"><header class="software-hero"><div class="software-hero__copy"><p class="eyebrow">${escapeHtml(project.type)} · ${escapeHtml(project.period)}</p><h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.dek)}</p>${facts(project)}<div class="software-actions"><a class="button" href="${project.repo}" rel="noopener">View the repository <span aria-hidden="true">↗</span></a><a class="button button--ghost" href="../#software-development">All software projects</a></div></div>${visual(project, "../../")}</header><section class="software-stories" aria-label="Project notes">${sections}</section></main>${footer("../../")}<script type="module" src="../../assets/js/header-scroll.js"></script></body></html>`;
  const output = join(root, "work", project.slug, "index.html");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

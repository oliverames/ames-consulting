# Visual Design System — ames.consulting

**Date**: 2026-02-11
**Status**: Design complete, ready for implementation
**Branch**: `codex/site-hardening-infra`

---

## Design Philosophy

**"Same spirit, different voice"** — inspired by lmnt.me's craft and intentionality, expressed through the Ames Shovel Company's industrial heritage. Functional excellence over decoration. Every element earned.

**Identity model**: Oliver IS Ames Consulting. The person is the practice. The heritage is personal (family name), the work speaks for itself. No "Services" page, no corporate identity. The LLC never appears on the site.

**Reference**: [lmnt.me](https://lmnt.me) by Louie Mantia — zero-JS philosophy, hand-crafted HTML/CSS, Display P3 colors, show-don't-tell presentation.

---

## Site Structure

### Header (minimal)

```
ames.consulting          Home | Work | Blog
```

Three nav items only. Logo/site name on the left, navigation on the right.

### Home Page

The home page serves dual purpose: **introduction + site directory**.

**Top section**: Strong intro statement leading with what Oliver does, followed by 1-2 sentences of context (Vermont roots, range of work).

**Opening approach**: "I translate complex ideas into stories people care about." Then brief context about the work spanning software, video, strategy, and storytelling.

**Below the intro**: Two paths with preview content:
- **Work** — Featured portfolio pieces with thumbnails
- **Blog** — Recent posts from Micro.blog stream

**Below the paths**: Full site directory (lmnt.me pattern) — organized links to every page on the site:

```
Work                    About
  BCBS VT App             Stuff I Like
  Sunshine Trail           Colophon
  ...

Blog                    Elsewhere
  All Posts               GitHub
  RSS                     LinkedIn
                          Bluesky
                          Mastodon
                          Instagram
                          Email
```

### Pages

| Page | Path | Content |
|------|------|---------|
| Home | `/` | Intro + two paths + site directory |
| Work | `/work/` | Lightly categorized index (Software, Web, Strategy headings) |
| Work detail | `/work/{slug}/` | Individual project page with images + strategy narrative |
| Blog | `/blog/` | Micro.blog powered stream |
| Stuff I Like | `/likes/` | Gear, tools, apps, things Oliver recommends |
| Colophon | `/colophon/` | How the site is built (HTML/CSS, Micro.blog, Claude Code) |
| Contact | `/contact/` | Form + contact info (linked from footer, not header nav) |

### Inner Page Navigation

Each page has contextual sibling links at the top (like lmnt.me's Intro page pattern):
- Work detail pages link to other Work pages
- Colophon and Stuff I Like link to each other
- Blog links to RSS

### Footer

All social links (no phone):
- Email: oliverames@gmail.com
- GitHub: github.com/oliverames
- LinkedIn: linkedin.com/in/oliverames
- Bluesky: oliverames.bsky.social
- Mastodon: mastodon.social/@oliverames
- Instagram: instagram.com/oliverames

Plus link to /contact/ page.

---

## Color System

### Palette

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--surface` | `#faf8f5` (warm white) | `#1c2929` (near-black, subtle blue-green) | Page background |
| `--text` | `#000000` | `#faf8f5` | Body text |
| `--text-secondary` | `#666666` | TBD (lighter variant) | Dates, metadata |
| `--accent` | `#f5a542` (Heritage Gold) | `#f5a542` (Heritage Gold) | Links, emphasis, highlights |
| `--accent-hover` | `#d94a2d` (Manufacturing Red) | `#d94a2d` (Manufacturing Red) | Hover states only |
| `--rule` | `#cccccc` | TBD (subtle divider) | Divider lines |

### Color Rules

1. **Gold is the accent**. It appears on links, strategic emphasis, and highlights.
2. **Red appears only on hover**. A flash of heat when you interact — never at rest.
3. **System preference detection**: `prefers-color-scheme` media query switches between light and dark palettes automatically.
4. **Use Display P3 where supported**: `color(display-p3 ...)` with sRGB fallbacks for the accent colors.
5. **Alpha/transparency layering** (lmnt.me technique): Use the same accent color at different opacities for borders, backgrounds, and shadows rather than defining many separate colors.

### Dark Mode Rationale

`#1c2929` is drawn from the vintage Ames Shovels sign — a very dark surface with a subtle blue-green undertone (R:28, G:41, B:41). The cool cast makes Heritage Gold glow warm against it (complementary temperature contrast). Not teal — just *not quite black* in a way that has quiet character.

### Light Mode Rationale

`#faf8f5` is warm white — like the "bright white or natural" resume stock from the brand guide. Crafted and approachable, not clinical.

---

## Typography

### Strategy

**Adapt the brand guide's logic for screen**: Keep the pairing principle (bold condensed sans-serif for headers, warm serif for body) but select typefaces optimized for screen rendering rather than using the print-oriented Libre Franklin + Crimson Text directly.

### Hierarchy

| Element | Style | Weight | Size (desktop) |
|---------|-------|--------|----------------|
| Site name | Condensed sans | Bold | 24-28px |
| Page title | Condensed sans | Bold | 32-40px |
| Section headers | Condensed sans | Bold, ALL CAPS | 14-16px, +letter-spacing |
| Project titles | Sans | Demi/Medium | 18-20px |
| Body text | Serif | Regular | 16-18px |
| Metadata (dates, tags) | Serif or sans | Regular | 14px |
| Nav links | Sans | Medium | 14-16px |

### Typeface Selection (to be finalized during implementation)

Candidates for headers (condensed industrial sans):
- Barlow Condensed
- Inter Tight
- DM Sans (condensed weights)

Candidates for body (screen-optimized serif):
- Source Serif 4
- Lora
- Literata

Selection criteria: rendering quality at target sizes, variable font availability, Google Fonts hosting for performance.

### Line Height

- Body: 1.5 (screen-optimized, slightly more than print guide's 1.45)
- Headers: 1.2

---

## Portfolio Architecture

### Content Source

Portfolio pages are **static HTML** — hand-crafted pages, not routed through Micro.blog. This follows the lmnt.me model: each project is its own page with full creative control.

Blog remains Micro.blog powered.

### Portfolio Page Structure

Each project page includes:

1. **Hero image(s)** — Screenshots, photos, or video embeds
2. **Strategy narrative** — Written in Oliver's natural voice. Not a case study template. Explains: why this exists, what it does, what was learned. (See BCBS VT App example below.)
3. **Technical details** — Stack, tools, approach (brief)
4. **Contextual nav** — Links to other Work pages at top

### Launch Content

Two portfolio pieces at launch:

**BCBS VT App** (Software)
- SwiftUI companion app for Blue Cross Blue Shield of Vermont
- Features: news feed, receipt scanning (on-device OCR), digital member IDs, AI chat (Apple Intelligence)
- Privacy-first: on-device processing, CloudKit backend
- Strategy narrative adapted from Oliver's LinkedIn post
- Screenshots: 4-panel iPhone mockup (News, Receipts, IDs, Chat)

**The Sunshine Trail** (Web)
- Interactive map for Lawson's Finest Liquids
- Sunshine Spots from Waitsfield, VT to Asheville, NC
- Impact metrics: $3M raised, 2M kWh solar, B Corp certified
- Strategy narrative about community-driven brand storytelling
- Screenshot: map interface with impact sidebar

### Voice Example (from Oliver's BCBS post)

> I've been dissatisfied with the lack of digital insurance cards that I can add to Apple Wallet. Some companies like Cigna and Delta Dental offer them, but they're badly designed, poorly formatted, and folks NEVER know what to do with them at the provider's office. So, I've made a custom Apple Wallet pass for my BCBS VT insurance that looks nearly identical to what the physical insurance card looks like.

This is the portfolio voice: first-person, starts with the problem, explains the motivation, shows the craft, stays honest about scope.

---

## Implementation Strategy

### Simple Approach

Pure static HTML/CSS. No build step beyond what exists. Each page is a hand-authored HTML file following the established project structure. CSS extends the existing layered architecture.

### Sub-Agent Team

During implementation, specialized agents will review and inform the build:

| Agent | Domain | Role |
|-------|--------|------|
| **Apple HIG Expert** | Apple Human Interface Guidelines 2026 | Design quality, interaction patterns, accessibility |
| **CSS Standards Expert** | Modern CSS (2026) | P3 colors, cascade layers, container queries, `:has()`, `@property`, nesting |
| **HTML Expert** | Semantic HTML (2026) | Markup quality, structured data, accessibility, modern features |
| **Personal Brand Expert** | Oliver's voice + Ames identity | Guards tone, visual identity, copy quality |

Each agent reviews implementation against their domain expertise before code is committed.

### Modern CSS Techniques to Use

Carried forward from current codebase + lmnt.me inspiration:

- **Cascade layers** (`@layer`) — already in place
- **Registered custom properties** (`@property`) — for animated color transitions between modes
- **Container queries** — responsive components
- **`:has()` selectors** — contextual styling
- **CSS nesting** — cleaner authoring
- **`color-mix()`** — alpha variants from single color definitions
- **`prefers-color-scheme`** — system dark/light mode
- **`prefers-reduced-motion`** — respect motion preferences
- **Display P3 color** — `color(display-p3 ...)` for richer gold/red on supported displays
- **View transitions** — smooth page transitions (already has `<meta name="view-transition">`)

### File Structure (new/modified)

```
index.html                    # Rewrite: intro + site directory
work/
  index.html                  # Work index (categorized list)
  bcbs-vt-app/
    index.html                # Project detail page
  sunshine-trail/
    index.html                # Project detail page
blog/
  index.html                  # Existing (Micro.blog stream)
likes/
  index.html                  # Stuff I Like
colophon/
  index.html                  # How the site is built
contact/
  index.html                  # Existing (form + info)
assets/
  css/main.css                # Extended with design system tokens
  images/
    work/                     # Portfolio images
      bcbs-vt-app/            # BCBS screenshots
      sunshine-trail/         # Sunshine Trail screenshots
```

---

## Decisions Log

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | Identity model | Person IS the practice | lmnt.me approach. The LLC is invisible. |
| 2 | Color modes | Light + dark, system preference | `prefers-color-scheme` detection |
| 3 | Reference site | lmnt.me | "Same spirit, different voice" |
| 4 | Dark mode surface | `#1c2929` | From Ames Shovels sign — near-black with subtle blue-green |
| 5 | Light mode surface | `#faf8f5` | Warm white, like quality resume stock |
| 6 | Primary accent | Heritage Gold `#f5a542` | Warm, crafted, storyteller energy |
| 7 | Hover accent | Manufacturing Red `#d94a2d` | Flash of heat on interaction only |
| 8 | Typography approach | Adapt brand guide for screen | Condensed sans headers + screen serif body |
| 9 | Nav structure | Home \| Work \| Blog | Three items in header. Everything else on-page. |
| 10 | Home page | Intro + paths + site directory | lmnt.me pattern: home IS the navigation |
| 11 | Opening copy | Lead with what you do | "I translate complex ideas into stories people care about." |
| 12 | Portfolio system | Static HTML pages | Not Micro.blog. Hand-crafted like lmnt.me. |
| 13 | Blog system | Micro.blog | Existing architecture maintained |
| 14 | Portfolio voice | Natural first-person narratives | Not case study templates. Oliver's voice. |
| 15 | Footer | All social links, no phone | Email, GitHub, LinkedIn, Bluesky, Mastodon, Instagram |
| 16 | Contact | /contact/ page linked from footer | Existing form with anti-abuse controls |
| 17 | Additional pages | Stuff I Like + Colophon | Discoverable from home directory and contextual nav |
| 18 | Work structure | Lightly categorized | Headings (Software, Web, Strategy) on index page |
| 19 | Launch content | BCBS VT App + Sunshine Trail | Two pieces with screenshots and strategy narratives |
| 20 | Implementation | Sub-agent team | HIG, CSS, HTML, Brand experts review each phase |

---

## Open Items (for implementation)

- [ ] Finalize specific typeface selections (test rendering at target sizes)
- [ ] Define dark mode secondary text and rule colors
- [ ] Write home page intro copy (Oliver's voice, 2-3 sentences)
- [ ] Adapt BCBS LinkedIn post into portfolio page narrative
- [ ] Write Sunshine Trail strategy narrative
- [ ] Source/prepare portfolio images (BCBS screenshots, Sunshine Trail screenshot)
- [ ] Define Stuff I Like page content (gear, tools, apps — categories TBD)
- [ ] Write Colophon page content
- [ ] Configure sub-agent skills for implementation review

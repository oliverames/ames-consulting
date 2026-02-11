# ames.consulting Visual Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the scaffolded site into a personal site with Ames heritage visual identity, light/dark mode, static portfolio, and lmnt.me-inspired site directory.

**Architecture:** Pure static HTML/CSS. No build step. Each page is hand-authored HTML. CSS extends the existing layered architecture with new design tokens. Blog remains Micro.blog-powered. Portfolio is static pages.

**Tech Stack:** HTML, CSS (cascade layers, @property, container queries, P3 color), Google Fonts, existing Playwright test suite.

**Sub-Agent Review Team:** After each major task, request review from domain experts:
- Apple HIG Expert (2026) — design quality, interaction patterns, accessibility
- CSS Standards Expert (2026) — modern CSS usage, P3 color, cascade layers
- HTML Expert (2026) — semantic markup, structured data, accessibility
- Personal Brand Expert — Oliver's voice, Ames identity, visual consistency

---

## Task 1: CSS Design System Foundation

**Files:**
- Modify: `assets/css/main.css`

**Step 1: Replace color tokens with Ames palette + dark mode**

Replace the existing `:root` tokens block with the Ames design system. Key changes:
- Light mode: warm white `#faf8f5` surface, black text, Heritage Gold `#f5a542` accent
- Dark mode: `#1c2929` surface, warm white text, same Heritage Gold accent
- Manufacturing Red `#d94a2d` only on hover/interactive states
- P3 color with sRGB fallbacks
- `color-scheme: light dark` for system preference

```css
@layer tokens {
  @property --surface-alpha {
    syntax: "<number>";
    inherits: true;
    initial-value: 0.88;
  }

  :root {
    color-scheme: light dark;

    /* Typography */
    --font-heading: "Barlow Condensed", "Arial Narrow", sans-serif;
    --font-body: "Lora", "Georgia", serif;
    --font-mono: "IBM Plex Mono", ui-monospace, monospace;

    /* Spacing */
    --space-1: clamp(0.4rem, 0.5vw, 0.6rem);
    --space-2: clamp(0.8rem, 1vw, 1rem);
    --space-3: clamp(1.2rem, 1.5vw, 1.5rem);
    --space-4: clamp(1.8rem, 2vw, 2.4rem);
    --space-5: clamp(2.4rem, 3vw, 3.6rem);

    /* Radii */
    --radius-sm: 0.25rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;

    /* Measures */
    --measure-wide: min(64rem, 92vw);
    --measure-reading: min(65ch, 92vw);
  }

  /* ─── Light Mode ─── */
  :root,
  [data-theme="light"] {
    --surface-0: #faf8f5;
    --surface-1: #f3f0eb;
    --surface-2: #e8e4dd;
    --text-0: #000000;
    --text-1: #666666;
    --accent: #f5a542;
    --accent-hover: #d94a2d;
    --rule: #cccccc;
    --border-soft: 1px solid var(--rule);
    --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  /* P3 accent override when supported */
  @supports (color: color(display-p3 1 1 1)) {
    :root,
    [data-theme="light"] {
      --accent: color(display-p3 0.94 0.66 0.28);
      --accent-hover: color(display-p3 0.83 0.30 0.19);
    }
  }

  /* ─── Dark Mode ─── */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --surface-0: #1c2929;
      --surface-1: #232f2f;
      --surface-2: #2a3838;
      --text-0: #faf8f5;
      --text-1: #a0a8a8;
      --accent: #f5a542;
      --accent-hover: #d94a2d;
      --rule: #3a4848;
      --border-soft: 1px solid var(--rule);
      --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
  }

  [data-theme="dark"] {
    --surface-0: #1c2929;
    --surface-1: #232f2f;
    --surface-2: #2a3838;
    --text-0: #faf8f5;
    --text-1: #a0a8a8;
    --accent: #f5a542;
    --accent-hover: #d94a2d;
    --rule: #3a4848;
    --border-soft: 1px solid var(--rule);
    --shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.25);
  }
}
```

**Step 2: Update base layer for new typography and colors**

Update `@layer base` to use new tokens:
- `body` background: `var(--surface-0)` (remove gradient)
- `body` font-family: `var(--font-body)` for body text
- `body` color: `var(--text-0)`
- Headings: `var(--font-heading)`
- Links: `color: var(--accent)` default, `color: var(--accent-hover)` on hover
- Line height: 1.5 for body, 1.2 for headings

**Step 3: Update component layer for new design tokens**

Update all components to reference new token names:
- `.surface` → use `var(--surface-1)` background (no glassmorphism)
- `.site-nav a` → simple underline links, no pill borders
- Remove old `--base-0`, `--base-1`, `--base-2`, `--accent-soft`, `--font-sans` tokens
- `.site-eyebrow` → `font-family: var(--font-heading)`, uppercase, letter-spacing
- All `color-mix(in oklch, ...)` → simplify to direct token references where possible
- Section headers: `var(--font-heading)`, bold, uppercase, letter-spacing

**Step 4: Add Google Fonts import**

Add to `<head>` of all HTML pages (before main.css):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;1,400&display=swap">
```

Also update CSP to allow Google Fonts:
```
font-src 'self' https://fonts.gstatic.com data:;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
```

**Step 5: Run existing tests**

Run: `npm run check:html && npm run test:a11y`
Expected: Pass (or note failures to fix)

**Step 6: Commit**

```bash
git add assets/css/main.css
git commit -m "feat: replace design tokens with Ames heritage palette and dark mode"
```

---

## Task 2: Shared Layout — Header and Footer

**Files:**
- Modify: `index.html`, `blog/index.html`, `contact/index.html`
- Delete: `portfolio/index.html` (replaced by /work/)

**Step 1: Define the shared header pattern**

Every page gets this header structure:
```html
<header class="site-header">
  <nav class="site-header__inner" aria-label="Primary">
    <a href="/" class="site-name">ames.consulting</a>
    <ul class="site-nav">
      <li><a href="/">Home</a></li>
      <li><a href="/work/">Work</a></li>
      <li><a href="/blog/">Blog</a></li>
    </ul>
  </nav>
</header>
```

- `ames.consulting` as a link, not an eyebrow paragraph
- Three nav items only (Home, Work, Blog)
- No h1 in header (h1 is page-specific content below)
- `aria-current="page"` on the active item

**Step 2: Define the shared footer pattern**

Every page gets this footer:
```html
<footer class="site-footer">
  <div class="site-footer__inner">
    <ul class="footer-links" aria-label="Social links">
      <li><a href="mailto:oliverames@gmail.com">Email</a></li>
      <li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li>
      <li><a href="https://linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li>
      <li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li>
      <li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li>
      <li><a href="https://instagram.com/oliverames" rel="me noopener">Instagram</a></li>
    </ul>
    <p class="footer-contact"><a href="/contact/">Send a message</a></p>
  </div>
</footer>
```

**Step 3: Add footer CSS to main.css**

```css
/* In @layer layout */
.site-footer {
  margin-top: var(--space-5);
  padding: var(--space-4) 0;
  border-top: var(--border-soft);
}

.site-footer__inner {
  width: var(--measure-wide);
  margin-inline: auto;
  display: grid;
  gap: var(--space-2);
}

.footer-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
}

.footer-links a {
  color: var(--text-1);
  text-decoration: none;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  letter-spacing: 0.02em;
}

.footer-links a:hover {
  color: var(--accent-hover);
}

.footer-contact {
  font-size: 0.9rem;
  color: var(--text-1);
}
```

**Step 4: Update all existing HTML pages with new header + footer**

Apply the shared header and footer to: `index.html`, `blog/index.html`, `contact/index.html`.

**Step 5: Update theme-color meta tag**

Change `<meta name="theme-color" content="#e9eff8">` to:
```html
<meta name="theme-color" content="#faf8f5" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c2929" media="(prefers-color-scheme: dark)">
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add shared header/footer with Ames nav and social links"
```

---

## Task 3: Home Page Rewrite

**Files:**
- Modify: `index.html`

**Step 1: Rewrite index.html**

Replace the entire body content with the new home page structure:

1. **Header** (shared pattern from Task 2)
2. **Intro section**: h1 with opening statement, 1-2 sentences of context
3. **Two paths**: Work preview (featured projects with thumbnails) + Blog preview (recent posts placeholder)
4. **Site directory**: Organized links to every page (lmnt.me pattern)
5. **Footer** (shared pattern from Task 2)

The intro section:
```html
<main id="main-content" tabindex="-1">
  <section class="intro">
    <h1>I translate complex ideas into stories people care about.</h1>
    <p>I'm Oliver Ames — a content strategist, software tinkerer, and video producer in Montpelier, Vermont. This is where my work lives.</p>
  </section>

  <section class="home-paths">
    <div class="path-section">
      <h2><a href="/work/">Work</a></h2>
      <!-- Featured project cards with thumbnails -->
    </div>
    <div class="path-section">
      <h2><a href="/blog/">Blog</a></h2>
      <!-- Recent posts from Micro.blog -->
    </div>
  </section>

  <section class="site-directory" aria-label="Site directory">
    <div>
      <h3>Work</h3>
      <ul>
        <li><a href="/work/bcbs-vt-app/">BCBS VT App</a></li>
        <li><a href="/work/sunshine-trail/">The Sunshine Trail</a></li>
      </ul>
    </div>
    <div>
      <h3>About</h3>
      <ul>
        <li><a href="/likes/">Stuff I Like</a></li>
        <li><a href="/colophon/">Colophon</a></li>
      </ul>
    </div>
    <div>
      <h3>Blog</h3>
      <ul>
        <li><a href="/blog/">All Posts</a></li>
      </ul>
    </div>
    <div>
      <h3>Elsewhere</h3>
      <ul>
        <li><a href="https://github.com/oliverames" rel="me noopener">GitHub</a></li>
        <li><a href="https://linkedin.com/in/oliverames" rel="me noopener">LinkedIn</a></li>
        <li><a href="https://bsky.app/profile/oliverames.bsky.social" rel="me noopener">Bluesky</a></li>
        <li><a href="https://mastodon.social/@oliverames" rel="me noopener">Mastodon</a></li>
        <li><a href="https://instagram.com/oliverames" rel="me noopener">Instagram</a></li>
        <li><a href="mailto:oliverames@gmail.com">Email</a></li>
      </ul>
    </div>
  </section>
</main>
```

**Step 2: Add home page CSS**

```css
/* In @layer layout */
.intro {
  max-width: var(--measure-reading);
  padding: var(--space-5) 0 var(--space-4);
}

.intro h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.intro p {
  margin-top: var(--space-2);
  font-size: 1.1rem;
  color: var(--text-1);
  line-height: 1.6;
}

.home-paths {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-3) 0;
}

@media (width >= 48rem) {
  .home-paths {
    grid-template-columns: 1fr 1fr;
  }
}

.path-section h2 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-2);
}

.path-section h2 a {
  color: var(--text-0);
  text-decoration: none;
}

.path-section h2 a:hover {
  color: var(--accent-hover);
}

.site-directory {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-top: var(--border-soft);
  margin-top: var(--space-4);
}

.site-directory h3 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-1);
  margin-bottom: var(--space-1);
}

.site-directory ul {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.site-directory a {
  color: var(--accent);
  text-decoration: none;
  font-size: 0.95rem;
}

.site-directory a:hover {
  color: var(--accent-hover);
}
```

**Step 3: Update structured data**

Update JSON-LD to remove SearchAction from home page (that's blog-specific). Keep WebSite + WebPage + Person.

**Step 4: Remove old JS imports from home page**

The home page no longer needs `app.js` (that's for the Micro.blog stream). Remove:
```html
<script type="module" src="/assets/js/app.js"></script>
```
Also remove the old stream-shell, filters, dialogs, image viewer, and template elements.

**Step 5: Commit**

```bash
git add index.html assets/css/main.css
git commit -m "feat: rewrite home page with intro, paths, and site directory"
```

---

## Task 4: Work Index Page

**Files:**
- Create: `work/index.html`

**Step 1: Create work/index.html**

Lightly categorized list of projects. Each links to its detail page. Uses shared header/footer.

```html
<main id="main-content" tabindex="-1">
  <header class="page-header">
    <h1>Work</h1>
  </header>

  <section class="work-category">
    <h2>Software</h2>
    <ul class="work-list">
      <li class="work-item">
        <a href="/work/bcbs-vt-app/">
          <img src="/assets/images/work/bcbs-vt-app/thumb.png" alt="BCBS VT companion app screenshots" width="400" height="225" loading="lazy">
          <h3>BCBS VT App</h3>
          <p>A SwiftUI companion app for Blue Cross Blue Shield of Vermont.</p>
        </a>
      </li>
    </ul>
  </section>

  <section class="work-category">
    <h2>Web</h2>
    <ul class="work-list">
      <li class="work-item">
        <a href="/work/sunshine-trail/">
          <img src="/assets/images/work/sunshine-trail/thumb.png" alt="The Sunshine Trail interactive map" width="400" height="225" loading="lazy">
          <h3>The Sunshine Trail</h3>
          <p>Interactive map for Lawson's Finest Liquids.</p>
        </a>
      </li>
    </ul>
  </section>
</main>
```

**Step 2: Add work page CSS**

```css
.page-header {
  padding: var(--space-4) 0 var(--space-3);
}

.page-header h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  line-height: 1.15;
}

.work-category {
  margin-bottom: var(--space-4);
}

.work-category h2 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-1);
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: var(--border-soft);
}

.work-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

@media (width >= 48rem) {
  .work-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

.work-item a {
  display: grid;
  gap: var(--space-1);
  text-decoration: none;
  color: var(--text-0);
}

.work-item img {
  border-radius: var(--radius-md);
  border: var(--border-soft);
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.work-item h3 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--accent);
}

.work-item a:hover h3 {
  color: var(--accent-hover);
}

.work-item p {
  font-size: 0.9rem;
  color: var(--text-1);
}
```

**Step 3: Commit**

```bash
git add work/index.html assets/css/main.css
git commit -m "feat: add work index page with categorized project list"
```

---

## Task 5: Portfolio Detail Pages

**Files:**
- Create: `work/bcbs-vt-app/index.html`
- Create: `work/sunshine-trail/index.html`
- Create: `assets/images/work/bcbs-vt-app/` (copy screenshots)
- Create: `assets/images/work/sunshine-trail/` (copy screenshots)

**Step 1: Copy portfolio images**

Copy the screenshots Oliver provided into the assets directory:
- BCBS VT App: from Oliver's Desktop (`BCBS VT App Promotion.png`)
- Sunshine Trail: from Oliver's screenshot

**Step 2: Create BCBS VT App detail page**

```
work/bcbs-vt-app/index.html
```

Structure:
- Shared header
- Contextual nav (links to other work pages)
- Hero image (the 4-panel iPhone screenshot)
- Strategy narrative (adapted from Oliver's LinkedIn post — first person, starts with problem, shows solution)
- Technical details section
- Shared footer

Contextual nav pattern:
```html
<nav class="sibling-nav" aria-label="Work pages">
  <a href="/work/">Work</a>
  <a href="/work/sunshine-trail/">The Sunshine Trail</a>
</nav>
```

**Step 3: Create Sunshine Trail detail page**

Same structure. Strategy narrative about community-driven brand storytelling, interactive maps, impact metrics.

**Step 4: Commit**

```bash
git add work/ assets/images/work/
git commit -m "feat: add BCBS VT App and Sunshine Trail portfolio pages"
```

---

## Task 6: Stuff I Like + Colophon Pages

**Files:**
- Create: `likes/index.html`
- Create: `colophon/index.html`

**Step 1: Create Stuff I Like page**

Placeholder content with structure ready for Oliver to fill in. Categories:
- Tools & Software
- Hardware
- Other

Simple list format. Contextual nav links to Colophon.

**Step 2: Create Colophon page**

How the site is built:
- Hand-written HTML and CSS
- Micro.blog for the blog
- GitHub Pages for hosting
- Claude Code for pair programming
- Barlow Condensed + Lora from Google Fonts
- Ames Shovel Company heritage as design foundation
- Contextual nav links to Stuff I Like

**Step 3: Commit**

```bash
git add likes/ colophon/
git commit -m "feat: add Stuff I Like and Colophon pages"
```

---

## Task 7: Update Blog + Contact Pages

**Files:**
- Modify: `blog/index.html`
- Modify: `contact/index.html`

**Step 1: Update blog page**

- Replace header/nav with shared pattern (Home | Work | Blog)
- Add shared footer
- Add Google Fonts link
- Update theme-color meta
- Keep all blog stream functionality (app.js, dialogs, etc.)

**Step 2: Update contact page**

- Replace header/nav with shared pattern
- Add shared footer
- Add Google Fonts link
- Update theme-color meta
- Replace placeholder contact info with real data:
  - Email: oliverames@gmail.com
  - Location: Montpelier, Vermont
  - Remove phone field
  - LinkedIn: linkedin.com/in/oliverames
  - GitHub: github.com/oliverames
- Remove "placeholder" text from descriptions

**Step 3: Remove old portfolio page**

Delete `portfolio/index.html` — it's replaced by `/work/`. If anyone hits `/portfolio/`, they'll get a 404. Optionally add a simple redirect page later.

**Step 4: Commit**

```bash
git add blog/index.html contact/index.html
git rm portfolio/index.html
git commit -m "feat: update blog and contact pages, remove old portfolio"
```

---

## Task 8: Update Tests and Validate

**Files:**
- Modify: `tests/site.spec.js`
- Modify: `tests/accessibility.spec.js`
- Modify: `.htmlvalidate.json` (if needed)
- Modify: `package.json` (update html-validate paths)

**Step 1: Update test paths**

Replace `/portfolio/` references with `/work/` in test files. Add new pages to test suite.

**Step 2: Run full quality check**

```bash
npm run check:all
npm run test:regression
npm run test:a11y
```

Fix any failures.

**Step 3: Visual check**

Start local server and verify:
```bash
python3 -m http.server 4173
```

Check all pages in both light and dark mode. Verify:
- [ ] Home page intro renders correctly
- [ ] Site directory links all work
- [ ] Work index shows both projects
- [ ] BCBS and Sunshine Trail detail pages render with images
- [ ] Blog page still loads posts
- [ ] Contact page shows real info
- [ ] Dark mode switches properly
- [ ] Gold accent on links, red on hover
- [ ] Fonts load correctly
- [ ] Footer social links on every page

**Step 4: Commit any test fixes**

```bash
git add tests/ package.json
git commit -m "test: update test suite for new site structure"
```

---

## Task 9: Sub-Agent Review

After all tasks complete, dispatch review agents:

1. **CSS Standards Expert** — Review main.css for modern CSS best practices, P3 color usage, cascade layer organization
2. **HTML Expert** — Review all HTML pages for semantic correctness, structured data, accessibility
3. **Apple HIG Expert** — Review overall design for interaction quality, accessibility, visual hierarchy
4. **Personal Brand Expert** — Review copy, tone, and visual consistency against Ames identity

Incorporate feedback and commit fixes.

---

## Execution Sequence

```
Task 1 (CSS foundation) →
Task 2 (Header/Footer) →
Task 3 (Home page) →
Task 4 (Work index) →  Task 5 (Portfolio details) [can parallel]
                    →  Task 6 (Likes + Colophon)  [can parallel]
Task 7 (Update existing pages) →
Task 8 (Tests + validation) →
Task 9 (Sub-agent review)
```

Tasks 4-6 are independent once Task 2 establishes the shared patterns.

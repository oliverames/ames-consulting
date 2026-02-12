# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static personal portfolio/consulting site for ames.consulting. No framework — pure HTML, CSS (cascade layers), and vanilla ES modules. Hosted on GitHub Pages with a custom domain.

Content is sourced from a Micro.blog JSON feed (with local fallback) and rendered client-side through a single canonical Post model. Multiple views (home, blog, work) are derived from the same content stream via tag filtering.

## Commands

| Task | Command |
|---|---|
| **All quality checks** | `npm run check:all` |
| **E2E + accessibility tests** | `npm run test:e2e` |
| **Regression tests only** | `npm run test:regression` |
| **Accessibility tests only** | `npm run test:a11y` |
| **HTML validation** | `npm run check:html` |
| **JS lint** | `npm run lint:js` |
| **Local dev server** | `python3 -m http.server 4173` |
| **Generate sitemap/robots** | `node scripts/generate-seo-artifacts.mjs --out-dir _site` |

Always run `npm run check:all` before committing.

## Architecture

### CSS — Cascade Layers (`assets/css/main.css`)

All styles live in one file using this layer order:

```
@layer reset, tokens, base, layout, components, utilities;
```

Color custom properties are registered with `@property` for animated transitions between light/dark modes. Dark mode uses both `prefers-color-scheme` media queries and a `[data-theme="dark"]` attribute, with Display P3 colors behind `@supports`. Spacing uses `clamp()` fluid values (`--space-1` through `--space-5`).

### JavaScript — ES Modules (`assets/js/`)

- **app.js** — Bootstrap: loads config → fetches content → renders `<post-card>` elements → attaches filters/events
- **post-card.js** — Custom element with private `#post` field, renders article cards
- **content-sources.js** — Source adapter factory (`createSource()`), feed normalization, retry with exponential backoff
- **site-config.js** — Loads `assets/data/site.config.json`, merges with defaults
- **contact-form.js** — Form handling with rate limiting (3/10min), honeypot, minimum fill time
- **seo.js** — Dynamic meta/OG tags, JSON-LD structured data, canonical URLs

### Content Model

Everything is a "post" with: `id`, `title`, `summary`, `content`, `publishedAt`, `tags[]`, `url`, `image`. Views filter this single stream — the home page caps at `homePreviewLimit`, work filters by `portfolioTag`.

### Routes

`/` (home), `/blog/`, `/work/`, `/work/bcbs-vt-app/`, `/work/sunshine-trail/`, `/contact/`, `/likes/`, `/colophon/`

## Testing

Playwright with Chromium against a local Python HTTP server on port 4173.

- **`tests/site.spec.js`** — Navigation, tag filtering, read time metadata, image zoom, contact form fallback
- **`tests/accessibility.spec.js`** — Axe-core audits across all routes; fails on any critical violation

## CI/CD (`.github/workflows/`)

- **ci-quality.yml** — Static checks → broken link scan → E2E/a11y tests (on push to main + PRs)
- **performance.yml** — Lighthouse CI budgets (perf ≥ 0.8, CLS ≤ 0.1, LCP ≤ 3s, total ≤ 500KB)
- **deploy-pages.yml** — Builds `_site/`, generates SEO artifacts, deploys to GitHub Pages
- **pr-hygiene.yml** — Enforces semantic PR titles (feat/fix/chore/docs/refactor/test/perf)

## Conventions

- **Relative paths only**: All internal links and asset references must use relative paths (`./`, `../`). Absolute paths break GitHub Pages subdirectory deployments.
- **JS module paths**: Use `new URL("../data/file.json", import.meta.url)` for fetches/imports relative to the current script.
- **Semantic HTML**: landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), no div soup
- **Heading hierarchy**: Strict h1→h2→h3 order. Use the `visually-hidden` class for screen-reader-only headings when visual hierarchy differs.
- **Progressive enhancement**: features check for browser support, degrade gracefully. `<noscript>` fallbacks for JS-dependent content.
- **Social links** use `rel="me noopener"` for IndieWeb identity verification
- **JSON-LD structured data** on every page (WebSite, WebPage, Person, CreativeWork, etc.). No `SearchAction` — static sites lack server-side search.
- **Touch targets**: minimum 44px per Apple HIG
- **Accessibility**: WCAG AA contrast (4.5:1 for body text), reduced-motion respected
- **ARIA patterns**: `aria-current="page"` for exact current page; `aria-current="true"` for parent nav items on child pages. Honeypot fields use `aria-hidden="true"` + `tabindex="-1"`.
- **SVG icons**: `fill: currentColor` to inherit link color; `aria-hidden="true"` on the SVG, `aria-label` on the parent `<a>`.
- **Image CLS prevention**: All `<img>` tags need explicit `width`/`height` attributes, especially above-the-fold.
- **CSS features in use**: nesting (`&:hover`), logical properties (`margin-inline`, `padding-block-end`), Display P3 with sRGB fallbacks.
- **2-space indentation**, LF line endings (see `.editorconfig`)

## Design System Reference

Visual identity documented in `docs/plans/2026-02-11-visual-design-system.md`. Typography: Barlow Condensed (headings) + Lora (body) via Google Fonts. Color palette rooted in Ames Shovel Company heritage — warm paper, forge orange accent.

## Design Preferences

- Navigation links: underline style, no pill borders. Heritage Gold accent, Manufacturing Red only on hover.
- "Contact" is a top-level navigation item. Avoid redundant contact links in footer.
- Balanced visual weight across homepage content sections (Work, Blog, Photography).
- No build step beyond existing scripts (SEO artifact generation). Pure static HTML/CSS.

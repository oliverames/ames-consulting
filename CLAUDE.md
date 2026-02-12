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

Everything is a "post" normalized to: `id`, `title`, `summary`, `contentHtml`, `url`, `publishedAt`, `tags[]`, `readTimeMinutes`, `imageUrl`/`featuredImage`, `source`. Views filter this single stream — the home page caps at `homePreviewLimit`, work filters by `portfolioTag`.

### Static Generation

Node.js scripts (`.mjs`) generate static HTML pages from dynamic sources (Micro.blog feed, photography data, EastRise XML). The build process outputs to `_site/` directory. Scripts must `cd _site` before generating pages to place files correctly relative to the published root.

Key scripts:
- **generate-seo-artifacts.mjs** — Creates sitemap.xml, robots.txt
- **generate-blog-pages.mjs** — Creates individual blog post HTML from Micro.blog content
- **generate-photography-pages.mjs** — Creates gallery pages from photography.json
- **generate-eastrise-pages.mjs** — Creates EastRise blog post pages from XML feed

**CI requirement:** Deploy workflow must run `npm ci` and all generation scripts before deploying to prevent silent failures.

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
- **Semantic HTML**: landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), no div soup; maintain heading hierarchy without skips
- **Progressive enhancement**: features check for browser support, degrade gracefully; include `<noscript>` fallbacks for JS-rendered content (especially for client-side populated sections like `blog-strip`)
- **Homepage section structure**: Consistent pattern: `path-row` (container) → `h2` (heading with link) → `path-strip` (horizontal scrollable) → `path-browse` (CTA link)
- **Slug generation**: Use centralized `generateSlug()` function for URL-safe slugs to ensure consistency across all static pages
- **Social links** use `rel="me noopener"` for IndieWeb identity verification
- **JSON-LD structured data** on every page (WebSite, WebPage, Person, CreativeWork, etc.) — no `SearchAction` (client-side search only)
- **Touch targets**: minimum 44px per Apple HIG
- **Accessibility**: WCAG AA contrast (4.5:1 for body text), reduced-motion respected, `aria-current="page"` for exact-match nav links, `aria-current="true"` for section-parent nav links; each `<nav>` landmark must have a unique `aria-label`
- **SVG icons**: `fill: currentColor` on paths, `aria-hidden="true"` on `<svg>`, `aria-label` on parent `<a>`
- **HTML validation**: Always use `&amp;` (not raw `&`); `<link rel="canonical">` requires `href` attribute
- **External content security**: Use `DOMParser` (not `innerHTML`) for untrusted HTML. Update CSP headers for external image sources (e.g., `img-src 'self' https://www.eastrise.com https: data:;`)
- **Images**: always set explicit `width` and `height` attributes for CLS prevention
- **CSS features in use**: nesting (`&:hover`), logical properties (`margin-inline`, `padding-block-end`), Display P3 with sRGB fallbacks
- **2-space indentation**, LF line endings (see `.editorconfig`)

## Design System Reference

Visual identity documented in `docs/plans/2026-02-11-visual-design-system.md`. Typography: Barlow Condensed (headings) + Lora (body) via Google Fonts. Color palette rooted in Ames Shovel Company heritage — warm paper, forge orange accent.

## Design Preferences

- **Navigation style**: underline style, no pill borders. Heritage Gold accent, Manufacturing Red only on hover.
- **Contact placement**: top-level navigation item. Avoid redundant contact links in footer.
- **Homepage layout**: "lmnt.me-style" horizontal preview strips with equal visual weight across all content sections (Work, Blog, Photography, Links).
- **Blog posts**: open on-site as dedicated full pages (`/blog/post-slug/`) for SEO and direct linking, not as modals or external Micro.blog links.
- **Photography**: organize into distinct "shoots" (galleries), each with a collage preview on homepage, not a single running gallery.
- **Footer sitemap**: `site-directory` section should be comprehensive, semantically grouped for all site pages (not just main nav).
- **Social media**: icons prominent in hero/intro section, with redundant copy in footer.
- **AI summaries**: use Mistral (`labs-mistral-small-creative`) for blog previews. Writing style: concise, focused, direct.
- **Build process**: no build step beyond existing scripts (SEO artifact generation). Pure static HTML/CSS.

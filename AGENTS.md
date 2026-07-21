# ames.consulting

## Project Overview

Static personal portfolio/consulting site for ames.consulting. No framework — pure HTML, CSS (cascade layers), and vanilla ES modules. Hosted on Cloudflare Pages with website images delivered from R2.

Content is sourced from a Local JSON JSON feed (with local fallback) and rendered client-side through a single canonical Post model. Multiple views (home, blog, work) are derived from the same content stream via tag filtering.

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
| **Generate blog pages** | `npm run generate:blog-posts` |
| **Generate blog index cards** | `npm run generate:blog-index` |
| **Generate photography galleries** | `npm run generate:photography` |
| **Generate Financial Wellness pages** | `npm run generate:financial-wellness` |
| **Generate AI summaries** | `npm run generate:ai-summaries` (uses Mistral) |

Always run `npm run check:all` before committing.

`check:all` runs five checks in order: `check:js-syntax`, `lint:js`, `check:html`, `check:structured-data`, `check:sample-data`. Run individual checks when debugging a specific failure.

## First-Run Setup

New clone or fresh dev session: the app needs `assets/data/site.config.json` or it silently falls back to `assets/data/content.example.json` (local sample data).

```bash
cp assets/data/site.config.example.json assets/data/site.config.json
# Edit site.config.json: set jsonFeedUrl to your Local JSON JSON feed
```

Without this file, `app.js` falls back to `content.example.json` automatically — useful for UI development but not for testing live content.

## Architecture

### CSS — Cascade Layers (`assets/css/main.css`)

All styles live in one file using this layer order:

```
@layer reset, tokens, base, layout, components, utilities;
```

Color custom properties are registered with `@property` for animated transitions between light/dark modes. Dark mode uses both `prefers-color-scheme` media queries and a `[data-theme="dark"]` attribute, with Display P3 colors behind `@supports`. Spacing uses `clamp()` fluid values (`--space-1` through `--space-5`).

### JavaScript — ES Modules (`assets/js/`)

- **app.js** — Bootstrap for `/blog/`: loads config → fetches content → renders `<post-card>` elements → attaches filters/events. Imports image-viewer helpers; not loaded on other pages.
- **post-card.js** — Custom element with private `#post` field, renders article cards
- **content-sources.js** — Source adapter factory (`createSource()`), feed normalization, retry with exponential backoff
- **site-config.js** — Loads `assets/data/site.config.json`, merges with defaults
- **contact-form.js** — Form handling with rate limiting (3/10min), honeypot, minimum fill time
- **seo.js** — Dynamic meta/OG tags, JSON-LD structured data, canonical URLs
- **header-scroll.js** — Tiny shared module loaded on every page. Toggles `[data-scrolled]` on `.site-header` once `window.scrollY > 10`, which is what gates the blur backdrop in CSS.
- **image-viewer.js** — Shared image lightbox: auto-injects its `<dialog>`, decorates content `<img>`s in `<main>`/`<article>` (skipping anything wrapped in `<a>`), and wires click/keyboard/asset-protection handlers. Idempotent — `app.js` imports the named helpers without double-wiring.
- **photography-strip.js** — Renders the home-page photography strip from `photography.json`.

### Content Model

Everything is a "post" normalized to: `id`, `title`, `summary`, `contentHtml`, `url`, `publishedAt`, `tags[]`, `readTimeMinutes`, `imageUrl`/`featuredImage`, `source`. Views filter this single stream — the home page caps at `homePreviewLimit`, work filters by `portfolioTag`.

### Static Generation

Node.js scripts (`.mjs`) generate static HTML pages from dynamic sources (Local JSON feed, photography data, placeholder editorial XML). The build process outputs to `_site/` directory. Scripts must `cd _site` before generating pages to place files correctly relative to the published root.

Key scripts:
- **generate-seo-artifacts.mjs** — Creates sitemap.xml, robots.txt
- **generate-blog-posts.mjs** — Creates individual blog post HTML from Local JSON content
- **generate-blog-index.mjs** — Pre-renders `<post-card>` markup into `blog/index.html` between `BLOG_CARDS_START` / `BLOG_CARDS_END` sentinels. Eliminates the layout shift that occurred when the empty stream grew after `app.js` finished its async fetch. Idempotent. Swaps `.webp` → `-card.webp` thumbnail variants when they exist on disk; otherwise falls back to the original.
- **generate-photography-galleries.mjs** — Creates gallery pages from photography.json
- **generate-financial-wellness-pages.mjs** — Creates Financial Wellness blog post pages from XML feed
- **generate-ai-summaries.mjs** — Generates blog previews via Mistral API
- **parse-financial-wellness-posts.mjs** — Parses placeholder editorial XML feed into normalized data
- **analyze-photo-folder.mjs** / **process-lab-photos.mjs** — Photo processing utilities

**CI requirement:** Deploy workflow must run `npm ci` and all generation scripts before deploying to prevent silent failures.

### Routes

`/` (home), `/blog/`, `/work/`, `/work/carebridge-companion/`, `/work/neighborhood-giving-map/`, `/work/financial-wellness-library/`, `/photography/`, `/links/`, `/contact/`, `/likes/`, `/colophon/`

## Testing

Playwright with Chromium against a local Python HTTP server on port 4173.

- **`tests/site.spec.js`** — Navigation, tag filtering, read time metadata, image zoom, contact form fallback
- **`tests/accessibility.spec.js`** — Axe-core audits across all routes; fails on any critical violation

## CI/CD (`.github/workflows/`)

- **ci-quality.yml** — Static checks → broken link scan → E2E/a11y tests (on push to main + PRs)
- **performance.yml** — Lighthouse CI budgets (perf ≥ 0.8, CLS ≤ 0.1, LCP ≤ 3s, total ≤ 500KB)
- **deploy-pages.yml** — Uploads website images to R2, builds `_site/`, and deploys to Cloudflare Pages
- **pr-hygiene.yml** — Enforces semantic PR titles (feat/fix/chore/docs/refactor/test/perf)

## Conventions

- **Relative source paths**: Keep internal links and image references relative (`./`, `../`) for local development. The production build rewrites `assets/images/` references to the `assets.ames.consulting` R2 hostname.
- **JS module paths**: Use `new URL("../data/file.json", import.meta.url)` for fetches/imports relative to the current script.
- **Progressive enhancement**: `<noscript>` fallbacks for JS-rendered content (especially `blog-strip`)
- **Homepage section structure**: `path-row` (container) → `h2` (heading with link) → `path-strip` (horizontal scrollable) → `path-browse` (CTA link)
- **Slug generation**: Use centralized `generateSlug()` for URL-safe slugs
- **Social links**: `rel="me noopener"` for IndieWeb identity verification
- **JSON-LD**: Every page has structured data — no `SearchAction` (client-side search only)
- **`aria-current`**: `"page"` for exact-match nav links, `"true"` for section-parent links; each `<nav>` needs unique `aria-label`
- **External content**: Use `DOMParser` (not `innerHTML`) for untrusted HTML. Keep CSP headers updated for external image sources.
- **2-space indentation**, LF line endings (see `.editorconfig`)

## README Known Gaps (public repo)

The README is missing two items per the `readme-style` style guide:
- **No header icon/logo** — style guide requires a centered icon above the `<h1>`
- **No license badge** — badge row should include a `license-MIT` badge before Buy Me a Coffee

Fix these the next time the README is updated.

## Design System Reference

Visual identity documented in `docs/plans/2026-02-11-visual-design-system.md`. Typography: Barlow Condensed (headings) + Lora (body) via Google Fonts. Color palette rooted in industrial archive heritage — warm paper, forge orange accent.

## Design Preferences

- **Navigation style**: underline style, no pill borders. Heritage Gold accent, Manufacturing Red only on hover.
- **Contact placement**: top-level navigation item. Avoid redundant contact links in footer.
- **Homepage layout**: "lmnt.me-style" horizontal preview strips with equal visual weight across all content sections (Work, Blog, Photography, Links).
- **Blog posts**: open on-site as dedicated full pages (`/blog/post-slug/`) for SEO and direct linking, not as modals or external Local JSON links.
- **Photography**: organize into distinct "shoots" (galleries), each with a collage preview on homepage, not a single running gallery.
- **Footer sitemap**: lives inside the dark `.site-footer` (using `--surface-deep`/#1c2929). Structure: `.site-footer__sitemap` (4-column nav) + `.site-footer__colophon` (DS monogram + signature + social). Same dark footer with sitemap appears on every page. Bottom edge has the gold→red gradient bar.
- **Social media**: icons appear in the dark footer's `.site-footer__colophon` row alongside the DS monogram. The hero card uses pill CTAs ("See the work" / "Get in touch") instead of social icons.
- **Hero pattern**: `.hero` card with `--surface-0` background, `--radius-tile` (18px), layered `--shadow-card`, `.hero__mesh` radial gradient (gold/red/plum, blurred 70px, 0.5 opacity), eyebrow chip with red dot, gradient-fill `<em>` in H1, two-tone `<strong>` subhead, ink-fill primary pill button + ghost pill button, gradient-fill proof stats.
- **Card surface hierarchy**: page background uses `--surface-1` (#ede8e0). All cards lift off the page using `--surface-0` (#faf8f5) + `--shadow-card` triple-stop shadow. `.path-strip` requires `padding-block: 0.75rem 2rem; padding-inline: 1.5rem; margin-inline: -1.5rem` to keep card shadows from clipping at the scroll-container edges.
- **AI summaries**: use Mistral (`labs-mistral-small-creative`) for blog previews. Writing style: concise, focused, direct.
- **Build process**: no build step beyond existing scripts (SEO artifact generation). Pure static HTML/CSS.

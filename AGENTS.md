# ames.consulting

## Project Overview

Static personal portfolio/consulting site for ames.consulting. No framework — pure HTML, CSS (cascade layers), and vanilla ES modules. Hosted on Cloudflare Pages (deployed with wrangler from `_site/`; the Cloudflare Functions handler in `functions/api/contact.js` powers the contact form).

Pages are fully static. A chain of Node generator scripts (`npm run build:site`) writes and refines the committed HTML in the source tree, then copies everything into `_site/` for deploy. There is no client-side content pipeline — the earlier JSON-feed/Post-model architecture was removed.

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
| **Full site build (generators + `_site/`)** | `npm run build:site` |
| **Generate sitemap/robots only** | `node scripts/generate-seo-artifacts.mjs --out-dir _site` |
| **Refresh writing pages** | `npm run refresh:writing` |

Always run `npm run check:all` before committing.

`check:all` chains eleven checks: `check:js-syntax`, `lint:js`, `check:html`, `check:structured-data`, `check:image-loading`, `check:eastrise-photography`, `check:eastrise-social`, `check:portraits`, `check:event-galleries`, `check:blue-cross-sources`, and `check:media-provenance`. Run individual checks when debugging a specific failure.

`build:site` mutates the committed HTML (generators write into the source tree), so expect a dirty git status after running it. The `apply-*` scripts at the end of the chain (`apply-shared-ui`, `apply-image-dimensions`, `apply-seo`) are sitewide normalizers: shared chrome, image `width`/`height` attributes, and SEO metadata are enforced there rather than in each generator template.

## First-Run Setup

New clone or fresh dev session: `assets/data/site.config.json` configures the contact form (`contactFormEndpoint`, success message). Without it the form shows a "not configured" notice; everything else on the site works.

```bash
cp assets/data/site.config.example.json assets/data/site.config.json
```

## Architecture

### CSS — Cascade Layers (`assets/css/main.css`)

All styles live in one file using this layer order:

```
@layer reset, tokens, base, layout, components, utilities;
```

Color custom properties are registered with `@property` for animated transitions between light/dark modes. Dark mode uses both `prefers-color-scheme` media queries and a `[data-theme="dark"]` attribute, with Display P3 colors behind `@supports`. Spacing uses `clamp()` fluid values (`--space-1` through `--space-5`).

### JavaScript — ES Modules (`assets/js/`)

All eleven modules are live; nothing else ships:

- **construction-gate.js** — Password gate overlay (classic script in `<head>` of every page; unlock persists in localStorage as `amesConsultingConstructionAccess`).
- **header-scroll.js** — Loaded on every page; toggles `[data-scrolled]` on `.site-header` once `window.scrollY > 10` (gates the blur backdrop). Imports `inbound-prompt.js` and `gallery-card-scrub.js`.
- **inbound-prompt.js** — Time+scroll-triggered "Start a project" launcher and dialog; suppressed while the gate is locked or another dialog is open.
- **gallery-card-scrub.js** — Pointer-scrub through gallery frames on work cards.
- **image-viewer.js** — Shared image lightbox: auto-injects its `<dialog>`, decorates content `<img>`s, wires click/keyboard/asset-protection handlers. Idempotent named helpers.
- **content-protection.js** — Context-menu/drag protection for photographs.
- **contact-form.js** — Contact form handling: rate limiting (3/10min), honeypot, minimum fill time, Turnstile reset on both success and failure paths.
- **site-config.js** — Loads `assets/data/site.config.json`, merges with defaults (used by contact-form).
- **hero-headline.js** — Rotates the homepage H1 through five variants (sessionStorage-seeded).
- **proof-rotator.js** — Rotates the homepage proof-stat pages every 12s; pauses on hover/focus and under reduced motion.
- **work-filter.js** — `?organization=` filtering on `/work/`; unknown values fall back to the unfiltered view with "All" marked current.

### Static Generation

`npm run build:site` chains the generators in package.json order: page generators (services, event galleries, portraits, career work, software, credit-union sites, contact, about, testimonials, writing, brand icons, media provenance) → `refine-*` in-place page surgeries → `apply-shared-ui` → `apply-image-dimensions` → `apply-seo` → `build-site` (copies into `_site/` and emits sitemap/robots via `generate-seo-artifacts.mjs`).

Ground rules learned the hard way:
- Generators and `refine-*` scripts run against the committed source tree and must tolerate their own previous output (idempotence). Pattern-matching surgeries warn loudly instead of silently no-opping when markup drifts.
- Shared chrome (nav items, footer colophon/Company column, font preconnects) is normalized sitewide by `apply-shared-ui.mjs` — fix drift there, not per-template.
- `apply-image-dimensions.mjs` injects intrinsic `width`/`height` on every `<img>` lacking them (pure-JS WebP/PNG/JPEG/SVG header parsing; fails the build on unmeasurable images).
- Gallery pages held pending written permission carry `<meta name="robots" content="noindex">`, and `generate-seo-artifacts.mjs` excludes noindex pages from sitemap.xml.
- **analyze-photo-folder.mjs** / **process-lab-photos.mjs** / **sync-eastrise-social-dimensions.mjs** / **sync-source-screenshots.mjs** — manual photo/data utilities, not part of `build:site`.

**CI requirement:** Deploy workflow must run `npm ci` and `npm run build:site` before deploying to prevent silent failures.

### Routes

`/` (home), `/about/`, `/blog/` (+ `/blog/archive/` and per-post pages), `/contact/`, `/testimonials/`, `/services/photography-and-video/`, `/services/strategy-and-content/`, `/services/practical-technology/`, `/work/` (+ ~45 per-project pages such as `/work/eastrise/`, `/work/taylor-hoar-racing/`, `/work/ping-warden/`). The `?organization=` query on `/work/` drives client-side filtering. There are no `/photography/`, `/links/`, `/likes/`, or `/colophon/` routes — those were removed in an earlier redesign.

## Testing

Playwright with Chromium against a local Python HTTP server on port 4173.

- **`tests/site.spec.js`** — Navigation, tag filtering, read time metadata, image zoom, contact form fallback
- **`tests/accessibility.spec.js`** — Axe-core audits across all routes; fails on any critical violation

## CI/CD (`.github/workflows/`)

- **ci-quality.yml** — Static checks → broken link scan → E2E/a11y tests (on push to main + PRs)
- **performance.yml** — Lighthouse CI budgets (perf ≥ 0.8, CLS ≤ 0.1, LCP ≤ 3s, total ≤ 500KB); a puppeteer script unlocks the construction gate first so the budgets measure real pages
- **deploy-pages.yml** — Runs `build:site` and deploys `_site/` to Cloudflare Pages with wrangler (also uploads images to R2, though the site serves images same-origin — the R2 upload step is a candidate for removal)
- **pr-hygiene.yml** — Enforces semantic PR titles (feat/fix/chore/docs/refactor/test/perf)

## Conventions

- **Relative source paths**: Keep internal links and image references relative (`./`, `../`). Images are served same-origin from Cloudflare Pages. Exception: `404.html` uses root-absolute asset paths because it renders at arbitrary missing URLs.
- **JS module paths**: Use `new URL("../data/file.json", import.meta.url)` for fetches/imports relative to the current script.
- **Homepage section structure**: `path-row` (container) → `h2` (heading with link) → `path-strip` (horizontal scrollable) → `path-browse` (CTA link)
- **Social links**: `rel="me noopener"` for IndieWeb identity verification
- **JSON-LD**: Every page has structured data — no `SearchAction` (client-side search only)
- **`aria-current`**: `"page"` for exact-match nav links, `"true"` for section-parent links; each `<nav>` needs unique `aria-label`
- **External content**: Use `DOMParser` (not `innerHTML`) for untrusted HTML. Keep CSP headers updated for external image sources.
- **2-space indentation**, LF line endings (see `.editorconfig`)

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

## README Known Gaps (public repo)

The README is missing two items per the `readme-style` style guide:
- **No header icon/logo** — style guide requires a centered icon above the `<h1>`
- **No license badge** — badge row should include a `license-MIT` badge before Buy Me a Coffee

Fix these the next time the README is updated.

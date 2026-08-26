# ames.consulting

## Project Overview

Static personal portfolio/consulting site for ames.consulting. No framework — pure HTML, CSS (cascade layers), and vanilla ES modules. Hosted on Cloudflare Pages (deployed with wrangler from `_site/`; Cloudflare Functions power the contact form and enforce the publication denylist).

Pages are static at runtime. `npm run build:site` validates inputs, regenerates and normalizes the committed HTML, then writes the public artifact to `_site/`. There is no client-side content pipeline.

## Commands

| Task | Command |
|---|---|
| **All quality checks** | `npm run check:all` |
| **Full pre-ship gate (build + artifact checks + artifact tests)** | `npm run check:ship` |
| **Built artifact validation** | `npm run check:built-site` |
| **Build idempotence** | `npm run check:build-idempotence` |
| **E2E + accessibility tests** | `npm run test:e2e` |
| **Deploy artifact browser tests** | `npm run test:site` |
| **Regression tests only** | `npm run test:regression` |
| **Accessibility tests only** | `npm run test:a11y` |
| **HTML validation** | `npm run check:html` |
| **JS lint** | `npm run lint:js` |
| **Local dev server** | `python3 -m http.server 4173` |
| **Full site build (generators + `_site/`)** | `npm run build:site` |
| **Generate sitemap/robots only** | `node scripts/generate-seo-artifacts.mjs --out-dir _site` |
| **Refresh writing pages** | `npm run refresh:writing` |

Always run `npm run check:all` before committing.

`package.json` is the authority for the current quality checks. Run individual checks when debugging a specific failure.

`build:site` mutates the committed HTML (generators write into the source tree), so expect a dirty git status after running it. The `apply-*` scripts at the end of the chain (`apply-shared-ui`, `apply-image-dimensions`, `apply-seo`) are sitewide normalizers: shared chrome, image `width`/`height` attributes, and SEO metadata are enforced there rather than in each generator template.

## Contact Configuration

`assets/data/site.config.json` is checked in and configures the contact endpoint and success message. Update it only when the deployment endpoint changes.

## Architecture

### CSS — Cascade Layers (`assets/css/main.css`)

All styles live in one file using this layer order:

```
@layer reset, tokens, base, layout, components, utilities;
```

Color custom properties are registered with `@property` for animated transitions between light/dark modes. Dark mode uses both `prefers-color-scheme` media queries and a `[data-theme="dark"]` attribute, with Display P3 colors behind `@supports`. Spacing uses `clamp()` fluid values (`--space-1` through `--space-5`).

### JavaScript — ES Modules (`assets/js/`)

All twelve modules are live; nothing else ships:

- **header-scroll.js** — Loaded on every page; toggles `[data-scrolled]` on `.site-header` once `window.scrollY > 10` (gates the blur backdrop). Imports `inbound-prompt.js` and `gallery-card-scrub.js`.
- **inbound-prompt.js** — Time+scroll-triggered "Start a project" launcher and dialog; suppressed while another dialog is open.
- **gallery-card-scrub.js** — Pointer-scrub through gallery frames on work cards.
- **image-viewer.js** — Shared image lightbox: auto-injects its `<dialog>`, decorates content `<img>`s, wires click/keyboard/asset-protection handlers. Idempotent named helpers.
- **content-protection.js** — Prevents accidental browser-native image dragging without blocking text selection or context menus.
- **contact-form.js** — Contact form handling: lazy Turnstile loading on first interaction, rate limiting (3 successful sends per 10 minutes), honeypot, minimum fill time, and Turnstile reset on both success and failure paths.
- **site-config.js** — Loads `assets/data/site.config.json`, merges with defaults (used by contact-form).
- **hero-headline.js** — Rotates the homepage H1 through five variants (sessionStorage-seeded).
- **social-media-carousel.js** — Adds LinkedIn-style horizontal media controls, scroll position, and live image counts to writing cards.
- **recommendation-dialog.js** — Opens public LinkedIn recommendations in an accessible on-site dialog and restores focus when it closes.
- **service-taxonomy.js** — Exposes the canonical public service slugs and labels to browser modules and build scripts.
- **work-filter.js** — `?organization=` filtering on `/work/`; unknown values fall back to the unfiltered view with "All" marked current.

### Static Generation

`package.json` is the authority for generator order. The build validates its inputs, runs the page generators and refinement passes, then applies shared UI, image dimensions, and SEO metadata. `build-site.mjs` recreates `_site/` from an explicit public allowlist, copies only referenced images, creates responsive image variants, and emits sitemap and robots files.

Ground rules learned the hard way:
- Generators and `refine-*` scripts run against the committed source tree and must tolerate their own previous output (idempotence). Pattern-matching surgeries warn loudly instead of silently no-opping when markup drifts.
- Shared chrome (nav items, footer colophon/Company column, font preconnects) is normalized sitewide by `apply-shared-ui.mjs` — fix drift there, not per-template.
- `apply-image-dimensions.mjs` injects intrinsic `width`/`height` on every `<img>` lacking them (pure-JS WebP/PNG/JPEG/SVG header parsing; fails the build on unmeasurable images).
- `build-site.mjs` publishes only the approved route tree, runtime CSS/JS/icons, `site.config.json`, and images referenced by public files.
- `build-site.mjs` generates `_routes.json`, which invokes Functions only for `/api/*` and denied publication paths. `functions/_middleware.js` returns uncached 404 responses for those denied paths, and Pages Functions fail closed in production and preview.
- `optimize-site-images.mjs` runs inside `build-site.mjs` and adds responsive image variants plus `srcset` and `sizes` attributes to the deploy artifact.
- Only routes and assets cleared for public release enter generator inputs. Private or permission-restricted media stays outside the repository.
- **analyze-photo-folder.mjs** / **sync-eastrise-social-dimensions.mjs** / **sync-source-screenshots.mjs** / **import-eastrise-social-photography.mjs** / **sync-event-gallery-capture-dates.mjs** — manual photo/data utilities, not part of `build:site`.

**CI requirement:** Quality, performance, and deploy workflows install from the lockfile, build `_site/`, and validate the artifact before using it.

### Routes

`/` (home), `/about/`, `/blog/` plus its archive and post pages, `/contact/`, `/testimonials/`, `/services/` plus three service pages, and `/work/` plus the project pages listed in `publication-policy.mjs`. The `?organization=` query on `/work/` drives client-side filtering. The retired `/photography/`, `/links/`, `/likes/`, and `/colophon/` routes do not exist.

## Testing

Playwright uses Chromium against a local Python server on port 4173. The default config serves the source tree. `playwright.site.config.js` serves `_site/` and sets the test metadata root so file-based assertions inspect the deploy artifact.

- **`tests/site.spec.js`** — Navigation, organization filtering, proof controls, archive links, image zoom, and contact behavior
- **`tests/css-and-navigation.spec.js`** — Route publication, spacing, focus treatment, responsive layout, and overflow checks
- **`tests/public-content.spec.js`** — Public-content boundaries, contact disclosure and fallback, and breadcrumb checks against the configured site root
- **`tests/accessibility.spec.js`** — Axe audits every allowlisted public HTML document plus the inbound dialog and fails on moderate, serious, or critical violations

## CI/CD (`.github/workflows/`)

- **ci-quality.yml** — Builds `_site/`, runs source and artifact checks, scans generated links, then tests the artifact in Chromium. It runs directly for pull requests and as the reusable quality gate invoked by the `main` deployment workflow.
- **performance.yml** — Builds and validates `_site/`, then audits core routes and three representative image-heavy work pages with desktop Lighthouse. Budgets are performance ≥ 0.8, CLS ≤ 0.1, LCP ≤ 3 seconds, and total page weight ≤ 500 KB.
- **deploy-pages.yml** — Builds and validates `_site/`, deploys it to Cloudflare Pages with Wrangler, then checks live routes, the contact function, and retired private paths. The site no longer uploads images to R2 during deployment.
- **pr-hygiene.yml** — Enforces semantic PR titles (`feat`, `fix`, `chore`, `docs`, `refactor`, `test`, or `perf`)

## Conventions

- **Relative source paths**: Keep internal links and image references relative (`./`, `../`). Images are served same-origin from Cloudflare Pages. Exception: `404.html` uses root-absolute asset paths because it renders at arbitrary missing URLs.
- **JS module paths**: Use `new URL("../data/file.json", import.meta.url)` for fetches/imports relative to the current script.
- **Homepage section structure**: `path-row` (container) → `h2` (heading with link) → `path-strip` (horizontal scrollable) → `path-browse` (CTA link)
- **Social links**: `rel="me noopener"` for IndieWeb identity verification
- **JSON-LD**: Every published page has structured data; `404.html` (noindexed, renders at arbitrary URLs) is the lone exception — no `SearchAction` (client-side search only)
- **`aria-current`**: `"page"` for exact-match nav links, `"true"` for section-parent links; each `<nav>` needs unique `aria-label`
- **External content**: Use `DOMParser` (not `innerHTML`) for untrusted HTML. Keep CSP headers updated for external image sources.
- **2-space indentation**, LF line endings (see `.editorconfig`)

## Design System Reference

Visual identity documented in `docs/plans/2026-02-11-visual-design-system.md`. Typography: Barlow Condensed (headings) + Lora (body) via Google Fonts. Color palette rooted in industrial archive heritage — warm paper, forge orange accent.

## Design Preferences

- **Navigation style**: underline style, no pill borders. Heritage Gold accent, Manufacturing Red only on hover.
- **Contact placement**: Contact appears in the top-level navigation and the footer's Company column.
- **Homepage layout**: hero, practice overview, testimonial bands, one horizontal recent-project strip, and a software grid. `path-row` is reserved for the recent-project strip.
- **Blog posts**: open on-site as dedicated full pages (`/blog/post-slug/`) for SEO and direct linking, not as modals or external Local JSON links.
- **Photography**: organize into distinct "shoots" (galleries), each with a collage preview on homepage, not a single running gallery.
- **Footer sitemap**: the dark `.site-footer` contains a three-column `.site-footer__sitemap` for organizations, company links, and social icons. A separate `.site-footer__colophon` contains the OA monogram and firm description. The gold-to-red gradient marks the bottom edge.
- **Social media**: icons live in the footer's Social column. The hero uses the pill CTAs "See my projects" and "Get in touch" instead of social icons.
- **Hero pattern**: `.hero` card with `--surface-0` background, `--radius-tile` (18px), layered `--shadow-card`, `.hero__mesh` radial gradient (gold/red/plum, blurred 70px, 0.5 opacity), eyebrow chip with red dot, gradient-fill `<em>` in H1, two-tone `<strong>` subhead, ink-fill primary pill button + ghost pill button, gradient-fill proof stats.
- **Card surface hierarchy**: page background uses `--surface-1` (#ede8e0). All cards lift off the page using `--surface-0` (#faf8f5) + `--shadow-card` triple-stop shadow. `.path-strip` requires `padding-block: 0.75rem 2rem; padding-inline: 1.5rem; margin-inline: -1.5rem` to keep card shadows from clipping at the scroll-container edges.
- **Build process**: there is no frontend framework or runtime bundle. The Node build regenerates static HTML, applies normalizers, copies the public allowlist, optimizes responsive images, and creates SEO artifacts in `_site/`.

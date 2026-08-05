# Architecture

## Goal

A durable static-site baseline where every page is plain, committed HTML — no client-side content pipeline, no runtime data fetch for page content.

## Build Model

1. `npm run build:site` runs the generator chain in `package.json`: page generators (services, event galleries, portraits, career work, software, credit-union sites, contact, about, testimonials, writing, brand icons, media provenance) each write or rewrite HTML directly into the source tree.
2. `refine-*` scripts perform targeted in-place surgery on specific pages (home, work, about, contact, member-banking-stories). These must tolerate their own previous output, since they run again on every build against already-generated markup.
3. `apply-shared-ui.mjs` normalizes shared chrome sitewide: footer colophon and Company column, nav items (including Testimonials), font preconnects, and per-project image-provenance disclosures.
4. `apply-image-dimensions.mjs` injects intrinsic `width`/`height` on every `<img>` lacking them, by parsing WebP/PNG/JPEG/SVG headers directly (no image library dependency). Fails the build if an image can't be measured.
5. `apply-seo.mjs` derives title/description/canonical/OG/Twitter meta and JSON-LD from each page's real `<h1>`, replacing any hand-authored or previously generated meta rather than appending alongside it.
6. `build-site.mjs` copies the committed tree's public entries and every `assets/` subdirectory into `_site/`, then runs `generate-seo-artifacts.mjs` to emit `sitemap.xml` (excluding pages marked `noindex`) and `robots.txt`.

Because generators mutate the committed source tree, running `build:site` locally produces a dirty git status — that is expected, not a bug.

## Views

- Home (`/`), About (`/about/`), Testimonials (`/testimonials/`): single hand-authored or generator-owned pages.
- Work (`/work/`): index page plus ~45 per-project pages. The `?organization=` query drives client-side filtering (`assets/js/work-filter.js`) over server-rendered cards; there is no runtime data fetch.
- Writing (`/blog/`): index, archive, and per-post pages generated from `assets/data/writing-feed.json`.
- Services (`/services/*/`): three pages generated from `scripts/generate-service-pages.mjs`.
- Contact (`/contact/`): static form; submissions post to the Cloudflare Pages Function at `functions/api/contact.js`, which verifies Turnstile before sending through Resend.

## Content Sources

There is no canonical runtime "Post" object. Each content area has its own JSON data file under `assets/data/` (`eastrise-photography.json`, `eastrise-social.json`, `event-galleries.json`, `portraits.json`, `writing-feed.json`, `media-provenance.json`) consumed by exactly one generator at build time. Held-pending-permission galleries carry `heldPendingWrittenPermission: true` in their source data, which the generator renders as `<meta name="robots" content="noindex">` and `generate-seo-artifacts.mjs` excludes from the sitemap.

## Progressive Enhancement

- All eleven `assets/js/*.js` modules are optional enhancements over already-complete HTML: header scroll state, the image lightbox, contact-form validation/rate-limiting, gallery pointer-scrub, the inbound-project dialog, and client-side work filtering. None of them render primary content.
- `<noscript>` is not required anywhere, because there is nothing JS-dependent to fall back from.

## Hosting

- Deployed via `.github/workflows/deploy-pages.yml`: `npm run build:site`, then `npx wrangler pages deploy _site` to Cloudflare Pages.
- The same workflow also syncs `assets/images/` to an R2 bucket and verifies it's reachable at `assets.ames.consulting`, but no HTML in the deployed site currently references that hostname — images are served same-origin from Cloudflare Pages. This is a candidate for either wiring up or removing; see the CLAUDE.md note on `deploy-pages.yml`.

# Architecture

## Goal

A durable static-site baseline where every page is plain, committed HTML — no client-side content pipeline, no runtime data fetch for page content.

## Build Model

1. `npm run build:site` runs the generator chain in `package.json`: page generators (services, event galleries, portraits, career work, software, credit-union sites, contact, about, testimonials, writing, brand icons, media provenance) each write or rewrite HTML directly into the source tree.
2. `refine-*` scripts perform targeted in-place surgery on specific pages (home, work, about, contact, member-banking-stories). These must tolerate their own previous output, since they run again on every build against already-generated markup.
3. `apply-shared-ui.mjs` normalizes shared chrome sitewide: footer colophon and Company column, nav items (including Testimonials), font preconnects, date-sorted gallery navigation, and per-project image-provenance disclosures.
4. `apply-image-dimensions.mjs` injects intrinsic `width`/`height` on every `<img>` lacking them, by parsing WebP/PNG/JPEG/SVG headers directly (no image library dependency). Fails the build if an image can't be measured.
5. `apply-seo.mjs` derives title/description/canonical/OG/Twitter meta and JSON-LD from each page's real `<h1>`, replacing any hand-authored or previously generated meta rather than appending alongside it.
6. `build-site.mjs` recreates `_site/` from the explicit route and runtime-file allowlists in `publication-policy.mjs`. It copies only referenced WebP images under approved public prefixes, then optimizes those images and generates `_routes.json`, `sitemap.xml`, `robots.txt`, and `llms.txt`. The generated Function routes cover only `/api/*` and denied publication paths.

Because generators mutate the committed source tree, running `build:site` locally produces a dirty git status — that is expected, not a bug.

## Views

- Home (`/`), About (`/about/`), Testimonials (`/testimonials/`): single hand-authored or generator-owned pages.
- Work (`/work/`): index page plus the project pages listed in `publication-policy.mjs`. The `?organization=` query drives client-side filtering (`assets/js/work-filter.js`) over server-rendered cards; there is no runtime data fetch.
- Writing (`/blog/`): index, archive, and per-post pages generated from `assets/data/writing-feed.json`.
- Services (`/services/*/`): three pages generated from `scripts/generate-service-pages.mjs`.
- Contact (`/contact/`): static form that loads Turnstile after the visitor first interacts with it. The Cloudflare Pages Function checks the request origin, size, fill time, fields, and Turnstile token before sending through Resend. Without JavaScript, the page shows a direct email alternative.

## Content Sources

There is no canonical runtime "Post" object. Content areas use separate JSON files under `assets/data/`, and some files feed several build stages. For example, photography and portrait data also feed media provenance, while `media-provenance.json` is generated before `apply-shared-ui.mjs` adds disclosures to pages. Every listed asset must be safe for public access. Material without publication clearance stays outside the public data files and generated artifact.

`project-order.mjs` is the shared ordering layer. It validates
`project-dates.json`, sorts project and gallery-navigation links newest-first,
and preserves the verified oldest-first file lists for custom documentary
galleries. Event, EastRise, portrait, social, and website-gallery validators
enforce their own date evidence and display policies. Every public gallery must
declare `data-order-mode` as chronological, reverse-chronological, or editorial.

The EastRise formal portrait manifest uses `portraitGroup` to keep the 18-image
Leadership gallery separate from the 24-image Portraits gallery. Those 42
images represent 41 people because both verified Luke Buglion Gluck portraits
remain public. The candid John Dwyer portrait stays in the separate 13-series
EastRise photography archive.

## Progressive Enhancement

- All eleven `assets/js/*.js` modules are optional enhancements over already-complete HTML: header scroll state, the image lightbox, contact-form validation and rate limiting, gallery pointer-scrub, manual proof pagination, the inbound-project dialog, the recommendation dialog, and client-side work filtering. None of them render primary content.
- The contact form is hidden until its script loads. Its visible email alternative provides the no-JavaScript path without a separate `<noscript>` block.

## Hosting

- Deployed via `.github/workflows/deploy-pages.yml`: `npm run build:site`, then `npx wrangler pages deploy _site` to Cloudflare Pages.
- Images are served from the same Cloudflare Pages origin as the HTML. The deployment validates the generated artifact before it publishes the site.
- `functions/_middleware.js` returns uncached 404 responses for withheld, retired, and private runtime paths before Pages can serve an older cached asset. Pages Functions fail closed in production and preview.
- The site no longer depends on the legacy R2 origins at `assets.ames.consulting` and `assets.amesvt.com`. Scoped Cloudflare URL rewrites return 404 for preserved withheld media, and deployment checks verify denied and active samples on both domains.

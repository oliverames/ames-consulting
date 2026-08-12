# Project history

This file records the public architecture and publication rules that are useful
outside a development session. Git remains the detailed change record.

## Current architecture

- The site uses static HTML, layered CSS, and vanilla JavaScript modules.
- Node generators own repeated page groups and write committed source HTML.
- Sitewide passes normalize shared navigation, image dimensions, and metadata.
- Cloudflare Pages serves the generated `_site/` artifact.
- A Cloudflare Pages Function handles the contact form.

## Quality baseline

The repository checks JavaScript, HTML, structured data, image behavior, media
records, browser interactions, and accessibility. Deployment builds the site
before publishing it so tests can examine the artifact visitors receive.

## Publication boundary

Every tracked web asset must be safe for direct public access. Material without
publication clearance stays outside the repository and the deployment artifact.
Search directives such as `noindex` control indexing, not access.

## Reference documents

- `README.md` covers local development, quality commands, and hosting.
- `docs/ARCHITECTURE.md` explains the build and runtime design.
- `docs/CONTENT-MODEL.md` maps source data to generated pages.
- `docs/SPEC-MATRIX.md` tracks browser standards used by the site.

## 2026-08-11 - Public portfolio release

**What changed**: Completed the public-release sweep across the site, including all 35 browser review items. Removed the password gate, refined the core page layouts and copy, added the approved portfolio galleries, improved testimonial and writing content, and strengthened the contact form and publication checks.

**Decisions made**: Flight Paths remains the only BETA media project. Blue Cross galleries remain preserved in source but excluded from the public artifact. EastRise photography and portraits use verified public-source and authorship records, and the site publishes only allowlisted routes and referenced assets.

**Left off at**: The release artifact passed `npm run check:all`, `npm run check:built-site`, `npm run check:build-idempotence`, `npm run test:e2e` with 134 passes and one intended skip, and `npm run test:site` with 135 passes. The release workflow retries propagation checks. A fail-closed Pages Function returns marked 404 responses for denied paths, and scoped URL rewrites return 404 for preserved withheld media on both legacy R2 domains.

**Open questions**: NEW: Any deletion of legacy Cloudflare deployments or retired object-storage assets, and any Git history rewrite, remains destructive cleanup that requires explicit approval.

---

## 2026-08-11 - Contact delivery and gallery chronology

**What changed**: Verified the production contact form with one real submission and confirmed mailbox delivery, Reply-To behavior, and SPF, DKIM, and DMARC results. Protected the direct email fallback from Cloudflare address obfuscation. Added a shared project-date registry, explicit gallery order modes, original capture or publication dates, and chronology checks across the public portfolio.

**Decisions made**: Project cards and gallery navigation sort newest-first. Documentary event galleries sort oldest-first when capture evidence supports that sequence. Curated galleries remain editorial and say so in their data. Every EastRise photograph now has a verified publication date or a documented native capture date.

**Left off at**: Local release verification is complete. The final artifact passed `npm run check:all`, `npm run check:built-site`, `npm run check:build-idempotence`, `npm run test:e2e` with 144 passes and one intended source-only skip, and `npm run test:site` with 145 passes. Every one of the 52 public pages was reviewed at 1,440, 1,024, and 390 pixels wide. The audit found and fixed clipped mobile software previews, an empty EastRise/VSECU website proof-grid cell, and a first-paint homepage layout shift. Five final desktop Lighthouse runs recorded a maximum cumulative layout shift of 0.0028 against the 0.1 budget. Current source manifests contain 1,044 event photographs, 136 EastRise photographs across 13 series, and 42 EastRise formal portraits of 41 people. The formal collection has 18 Leadership images and 24 Portraits images, including two distinct portraits of Luke Buglion Gluck. The `ames.photo` and `www.ames.photo` domains redirect to `ames.consulting` while preserving the path and query. Production deployment verification follows the push.

**Open questions**: None for this release.

---

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

## 2026-08-13 - Sitewide consistency pass

**What changed**: Standardized the site's content width, vertical rhythm, project typography, card surfaces, button treatments, footer targets, dialog controls, and contact-form errors. Added the Services index, one shared three-service taxonomy, canonical project titles, consistent navigation state, visible Work return links, gallery-order notes, and a permanent redirect from the duplicate portrait route. Commit `f57a6b5`.

**Decisions made**: The public service names are Photography and video, Strategy and content, and Practical technology. Internal links use `→`, external links use `↗`, and parent links use `←`. Exact top-level routes use `aria-current="page"`; section children mark their parent with `aria-current="true"`. `/work/eastrise-portraits/` is the canonical EastRise portrait route.

**Left off at**: GitHub Actions run `31728993837` passed static checks, repeat-build validation, link checks, Lighthouse, and all 153 deploy-artifact browser and accessibility tests. Cloudflare deployment and live verification passed. Direct checks returned 200 for `/`, `/services/`, and `/contact/`, and 301 from `/work/portraits-and-people/` to the canonical portrait route.

**Open questions**: Resolved this session: the spacing, width, component, navigation, service-taxonomy, project-naming, and duplicate-route inconsistencies. Still open from the separate security sweep: monitor the ames.consulting HSTS preload submission until its status changes from pending.

---

## 2026-08-13 - Security hardening sweep

**What changed**: Hardened the contact Function (Turnstile result now bound to the requesting hostname, 10-second timeouts with structured 502 JSON around the Turnstile and Resend fetches, and a clock-skew-tolerant timestamp window replacing the server-side minimum-fill check). Moved the sitewide security-header policy into `scripts/security-headers.mjs` as the single source, imported by the publication middleware and enforced against `_headers` by the new `check:security-headers` gate. Added the HSTS `preload` token, a Dependabot config for Actions and npm, and fetch timeouts in `refresh-writing-content.mjs`. Commits `5a247c8` and `5f2800b`.

**Decisions made**: A Cloudflare WAF rate-limiting rule "Contact form POST throttle" (POST /api/contact, per-IP, 5 requests/10s, block 10s) now lives in the dashboard, using the free plan's only rule slot; it covers the custom domains but not `ames-consulting.pages.dev`. ames.consulting was submitted to hstspreload.org (status pending). The server no longer enforces a minimum fill time because the client-supplied timestamp made it false-reject visitors with fast clocks while stopping no real attacker. The generator-embedded meta CSP on writing pages stays page-specific by design.

**Left off at**: Deploy run 31673576335 green with 145 Playwright passes. Live checks confirmed: burst of 8 POSTs returned five 403s then 429s, and the apex serves `strict-transport-security: max-age=31536000; includeSubDomains; preload`. The first deploy attempt failed because `tests/contact-function.spec.js` mocked siteverify without a hostname; fixed in `5f2800b`.

**Open questions**: None. Watch hstspreload.org status flipping from pending to preloaded over the coming weeks.

---

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

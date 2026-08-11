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

**Left off at**: The release artifact passed `npm run check:all`, `npm run check:built-site`, `npm run check:build-idempotence`, `npm run test:e2e` with 134 passes and one intended skip, and `npm run test:site` with 135 passes. Live deployment and route checks follow the verified main-branch release workflow.

**Open questions**: NEW: Any deletion of legacy Cloudflare deployments or retired object-storage assets, and any Git history rewrite, remains destructive cleanup that requires explicit approval.

---

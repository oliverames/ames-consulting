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

# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses SemVer-style versioning.

## [Unreleased]

### Fixed

- Preserved direct email links for visitors without JavaScript by disabling Cloudflare email obfuscation around the contact and About addresses.
- Prevented all six software project previews from clipping their console or screen content on mobile.
- Matched three-item and four-item website proof grids to their actual content, which removed the empty VSECU tile.
- Kept the homepage hero copy width stable while its portrait and rotating headline initialize, which prevents first-paint layout shifts.
- Sorted public project cards and gallery navigation by verified dates, and sorted documentary galleries by original capture time.
- Declared and validated chronological, reverse-chronological, editorial, and undated gallery policies across the public site.
- Split 42 EastRise formal portraits of 41 people into an 18-image Leadership gallery and a 24-image Portraits gallery, while retaining both Luke Buglion Gluck portraits.
- Kept the candid John Dwyer portrait in the separate EastRise photography archive, which now contains 136 dated images across 13 series.
- Scoped the blog metadata browser test to the visible blog article so the image viewer dialog does not trigger Playwright strict mode.
- Updated stale image checks to match the WebP files served by the work pages.
- Fixed mobile path strips that widened the document beyond the viewport.
- Removed the unsupported `frame-ancestors` meta directive that produced console errors. Framing protection remains documented as an edge-header requirement.
- Restored the MIT license file referenced by the README and package metadata.
- Expanded CI to run the complete Playwright suite, including navigation and layout checks, and made lint warnings fail the build.
- Updated the GitHub Actions and Node versions used by the quality, Pages, and Lighthouse workflows.
- Reduced blog card image payloads and made the 500 KB Lighthouse network budget a required gate.

### Added

- Contact page scaffold with structured form and placeholder contact channels.
- Read-time estimation for post cards and preview dialog.
- Image viewer dialog for enlarged content images.
- Asset download deterrence hooks (best-effort client-side controls).
- SEO runtime metadata sync and JSON-LD validation tooling.
- Deploy-time `robots.txt` and `sitemap.xml` generation.
- CI quality gates for linting, HTML validation, structured data checks, links, e2e, and accessibility smoke tests.
- Lighthouse performance budget workflow.
- PR hygiene workflow with semantic title enforcement.
- Release process and security baseline documentation.

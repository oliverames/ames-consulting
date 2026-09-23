# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses SemVer-style versioning.

## [Unreleased]

### Changed

- Removed the EastRise, VSECU, and Blue Cross Vermont work: 22 project pages, their generators, validators, data files, and images. The routes now return an uncached 404 through the retired publication list. Career history, testimonials, and LinkedIn posts that mention those employers remain, and the homepage and About proof figures now point to the About page.
- Hid the Store link in the navigation and footer until `store.ames.consulting` serves HTTPS, because the HSTS preload makes the store unreachable without a certificate.
- Replaced the service-page project cards that pointed to removed work with VTDigger, Connecticut College, Fairbanks, NEG-ECP, Ping Warden, Skylight Bridge, and YNAB MCP.
- Revised site copy from the 2026-09-23 copy review (`docs/audits/2026-09-23-copy-review.md`): the Work intro, About opening, Apple Core and Meta MCP intros, service-page kickers, the software heading, and the GMCF, drone, 404, and testimonials text.
- Merged the Dependabot minor and patch updates and scoped the sharp override to every Miniflare version so wrangler updates can't reintroduce the vulnerable sharp.

- Rebuilt the Ping Warden work page as a product page for cloud gamers: a search-facing title and description, SoftwareApplication structured data with the $15 Gumroad offer, a purchase button ahead of the repository link, and four story cards. The software generator gained an optional store link and a highlighted fact chip, and a fourth story card gets the plum rule.

### Fixed

- Balanced the software section heading, which a 10ch cap had forced into six ragged lines.
- Raised writing-card source links to a 24px minimum tap target on mobile.
- Corrected the homepage Ping Warden card, which still described the retired positioning, and the software project count on the practical technology page.
- Raised the Lighthouse total page-weight budget to 700 KB to accommodate the 175 KB Google tag loader on image-heavy work pages.
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

- Google Analytics 4 measurement (`G-YF4LQ85VRE`) on every page through a guarded external script that sends hits only from `ames.consulting` and `www.ames.consulting`, with CSP updated for Google's analytics hosts.
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

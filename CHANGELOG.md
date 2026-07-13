# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses SemVer-style versioning.

## [Unreleased]

### Fixed

- Scoped the blog metadata browser test to the visible blog article so the image viewer dialog does not trigger Playwright strict mode.
- Updated stale image checks to match the WebP files served by the work pages.
- Fixed mobile path strips that widened the document beyond the viewport.
- Removed the unsupported `frame-ancestors` meta directive that produced console errors. Framing protection remains documented as an edge-header requirement.
- Restored the MIT license file referenced by the README and package metadata.
- Expanded CI to run the complete Playwright suite, including navigation and layout checks, and made lint warnings fail the build.
- Updated the GitHub Actions and Node versions used by the quality, Pages, and Lighthouse workflows.

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

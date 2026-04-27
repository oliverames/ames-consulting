# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses SemVer-style versioning.

## [Unreleased]

### Added

- Stripe-style homepage redesign behind opt-in `<html data-stripe>` attribute. Adds OKLCH gradient mesh hero with two-tone copy and gradient-clipped numerals, featured bento grid mixing photography shoots and work case studies, in-place lightbox dialog with View Transitions / keyboard nav / pointer-event swipe / neighbor preload / history integration, two-tone explainer band with three practice-area cards, customer-quote slot, dark CTA band with gold-and-plum gradient wash, scroll-driven section reveals, live stat counters on first scroll into view, and Speculation Rules for hover-prerender on work case studies. Restyles the legacy `home-paths` horizontal scroll strips to match the new tile aesthetic. Existing routes without `data-stripe` are byte-for-byte unchanged.
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

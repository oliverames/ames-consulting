# ames.consulting

Standards-forward foundation for a GitHub Pages site with a single content stream powered by Micro.blog.

## Why This Structure

This project is intentionally optimized for *buildability over early polish*.

- One content source: Micro.blog posts.
- One canonical content model: every entry is a `post`.
- Multiple views: Home, Blog, and Portfolio are just filtered presentations of the same stream.
- Progressive enhancement: modern platform features are enabled when supported, with functional fallbacks.

The result is a base that stays coherent as complexity grows.

## Site Strategy

### Unified Stream

- `Blog` = all posts.
- `Portfolio` = posts filtered by `portfolio` tag (or `?tag=portfolio` query).
- `Home` = curated preview from the same stream.

This avoids blog/portfolio content drift and duplicate systems.

### Content Backend

- Primary source: Micro.blog JSON feed.
- Development fallback: local JSON sample (`assets/data/content.example.json`).
- Normalization layer converts feed items into a stable in-app schema.

### Frontend Baseline

- Pure static hosting target (GitHub Pages).
- No framework lock-in.
- ES modules for clear separation: configuration, source adapters, UI, web components.

## Standards Coverage Approach

Using “all of HTML/CSS” literally in one pass is not practical, so this repo uses a tracked spec-coverage strategy:

- Implement a representative set of modern, high-value features now.
- Track additional HTML/CSS modules and adoption in `docs/SPEC-MATRIX.md`.
- Expand coverage intentionally over time without rewrites.

Current baseline includes:

- HTML: semantic landmarks, templates, custom elements integration, `dialog`, popover UI hooks, structured metadata, form primitives.
- CSS: cascade layers, registered custom properties (`@property`), container queries, `:has()`, nesting, `color-mix()`, reduced-motion handling.
- JS: modular architecture, route-aware rendering, normalized data model, client-side tag/search filters.

## Repository Layout

- `index.html` - Home shell.
- `blog/index.html` - Full stream view.
- `portfolio/index.html` - Portfolio-tag stream view.
- `contact/index.html` - Contact page with form scaffold and contact info placeholders.
- `assets/css/main.css` - Layered CSS architecture.
- `assets/js/app.js` - App bootstrap + rendering.
- `assets/js/contact-form.js` - Contact form plumbing and anti-abuse controls.
- `assets/js/content-sources.js` - Micro.blog/local source adapters.
- `assets/js/post-card.js` - `post-card` custom element.
- `assets/js/seo.js` - Dynamic metadata and structured data sync.
- `assets/js/site-config.js` - Runtime configuration loader.
- `assets/data/site.config.example.json` - Config template.
- `assets/data/content.example.json` - Local fallback data.
- `assets/data/microblog-feed.example.json` - Feed schema sample for validation.
- `docs/ARCHITECTURE.md` - System design.
- `docs/CONTENT-MODEL.md` - Canonical post schema.
- `docs/FEATURE-CHARTER-V1.md` - Decision-complete feature scope and contracts.
- `docs/SECURITY.md` - Security controls, limits, and hardening guidance.
- `docs/RELEASE-PROCESS.md` - Release checklist and branch protection settings.
- `docs/SPEC-MATRIX.md` - Feature coverage tracker.
- `docs/REFERENCE-SITE-MATRIX.md` - Scored analysis of reference sites and decision mapping.
- `docs/FOUNDATION-CHECKLIST.md` - Do/don't build gate for future iterations.
- `docs/WEIGHTED-RUBRIC.md` - Weighted scoring rubric with floors, gates, and thresholds.
- `docs/ITERATION-SCORECARD-TEMPLATE.md` - Reusable worksheet for each design iteration review.
- `.github/workflows/ci-quality.yml` - Quality gates (lint, validation, links, regression, a11y).
- `.github/workflows/performance.yml` - Lighthouse performance budget checks.
- `.github/workflows/pr-hygiene.yml` - Semantic PR title enforcement.
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment.

## GitHub Pages Hosting

This repo is configured for GitHub Actions based Pages deploy.

- Workflow file: `.github/workflows/deploy-pages.yml`
- Custom domain file: `CNAME` (set to `ames.consulting`)

If you use a different domain, update `CNAME`.

## Local Development

From the repo root:

```bash
npm install
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/`
- `http://localhost:4173/blog/`
- `http://localhost:4173/portfolio/`
- `http://localhost:4173/contact/`

## Quality Commands

```bash
npm run check:all
npm run test:regression
npm run test:a11y
```

## Micro.blog Configuration

1. Copy `assets/data/site.config.example.json` to `assets/data/site.config.json`.
2. Set `provider` to `microblog`.
3. Set `jsonFeedUrl` to your Micro.blog JSON feed URL.
4. Set `contactFormEndpoint` to your form backend endpoint (optional until ready).

Until then, the app automatically uses local sample content.

## Build Roadmap

1. Connect live Micro.blog feed and verify normalization with real posts.
2. Define final information architecture and interaction model.
3. Apply visual design system and motion language.
4. Expand spec-matrix coverage in controlled increments.
5. Tune Lighthouse budgets and tighten CSP at edge/header layer.

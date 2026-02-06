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
- `assets/css/main.css` - Layered CSS architecture.
- `assets/js/app.js` - App bootstrap + rendering.
- `assets/js/content-sources.js` - Micro.blog/local source adapters.
- `assets/js/post-card.js` - `post-card` custom element.
- `assets/js/site-config.js` - Runtime configuration loader.
- `assets/data/site.config.example.json` - Config template.
- `assets/data/content.example.json` - Local fallback data.
- `docs/ARCHITECTURE.md` - System design.
- `docs/CONTENT-MODEL.md` - Canonical post schema.
- `docs/SPEC-MATRIX.md` - Feature coverage tracker.
- `docs/REFERENCE-SITE-MATRIX.md` - Scored analysis of reference sites and decision mapping.
- `docs/FOUNDATION-CHECKLIST.md` - Do/don't build gate for future iterations.
- `docs/WEIGHTED-RUBRIC.md` - Weighted scoring rubric with floors, gates, and thresholds.
- `docs/ITERATION-SCORECARD-TEMPLATE.md` - Reusable worksheet for each design iteration review.
- `.github/workflows/deploy-pages.yml` - GitHub Pages deployment.

## GitHub Pages Hosting

This repo is configured for GitHub Actions based Pages deploy.

- Workflow file: `.github/workflows/deploy-pages.yml`
- Custom domain file: `CNAME` (set to `ames.consulting`)

If you use a different domain, update `CNAME`.

## Local Development

From the repo root:

```bash
python3 -m http.server 4173
```

Then open:

- `http://localhost:4173/`
- `http://localhost:4173/blog/`
- `http://localhost:4173/portfolio/`

## Micro.blog Configuration

1. Copy `assets/data/site.config.example.json` to `assets/data/site.config.json`.
2. Set `provider` to `microblog`.
3. Set `jsonFeedUrl` to your Micro.blog JSON feed URL.

Until then, the app automatically uses local sample content.

## Build Roadmap

1. Connect live Micro.blog feed and verify normalization with real posts.
2. Define final information architecture and interaction model.
3. Apply visual design system and motion language.
4. Expand spec-matrix coverage in controlled increments.
5. Add CI checks for accessibility, HTML validation, and regression snapshots.

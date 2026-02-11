# ames.consulting

Personal portfolio and consulting site for Oliver Ames. Standards-forward static site on GitHub Pages with a blog stream powered by Micro.blog.

## Site Structure

| Route | Purpose |
|---|---|
| `/` | Home — intro, featured work, site directory |
| `/work/` | Work landing — software and web project categories |
| `/work/bcbs-vt-app/` | BCBS VT companion app case study |
| `/work/sunshine-trail/` | The Sunshine Trail interactive map case study |
| `/blog/` | Full Micro.blog post stream with tag/search filtering |
| `/contact/` | Contact form and social links |
| `/likes/` | Stuff I Like — curated recommendations |
| `/colophon/` | How this site is built |

## Why This Structure

- One content source: Micro.blog posts.
- One canonical content model: every entry is a `post`.
- Blog and filtered views are presentations of the same stream.
- Work pages are hand-crafted case studies with static HTML.
- Progressive enhancement: modern platform features with functional fallbacks.

### Content Backend

- Primary source: Micro.blog JSON feed.
- Development fallback: local JSON sample (`assets/data/content.example.json`).
- Normalization layer converts feed items into a stable in-app schema.

### Frontend Baseline

- Pure static hosting target (GitHub Pages).
- No framework lock-in.
- ES modules for clear separation: configuration, source adapters, UI, web components.

## Standards Coverage

Current baseline includes:

- HTML: semantic landmarks, templates, custom elements integration, `dialog`, popover UI hooks, structured metadata (JSON-LD), form primitives.
- CSS: cascade layers, registered custom properties (`@property`), container queries, `:has()`, nesting, `color-mix()`, Display P3 colors, reduced-motion handling.
- JS: modular architecture, route-aware rendering, normalized data model, client-side tag/search filters.

Tracked in `docs/SPEC-MATRIX.md`.

## Local Development

```bash
npm install
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.

## Quality Commands

```bash
npm run check:all       # lint, HTML validation, structured data, sample data
npm run test:e2e        # full Playwright test suite
npm run test:regression # regression tests only
npm run test:a11y       # accessibility audits only
```

## Micro.blog Configuration

1. Copy `assets/data/site.config.example.json` to `assets/data/site.config.json`.
2. Set `provider` to `microblog`.
3. Set `jsonFeedUrl` to your Micro.blog JSON feed URL.
4. Set `contactFormEndpoint` to your form backend endpoint (optional until ready).

Until then, the app automatically uses local sample content.

## GitHub Pages Hosting

Deployed via GitHub Actions (`.github/workflows/deploy-pages.yml`). Custom domain set in `CNAME`.

## CI/CD

- **ci-quality.yml** — Static checks, broken link scan, E2E/a11y tests
- **performance.yml** — Lighthouse budget enforcement
- **deploy-pages.yml** — GitHub Pages deployment with SEO artifact generation
- **pr-hygiene.yml** — Semantic PR title validation

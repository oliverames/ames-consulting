<h1 align="center">ames.consulting</h1>

<p align="center">
  <strong>Portfolio and consulting site for Oliver Ames, a content strategist, software tinkerer, and video producer in Montpelier, Vermont</strong>
</p>

<p align="center">
  <code>static site</code> &bull;
  <code>Cloudflare Pages + R2</code> &bull;
  <code>no framework</code>
</p>

<p align="center">
  <a href="https://ames.consulting"><img src="https://img.shields.io/badge/Live_Site-ames.consulting-f5a542?style=flat-square" alt="Live Site"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f5a542?style=flat-square" alt="License"></a>
  <a href="https://www.buymeacoffee.com/oliverames"><img src="https://img.shields.io/badge/Buy_Me_a_Coffee-support-f5a542?style=flat-square&logo=buy-me-a-coffee&logoColor=white" alt="Buy Me a Coffee"></a>
</p>

<p align="center">
  <a href="#site-structure">Structure</a> &bull;
  <a href="#local-development">Development</a> &bull;
  <a href="#cicd">CI/CD</a>
</p>

---

The public repository uses demo names, contact details, and work samples. Replace the demo pages and `assets/data/site.config.json` before publishing a fork.

## Why This Structure

A personal site should outlast whatever framework is trending. This site uses no build-time JavaScript framework. It is plain HTML, CSS (cascade layers, container queries, registered custom properties), and ES modules. Content from either a JSON feed or the local sample data is normalized into one post model, then filtered in the browser. The site stays quick to load and does not need a Node.js build pipeline in production.

Hosted on Cloudflare Pages with image assets delivered from Cloudflare R2. GitHub Actions enforces HTML validation, Lighthouse performance budgets, and accessibility audits on every push.

## Site Structure

| Route | Purpose |
|---|---|
| `/` | Home: intro, featured work, site directory |
| `/work/` | Work landing: software, web, and consulting projects |
| `/blog/` | Full Local JSON post stream with tag/search filtering |
| `/photography/` | Photography galleries organized by shoot |
| `/links/` | Link directory |
| `/contact/` | Contact form and social links |
| `/likes/` | Stuff I Like: curated recommendations |
| `/colophon/` | How this site is built |

## Architecture Decisions

- **One content source**: Local JSON posts.
- **One canonical model**: every entry is a `post`.
- **Blog and filtered views** are presentations of the same stream.
- **Work pages** are hand-crafted case studies with static HTML.
- **Progressive enhancement**: modern platform features with functional fallbacks.

### Content Backend

- Primary source: Local JSON JSON feed.
- Development fallback: local JSON sample (`assets/data/content.example.json`).
- Normalization layer converts feed items into a stable in-app schema.

### Frontend Baseline

- Pure static hosting target (Cloudflare Pages).
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
npm ci
npx playwright install chromium
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

## Content Configuration

1. Start with `assets/data/site.config.example.json` and update `assets/data/site.config.json`.
2. Set `provider` to `microblog` if you want to use a JSON feed.
3. Set `jsonFeedUrl` to that feed's URL.
4. Set `contactFormEndpoint` when the form backend is ready.

Until then, the app automatically uses local sample content.

## Cloudflare Hosting

GitHub remains the source of truth. A push to `main` uploads `assets/images/` to the dedicated `ames-website-assets` R2 bucket, rewrites the production artifact to use `assets.ames.consulting`, and deploys `_site/` to Cloudflare Pages.

## CI/CD

- **ci-quality.yml**: Static checks, broken link scan, browser tests, and accessibility checks
- **performance.yml**: Lighthouse budget enforcement
- **deploy-pages.yml**: R2 image upload and Cloudflare Pages deployment with SEO artifact generation
- **pr-hygiene.yml**: Semantic PR title validation

---

<p align="center">
  <a href="https://www.buymeacoffee.com/oliverames">
    <img src="https://img.shields.io/badge/Buy_Me_a_Coffee-support-f5a542?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white" alt="Buy Me a Coffee">
  </a>
</p>

<p align="center">
  <sub>
    Built by <a href="https://ames.consulting">Oliver Ames</a> in Vermont
    &bull; <a href="https://github.com/oliverames">GitHub</a>
    &bull; <a href="https://linkedin.com/in/oliverames">LinkedIn</a>
    &bull; <a href="https://bsky.app/profile/oliverames.bsky.social">Bluesky</a>
  </sub>
</p>

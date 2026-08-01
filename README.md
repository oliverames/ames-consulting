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

A personal site should outlast whatever framework is trending. This site has no client-side content pipeline at all: a chain of Node generator scripts (`npm run build:site`) writes and refines plain, committed HTML, then copies it into `_site/` for deploy. Nothing about a page's content depends on JavaScript running in the visitor's browser. CSS uses cascade layers, container queries, and registered custom properties; the handful of JS modules that do ship are progressive enhancements (image lightbox, contact-form validation, work filtering) layered on top of already-complete markup.

Hosted on Cloudflare Pages, deployed with wrangler. GitHub Actions enforces HTML validation, Lighthouse performance budgets, and accessibility audits on every push.

## Site Structure

| Route | Purpose |
|---|---|
| `/` | Home: intro, featured work, site directory |
| `/work/` | Work index plus ~45 per-project case studies; `?organization=` filters client-side |
| `/blog/` | Writing index, archive, and per-post pages |
| `/about/` | Profile and background |
| `/services/*/` | Photography & video, strategy & content, practical technology |
| `/testimonials/` | Client and colleague recommendations |
| `/contact/` | Contact form and social links |

## Architecture Decisions

- **No runtime content pipeline**: every page is static HTML written by a build-time generator, not assembled from a client-side data fetch.
- **Generators own their pages**: each content area (`services`, `event-galleries`, `portraits`, `career-work`, `software`, `credit-union-websites`, `writing`, `contact`, `about`, `testimonials`) has one generator script; shared chrome (footer, nav, image dimensions, SEO meta) is normalized sitewide by dedicated `apply-*` passes that run last.
- **Work pages** are generated or hand-crafted case studies with static HTML, tagged by organization for the `/work/` filter.
- **Progressive enhancement**: the JS that does ship never gates primary content.

See `docs/ARCHITECTURE.md` and `docs/CONTENT-MODEL.md` for the full build chain and data-file inventory.

### Frontend Baseline

- Pure static hosting target (Cloudflare Pages).
- No framework lock-in.
- ES modules for clear separation of concerns: header scroll state, image lightbox, contact form, gallery scrub, work filtering.

## Standards Coverage

Current baseline includes:

- HTML: semantic landmarks, templates, custom elements integration, `dialog`, popover UI hooks, structured metadata (JSON-LD), form primitives.
- CSS: cascade layers, registered custom properties (`@property`), container queries, `:has()`, nesting, `color-mix()`, Display P3 colors, reduced-motion handling.
- JS: ES modules as progressive enhancement only — image lightbox, contact-form validation, gallery pointer-scrub, work filtering.

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
npm run build:site      # regenerate the site into the source tree and _site/
npm run check:all       # syntax, lint, HTML validation, structured data, image loading, and content-integrity checks (11 total)
npm run test:e2e        # full Playwright test suite (functional + accessibility)
npm run test:regression # regression tests only
npm run test:a11y       # accessibility audits only
```

`build:site` mutates the committed HTML in place — expect a dirty git status after running it locally.

## Content Configuration

1. Start with `assets/data/site.config.example.json` and update `assets/data/site.config.json`.
2. Set `contactFormEndpoint` and `contactFormSuccessMessage` for the contact form's Cloudflare Pages Function.

That's the only remaining runtime config fetch; everything else on the site is static HTML.

## Cloudflare Hosting

GitHub remains the source of truth. A push to `main` runs `npm run build:site` and deploys `_site/` to Cloudflare Pages with wrangler. The same workflow also syncs `assets/images/` to an R2 bucket, but the deployed site currently serves its images same-origin from Cloudflare Pages rather than from the R2 hostname.

The contact form uses a Managed Cloudflare Turnstile widget with interaction-only appearance. Its public sitekey is part of the generated contact page; the private `TURNSTILE_SECRET_KEY` is stored as an encrypted Cloudflare Pages secret. The Pages Function validates every token with Cloudflare before sending the inquiry through Resend.

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

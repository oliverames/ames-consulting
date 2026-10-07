<p align="center">
  <img src="assets/images/brand/oa-social-mark.svg" width="80" height="80" alt="Oliver Ames monogram">
</p>

<h1 align="center">ames.consulting</h1>

<p align="center">
  <strong>Photography, video, writing, and software by Oliver Ames in Montpelier, Vermont</strong>
</p>

<p align="center">
  <code>static site</code> &bull;
  <code>Cloudflare Pages</code> &bull;
  <code>no framework</code>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-f5a542?style=flat-square" alt="License"></a>
  <a href="https://www.buymeacoffee.com/oliverames"><img src="https://img.shields.io/badge/Buy_Me_a_Coffee-support-f5a542?style=flat-square&logo=buy-me-a-coffee&logoColor=white" alt="Buy Me a Coffee"></a>
  <a href="https://ames.consulting"><img src="https://img.shields.io/badge/Live_Site-ames.consulting-f5a542?style=flat-square" alt="Live Site"></a>
</p>


---

[ames.consulting](https://ames.consulting) brings Oliver's photography, video, writing, and software work together in a static portfolio. This repository contains real portfolio content and media. Replace the pages, data, images, and contact settings before publishing a fork.

## Why This Exists

The site keeps portfolio content in plain HTML so visitors can read it without waiting for a client-side content pipeline. Build-time generators assemble the content, and shared passes apply navigation, image dimensions, and search metadata. JavaScript adds filtering, galleries, and form interactions to the rendered pages.

The deployment artifact has an explicit publication allowlist. This keeps withheld or retired content out of `_site/`, even when source material remains in the repository.

## Quick Start

Use Node.js 24, as configured in CI, and Python 3 for the source preview:

```bash
npm ci
python3 -m http.server 4173 --bind 127.0.0.1
```

Open [the local preview](http://127.0.0.1:4173/). Keep the source server bound to loopback because the source tree includes material excluded from publication. The Python server previews static pages and doesn't run the contact Pages Function.

To regenerate and preview the deployment artifact:

```bash
npm run build:site
node scripts/serve-built-site.mjs
```

Stop the source preview first because both commands use port 4173 by default. `build:site` rewrites generated HTML in the source tree and replaces `_site/`, so review the resulting changes.

## Site Structure

| Route | Purpose |
|---|---|
| `/` | Introduction, featured work, and site directory |
| `/work/` | Work index and published project case studies, with an organization filter |
| `/blog/` | Writing index, archive, and published posts |
| `/about/` | Profile and background |
| `/services/` | Photography and video, strategy and content, and practical technology |
| `/testimonials/` | Client and colleague recommendations |
| `/contact/` | Contact form and social links |
| `/cloudforce/`, `/cloudforce/privacy/` | CloudForce support and privacy policy |

[`scripts/publication-policy.mjs`](scripts/publication-policy.mjs) defines the public routes and runtime files. The build copies referenced public images and generates the sitemap, robots policy, and release marker. A scoped Pages Function handles contact requests and uncached 404 responses for withheld or retired paths.

## Content and Architecture

| Path | Role |
|---|---|
| `scripts/generate-*.mjs` | Content generators for pages, galleries, writing, and brand assets |
| `scripts/apply-*.mjs` | Shared navigation, image dimensions, and search metadata |
| `assets/data/` | Content indexes, contact configuration, ordering, and media provenance |
| `assets/css/main.css` | Shared styles, including responsive layout and reduced-motion handling |
| `assets/js/` | Browser enhancements for navigation, media, filtering, and forms |
| `functions/` | Contact delivery and publication-boundary handling |
| `scripts/build-site.mjs` | Copies the allowlisted deployment artifact into `_site/` |
| `tests/` | Node checks, browser regressions, and accessibility tests |

Edit a page's generator or data source when it owns the output. The next build can overwrite a direct edit to generated HTML. See [Architecture](docs/ARCHITECTURE.md), [Content Model](docs/CONTENT-MODEL.md), and [Standards Matrix](docs/SPEC-MATRIX.md) for the detailed reference.

## Configuration

| Setting | Required | Default | Description |
|---|---|---|---|
| `contactFormEndpoint` | For the contact form | `/api/contact` | Public endpoint in `assets/data/site.config.json` |
| `contactFormSuccessMessage` | For the contact form | `Thanks, your message was sent.` | Confirmation text in the same file |
| `RESEND_API_KEY` | For contact delivery | None | Pages secret used to send inquiries |
| `CONTACT_EMAIL` | For contact delivery | None | Recipient configured in the Pages environment |
| `TURNSTILE_SECRET_KEY` | For contact delivery | None | Pages secret used to validate the form's Turnstile token |
| `PORT` | No | `4173` | Port for `scripts/serve-built-site.mjs` |
| `SITE_ROOT` | No | `_site` | Directory served by the artifact preview |

The public Turnstile sitekey is generated into the contact page. The widget loads after the visitor interacts with the form. The server validates the origin, payload, fill time, fields, and Turnstile result before sending through Resend.

## Development and Verification

Install Chromium once for the browser tests:

```bash
npx playwright install chromium
```

| Command | What it checks or changes |
|---|---|
| `npm run build:site` | Regenerates source HTML and `_site/` |
| `npm run check:all` | Build inputs, publication rules, functions, headers, syntax, HTML, structured data, images, and content |
| `npm run check:built-site` | Contents of the generated public artifact |
| `npm run test:e2e` | Full Playwright suite against the source tree |
| `npm run test:site` | Playwright suite against `_site/` |
| `npm run test:regression` | Browser regression checks |
| `npm run test:a11y` | Accessibility checks |
| `npm run check:ship` | Build idempotence, generation, source checks, artifact checks, and artifact browser tests |

The browser suites start their own local servers. Build `_site/` before running `test:site`, or use `check:ship` for the complete sequence. See [Contributing](CONTRIBUTING.md) and [Changelog](CHANGELOG.md).

## Deployment

The `main` workflow runs the reusable quality gate and Lighthouse checks, then deploys the exact `_site/` artifact that passed the browser suite. It uses Cloudflare Pages project `ames-consulting` and the GitHub secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

The workflow verifies the release marker and expected responses on the Pages host, apex domain, and `www` domain after deployment. Lighthouse checks include a 700,000-byte total page-weight threshold. These are configured checks, not a claim that any particular deployment has passed.

| Workflow | Purpose |
|---|---|
| `ci-quality.yml` | Source and artifact checks, offline link checking, browser and accessibility tests |
| `performance.yml` | Lighthouse checks for core routes and representative galleries |
| `deploy-pages.yml` | Deploys the tested artifact and checks receiving hosts |
| `pr-hygiene.yml` | Validates pull-request titles |

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

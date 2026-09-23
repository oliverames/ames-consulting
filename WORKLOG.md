# Project history

## Open items

- Gumroad has not issued the `store.ames.consulting` TLS certificate. The domain is now HSTS-preloaded, so browsers refuse the store entirely. The Store link is hidden behind `STORE_LINK_ENABLED` in `scripts/apply-shared-ui.mjs`; restore it and the site-consistency assertions once HTTPS works (since 2026-09-03; TLS still failed on 2026-09-23).
- Oliver will rebuild the EastRise and Blue Cross Vermont work. Remove each republished route from `RETIRED_ROUTE_PREFIXES` in `scripts/publication-denylist.mjs` and the tombstone list in `deploy-pages.yml` first (since 2026-09-23).
- Any deletion of legacy Cloudflare deployments or retired object-storage assets, and any Git history rewrite, is destructive cleanup that still needs explicit approval (since 2026-08-11).

This file records the public architecture and publication rules that are useful
outside a development session. Git remains the detailed change record.

## Current architecture

- The site uses static HTML, layered CSS, and vanilla JavaScript modules.
- Node generators own repeated page groups and write committed source HTML.
- Sitewide passes normalize shared navigation, image dimensions, and metadata.
- Cloudflare Pages serves the generated `_site/` artifact.
- A Cloudflare Pages Function handles the contact form.

## Quality baseline

The repository checks JavaScript, HTML, structured data, image behavior, media
records, browser interactions, and accessibility. Deployment builds the site
before publishing it so tests can examine the artifact visitors receive.

## Publication boundary

Every tracked web asset must be safe for direct public access. Material without
publication clearance stays outside the repository and the deployment artifact.
Search directives such as `noindex` control indexing, not access.

## Reference documents

- `README.md` covers local development, quality commands, and hosting.
- `docs/ARCHITECTURE.md` explains the build and runtime design.
- `docs/CONTENT-MODEL.md` maps source data to generated pages.
- `docs/SPEC-MATRIX.md` tracks browser standards used by the site.

## 2026-09-23 - EastRise and Blue Cross work removed; Store link hidden

**What changed**: Removed 22 work pages for EastRise, VSECU, and Blue Cross Vermont, plus the generators, validators, data files, and images that only served them. The routes and image folders joined the retired publication lists, so production answers them with an uncached 404 tombstone. Homepage and About proof figures kept their text and now point to the About page. Service pages list retained projects instead. The Store link is hidden until the Gumroad subdomain serves HTTPS.

**Decisions made**: Oliver chose to remove every client-attributed page, keep career history, testimonials, and LinkedIn posts, and hide the Store link. The EastRise member-film poster used by a retained LinkedIn writing card stays public. The Flight Paths card's provenance credit now names BETA Technologies rather than Blue Cross.

**Left off at**: `npm run check:build-idempotence`, `npm run check:all`, `npm run check:built-site`, and all 136 `npm run test:site` browser tests pass locally.

**Open questions**: None beyond the open items above.

---

## 2026-09-03 - Google Analytics 4 tag with production hostname guard

**What changed**: Every page now loads Google Analytics 4 (`G-YF4LQ85VRE`). `scripts/apply-shared-ui.mjs` injects one classic script, `assets/js/google-tag.js`, after the charset meta and widens each page's meta CSP; the edge CSP in `_headers` and `scripts/security-headers.mjs` gained the `googletagmanager.com` and `google-analytics.com` hosts. `scripts/google-tag.mjs` holds the measurement ID, production hosts, and CSP host lists. The script returns early unless the hostname is `ames.consulting` or `www.ames.consulting`, then appends Google's async loader itself, so local servers, Playwright, CI Lighthouse, and `pages.dev` previews neither fetch the 175 KB loader nor send hits. `tests/site-consistency.node.js` asserts every public page carries the script once with a CSP that admits it and never inlines the loader. The Lighthouse `total-byte-weight` budget rose from 500 KB to 700 KB. Commits `ff11cb9`, `ee319fd`, `526c3a3`.

**Decisions made**: The config lives in a file rather than Google's inline snippet so `script-src` stays `'self'` plus hosts with no `'unsafe-inline'`, nonce, or hash. Google's advertising hosts (doubleclick, googlesyndication) were left out of the CSP because Google signals is not enabled. The budget was raised rather than trimming images, because the loader alone accounts for the overage and the work pages were already within 15 KB of the old limit.

**Left off at**: `npm run check:ship` passes (169 browser tests, idempotent builds). Deploy run 33771541619 succeeded on every job. Verified on production from the app browser pane: guard passes, loader appended, `page_view` and `scroll` hits sent, no console errors; `127.0.0.1` and `ames-consulting.pages.dev` stay silent. GA4 Realtime showed the pane hits and Oliver's phone visit. Cloudflare Pages caches assets for four hours with revalidation, so returning visitors run the pre-guard script until then, which still tracks correctly.

**Open questions**: Oliver's Mac Chrome profile has two extensions that replace `gtag.js` with a stub, so no visit from that browser reaches GA; verify from the pane or a phone. Unversioned asset URLs mean any future change to `google-tag.js` also waits up to four hours for returning visitors.

---

## 2026-09-03 - Gumroad storefront subdomain and Store link

**What changed**: `store.ames.consulting` now points at the Gumroad storefront through a DNS-only CNAME to `domains.gumroad.com`, created in the Cloudflare zone and verified in Gumroad the same day. A Store item linking to that subdomain joins the primary navigation and the footer Company column on every page, emitted by `scripts/apply-shared-ui.mjs`, asserted by `tests/site-consistency.node.js`, and documented in `CLAUDE.md` and its mirrors. Commit `872922c`.

**Decisions made**: The root and `www` records stay on Cloudflare Pages, because Gumroad's root-domain instructions would have replaced them and taken the site down. The Store link is the one absolute URL in the nav, sits just before Contact, and never carries `aria-current`. The generators' own nav copies were left alone since the normalizer overwrites them at the end of every build.

**Left off at**: `npm run check:all` passes. The DNS record resolves publicly. Gumroad had not yet issued the subdomain's TLS certificate as of 2026-09-03, so HTTPS on the store fails until that lands (Gumroad quotes up to 24 hours). The main site's HSTS header carries `includeSubDomains`, so the store must stay HTTPS-only.

**Open questions**: Whether the storefront link needs a mobile-nav spot check at 320 px once eight items are in the strip; the consistency test passes, and the browser suite was not rerun this session.

---

## 2026-08-27 - UI and UX pass

**What changed**: Four measured interface defects were fixed. Mobile navigation now reveals its current and keyboard-focused links. The focused skip link now sits above the sticky header. Contact-form and writing-archive deep links now clear that header instead of landing underneath it. The full review, measurements, and refuted candidates are in `docs/audits/2026-08-27-ui-ux-pass.md`.

**Decisions made**: The mobile navigation scrolls only when a current or focused link falls outside its visible strip. The two affected hash targets use the same seven-rem clearance already established for other deep links. Page copy, portfolio content, publication policy, and deployment automation remain unchanged.

**Left off at**: `npm run check:ship` passes with identical consecutive builds, every source check, built-site validation, and all 169 deploy-artifact browser tests. The final suite covers the custom nested 404 at desktop and mobile widths.

**Open questions**: None for this pass.

---

## 2026-08-27 - Follow-up bug-fixing pass

**What changed**: Seven browser and contact defects were fixed. Contact validation now clears its stale summary, Turnstile retries after a script failure, and stalled submissions stop after 15 seconds. The contact Function uses a stable Resend idempotency key for retries. Dark-mode writing links retain a non-color cue, carousel buttons respect reduced motion, and project-card scrubbing no longer repeats a responsive copy of its first photograph. The complete review is in `docs/audits/2026-08-27-follow-up-bug-fixing-pass.md`.

**Decisions made**: A contact retry keeps the same idempotency key only when its form start time and serialized email payload match. The client timeout exceeds the Function's ten-second upstream timeout. Dark-mode coverage targets the blog introduction that produced the confirmed Axe violation, while the existing suite continues to audit every public route.

**Left off at**: `npm run check:ship` passes with identical consecutive builds, a clean source gate, built-site validation, and 165 deploy artifact browser tests. The 16 isolated contact Function tests also pass.

**Open questions**: None for this pass.

---

## 2026-08-26 - Bug-fixing pass

**What changed**: An adversarial review fixed 13 symptoms across ten implementation groups. Browser fixes cover anchored photography headings, empty filtered categories, and future-dated local timestamps. Generators now use correct singular labels and reject invalid writing-feed timestamps. Build scripts now parse robots metadata semantically and work in checkout paths with spaces. The contact Function now applies the shared security headers to every JSON response and declares `POST` on 405 responses. A testimonial regression now disables motion before it compares the stable color endpoint, which removes an animation-frame race found on GitHub's runner. An approved August 27 follow-up made the pre-ship gate prove build convergence before it validates the final artifact, added an exact commit marker to tested and deployed artifacts, and bounded every deployment request. The complete review is in `docs/audits/2026-08-26-bug-fixing-pass.md`.

**Decisions made**: The robots parser treats comments, raw-text content, and template content as inert. Writing-feed timestamps require an explicit time zone and a valid calendar date. After explicit approval, `release.txt` became the only public deployment marker. It contains only `local` or the full commit SHA, carries no-store and noindex response rules, and must match the current GitHub SHA after artifact transfer and on all three live origins. Deployment requests use five-second connection and 15-second total timeouts inside 15-minute verification jobs.

**Left off at**: Implementation commits `2a3c3fb`, `a9d9a20`, `4652bec`, and automation follow-up `f93fc3e` are complete. `npm run check:ship` passes in its corrected order: first-to-second build convergence, one final build, all source checks, artifact validation, and 161 deploy-artifact browser tests. The fixed-SHA integration probe also validated the exact 40-character marker before the local fallback build restored `release.txt` to `local`.

**Open questions**: None for this pass.

---

## 2026-08-25 - Adversarial repo review and deferred-item pass

**What changed**: A six-dimension finder sweep with independent skeptic verification fixed 20+ confirmed issues: silent generator corruption paths (refine-work ordering, contact-form CSP postconditions, writing-feed validation), wall-clock build irreproducibility (LinkedIn window now anchors on `refreshedAt`), prototype-chain and stale-label bugs in the organization filter, SEO entity mismatches (`Service.name`, Threads in `sameAs`, archive breadcrumb), a LAN-exposing test server, an over-broad Axe exclusion, duplicated contact-function coverage, and 6.1 MB of orphaned media plus the unused `xml2js`. Social cards gained measured `og:image` dimensions and alt text via a shared image-measurement module, every page gained light/dark `theme-color` metas, and each organization hub page gained at least one inbound contextual link. CI now promotes the exact `_site` bytes the artifact suite tested to deployment and verifies three site origins in parallel plus asset origins separately. The header-scroll behavior finally has a real desktop test, and `npm run check:ship` chains the whole pre-ship gate. Full findings, refutations, and dispositions live in `docs/audits/2026-08-25-adversarial-repo-review.md`.

**Decisions made**: Rate limiting stays success-only by design (it caps Resend sends without dead-ending humans; docs now say so). Cross-Origin-Resource-Policy stays omitted because micro.blog may hotlink site imagery. Root `sitemap.xml`/`robots.txt` were deleted rather than synced because nothing consumed them. The three titles longer than ~60 characters stay as written under Google's device-based truncation guidance; all 56 meta descriptions already measure at most 157 characters. Deploy keeps `cancel-in-progress`.

**Left off at**: Commits `9029581..0beca36` pushed. `npm run check:ship` passes end to end: source checks green, double-build idempotent, artifact valid, 158 deploy-artifact browser tests passing.

**Open questions**: ames.consulting remains `pending` on hstspreload.org as of 2026-08-25 (checked via the status API). Watch for the flip to preloaded. The macOS Playwright browser cache can be evicted under disk pressure; if tests fail with missing executables, run `npx playwright install chromium`.

---


## Earlier history (before 2026-08-23)

- 2026-08-13 - Sitewide consistency pass: standardized content width, vertical rhythm, project typography, cards, buttons, footer targets, dialogs, and contact-form errors; added the Services index, one three-service taxonomy, canonical project titles, and a 301 from `/work/portraits-and-people/` to `/work/eastrise-portraits/`. Decisions: service names are Photography and video, Strategy and content, and Practical technology; internal links use `→`, external `↗`, parent `←`; exact top-level routes use `aria-current="page"` and section parents `aria-current="true"`. Commit `f57a6b5`; Actions run `31728993837`.
- 2026-08-13 - Security hardening: the contact Function binds Turnstile to the requesting hostname, wraps Turnstile and Resend in 10-second timeouts with structured 502 JSON, and replaces the server minimum-fill check (it false-rejected visitors with fast clocks) with a clock-skew-tolerant timestamp window; `scripts/security-headers.mjs` is the single header source, enforced by `check:security-headers`; added the HSTS `preload` token and Dependabot. Decisions: the Cloudflare WAF rule "Contact form POST throttle" (POST /api/contact, per IP, 5 requests/10s, block 10s) uses the free plan's only rule slot and does not cover `ames-consulting.pages.dev`; writing-page meta CSP stays page-specific. Commits `5a247c8`, `5f2800b`; deploy run 31673576335.
- 2026-08-11 - Public portfolio release: removed the password gate and completed all 35 browser review items. Decisions: Flight Paths is the only BETA media project; Blue Cross galleries stay in source but out of the public artifact; the site publishes only allowlisted routes and referenced assets; a fail-closed Pages Function returns marked 404s for denied paths, and scoped URL rewrites return 404 for withheld media on both legacy R2 domains.
- 2026-08-11 - Contact delivery and gallery chronology: verified the production contact form with one real submission (delivery, Reply-To, SPF, DKIM, DMARC), protected the email fallback from Cloudflare address obfuscation, and added a shared project-date registry with chronology checks. Decisions: project cards and gallery navigation sort newest-first; documentary event galleries sort oldest-first when capture evidence supports it; curated galleries stay editorial. `ames.photo` and `www.ames.photo` redirect to `ames.consulting` preserving path and query.

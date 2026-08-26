# Adversarial Repo Review — Bug Fixing Pass

**Date:** 2026-08-25
**Base commit:** `d611eed` · **Head:** `57d1ebd`
**Method:** six parallel finder sweeps (build/generators, front-end JS, cross-file consistency, dead code, content/links, tests/CI) producing ~30 candidate findings, each then given to an independent skeptic agent whose default stance was refutation. Only findings that survived refutation were fixed.

## Verification state

| Gate | Result |
|---|---|
| `check:all` (17 validators, lint, HTML) | pass |
| `check:build-idempotence` (double build + diff) | pass |
| `check:built-site` | pass |
| `test:e2e` (source tree) | 156 passed, 1 intentional skip |
| `test:site` (deploy artifact) | 157 passed |

An environment incident mid-pass: macOS evicted `~/Library/Caches/ms-playwright` between the baseline run and re-verification, failing 132 tests with missing-browser errors. Reinstalled Chromium for the pinned Playwright 1.62.1; unrelated to repo changes.

## Confirmed and fixed

### Build and generators (`9029581`)
- `refine-work.mjs` warned instead of throwing when its campaign-section pattern stopped matching, so curated ordering could silently ship stale. Now throws; pattern verified matching today.
- `generate-contact-page.mjs` CSP/form surgeries had no postconditions. If the template's CSP string drifted, Turnstile allowances would vanish from production silently. Now asserts all three load-bearing markers.
- `generate-writing-pages.mjs` crashed far from cause on feed posts with empty `links` or missing `text`, after earlier generators had already mutated the tree. Validates first, naming the post id.
- LinkedIn past-year window used wall-clock `new Date()`, making builds non-reproducible across days. Anchored on `feed.refreshedAt`; mirrored in `tests/site.spec.js`.
- Removed the vestigial photography testimonial insertion whose guard substring collided with an unrelated figure class, so it could never fire.

### Structured data and shared chrome (`e3b189b`)
- `Service.name` carried the SEO title while the same JSON-LD graph's breadcrumb and the visible H1 carried the taxonomy label. Now consistent.
- `Person.sameAs` listed 6 profiles while every footer renders 7 `rel="me"` links. Threads added.
- `/blog/archive/` breadcrumb name was a full sentence from the H1. Now "Archive".
- Google Fonts URL ampersand escaping normalized sitewide via `apply-shared-ui.mjs` (5 drifting pages).
- Dead `work/blue-cross-vermont` heading mapping removed from `ensureHubSectionHeadings`.
- VTDigger meta description trimmed 163 → 143 chars to survive snippet truncation.

### Front-end JS (`35cd89a`)
- `work-filter.js` read `?organization=` through a plain object, so prototype names like `toString` emptied the grid with native-code garbage in the heading. Now `Object.hasOwn`.
- Stale `blue-cross-vermont` filter label removed; unknown values now fall back to the unfiltered view as documented.
- Contact form minimum-fill-time check failed open on tampered timestamps; server already rejected them, client now agrees.

### Cleanup and docs (`64d762d`)
- 36 hashed Blue Cross portrait variants (5.1 MB) superseded by the generator's seven semantic filenames; five superseded singles under `work/eastrise` and `work/portraits`. All recoverable from git history.
- Stale root `sitemap.xml` (7 routes vs the shipped 49) and root `robots.txt` deleted; nothing consumed the source-tree copies.
- Unused `xml2js` devDependency removed.
- Two undocumented manual utilities documented across AGENTS/CLAUDE/GEMINI; rate-limit semantics clarified as successful sends; structured-data convention corrected for `404.html`.

### Tests and CI (`f8b242d`)
- Axe route scans excluded whole `.video-embed` wrappers; exclusion narrowed to the YouTube iframe subtree (still audited separately via srcdoc).
- Collage capture regex hardened against future nested divs.
- Unique contact-function assertions (reply_to/to/from shaping, failed-Turnstile 403) ported into the node suite; duplicate Playwright spec deleted.
- Source-tree test server now binds `127.0.0.1` only — it previously served withheld Blue Cross media to the LAN on every local run.
- `ci-quality.yml` builds `_site` explicitly before artifact checks instead of consuming the idempotence verifier's leftover output.

## Refuted by skeptics (no action)

- Rate limiter counting successes only: deliberate design that caps the real cost (Resend emails) without dead-ending humans when Turnstile flakes; docs now say so.
- Lightbox loading master `src` rather than `currentSrc`: quality-first choice; responsive variants are sized for collage slots, not fullscreen.
- Turnstile lazy-load race: script loads on first focus, form requires three fields before submit; gap is negligible and self-healing.
- Scrolled-header test "fix": at the tested 390px viewport the header background is unconditional, so the proposed change fixed nothing.

## Flagged for Oliver (judgment calls) — dispositions from the follow-up pass

1. ~~Orphaned hub pages~~ **Resolved** (`e13dd66`): Flight Paths, both GMCF shoots, and the Giron family page now close with contextual links to their hub pages; index curation untouched.
2. ~~Deploy artifact promotion~~ **Resolved** (`1eaba95`): ci-quality uploads `_site`, deploy downloads and revalidates those bytes.
3. ~~Serial live verification~~ **Resolved** (`1eaba95`): three-origin matrix plus dedicated asset job, `cancel-in-progress` kept per the original recommendation.
4. ~~Local habit gap~~ **Resolved** (`0beca36`): `npm run check:ship` runs build + artifact checks + idempotence + artifact tests in one command; documented in all three agent-doc command tables.
5. **CORP header**: intentionally omitted — micro.blog may hotlink site imagery and `same-origin` would block it. No change.
6. ~~Titles over ~60 chars~~ **Closed with evidence**: Google sets no fixed length and truncates by device (title-link doc, updated 2025-12-10); rewriting branded titles risks more than truncation costs. Separately, a sitewide measurement found every meta description already ≤ 157 characters, so the excerpt ceiling needed no change.

Also closed during follow-up: the scrolled-header test rewrite (real desktop scroll assertions replace the position-coupled mobile check), and the HSTS preload watch item was re-checked on 2026-08-25 via the hstspreload.org status API: still `pending`.

## Improvement shipped (`57d1ebd`)

- `og:image` gains intrinsic width/height (measured from image headers via a new shared `scripts/image-dimensions.mjs`) plus alt text; per Meta sharing guidance, cards render without a second fetch, and unmeasurable images fail the build.
- `theme-color` metas for light/dark match the `--surface-1` tokens (#ede8e0 / #232f2f), tinting mobile browser chrome to the page surface.

## Sweep coverage

52 build scripts reviewed (50 in full); all 12 browser modules read end to end; 56 committed pages compared chrome-to-chrome; 4,319 internal references resolved with zero broken links; every Playwright locator grep-verified against current markup; all five workflows audited step by step; dead-code candidates individually grep-swept including manifests, tests, workflows, and dynamic-dispatch surfaces.

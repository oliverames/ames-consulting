# Adversarial Repo Review — Bug Fixing Pass

**Date:** 2026-08-26  
**Base commit:** `c4ac410`  
**Implementation commits:** `2a3c3fb`, `a9d9a20`  
**Method:** three independent finder sweeps covered browser behavior, build and publication logic, and CI plus Function security. Independent skeptic passes then reproduced or refuted each candidate before any source change.

## Outcome

The review confirmed nine implementation groups containing 12 distinct symptoms. All nine groups were fixed with regressions. Three additional release-automation defects were confirmed, but the repository requires Oliver's approval before automation changes. Those files remain untouched.

## Confirmed and fixed

### Browser behavior

- EastRise Work cards link to headings on the long photography page. The sticky header covered those headings at desktop and mobile widths. The series headings now reserve the same seven-rem scroll clearance used by other anchored sections.
- Organization filters hid unmatched cards but left empty Portraits and Legacy sections visible. The filter now hides any category without a matching visible card.
- Future contact-attempt timestamps could trigger the client rate limit after a system-clock correction. The client now rejects timestamps later than its current clock.
- A future inbound-prompt dismissal timestamp suppressed the prompt until the clock caught up and another 14 days passed. Dismissal timestamps later than the current clock are now invalid.

### Generated content and data validation

- The Work generator emitted `1 photographs`. It now chooses `photograph` or `photographs` from the count.
- The Writing generator emitted 28 accessible names that said `Post media, 1 items`. It now chooses `item` or `items` from the count.
- An invalid `writing-feed.json.refreshedAt` value produced an invalid date and silently emptied the past-year LinkedIn section. Build-input validation and the generator now require an explicit time zone and a valid calendar timestamp, then fail before writing pages.

### Build and publication boundary

- Robots metadata parsing depended on attribute order and double quotes. Valid markup such as `<meta content="noindex" name="robots">` could lose its noindex policy during SEO normalization. A shared scanner now reads metadata by attribute meaning, decodes encoded directive values, recognizes tokenized directives, and ignores inert markup in comments, raw-text elements, and templates. The normalizer, build, sitemap, artifact validator, Blue Cross validator, and publication tests now use it.
- Two sitewide normalizers treated a URL pathname as a filesystem path. Checkouts with spaces therefore failed on literal `%20` segments. Both scripts now use one decoded project-root helper, with a spaced-path regression.

### Contact Function

- Contact Function responses did not receive the shared browser-security policy because Cloudflare Pages does not apply `_headers` to Function responses. The Function now imports the shared header map for every JSON response. See [Cloudflare's Pages header documentation](https://developers.cloudflare.com/pages/configuration/headers/).
- The generic 405 response omitted `Allow: POST`. It now includes the field required by [RFC 9110, Section 15.5.6](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.6).

## Confirmed automation findings awaiting approval

No changes were made to `package.json` or `.github/workflows/deploy-pages.yml`.

1. `npm run check:ship` does not invoke `check:all`, so its documented full gate can omit Function and source validators.
2. Live deployment checks probe stable origins and invariant content. They do not verify a release-specific marker, so a prior healthy release can satisfy them.
3. Deployment retry loops omit connection and total timeouts. One stalled `curl` can therefore consume the job's remaining time.

## Refuted candidates

- Reusable-workflow artifact transfer works. The latest observed deployment uploaded, downloaded, revalidated, and deployed the same artifact.
- The artifact-only publication test does not self-skip. Its one skip is limited to the source-tree run.
- Production CSP permits the current Turnstile script and iframe.
- All four configured redirects return their intended 301 targets.
- The explicit publication allowlist remains fail closed for current inputs.
- Responsive-image generation recreates candidates and validates both existence and actual width.
- Image references cannot escape `assets/images` or the deploy artifact.
- `npm audit` reported no known dependency vulnerabilities at review time.

## Verification

| Gate | Result |
|---|---|
| Focused Node regressions | pass, 32 tests |
| Focused browser regressions | pass, 5 tests |
| `npm run build:site` | pass, 50 HTML files and 936 referenced images |
| `npm run check:built-site` | pass, 50 HTML files and 1,203 responsive image uses |
| `npm run check:all` | pass |
| `npm run test:e2e` | pass, 160 tests and one intentional source-only skip |
| `npm run check:build-idempotence` | pass, source and artifact content matched across two builds |
| `npm run test:site` | pass, 161 deploy-artifact tests |

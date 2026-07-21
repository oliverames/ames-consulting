# Worklog

## 2026-07-21 - Cloudflare Pages, R2 assets, and dependency security

**What changed**: Moved production delivery to Cloudflare Pages while keeping GitHub `main` as the editable source of truth. The Pages build now rewrites website image URLs to the dedicated `ames-website-images` R2 bucket, under the `ames-consulting/` prefix, served through `assets.ames.consulting`. Added the scoped Pages and R2 credentials to GitHub Actions through encrypted repository secrets and retained the canonical credentials in 1Password. Updated the two vulnerable transitive `brace-expansion` releases from 1.1.14 and 2.1.0 to their patched 1.1.16 and 2.1.2 releases.

**Live infrastructure**: `ames.consulting` and `www.ames.consulting` deploy from pushes to `main`. A hostname-scoped Cloudflare Cache Rule for `assets.ames.consulting` sets browser cache lifetime to 3,600 seconds while respecting the R2 origin lifetime at the edge. The rule is limited to the asset hostname and does not change caching for the main site.

**Verification**:
- `npm ci`, `npm audit --audit-level=high`, `npm run check:all`, `npm run build:site`, and `npm run test:e2e` pass.
- All 96 Playwright tests pass, and `npm audit` reports zero vulnerabilities.
- The dependency tree resolves `brace-expansion` to 1.1.16 and 2.1.2 only.
- Representative R2 objects return HTTP 200 with `Cache-Control: public, max-age=3600, stale-while-revalidate=604800`.

**Left off at**: The Cloudflare Pages and R2 migration is live. The security-only lockfile update is ready to ship after this entry.

**Open questions carried forward**:
- `/blog/` remains slightly above its non-blocking 500 KB warning threshold. Self-hosting and subsetting the two web fonts remains the cleanest likely reduction.
- Filtered blog results still use original images because `post-card.js` does not select committed `-card.webp` variants.
- New non-portfolio posts still need a build step to generate missing `-card.webp` variants.
- `scripts/generate-seo-artifacts.mjs` still omits `/photography/` and `/links/` from its hardcoded routes.
- Several photography placeholder JPGs remain 1-by-1 stubs.
- Reloading a scrolled page can briefly animate the header blur into place.

## 2026-07-13 - Production launch gates

**Current state**: The repository, quality checks, accessibility tests, performance budget, and GitHub Pages deployment are ready for review. The production domain is not live: `ames.consulting` has no apex address record, `www.ames.consulting` has no CNAME, and HTTPS cannot resolve the host. The checked-in site configuration also leaves `contactFormEndpoint` blank, and the public templates still use `hello@example.com` and demonstration content.

**What remains**: Configure the apex and `www` DNS records, replace the placeholder identity and demonstration copy with final content, add the real contact address, and configure and test the form endpoint. Do not call the production launch complete until the custom domain serves the current Pages build over HTTPS and a real form submission succeeds without exposing credentials in the repository.

---

## 2026-04-29 - Nav blur state-gating + image-viewer/scroll-handler module extraction

**What changed**: Single commit `50b6323` (86 files; +438/-865). User-visible bug fix on top, refactor underneath.

The `.site-header` had `background: rgba(243,240,235,0.72)` and `backdrop-filter: blur(12px)` applied unconditionally. The `[data-scrolled]` rule existed but only nudged opacity, so the blur was visible at the very top of every page. Moved background/blur/box-shadow into `.site-header[data-scrolled]` and added `backdrop-filter` to the `transition` list so the effect fades rather than snaps. Default state is now fully transparent.

Then audited for the same shape of bug elsewhere. Two findings worth fixing:

- The 7-line inline IIFE that toggles `[data-scrolled]` was duplicated in 9 places (4 `templates/*.html` plus 5 hand-coded pages) AND missing entirely from 4 hand-coded work-detail pages (`work/carebridge-companion/`, `neighborhood-giving-map/`, `financial-wellness-library/`, `eastrise-writing/`). On those four, the blur was effectively never-on regardless of scroll.
- `app.js` was loaded only on `/blog/` (the only page with `<dialog id="image-viewer">`), so `decorateContentMedia` and `wireImageViewer` ran nowhere else. Photography galleries, blog post pages, eastrise/financial-wellness articles, and case studies had `cursor: zoom-in` styling on `.zoomable-image` but no element ever got the class — the entire feature was scoped to one page.

Refactor:
- New `assets/js/header-scroll.js` — single source of truth (21 lines).
- New `assets/js/image-viewer.js` — exports `wireImageViewer`, `wireAssetProtection`, `decorateContentMedia`, `ensureViewerDialog`. Auto-injects its `<dialog>` when not present so pages don't need to copy the markup. Idempotent wiring (module-level flags) so `app.js`'s `import { ... } from "./image-viewer.js"` plus its existing manual calls don't double-attach handlers. Decorator skips images inside `<a>` tags so photography-index gallery covers (which navigate) don't get hijacked into the viewer.
- `app.js` now imports the four helpers and dropped ~150 lines of duplicate definitions.
- All 4 templates and 13 hand-coded pages now load the modules via `<script type="module" src="...">`. Templates regenerated (`npm run generate:blog-posts | generate:photography | generate:financial-wellness | generate:eastrise`) which propagated to ~70 downstream pages automatically.

Verification:
- `npm run check:all`: 0 errors, 70 pre-existing `no-console` warnings unchanged.
- `grep -rn "toggleAttribute('data-scrolled'" --include="*.html"` returns zero matches (no leftover IIFEs).
- All 77 `index.html` pages load `header-scroll.js`; the 70 image-bearing pages load `image-viewer.js`.
- Local Python server smoke test: 200 on both new module URLs and on representative pages (home, photography gallery, blog post, work case study, eastrise article).

Reconciled (open from prior session, not Codex's):
- None addressed this session — see "Open questions" below.

**Decisions made**:
- Made `image-viewer.js` self-injecting (auto-builds the `<dialog>` via `document.createElement` rather than `innerHTML`, after the security hook flagged the latter) instead of asking each page to copy ~10 lines of dialog markup. Lower blast radius and prevents future drift between the dialog markup on different pages.
- Idempotent wiring with module-level flags rather than splitting `image-viewer.js` into pure-exports + auto-init wrapper files. One file is easier to grep; the flag pattern is local and well-commented.
- `<script type="module">` for the new modules, not classic scripts. Module scope eliminates the IIFE wrapper and matches the existing `photography-strip.js` / `contact-form.js` / `app.js` convention. Module scripts default to deferred, which is fine for a scroll handler (the inline IIFE was at end-of-body anyway, so timing characteristics are similar).
- Decorate auto-skip for images inside `<a>` (`if (image.closest("a")) return`). This matters specifically because `photography/index.html` gallery covers are anchor-wrapped — without the skip, clicking a cover would zoom instead of navigating to the gallery. Documented in the module's header comment.
- Single semantic-`fix` commit covering the bug fix + audit follow-up + refactor, rather than splitting into `fix:` + `refactor:`. The two changes are tightly coupled (the CSS fix relies on `data-scrolled` being toggled on every page, and the refactor is what makes that true everywhere). Splitting would have required `git stash` + selective `git add` for marginal history clarity.
- Did NOT add `image-viewer.js` to text-only pages (home, contact, links, likes, colophon, 404) or to listing pages with no zoomable content (work index, photography index, work/financial-wellness-library index, work/eastrise-writing index). Adding it would inject a hidden dialog and global event listeners for no benefit. The auto-decorator's `<a>`-skip would prevent visual bugs but the unused JS is wasteful.

**Left off at**: `origin/main` at `50b6323`. `npm run check:all` passes. CLAUDE.md and AGENTS.md updated to document the two new modules; mirror invariant restored via `cp CLAUDE.md AGENTS.md`. Wrap-up commit pending after this WORKLOG entry.

**Open questions**:
- Still open from prior session: `/blog/` total-byte-weight 551KB vs warning threshold 500KB; path forward is self-hosting Barlow Condensed + Lora subsetted to actually-used glyphs.
- Still open from prior session: `post-card.js` doesn't know about `-card.webp` variants — filter use re-fetches originals.
- Still open from prior session: build step needed to auto-generate `-card.webp` variants for non-portfolio post images.
- Still open from prior session: `scripts/generate-seo-artifacts.mjs:38` hardcoded routes still missing `/photography/` and `/links/`.
- Still open from prior session: photography placeholder JPGs at `assets/images/photography/<gallery>/photo-N.jpg` still 1×1 stubs.
- NEW: Hard-reload-while-scrolled produces a brief blur fade-in on first paint because the module script runs after CSS paints the `.site-header { background: transparent }` default. The previous always-on-blur masked this; the new state-gated version exposes it. Fix would be either an inline `<head>` script that sets `[data-scrolled]` on `<html>` before paint (requires a CSS selector change), or a `.preload` class that disables transitions on first frame. Edge case (only triggers on scrolled-page reload), low priority.

---

## 2026-04-29 - GitHub Actions rescue: lockfile + CLS + 74% byte-weight reduction

**What changed**: All three workflows (Quality Gates, Performance Budget, Deploy GitHub Pages) had been failing on every push since 2026-04-29 morning. Five commits land here, each addressing a distinct failure as it surfaced once the prior was unblocked.

Resolved this session:
- `a72958d` — Refreshed stale `emoji-regex@8.0.0` integrity hash in `package-lock.json`. The npm registry republished the tarball with `MSjYzcWNOA0e…` while the lockfile still recorded `MSjYzcWNDS0e…`, so every `npm ci` died with `EINTEGRITY` after four retries. Two-line surgical edit to both nested entries (`string-width-cjs/node_modules/emoji-regex` and `wrap-ansi-cjs/node_modules/emoji-regex`). Used `replace_all` since both stale records shared one identical hash.
- `7144aab` — Pre-rendered blog index cards via new `scripts/generate-blog-index.mjs`. Was: empty `#post-stream` → `app.js` fetches JSON → injects 5 cards → CTA band shoves down → CLS 0.42 (budget ≤ 0.1). Now: cards baked into `blog/index.html` between `BLOG_CARDS_START` / `BLOG_CARDS_END` sentinels (idempotent), markup byte-identical to `post-card.js`'s runtime output. `app.js` `renderPosts()` swapped from empty-then-append to single atomic `replaceChildren(fragment)` so any hydration swap is invisible. Image links carry `aria-label={post.title}` (both static and JS) to satisfy WCAG H30 since the `alt=""` decorative image leaves the anchor without text. Generator wired into both `deploy-pages.yml` (inside `_site/` after rsync) and `performance.yml` (workspace root before Lighthouse).
- `0c82764` — Trimmed Google Fonts from 7 weights to 5 (dropped Barlow Condensed 500 + Lora 600, both unused/falling-back-fine). Pre-cropped 16:9 thumbnails (`lab-XX-card.webp` at 1200×675 q=70) for the 5 blog cards instead of serving 1200×1800 portraits and discarding 75% of the pixels via `object-fit: cover`. Applied across 79 HTML files plus 4 templates with a Python `find -exec` rewrite to handle the URL change atomically. Generator's `toCardVariant` checks file existence and falls back to original if no `-card.webp` exists, so future posts ship before thumbnails do.
- `02efbeb` — Skip the initial JS render when static cards already match the unfiltered view. Previous commit landed cards but bytes went UP (2.14MB → 2.52MB) because `app.js` bootstrap still wiped the static `-card.webp` cards and re-injected them via `post-card.js`, which only knows the original `imageUrl` — so Lighthouse captured BOTH the thumbnails AND the originals. Now the bootstrap detects `<post-card>` elements already in `#post-stream` plus no filters in URL, and skips the render call (still updates status text and SEO meta). Filter changes flow through `wireFilters → render` unchanged.
- `8b02cff` — Final byte cuts: re-encoded blog card thumbnails from 1200×675 q=70 to 900×506 q=72 to match the actual rendered CSS box (388KB → 300KB across 5 cards). Converted `/work/` project heroes from PNG/JPG to WebP: `carebridge-companion/hero.png` 504KB → 64KB; `neighborhood-giving-map/hero.jpg` 264KB → 44KB. Updated 5 HTML files plus both content JSON sources (`content.example.json`, `posts-with-ai-summaries.json`) to point at the new `.webp` paths and removed the original PNG/JPG files since they had no remaining references.

**Result by Lighthouse measurement on `/blog/`**: 2,140,269 bytes → 551,423 bytes (74% reduction). `/work/` dropped off the warning list entirely (was 944,783 bytes; now under 500KB). CLS: 0.422996 → ≤ 0.1 (passes). Performance score: 0.79 → ≥ 0.8 (passes). Total-byte-weight on `/blog/` is still 51KB over the warning threshold, but the warning is non-blocking and the workflow exits 0.

Reconciled (open from prior session, not Codex's):
- "AGENTS.md is currently a byte-identical copy of CLAUDE.md … decide before the next CLAUDE.md edit." Decided to keep the byte-identical-mirror convention (per the user's MEMORY.md note `project_agents_md_mirror.md`). Edited CLAUDE.md to add `generate-blog-index.mjs` documentation, then `cp CLAUDE.md AGENTS.md` to maintain parity. Symlink not adopted — keeps both files independently grep-able and sidesteps any tooling that doesn't follow symlinks.

**Decisions made**:
- Surgical lockfile edit instead of `npm install --package-lock-only` for the `emoji-regex` fix. Followed CLAUDE.md's "minimal blast radius" rule — `replace_all` on a unique 87-char hash string only touched the two intended records, vs. full lockfile regeneration which can churn unrelated transitive deps.
- Pre-rendering the blog index over a CSS-only `min-height` reservation. The CSS approach would have fixed CLS but left the page blank during JS fetch (worse UX) and required a magic number (5 × ~480px = 2400px) that breaks if post count changes. Static gen leverages the existing pattern (`generate-blog-posts.mjs` already pre-renders per-post pages) and gives users content at first paint.
- `aria-label={post.title}` on the image anchor over `aria-hidden="true"+tabindex="-1"`. The aria-hidden approach made screen-reader UX cleaner (skip the decorative image link) but left the html-validate WCAG H30 rule unsatisfied. Going with the labelled-link compromise: brief duplicate announcement, but valid markup and consistent across static + JS hydration.
- Skip-initial-render in `app.js` over rewriting `post-card.js` to also use `-card.webp` variants. Both would solve the double-fetch; skip-render is fewer LOC and doesn't require a JS-side filesystem-existence check (which JS can't do anyway, so any fallback would be brittle).
- Stopped at 551KB on `/blog/` rather than chasing the last 51KB. Path forward (self-hosting + subsetting Google Fonts) is a clean separate refactor that touches font architecture, not just a byte trim.

**Left off at**: `origin/main` at `8b02cff`. `npm run check:all` passes (0 errors, 70 `no-console` warnings unchanged). All 3 CI workflows green on the most recent commit. `WORKLOG.md` and CLAUDE.md/AGENTS.md updates land in a wrap-up commit after this entry.

**Open questions**:
- NEW: `/blog/` total-byte-weight is 551KB vs warning threshold 500KB. Closing the last 51KB cleanly likely means self-hosting the Barlow Condensed + Lora fonts, subsetted to the glyphs the site actually uses (~latin range, no extended). That's a 100-200KB win but a meaningful change to font architecture and CSS.
- NEW: `post-card.js` doesn't know about the `-card.webp` variants. If a user clicks a blog filter (e.g., search box submit), `wireFilters → render → renderPosts` injects fresh cards using original full-size images. Static-render benefit is lost on filter use. Possible fix: thread `cardImageUrl` through the post data (set by `generate-ai-summaries.mjs` or a new step that runs `magick` to produce thumbnails) so JS and static gen use the same URL.
- NEW: The `-card.webp` variants are committed alongside originals in `assets/images/photography/lab-open-house-2026/`. New blog posts referencing other photography images won't have variants and the generator will fall back to originals (visible regression: the byte-weight warning would creep back). A build-step that runs `magick -resize 900x -gravity center -crop 900x506+0+0 +repage -quality 72` on any `.webp` referenced by a non-portfolio post that lacks a `-card.webp` sibling would close the loop.
- Still open from prior session: `scripts/generate-seo-artifacts.mjs:38` hardcoded routes still missing `/photography/` and `/links/`. Not touched this session.
- Still open from prior session: photography placeholder JPGs at `assets/images/photography/<gallery>/photo-N.jpg` are still 1×1 stubs. Not touched.

---

## 2026-04-28 - Review of Codex's same-day work + six-issue fix pass

**What changed**: Reviewed four commits Codex shipped earlier today (`732af1f`, `2871ff3`, `c48928c`, `1573d0c`; +10,456/−4,058 across 171 files) and pushed a single follow-up commit (`80b52e3`) resolving every actionable finding.

Resolved this session in `80b52e3`:
- Blog slug mismatch: `assets/data/content.example.json` short slugs (`calm-launch-checklist`, `useful-summaries`, `placeholder-content-real-work`, `content-model-small-teams`) replaced with the long slugs that match on-disk dirs. Regenerated `sitemap.xml` (now 67 URLs, up from 14, since `getKnownRoutes` also pulls eastrise-writing pages from `eastrise-blogs.json`).
- Three orphan photography galleries (`riverside-winter-2026`, `foothill-trails-2025`, `studio-process-2025`) re-linked: added entries to `assets/data/photography.json` with the existing Unsplash cover URLs and 3 photos each; updated `photography/index.html` listing; reordered chronological newest-first. Detail pages on disk left untouched (regeneration would be a no-op).
- `.path-strip` CSS restored to spec: `padding-inline: 1.5rem; margin-inline: -1.5rem;` plus the original explanatory comment block (Codex had stripped both, leaving `padding-inline: 0.125rem 1.5rem;` which clipped first-card shadows at the scroll-container left edge).
- `work/financial-wellness-library/index.html` got the JSON-LD WebPage block its sibling work-detail pages already have.
- Added `htmlEscape` helper to `scripts/generate-financial-wellness-pages.mjs`. Output is byte-identical against current placeholder data (verified via `git diff --stat` after regeneration), but the script can now safely consume external content without breaking out of attributes.
- Updated `tests/site.spec.js` photography listing assertion from `toHaveCount(1)` to `toHaveCount(4)` so it matches the corrected data.
- Removed both Codex backup directories (`.codex-backups/review-pass-20260428-161007/` in repo, `~/.codex/file-backups/ames-consulting-20260428-154829/` in Codex's central store). Codex created these despite the explicit prohibition in CLAUDE.md/AGENTS.md and gitignored its own violation.

Reconciled (NOT Codex's fault — pre-existing in baseline `31792f8`):
- `SearchAction` block in `assets/js/seo.js` lines 158-162. CLAUDE.md says "no SearchAction", code disagrees. Pre-dates today.
- Duplicate `generateSlug` in `assets/js/app.js:148` and `assets/js/post-card.js:15`. CLAUDE.md says "use centralized `generateSlug()`" but no centralized one exists. Pre-dates today.

**Decisions made**:
- Used a `codex-review-fixes` branch with fast-forward merge to keep the project's linear-history convention (no merge commits in recent log) while still grouping the fixes logically.
- Did NOT add the full OG/canonical/theme-color stack to `work/financial-wellness-library/index.html` even though the original review claimed it was missing. Sibling work-detail pages (`carebridge-companion`, `neighborhood-giving-map`) only carry charset/viewport/title/description/author/JSON-LD/stylesheet, so the financial-wellness page's actual gap was the JSON-LD block alone. Adding more would create inconsistency, not parity.
- Did NOT replace plain-text social-icon labels with SVGs on the same page. The reviewer compared against `work/index.html` (a listing page); sibling detail pages also use plain text. Same parity reasoning.
- Did NOT run `npm run generate:photography` after editing `photography.json`, because the orphan detail pages already exist on disk with their original Unsplash content. Regenerating would risk template drift overwriting them.
- Sub-agent reviewers over-attributed two pre-existing issues to Codex (SearchAction, duplicate `generateSlug`); always re-check claimed regressions against `git show <baseline>:<path>` before propagating.

**Left off at**: `origin/main` at `80b52e3`. `npm run check:all` passes (0 errors, only the expected 63 `no-console` warnings on CLI scripts). `npm run test:e2e` passes 94/94 including all axe-core a11y audits. Branch `codex-review-fixes` deleted locally.

**Open questions**:
- Resolved this session: regeneration of Financial Wellness sub-articles (the safer-escape script ran end-to-end, output byte-identical for current data).
- Still open: photography placeholder JPGs at `assets/images/photography/<gallery>/photo-N.jpg` are 1×1px stub files. The orphan galleries actually render via Unsplash URLs; the local JPG paths are vestigial. Cleanup would either remove the stubs or commission real photos.
- NEW: AGENTS.md is currently a byte-identical copy of CLAUDE.md (Codex added it as a same-content mirror so its conventions live under its conventional filename). Two files to keep in sync, or replace with a symlink. Worth deciding before the next CLAUDE.md edit.
- NEW: `scripts/generate-seo-artifacts.mjs:38` hardcodes a routes list that omits `/photography/`, `/links/`, and `/work/financial-wellness-library/`. The current sitemap picks up financial-wellness from `content.example.json`, but `/photography/` and `/links/` are absent. Worth either adding to the routes list or having the script discover them from `photography.json` and the directory tree.
- NEW: Codex's auto-backup behavior violates the no-backups rule. Worth running the `codex:setup` skill to check whether Codex's backup feature can be disabled at the source rather than cleaned up after each session.

---

## 2026-04-27 - Comprehensive design system implementation (Stripe-extension + brand-home)

**What changed**: Implemented the Ames Consulting Design System across every page on the site to match the brand-home.html and Stripe-extension preview files (web-hero-stripe, web-bento, web-cta-band, web-path-strip, web-practice-cards, web-shadows, web-dark-surfaces, web-accent-plum). Single commit captured by auto-sync hook (`a0f6a9f`): 20 files, 819 net lines in `assets/css/main.css`, structural HTML changes across all 15 page templates.

Specific additions:
- New CSS tokens: `--accent-plum` (#7a3a5e), `--web-gradient-hero`, `--web-type-hero/stat/section`, `--web-tracking-display`, `--web-leading-display`, `--radius-pill` (999px), `--radius-tile` (18px), `--surface-deep` (#1c2929), `--motion-snap`.
- `--measure-wide` bumped from 64rem (1024px) to 69rem (1100px) to match brand-home page width.
- New components in `@layer components`: `.hero` (gradient mesh card), `.hero__eyebrow`, `.hero__proof`, `.btn` family (`btn--primary` / `btn--ghost` / `btn--gold` / `btn--ghost-light`), `.practice-section` + `.practice-card`, `.cta-band`, `.bento` + `.bento-cell`, `.site-footer__sitemap`, `.site-footer__colophon`, `.site-footer__monogram`, `.site-footer__social`.
- Homepage: replaced flat `.intro` with full hero card (eyebrow chip + gradient-fill em H1 + two-tone subhead + pill CTAs + gradient-fill proof stats), added 3-column practice cards section, upgraded path-thumb tiles to card format with image + meta + title.
- Work index: added 5-cell bento grid (lead 1.5fr × 2 rows + 4 satellite cells) above the categories.
- Dark CTA band ("Have something complex to explain?") added to all top-level pages (home, work, blog, photography, links, likes, colophon, work detail pages, financial-wellness-library). Skipped contact (would be circular).
- Replaced soft `.site-footer` + standalone homepage `.site-directory` with single dark footer (uses `--surface-deep`, gold/red gradient bottom bar, DS monogram badge with gold underline, sitemap with Heritage Gold column heads, italicized colophon, social icons). Migrated to all 14 non-homepage pages via `/tmp/update-footers.mjs` script (depth-aware path prefixes).
- Updated `templates/financial-wellness-post.html` to match — depth-3 paths, dark footer, CTA band, site-header.

Sizing/shading audit (after user feedback that things felt small):
- Section headers: 1.1rem/600 → 1.3rem/700; gold-rule opacity 40% → 55%.
- Path tile: 220px wide → 280px; image 130px → 175px; title 1rem → 1.2rem; meta 10px → 11.5px; placeholder gradient lightened from `surface-1→surface-2` to `surface-0→surface-1`.
- Practice card title 1.15rem → 1.4rem, padding 1.4rem → 1.75rem.
- Bento cell h3 1.5rem → 1.75rem; lead 1.85rem → 2.15rem.
- Page-header h1 clamp(1.6, 3.5vw, 2.4rem) → clamp(2.25, 5vw, 3.5rem).
- Footer sitemap h3 0.78rem → 0.95rem; links 0.95rem → 1.05rem; signature 1.05rem; monogram 36px → 44px.
- Site-name 1.1rem → 1.25rem; nav links 0.95rem → 1.05rem.
- Practice card surface: changed from `--surface-1` (invisible against page background) to `--surface-0` + `--shadow-card`.

Shadow-clipping fix on `.path-strip`: added `padding-block: 0.75rem 2rem` and `padding-inline: 1.5rem` with matching `margin-inline: -1.5rem`. The 1.5rem (24px) horizontal padding matches the card shadow's blur radius — necessary because `overflow-x: auto` for horizontal scrolling forces clipping on the y-axis too (CSS spec quirk).

**Decisions made**:
- Surface hierarchy is page = `--surface-1`, cards = `--surface-0`. The web-practice-cards.html spec uses surface-1 for cards because its preview has surface-0 as page background. On our site, surface-1 cards on a surface-1 page are invisible. Translated correctly to surface-0 cards on surface-1 page.
- The hero proof stats use gradient fill (`--web-gradient-hero` + `background-clip: text`) per web-hero-stripe.html spec, not flat ink (which is what brand-home masthead uses). User explicitly loves the Stripe-extension treatment, so kept gradient.
- Hero primary button uses ink fill (`--text-0`) on the warm-paper hero card; CTA band primary button uses gold fill (`--accent`) on the dark surface. Each surface dictates which color earns its contrast, per brand-home rule.
- Financial Wellness sub-pages (60+ articles) are script-generated via `templates/financial-wellness-post.html`; updated the template only. Existing rendered articles will pick up the new design on next regeneration. Users can run `npm run generate:financial-wellness` (or equivalent) to refresh.
- Contact page intentionally skipped CTA band (would be redundant — that page IS the contact destination).

**Left off at**: Site is shipped to `origin/main` at `a0f6a9f`. GitHub Pages will deploy the new design on next build trigger. User has not yet manually verified at production URL `demo-profile.github.io/ames-consulting` (was still showing the older "Stories told carefully" gradient hero in screenshots taken during the session).

**Open questions**:
- NEW: Should the Financial Wellness sub-articles be regenerated now, or wait for the next routine content update? (60+ pages still have the old simple `<footer>©...</footer>`.)
- NEW: Photography images at `assets/images/photography/photo-[1-4].jpg` are 8KB placeholder files. The lightened placeholder gradient now degrades gracefully, but actual photography content would lift the homepage Photography strip noticeably.
- NEW: The Blog row on the homepage relies on JS-loaded Local JSON content. Local dev server shows it as essentially empty. Consider adding a `<noscript>` or static-fallback list of recent post titles.
- Still open: README header icon/logo + license badge gaps noted in CLAUDE.md "README Known Gaps" — not addressed this session.

---

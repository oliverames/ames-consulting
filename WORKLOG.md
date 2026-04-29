# Worklog

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

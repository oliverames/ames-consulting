# Worklog

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

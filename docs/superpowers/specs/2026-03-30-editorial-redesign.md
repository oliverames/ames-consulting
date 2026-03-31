# Editorial Redesign Spec

**Date:** 2026-03-30
**Approach:** Things-Inspired Editorial Polish (Approach 2)
**Guiding principle:** Functional-but-not-crafted becomes editorially polished. Warm indie magazine, not heavy product marketing site. Same brand, elevated execution. Fast-loading, Apple HIG-inspired.

## Constraints

- Pure HTML5, CSS, vanilla ES modules. No frameworks, no build step beyond existing scripts.
- 2026 web standards: `animation-timeline: view()`, `backdrop-filter`, CSS nesting, `@property`, container queries (already used).
- Brand colors locked: warm paper `#faf8f5`, forge orange `#f5a542`, manufacturing red hover `#d94a2d`, dark teal dark-mode palette.
- Fonts locked: Barlow Condensed (headings/UI) + Lora (body). Adjustment to how they're used, not which fonts.
- Existing HTML architecture preserved. Changes are primarily CSS with targeted HTML adjustments.
- Mobile-first responsive design throughout.
- Progressive enhancement: features like scroll animations and backdrop-filter degrade gracefully.
- No hamburger menu. Nav items fit at mobile widths.

## Content Strategy

- **Real content:** Blog posts (from Micro.blog feed), personal info, nav structure, section names.
- **Placeholder content:** Work project case studies (hero images become brand-colored solid blocks, body text lorem ipsum), photography galleries (solid color blocks at realistic aspect ratios with real gallery titles).
- Rationale: design and backend can be finalized without waiting on asset production.

---

## 1. Design Philosophy & Spacing

### Spacing Overhaul
Increase `--space-4` and `--space-5` by ~40%:
- `--space-4`: `clamp(1.8rem, 2vw, 2.4rem)` becomes `clamp(2.4rem, 3vw, 3.2rem)`
- `--space-5`: `clamp(2.4rem, 3vw, 3.6rem)` becomes `clamp(3.2rem, 4vw, 4.8rem)`

Intro section gets significantly more vertical padding. Between homepage path-rows: more air. Each section should feel like turning a page.

### Visual Containers
- Remove `border` and `background` from `.stream-shell` on blog index. Cards sit directly on page surface.
- Blog cards lose their border. Separation via whitespace. Hover: subtle layered shadow fade-in.
- `.site-directory` keeps top rule, grid gets more gap.

### Card Shadow System (from Drafts Capture)
Replace `border: var(--border-soft)` on interactive cards with layered shadows:
```css
--shadow-card: 0 0 0 0.5px rgba(0,0,0,0.08),
               0 2px 6px rgba(0,0,0,0.05),
               0 8px 24px rgba(0,0,0,0.04);
```
Dark mode: increase opacity values so shadows remain visible on dark surfaces.

### Surface Hierarchy
Page background at `--surface-1` (slightly tinted), cards/panels at `--surface-0` (lightest). Creates depth without borders.

---

## 2. Typography Refinement

### Headings (Barlow Condensed)
- Intro `h1`: `clamp(2rem, 5vw, 3.4rem)` (up from `clamp(1.8rem, 4vw, 2.8rem)`)
- Section headings (Work, Blog, Photography): stay uppercase, wider letter-spacing `0.12em` (up from `0.08em`), lighter weight. Magazine department label aesthetic.

### Body (Lora)
- Global `line-height`: `1.65` (up from `1.5`)
- Blog post reading pages: `1.75` line-height, `1.05rem` font-size
- `--measure-reading` (~65ch) for all reading content

### Meta Text
- Dates, read times, labels: switch to Barlow Condensed at `0.82rem`. Currently Lora, which feels heavy for this role.

### Link Styling
- Underlines on hover only (not always-on). Accent color distinguishes links at rest.

### Global Text Rendering
- `-webkit-font-smoothing: antialiased` on body for softer typographic feel.

---

## 3. Homepage

### Intro Section
- More vertical padding, scales down on mobile. Desktop: generous. Mobile: more than current but not wasteful.
- Social icons: slightly more spacing between them.

### Path Rows
- Horizontal scroll strips stay (great mobile UX).
- Thumbnails taller: `clamp(140px, 20vw, 220px)` (up from `clamp(120px, 15vw, 180px)`).
- "Browse Work" CTA links: more vertical padding, hover transition (color shift + slight translate-right on arrow).
- Section headings (h2): thin horizontal rule below, `1px` accent-colored line ~`3rem` wide. Small craft detail.

### Site Directory
- Mobile: single column with more spacing between groups.
- Desktop: same grid, more gap.

### Nav
- Sticky on scroll with `backdrop-filter: blur(12px)` and semi-transparent background.
- At top of page: fully transparent, no blur. On scroll: blur and background fade in.
- Light mode: `rgba(250,248,245,0.85)`. Dark mode: `rgba(28,41,41,0.85)`.
- Mobile: same behavior. No hamburger.

---

## 4. Blog

### Blog Index
- Cards lose border. Whitespace separation only.
- Hover: layered shadow fade-in (`0 4px 20px rgba(0,0,0,0.06)`). No border appears, just shadow.
- Card titles: `clamp(1.05rem, 1.6vw, 1.3rem)` (up from `clamp(1rem, 1.4vw, 1.2rem)`).
- Meta text (date, read time): Barlow Condensed, lighter color.
- "Read more" link: underline on hover only.
- Mobile: single-column stack with generous gap.
- Filters area: inputs keep borders (affordance), container loses background panel.

### Individual Blog Post Pages
Open-flow editorial layout:
- Max-width reading column (`--measure-reading`, ~65ch)
- Title: large Barlow Condensed. Date below in small muted Barlow.
- Body: Lora at `1.05rem`, `1.75` line-height.
- Images: break out wider than text column to ~80% of `--measure-wide`.
- Blockquotes: left-border accent (forge orange, `3px`), slightly indented italic Lora.
- Generous paragraph spacing (`--space-3`).
- No sidebar, no distractions.
- Mobile: images full-width, line-height `1.65`.

---

## 5. Work & Photography

### Work Index
- Project cards: Drafts Capture shadow treatment, no border, `border-radius: 12px`.
- Hover: shadow deepens, card translates up `2px`, `0.12s` transition.
- Thumbnails: `aspect-ratio: 16/9`, matching radius.
- Category headings: lighter weight, wider tracking, short accent-line bottom border.
- Mobile: single column.

### Individual Work/Project Pages
- Open-flow reading layout matching blog posts.
- Hero image: breaks out to ~80% of `--measure-wide`, layered shadow, rounded corners.
- Section h2: uppercase, thin accent-colored rule below (low-opacity `var(--accent)`).
- **Placeholder:** Hero images become solid brand-colored blocks (warm tones, subtle gradient). Titles/summaries real, body lorem ipsum.

### Photography Index
- Gallery grid: more gap between items.
- Images: shadow instead of border (`0 2px 8px rgba(0,0,0,0.06)`), `border-radius: 8px`.
- Hover: subtle `scale(1.02)`, `0.12s` transition.

### Individual Gallery Pages
- Full-width immersive: images at edge of `--measure-wide`, stacked vertically, generous gaps.
- Minimal chrome: title, then images. Captions in muted Barlow Condensed below each.
- **Placeholder:** Solid color blocks at `3:2` and `4:3` aspect ratios.

### Links Page
- Simple vertical list, no cards. Each link: title in Barlow Condensed accent color, domain below in muted small text, thin divider between entries.

---

## 6. Contact Page

- Two-panel grid stays (info + form). Both panels: Drafts Capture card treatment (layered shadow, no border, warm surface).
- Form inputs: subtle `1px` border at rest, layered shadow + accent outline on focus.
- Submit button: forge orange fill, softer radius (`10px`), subtle shadow `0 1px 3px rgba(245,165,66,0.3)`. Hover: shadow deepens.
- Mobile: panels stack, form comes first.

---

## 7. Footer

- Social icons, same as now.
- More top padding.
- Small "ames.consulting" wordmark in `var(--text-1)` to anchor the page bottom.

---

## 8. Global Micro-Interactions

- Default transition speed: `0.12s ease` (down from `0.15s`).
- Scroll-triggered fade-in for homepage sections: `animation-timeline: view()` where supported. Graceful degradation (content appears immediately in unsupported browsers).
- Dark mode: all same treatments. Shadow opacities increase. Blur header uses dark palette.

---

## 9. What We're NOT Doing

- No hamburger menu
- No parallax scrolling
- No heavy JS animations or libraries
- No layout shifts or FOUC
- No breaking changes to content model or JS architecture
- No new fonts or brand color changes
- No build tooling beyond existing scripts

---

## 10. Performance & HIG Alignment

### Performance
- Zero JavaScript animation libraries. CSS-only transitions and scroll animations.
- No layout shifts: all images have explicit `width`/`height` or `aspect-ratio`.
- Lazy-load all images below the fold (`loading="lazy"` already in place).
- Existing Lighthouse CI budgets must still pass: perf >= 0.8, CLS <= 0.1, LCP <= 3s, total <= 500KB.
- The redesign is purely CSS changes plus minor HTML adjustments. No new JS dependencies.

### Apple HIG Alignment
- **Clarity:** Content is the focus. Chrome and decoration stay minimal. Typography establishes hierarchy, not visual noise.
- **Deference:** The UI steps back. Generous whitespace, subtle shadows, and translucent materials (backdrop-filter blur) let content lead.
- **Depth:** Layered shadow system creates a sense of physical surfaces. Cards feel elevated from the page. Hover states reinforce this with shadow depth changes.
- **Consistency:** Spacing scale, type scale, radius scale, and transition timing are uniform across all pages.
- **Direct manipulation feel:** Snappy 0.12s transitions make interactions feel responsive and physical.

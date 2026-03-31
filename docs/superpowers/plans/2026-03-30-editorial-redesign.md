# Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform ames.consulting from functional-but-plain to editorially polished, using layered shadows, generous spacing, sticky blur nav, and refined typography while keeping existing brand, fonts, and HTML architecture.

**Architecture:** All changes are CSS-first in `assets/css/main.css` (single stylesheet, cascade layers), with targeted HTML adjustments for sticky nav wrapper and blog post reading layout. No new JS dependencies.

**Tech Stack:** HTML5, CSS (cascade layers, `@property`, `backdrop-filter`, `animation-timeline: view()`), vanilla ES modules.

**Spec:** `docs/superpowers/specs/2026-03-30-editorial-redesign.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `assets/css/main.css` | Modify | All CSS changes: tokens, shadows, typography, spacing, nav, cards, blog post layout, photography, contact, footer, scroll animations |
| `index.html` | Modify | Sticky nav wrapper, section heading accent lines, footer wordmark |
| `blog/index.html` | Modify | Sticky nav wrapper |
| `work/index.html` | Modify | Sticky nav wrapper |
| `contact/index.html` | Modify | Sticky nav wrapper, reorder panels on mobile |
| `photography/index.html` | Modify | Sticky nav wrapper |
| `links/index.html` | Modify | Sticky nav wrapper, restructure to vertical list layout |
| `likes/index.html` | Modify | Sticky nav wrapper |
| `colophon/index.html` | Modify | Sticky nav wrapper |
| `404.html` | Modify | Sticky nav wrapper |
| `templates/post-template.html` | Modify | Sticky nav wrapper, blog post reading layout classes |
| `templates/gallery-template.html` | Modify | Sticky nav wrapper |
| `templates/eastrise-blog-post.html` | Modify | Sticky nav wrapper |

---

### Task 1: Design Tokens — Spacing, Shadows, Radii, Surfaces

Update the CSS custom properties in `@layer tokens` to establish the new design system foundation.

**Files:**
- Modify: `assets/css/main.css:46-140` (tokens layer)

- [ ] **Step 1: Update spacing tokens**

In `assets/css/main.css`, inside `@layer tokens { :root { ... } }`, replace the spacing values:

```css
/* Spacing — ~40% increase on space-4 and space-5 */
--space-1: clamp(0.4rem, 0.5vw, 0.6rem);
--space-2: clamp(0.8rem, 1vw, 1rem);
--space-3: clamp(1.2rem, 1.5vw, 1.5rem);
--space-4: clamp(2.4rem, 3vw, 3.2rem);
--space-5: clamp(3.2rem, 4vw, 4.8rem);
```

- [ ] **Step 2: Add shadow and radius tokens**

Add new tokens after the `--measure-reading` line and before the closing `}` of `:root`:

```css
/* Radii — editorial */
--radius-sm: 0.25rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
--radius-card: 12px;

/* Shadows — Drafts Capture layered system */
--shadow-card: 0 0 0 0.5px rgba(0,0,0,0.08),
               0 2px 6px rgba(0,0,0,0.05),
               0 8px 24px rgba(0,0,0,0.04);
--shadow-card-hover: 0 0 0 0.5px rgba(0,0,0,0.08),
                     0 4px 12px rgba(0,0,0,0.08),
                     0 12px 32px rgba(0,0,0,0.06);
--shadow-photo: 0 2px 8px rgba(0,0,0,0.06);

/* Transition */
--transition-snappy: 0.12s ease;
```

- [ ] **Step 3: Add surface-1 as page background in light mode**

In the light mode block (`:root, [data-theme="light"]`), change the body background approach. Add a `--surface-page` token:

```css
--surface-page: #f3f0eb;
```

This makes the page background slightly tinted (`--surface-1` value), while cards remain at `--surface-0` (`#faf8f5`). The existing `--surface-0` and `--surface-1` values stay.

- [ ] **Step 4: Add dark mode shadow overrides**

In both dark mode blocks (`@media (prefers-color-scheme: dark)` and `[data-theme="dark"]`), add after `--shadow-soft`:

```css
--shadow-card: 0 0 0 0.5px rgba(0,0,0,0.2),
               0 2px 6px rgba(0,0,0,0.15),
               0 8px 24px rgba(0,0,0,0.12);
--shadow-card-hover: 0 0 0 0.5px rgba(0,0,0,0.2),
                     0 4px 12px rgba(0,0,0,0.2),
                     0 12px 32px rgba(0,0,0,0.16);
--shadow-photo: 0 2px 8px rgba(0,0,0,0.2);
--surface-page: #1a2626;
```

- [ ] **Step 5: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 6: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(tokens): editorial spacing, layered shadows, surface hierarchy"
```

---

### Task 2: Base Layer — Typography & Global Rendering

Update body typography, heading styles, link behavior, and text rendering.

**Files:**
- Modify: `assets/css/main.css:142-200` (base layer)

- [ ] **Step 1: Update body styles**

Replace the `body` rule in `@layer base`:

```css
body {
  min-height: 100dvh;
  font-family: var(--font-body);
  background: var(--surface-page, var(--surface-1));
  color: var(--text-0);
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
```

Changes: `line-height: 1.5` → `1.65`, background uses `--surface-page`, add antialiased rendering.

- [ ] **Step 2: Update link styles**

Replace the `a` rule in `@layer base`:

```css
a {
  color: var(--accent);
  text-decoration: none;
  transition: color var(--transition-snappy);

  &:hover {
    color: var(--accent-hover);
    text-decoration: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.16em;
  }
}
```

Links are now underline-on-hover-only. Accent color distinguishes them at rest.

- [ ] **Step 3: Update global transition speed**

Search for all instances of `0.15s ease` in the file and replace with `var(--transition-snappy)`. This affects: `.social-links a`, `.path-thumb`, `.contact-form button`, and the base `a` rule (already done above).

- [ ] **Step 4: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(typography): editorial line-height, antialiased rendering, hover-only underlines"
```

---

### Task 3: Sticky Nav with Backdrop Blur

Make the site header sticky on scroll with a translucent blur effect.

**Files:**
- Modify: `assets/css/main.css:202-238` (layout layer, site header)
- Modify: all HTML files (wrap header for sticky behavior)

- [ ] **Step 1: Update site-header CSS**

Replace the `.site-header` rule in `@layer layout`:

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: var(--space-2) 0;
  background: transparent;
  transition: background var(--transition-snappy), backdrop-filter var(--transition-snappy);
}

.site-header[data-scrolled] {
  background: rgba(243, 240, 235, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
```

- [ ] **Step 2: Add dark mode scrolled state**

Add after the `.site-header[data-scrolled]` rule, still in `@layer layout`:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .site-header[data-scrolled] {
    background: rgba(28, 41, 41, 0.85);
  }
}

[data-theme="dark"] .site-header[data-scrolled] {
  background: rgba(28, 41, 41, 0.85);
}
```

- [ ] **Step 3: Add scroll detection script to index.html**

At the bottom of `index.html`, just before `</body>`, add:

```html
<script>
  (function() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    function onScroll() {
      if (window.scrollY > 10) {
        header.setAttribute('data-scrolled', '');
      } else {
        header.removeAttribute('data-scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();
</script>
```

- [ ] **Step 4: Add the same scroll script to all other HTML pages**

Add the identical `<script>` block before `</body>` in each of these files:
- `blog/index.html`
- `work/index.html`
- `contact/index.html`
- `photography/index.html`
- `links/index.html`
- `likes/index.html`
- `colophon/index.html`
- `404.html`
- `templates/post-template.html`
- `templates/gallery-template.html`
- `templates/eastrise-blog-post.html`

- [ ] **Step 5: Run E2E tests**

Run: `npm run test:e2e`
Expected: All navigation tests still pass. Nav is visible and functional.

- [ ] **Step 6: Commit**

```bash
git add assets/css/main.css index.html blog/index.html work/index.html contact/index.html photography/index.html links/index.html likes/index.html colophon/index.html 404.html templates/
git commit -m "feat(nav): sticky header with backdrop-filter blur on scroll"
```

---

### Task 4: Homepage — Intro, Path Rows, Section Headings

Refine the homepage intro spacing, path row thumbnails, CTA links, and section heading accents.

**Files:**
- Modify: `assets/css/main.css` (layout layer: intro, path rows, site directory)
- Modify: `index.html` (minor: footer wordmark)

- [ ] **Step 1: Update intro section CSS**

Replace the `.intro` and `.intro h1` rules:

```css
.intro {
  max-width: var(--measure-reading);
  padding: var(--space-5) 0 var(--space-5);
}

.intro h1 {
  font-weight: 700;
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.15;
  letter-spacing: -0.01em;
}
```

- [ ] **Step 2: Update social links spacing**

Replace the `.social-links` rule:

```css
.social-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin-top: var(--space-3);
}
```

Change: `gap: var(--space-1)` → `gap: var(--space-2)` for more breathing room between icons.

- [ ] **Step 3: Update path row thumbnails**

Replace the `.path-thumb img` rule:

```css
.path-thumb img {
  height: clamp(140px, 20vw, 220px);
  width: auto;
  object-fit: cover;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  border: none;
  display: block;
  transition: box-shadow var(--transition-snappy);
}

.path-thumb:hover img {
  box-shadow: var(--shadow-card-hover);
}
```

Remove the old `.path-thumb:hover { opacity: 0.85; }` rule.

- [ ] **Step 4: Update path-browse CTA links**

Replace the `.path-browse` and `.path-browse:hover` rules:

```css
.path-browse {
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  color: var(--accent);
  align-self: start;
  padding: var(--space-1) 0;
  transition: color var(--transition-snappy), transform var(--transition-snappy);
}

.path-browse:hover {
  color: var(--accent-hover);
  transform: translateX(2px);
}
```

- [ ] **Step 5: Add section heading accent line**

In `@layer components`, replace the `.path-row h2` rules:

```css
.path-row h2 {
  font-weight: 600;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  padding-bottom: var(--space-1);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  display: inline-block;
}

.path-row h2 a {
  color: var(--text-0);
  text-decoration: none;

  &:hover {
    color: var(--accent-hover);
  }
}
```

- [ ] **Step 6: Update site directory**

Replace the `.site-directory` rule:

```css
.site-directory {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--space-5);
  padding: var(--space-5) 0;
  border-top: var(--border-soft);
  margin-top: var(--space-5);
}
```

Changes: gap and padding use `--space-5` instead of `--space-4`.

- [ ] **Step 7: Add footer wordmark to index.html**

In `index.html`, inside the `<footer>` just after the closing `</ul>` of `.footer-links`, add:

```html
<p style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--text-1); letter-spacing: 0.04em; margin-top: var(--space-2);">ames.consulting</p>
```

- [ ] **Step 8: Update footer top padding**

Replace the `.site-footer` rule:

```css
.site-footer {
  margin-top: var(--space-5);
  padding: var(--space-5) 0 var(--space-4);
  border-top: var(--border-soft);
}
```

Change: `padding: var(--space-4) 0` → `padding: var(--space-5) 0 var(--space-4)`.

- [ ] **Step 9: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 10: Commit**

```bash
git add assets/css/main.css index.html
git commit -m "feat(homepage): editorial spacing, card shadows, accent heading lines, footer wordmark"
```

---

### Task 5: Blog Index — Borderless Cards with Shadow Hover

Transform the blog stream from bordered panel to open editorial layout.

**Files:**
- Modify: `assets/css/main.css` (layout + components layers: stream-shell, post-card, filters)

- [ ] **Step 1: Update stream-shell**

Replace the `.stream-shell` rule:

```css
.stream-shell {
  container-type: inline-size;
  container-name: stream;
  display: grid;
  gap: var(--space-3);
  padding: 0;
  background: none;
  border: none;
  border-radius: 0;
}
```

Remove background, border, padding. Cards sit directly on page surface.

- [ ] **Step 2: Update post-card styles**

Replace the `.post-card` rule in `@layer components`:

```css
.post-card {
  border: none;
  border-radius: var(--radius-card);
  background: var(--surface-0);
  display: grid;
  gap: 0.6rem;
  padding: var(--space-3);
  box-shadow: none;
  transition: box-shadow var(--transition-snappy), transform var(--transition-snappy);

  &:hover {
    box-shadow: var(--shadow-card);
  }

  & h3 {
    font-size: clamp(1.05rem, 1.6vw, 1.3rem);
    line-height: 1.3;
  }

  & h3 a {
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    text-decoration: none;
    color: var(--accent);
    transition: color var(--transition-snappy);

    &:hover {
      color: var(--accent-hover);
      text-decoration: none;
    }
  }

  & p {
    color: var(--text-1);
    font-size: 0.95rem;
  }

  & footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.35rem;
    font-family: var(--font-heading);
    font-size: 0.82rem;
    color: var(--text-1);
    letter-spacing: 0.02em;
  }

  & .post-read-more {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.95rem;

    &:hover {
      text-decoration: underline;
      text-underline-offset: 0.18em;
      color: var(--accent-hover);
    }
  }
}
```

Key changes: no border, shadow on hover only, meta text in Barlow Condensed, larger titles, read-more underline on hover only.

- [ ] **Step 3: Keep filter inputs bordered**

The `.filters input` and `.filters button` rules already have `border: var(--border-soft)` — no change needed. But remove the background panel from the filters area by verifying `.stream-shell` has no background (done in step 1).

- [ ] **Step 4: Run E2E tests**

Run: `npm run test:e2e`
Expected: Blog filtering, post card rendering all pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(blog): borderless cards, shadow-on-hover, meta text in Barlow Condensed"
```

---

### Task 6: Blog Post Reading Layout

Style individual blog post pages with editorial open-flow reading layout.

**Files:**
- Modify: `assets/css/main.css` (add blog post content styles)
- Modify: `templates/post-template.html` (add reading layout class)

- [ ] **Step 1: Add blog post reading styles**

Add these rules at the end of `@layer layout`, before the closing `}`:

```css
/* ─── Blog Post Reading Layout ─── */
.blog-post-content {
  max-width: var(--measure-reading);
  font-size: 1.05rem;
  line-height: 1.75;
}

.blog-post-content p {
  margin-bottom: var(--space-3);
}

.blog-post-content img {
  max-width: min(80%, var(--measure-wide));
  margin-inline: auto;
  display: block;
  border-radius: var(--radius-md);
}

.blog-post-content blockquote {
  border-left: 3px solid var(--accent);
  padding-left: var(--space-3);
  margin: var(--space-3) 0;
  font-style: italic;
}

.blog-post-content h2,
.blog-post-content h3 {
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}

.blog-post-content ul,
.blog-post-content ol {
  padding-left: 1.2em;
  margin-bottom: var(--space-3);
}

.blog-post-content li {
  margin-bottom: 0.5em;
  line-height: 1.7;
}

@media (width < 40rem) {
  .blog-post-content {
    font-size: 1rem;
    line-height: 1.65;
  }

  .blog-post-content img {
    max-width: 100%;
  }
}
```

- [ ] **Step 2: Update blog post meta styling**

Add a `.blog-post-meta` class to handle the date/read-time line. Add in `@layer components`:

```css
.blog-post-meta {
  font-family: var(--font-heading);
  font-size: 0.82rem;
  color: var(--text-1);
  letter-spacing: 0.02em;
  margin-top: var(--space-1);
}
```

- [ ] **Step 3: Update post template HTML**

In `templates/post-template.html`, change the meta div class from `dialog-meta` to `blog-post-meta`:

```html
<div class="blog-post-meta">{{PUBLISHED_AT_FORMATTED}} • {{READ_TIME}}</div>
```

- [ ] **Step 4: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css templates/post-template.html
git commit -m "feat(blog-post): editorial reading layout with generous spacing"
```

---

### Task 7: Work Pages — Card Shadows and Project Layout

Transform work index cards and project detail pages.

**Files:**
- Modify: `assets/css/main.css` (layout + components: work-item, work-category, project-content)

- [ ] **Step 1: Update work-item cards**

Replace the `.work-item` rules in `@layer components`:

```css
.work-item a {
  display: grid;
  gap: var(--space-1);
  text-decoration: none;
  color: var(--text-0);
  border-radius: var(--radius-card);
  padding: var(--space-2);
  background: var(--surface-0);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-snappy), transform var(--transition-snappy);
}

.work-item a:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.work-item img {
  border-radius: var(--radius-md);
  border: none;
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.work-item h3 {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--accent);
}

.work-item a:hover h3 {
  color: var(--accent-hover);
}

.work-item p {
  font-size: 0.9rem;
  color: var(--text-1);
}
```

- [ ] **Step 2: Update work-category headings**

Replace the `.work-category h2` rule:

```css
.work-category h2 {
  font-weight: 500;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-1);
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 40%, transparent);
  display: inline-block;
}
```

- [ ] **Step 3: Update project detail hero**

Replace the `.project-hero img` rule:

```css
.project-hero img {
  border-radius: var(--radius-card);
  border: none;
  box-shadow: var(--shadow-card);
  width: 100%;
  height: auto;
}
```

- [ ] **Step 4: Update project detail section headings**

Replace the `.project-content h2` rule:

```css
.project-content h2 {
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
```

- [ ] **Step 5: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 6: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(work): card shadows, hover lift, accent heading lines"
```

---

### Task 8: Photography — Shadow Cards and Gallery Layout

Update photography index and gallery pages.

**Files:**
- Modify: `assets/css/main.css` (layout: photo-gallery, gallery-image, gallery-preview)

- [ ] **Step 1: Update gallery-image on gallery detail pages**

Replace the `.gallery-image` rule:

```css
.gallery-image {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-md);
  border: none;
  box-shadow: var(--shadow-photo);
}
```

- [ ] **Step 2: Add gallery-preview styles for photography index**

Add in `@layer components`:

```css
.gallery-grid {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-3);
}

@media (width >= 40rem) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

.gallery-preview a {
  display: block;
  text-decoration: none;
  color: var(--text-0);
}

.gallery-preview img {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-photo);
  transition: transform var(--transition-snappy), box-shadow var(--transition-snappy);
}

.gallery-preview a:hover img {
  transform: scale(1.02);
  box-shadow: var(--shadow-card);
}

.gallery-preview h2 {
  font-size: 1.05rem;
  font-weight: 600;
  margin-top: var(--space-2);
  color: var(--accent);
}

.gallery-preview a:hover h2 {
  color: var(--accent-hover);
}

.gallery-preview p {
  font-size: 0.9rem;
  color: var(--text-1);
  margin-top: var(--space-1);
}

.gallery-preview time {
  font-family: var(--font-heading);
  font-size: 0.82rem;
  color: var(--text-1);
  letter-spacing: 0.02em;
}
```

- [ ] **Step 3: Update photo-gallery gap**

Replace the `.photo-gallery` rule:

```css
.photo-gallery {
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
```

Change: `gap: var(--space-3)` → `gap: var(--space-4)`.

- [ ] **Step 4: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(photography): shadow cards, hover scale, gallery grid"
```

---

### Task 9: Contact Page — Card Treatment and Form Polish

Apply Drafts Capture card treatment to contact panels and polish the form.

**Files:**
- Modify: `assets/css/main.css` (components: contact-panel, contact-form)

- [ ] **Step 1: Update contact-panel**

Replace the `.contact-panel` rule:

```css
.contact-panel {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--surface-0);
  border: none;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 2: Update form input focus states**

Replace the `.contact-form input, .contact-form textarea, .contact-form button` rule:

```css
.contact-form input,
.contact-form textarea,
.contact-form button {
  border: 1px solid var(--rule);
  border-radius: var(--radius-sm);
  padding: 0.85rem 0.9rem;
  background: var(--surface-0);
  color: var(--text-0);
  min-block-size: 44px;
  transition: border-color var(--transition-snappy), box-shadow var(--transition-snappy);
}

.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--shadow-card);
}
```

- [ ] **Step 3: Update submit button**

Replace the `.contact-form button` style (the one that sets background to accent):

```css
.contact-form button {
  justify-self: start;
  cursor: pointer;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.02em;
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface-0);
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(245,165,66,0.3);
  transition: background var(--transition-snappy), box-shadow var(--transition-snappy);

  &:hover {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    box-shadow: 0 2px 8px rgba(217,74,45,0.3);
  }
}
```

- [ ] **Step 4: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 5: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(contact): card shadows, focus glow, polished submit button"
```

---

### Task 10: Links Page — Vertical List Layout

Transform links page from card-based to clean vertical list.

**Files:**
- Modify: `assets/css/main.css` (add links-list styles)
- Modify: `links/index.html` (restructure content)

- [ ] **Step 1: Add links-list styles**

Add in `@layer components`:

```css
/* ─── Links Page ─── */
.links-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 0;
}

.links-list li {
  padding: var(--space-2) 0;
  border-bottom: var(--border-soft);
}

.links-list a {
  font-family: var(--font-heading);
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--accent);
  text-decoration: none;
}

.links-list a:hover {
  color: var(--accent-hover);
}

.links-list .link-domain {
  display: block;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--text-1);
  margin-top: 0.2rem;
}
```

- [ ] **Step 2: Restructure links/index.html content**

Replace the `<section class="content-page">` content in `links/index.html`:

```html
<section class="content-page">
  <p>Articles, essays, and resources worth reading.</p>

  <h2>Technology &amp; Design</h2>
  <ul class="links-list">
    <li>
      <a href="#">Example Article Title<span class="link-domain">example.com</span></a>
    </li>
  </ul>

  <h2>Content Strategy</h2>
  <ul class="links-list">
    <li>
      <a href="#">Example Article Title<span class="link-domain">example.com</span></a>
    </li>
  </ul>

  <h2>Vermont &amp; Local</h2>
  <ul class="links-list">
    <li>
      <a href="#">Example Article Title<span class="link-domain">example.com</span></a>
    </li>
  </ul>
</section>
```

- [ ] **Step 3: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 4: Commit**

```bash
git add assets/css/main.css links/index.html
git commit -m "feat(links): clean vertical list layout with domain labels"
```

---

### Task 11: Scroll Animations (Progressive Enhancement)

Add CSS-only scroll-triggered fade-in for homepage sections.

**Files:**
- Modify: `assets/css/main.css` (utilities layer)

- [ ] **Step 1: Add scroll animation styles**

Add in `@layer utilities`, before the `prefers-reduced-motion` media query:

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .home-paths .path-row {
      animation: fade-slide-up linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 30%;
    }

    @keyframes fade-slide-up {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
}
```

This uses `animation-timeline: view()` which is progressive enhancement. In browsers that don't support it, content appears immediately with no animation.

- [ ] **Step 2: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass. Scroll animations degrade gracefully.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(animation): scroll-triggered fade-in for homepage sections"
```

---

### Task 12: Content Page Styles — Likes, Colophon, EastRise

Update the shared content-page styles for reading pages.

**Files:**
- Modify: `assets/css/main.css` (components: content-page)

- [ ] **Step 1: Update content-page section headings**

Replace the `.content-page h2` rule:

```css
.content-page h2 {
  font-weight: 600;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
  padding-bottom: var(--space-1);
  border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}
```

- [ ] **Step 2: Run quality checks**

Run: `npm run check:all`
Expected: All checks pass.

- [ ] **Step 3: Commit**

```bash
git add assets/css/main.css
git commit -m "feat(content): accent-colored heading rules for reading pages"
```

---

### Task 13: Final Validation and Test Suite

Run the full test suite, fix any issues, and verify Lighthouse budgets.

**Files:**
- No new files. Validation only.

- [ ] **Step 1: Run full quality checks**

Run: `npm run check:all`
Expected: All HTML validation, JS lint, E2E tests, accessibility tests pass.

- [ ] **Step 2: Run accessibility tests specifically**

Run: `npm run test:a11y`
Expected: Zero critical violations across all routes.

- [ ] **Step 3: Start local server and visually verify**

Run: `python3 -m http.server 4173` (in background)

Visit in browser:
- Homepage: check sticky nav, intro spacing, card shadows, accent lines
- Blog index: borderless cards, shadow on hover
- Blog post: reading layout, generous spacing
- Work index: card shadows, hover lift
- Contact: card panels, form focus states
- Photography: shadow cards, hover scale
- Links: vertical list layout

- [ ] **Step 4: Verify mobile responsiveness**

Check all pages at 375px width:
- Nav fits without hamburger
- Cards stack single-column
- Blog post images go full-width
- Contact panels stack
- All text is readable

- [ ] **Step 5: Commit any fixes**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: address final validation issues from editorial redesign"
```

- [ ] **Step 6: Final commit confirming all tests pass**

```bash
git add -A
git commit -m "chore: editorial redesign complete, all tests passing"
```

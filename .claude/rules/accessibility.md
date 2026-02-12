---
description: Enforced when editing HTML files
globs: ["*.html"]
---

# Accessibility Rules

- Heading hierarchy must be strictly sequential (h1 → h2 → h3). Use `visually-hidden` class for screen-reader-only headings.
- `aria-current="page"` for exact current page; `aria-current="true"` for parent nav items when on a child page.
- All `<img>` tags need explicit `width` and `height` attributes to prevent CLS.
- SVG icons: `fill: currentColor`, `aria-hidden="true"` on SVG, `aria-label` on parent `<a>`.
- Honeypot fields: `aria-hidden="true"` + `tabindex="-1"`.

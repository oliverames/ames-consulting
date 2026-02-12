---
description: Accessibility conventions for HTML and components
globs: ["*.html", "**/*.html", "assets/**/*.js"]
---

# Accessibility Rules

## Heading Hierarchy
- Never skip heading levels (e.g., `<h3>` without a preceding `<h2>`)
- Use `visually-hidden` class for semantic headings that shouldn't display

## Navigation
- `aria-current="page"` on links matching the exact current page
- `aria-current="true"` on parent nav items when user is on a child page within that section

## SVG Icons
- `aria-hidden="true"` on the `<svg>` element
- `aria-label="Platform Name"` on the parent `<a>` element
- `fill: currentColor` on SVG paths to inherit link color/hover states

## Images
- Always include `width` and `height` attributes on `<img>` tags (CLS prevention)
- Use meaningful `alt` text; decorative images get `alt=""`

## Forms
- Honeypot fields: `aria-hidden="true"` + `tabindex="-1"`

## Progressive Enhancement
- Include `<noscript>` fallback content for JS-rendered sections
- Contact form should function without JS (keep native validation)

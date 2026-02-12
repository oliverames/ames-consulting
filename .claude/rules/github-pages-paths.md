---
description: Enforces relative paths for GitHub Pages compatibility
globs: ["*.html", "**/*.html", "assets/**/*.js", "assets/**/*.css"]
---

# Relative Paths Required

This site is deployed to GitHub Pages and may be served from a subdirectory. All internal references MUST use relative paths.

## Rules

- Use `./`, `../`, `../../` for all internal links, CSS, JS, and image references
- NEVER use absolute paths like `/assets/css/main.css` — they resolve to the domain root and break subdirectory deploys
- For JS module imports: `./filename.js`
- For JS data fetches: `new URL("../data/file.json", import.meta.url)` to resolve relative to script location

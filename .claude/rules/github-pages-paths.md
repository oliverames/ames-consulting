---
description: Enforces relative paths so local dev and preview deployments work
globs: ["*.html", "**/*.html", "assets/**/*.js", "assets/**/*.css"]
---

# Relative Paths Required

This site deploys to Cloudflare Pages (wrangler, from `_site/`). Internal references still use relative paths so pages work from a local file server, a preview deployment, or any subdirectory mount.

## Rules

- Use `./`, `../`, `../../` for all internal links, CSS, JS, and image references
- NEVER use absolute paths like `/assets/css/main.css` — they resolve to the domain root and break subdirectory serving
- **Exception:** `404.html` uses root-absolute asset paths on purpose. It is served at arbitrary missing URLs (e.g. `/some/missing/page/`), where relative paths resolve against the nonexistent directory and 404.
- For JS module imports: `./filename.js`
- For JS data fetches: `new URL("../data/file.json", import.meta.url)` to resolve relative to script location

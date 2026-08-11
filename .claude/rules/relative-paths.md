---
description: Enforced when editing HTML, CSS, or JS files
globs: ["*.html", "assets/**/*"]
---

# Relative Paths Only

All internal links and asset references MUST use relative paths (`./`, `../`, `../../`).
Never use absolute paths like `/assets/css/main.css` or `/work/`.

**Exception:** `404.html` uses root-absolute asset paths on purpose — it renders at arbitrary
missing URLs, where relative paths resolve against the nonexistent directory.

For JavaScript module imports and fetches, resolve paths relative to the script using:
```js
new URL("../data/file.json", import.meta.url)
```

The site deploys to Cloudflare Pages from `_site/`; relative paths keep local dev servers and
preview deployments working after the static build.

---
description: Enforced when editing HTML, CSS, or JS files
globs: ["*.html", "assets/**/*"]
---

# Relative Paths Only

All internal links and asset references MUST use relative paths (`./`, `../`, `../../`).
Never use absolute paths like `/assets/css/main.css` or `/work/`.

For JavaScript module imports and fetches, resolve paths relative to the script using:
```js
new URL("../data/file.json", import.meta.url)
```

Absolute paths break GitHub Pages subdirectory deployments.

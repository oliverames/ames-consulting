# Architecture

## Goal

Provide a durable static-site baseline for GitHub Pages where all content is modeled as posts and rendered into multiple views.

## Runtime Model

1. Browser loads static HTML shell for current route (`/`, `/blog/`, `/portfolio/`).
2. `assets/js/app.js` loads runtime config.
3. Source adapter is selected (`microblog` or local fallback).
4. Source payload is normalized into canonical post objects.
5. Route rules and query filters are applied.
6. Post cards are rendered through a custom element.
7. Optional dialog preview and popover helpers are attached as progressive enhancement.

## Views

- Home: preview window of filtered stream (`homePreviewLimit`).
- Blog: full stream.
- Portfolio: full stream with default `portfolioTag` filter.

## Source Adapter Contract

Each content source provides:

- `listPosts(): Promise<Post[]>`

Where each `Post` follows the schema documented in `docs/CONTENT-MODEL.md`.

## Progressive Enhancement Rules

- Baseline interaction must work without advanced CSS features.
- Advanced features (`@container`, `:has()`, popover, dialog styling, anchor positioning) should improve UX but never block content rendering.
- If Micro.blog fetch fails, local content fallback is used to keep pages testable.

## Hosting

- Static artifact deployed via GitHub Actions Pages workflow.
- Custom domain controlled through `CNAME`.

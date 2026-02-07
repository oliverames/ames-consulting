# Contributing

## Development flow

- Create a branch from `main` using `codex/<topic>` naming.
- Keep changes scoped and documented.
- Run local checks before opening a PR:

```bash
npm run check:all
npm run test:e2e
```

## Pull requests

- Use semantic PR titles (`feat:`, `fix:`, `docs:`, etc.).
- Include a brief testing summary.
- Update `CHANGELOG.md` for user-visible behavior changes.

## Quality expectations

- Preserve unified content model assumptions.
- Preserve accessibility and reduced-motion behavior.
- Keep static-hosting compatibility for GitHub Pages.

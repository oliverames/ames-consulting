# Release Process

## Branching

- Default branch: `main`
- Feature branches: `codex/<topic>`

## PR Requirements

- Semantic title (`feat:`, `fix:`, `docs:`, etc.)
- Green CI across quality, e2e/a11y, performance
- Updated docs/changelog when behavior changes

## Branch Protection (GitHub Settings)

Configure `main` with:

- Require pull request before merging
- Require status checks to pass
- Require branches to be up to date before merging
- Include administrators
- Restrict force pushes and deletion

## Release Checklist

- Update `CHANGELOG.md` when behavior changes.
- Run `npm run check:build-idempotence`, `npm run check:all`, `npm run check:built-site`, and `npm run test:site`.
- Smoke-test `/`, `/blog/`, `/work/`, `/contact/`, and representative service and work pages in the built artifact.
- Confirm sitemap and robots generation, the production contact configuration, and the contact email fallback.
- Merge or push the verified commit to `main`. The `deploy-pages.yml` workflow reruns quality and performance gates before deploying `_site/` to Cloudflare Pages.
- Confirm the workflow's live route, contact endpoint, security header, publication-boundary, and retired-path checks pass.

The repository does not use version tags or a separate published release as a deployment trigger. A successful deployment from `main` is the release.

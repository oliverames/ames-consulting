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

- Confirm `CHANGELOG.md` includes release notes
- Confirm sitemap/robots generation still valid
- Run local smoke test on `/`, `/blog/`, `/portfolio/`, `/contact/`
- Confirm contact form endpoint config in production
- Tag release (`vX.Y.Z`) and publish notes

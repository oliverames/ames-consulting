# Foundation Checklist

This checklist converts reference-site patterns into build rules for `ames.consulting`.

Use it as a gate before major design or feature changes.

## Information Architecture

Do:

- Keep top-level navigation short and stable.
- Make route purpose immediately legible (`/`, `/blog/`, `/portfolio/`).
- Preserve one primary content stream with multiple filtered views.

Do not:

- Add new nav destinations without clear content ownership.
- Split portfolio into a separate data model.
- Hide critical navigation behind novelty interactions.

## Content Model and Taxonomy

Do:

- Keep `Post` schema stable across all views.
- Enforce lowercase tags and controlled vocabulary.
- Define one canonical portfolio tag and keep it consistent.

Do not:

- Allow ad hoc tag variants (`Portfolio`, `portfolio-work`, etc.) without intent.
- Add per-view post fields that create schema drift.
- Couple content shape to temporary visual decisions.

## Reading Experience

Do:

- Optimize for scanability first: title, date, summary, tags.
- Maintain strong typographic hierarchy and spacing rhythm.
- Keep excerpts concise and information-dense.

Do not:

- Prioritize decorative components over readability.
- Overload cards with metadata that weakens hierarchy.
- Use interaction effects that interrupt reading flow.

## Interaction and Motion

Do:

- Use enhancement features only when baseline remains fully usable.
- Respect reduced-motion preferences.
- Keep dialogs/popovers purposeful and dismissible.

Do not:

- Depend on advanced CSS/JS features for core content access.
- Ship motion that competes with content.
- Introduce hidden state that confuses back/forward navigation.

## Performance and Robustness

Do:

- Preserve static-first delivery and lightweight JavaScript.
- Keep local fallback content working for development resilience.
- Track and cap avoidable asset bloat as design evolves.

Do not:

- Introduce framework/tooling complexity without clear payback.
- Block initial content rendering on noncritical scripts.
- Treat fallback pathways as optional.

## Accessibility and Semantics

Do:

- Keep semantic landmarks and heading order coherent.
- Ensure keyboard and focus-visible behavior for all controls.
- Keep color contrast and readable font sizing as hard constraints.

Do not:

- Replace semantic controls with nonsemantic click targets.
- Remove focus styles in the name of visual polish.
- Hide context from assistive technology without equivalent labeling.

## Voice and Brand Integrity

Do:

- Maintain a clear editorial tone and point of view.
- Use direct language and avoid generic consulting copy.
- Let writing and shipped work provide primary credibility.

Do not:

- Use stock mission-statement language.
- Dilute personality with trend-chasing visual tropes.
- Treat the site as a template rather than authored work.

## Pre-Launch Gate

Mark complete only when all statements are true:

- [ ] Portfolio remains a filter of the canonical post stream.
- [ ] Navigation contains only intentional, actively used destinations.
- [ ] Tags are normalized and documented.
- [ ] Stream cards preserve clear reading hierarchy.
- [ ] Progressive enhancement path degrades safely.
- [ ] Keyboard-only navigation is fully functional.
- [ ] Reduced-motion behavior is verified.
- [ ] No new dependency is added without written rationale.
- [ ] Home, Blog, and Portfolio all load with local fallback data.

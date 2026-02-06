# Weighted Iteration Rubric

Use this rubric to evaluate each design or architecture iteration of `ames.consulting`.

Review date baseline: February 6, 2026.

## Scoring Rules

- Score each dimension from `1` to `5`.
- Compute weighted score:

```text
weighted_score_percent = SUM((dimension_score / 5) * dimension_weight)
```

- Weights total `100`.
- A dimension score below floor can fail the review even if total score is high.

## Dimensions, Weights, Floors

| Dimension | Weight | Floor | What it measures |
| --- | ---: | ---: | --- |
| Voice and Point of View | 18 | 4 | Editorial personality, non-generic tone, authored feel |
| Information Architecture | 16 | 4 | Navigation clarity, wayfinding confidence, route purpose |
| Unified Stream Integrity | 16 | 4 | Single content model, clean filter logic, no portfolio/blog drift |
| Reading Experience | 14 | 4 | Hierarchy, scanability, excerpt quality, density control |
| Visual Identity | 12 | 3 | Distinct and intentional visual language |
| Interaction and Motion | 8 | 3 | Purposeful micro/transition behavior with low friction |
| Accessibility and Semantics | 8 | 4 | Keyboard/focus support, contrast, semantic structure |
| Performance and Robustness | 6 | 4 | Fast initial load, resilient fallbacks, low complexity |
| Action Clarity | 2 | 2 | Clear next actions (read, explore, contact, subscribe) |

## Rating Anchors (1 to 5)

Apply these anchors across all dimensions:

- `1`: Broken or absent; actively harms usability or clarity.
- `2`: Present but weak; inconsistent and unconvincing.
- `3`: Solid baseline; functional with notable gaps.
- `4`: Strong and reliable; clearly intentional and cohesive.
- `5`: Exceptional; best-in-class for this site type and goals.

## Decision Thresholds

| Outcome | Rule |
| --- | --- |
| Ship Candidate | Weighted score `>= 82` and all floors met |
| Needs Revision | Weighted score `72-81` or any floor miss by `1` point |
| Reject | Weighted score `< 72` or any hard gate failure |

## Hard Gates (Override Score)

If any hard gate fails, result is `Reject` regardless of weighted score.

- Portfolio is still a filtered view of canonical posts.
- Home, Blog, Portfolio all render with fallback data path.
- Keyboard-only navigation works for all controls.
- Focus-visible styling is present and usable.
- Reduced-motion behavior is honored.
- No core content depends on unsupported advanced features.

## Evaluation Workflow

1. Record iteration scope (what changed).
2. Score each dimension with one-sentence evidence.
3. Calculate weighted score.
4. Check floors and hard gates.
5. Decide: `Ship Candidate`, `Needs Revision`, or `Reject`.
6. Log 3 highest-impact improvements for next pass.

## Target Bands by Phase

| Phase | Target | Notes |
| --- | --- | --- |
| Foundation | `>= 74` | Focus on IA, stream integrity, accessibility, robustness |
| Visual Direction | `>= 78` | Raise voice + visual identity without regressions |
| Pre-Launch | `>= 82` | Must pass all floors and hard gates |

## References

- `docs/REFERENCE-SITE-MATRIX.md`
- `docs/FOUNDATION-CHECKLIST.md`

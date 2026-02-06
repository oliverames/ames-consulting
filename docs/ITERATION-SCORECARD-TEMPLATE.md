# Iteration Scorecard Template

Use this template with `docs/WEIGHTED-RUBRIC.md`.

## Iteration Metadata

- Date:
- Reviewer:
- Iteration name:
- Scope summary:
- Changed files/routes:

## Hard Gates

- [ ] Portfolio is a filtered canonical stream.
- [ ] Home/Blog/Portfolio render with fallback data.
- [ ] Keyboard-only navigation works for all controls.
- [ ] Focus-visible behavior is correct.
- [ ] Reduced-motion behavior is respected.
- [ ] Core content is not blocked by advanced feature support.

If any unchecked gate is a true fail, final decision is `Reject`.

## Dimension Scoring

| Dimension | Weight | Floor | Score (1-5) | Weighted contribution | Evidence |
| --- | ---: | ---: | ---: | ---: | --- |
| Voice and Point of View | 18 | 4 |  |  |  |
| Information Architecture | 16 | 4 |  |  |  |
| Unified Stream Integrity | 16 | 4 |  |  |  |
| Reading Experience | 14 | 4 |  |  |  |
| Visual Identity | 12 | 3 |  |  |  |
| Interaction and Motion | 8 | 3 |  |  |  |
| Accessibility and Semantics | 8 | 4 |  |  |  |
| Performance and Robustness | 6 | 4 |  |  |  |
| Action Clarity | 2 | 2 |  |  |  |

## Score Calculation

```text
weighted_score_percent = SUM((score / 5) * weight)
```

- Weighted score percent:
- Floor misses:
- Hard gate failures:

## Decision

- Decision: `Ship Candidate` | `Needs Revision` | `Reject`
- Rationale:

## Top 3 Improvements for Next Iteration

1.
2.
3.

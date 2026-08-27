# Follow-up Bug-Fixing Pass

**Date:** 2026-08-27  
**Base commit:** `6468e34`

## Scope

This pass reviewed browser runtime behavior, the contact Function, dark-mode accessibility, and the built responsive-image experience. It left page copy, gallery content, and deployment policy unchanged.

## Confirmed findings

1. Correcting every invalid contact field left the global validation error visible.
2. A transient Turnstile script failure consumed both one-shot interaction listeners, so later field interactions could not retry the script.
3. A stalled contact request kept the submit button disabled without a time limit.
4. The contact Function generated a new Resend idempotency key for every retry, so an upstream timeout could still produce duplicate email.
5. The blog introduction removed its link underline in dark mode, where color alone did not distinguish the link. Axe classified this as a serious `link-in-text-block` violation.
6. Carousel buttons requested smooth scrolling even when the visitor preferred reduced motion.
7. Built project cards treated a responsive derivative and its authored source as two scrub frames, so the first movement could show the same photograph twice.

## Refuted candidates

- The inbound prompt intentionally waits for another engagement event when its automatic opening is blocked by a dialog. Opening it immediately after another dialog closes would change interaction design.
- A stalled runtime configuration request preserves the direct email fallback, so it does not trap the visitor.
- The tracked tree contains no symbolic links, so the lexical path checks do not expose a current publication defect.

## Verification

Verification results will be recorded after the complete source and artifact gates finish.

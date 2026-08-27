# Follow-up Bug-Fixing Pass

**Date:** 2026-08-27  
**Base commit:** `6468e34`

## Scope

This pass reviewed browser runtime behavior, the contact Function, dark-mode accessibility, and the built responsive-image experience. It left page copy, gallery content, and deployment policy unchanged.

## Confirmed findings

1. Correcting every invalid contact field left the global validation error visible. The input handler now clears that message after the last field becomes valid.
2. A transient Turnstile script failure consumed both one-shot interaction listeners. The listeners now remain active, while the existing request guard prevents duplicate loads.
3. A stalled contact request kept the submit button disabled without a time limit. The client now aborts the request after 15 seconds and restores the button.
4. The contact Function generated a new Resend idempotency key for every retry. It now hashes the form start time and exact email payload into a stable key. [Resend documents](https://resend.com/docs/dashboard/emails/idempotency-keys) that reusing a key makes retries safe for 24 hours.
5. The blog introduction removed its link underline in dark mode, where color alone did not distinguish the link. The dark theme now restores the underline. Axe no longer reports the serious `link-in-text-block` violation.
6. Carousel buttons requested smooth scrolling when the visitor preferred reduced motion. They now use automatic scrolling under that preference.
7. Built project cards treated a responsive derivative and its authored source as two scrub frames. The scrubber now uses the authored source as its pinned frame, so the first step advances to another photograph.

## Refuted candidates

- The inbound prompt intentionally waits for another engagement event when its automatic opening is blocked by a dialog. Opening it immediately after another dialog closes would change interaction design.
- A stalled runtime configuration request preserves the direct email fallback, so it does not trap the visitor.
- The tracked tree contains no symbolic links, so the lexical path checks do not expose a current publication defect.

## Verification

- `npm run check:functions` passed all 16 isolated Function tests.
- `npm run check:ship` passed. It proved two consecutive builds were identical, ran `check:all`, validated the built site, and passed all 165 deploy artifact browser tests.
- The final artifact suite covered the new Turnstile retry, request timeout, stable idempotency key, dark-mode link, reduced-motion carousel, and scrub-frame regressions.
- No live contact message was sent. The contact tests mocked Turnstile and Resend.

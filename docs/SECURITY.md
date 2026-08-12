# Security Baseline

This project is a static site with client-rendered enhancements. Security focuses on reducing common web risks while preserving static-hosting simplicity.

## Implemented Controls

- Gallery scrubbing fetches only same-origin pages, parses them with `DOMParser`, and extracts image URLs instead of inserting fetched markup into the live page.
- CSP in route metadata and the Cloudflare `_headers` policy, including framing and object restrictions.
- HSTS, MIME-sniffing protection, a strict referrer policy, and a permissions policy that disables sensitive APIs.
- Contact form anti-abuse: same-origin enforcement, payload and timestamp-plausibility limits, a honeypot, hostname-bound Turnstile verification, a Cloudflare WAF rate-limiting rule on `POST /api/contact`, and a supplementary local rate limiter.
- Outbound calls from the contact Function (Turnstile siteverify and Resend) run under a 10-second timeout and return structured 502 JSON on network failure instead of a raw platform error.
- Accidental image dragging is disabled without blocking text selection, context menus, save shortcuts, or printing.

## Known Limits

- Browser-delivered assets cannot be fully copy-protected.
- The browser-local rate limiter is not a security boundary. The endpoint relies on same-origin checks and single-use Turnstile tokens.

## Edge Response Headers

`scripts/security-headers.mjs` is the single source of truth for the sitewide header policy. Cloudflare Pages serves it on static responses through the root `_headers` file, the publication middleware serves it on tombstone 404s, and `npm run check:security-headers` fails the build when the two drift apart. The set covers:

- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options`
- `Strict-Transport-Security` (one year, `includeSubDomains`, `preload` token set; the domain is not yet submitted to the browser preload list)

## Contact Endpoint

The Pages Function validates:

- the request origin and payload size
- the honeypot and a timestamp-plausibility window (the client enforces the minimum fill time against its own clock; the server tolerates up to five minutes of forward clock skew so honest visitors are not false-rejected)
- required fields and field lengths
- a single-use Turnstile token, including that the token was solved on the requesting hostname, before sending through Resend

A Cloudflare WAF rate-limiting rule on the `ames.consulting` zone throttles repeated `POST /api/contact` requests per IP ahead of the Function. The rule lives in the Cloudflare dashboard, not in this repository.

## Secure Change Checklist

- Any new third-party script is documented and justified.
- Any endpoint domain is reflected in CSP/connect policy.
- New HTML rendering paths avoid untrusted markup and receive an injection review.
- New form fields are validated client-side and server-side.

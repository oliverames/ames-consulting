# Security Baseline

This project is a static site with client-rendered enhancements. Security focuses on reducing common web risks while preserving static-hosting simplicity.

## Implemented Controls

- Gallery scrubbing fetches only same-origin pages, parses them with `DOMParser`, and extracts image URLs instead of inserting fetched markup into the live page.
- CSP in route metadata and the Cloudflare `_headers` policy, including framing and object restrictions.
- HSTS, MIME-sniffing protection, a strict referrer policy, and a permissions policy that disables sensitive APIs.
- Contact form anti-abuse: same-origin enforcement, payload and fill-time limits, a honeypot, Turnstile verification, and a supplementary local rate limiter.
- Accidental image dragging is disabled without blocking text selection, context menus, save shortcuts, or printing.

## Known Limits

- Browser-delivered assets cannot be fully copy-protected.
- The browser-local rate limiter is not a security boundary. The endpoint relies on same-origin checks and single-use Turnstile tokens.

## Edge Response Headers

Cloudflare Pages applies these headers to every static response through the root `_headers` file:

- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

## Contact Endpoint

The Pages Function validates:

- the request origin and payload size
- the honeypot and minimum fill time
- required fields and field lengths
- a single-use Turnstile token before sending through Resend

## Secure Change Checklist

- Any new third-party script is documented and justified.
- Any endpoint domain is reflected in CSP/connect policy.
- New HTML rendering paths avoid untrusted markup and receive an injection review.
- New form fields are validated client-side and server-side.

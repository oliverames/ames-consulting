# Security Baseline

This project is a static site with client-rendered enhancements. Security focuses on reducing common web risks while preserving static-hosting simplicity.

## Implemented Controls

- Runtime HTML sanitization for preview content.
- CSP baseline via `meta http-equiv` on route shells.
- Referrer policy (`strict-origin-when-cross-origin`).
- Permissions policy with sensitive APIs disabled.
- Contact form anti-abuse: honeypot, minimum-fill-time gate, local rate limiter.
- Asset extraction deterrence for protected images (right-click/drag/save-key interception).

## Known Limits

- Browser-delivered assets cannot be fully copy-protected.
- Meta-tag CSP is weaker than server headers.
- Client-side anti-spam controls are supplementary; endpoint-side protections remain required.

## Recommended Edge/Header Policy

When a CDN/proxy layer is introduced, set headers there:

- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security`

## Contact Endpoint Requirements

Use a backend that supports:

- server-side rate limiting
- spam scoring/honeypot verification
- request origin validation
- abuse logging

## Secure Change Checklist

- Any new third-party script is documented and justified.
- Any endpoint domain is reflected in CSP/connect policy.
- New HTML rendering paths pass sanitizer review.
- New form fields are validated client-side and server-side.

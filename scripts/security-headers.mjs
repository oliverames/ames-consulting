// Single source of truth for the sitewide security headers.
//
// Four surfaces must serve an identical policy:
//   1. `_headers` — applied by Cloudflare Pages to every static response.
//      Pages reads the literal file, so it cannot import this module;
//      `validate-security-headers.mjs` (check:security-headers) fails the
//      build when the file drifts from these values.
//   2. `functions/_middleware.js` — tombstone 404 responses import this map.
//   3. `functions/api/contact.js` — JSON responses import this map.
//   4. The deploy workflow's live-header verification greps for substrings of
//      these values.
//
// Header names are lowercase so the middleware can spread the map directly
// into a Response headers init.
export const SECURITY_HEADERS = {
  "content-security-policy": "default-src 'self'; base-uri 'self'; connect-src 'self' https://challenges.cloudflare.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com; font-src 'self' https://fonts.gstatic.com data:; form-action 'self'; frame-ancestors 'none'; frame-src https://www.youtube-nocookie.com https://challenges.cloudflare.com; img-src 'self' data: https://*.google-analytics.com https://www.googletagmanager.com; object-src 'none'; script-src 'self' https://challenges.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; upgrade-insecure-requests",
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy": "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

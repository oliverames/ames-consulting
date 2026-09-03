// Single source of truth for the Google tag (Google Analytics 4) install.
//
// The tag ships as two `<script>` elements that `apply-shared-ui.mjs` injects
// at the top of every page's `<head>`: Google's async loader and the local
// `assets/js/google-tag.js`, which holds the `gtag('config', …)` call. The
// config lives in a file rather than inline so the CSP can stay at
// `script-src 'self' <hosts>` with no `'unsafe-inline'`, nonce, or hash.
//
// The host lists below are the Google Analytics 4 subset of Google's CSP
// guidance (https://developers.google.com/tag-platform/security/guides/csp).
// Advertising endpoints (doubleclick.net, googlesyndication.com) are left out
// because Google signals and ads features are not enabled on this property.
// `scripts/security-headers.mjs` and `_headers` must carry the same hosts;
// `check:security-headers` keeps those two in step, and the site-consistency
// test checks every page's meta CSP against these lists.

export const GOOGLE_TAG_ID = "G-YF4LQ85VRE";
export const GOOGLE_TAG_LOADER_URL = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`;
export const GOOGLE_TAG_CONFIG_PATH = "assets/js/google-tag.js";

export const GOOGLE_TAG_CSP_HOSTS = Object.freeze({
  "script-src": ["https://www.googletagmanager.com"],
  "img-src": ["https://*.google-analytics.com", "https://www.googletagmanager.com"],
  "connect-src": [
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
  ],
});

export function googleTagMarkup(base) {
  return `<script async src="${GOOGLE_TAG_LOADER_URL}"></script><script src="${base}${GOOGLE_TAG_CONFIG_PATH}"></script>`;
}

// Adds the Google tag hosts to a CSP string, creating a directive when the
// policy lacks it (a missing `connect-src`/`img-src` would otherwise inherit
// `default-src 'self'` and block the hits). Idempotent.
export function withGoogleTagCsp(policy) {
  const trailingSemicolon = /;\s*$/.test(policy);
  const directives = policy
    .split(";")
    .map((directive) => directive.trim())
    .filter(Boolean)
    .map((directive) => {
      const [name, ...sources] = directive.split(/\s+/);
      return { name, sources };
    });

  for (const [name, hosts] of Object.entries(GOOGLE_TAG_CSP_HOSTS)) {
    let directive = directives.find((entry) => entry.name === name);
    if (!directive) {
      directive = { name, sources: ["'self'"] };
      directives.push(directive);
    }
    for (const host of hosts) {
      if (!directive.sources.includes(host)) directive.sources.push(host);
    }
  }

  const joined = directives.map(({ name, sources }) => [name, ...sources].join(" ")).join("; ");
  return trailingSemicolon ? `${joined};` : joined;
}

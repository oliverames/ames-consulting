// Google tag (gtag.js) configuration for Google Analytics 4.
//
// Loaded as a classic script right after Google's async loader on every
// page (see scripts/apply-shared-ui.mjs). It is a separate file rather than
// the inline snippet Google shows so the site's CSP keeps `script-src 'self'`
// without 'unsafe-inline'. The measurement ID must match GOOGLE_TAG_ID in
// scripts/google-tag.mjs.
window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-YF4LQ85VRE");

// Google tag (gtag.js) for Google Analytics 4.
//
// Injected as a classic script near the top of every <head> by
// scripts/apply-shared-ui.mjs. It is a separate file rather than Google's
// inline snippet so the CSP keeps `script-src 'self'` without 'unsafe-inline'.
//
// The hostname guard keeps local dev servers, Playwright runs, CI Lighthouse
// audits, and Cloudflare preview deployments out of the property: on any
// other host the loader is never fetched and no hit is sent. The measurement
// ID and host list must match scripts/google-tag.mjs.
(function () {
  var MEASUREMENT_ID = "G-YF4LQ85VRE";
  var PRODUCTION_HOSTS = ["ames.consulting", "www.ames.consulting"];
  if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  gtag("js", new Date());
  gtag("config", MEASUREMENT_ID);

  var loader = document.createElement("script");
  loader.async = true;
  loader.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(loader);
})();

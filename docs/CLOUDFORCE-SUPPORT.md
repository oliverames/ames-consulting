# CloudLink Support Redirects

As of October 13, 2026, [`_redirects`](../_redirects) sends `/cloudforce` and `/cloudforce/privacy` to [CloudLink support](https://cloudlink.games/support/) and [privacy](https://cloudlink.games/privacy/). Each route has a permanent redirect for its bare, trailing-slash and `index.html` forms. The app source is [oliverames/cloudlink](https://github.com/oliverames/cloudlink).

[`generate-cloudforce-pages.mjs`](../scripts/generate-cloudforce-pages.mjs) still creates `noindex` migration notices for source previews. Keep its original [legal-content snapshot](../assets/data/cloudforce-pages.json) unchanged as provenance; the old export instructions no longer describe current publishing. The [publication policy](../scripts/publication-policy.mjs) excludes those HTML files and the snapshot from the deployed artifact. [Support tests](../tests/cloudforce-support.spec.js) cover the redirects and exclusions.

The [September 28 instructions](history/2026-09-28%20CloudForce%20Support%20Instructions.md) are preserved verbatim as historical context. Verify live redirects separately when release evidence requires it; this source review does not establish public availability.

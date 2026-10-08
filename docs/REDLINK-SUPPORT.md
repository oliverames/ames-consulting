# RedLink support pages

RedLink support is published at `/redlink/`, and its privacy policy is at `/redlink/privacy/`. Oliver Ames maintains RedLink, and the confirmed support and privacy address is `oliver@ames.consulting`.

Edit the copy in `assets/data/redlink-pages.json`, then run the normal site build. The RedLink generator runs before the shared navigation and SEO passes. Do not edit generated HTML directly. The publication allowlist, HTML checks, automatic route accessibility checks and main deployment checks include both routes. The JSON is a build input and is not published as a runtime asset.

The policy describes the current app behavior: direct Toyota authentication, shared keychain and local storage, default Watch sync, 30/60/120-day trend retention applied on update, separate history clearing, and diagnostic logs shared at the user's choice. Support emails and shared logs are retained until Oliver deletes them or receives a deletion request. The policy distinguishes the app from the website's existing Google Analytics use.

Review the copy when the app's data handling or support practices change, and update its effective date. A privacy page does not determine App Store privacy questionnaire answers or establish Toyota permission or Apple review approval.

After the existing main deployment finishes, verify both exact HTTPS routes, their canonical URLs and the release marker before recording them in app release metadata.

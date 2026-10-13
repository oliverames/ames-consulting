# CloudForce support pages

The support page is `/cloudforce/`. The app privacy policy is `/cloudforce/privacy/`. These pages use the existing site typography, shared navigation, accessibility behavior, contact route, analytics settings, and publishing pipeline. Adding them does not advertise an App Store release or imply NVIDIA endorsement.

`assets/data/cloudforce-pages.json` is a build input exported from the CloudForce app repository. It contains escaped content and SHA-256 digests of `PRIVACY.md` and `distribution/app-store/support.md`. It is not included as a runtime asset. Keep policy wording in the app repository and export a new snapshot after changes:

```sh
python3 scripts/release/prepare-app-store.py --export-website-content /path/to/ames-consulting/assets/data/cloudforce-pages.json
python3 scripts/release/prepare-app-store.py --check-website-content /path/to/ames-consulting/assets/data/cloudforce-pages.json
```

Run those commands from the CloudForce repository. The site's `generate-cloudforce-pages.mjs` creates the two HTML pages before the existing shared-UI and SEO passes. Do not hand-edit their generated HTML. The standard publication allowlist includes both routes and the standard release checks include their HTML. The privacy page distinguishes the app policy from the website's existing Google Analytics behavior.

After the existing main-branch deployment finishes, verify both exact HTTPS routes and their canonical URLs. Then record those live URLs in the App Store release evidence. A successful local build does not establish public availability.

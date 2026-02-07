# V1 Feature Charter

This charter defines the first implementation-complete feature set for `ames.consulting` without requiring visual design decisions.

## Summary

- Canonical model: all content is `Post`.
- Canonical source: Micro.blog JSON feed.
- Curation layer: local metadata controls prominence/order/grouping only.
- Views: Home, Blog, Portfolio, Contact.
- Core non-negotiables: reliability, readability, SEO integrity, accessibility, low-maintenance publishing.

## Public Interfaces

## URL Contract

- `/` home preview stream.
- `/blog/` full stream.
- `/portfolio/` default filter for `portfolio` tag.
- `/contact/` contact form and static contact channels.

Query parameters (shared contract):

- `q` free-text search.
- `tag` lowercase tag filter.
- `type` reserved for post-type filtering.
- `year` reserved for archive filtering.
- `series` reserved for collection filtering.

Canonical and indexing rules:

- Canonical route for portfolio is `/portfolio/`.
- Search pages (`?q=`) are `noindex,follow`.
- Non-canonical filtered blog tags are `noindex,follow`.

## Config Contract (`assets/data/site.config.json`)

```json
{
  "provider": "microblog | local",
  "jsonFeedUrl": "string",
  "siteTitle": "string",
  "siteUrl": "string",
  "siteDescription": "string",
  "authorName": "string",
  "locale": "en_US",
  "twitterHandle": "string",
  "defaultSocialImage": "url",
  "contactFormEndpoint": "url",
  "contactFormSuccessMessage": "string",
  "portfolioTag": "string",
  "homePreviewLimit": "number"
}
```

## Post Schema (runtime)

```json
{
  "id": "string",
  "title": "string",
  "summary": "string",
  "contentHtml": "string",
  "url": "string",
  "publishedAt": "ISO-8601 string",
  "tags": ["string"],
  "readTimeMinutes": "number",
  "imageUrl": "string",
  "source": "microblog | local"
}
```

## Feature Set

1. Curation manifest support
- Local metadata file controls featured ordering and pinned slices.
- Does not duplicate post body content.

2. Tag governance
- Enforced lowercase tags.
- Alias map for normalization.
- Invalid tag detection in data checks.

3. Unified query + filters
- Route-independent filter behavior for `q` and `tag`.
- URL reflects filter state for shareability.

4. Read-time estimation
- Derived from content text when missing.
- Displayed in cards and preview dialogs.

5. Image viewer and asset deterrence
- Click-to-zoom dialog for content images.
- Right-click/drag/save shortcuts deterred on protected assets.
- Documented as best-effort only.

6. SEO runtime sync
- Dynamic title/meta/OG/Twitter updates per route/filter.
- Canonical URL and robots logic per state.
- Structured data graph generation.

7. SEO artifact generation
- Deploy-time generation of `robots.txt` and `sitemap.xml`.
- Inclusion of core routes and local known post URLs.

8. Contact form plumbing
- Endpoint-backed submission with configurable URL.
- Honeypot + timing trap + local attempt throttling.
- Graceful message when endpoint not configured.

9. Source resilience
- Fetch timeout and retry strategy.
- Feed-shape validation and malformed item filtering.
- Local fallback path when feed is unavailable.

10. Regression and a11y tests
- Navigation, filtering, preview, image viewer, contact flow.
- Axe critical-issue smoke checks on core routes.

11. Performance budgets
- Lighthouse CI thresholds for key routes.
- Build fails on major regression.

12. Release hygiene baseline
- PR template and semantic title enforcement.
- Changelog discipline and release checklist.

## Failure Modes and Handling

- Remote feed unavailable: local fallback source and status text show fallback provider.
- Invalid feed items: ignore malformed entries, render valid subset.
- Contact endpoint unset: show non-blocking configuration message.
- Form abuse: honeypot/timing/rate throttle mitigate automated spam bursts.

## Acceptance Criteria

- Core routes return `200` and render without JavaScript errors.
- `q` and `tag` filters update both UI and URL state.
- Cards and dialog display read-time metadata.
- Clicking a content image opens the viewer dialog.
- SEO metadata/JSON-LD present and valid on all routes.
- `robots.txt` and `sitemap.xml` generated on deploy artifact.
- CI quality, e2e, a11y, and performance checks pass.

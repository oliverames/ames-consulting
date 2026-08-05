# Content Model

There is no runtime `Post` schema and no source-adapter layer — that JSON-feed
architecture was removed. Content lives in per-area JSON files under
`assets/data/`, each consumed by exactly one build-time generator to produce
committed HTML. See `docs/ARCHITECTURE.md` for the build chain.

## Data Files

| File | Consumed by | Produces |
|---|---|---|
| `writing-feed.json` | `generate-writing-pages.mjs` | `/blog/` index, `/blog/archive/`, per-post pages |
| `eastrise-photography.json` | `generate-career-work-pages.mjs` | Photography series cards on `/work/` and `/work/eastrise-photography/` |
| `eastrise-social.json` | `generate-career-work-pages.mjs` | `/work/eastrise-social/` |
| `event-galleries.json` | `generate-event-galleries.mjs` | Per-event gallery pages under `/work/` |
| `portraits.json` | `generate-portrait-gallery.mjs` | Portrait gallery pages |
| `media-provenance.json` | `generate-media-provenance.mjs` | Per-page `.asset-provenance` disclosure lists |
| `site.config.json` | `assets/js/site-config.js` | Contact-form endpoint and success message (the only remaining runtime config fetch) |

## Publication boundary

Every file under a deployed asset path is public, even when no page links to
it. Content without publication clearance stays outside the repository and the
generated site. A `noindex` directive can keep a page out of search results,
but it does not restrict direct access.

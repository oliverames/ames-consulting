# Content Model

There is no runtime `Post` schema and no source-adapter layer. That JSON-feed
architecture was removed. Content lives in per-area JSON files under
`assets/data/`. Some are source data, while others are generated manifests that
feed later build stages. See `docs/ARCHITECTURE.md` for the build chain.

## Data Files

| File | Role | Producers and consumers |
|---|---|---|
| `writing-feed.json` | Writing source | Refreshed by `refresh-writing-content.mjs`; read by `generate-writing-pages.mjs` for the blog index, archive, and post pages |
| `eastrise-photography.json` | Photography source | Read by `generate-career-work-pages.mjs`, `generate-event-galleries.mjs`, and `generate-media-provenance.mjs` |
| `eastrise-social.json` | Social source | Read by `generate-career-work-pages.mjs` and `generate-media-provenance.mjs` |
| `event-gallery-alt-text/*.json` | Event-gallery source | Read by `generate-event-galleries.mjs` for file-specific image descriptions |
| `event-galleries.json` | Generated event manifest | Read and rewritten by `generate-event-galleries.mjs`; checked by the event and source validators |
| `portraits.json` | Generated portrait manifest | Read and rewritten by `generate-portrait-gallery.mjs`; also read by the media-provenance generator and validators |
| `media-provenance-evidence.json` | Provenance source | Read by `generate-media-provenance.mjs` for verified dates and public-source corrections |
| `media-provenance-exceptions.json` | Provenance source | Read by `generate-media-provenance.mjs` for accepted omissions and public notes |
| `source-screenshot-manifest.json` | Private-capture status source | Written by `sync-source-screenshots.mjs`; read by the media-provenance generator and validator; excluded from `_site/` |
| `media-provenance.json` | Generated provenance manifest | Written by `generate-media-provenance.mjs`; read by `apply-shared-ui.mjs` for page disclosures |
| `media-provenance-missing.json` | Generated audit report | Written by `generate-media-provenance.mjs`; read by the provenance validator; excluded from `_site/` |
| `site.config.json` | Public runtime config | Read by `assets/js/site-config.js` for the contact endpoint and success message |

## Media provenance

`media-provenance.json` and `media-provenance-missing.json` are generated files.
Do not edit them by hand. Put verified corrections in
`media-provenance-evidence.json`. Its evidence values have these meanings:

- `private_archive_capture`: The exact date or source appears in a private archive capture kept outside the repository.
- `repository_archive_note`: A checked-in source record states the exact date.
- `public_platform_metadata`: The public platform returned the exact date for the retained source URL.
- `public_source_url_timestamp`: A LinkedIn activity URL encodes the exact publication timestamp.

An incomplete provenance record is valid only when
`media-provenance-exceptions.json` names the asset, gives a reason and note, and
lists the exact omitted fields. The validator rejects unclassified omissions,
stale exceptions, duplicate classifications, and missing-field drift.

| Accepted reason | Exact omitted fields |
|---|---|
| `publication_date_not_verifiable` | `published_date` |
| `public_source_page_not_identified` | `source_url`, `published_date`, `source_capture` |
| `personal_archive_source_not_identified` | `source_url`, `source_channel`, `published_date`, `source_capture` |
| `source_capture_not_available` | `source_capture` |
| `collection_asset_without_single_source` | `source_url`, `published_date`, `source_capture` |

When no source record already supplies an honest `archive_note`, an exception
that affects public wording also requires `public_note`. The note must describe
the retained evidence without implying an unverified source, date, ownership
claim, or permission record.

## Publication boundary

Every file under a deployed asset path is public, even when no page links to
it. Content without publication clearance stays outside the repository and the
generated site. A `noindex` directive can keep a page out of search results,
but it does not restrict direct access.

Source captures can contain account chrome, notifications, and third-party
names. `sync-source-screenshots.mjs` stores them only in the private portfolio
archive. The checked-in manifest records `source_capture: "private_archive"`
and never contains a capture path or a copy of the image. Set
`AMES_EASTRISE_SOURCE_RECORDS_ROOT` when the private records live outside the
default archive layout.

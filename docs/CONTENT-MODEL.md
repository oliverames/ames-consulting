# Content Model

## Canonical `Post` Schema

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

## Notes

- `id` should be stable across renders and routes.
- `tags` are lowercase for deterministic filtering.
- `summary` may be source-provided or generated from stripped HTML.
- `readTimeMinutes` is derived from content when missing.
- `source` is metadata for diagnostics and future multi-source support.

## Filter Semantics

- Search checks `title`, `summary`, and `tags`.
- Tag filter is exact match after lowercase normalization.
- Home view applies `homePreviewLimit` after filtering.

# Photography Images

Thumbnails for the photography section of ames.consulting. These appear in the homepage preview strip and on individual gallery pages.

## Requirements

- **Dimensions**: 800x600 or similar landscape aspect ratio
- **Format**: JPEG (`.jpg`) or WebP (`.webp`)
- **Naming**: `photo-1.jpg` through `photo-4.jpg` for the homepage strip; gallery-specific images use either `photo-N.jpg` (generic) or a short prefix like `beta-NN.webp`
- **Cropping**: CSS uses `object-fit: cover` to crop to a consistent height, so keep subjects centered

## Generating galleries

Gallery pages are generated from `photography.json` data:

```bash
npm run generate:photography
```

See `scripts/generate-photography-galleries.mjs` for details.

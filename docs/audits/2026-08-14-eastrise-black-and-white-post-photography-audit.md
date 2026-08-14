# EastRise black-and-white post photography audit

Date: 2026-08-14

## Scope

This audit traces the individual media behind the 29 EastRise social-post screenshots previously classified as predominantly black-and-white. It checks whether each eligible photograph appears as an individual asset in the EastRise photography portfolio, separate from the full-post screenshot archive.

The protected post set contains 19 Facebook posts, four Instagram posts, and six LinkedIn posts. Full-post screenshots remain in `eastrise-social.json`; this audit concerns the original media shown inside those posts.

## Method

1. Resolve each post to its organized local archive by its public source URL.
2. Collapse repeated downloads inside a post by image identity, not file count.
3. Collapse Facebook, Instagram, and LinkedIn cross-posts when they show the same photograph.
4. Match each distinct photograph against the assets in `eastrise-photography.json` using source hashes and pixel comparisons.
5. Add a new portfolio asset only when no equivalent photograph already exists.
6. Record every post-to-photo association in `eastrise-social-photography.json` and validate it against the social, photography, and provenance manifests.

## Editorial exclusion

`facebook-040` contains a cartoon credited by EastRise to Nathan W. Pyle. It remains in the social-post archive, but it is excluded from Oliver Ames's photography portfolio as third-party artwork.

## Results

The review set contains 28 photographic posts and one artwork post. The 28 photographic posts contain 165 photo placements after repeated downloads are removed within each post. Cross-post deduplication reduces those placements to 126 distinct portfolio assets.

Before this work, 89 of the 126 distinct photographs already appeared in the EastRise photography archive. The remaining 37 photographs now have individual portfolio assets and listings. The archive therefore increased from 136 images across 13 series to 173 images across 16 series.

The durable post-to-photo cross-reference is `assets/data/eastrise-social-photography.json`. It records all 29 reviewed posts, every photograph represented by each eligible post, the 37 newly imported assets, and the artwork exclusion.

## Added collections

| Collection | Added photographs |
|---|---:|
| Smokin’ Somethin’ BBQ | 1 |
| UVM Men’s Soccer, 2025 | 5 |
| Wheels for Warmth, 2025 | 16 |

## Expanded collections

| Collection | Added photographs |
|---|---:|
| Taylor Hoar Racing | 3 |
| VeggieVanGo with Taylor Hoar | 2 |
| EastRise Launch | 9 |
| VeggieVanGo with EastRise | 1 |

## Provenance and authorship review

All 37 imported assets have complete public-source provenance. Each record includes the public post URL, source platform, publication date, archive retrieval date, and retained private source capture. None requires a missing-provenance exception.

Independent archive evidence corroborates Oliver Ames's authorship for 26 of the 37 imported photographs. Eleven assets appear in retained EastRise post captures, but the private photography manifest does not contain an authorship record or an approved same-image match. Oliver explicitly directed their portfolio inclusion on 2026-08-14, so they are listed and separately flagged as pending independent authorship evidence:

- Eight Wheels for Warmth donation-day photographs from `linkedin-083`.
- One VeggieVanGo distribution photograph from `facebook-019`.
- Two EastRise Launch portraits from `facebook-021`, at source positions 7 and 8.

The machine-readable review preserves those 11 asset paths under `newlyImportedAuthorshipReview.pendingIndependentEvidenceAssets`. This distinction prevents complete source provenance from being mistaken for independent authorship confirmation.

## Verification

Verification completed on 2026-08-14:

- `npm run check:all` passed every source validator and reported 173 public photographs across 16 EastRise series.
- `npm run check:built-site` passed for 50 published HTML files, 1,203 responsive image uses, and 391.3 MiB of artifact data.
- `npm run test:e2e` passed all 159 source-browser tests.
- `npm run test:site` passed all 159 deploy-artifact browser tests.
- `npm run check:build-idempotence` passed with artifact hash `d74f45e405ca24446993b41a06ed5c704f2f88f78ba7cc3b0ee75c3f859e774f` and source hash `b024633f3a50f3e10634105cf98a1aaf2bbac45c9596ad95ca11e9e6752d23b8`.
- A cold desktop load of `/work/` transferred 486,305 bytes after card-image optimization, 13,695 bytes below the 500,000-byte Lighthouse budget. The new UVM card now requests a 43,996-byte 512-pixel preview instead of the 86,528-byte original.
- Desktop and mobile review at 1,440 and 390 CSS pixels confirmed 16 galleries, 173 images, no horizontal overflow, and a working lightbox for a newly added photograph.
- The Taylor Hoar disclosure now counts five distinct photographs in the `DJJ9BxStqip` post while retaining two lower-resolution derivatives as explicit duplicate-media records.

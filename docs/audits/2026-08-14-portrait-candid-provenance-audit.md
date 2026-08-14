# Portrait and candid provenance audit

Date: August 14, 2026

## Result

All 707 public portrait and candid assets now have exact entries in `assets/data/media-provenance.json`.

Before this audit, 203 had records and 504 did not. The provenance generator now also records the non-person detail frames and graphics that sit inside the same galleries. The validator therefore checks 749 exact assets, which consists of the 707 person-centered assets and 42 adjacent collection assets.

| Public asset group | Audited portraits and candids | Before | After |
|---|---:|---:|---:|
| EastRise formal portraits | 42 | 42 | 42 |
| EastRise people photography | 124 | 124 | 124 |
| NEG-ECP people photography | 34 | 34 | 34 |
| Person-centered campaign stills | 3 | 3 | 3 |
| Giron family sessions | 385 | 0 | 385 |
| Vermont Foodbank | 31 | 0 | 31 |
| GMCF assignments and cards | 44 | 0 | 44 |
| About and testimonial portraits | 13 | 0 | 13 |
| Other portfolio cards and community candids | 4 | 0 | 4 |
| Writing-feed photographs | 27 | 0 | 27 |
| **Total** | **707** | **203** | **707** |

## Flagged evidence gaps

No published portrait or candid lacks a record. These records still carry explicit accepted exceptions:

- 474 portfolio photographs lack a retained public source page, publication date, and source capture. This group contains 386 Giron session images, 38 Vermont Foodbank images, 48 GMCF gallery or card images, and two EastRise community photographs. Each record retains its collection, known assignment context, import date, credit, and public archive note.
- 44 writing images retain their public post URL, platform, publication date, import date, and publisher context, but the repository does not contain a source-page capture.
- 12 testimonial portraits retain the subject's public LinkedIn profile and import date. Their image publication dates, original photographers, and source captures are unavailable. The credit field states that these are public profile images and does not present them as Oliver Ames's photography.
- The Ames Consulting profile portrait retains an exact record, but its original photographer, source file, publication date, and source capture are not recorded.
- 47 portrait assets have a public source and retained capture but no verifiable image publication date. This count includes 40 EastRise formal portraits, six Blue Cross portraits, and the separate Amy Vaughan homepage derivative.
- Four Taylor Hoar photographs retain the April 16, 2025 native session evidence, but their exact public post, channel, publication date, and source capture are unavailable.
- The 35-image NEG-ECP gallery retains commissioned-work provenance and portfolio-rights wording, but it does not have a public client source page or source capture.
- The Will barbecue still has a verified YouTube source and publication date but no retained source capture.

## Withheld EastRise photographs

Five confirmed Oliver Ames photographs remain intentionally unpublished and therefore do not have public asset keys in the provenance map:

- Four Instagram photographs from the September 30, 2024 EastRise member and business story collection.
- `li_3f3606b341d7.jpg`, a black-and-white portrait intended for the LinkedIn published-photography collection.

Their authorship and intended collections remain documented in `assets/data/eastrise-photography.json`. The black-and-white portrait still lacks both a source URL and a retained source capture. These are withheld-source records, not missing provenance for a published asset.

## Durable checks

`scripts/validate-media-provenance.mjs` now fails when any asset in the following public sets lacks an exact record:

- Every EastRise photography and formal portrait manifest asset.
- The NEG-ECP, Giron family, and Vermont Foodbank galleries.
- Both GMCF galleries and their three card derivatives.
- The Ames Consulting profile portrait and every testimonial portrait.
- The Amy Vaughan homepage derivative, EastRise community candids, Wheels for Warmth card, and person-centered campaign stills.
- Every local image referenced by the writing feed.

Accepted exceptions can use an explicit asset list or a constrained `assets/images/` prefix. The validator expands each prefix against the generated provenance map, rejects empty prefixes, rejects duplicate classifications, and still requires every matched asset's missing fields to match its declared exception exactly.

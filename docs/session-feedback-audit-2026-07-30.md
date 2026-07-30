# Website feedback acceptance audit

This document records the website and Portfolio-folder feedback supplied during the long browser-annotation session. It is grouped by area so that a future change can be checked against the original intent without rereading the chat.

## Verified sitewide behavior

- The live domain is password gated in a fresh cookie-free browser context. The construction password remains `cows`.
- Copying, dragging, context-menu downloading, and direct image interaction are discouraged by the shared content-protection layer. Browser-level capture cannot be made impossible on a public website.
- The image viewer keeps single images within the viewport and preserves next, previous, close, keyboard, and caption behavior.
- The header keeps Home, Work, Writing, About, Testimonials, and Contact visible on the Testimonials route.
- Section headings use the compact uppercase heading treatment established by What I Do.
- The footer uses Work by organization and Company groups, icon links without circles, filtered organization links, a readable project button, and the shared dark-footer treatment.
- Contact uses radio choices instead of the select control associated with the app crash, omits the spam-protection sentence, aligns fields, and keeps the sticky Good fit card clear of the header.
- Desktop and narrow mobile routes have automated horizontal-overflow and accessibility coverage.

## Home

- Photography is presented as the primary discipline, with video as a supporting capability.
- The unwanted Primary service label and leads the work wording are absent.
- Practical technology names Square POS, UniFi networks, websites, apps, and practical AI integration.
- The site name is larger, the hero divider is balanced, the proof area is tighter, and the hero mesh animates when reduced motion is not requested.
- The portrait is not clickable, has a less aggressive mobile crop, and uses darker tonal treatment.
- Testimonials align to the same content width as What I Do, use the standardized Testimonials heading, and link Yvonne Garand's portrait and name to LinkedIn.
- Recent Projects contains campaign and photography work only.
- Software projects appear in their own dark product-interface section.
- A second testimonial separates Recent Projects and Software development.
- Recent project cards are larger and keep a soft clipped edge on horizontal overflow.

## Work index and organization

- Projects are the primary information architecture and are sorted newest first.
- Employer/client filters are available at the top of the work list and footer organization links open the matching filtered view.
- Software development remains its own visually distinct section and is excluded from photography behavior.
- Legacy career work is separated under Legacy work.
- EastRise, Blue Cross Vermont, BETA Technologies, Vermont Foodbank, Green Mountain Community Fitness, commissioned work, and older employment are credited on individual cards.
- The in-house framing line explains that EastRise and Blue Cross work was made as an employee, alongside commissions.
- EastRise and Blue Cross cards carry explicit role credits and in-house descriptions.
- VSECU and EastRise websites have separate detail pages.
- Taylor Hoar Racing is represented as one project with the selected race-suit portrait as its feature image.
- Selected feature images are used for Girls on the Run, Corporate Cup, EastRise Portraits, member banking stories, Sweat-Heart Throwdown, Vermont Foodbank Volunteer Day, Andrew at BETA, Emma at BETA, and Ethan at BETA.
- Card crops use project-specific focal positioning where necessary.

## Gallery card pointer scrub

- Photography, campaign, portrait, event, and gallery-preview cards load the linked page's gallery when the pointer enters the card image.
- Only horizontal pointer travel changes the preview.
- Every 48 pixels of horizontal travel advances one frame, so a 185-image gallery and a 9-image gallery move at the same perceived speed.
- Frame selection wraps in either direction.
- Leaving the image restores the pinned card image.
- Touch input and reduced-motion users do not receive the behavior.
- Software cards are explicitly excluded.

## Galleries and detail pages

- Gallery layouts use dense aspect-ratio-aware collage placement without fixed-height empty gaps.
- Portrait pages show standardized whole-person or portrait-oriented crops instead of landscape card crops.
- The viewer has redesigned icon controls, viewport-bounded media, captions, names, roles where available, and image counts.
- EastRise portraits omit Samantha Waters, Pamela Wooster, Marty DiVenuti, Mike Bouffard, Lori Grego, Kelley Colby, Jim Oberg, and Frank G. Harris.
- EastRise portraits feature Amanda Seeholzer, Christin Canter, Ian Squirrell, Jim Towne, Kathleen S. Emery Ginn, Margaret H. O'Donnell, Penny Overton, Rob, Shauna Allen, Valerie, and Yvonne Garand.
- Portrait copy no longer claims controlled lighting.
- Blue Cross portraits use the executive team and Lindsay Segale, with seven edited selections validated against the Portfolio source.
- EastRise Photography is split into named projects and series rather than one umbrella card.
- Separate groupings exist for Taylor Hoar, Shred Fest, Wood for Good, VeggieVanGo, Winooski development, member stories, launch material, staff at work, counseling, and portraits.
- Public-source images identified as not Oliver's are excluded from Oliver-authored photography galleries.
- EastRise social is labeled Social highlights, uses post-only captures, omits archive-process copy that should not be public, and avoids platform chrome where post-only evidence exists.
- BETA photography galleries remain in source but are commented out and not rendered pending written permission. The Flight Paths video remains public.
- Event galleries validate 378 photographs across eight events.
- Blue Cross validation confirms 194 event photographs and seven portraits against edited Portfolio selects.

## Provenance and source records

- Public-source assets use structured metadata with `source_url`, `source_channel`, `published_date`, `downloaded_date`, `credit`, and `source_screenshot`.
- Campaign pages automatically render one plain-text disclosure line per tracked image.
- Source screenshots are stored under `Portfolio/EastRise Public Library/Source Records` and copied into durable site assets.
- The provenance validator currently recognizes 208 records, with 103 records containing every field value.
- Missing real values remain empty rather than being replaced with invented placeholders.
- The Portfolio folder is organized by business/client and then project. The site remains project-first with organization as a filter.

## Project-specific editorial decisions

- Live Broadcasts avoids The work terminology, removes the private-source sentence, and uses tightened section spacing.
- Credit Union Websites front-loads the visual examples, keeps the metric band, separates VSECU and EastRise, and moves the Brad Meerholz testimonial higher.
- Member Banking Stories credits co-production, talent selection, location coordination, production support, photography, and distribution work.
- Giron Family, Flight Paths, and similar pages use tighter editorial pacing around galleries and embeds.
- Wheels for Warmth and the major EastRise photography series use the complete available edited sets rather than token samples.
- Community Photography is replaced by individual event/project groupings on project-first surfaces.

## Writing, About, Testimonials, and Contact

- The Writing index uses a wider layout and an on-site article card for the Sunshine Trail post.
- The Sunshine Trail article includes its publication date and dedicated article-card treatment.
- EastRise Writing retains 53 attributed articles and local archive data, with resilient links and metadata.
- About uses the wider, less-cropped portrait and keeps the hero headline inside its card at narrow sizes.
- About previews two testimonials and links to the complete Testimonials archive instead of showing the entire collection.
- The Testimonials archive contains 13 LinkedIn recommendations and four positive performance-review excerpts.
- Testimonial cards and archive entries support LinkedIn profile links when a verified profile URL is present.
- Contact keeps the approved Good fit bento card, sticky behavior, header offset, and equal-height field controls.

## Source-dependent items intentionally left incomplete

These are not filled with guesses. They require a real source value or explicit copy approval.

- LinkedIn-only Recent social posts needs an authenticated or exported personal LinkedIn post source. The current local writing feed contains Micro.blog, Threads, Mastodon, Bluesky, and Instagram data, but no verified personal LinkedIn post feed.
- Simeon Chapin and Abigail Stevenson still use initials because a reusable, permission-safe local headshot file was not present in the supplied Portfolio folders.
- Provenance rows without a public source URL, publication date, or source screenshot remain blank by design and are listed by the provenance data reports.
- A natural full-site German edition needs an approved German copy corpus. A machine-only substitution layer would conflict with the requirement that it not read like an automated translation.

## Automated acceptance evidence

- `npm run check:all` validates syntax, lint, HTML, structured data, image loading, EastRise photography, EastRise social, portraits, event galleries, Blue Cross edited sources, and media provenance.
- Playwright covers 46 accessibility routes, the password gate, content and gallery behavior, mobile overflow, project organization, featured assets, provenance disclosures, and the gallery-card pointer scrub.
- The new pointer-scrub tests confirm restoration of the pinned image and exclusion of software cards.

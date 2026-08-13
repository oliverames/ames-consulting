# Site refinement register

Date: August 13, 2026

## Scope and status

This register tracks the 68 browser comments supplied during the refinement pass and three later LinkedIn follow-ups. Each item stays open until its canonical source is changed, the deploy artifact is rebuilt, and a focused browser or content check passes.

Status values:

- **Complete** means the canonical source, generated page, and focused acceptance check all pass.
- **Refresh complete; schedule decision pending** means current LinkedIn discovery works during a writing refresh, but no recurring external-service schedule has been authorized.

Broad requests such as “needs refinement” remain separate from precise defects. They receive a page-level visual review, but they do not authorize unrelated copy or structural changes.

## Homepage

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| HOME-01 | Remove the previous and next result controls. | Complete | No proof controls or proof-rotator script ship. |
| HOME-02 | Remove the underline from Yvonne's recommendation source link. | Complete | The source link has no underline in default or hover states. |
| HOME-03 | Remove the underline from Brad's recommendation source link. | Complete | The source link has no underline in default or hover states. |
| HOME-04 | Remove the underline from Brad's name. | Complete | The linked name has no underline in default or hover states. |
| HOME-05 | Remove the underline from the testimonials call to action. | Complete | The call to action has no underline in default or hover states. |
| HOME-06 | Do not feature Apple Core on the homepage. | Complete | The homepage omits Apple Core while its public project page remains available. |
| HOME-07 | Do not feature Bridgeport on the homepage. | Complete | The homepage omits Bridgeport while its public project page remains available. |
| HOME-08 | Use a screenshot that matches Ping Warden. | Complete | Ping Warden uses its real dashboard image, and Skylight Bridge retains its own image. |
| HOME-09 | Align software preview and description boundaries. | Complete | All homepage software bodies start at the same vertical position at desktop and mobile widths. |
| HOME-10 | Fix the Micro.blog and Mastodon collision. | Complete | Social links do not overlap at supported widths. |
| HOME-11 | Make the social profiles one long list. | Complete | The footer Social column renders as one ordered column. |
| HOME-12 | Start the footer description with “My name is Oliver.” | Complete | Every public page uses the canonical revised colophon. |
| HOME-13 | Prevent a Safari scrollbar on the recent-project strip. | Complete | The strip remains horizontally scrollable without a visible Firefox or WebKit scrollbar. |
| HOME-14 | Animate the orange and pink hues inside the hero. | Complete | The mesh moves subtly, respects reduced-motion preferences, and stays inside the hero. |
| HOME-15 | Reduce the gap between the hero headline area and introduction. | Complete | The desktop gap is visibly smaller without crowding either block. |
| HOME-16 | Make recent-project cards taller. | Complete | Cards gain vertical image presence and remain aligned at desktop and mobile widths. |

## Contact

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| CONTACT-01 | Remove the Turnstile and Resend explanatory paragraph. | Complete | The paragraph is absent, while accessible validation and privacy behavior remain intact. |
| CONTACT-02 | Refine the formatting inside the contact hero. | Complete | Eyebrow, headline, description, and email form a compact, coherent block. |
| CONTACT-03 | Reduce the contact hero's vertical height. | Complete | The hero fits its content without the large empty upper and lower areas. |

## Work index and shared project organization

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| WORK-01 | Show a Flight Paths video clip instead of the “Video” placeholder. | Complete | The card uses the verified poster from the published video. |
| WORK-02 | Move the EastRise Social and member-story film cards lower in the index. | Complete | The cards appear after the primary chronological projects without falsifying their dates. |
| WORK-03 | Move Live Broadcasts lower in the index. | Complete | The card appears with the lower archive-style projects. |
| WORK-04 | Combine the Giron family portrait projects into one gallery organized by shoot. | Complete | One `/work/giron-family/` project contains the 2023, 2024, and 2025 shoots in chronological order, with redirects from the old routes. |
| WORK-05 | Replace the launch-campaign racing image. | Complete | The launch-campaign card uses a cleared cinema-camera frame from that campaign. |
| WORK-06 | Stop cropping the VSECU website screenshot. | Complete | The complete screenshot fits inside its card without clipping. |
| WORK-07 | Stop cropping the EastRise website screenshot. | Complete | The complete screenshot fits inside its card without clipping. |
| NEG-01 | Make the selected delegate photograph the NEG-ECP featured image. | Complete | `dsc00383.webp` leads the project, work-index card, homepage card, and SEO preview. |

## Taylor Hoar Racing

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| TAYLOR-01 | Remove the strange blank cell in the statistics grid. | Complete | The metric layout has no empty colored cell. |
| TAYLOR-02 | Remove the selected Race Week graphic. | Complete | The image is absent from the Taylor gallery while its source archive remains intact. |
| TAYLOR-03 | Move the VeggieVanGo section to the Veggie Van Go project. | Complete | The images and context appear only in the EastRise photography archive's VeggieVanGo section. |
| TAYLOR-04 | Condense source entries that came from the same post. | Complete | Canonical Instagram shortcodes produce one concise source entry with the combined image count. |
| TAYLOR-05 | Order racing and portrait photographs from newest to oldest. | Complete | The gallery starts with the newest verified publication or capture date and ends with the oldest. |
| TAYLOR-06 | Combine “Coverage throughout the season” and “The Milk Bowl.” | Complete | One section contains both related passages without a duplicate divider. |
| TAYLOR-07 | Verify whether the displayed statistics belong to the October campaign. | Complete | The authoritative report identifies the four displayed statistics as February through October 2025, and the labels say so. |

## Member stories and social archives

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| MEMBER-01 | Use real YouTube embeds and real thumbnails for every video. | Complete | Each video uses its real YouTube ID, archived thumbnail, title, and privacy-conscious embed. |
| MEMBER-02 | Remove the grill photograph from the body and make it the featured image. | Complete | The image leads the project and no longer repeats in the body. |
| SOCIAL-01 | Add the many missing EastRise post screenshots without changing the liked gallery layout. | Complete | All 51 cleared source screenshots appear once in the existing masonry-style viewer, including the corrected EastRise capture for LinkedIn post 080. |

## Case-study composition

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| CASE-01 | Combine the Sweat-Heart “assignment” and “photographs” blocks. | Complete | One compact narrative block replaces the two adjacent fragments. |
| CASE-02 | Move that combined narrative into the introductory area. | Complete | Context sits with the project introduction before the gallery. |
| CASE-03 | Leave only one divider before the complete gallery. | Complete | One visual separator appears between the introduction and gallery. |

The CASE items also define a shared review rule: combine short adjacent blocks only when they cover the same topic. The broader review retained separate blocks on other case studies when they describe distinct work.

## Service detail pages

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| SERVICE-01 | Refine the Photography and Video page. | Complete | Related story steps and the FAQ use tighter spacing than major page sections. |
| SERVICE-02 | Apply similar refinement to Practical Technology. | Complete | The page follows the same spacing and composition standard. |
| SERVICE-03 | Include software projects in the Practical Technology proof count. | Complete | The proof number and label count all qualifying public website and software projects. |
| SERVICE-04 | Apply similar refinement to Strategy and Content. | Complete | The page follows the same spacing and composition standard. |

## Blog and social-post presentation

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| BLOG-01 | Remove the underline from “Read on ames.consulting.” | Complete | The link has no underline in default or hover states. |
| BLOG-02 | Remove the underline from “Browse every Micro.blog post.” | Complete | The link has no underline in default or hover states. |
| BLOG-03 | Remove the underline from “View on Micro.blog.” | Complete | The link has no underline in default or hover states. |
| BLOG-04 | Remove the large gap above the Micro.blog feed. | Complete | The social links and feed label use normal section spacing. |
| BLOG-05 | Remove the underline from the introductory Micro.blog link. | Complete | The inline link has no underline in default or hover states. |
| BLOG-06 | Present post media in a compact gallery like the EastRise social page. | Complete | Large media no longer dominates the index, and selecting an item opens the full viewer. |
| BLOG-07 | Restore missing photographs from the selected Blue Cross shared post. | Complete | The shared post includes all nine cleared photographs from source activity `7460834826116538368`. |
| BLOG-08 | Restore the missing video from the selected shared post. | Complete | The BETA shared post uses verified YouTube video `4r5N5DjmSCU` and its retained poster. |
| BLOG-09 | Restore missing media from the selected EastRise shared post. | Complete | The EastRise shared post uses verified YouTube video `fAF3x-Iu2Bo` and its retained poster. |
| BLOG-10 | Restore missing media from the second selected Blue Cross shared post. | Complete | The shared post includes all ten cleared photographs from source activity `7455324792846725120`. |
| BLOG-11 | Make LinkedIn post photographs behave like a LinkedIn carousel. | Complete | Media scrolls horizontally with snap points, previous and next controls, a live item count, and click-to-open full images. |
| BLOG-12 | Add the missing August 12 NEG-ECP LinkedIn post. | Complete | Activity `7493102298634776576` appears with all 12 photographs in source order. |
| BLOG-13 | Replace the fixed LinkedIn seed with a current feed refresh. | Refresh complete; schedule decision pending | The writing refresh discovers and normalizes current public posts through the configured SocialCrawl connector while preserving editorial media and alt text. |

## About

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| ABOUT-01 | Remove the email underline. | Complete | The email has no underline in default or hover states. |
| ABOUT-02 | Add a small amount of space below the short-version heading. | Complete | The heading and body no longer touch at the line break. |
| ABOUT-03 | Broaden the testimonial heading beyond EastRise. | Complete | The heading accurately describes the represented organizations. |
| ABOUT-04 | Extend the short biography, using verified LinkedIn material if useful. | Complete | The card better fills its column and includes only verified facts in Oliver's voice. |
| ABOUT-05 | Show the LinkedIn logo without an underline or button shape. | Complete | A visible icon and plain text link render without a pill or underline. |
| ABOUT-06 | Change the Flight Paths role date to 2025–2026. | Complete | The experience entry shows the corrected range. |
| ABOUT-07 | Put Blue Cross Vermont first as the most recent role. | Complete | Experience entries use reverse chronological order. |
| ABOUT-08 | Check the toolkit for missing relevant tools. | Complete | The list reflects verified current skills and avoids unsupported additions. |

## Testimonials

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| TESTIMONIAL-01 | Open the full recommendation in an on-site dialog instead of navigating to Randy Repass. | Complete | Every button opens the correct person's complete recommendation and restores focus on close. |
| TESTIMONIAL-02 | Remove profile-link underlines, make full-recommendation buttons yellow, and align Yvonne's card with Brad's. | Complete | Both cards share height and action placement, with the requested link and button styles. |
| TESTIMONIAL-03 | Account for Brad's longer excerpt when equalizing cards. | Complete | Text remains complete and readable while the grid aligns cards by row. |

## Services index and footer alignment

| ID | Request | Status | Acceptance check |
| --- | --- | --- | --- |
| SERVICES-01 | Remove the blank area at the top of each service card. | Complete | Each card begins with its title at the normal inset. |
| SERVICES-02 | Move each arrow beside “Read about this work.” | Complete | One arrow sits with the call to action at the bottom of each card. |
| SERVICES-03 | Align the first Company and Social footer links. | Complete | “All work” and “GitHub” share the same vertical start. |

## Completion gate

Completed on August 13, 2026:

1. All 68 browser comments reached their focused acceptance checks, as did the three later LinkedIn follow-ups.
2. `npm run check:all` passed across source validation, accessibility data, galleries, publication boundaries, security headers, and media provenance.
3. Build idempotence passed with matching second-pass source and artifact hashes.
4. The source browser suite passed 157 scenarios, with one intentional skip.
5. The deploy artifact passed its validation and all 158 browser scenarios.
6. Desktop and mobile checks covered the affected route groups, including the 12-image LinkedIn carousel and its full-image viewer.

One operational choice remains outside this refinement pass: a recurring LinkedIn refresh would consume SocialCrawl credits and change deployment automation. The refresh command now discovers current posts when run, but no schedule was added without that authorization.

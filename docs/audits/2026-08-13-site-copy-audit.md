# Site copy audit

Date: August 13, 2026

## Scope

This audit covers the 52 HTML documents in the public allowlist, their search and social descriptions, shared prompts, and form status messages. It traces generated pages back to their source scripts so the revised copy survives a clean build.

The audit uses Oliver Ames's current writing patterns first, then applies the humanizer review. The target voice is direct, personal, specific, and warm without becoming promotional. It uses contractions, concrete nouns, and connected sentences. It does not rely on slogans to make ordinary work sound important.

## Copy that stays verbatim

- Direct testimonial quotations, including punctuation and attribution
- Published articles, Micro.blog posts, and LinkedIn posts written in Oliver's name
- Project titles, organization names, job titles, dates, numbers, links, and product names
- Factual image descriptions and accessibility labels
- Contact-form privacy, security, validation, and delivery disclosures
- Source notes, publication dates, and archive records

These passages may receive a grammatical bridge or a clearer label around them, but the quoted or archived text itself will not be rewritten.

## Recurring patterns to remove

### One vocabulary framework for unrelated work

The words “useful,” “clear,” “story,” “system,” “work,” and “public experience” recur across the homepage, About, Contact, services, case studies, software pages, and shared prompts. The repetition makes separate pages sound as though they came from one prompt.

### Headings written as maxims

Many headings make an abstract claim instead of naming the subject. Examples include “Useful stories need useful systems,” “Small tools for real friction,” “Give good work a way to repeat itself,” and “The experience changes what the words mean.” These lines sound manufactured and often force the paragraph beneath them to explain the heading before it can explain the work.

### Uniform three-part sentences

The site frequently introduces a broad claim, gives three parallel examples, and ends with a short conclusion. The pattern is tidy, but repeated use produces the same cadence on every page. Revised paragraphs should follow the facts instead of a preset rhythm.

### Generic significance claims

Phrases such as “work that matters,” “stories people care about,” and “photographs people remember” claim importance or audience response without evidence. Literal descriptions of the subject and assignment are more credible.

### Brand language in first-person pages

Phrases such as “communicator by choice and a systems person by nature,” “part message and part machinery,” and “the digital path behind the public experience” read like positioning exercises. Oliver's published writing is stronger when it starts with what happened, what he did, and what changed.

### Repeated rhetorical questions

The inbound project prompt, Contact page, and service calls to action all ask variations of whether a good project is stuck behind an unclear system. One direct invitation is enough. The others should name the kind of help available or tell the reader what to include in a first message.

### Generic search descriptions

Several page descriptions stack service nouns and location terms instead of describing the page. Revised descriptions should state what the visitor will find and preserve the facts that distinguish the project.

## Source map

| Surface | Source of truth |
| --- | --- |
| Homepage | `index.html`, `assets/js/hero-headline.js`, `scripts/refine-home.mjs` |
| About | `scripts/generate-about-page.mjs`, `scripts/refine-about.mjs`, `scripts/generate-testimonials.mjs` |
| Contact | `scripts/generate-contact-page.mjs`, `scripts/refine-contact.mjs`, `assets/js/contact-form.js` |
| Services | `scripts/generate-service-pages.mjs` |
| Testimonials | `scripts/generate-testimonials.mjs` |
| Work index and career cases | `scripts/refine-work.mjs`, `scripts/generate-career-work-pages.mjs` |
| Photography and event cases | `assets/data/eastrise-photography.json`, `assets/data/event-galleries.json`, and their generators |
| Software cases | `scripts/generate-software-pages.mjs` |
| Writing index and archive | `scripts/generate-writing-pages.mjs` and the archived source feeds |
| Shared footer | `scripts/apply-shared-ui.mjs` |
| Shared project prompt | `assets/js/inbound-prompt.js` |
| Search and social descriptions | `scripts/apply-seo.mjs` and generator metadata |
| Not-found page | `404.html` |

## Rewrite standard

Each revised passage must pass two checks. First, it should sound natural beside Oliver's published first-person writing. Second, it should state only facts already supported by the site or its source data. The final pass will search for the recurring AI vocabulary, em dashes in authored interface copy, unsupported claims, fragments outside labels and headings, and accidental changes to protected text.

# Reference Site Matrix

Review date: February 6, 2026.

This matrix captures directional scoring of sites you selected and maps patterns into explicit decisions for `ames.consulting`.

## Scoring Model

- Scale: `1` (weak/absent) to `5` (excellent/defining).
- Criteria:
  - `Voice`: clear editorial or brand point of view.
  - `IA`: information architecture clarity and navigation confidence.
  - `Stream`: coherence of content feed/taxonomy model.
  - `Visual`: distinct visual personality.
  - `Polish`: interaction/motion/detail quality.
  - `Business`: ability to convert into trust/action (subscribe, buy, inquire, download).

## Comparison Table

| Site | Voice | IA | Stream | Visual | Polish | Business | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [lmnt.me](https://lmnt.me) | 5 | 4 | 4 | 4 | 3 | 2 | Personal link hub, minimal but intentional. |
| [daringfireball.net](https://daringfireball.net) | 5 | 4 | 5 | 3 | 3 | 3 | Chronological editorial machine with strong identity. |
| [kottke.org](https://kottke.org) | 5 | 5 | 5 | 3 | 3 | 4 | Linkblog + archive/tag + membership system cohesion. |
| [leancrew.com/all-this/](https://leancrew.com/all-this/) | 5 | 4 | 4 | 2 | 2 | 2 | High-trust technical writing, low chrome. |
| [macstories.net](https://www.macstories.net) | 4 | 5 | 4 | 4 | 4 | 5 | Publication-grade structure with clear conversion paths. |
| [iconfactory.com](https://iconfactory.com) | 4 | 4 | 3 | 5 | 4 | 5 | Studio positioning with premium craft signals. |
| [parakeet.co](https://parakeet.co) | 4 | 3 | 3 | 5 | 4 | 4 | Visual portfolio clarity with minimal text overhead. |
| [panic.com](https://panic.com) | 5 | 4 | 3 | 5 | 5 | 5 | Strong personality plus disciplined product architecture. |
| [tapbots.com/ivory/](https://tapbots.com/ivory/) | 4 | 4 | 2 | 5 | 5 | 5 | Product landing storytelling and confidence signaling. |

## Pattern Synthesis

Recurring traits across favorites:

- Clear point of view is prioritized over generic templates.
- Navigation is compact and decisive.
- Content and product proof are first-class, not secondary.
- Visual personality is specific and memorable.
- Complexity is usually hidden behind simple top-level paths.

## Mapping to `ames.consulting` Decisions

| Decision | Adopt | Influenced by | Repo Impact |
| --- | --- | --- | --- |
| Single content model | Keep one post stream with filtered views | Daring Fireball, kottke, Leancrew | Existing `blog`/`portfolio` route model stays canonical |
| Compact nav | Limit top-level nav to core destinations | lmnt, Panic, Iconfactory | Keep `Home`, `Blog`, `Portfolio`, plus one utility page later |
| Editorial authority | Prioritize writing quality and chronology clarity | Daring Fireball, Leancrew, MacStories | Home copy and stream metadata should emphasize recency + voice |
| Taxonomy discipline | Use tags as product surface, not ad hoc metadata | kottke, MacStories | Maintain strict lowercase tags and controlled vocabulary |
| Proof over claims | Showcase shipped work/posts directly in stream | Parakeet, Iconfactory, Tapbots | Portfolio remains a filter lens, not separate CMS |
| Crafted interactions | Use motion/detail selectively with purpose | Panic, Tapbots | Keep progressive enhancement and reduced-motion support |

## Priority Decisions (Now vs Later)

Now (foundation phase):

- Finalize canonical tag taxonomy (`portfolio`, `writing`, `notes`, etc.).
- Define post-card metadata priority (date, tags, excerpt length, CTA).
- Keep architecture bias toward speed and low-friction reading.

Later (design phase):

- Choose exact typography and art direction language.
- Add stronger home curation logic (featured/pinned slices).
- Refine motion system and detail interactions.

## Anti-Patterns to Avoid

- Splitting blog and portfolio into separate publishing systems.
- Expanding top-level nav before content volume justifies it.
- Decorative UI complexity that degrades scan speed and readability.
- Generic “consultancy SaaS” visual language that erases voice.

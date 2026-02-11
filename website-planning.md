# Project: Personal Website (ames.consulting)

**Status:** Planning / On Hold
**Owner:** Oliver Ames

## Core Requirements

- **Backend:** [Micro.blog](https://micro.blog)
- **Frontend:** Custom HTML/CSS (to be built with Claude CLI)
- **Design:** Modern, clean, "Liquid Glass" or similar high-quality aesthetic (reference `web-design-guidelines`)

## Architecture Ideas

### Blog & Portfolio Integration
Oliver wants a unified content stream, not separate silos.

- **Content Source:** All posts live in Micro.blog.
- **Portfolio Items:** Just blog posts tagged `#portfolio`.
- **Navigation:**
  - **Home:** Primary landing page.
  - **Blog:** All posts.
  - **Portfolio:** A filtered view of the Blog (only showing `#portfolio` posts).
  - **Mechanism:** The "Portfolio" button just links to the blog page with a filter active, rather than a separate app/integration.

## Implementation Notes
- Use Micro.blog API or Hugo templates (if hosted on MB) or static site generator fetching from MB.
- Keep it simple: One content pipe, multiple views.

## Agent Team Strategy
Oliver wants to build this using a team of specialized AI agents, inspired by the concept of turning specs into skills.

**The Workflow:**
1. **Spec-Driven Skills:** Turn the entire CSS specification and Apple Human Interface Guidelines into hundreds of granular agent skills. This ensures the design uses "every available feature of modern CSS/HTML" rather than outdated patterns.
2. **Orchestrator:** Claude Opus 4.5 takes Oliver's direction + the spec skills to drive the design.
3. **Execution Environment:** A **Claude Code** session managed by the orchestrator.

**Required Tooling:**
- **Claude Code CLI** (already installed on Mac)
- **`superpowers` plugin** (already installed)
- **`ralph-loop` superpower** (TODO: specific plugin to verify/install)
- **Other plugins:** Need to verify full list of recommended Claude Code plugins for this workflow.

*Created: 2026-02-01*

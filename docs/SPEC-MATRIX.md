# HTML + CSS Spec Matrix

This matrix tracks intentional adoption of modern standards over time.

## HTML

| Area | Feature | Status | Baseline Usage |
| --- | --- | --- | --- |
| Semantics | Landmarks (`header`, `main`, `nav`, `section`) | Implemented | Page shells |
| Templates | `<template>` cloning | Implemented | Post card instantiation |
| Components | Custom elements | Implemented | `<post-card>` |
| Dialogs | `<dialog>` modal interactions | Implemented | Post preview |
| Popover | `popover` attribute and target controls | Implemented | Filter help panel |
| Metadata | `meta view-transition` | Implemented | Same-origin transitions |
| Forms | Search + structured controls | Implemented | Unified filtering |
| Navigation API | `navigate` event | Planned | Needs compatibility review |
| Declarative Shadow DOM | `template shadowrootmode` | Planned | Candidate for component hardening |

## CSS

| Area | Feature | Status | Baseline Usage |
| --- | --- | --- | --- |
| Architecture | `@layer` cascade layers | Implemented | Global stylesheet organization |
| Tokens | `@property` registered custom properties | Implemented | Surface alpha control |
| Layout | Container queries (`@container`) | Implemented | Filter and card grid behavior |
| Selectors | `:has()` relational selector | Implemented | Focus-aware shell state |
| Syntax | Native nesting | Implemented | Component styling blocks |
| Color | `color-mix()` | Implemented | Surfaces and accents |
| Media | `prefers-reduced-motion` | Implemented | Motion reduction |
| Positioning | Anchor positioning (`@supports`) | Implemented | Popover placement enhancement |
| Scope | `@scope` | Planned | Candidate for component isolation |
| Style Queries | container style queries | Planned | Candidate for theme variants |

## Expansion Rules

- Add features only when they improve maintainability, accessibility, or expressiveness.
- Document compatibility constraints before relying on a feature for core interactions.
- Keep a functional path for browsers without the latest enhancements.

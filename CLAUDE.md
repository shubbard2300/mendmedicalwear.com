# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

Static marketing site for MEND medical wear (mendmedicalwear.com). Plain HTML pages
(`index.html`, product detail pages, `FAQ.html`, `Privacy-Terms.html`) styled by
`styles.css`, with a small amount of JS in `main.js` and a serverless contact
endpoint in `api/contact.js`. No build step or framework.

Run locally with `npx serve -p 4200 .` (see `.claude/launch.json`).

## Front-End Excellence Rule

Always invoke the "Frontend Design" skill before writing any user-facing code.

Never build standard, generic bootstrap-looking templates.

Ensure production-grade aesthetics on every page and component:

- **Fluid typography** — scale type with the viewport (e.g. `clamp()`-based sizes),
  never fixed jumps between arbitrary breakpoints.
- **Intentional negative space** — spacing is a design decision, not leftover room;
  use a consistent spacing scale and let layouts breathe.
- **Cohesive color tokens** — all colors come from the shared palette defined as
  CSS custom properties in `styles.css`; never hard-code one-off hex values in markup.
- **Smooth micro-interactions** — hover, focus, and state changes are animated with
  purposeful, subtle transitions; respect `prefers-reduced-motion`.
- **Flawless responsive layouts** — every page works from small phones to wide
  desktops with no horizontal overflow, using fluid grids and `max-width` constraints.

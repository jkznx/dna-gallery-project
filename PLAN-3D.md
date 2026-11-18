# DNA Gallery → 3D: scope and plan

Status: **Approved 2026-11-18** · Owner: Prof. Javis (assigns the work)
Decisions: shape = recommended mix (A liquid-ribbon strands + B droplet rungs + C pearl sheen at medium strength; see `design-p0\`) · engine = plain three.js · camera travels along the helix on scroll · phones get the same 3D view, simplified · P0 done (Miranda). P1 prototype: Ultron. npm setup for P2: Bob. Deployment still needs separate approval.
Progress (2026-11-18): P0–P3 done; P4 in progress. See [TRACKER-3D.md](TRACKER-3D.md).

## Problem
The current "DNA flow" (`/gallery`, `/helix`) fakes depth: two SVG strands and CSS perspective move flat cards along curved paths. It can't rotate, light, or show the artworks from different angles, so it doesn't feel like walking around a real DNA helix.

## Goal
A true 3D double helix: the six artworks hang as framed panels on the rungs between two glowing strands. Scrolling moves the camera along (or turns) the helix, the selected artwork turns to face you and grows, and clicking it opens the existing detail page. Everything that works today (detail pages, Grid, Connections, Search, Saved, keyboard use, reduced motion, no-JavaScript gallery) keeps working.

## Design direction (added 2026-11-18)
Reference: Dribbble "Albus Therapeutics - Web UI/UX Interaction 3" by Samuel Oktavianus (C4D + Arnold render). Inspiration only: don't copy its layout, logo, typography or render. The still frame is kept at `design-ref\albus-ref-still.png` for the team's internal reference and must never ship in the app.

What we take from it:
- One big hero helix, partly cropped off the edge of the screen so it feels huge.
- Monochrome soft "clay" material and studio lighting on a calm, light background.
- Thin leader lines from points on the helix to labels.

What makes it ours (more fluid):
- **Liquid strands:** smooth ribbons whose thickness swells and thins along the length, with a slow "breathing" wobble (noise-driven), instead of even tubes.
- **Soft rungs:** rounded pebble or droplet bridges that look poured or pinched between the strands, not boxes, with slightly varied sizes.
- **Pearl-clay material:** cream base with a soft lavender-to-yellow sheen at glancing angles (the gallery palette: cream #fff6d7, lavender #dda9ef, yellow #f8ed94, ink #2d2333) instead of plain white.
- **Artwork callouts:** the six artworks hang off the helix on thin ink leader lines (our version of the reference's data callouts). The active one slides forward along its line and grows; the others stay small.
- **Fluid motion:** scrolling makes the helix flow and twist like a ribbon in water, eased with no hard stops; reduced motion shows a still pose.

## In scope
- New `Helix3D` client component on `/gallery` (with `/helix` alias), rendered with three.js inside the existing Next.js 16 / React 19 app.
- Helix geometry: two tube strands (curve-based), rungs, artworks as textured planes with a thin frame and caption; soft lighting in the current palette (cream, paper, lavender, yellow, ink).
- Scroll-driven travel (same rule as today: scrolling never gets hijacked, animation never scrolls the page), plus Previous/Next and the numbered picker, now also flying the camera.
- Selection: the nearest artwork turns to the camera and scales up; click or Enter opens `/artwork/[slug]?layout=helix` with the existing return context.
- Fallbacks kept: Pause motion + `prefers-reduced-motion` + no WebGL + no JavaScript → the existing static gallery. The 2D traveling version stays in the repo as the fallback.
- Performance: image textures from the existing Next Image sizes, capped pixel ratio, render on demand when idle, lazy-loaded 3D bundle so Grid/Info/Connections load as fast as now.
- Tests: helix math (positions, nearest-artwork selection, scroll mapping) in the existing Node test runner; a Playwright smoke check (loads, 0 console errors, 6 artworks pickable, fallback when WebGL is off).

## Out of scope (for now)
- New artworks, real assets or rights work (still the six generated samples).
- VR/AR, physics, sound, user uploads, accounts, deployment.
- Changing Grid, Connections, Search, Saved or detail pages beyond the return link.

## Phases and how completion is measured
| Phase | Work | Owner | Done when |
|---|---|---|---|
| P0 Design | Motion and look spec: helix shape, camera path, selection behaviour, palette and lighting, mobile view, reduced-motion behaviour; 3 still mockups | Dr. Miranda | You approve one direction |
| P1 Prototype | Standalone three.js helix with the six samples, scroll + picker, no app wiring | Prof. Ultron | Runs at 60 fps on this laptop at 1366×768; selection is correct across all 6 |
| P2 Integrate | `Helix3D` in `/gallery`, lazy-loaded; detail/return context, picker, Pause motion, fallbacks; tests | Prof. Ultron (build), Dr. Miranda (QA of motion, focus, mobile) | Build, typecheck and all tests pass; 7-size layout check has no overlaps; keyboard path and reduced-motion retest pass |
| P3 Review | Dependency and security review (new three.js package, texture loading, no network calls) | Security Reviewer | No Critical/High findings |
| P4 Handover | Preview server restarted on port 3000, README and QA notes updated, tracker closed | Bob The Builder (preview), Kim Secretary (docs, tracker) | You open the preview and sign off |

First deliverable: P0 mockups from Miranda.

## Decisions needed from you
1. **3D engine:** plain three.js inside one React component (recommended: one small dependency, same approach as the Agent Office), or React Three Fiber + drei (more React-style, two to three extra packages).
2. **Camera feel:** camera travels down along the helix as you scroll (recommended, matches today's "DNA flow"), or the helix spins in place in front of a fixed camera.
3. **Mobile:** same 3D view, simplified (recommended), or the 2D traveling version on phones.
4. **Preview:** restart the preview server on port 3000 now so you can compare against the current version.

## Risks
| Risk | Effect | Mitigation |
|---|---|---|
| New dependency (three.js) | The project so far added only Next, React, TypeScript | Pin the version, npm audit, Security review in P3 |
| Low-end phones / no WebGL | Blank or slow 3D | Static and 2D fallbacks already exist; capped pixel ratio; render on demand |
| Motion sickness | Long camera moves can feel bad | Short, eased moves; Pause motion and reduced motion respected |
| Accessibility | Canvas content is invisible to screen readers | Real links and the numbered picker stay in the page; focus never trapped in the canvas |
| Bundle size | Slower first load | Lazy-load the 3D view only on `/gallery` and `/helix` |
| Node/npm on this host | npm isn't on PATH | Use the existing `run-local.cmd` launcher; installing three.js needs a working npm, so P2 includes that step |

## Notes
- The preview server on port 3000 is not running (it stopped on 2026-11-17).
- Current palette and fonts (Montserrat, Caveat, self-hosted) stay unchanged.

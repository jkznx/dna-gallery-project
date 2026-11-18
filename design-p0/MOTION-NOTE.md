# DNA Gallery 3D · P0 design direction and motion note

Dr. Miranda · 2026-11-18 · For approval (PLAN-3D.md, phase P0). Design only; nothing in `src/` changed.
The helix design is our own. The Albus reference was used only for the idea of one cropped hero helix, clay lighting and leader lines; no layout, logo, type or render was copied, and the reference image is not used here.

## Files (all in `design-p0\`)
| File | What it shows |
|---|---|
| `option-a-liquid-ribbon-1440x900.png` | A · flat ribbons that swell and thin, slow twist, thin pinched filament rungs |
| `option-b-pebble-chain-1440x900.png` | B · beaded pebble strands, rungs are two droplets meeting at a soft neck |
| `option-c-pearl-ribbon-1440x900.png` | C · rounder tubes with a strong pearl sheen, smooth pill rungs |
| `recommended-ribbon-droplets-1440x900.png` | **Recommended:** A's ribbon strands + B's droplet rungs, mid pearl sheen |
| `phone-r-390x844.png` | Recommended direction on a phone (rendered at 2× for sharpness) |
| `mockup.html` + `shoot.py` | The real three.js scene behind every still (hash `#v=a\|b\|c\|r`, `phone=1`, `active=0..5`, `still=1`); `shoot.py` re-renders all PNGs |

All three options use the same layout and camera on purpose, so only the form differs. Each shows the existing header and nav (Gallery · Saved · Info), the hero helix cropped off the right edge, the active artwork callout (03 Daylight), five small callouts on ink leader lines, Previous/Next, the 01–06 picker and Pause motion.

## The three options
- **A · Liquid ribbon.** Most "poured" and calm; the ribbon catches light on its wide face. The filament rungs are thin and read like slats from far away, which brings it close to a standard DNA picture.
- **B · Pebble & droplet chain.** The most distinctive and the most "clay"; the droplet rungs make the brief's "soft pebbles" obvious. The beaded strands are busy, and at small sizes the helix starts to read as a necklace.
- **C · Pearl-sheen ribbon.** The most polished and the easiest to read; the lavender-to-yellow sheen shows best here. It is also the most generic shape and the least "ours".

**Recommendation: A + B.** Liquid ribbon strands with droplet rungs and C's sheen at medium strength. It is the only take that delivers all three parts of the brief at once: swelling ribbons, pebble/droplet rungs and a pearl-clay surface. It also looks least like the reference, which uses even tubes and box rungs.

## Look
- **Material:** cream clay (#efe1c3 base under studio light) with a fresnel sheen at glancing angles that goes lavender on top-facing surfaces and yellow on down-facing ones, plus a very faint grain. No textures, no image files in 3D.
- **Light:** warm key from the upper left, lavender rim from behind on the right, soft yellow fill from below; ACES tone mapping. The background is the page cream with two soft glows; the canvas is transparent.
- **The active rung** turns lavender, and its anchor gets an ink ring. Small anchors are ink dots. Leader lines are 1–1.4 px ink curves, not elbows.

## Motion
**Scroll (the camera moves, the page never gets hijacked).**
- Page scroll maps to a position along the helix, the same rule as today's DNA flow. The camera glides down the axis while the helix turns about 1/2 a turn per artwork.
- Easing is critically damped (about 450 ms to settle, no overshoot), so a fast scroll never snaps. The animation never moves the page scroll.
- About 180 ms after scrolling stops, the nearest artwork becomes active; nothing changes while the user is still scrolling.

**Breathing.**
- The ribbon width swells and thins along its length and drifts slowly, with a full cycle of about 10 s and a radius change under ±7%. The axis has a gentle S-bend that drifts too. No hue or brightness pulsing.
- The breathing also pauses while the user is scrolling, so only one thing moves at a time.

**Selection.**
- The active card slides out along its leader line into the dock area (about 320 ms, ease-out), and its rung goes lavender. The other cards shrink back to thumbnails. Leader lines follow their anchors every frame.
- Previous, Next, the picker, arrow keys (only when the gallery has focus) and a click on a thumbnail all fly the camera to that rung, about 700 ms, eased in and out, rotating at most half a turn. Each also moves keyboard focus to the active card's "View artwork" link.
- Enter or a click on the active card opens `/artwork/[slug]?layout=helix`; Back returns to the same rung.
- The cards are real links in the page in reading order 01–06, so a screen reader or Tab reaches them without the canvas. The canvas itself is `aria-hidden`.

**Phone.**
- The helix stands upright behind the content, cropped on both sides.
- Small callouts become 28 px numbered dots, not thumbnails. Their tap target is the 44 px picker below, not the dots.
- The active artwork sits in a bottom card above the dock. The dock has icon-only Previous/Next/Pause buttons with labels for assistive tech, and the picker shrinks to 34 px wide by 44 px tall.

**Reduced motion (`prefers-reduced-motion`) and Pause motion.**
- Both show the same still pose as these PNGs: no breathing and no idle turning. Camera moves become an instant cut with a 150 ms cross-fade.
- Scroll still selects the nearest artwork, and Previous/Next still work; only the in-between movement goes.
- Pause is a toggle in the dock (`aria-pressed`). It starts on when the OS asks for reduced motion and remembers the user's choice for the session.
- No WebGL or no JavaScript shows the existing static gallery. The 2D traveling version stays as the fallback.

## Open points for P1
- The droplet rungs need about 64 lathe segments to look smooth; budget about 60 rungs × 2 strands at 1366×768. Draw only on change, plus the breathing frames, and stop drawing while paused.
- Mockup limits: rendered with software WebGL in a headless Edge, and leader-line placement is hand-tuned for these two sizes. P1 must lay the labels out for every size so none overlap or get cropped (7-size check in P2).

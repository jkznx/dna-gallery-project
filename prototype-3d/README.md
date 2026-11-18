# DNA Gallery 3D · P1 prototype

Prof. Ultron · 2026-11-18 · Phase P1 of `PLAN-3D.md`. It follows Dr. Miranda's approved "recommended mix" in `design-p0\`. It is standalone and not wired into the Next.js app; nothing in `src\` was changed.

## Open it
Double-click `index.html`. It runs over file:// in Edge with no server and no flags. three.js r147 (MIT) loads from `..\..\agent-office\vendor\`, the fonts from `..\src\fonts\`, and the images from `..\public\samples\`. The artworks are HTML cards over the canvas, not WebGL textures, so file:// needs no special browser flags.
Hash options for checks: `#a=0..5` starts at an artwork; `#still=1` starts with motion paused (not remembered).

## Files
| File | What |
|---|---|
| `helix-math.js` | Pure helix math: strand points, breathing, ribbon cross-section, rung grid with one rung per artwork, scroll ↔ progress mapping, nearest artwork, travel transform, ≤ ½-turn flight rotation, critically damped spring. Works as a browser script (`window.HelixMath`) and in Node (CommonJS) |
| `callout-layout.js` | Automatic card/leader layout: no overlaps, stays in bounds, avoids blocked areas and other anchors; keeps the previous spot while it is still valid (hysteresis) |
| `app.js` | Scene (pearl-clay material, liquid ribbons, instanced droplet rungs), scroll travel, settle, flights, pause, overlay, on-demand rendering |
| `index.html` | Markup and styles for three layouts: wide (desktop and 1024×768), tall (portrait tablet) and phone |
| `tests/*.test.cjs` | 15 Node tests: `node --test tests/` |
| `tools/check.py`, `tools/fps.py` | Browser checks and frame-rate measurement (Playwright from uv's cache, offline, installed Edge) |
| `shots/` | Screenshots, `check.json`, `fps.json` |

## Behaviour
- **Scroll:** a passive listener only; scrolling is never blocked and the animation never scrolls the page (measured: page position unchanged over 2.5 s of idle breathing). Page position maps linearly to progress along the helix (`scrollStep` = 70 % of the viewport height per artwork). The helix moves past a fixed camera: it slides along its axis and turns ½ turn per artwork. That is the camera "travelling" the helix, and the focused rung always lands in the same screen spot facing the same way (tested).
- **Easing:** a critically damped spring, ω = 15. It settles within 1 % in about 0.44 s with no overshoot, independent of frame rate (tested).
- **Selection:** 180 ms after scrolling stops, the nearest artwork becomes active and the view eases onto it without moving the page.
- **Previous/Next, picker, thumbnails, arrow keys, Home/End:** the arrow keys and Home/End work when focus is in the dock or the active card. Each control jumps the page instantly to that artwork's scroll slot (the same rule as today's DNA flow). The camera flies for 700 ms with ease-in-out, turning at most ½ turn, and focus moves to the active card link. The card links to `/artwork/<slug>?layout=helix` (a plain link here).
- **Active card:** it slides out from its thumbnail into place (FLIP, 320 ms) and its rung turns lavender.
- **Breathing:** about a 10.5 s cycle with a radius change under ±7 % (tested), plus the slow S-bend of the axis. It pauses while scrolling and during flights.
- **Pause motion and reduced motion:** the Pause motion toggle (`aria-pressed`, remembered for the session) and `prefers-reduced-motion` both give the still pose. Scrolling then moves nothing in 3D; after the 180 ms settle, the view cuts to the new artwork with a 150 ms fade. Previous/Next also cut.
- **Fallback:** with no WebGL (tested with `--disable-webgl`) or no JavaScript, a static list of the 6 artworks shows.
- **Performance:** pixel ratio is capped at 2. The page renders only when something changes. While idle and breathing, one strand's geometry is rebuilt per frame, alternating, with normals computed from the cross-section. When paused and idle, nothing renders.

## Results (2026-11-18)
| Check | Result | Evidence |
|---|---|---|
| Node tests | **15/15 pass** | `node --test tests/` |
| Console errors on file:// | **0** at all 6 sizes, still and motion, plus the end-state shots | `shots/check.json` (`errors`) |
| Layout audit | **0 problems** at all 6 sizes and at the first/last artwork: no card overlaps another card, the header, the dock, the intro text or the active card; everything is in the viewport; no horizontal overflow | `shots/check.json` (`problems`) |
| Selection, all 6 | **6/6 by real mouse-wheel input**, 2/2 between positions (0.4 → stays 03, 0.6 → 04), **6/6 by picker** (active, camera within 0.005, page at the slot, focus on the card), ArrowRight 03 → 04 | `check.json` → `selection` |
| Frame rate, 1366×768, Intel UHD (D3D11), headless Edge | Rendered every animation frame while travelling (wheel), during flights and while breathing. The headless browser ran at about 145 frames per second (not locked to a 60 Hz display), median gap 6.9 ms, worst 14.1 ms. Whole frames including GPU time (1-pixel readback each frame): **travel median 5.1 ms (p95 8.7, max 12.7)** and **breathing median 5.6 ms (p95 8.3, max 9.0)**, all under the 16.7 ms that 60 fps needs. Script work per frame: 0.5 ms; ribbon rebuild: 1.9 ms | `shots/fps.json` |

Screenshots: `shots/<w>x<h>.png` (still, 03 selected), `-motion.png` (motion on), `1366x768-a01/a06.png` and `390x844-a01/a06.png` (first and last artwork), `no-webgl-1366x768.png`. All screenshots use software WebGL, like Miranda's mockups.

Not tested: a visible Edge window on the 60 Hz display (all timing ran headless), touch input, a screen reader, other browsers, and real phone hardware.

## Before P2: a design decision for Dr. Miranda
- **Neighbours in view:** with ½ turn per artwork, the screen shows the active artwork plus 1–3 neighbours. The others are further along the helix, off-screen or behind the chrome; their cards are hidden, never squeezed. Miranda's mockup showed all six because its slots were hand-placed on any rung. If all six should be visible, the spacing must shrink (e.g. ⅓ turn) or the camera must pull back. This is a design call.
- **Keyboard path:** small cards are a mouse shortcut (`aria-hidden`, `tabindex=-1`). The keyboard path is picker → active card link, plus Previous/Next. MOTION-NOTE asks for the cards as real links in reading order 01–06; with off-screen cards that would put invisible links in the Tab order. The current choice needs a decision.

## What P2 needs
1. Port `helix-math.js` and `callout-layout.js` to TypeScript under `src/lib/` and add the tests to the existing runner (`node --experimental-strip-types --test`). They need no DOM and no three.js.
2. Add three.js through npm (Bob's setup), pinned to a version, replacing the vendor script tag. Load the `Helix3D` client component lazily (`next/dynamic`, `ssr:false`) on `/gallery` and `/helix` only.
3. Serve images through Next Image at the card sizes: thumbnails 72/76/84 px, the active card up to 218 px, and 2× for the pixel ratio.
4. Reuse the existing return-context code (`artwork-link.tsx`, `traveling-dna.tsx`: saved y and index, `pageshow`, `#artwork-<id>`). Replace the prototype's static list with the existing static gallery and keep the 2D traveling version as the fallback.
5. Remove or gate the test hooks: `window.__dna`, `window.__perf`, and the `#a=` / `#still=` hash options.
6. Run the plan's 7-size layout check and a Playwright smoke test (load, 0 errors, 6 pickable, no-WebGL fallback). `tools/check.py` is a starting point. Re-measure frame rate in a visible window at 60 Hz.
7. Optional, for low-end phones: move breathing into the vertex shader. It costs about 2 ms of CPU per frame here.

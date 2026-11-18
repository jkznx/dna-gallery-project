# DNA Gallery 3D · P2 design and QA review

Dr. Miranda · 2026-11-18 · Review of Ultron's P2 integration (`P2-QA.md`), build `.next/BUILD_ID` = `DEXqQVX8y_0p3gD_GCpiy`.
Method: the existing build served by `run-local.cmd start` on 127.0.0.1:3100, viewed in headless Edge (software WebGL) with real key presses. I stopped only my own server (node PID 15800 and its cmd wrapper); port 3000 was not touched. No edits to `src/`, no installs.
My screenshots: `qa-3d\design-review\` (14 files). Ultron's 28 shots in `qa-3d\shots\` were also reviewed.

## Verdict: **PASS WITH FIXES**
The structure, keyboard path, Pause/Resume, reduced motion, phone scrim and layout all meet P1-DECISIONS. Two things must be fixed before the user signs off: the material no longer matches the approved look, and the pre-existing no-JavaScript page shows nothing. The rest is nice-to-have.

## Must-fix
| # | Area | Finding | Evidence | Required change |
|---|---|---|---|---|
| M1 | Look (your point 3) | **The material drifted from the approved mockup.** The strands render lavender-grey instead of cream clay; the yellow tint on down-facing surfaces is missing entirely; a thin dark hairline runs along the ribbon edges; and the ribbons are noticeably narrower, so the "swelling ribbon" reads as a flat band. The droplet rungs still match well (cream, soft, slight lavender rim). | `qa-3d\design-review\look-compare-mockup-vs-p2.png` (left: approved mockup, right: P2 at the same artwork and size) | **Strands:** use the same sheen strength as the rungs; base colour cream `#efe1c3`, with lavender only at glancing angles. **Restore the yellow tint:** in the r147 mockup, view-space `normal.y` drives lavender (up) → yellow (down); check that the r187 port keeps that sign and the 0.6/0.5 mix. **Ribbon width:** match the mockup's cross-section (wide = 0.08 + 0.5·sw², thin = 0.07 + 0.03·sw). **Hairline:** check for a back-face or outline pass on the strands; there should be no dark edge. **Accept when:** a side-by-side at 1440×900, artwork 03, still pose, shows cream strands with lavender/yellow edges. I will recheck it. |
| M2 | No JavaScript (your point 1) | **Pre-existing, every route.** With JS off, the page shows only "Gathering the collection…". When the hidden stream is revealed (Ultron's debug shot), the content appears **after the footer** and without page margins, so this is a structural problem as well as a visibility one. | `qa-3d\shots\no-js-1366x768.png` | **Design call:** remove the global `src/app/loading.tsx`. The six-artwork gallery is prerendered and needs no loading state; a loading text that never resolves is worse than none. If a route really is dynamic and slow, give it its own `loading.tsx` with a quiet skeleton in the page's real layout: the header and intro stay, and the artwork tiles appear as lavender placeholders. Never use a text-only "Gathering…" for the whole page. **Accept when:** with JS off, /gallery shows the header, intro, the static six-link list in `main` (above the footer), the collection heading and the footer, in that order. /grid and the detail pages show their content too. |

## Nice-to-have
| # | Area | Finding | Evidence | Suggested change |
|---|---|---|---|---|
| N1 | Page structure (your point 2) | The header scrolling away and the stage staying is **right**; keep it. A sticky header would cover the scene for about 4,000 px of travel, and Back to top plus the skip link cover navigation. **But** the view switch (DNA flow / Grid / Connections) and Search sit about 4.5 screens down (y ≈ 4,080 px at 1440×900), so someone who prefers the grid has to travel the whole helix first. | `d1-1440-top.png`, `d4-1440-after-helix.png`; measured: helix section 0–4,050 px, switch at 4,078, search at 4,220 | Keep the full collection block where it is, at the end. Add one small row of text links under the intro copy: "Grid view · Connections · Search" (13 px, underlined, ink). Search jumps to `#study-search-input` and focuses it. Desktop: the row fits between the intro copy (ends at y ≈ 310) and the active card (starts at y ≈ 340), but the active card must move down 24 px. Phone: put the row in the scrim zone, under the headline. These become Tab stops right after the header nav. |
| N2 | Phone | At 360×740 a neighbour's leader line runs up into the headline ("thread."), although the dot itself is clear of the text. | `m-360x740-mid.png` | Treat the scrim zone (from intro top to intro bottom + 8 px) as no-go for leader lines too: clip lines there, or choose the next free slot. |
| N3 | Phone | Picker buttons are 28×44 px at 360 px wide (33×44 at 390). This meets WCAG 2.5.8 (≥ 24 px) but sits under the 44 px comfort size. | measured | Optional: at ≤ 380 px, drop the Pause label area to 40 px and give the picker 32 px each. Low priority. |
| N4 | Desktop | When the page opens on `#artwork-sample-00N`, focus is restored to the active card, and its 3 px ink ring frames both the image and the text column as one large box. Correct and visible, but heavy. | `look-1440-a03-still.png` | Optional: put the ring on the "View artwork" link only (the card's real link), keeping the 3 px ink style. |

## P1-DECISIONS checklist (rechecked by me)
| Check | Result | Evidence |
|---|---|---|
| 1 · Active + ≥ 1 neighbour visible, no overlaps | **Pass** in all my samples (1440 top/mid/end, 390, 360); Ultron's 48/48 matrix agrees | `d1`–`d4`, `m-*` |
| 2 · Tab order and neighbour cards | **Pass.** Skip link → home → Gallery, Saved, Info → "View artwork: Soft orbit" → Previous → 01 Soft orbit … 06 Afterglow → Next → Pause motion → DNA flow → Grid view → Connections → search field → Search → Your saved studies → The story behind the thread. 0 neighbour cards focusable (their container is `aria-hidden`, buttons `tabindex=-1`). Every stop has a 3 px ink outline and is on screen when focused. The search field is labelled "Find a study" | `k-focus-picker.png`, `k-focus-active-card.png` |
| 2 · Focus after Previous/Next, live region | Pass per Ultron's checks; I did not re-measure it | `P2-QA.md` check 7 |
| 3 · Phone scrim | **Pass.** The headline sits on near-solid cream at 390×844 and 360×740, and the helix is fully visible from about 250 px down. No dot overlaps the intro text (see N2 for one leader line) | `m-390x844-top.png`, `m-360x740-mid.png` |
| 4 · Pause / Resume | **Pass.** With OS reduced motion it starts at "Resume motion", with no `aria-pressed`, 0 running CSS animations and a solid ink fill with a play icon. Normal start is "Pause motion" with two bars, dashed outline | `look-1440-a03-still.png` (reduced), `d1-1440-top.png` |
| Contrast | **Pass.** Ink and plum text sits on cream or paper cards, never directly on the 3D. Disabled Previous/Next are faded, which is exempt for disabled controls. Neighbour captions (≈ 9.5 px, ink on paper) are small but high-contrast and they are not the keyboard path | screenshots |
| Reflow | No horizontal overflow at 390 or 360 | measured |
| Console | 0 app errors in my runs | script log |

## Not tested
A real screen reader (names and live region were checked from the DOM only), touch hardware, Firefox/Safari, a 60 Hz display, slow-network chunk loading, and 200 % zoom. My renders use software WebGL, so exact shading may differ slightly from a GPU, but the material difference in M1 is far larger than that.

---

# Recheck after Ultron's fix round

Dr. Miranda · 2026-11-18 · Build `.next/BUILD_ID` = `oz1kjvUzk5co_PUrJu6mW` (`src/app/loading.tsx` confirmed removed).
Same method: `run-local.cmd start` on 127.0.0.1:3100, headless Edge, real key presses; I stopped only my own server (node 2704 and its cmd wrapper). Port 3000 was not touched; it was not listening. No `src/` edits.
Screenshots: `qa-3d\design-review\recheck\` (8 top-of-page sizes, 2 deep-link shots, focus, picker and no-JS).

## Verdict: **PASS**
Both must-fixes and all four nice-to-haves are resolved. Two cosmetic notes remain, neither of which blocks sign-off.

| # | Item | Result | Evidence |
|---|---|---|---|
| M1 | Material vs the approved mockup | **Pass.** The strands are back to cream clay, the ribbons are wide again with a visible swell, lavender appears only at glancing edges, and the dark edge hairline is gone. The yellow underside is subtle in this pose, as Ultron said. In the mockup it is also faint and shows mainly on down-turned ribbon folds, so I accept it. The droplet rungs still match. | `qa-3d\shots\look-compare-mockup-vs-p2fix-1440x900.png`, `recheck\top-1440x900.png` |
| Q2 | Header "missing" in Ultron's still shot | **Not a defect: it is how that shot was captured.** At the top of /gallery the header (dna✳ + Gallery/Saved/Info) is at y = 0, visible, and the topmost element under both the logo and the nav at **all 8 sizes** (1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, 360×740). His shot opens `#artwork-sample-003`, which restores the scroll position into the helix (scrollY 1,008–1,512 px), so the header has simply scrolled away. That matches my P2 decision to keep the header in the page flow. | `recheck\top-*.png` (8), `recheck\deeplink-a03-1440x900.png` |
| N1 | "Grid view · Connections · Search" link row | **Pass.** It sits under the intro copy at every size (y ≈ 325 desktop, 312 tablet, 184 phone, on the phone scrim), with targets 61/82/44 × 28 px (≥ 24 px). The Tab order is now header → Grid view → Connections → Search → View artwork → Previous → picker…, each with a visible 3 px ink ring. | `recheck\n1-focus-link-row-1440.png`, `recheck\top-360x740.png` |
| N2 | Phone leader lines out of the headline | **Pass** at 390 and 360: no line enters the headline or the link row. | `recheck\top-390x844.png`, `recheck\top-360x740.png` |
| N3 | Picker ~31×44 px at 360 px | **Accepted.** It is above the 24 px minimum (WCAG 2.5.8) and 44 px tall. The numbers are 15 px semibold and clearly separated, the active one is a solid ink tile, and the 44 px Previous/Next/Pause circles sit outside the row. No other layout needed; a wrapped or scrolling picker would be worse. | `recheck\n3-picker-360.png` |
| N4 | Focus ring on the "View artwork" pill | **Pass.** A 3 px ink ring with an offset sits around the pill only; the card no longer gets a heavy frame. The link still covers the whole card for mouse users. | `recheck\n4-focus-view-artwork-1440.png` |
| M2 | No JavaScript, /gallery | **Pass.** No "Gathering…" text. Order: header (y 0) → intro with the new link row (h1 y 147) → collection heading (401) → all 6 artwork links (from 599), all above the footer (2,012). No canvas, no horizontal overflow. | `recheck\nojs-gallery-1366.png` |

## Cosmetic notes (optional)
1. **No-JS copy:** the layout note reads "Scroll through the helix above, or open any study from the list", but without JavaScript there is no helix. Suggest a `<noscript>` variant: "Open any study from the list." (`recheck\nojs-gallery-1366.png`)
2. **No-JS capture:** in my full-page no-JS screenshot the sixth image (Afterglow) shows only its lavender placeholder. This is most likely native lazy loading not firing during a full-page capture, not a page bug; it is unverified. Worth one manual look with JavaScript off.

Console: 0 app errors at all sizes. One 404 at 1920×1080 without a URL in the message, most likely the known missing `/favicon.ico` (not confirmed).
Not tested: a real screen reader, touch hardware, Firefox/Safari, 200 % zoom.

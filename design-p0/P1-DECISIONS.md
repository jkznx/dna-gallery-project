# DNA Gallery 3D · design decisions for P2 (answers to Javis's 4 points on the P1 prototype)

Dr. Miranda · 2026-11-18 · Decisions for Prof. Ultron to build in P2. Based on `prototype-3d\` and its `shots\`.
Mockups for points 3 and 4: `p1-phone-scrim-390x844.png` and `p1-pause-resume-1440x900.png`. Both are real renders of Ultron's prototype with my CSS and markup injected at runtime only; no prototype or `src/` file was changed.
This file **supersedes MOTION-NOTE.md** on two points: the neighbour cards are not Tab stops (point 2), and Pause has no `aria-pressed` (point 4).

## 1. Neighbours visible — **keep ½ turn per artwork (0.5 turn, 180°)**
Keep showing the active artwork plus 1–3 neighbours; don't try to show all six.
- **Why ½:** the rung is symmetric, so ½ turn is the smallest step that lands every artwork's rung in exactly the same pose and screen spot. That is the calm "travelling" feel the prototype already has. ⅓ or ¼ turn would show the active rung at a different angle for each artwork and need a pose fix-up. Pulling the camera back would shrink the hero helix and lose the cropped scale.
- **All six stay findable:** the 01–06 picker is always visible, and the picker is the overview. My mockup showed six only because its slots were hand-placed.
- **One rule to add:** when an artwork has a previous or next neighbour, at least one of them must show a card (or a dot on the phone). If the only neighbour's anchor is behind the chrome or off-screen, show its card at the nearest free slot inside the 3D area, with the leader line still going to its rung. The ends (01 and 06) need only the one neighbour they have.
- **Checks:** active + ≥1 neighbour visible at all 7 sizes for all 6 artworks; 0 cards overlapping each other or the chrome.

## 2. Keyboard — **only the active card, Previous/Next, the 01–06 picker and Pause are Tab stops**
The small neighbour cards stay a mouse and touch shortcut: `aria-hidden="true"` and `tabindex="-1"`, exactly as built.
- **Why:** the cards come and go with the camera, so as Tab stops they would put invisible or moving targets in the Tab order (WCAG 2.4.3 focus order and 2.4.7 focus visible). The picker already reaches every artwork in two keystrokes.
- **Tab order:** skip link → header nav → active card "View artwork" link → Previous → picker 01–06 → Next → Pause motion. Arrow keys and Home/End keep working inside the dock and on the active card, as built.
- **Picker names:** each button gets an accessible name with the title, e.g. `aria-label="03 Daylight"`, and the active one carries `aria-current="true"`. The visible label stays "03". Add `title="Daylight"` for mouse users.
- **After Previous/Next or a picker press:** focus stays on the control that was pressed, so repeated presses don't jump focus around. One polite live region says "03 of 06, Daylight". Only an explicit Enter on the active card opens the detail page. *(This changes the prototype, which moves focus to the active card; I find that disorienting when someone steps through with Next.)*
- **No JavaScript or no WebGL:** the existing static gallery list, all six as normal links, as planned.

## 3. Phone — **soft cream scrim behind the intro text; keep the full 3D helix**
Keep the same 3D view, add a cream scrim under the text, and don't move or shorten the helix (mockup `p1-phone-scrim-390x844.png`).
- **The scrim:** an element between the canvas and the UI layer (canvas → scrim → UI). It spans the full width, from the top to the intro's bottom + 80 px. Gradient: cream `#fff6d7` solid down to intro bottom − 16 px, `#fff6d7cc` at intro bottom + 8 px, transparent at intro bottom + 80 px. Recompute it on resize and font load.
- **Result:** the headline and eyebrow sit on near-solid cream (ink #2d2333 on cream ≈ 13:1). The helix fades in just under the headline, and from about 250 px down it is fully visible, so the 3D still fills the phone.
- **Phone only (≤ 600 px).** Desktop and tablet don't need it, because the helix sits to the right of the text there.
- **Callout dots** must not overlap the intro text box: drop a dot whose box intersects the intro, or move it to the next free slot. A dot in the fading part under the text is fine (04 in the mockup).
- **Reduced motion and Pause:** the scrim is static, so nothing changes.

## 4. Pause button — **two plain labels, no `aria-pressed`**
| State | Visible label (desktop) | Icon | Accessible name (phone shows icon only) | Style |
|---|---|---|---|---|
| Motion on | **Pause motion** | two bars (inline SVG) | "Pause motion" | outline, dashed border (as now) |
| Motion off (paused, or OS reduced motion) | **Resume motion** | play triangle (inline SVG) | "Resume motion" | solid ink fill, cream text and icon |

- **Why no `aria-pressed`:** when the name changes with the state, `aria-pressed` makes screen readers say "Resume motion, pressed", which is contradictory. Use either a changing name or a fixed name with `aria-pressed`, never both; I choose the changing name because it matches what sighted users read. So: remove `aria-pressed`, set the text and `aria-label` together, and add `title` with the same text.
- **Icons:** use inline SVG (`aria-hidden="true"`, `focusable="false"`), not the ❚❚/▶ text glyphs. Some systems draw ▶ as a coloured emoji, and the glyphs size inconsistently.
- **What the prototype shows today:** a ▶ icon on a dark fill with the label "Pause motion". That state is the bug; the mockup `p1-pause-resume-1440x900.png` shows the correct paused state.
- **OS reduced motion:** the button starts in the "Resume motion" state. Pressing it turns motion on for this session only (the user's explicit choice wins). On reload the OS setting applies again.
- The dark fill reaches 3:1 non-text contrast against the cream dock; keep a visible focus ring (3 px ink outline, 3 px offset) in both states.

## Checks for P2 QA (I'll retest these)
- **1:** all 6 artworks at 7 sizes: active + ≥1 neighbour visible, 0 overlaps.
- **2:** Tab order as listed, 0 neighbour cards focusable, picker names "NN Title" with `aria-current`, focus stays on Previous/Next after pressing.
- **3:** at 390×844 and 360×740 the headline sits on the scrim, no dot overlaps the intro text, and the helix is visible below about 250 px.
- **4:** the label, icon, `aria-label` and fill change together; no `aria-pressed`; correct start state with OS reduced motion.

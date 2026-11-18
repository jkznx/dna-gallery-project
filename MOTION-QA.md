# Scroll-driven DNA increment

Historical increment: this trace direction is superseded on `/helix` by the centered 3D DNA ladder. Its source remains preserved as a separate unused component. See LADDER-QA.md for current runtime, tests, interaction and review status.

Engineering handoff: 2026-11-09, Asia/Bangkok. Local URL http://127.0.0.1:3000/helix; final review server PID51808 (verify `server.pid` and process identity before stopping it).

Final production artifact: `HVfCBXMnAhsFVr0I7LgZX` read from the absolute `.next/BUILD_ID`, with matching live process/PID. No source change or rebuild occurred after identity reconciliation; strict typecheck and five tests passed again. Earlier PID44200/buildI-GitZ4dNM-IA6rWnQoQC was an intermediate artifact; PID51520 was the initial motion build sampled independently.

Scope: local user-authorized motion on `/helix`; `/grid` retained for comparison. No deployment, service setup, purchase, dependency addition or external content. The existing sample labels, type hierarchy, colors and content adapter remain. Motion is a working direction; final visual/content choices are still open.

## Implementation

- Native server-rendered SVG: two mirrored strands and 37 cross-rungs. A complete muted strand is always present; scrolling clips a colored overlay from the top downward, reversing on upward scroll.
- Desktop/tablet track stays in the central gutter; at 600px and below a 24px track sits beside the single-column artwork sequence with reserved space.
- Images reveal from 84–100% opacity with at most 2px interior translation and 2.5% interior scale; captions, list items and anchor hit boxes never transform. Focused artwork is fully opaque and untransformed. Paused/reduced/no-JS states are static and fully visible.
- Explicit motion button uses a native button, pressed state and descriptive status. Paused state persists as one boolean preference in sessionStorage; denied storage is caught. Reduced-motion changes are observed dynamically and default to static. No automatic scroll, scroll interception, cursor effect or idle loop exists in the motion island.
- Passive scroll events schedule at most one pending animation frame. Geometry is measured on initialization, resize, ResizeObserver notification, font readiness and page restoration; paints read scrollY and write a decorative SVG clip plus six CSS variables, without layout queries. Listeners/observer/pending frame are cleaned up, including delayed font readiness callbacks.
- Fragment return helper was corrected to honor an explicit artwork deep link immediately after hydration. It scrolls only to the user-requested fragment; motion itself does not move the page.

## Engineering evidence

- Production build and strict TypeScript passed after implementation; all five tests pass (two content tests, three motion/math/geometry tests).
- Requested widths 320/360/768/1440: both routes have no horizontal page overflow. Track width is 24px on mobile, 64px at 768, 100px at 1440. At 320, track starts at x20 and artwork at x60; no overlapping hit areas.
- Forward/reverse samples from rendered SVG progress: at 1440, `0 → .3987 → .1862 → 1` (start, down, up, collection bottom). At 320, `0 → .4688 → .2885`; at 768, `0 → .4310 → .1804`. SVG clip height follows progress. Resizing a deep-scroll mobile view to tablet recomputed progress to .906 without resetting the collection or losing content.
- Desktop link document-top measured 848.4px before/after scrolling despite image depth changes. Screenshots visually inspected on desktop and mobile: a visible double strand and rungs, stable captions and image targets, slim mobile line outside card area.
- Pause shows clip height1000/full strand and all six image opacities1. Pause survives page navigation. Dynamic reduced-motion shows mode off, clip1000, CSS clip-path none, all six image opacities1/transforms none; scrolling keeps progress1.
- Keyboard at 360: motion button adds one logical stop; eight Tabs reaches Daylight. Focused image computes opacity1/transform none; Enter opens its detail; return focuses the same card with the strand initialized at the restored position.
- Final-build deep-link check: direct `/helix#artwork-sample-005` focuses Growing room and reveals its card, initializing progress1 at that deep position. Native browser Back from Sample04 returns focus and exact saved scrollY1157.6 with active progress.7176. Paused hover was also checked: image transform stays none.
- Final-build native keyboard paging at 360px, delivered as separate PageDown/PageDown/PageUp actions: scrollY `0 → 700 → 1400 → 700`, progression `0 → .1119 → .3899 → .1119`. This resolves the earlier inconclusive batched-key test; no keyboard event interception or custom paging code was added.
- `/grid` retains six artworks with no motion island. Route switches did not surface hydration errors or console errors. Existing image-preload-not-used warnings can appear while changing viewport sizes; no failed images were observed.
- HTTP response confirms server-rendered `data-motion="off"`, a complete height1000 clip, SVG and native artwork links before hydration. An actual JavaScript-disabled browser run has not been performed; this is source/response evidence for the static fallback.

## Review and remaining limits

Security Reviewer completed scoped read-only source review of the motion island, math, CSS and gallery integration: no confirmed security finding. They checked deterministic React SVG construction, scoped selectors, bounded numeric writes, boolean-only preference storage, cleanup including delayed font callbacks, and static availability under pause/reduced motion. They did not independently run build/tests.

Final-delta security addendum: the reviewer also inspected the latest cleanup guards and fragment restoration helper and found no issue. The explicit hash must use the artwork prefix and resolve locally to a selector-validated artwork anchor before focus/instant positioning; no arbitrary destination or HTML is constructed. Build/test execution remains engineering evidence.

Miranda independently sampled the motion implementation and reported no confirmed defect: mobile progress `0 → .3502 → .7076 → .3502`, stationary link bounds, visible slim strand, no overflow at the requested widths, pause/reduced-motion full visibility, and keyboard detail-return focus. They subsequently reconciled and retested the final artifact: absolute server.pid51808, live node51808 and BUILD_ID `HVfCBXMnAhsFVr0I7LgZX` independently match. Fresh-tab/hard-load mobile deep link to Growing room focuses/reveals the card at progress.9294/clip929.39 with opacity1/transform none. Pause plus hover leaves all six images static/opaque; reduced-system labeling and sampled keyboard/history returns pass. No confirmed sampled defect remains. This targeted final addendum supersedes the initial PID51520 identity limitation without repeating the full matrix. Reviewer limits are documented in Shared/dna-gallery-ux.md.

Screen reader output, physical touch/OS motion preference, CPU/power profiling, other browser engines, forced content failures and actual mixed-proportion user artwork remain unchecked. No production acceptance or publishing authorization is inferred.

## References used

- [MDN scroll event](https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event): high-frequency handling and the distinction between frame scheduling and true event throttling. The implementation coalesces paint; it does not claim to reduce browser event frequency.
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion): static preference handling.
- [Chrome scrollytelling guidance](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/scrollytelling): scroll-linked progression and reduced-motion treatment.

Local writes: application source/styles/tests/docs, `.next`, TypeScript build info, server logs/PID. Browser state writes only the motion boolean preference and existing artwork anchor/scroll return record. No new packages or credentials.

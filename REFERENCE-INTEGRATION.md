> Historical revision evidence below. Current traveling-card sketch revision: see [TRAVEL-QA.md](TRAVEL-QA.md).

# Spatial reference integrated into V3

Cleanup addendum: Security Reviewer reported no confirmed vulnerability, but noted that the guarded restoration animation frame was not explicitly cancelled. It is now tracked and cancelled during effect cleanup as well as guarded by `alive`. This changes lifecycle hygiene only; geometry/layout/selection code is unchanged. Build/typecheck and all11 tests passed again; fresh mobile deep-fragment and detail-return smoke checks both restored Growing room selection/focus without overflow. The wider flow matrix below was recorded before this non-visual cleanup-only rebuild and was not unnecessarily repeated.

Pointer regression follow-up: Miranda reported the initial V3 artifact37440's negative-depth previews were covered by the list plane. That issue was already fixed before reference integration (`.ladder-previews` pointer-events:none; `.ladder-select` pointer-events:auto). On current29668/buildv42Ys3gQJ5TBP2vwGjLMl at1440x1000 near timeline.9326, elementFromPoint hits IMG inside the correct Growing room/Afterglow buttons, and trusted role clicks select index4 then5. No additional code change or rebuild was required; independent retest was requested on the current artifact.

2026-11-09, Asia/Bangkok. Current local build: **v42Ys3gQJ5TBP2vwGjLMl**, process **29668**, http://127.0.0.1:3000/helix. `/grid` remains the comparison; this is the same project and content adapter.

## Reference inspected

The [Dribbble reference by edward](https://dribbble.com/shots/26170277-AI-Powered-Visual-Architecture-Interface) successfully displayed in engineering's embedded browser. Its available media showed small tilted image cards distributed along a broad floating curve, with generous open space. The loaded primary media was a still PNG; the inspected DOM contained no video element. The creator describes a kinetic carousel, but no frame-by-frame motion sequence was observed. This integration does not claim an exact choreography match.

No reference imagery, colors or page assets were copied into the gallery. Existing sample images, lavender/cream/yellow palette, provisional fonts and calm unrotated center remain.

## What changed

The small previews now travel subtly along **two mirrored spatial lanes**, with vertical/lateral displacement, opposite depth, small yaw/roll and restrained scale variation. Connector endpoints are derived from the same preview poses and remain attached to the actual two-strand projected helix/rungs. The DNA still twists and crosses behind the large center; it is not replaced by the reference's single curved fan.

Mobile uses smaller displacement/roll, preserving readable preview targets and the large center's clear space. All preview motion derives from the scroll/selection position; it reverses deterministically and never runs as an idle loop. The center's selection model, View design, Previous/Next, logical list order, static pause/reduced/no-JS fallback and return handling are unchanged.

## Verification

- Production build and strict typecheck passed; **11/11 tests** passed. A new test covers paired/mirrored lanes, bounded x/y/depth/roll/scale, both compact/full treatments and geometry/connector consistency.
- Rendered1440 and320 scrolling visits `0→1→2→3→4→5→4→3→2→1→0`; one dominant center image at every sample. Reverse returns the preview pose to the earlier coordinates.
- Example first preview at1440: position0→x8.001%/y22.002%/z−.01px/scale.9700; position2→x9.785%/y25.967%/z−27.77px/scale.9402; position5→x6.389%/y18.420%/z25.06px/scale.9968. On reverse, the earlier position2 values repeat.
- At320, every settled index and reverse sample has no preview/main overlap, no preview/navigation overlap and no horizontal page overflow. Preview target bounds stayed inside approximately x12.7–290.3px. At768, selecting each of the six designs also produced no main/navigation overlap or page overflow. Current360 and1440 layouts also fit; the large center remains contain-fit and unrotated.
- Moving preview selection at320 changed the design without moving scrollY978.4. At360, pause still shows six static links with all preview transforms none and the center feature hidden; resume and detail-return focus remain functional. No navigation/fallback implementation was changed by this increment.
- Screenshot image items were captured for the reference and updated mobile gallery. The browser screenshot interface returns image content without a local file-export argument; there are no standalone PNG exports attached to this report. Browser tabs may be agent-scoped, so reviewers should open the live URL in their own tab.
- Current process/BUILD_ID/HTTP200 were read together; server-error.log is empty. The existing unused-image-preload warnings can occur during rapid image/viewport tests. No console/hydration error was observed.

## Scope and review

Changed source: `ladder-math.ts` (`previewPose`, synchronized connector geometry), `dna-ladder.tsx` (bounded numeric pose variables and compact-scene measurement), `dna-ladder.css` (pose-driven positions/roll/scale), and one test in `tests/ladder.test.ts`. No new dependencies, services, backend, accounts, publication or deployment.

Miranda completed the reference-flow matrix on the loaded PChOnC7s5gUg0o0Xk3D7F client with no sampled defect:320 all six forward/reverse selections and preview hit targets,320/768 all six trusted selections,1440 sampled0/2/5, no center/navigation overlap, and static pause. Their final current-artifact identity/restoration reconciliation is pending because only the guarded callback cancellation changed afterward. Exact unchanged math/CSS hashes and the four-line lifecycle delta were supplied; the current build is frozen during that retest.

Security Reviewer confirmed the final restoration-frame cancellation and matching source SHA256, issuing a consolidated no-confirmed-findings verdict for V3 motion, numeric poses, storage and return navigation. Their review was source-only; build/tests/focus checks remain engineering evidence. Physical touch/OS preference, other engines, screen-reader speech, real mixed-ratio artwork, text zoom, failure fixtures, actual JS-disabled browser and performance profiling remain unchecked.

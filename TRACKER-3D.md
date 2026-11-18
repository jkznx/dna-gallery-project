# DNA Gallery 3D — Tracker

Plan: [PLAN-3D.md](PLAN-3D.md) · Owner of this tracker: Kim Secretary · Date: 2026-11-18
Preview server: **pending Bob** (Bob is starting it now; URL not yet confirmed)

## Phases

| Phase | Owner | Status | Date | Evidence | Result |
|---|---|---|---|---|---|
| P0 Design | Dr. Miranda | Done | 2026-11-18 | [design-p0/P1-DECISIONS.md](design-p0/P1-DECISIONS.md), [design-p0/](design-p0/) | Recommended mix approved: liquid ribbon strands, droplet rungs, pearl sheen at medium strength. |
| P1 Prototype | Prof. Ultron | Done | 2026-11-18 | [prototype-3d/README.md](prototype-3d/README.md) | Runs standalone; 15/15 tests; 6/6 selection; about 5 ms per frame on the test laptop. |
| P2 Integrate | Prof. Ultron (build), Dr. Miranda (QA) | Done | 2026-11-18 | [P2-QA.md](P2-QA.md), [P2-DESIGN-REVIEW.md](P2-DESIGN-REVIEW.md) | Build, typecheck, and 43/43 tests pass. Layout passes at 8 sizes. Miranda's recheck: PASS. |
| P3 Review | Security Reviewer | Done | 2026-11-18 | [P3-SECURITY.md](P3-SECURITY.md) | 0 Critical, 0 High, 0 Medium. 2 Low, 3 Info. No confirmed vulnerability. |
| P4 Handover | Bob The Builder (preview), Kim Secretary (docs, tracker) | In progress | 2026-11-18 | This file | Preview restart pending Bob. Sign-off by user not yet given. |

## Open items

1. **Before any deployment:** add CSP and security headers (Security Low 1). Not yet done.
2. **Keep `helix3d-scene.tsx` `svg.innerHTML` numbers-only** (Security Low 2). Currently true; add a comment or switch to safe DOM building.
3. **No-JavaScript wording:** the note says "Scroll through the helix above", but there is no helix without JavaScript. Needs a no-JS variant (Miranda, cosmetic).
4. **Favicon:** the app has no favicon, so `/favicon.ico` returns 404.
5. **Not yet tested:** screen reader, touch hardware, Firefox and Safari, a 60 Hz display, 200% zoom.
6. **Node version:** installed Node is v26, but the README says 22.13 or newer. Not yet checked against the README.

## Decisions

1. Shape: the recommended mix (liquid-ribbon strands, droplet rungs, pearl sheen at medium strength).
2. Engine: plain three.js 0.187.0, pinned exactly.
3. Camera travels along the helix on scroll. The page itself never scrolls from the animation.
4. Phones get the same 3D view, simplified.
5. `src/app/loading.tsx` removed. It caused a "Gathering the collection…" screen with no JavaScript.
6. Deployment is not approved yet.

## Not done by this tracker

- No source files were edited. No packages installed. No servers started or stopped.

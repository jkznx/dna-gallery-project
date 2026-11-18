> Historical revision evidence below. Current traveling-card sketch revision: see [TRAVEL-QA.md](TRAVEL-QA.md).

# Local MVP verification

Latest reference-integrated V3: PID **29668**, BUILD_ID **v42Ys3gQJ5TBP2vwGjLMl**, http://127.0.0.1:3000/helix. Build/typecheck and **11/11 tests** pass. See REFERENCE-INTEGRATION.md for the inspected Dribbble still and two-lane spatial preview refinement; this supersedes the base V3 artifact identity below without changing its central-design/navigation model.

**Current 3D increment:** `/helix` now presents one large centered artwork and small previews on a scroll-driven 3D DNA ladder. Current runtime PID **12384**, production build **NAWqSKXfktHDl4bSlHbGx**, URL http://127.0.0.1:3000/helix. Build/typecheck and **10/10 tests** pass. See **LADDER-QA.md** for current hierarchy, navigation, responsive, fallback and screenshot evidence. All trace/static-gallery evidence below is historical; do not treat its process IDs or review sign-offs as current 3D acceptance.

Current increment: the user requested scroll-driven DNA motion on `/helix`. See **MOTION-QA.md** for its implementation, five-test suite and rendered checks. The earlier strand-free mobile treatment below is historical and has been replaced by a visible slim mobile strand.

Current verified handoff (2026-11-09, Asia/Bangkok): loopback URL http://127.0.0.1:3000/helix, live PID **51808**, production build **HVfCBXMnAhsFVr0I7LgZX**. Process command line, absolute `server.pid` and `.next/BUILD_ID` were read together; no source edits or rebuild followed this identity check. Final production build passed, strict typecheck and all **5 tests** passed again. PageDown/PageUp at 360px advance/reverse normal scroll `0 → 700 → 1400 → 700` with strand progress `0 → .1119 → .3899 → .1119`. Browser-history Back restores Sample04 focus and exact saved scroll; resize, pause/reduced-motion and explicit fragment checks are in MOTION-QA.md. Independent security and rendered acceptance reviews, including final-artifact identity/deltas, are complete within their sampled scopes with no confirmed findings; details and remaining test limits are recorded there. PIDs24900/44200/51520 elsewhere in historical notes are superseded.

## Earlier static-gallery evidence

Date: 2026-11-08. Host: Windows, Node v24.22.1. Installed versions are pinned: Next.js 16.4.5, React/React DOM 19.3.1, TypeScript 7.0.2.

## Completed

- Production compilation and route generation: passed (`npm run build`).
- Strict TypeScript: passed (`npm run typecheck`).
- Node content tests: 2 passed, 0 failed (`npm test`).
- Dependency installation audit: zero known vulnerabilities reported across 29 installed packages.
- Browser at requested viewport widths 360, 768 and 1440: `/helix`, `/grid` and representative detail pages have no horizontal page overflow. The browser reports a smaller content area where its scrollbar occupies space; page `innerWidth` matched each requested size.
- At 1440, scrolled both galleries to load lazy images: all six images loaded on each route. All six detail pages loaded their image, title and correct `/helix` return context. `/grid` return context was also checked on a representative detail page.
- At 360, helix and grid each use one column. Keyboard Tab reaches the skip link with visible solid focus; tabbing to the first artwork and pressing Enter opens its detail route. The detail view uses native page links rather than modal focus management.
- Reduced-motion emulation: media query matches and image transitions compute to `0s`.
- Unknown artwork route displays the designed “This piece isn’t here” state.
- No browser console errors surfaced. Resizing between viewports produced non-fatal warnings about preloaded image sizes that were no longer used after the resize.
- Desktop screenshot visually inspected: images separated, strand motif visible, captions readable. Screen-reader testing and a full manual accessibility audit were not performed.

## Pending independent review / limits

Miranda completed source and rendered checks of both layouts at 360/768/1440; typography/reflow checks passed. Their return-focus finding is closed: a fresh-tab current-build retest at 360px independently confirmed the explicit return focuses Daylight with its card fully in view. Browser-history restoration remains engineering-tested only. James completed content guidance and confirmed the samples can support the comparison. Security Reviewer reported no confirmed security vulnerability in the fixture-only source and separately found no security issue in the newer client restoration component. They reconciled the stale missing-lockfile statement, independently confirmed the lockfile SHA256/version/registry integrity fields, and reported no remaining confirmed findings. They did not independently run audit/build/tests; those remain engineering-verified results. These are scoped reviews, not a full production sign-off.

Manual forced empty/error states and failed-image rendering remain unchecked. Real artwork with mixed proportions, very long captions, screen-reader announcement/order, Safari/Firefox and physical touch devices need subsequent QA. No admin/auth/storage/backend exists, so no authorization or draft privacy behavior is claimed. No production environment was tested.

## Local process and writes

Review URL: http://127.0.0.1:3000. Production-mode server is loopback only; current PID is recorded in `server.pid`. See MOTION-QA.md for the latest increment's process information. Before stopping it, read that PID and verify the process still runs this gallery; Windows may reuse process IDs. The server logs to `server.log` and `server-error.log` (ignored by git). Build writes `.next` and TypeScript build information. Installation writes `node_modules` and the lockfile. A portable npm download and sample-asset generation helper were created under the engineering agent's `.tools` directory; no system Node/PATH or execution policy was changed. The shell's existing PowerShell profile was blocked by execution policy; subsequent commands used a profile-free shell.

The source project, generated PNG samples, locally downloaded licensed fonts, README and this report are the deliverables. No deployment, purchases, public publishing or external messages occurred.

Metadata integration: added independent stable `id` and explicit one-based `sortOrder`; the adapter sorts by that order. Inventory mapping is documented in README. Build, strict typecheck and both content tests passed again; tests cover unique IDs/slugs, order and positive integer dimensions. Rights evidence/contact data are absent from fixtures.

## Miranda source-review corrections

- Applied the full provisional desktop scale: H1/H2/H3 64/36/24px, intro 20px, body 16px, navigation/captions 14px. At mobile, headings are 40/28/20px and intro 18px. Computed styles verified in browser at 1440px and 360px. Sizes use relative units with responsive adjustments; fonts, scale and ink remain provisional.
- Layout selector now has a dark outline and 44px minimum control height. Mobile helix note explicitly describes the strand-free simplification as awaiting user choice.
- Rechecked both layouts at 320/360/768/1440px: no horizontal overflow. At 320px, the picker, both layouts and a representative detail page also passed a 200% root-font-size emulation. This checks text enlargement, not physical-device or screen-reader behavior.
- Found browser Back retained scroll but lost focus. Artwork links now use document navigation and record only artwork anchor ID/scroll offset in sessionStorage. Browser Back restores the opened artwork's focus and scroll; tested on Sample 04 at desktop. Explicit Back to collection uses an artwork fragment and restores focus to Sample 04; tested at 360px. Storage denial falls back to browser history; no gallery content or private data is written to browser storage.
- Final build, typecheck and 2/2 tests passed after these fixes. Miranda independently completed rendered layout/type checks and subsequently closed the explicit-return regression.

Historical static-gallery regression follow-up: then-current PID24900 was verified from `server.pid`. At 360px, fresh `/helix` → seven Tabs focuses Daylight (`artwork-sample-003`, scrollY1728.8). Enter opens its detail; Back to collection targets `/helix#artwork-sample-003`, restores focus to the card and places it in view at scrollY1907.2. This explicit fragment positioning intentionally differs from browser-history scroll restoration. Miranda's reported BODY/scrollY0 behavior was from the pre-fix PID36992 build. Miranda subsequently repeated this path in a fresh tab/hard reload, including a keyboard-only return: card top0/bottom443 within the 800px viewport, with solid visible focus. The prior finding is closed; no source changes were needed.

## Dependency verification follow-up

`package-lock.json` exists (45,989 bytes, lockfile version 3). SHA256: `D7B0F4BA3A55B5553C985EFE261D221EC6BD276C55A3149080E51B2353C9C7CB`. Parsed using Node because this host's older PowerShell JSON converter rejects the lockfile's empty root-package key. Locked Next/React/React DOM/TypeScript packages have npm registry resolved URLs and integrity fields. A fresh `npm audit --json` reported zero known vulnerabilities (80 dependency records including optional platforms; 81 lockfile package records including the root). This does not establish complete supply-chain provenance or replace a clean `npm ci` reproduction check. Typecheck and both content tests passed again. No code changes were needed for this follow-up.

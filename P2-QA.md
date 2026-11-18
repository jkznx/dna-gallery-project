# DNA Gallery 3D · P2 integration QA

Prof. Ultron · 2026-11-18 · Phase P2 of `PLAN-3D.md`. It follows Dr. Miranda's `design-p0\P1-DECISIONS.md`. Nothing was deployed or pushed, and the port-3000 preview was not started; checks ran on a temporary `next start` server at 127.0.0.1:3100, which I stopped afterwards.
Final build `.next/BUILD_ID` = `DEXqQVX8y_0p3gD_GCpiy`. It is a clean rebuild of the same source the checks ran on; the last change before the checks was CSS only.

## What changed
| File | Change |
|---|---|
| `package.json`, `package-lock.json` | `three` **0.187.0** (dependency) and `@types/three` **0.187.0** (dev dependency), both pinned exactly; the two new test files added to `npm test` |
| `run-local.cmd` | The `test` target now runs the two new test files too |
| `src/components/helix3d-math.ts` | **New.** The helix math ported to TypeScript: positions, breathing, scroll ↔ progress, nearest artwork, travel, ≤ ½-turn flights, damped spring |
| `src/components/helix3d-layout.ts` | **New.** The callout layout ported, plus Miranda's rule: if no neighbour has room, the nearest one is placed in a free slot |
| `src/components/helix-gallery.tsx` | **New.** A small client shell. It checks for WebGL, then lazy-loads the scene (`next/dynamic`, `ssr:false`), and falls back to the static gallery on failure |
| `src/components/helix3d-scene.tsx` | **New.** The three.js scene and its dock: picker, Previous/Next, Pause/Resume, the live region, the active card, neighbour cards, leader lines, the phone scrim and the return context |
| `src/components/helix3d.css` | **New.** Styles scoped to `.helix3d` / `h3d-*` |
| `src/components/gallery.tsx` | The helix layout now uses `HelixGallery`. The grid markup is now `ArtworkList`, used by /grid and as the static fallback inside `.h3d-static`. A `<noscript>` style rule shows that fallback without JavaScript. The layout note text changed. `TravelingDna` (2D) is kept in the repo; swapping one line reverts to it |
| `src/app/layout.tsx` | Imports `helix3d.css` |
| `tests/helix3d-math.test.ts`, `tests/helix3d-layout.test.ts` | **New.** 13 tests |
| `qa-3d/p2_check.py` (+ `shots/`, `results*.json`, logs) | **New.** The browser checks used below |
| `backups/pre-p2-20261118/` | Copies of every changed file as `.bak` (the folder is not a git repo) |

Not changed: the content adapter (`src/content/gallery.ts`, used as is), the detail page, Grid/Connections/Saved/Info, `traveling-dna.tsx` and the other existing components. The P1 test hooks (`window.__dna`, `__perf`, `#a=` / `#still=`) are not in `src` (search of `src/components`: 0 matches). The page exposes only `data-active`, `data-progress`, `data-settled`, `data-mode` and `data-neighbours` on `.helix3d`, like the old `data-position`.

## Behaviour summary
- **States** (`.helix3d[data-state]`):
  - `pending`: the server render. With JavaScript it reserves the scroll height and hides the static list.
  - `3d`: the scene is mounted.
  - `static`: no WebGL, a failed scene chunk, or a lost WebGL context. The static list of six normal links shows, with grid-style focus restore.
- **Stage:** sticky, the full viewport and full width. It starts under the transparent site header, which shows over the scene at the top of the page and scrolls away normally. Scroll progress is measured from the top of the section; scrolling is passive and never hijacked, and the animation never scrolls the page.
- **Return context:** the active card stores `{id, y, index}` under `dna-gallery-return:helix`, the existing key. Back, bfcache restore, `#artwork-<id>` and the detail page's own back link (`/helix#artwork-sample-00N`) all restore the artwork and focus the active card.
- **Motion:** Pause is stored per session under the existing `dna-gallery-motion-paused` key. Under OS reduced motion the page always starts in "Resume motion", and pressing the button enables motion until reload; that choice is not stored.

## Checks (2026-11-18)
| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Build | **pass** (Next 16.4.5, Turbopack); /gallery and /helix are prerendered | `qa-3d/build.log` |
| 2 | Typecheck | **pass** (0 errors) | `qa-3d/typecheck.log` |
| 3 | Tests | **43/43 pass**: the existing 30 plus 13 new | `qa-3d/test.log` |
| 4 | npm audit | **0 vulnerabilities** | `qa-3d/audit.log` |
| 5 | Layout: all 6 artworks at 1920×1080, 1440×900, 1366×768, 1280×720, 1024×768, 768×1024, 390×844, plus 360×740 (Miranda's phone check) | **48/48 pass.** Correct artwork active; **≥ 1 neighbour visible every time**; 0 cards overlapping each other, the header, the dock, the intro text or the active card; nothing outside the viewport; no horizontal overflow; no anchor dot over the intro text; the phone scrim covers the headline at both phone sizes | `qa-3d/results.json` → `layout`; `qa-3d/shots/<size>-a01/a03/a06.png` |
| 6 | Selection | **6/6 by real mouse wheel**, 2/2 between positions (0.4 → 03, 0.6 → 04), **6/6 by picker** (correct artwork, camera within 0.005, page at the slot, focus stays on the pressed button, exactly one `aria-current`) | `results.json` → `selection` |
| 7 | Previous/Next | Focus stays on the pressed button; live region "04 of 06, Little waves". ArrowRight on the active card: 03 → 04. Page not moved by 2.5 s of idle animation | same |
| 8 | Tab order | Skip to content → DNA gallery home → Gallery → Saved → Info → "View artwork: …" → Previous → 01 Soft orbit … 06 Afterglow → Next → Pause motion → (collection links). **0 neighbour cards focusable** (`aria-hidden`, `tabindex=-1`). Picker names "03 Daylight", title "Daylight" | `results.json` → `keyboard` |
| 9 | Pause / Resume | Label, `aria-label`, `title`, icon (bars/play SVG) and fill change together; **no `aria-pressed`**; the pause is remembered on reload in the same session. With OS reduced motion: starts "Resume motion", pressing gives "Pause motion", reload gives "Resume motion" again | `results.json` → `pause`; `shots/1440x900-paused.png` |
| 10 | three.js only on the 3D pages | three chunk (≈ 558 KB uncompressed) loaded on /gallery and /helix only; **not** on /grid, /info, /connections, /saved or detail pages | `results.json` → `bundles` |
| 11 | No WebGL (`--disable-webgl`) | `data-state=static`, 6 visible static links, no canvas, three.js not downloaded | `results.json` → `fallback`; `shots/no-webgl-1366x768.png` |
| 12 | Return context | Active card → detail → Back gives artwork 04 active and focus on the card; `#artwork-sample-005` gives 05; the detail back link `/helix#artwork-sample-004` gives 04 | `results.json` → `return` |
| 13 | Console errors | **0 from the app.** The only message is the browser's own `/favicon.ico` request, 404 once per new browser. The app has no favicon; this is not from P2 | `p2_check.log` |
| 14 | Frame rate, visible Edge window, 1366×768, Intel UHD (D3D11); the display refreshes at ≈ 145 Hz | Travel (wheel): median **7.1 ms**, p95 16.2, worst 56, 2.7 % of frames over 20 ms. Flights: median **7.1 ms**, p95 14.3, worst 19.1. Breathing: every other frame by design (13.9 ms), worst 16. At 60 Hz each frame has 16.7 ms; median frames use under half of that | `qa-3d/results-fps-visible.json` (measured on the build before the last two CSS-only fixes; the engine is unchanged) |

## Open items and findings
1. **Pre-existing, not caused by P2: without JavaScript the app shows only "Gathering the collection…".** This happens on /gallery, and equally on /grid and the detail pages; verified with Edge's real JavaScript-off setting. `src/app/loading.tsx` makes Next stream the page content into `<div hidden id="S:0">`, which only a script reveals. P2's own fallback works: with that one `hidden` attribute removed, the JS-off page shows all 6 static links (`results.json` → `fallback.noJS`). Suggested fix, for the app owner to decide: remove `src/app/loading.tsx`, or move it to the dynamic routes only. I did not change it because it affects every route.
2. **For Miranda:** the site header is in the normal page flow. It shows over the scene at the top of the page and scrolls away once you start travelling, while the stage stays. Her mockups show it at the top only, so please confirm this is fine.
3. **For Miranda:** on the helix layout, "The collection", the DNA flow / Grid / Connections switch and Search now come after the 3D section, not above it.
4. **Lighting migration:** three r155+ dropped legacy light units. To keep the approved r147 look the scene uses intensities ×π and `ColorManagement.enabled = false`. Each pearl material now gets its own shader program (`customProgramCacheKey`), so strand, rung and active-rung sheen strengths really differ. In P1 they may have shared one program, so the sheen can look slightly stronger. Please check the look in QA.
5. **Not tested:** a screen reader (the live region and names were checked from the DOM only), touch hardware, Firefox/Safari, a 60 Hz display, and a slow network (the chunk loading state shows the intro only).

## Fix round (2026-11-18) — Miranda's P2-DESIGN-REVIEW and Security P3-SECURITY
Backups of every changed file: `backups/pre-p2fix-20261118/`. Build `.next/BUILD_ID` = `oz1kjvUzk5co_PUrJu6mW`. The checks ran on my own temporary server at 127.0.0.1:3100, which I stopped afterwards. Port 3000 was not touched; nothing was deployed or pushed.

| # | Change | Check |
|---|---|---|
| M1 look | **Cause:** the ribbon triangles faced inward, so the inner wall was rendered. P1's computed normals were also inward, which cancelled that out; my hand-computed outward normals then made the visible wall back-lit (lavender-grey, no yellow, dark edge line, looked thin). **Fix:** the ribbon winding now faces outward, matching the outward normals. Strand sheen is 0.62, the same as the rungs. The cross-section (0.08 + 0.5·sw², 0.07 + 0.03·sw) and the lavender-up / yellow-down tint code (`normal.y·0.6 + 0.5`) were already the mockup's and are unchanged | `qa-3d/shots/look-compare-mockup-vs-p2fix-1440x900.png` (approved mockup next to P2, artwork 03, still pose, 1440×900) and `p2fix-1440x900-a03-still.png`. Cream clay strands, lavender at glancing edges, no edge line. The yellow underside is subtle in this pose; Miranda will recheck |
| M2 no JavaScript | `src/app/loading.tsx` **removed**, the global "Gathering the collection…" screen. No route needed a loading state; the dynamic routes (/connections, detail) render on the server from fixtures | Real JS-off Edge: /gallery, /helix, /grid, /connections, /saved, /info and /artwork/daylight all show their h1 and content inside `main` above the footer. The gallery routes show 6 visible artwork links, there is no loading text and no hidden stream block (`results.json` → `fallback.noJS`; `shots/no-js-*.png`) |
| N1 | `/gallery` intro gains "Grid view · Connections · Search" (13 px, underlined). Search is `#study-search-input` (works without JavaScript); with JavaScript it also focuses the field. The intro now comes before the scene in reading order, so these links follow the header nav in Tab order; the active card moves down automatically | Tab: … Info → Grid view → Connections → Search → View artwork … 48/48 layout passes |
| N2 | Phone: leader lines and dots are clipped below the headline zone (intro bottom + 8 px). The SVG markup is built from numbers only, as Security asked | 390×844 and 360×740: 0 problems |
| N3 | Picker at 360 px: **36 px does not fit.** Six 36 px buttons plus three 40–44 px controls need about 366 px, and the dock is 320 px. At ≤ 380 px the side buttons are now 40×44 px with a 4 px gap, so the picker buttons get about 31×44 px (was 28). All stay above 24 px (WCAG 2.5.8) | 360×740: 0 problems |
| N4 | The active card's focus ring is now on the "View artwork" pill only (3 px ink, 3 px offset; ink on cream ≈ 13:1), no longer around the whole card | CSS; Tab check |

Security notes respected: `svg.innerHTML` holds numbers only (the new clip rect too). No CSP/headers added (deferred to the deployment decision).
Re-run on the fixed build: build, typecheck and 43/43 tests pass. Layout 48/48 (8 sizes × 6 artworks: 0 overlaps, ≥ 1 neighbour). Selection: wheel 6/6, picker 6/6, between positions 2/2. Pause/Resume, return context, three.js only on /gallery and /helix, and the no-WebGL fallback all unchanged and passing (`qa-3d/p2_check.log`, `results.json`). Console: only the browser's `/favicon.ico` 404 (the app has no favicon).


## P4 local preview and rollback (Bob, 2026-11-18)

Preview: http://127.0.0.1:3000/ (redirects to `/gallery`), production build `.next/BUILD_ID` = `oz1kjvUzk5co_PUrJu6mW`. The server is the node process whose PID is in `server.pid`, bound to 127.0.0.1 only; output goes to `server.log` / `server-error.log`. Nothing was deployed or pushed and there is no tunnel.

**Stop the server** (only this one process):

```powershell
Stop-Process -Id (Get-Content server.pid)
```

**Restart:** `Start-Process cmd.exe -ArgumentList '/c','"<full path>\run-local.cmd" start' -WindowStyle Hidden -RedirectStandardOutput server.log -RedirectStandardError server-error.log`, then write the PID of the listener on port 3000 to `server.pid`.

**Roll back to the pre-P2 (2D) gallery** if the 3D version is rejected. Stop the server first, then from this folder:

```powershell
# 1. Restore the files P2 changed (pre-P2 originals)
$b = 'backups\pre-p2-20261118'
Get-ChildItem $b -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring((Resolve-Path $b).Path.Length + 1) -replace '\.bak$',''
  Copy-Item $_.FullName $rel -Force
}
# 2. Delete the files P2 added (they import three.js and would break the build)
Remove-Item src\components\helix-gallery.tsx, src\components\helix3d-layout.ts, src\components\helix3d-math.ts, src\components\helix3d-scene.tsx, src\components\helix3d.css -ErrorAction SilentlyContinue
# 3. Make node_modules match the restored lockfile (drops three.js), rebuild, restart
.\run-local.cmd npm ci
.\run-local.cmd build
```

Then restart the server as above. `backups\pre-p2fix-20261118\` holds the files as they were just before the P2 fix round (`loading.tsx`, `gallery.tsx`, `helix-gallery.tsx`, `helix3d-layout.ts`, `helix3d-scene.tsx`, `helix3d.css`, `P2-QA.md`). Use it only to step back to the pre-fix 3D version: copy each file back without `.bak`. Do not apply it on top of the pre-P2 restore. Both backup folders stay untouched by the steps above.
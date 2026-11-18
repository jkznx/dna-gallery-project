> Historical revision evidence below. Current traveling-card sketch revision: see [TRAVEL-QA.md](TRAVEL-QA.md).

# 3D DNA ladder — integrated engineering handoff

2026-11-09, Asia/Bangkok. Local only: http://127.0.0.1:3000/helix; comparison http://127.0.0.1:3000/grid. Current reference-integrated process **29668**, production BUILD_ID **v42Ys3gQJ5TBP2vwGjLMl**. Read `server.pid` and verify process identity before stopping anything. No further app source changes are planned pending independent findings. See REFERENCE-INTEGRATION.md for the user's later visual reference, its inspection limits, bounded two-lane flow and **11-test** verification; the base V3 evidence below predates that small pose refinement.

## Delivered behavior

One large, unrotated, contain-fit design occupies the center of a sticky stage. Six much smaller numbered previews sit on the sides/rungs of a double helix. Perspective projection moves both strands, cross-rungs and connecting lines as ordinary vertical scrolling advances/reverses; CSS perspective and individual preview yaw/depth make the small designs spatial. The center contains exactly one image node; there is no overlapping pair of dominant images during promotion.

Discrete selection uses a 0.58-design dead band in either direction to avoid midpoint flicker. Preview buttons and Previous/Next select without changing scroll position; subsequent scroll continues relative to that selection. Merely focusing a preview does not select it or invoke scrolling. A separate View design link opens the existing detail page. Position is announced as “n of 6.” List/source order stays 01 through 06.

Pause and reduced motion present the complete static gallery with six native detail links. Resuming preserves the selected design. No-JavaScript markup renders that same complete gallery; its selection controls are disabled, but detail links work. Static mode has no 3D transforms or sticky scroll spacer. The prior trace implementation remains in separate `helix-motion.tsx/.css` and `helix-math.ts` files, unused by `/helix`, so it is reversible without reconstructing old source.

## Verification

- Final production build passed, strict typecheck passed, **10/10 tests** passed. Five current ladder tests cover forward/reverse reachability, selection hysteresis, manual selection offsets, bounded perspective geometry and resize/font lead-in preservation. Two content tests and three retained-trace tests also pass.
- Rendered desktop1440 and mobile360 scrolling visited `0,1,2,3,4,5,4,3,2,1,0` in order. Every settled sample had exactly one center image; all six titles matched their selection. An initial lead-in measurement error was found and fixed, with a regression test preserving the unbounded timeline before the stage.
- At requested widths320/360/768/1440, `/helix` has no horizontal overflow or preview overlap with the main image. Sample center/maximum-preview widths: 320→152.8/~47.9px; 360→192.8/~48.9px; 768→352.3/~75.8px; 1440→480/~123.7px. The center uses `object-fit:contain`; perspective computes to1200px and preview transforms are actual `matrix3d` values. `/grid` retains its six-item layout and tested responsive fit.
- Preview click and Next control at desktop kept scrollY800 while changing the active index. Tab from Soft orbit to In between left index0 and scrollY800; Enter then selected index1 at the same scroll position. A 3D-parent hit-testing issue was found and fixed by leaving the preview list pointerless while buttons explicitly accept input.
- Detail View design opened the selected slug. Explicit return selected/focused the corresponding preview and kept the large center visible. At360, Daylight return selected index2 with the center block top155.85/bottom520.95 in an800px viewport. Browser history from manually selected Growing room restored index4/focus and exact saved scrollY1543.19995, including its numeric manual timeline offset.
- Both fresh fragment load and same-document hash changes were tested. `/helix#artwork-sample-005` selects/focuses Growing room; changing to `#artwork-sample-002` selects/focuses In between. Only explicit fragment/history navigation restores a scroll destination; animation, preview focus and manual selection never do so.
- Resize preserves active selection: index5 survived320→360; index2 survived360→768→1440. Native PageDown then PageUp moved selection2→3→2, with scrollY1831.2→956.8 and position3.0949→2.0000; no key/wheel interception or scroll snapping is used.
- Pause showed six static detail links, no center feature and `transform:none` on all six list items; toggle focus remained on the native motion control. Selecting Afterglow, pausing and resuming preserved index5. Dynamic reduced-motion emulation showed the explanatory disabled system-off button, six static links, no center feature, all transforms none and no horizontal overflow. An actual OS preference change was not tested.
- Final HTTP200 response includes `data-mode="static"`, the complete ladder SVG and six `ladder-static-view` native links. This is server-response/source evidence for no-JS fallback; an actual JavaScript-disabled browser run remains unchecked.
- No console errors/hydration errors surfaced in completed smoke checks. Rapid source/viewport changes can log image preload-not-used warnings; image loads completed and no failed-image state was observed. CPU/GPU performance was not profiled.

## Screenshot evidence

Browser screenshots were captured and visually inspected at1440,320 and360px. They show one dominant contain-fit design, small tilted side/rung previews, complete controls and visible ladder depth. Final desktop1440 and mobile360 screenshots show Daylight centered with preview03 marked selected. They are image items in the engineering browser tool history, not standalone exported PNG files; the browser screenshot interface supplies image content without a file-export parameter. The persistent engineering review tab is `ef056243-3348-49a0-a699-5a6eade75cff`; it remains on the live gallery for read-only inspection if shared tab access is available. Reviewers can also reproduce from the loopback URL.

## Source and review gate

Current files: `src/components/dna-ladder.tsx`, `dna-ladder.css`, `ladder-math.ts`, `tests/ladder.test.ts`, with integration in `gallery.tsx` and CSS import in `app/layout.tsx`. No dependency, backend, authentication, service, purchase, deployment or publication was added. Existing fixture labels and provisional palette/fonts are preserved.

Source SHA256:

- dna-ladder.tsx: `BCD0C3DC1DBB3589581D5AD4F77A5CA20B33F5B4C128E0E47FA5508D33FC3F76`
- dna-ladder.css: `8B65BBF1236A00B2400D190C11F149DC3FC0FBA5592CA9FAAB0A811175953F81`
- ladder-math.ts: `5EC80A7EA0D7B1B64D18459F4AFFE8B3C8A77C431154B4AF92B233077DBAC770`

Miranda and Security Reviewer have been given the final artifact identity and deltas. Their 3D-specific final reviews are pending; prior trace reviews are historical evidence, not approval of this increment.

V3 security update: Security Reviewer inspected fixture-validated fragments/history, finite numeric saved state, numeric selectors, listener cleanup and static pause/reduced content, reporting no confirmed security finding. Their bounded-preview-pose and explicit-restoration-cancellation addenda are complete, with no confirmed findings and the final source hash matched. They did not independently run build/typecheck/tests. Miranda's initial V3 matrix found the already-fixed old-artifact pointer/badge issues; current-build independent closure is pending.

Still unchecked: actual screen-reader output, physical touch/wheel/OS preference, other browser engines, 200% text/custom spacing on this new stage, forced missing/error/empty states, performance profiling and real mixed-ratio user artwork. All content is sample content; visual/content/publishing choices remain with the user/PM.

Local writes include app source/styles/tests/docs, `.next`, TypeScript info and local server logs/PID. Browser storage contains only the paused boolean and the existing artwork ID/scroll return record with a numeric timeline offset. No private data or credentials.

Reference: [MDN perspective](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/perspective), [MDN transform-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-style), [MDN position/sticky](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position). Perspective is scoped inside the sticky scene; sticky ancestors are not transformed, and no grouping opacity is applied to the preserve-3d preview list.

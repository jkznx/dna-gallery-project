# Traveling-card DNA - sketch revision

## Larger DNA sizing increment — 2026-11-09

Current local runtime: PID49556, production BUILD_ID `gvxzLLKTm152wtTTzae-i`, http://127.0.0.1:3000/helix. This sizing increment supersedes the runtime identities below; earlier evidence remains historical.

User requested a larger DNA composition. Desktop helix radius cap is now300px (previously220); compact radius .28 of canvas width (previously.26). Main card frame cap is500px (previously420), its width fraction .82 (previously.76), and height fraction .60 (previously.56). Strands/rungs now5px/4px (previously4px/3px). The canvas height and sticky control layout are unchanged so controls remain reachable. Responsive image sizes match the larger frame.

PM directly ran production build, strict TypeScript and17/17 existing tests successfully. Existing101-phase geometry checks across four canvas sizes confirm separate in-bounds selectable cards at the new proportions. An initial larger trial failed separation/bounds checks; it was reduced to these passing proportions before release.

Fresh-loaded browser check of the new production artifact: desktop main frame approximately500x250px at1536x743 with5px strands, three visible card centers correctly hit-test, no horizontal overflow and footer bottom712px inside viewport. At320x800, all six numbered selectors work, settled main approximately217x269px, visible card centers hit correctly, no horizontal overflow, footer bottom780px. At768x1000, selected Daylight approximately500x336px, three visible card centers hit, no overflow; pause exposes six native links with all card transforms none. Tests are sampled Chromium/embedded-browser checks, not physical-device or screen-reader results. Prior independent security/UX acceptance predates this numeric/style-only sizing change; no new security verdict is claimed.

PM changed three app files and this report, rebuilt `.next`/typecheck output, and restarted only the verified gallery server. No dependencies, services, accounts, deployment or system settings changed. Server logs/PID were updated. Broader device/engine/zoom/failure/performance tests remain unverified.

## Frozen runtime

- Local review: http://127.0.0.1:3000/helix ; comparison: /grid
- PID: 48216 (read server.pid and verify process before stopping; IDs can be reused).
- Production BUILD_ID: uQcrMLPtZ03SaqscuRF2p. Final engineering correction supersedes PID23440 / JNSZzaCnvYVuUXx-HHV17; that geometry evidence remains applicable, but identity is historical.
- Previous V3 PID29668 / v42Ys3gQJ5TBP2vwGjLMl is historical. Previous dna-ladder and helix-motion sources remain reversibly available, not mounted.

## Behavior and scope

The supplied sketch guides actual-card travel on TWO crossing strands, not just a central image swap. Each fixture has one persistent Image node; it follows position/depth/scale down the curve as the document scrolls, grows forward, then recedes. Reverse scroll reverses travel. Rungs and card centers derive from shared projected geometry. Main fitting is contain, with zero yaw at full promotion. Palette/typography/sample labels remain unchanged; sketch annotation colors were not adopted.

Normal document scroll drives continuous progress. After 180ms idle, a finite 220ms visual settle promotes the selected artwork without moving document scroll; raw document position remains available so repeated small gestures accumulate. No wheel capture, automatic scrolling for animation, or idle spin. Explicit fragment/history navigation can restore scroll as requested by navigation.

The viewport shows a moving window of nearby artworks, not all six at once. Fully visible cards can be activated; partially departing/offscreen cards leave the tab sequence. If a focused card departs, its same-design fixed picker receives focus without scrolling. The fixed numbered picker and Previous/Next reach all six; View design is separate. Pause, reduced motion and no-JS server rendering provide all six static artwork detail links.

## Source and checks

- Current: src/components/traveling-dna.tsx, traveling-dna.css, travel-math.ts; integration gallery.tsx and app/layout.tsx.
- Tests: tests/travel.test.ts plus existing content/ladder/trace math tests.
- Build completed and generated the above production artifact and prerender manifest; live production server serves HTTP200. Typecheck rerun successfully; 17/17 tests passed after final code.
- Tests cover same-card downward promotion/recession/reversal, one fully promoted card per resting index, shared rung endpoints, projected nonoverlapping hit areas at 101 phases across four canvas widths, finite settle, directional following, selection dead band, resize, and content safety.
- run-local.cmd build / typecheck / test / start use existing cached Node without changing PATH or execution policy. No new dependencies/services.

## Engineering rendered observations

- Desktop1440x1000: all six forward then reverse selections, one promoted design, elementFromPoint hits on all fully visible cards, no horizontal overflow.
- Same Daylight Image node and src retained while measured width/height changes from about86x72 to420x314 then91x72, reverse returns corresponding states; only six artwork image nodes, no separate central hero.
- 320x800: all six forward/reverse active indices reached, visible-card center hits pass, no overflow; trusted selection of Daylight then neighboring Little waves changes selection without document scrolling. Some batch samples preceded finite settle; independent review requested for real-idle timing and repeated small gestures.
- 768x1000: all six trusted numbered selections, one promoted card and all fully visible card centers hit, no overflow.
- 360x800: explicit Daylight detail return restored /helix#artwork-sample-003 and focus Select Daylight; no overflow. Pause shows six native links and computed transforms none on every card.
- Resize360/768/1440 retained selected artwork. System reduced-motion media query true gives static mode, system-off label and six links.
- No-JS fallback verified in raw HTTP HTML: data-mode static, six travel-card entries and six travel-static-view native links. This is server-output/source evidence, not a separate JS-disabled browser run.
- Mobile320 and desktop1440 screenshots captured and visually inspected through browser screenshot results: narrow vertical connected helix, one contained foreground design, small designs above/below, readable controls. Screenshot tool supplies conversation images, not exported local PNG files.
- Nonfatal unused responsive-image preload warning appeared after viewport/navigation changes. No hydration error observed in sampled snapshots; server-error.log empty.

## Independent review and limits

Miranda has a targeted rendered review request for THIS exact frozen artifact, including real-idle settling, repeated small gestures, all viewports, trusted rear/crossing hits and navigation. Security Reviewer has a source-delta request for geometry, timers/cleanup, focus handling and storage. Their earlier V3 verdicts do not approve this new implementation. Results are pending at this handoff.

Physical touch, screen readers, actual browser text zoom, cross-browser/device performance, mixed-proportion real images, error fixtures and full JS-disabled rendered navigation remain unverified. Browser-history and keyboard PageDown/PageUp for THIS revision await the targeted acceptance review. No backend, auth, upload, private-content policy, deployment or production sign-off exists.

## Local writes

New component/math/CSS/tests and integration; README and this report; historical evidence banners in QA.md/LADDER-QA.md/REFERENCE-INTEGRATION.md. Build/typecheck write .next and tsconfig.tsbuildinfo; review runtime writes ignored server.pid/server.log/server-error.log. No system settings, services, purchases or publication changed.

## Independent security result

Security Reviewer inspected traveling-dna.tsx/.css, travel-math.ts, gallery.tsx and tests/travel.test.ts read-only and reported no confirmed findings. They verified timer/frame/listener cleanup, focus transfer before hiding a card, exact fixture hash lookup, same-tab fixture/numeric return state, numeric SVG/CSS rendering and accessible static links. They did not independently rerun build/tests. Rendered acceptance remains pending.

## Final timing correction and acceptance scope

Miranda's rendered-review request failed before they answered because their provider usage limit was reached. No independent rendered acceptance is claimed for this revision. Engineering completed additional checks instead; no user action is needed to use the local MVP.

A real small-gesture check found that throttled paint frames could cause idle settling to retain the old active design despite accumulated raw progress crossing the next threshold. Final source delta: beginSettling calculates its selection target from raw document progress before starting the finite visual tween. This adds no listeners, storage, dependencies or rendering inputs. Security Reviewer's no-finding source verdict predates this small numeric selection correction; they did not review the final delta separately.

Final artifact PID48216 / uQcrMLPtZ03SaqscuRF2p: production build, strict typecheck and17/17 tests passed. Five80px gestures accumulated raw2.3970/2.4935/2.5900/2.6865/2.7831; active advances2/2/3/3/3 and settles at integer positions with no added document scroll. This closes the observed timing defect.

Final320: all six forward/reverse document-scroll selections passed (indices0,1,2,3,4,5,4,3,2,1,0). All six numbered selections forward/reverse each have exactly one scale>.99 card, no overflow and true elementFromPoint hits for fully visible cards. A trusted rear Little waves click promotes index3. Browser-history Back from Growing room detail restores index4, focused Select Growing room and visible design. PageDown advanced index3 to4 with ordinary document scroll; the batched PageUp observation was inconclusive and is not claimed as a pass. Previous/current geometry matrix at360/768/1440 remains scoped to the preceding artifact; final code changes only raw idle-target selection, not geometry/styles.

The final application remains frozen at the identity above. Screen reader, physical touch, cross-browser performance, a separate JS-disabled browser run and independent rendered acceptance remain limitations. Only reports were changed after this final build.

## Source/build reconciliation - 2026-11-09

Readback confirms current PID48216 / BUILD_ID uQcrMLPtZ03SaqscuRF2p. traveling-dna.tsx timestamp09:38:03 precedes BUILD_ID09:38:24 and helix.html09:38:26. The current emitted client chunk .next/static/chunks/427do7ikdo9gx.js contains beginSettling's raw-progress selection (function B calls selection helper l on scroll helper a before assigning tween S). This confirms the final timing correction is compiled into the frozen artifact, rather than merely present in source. No rebuild/restart was performed for reconciliation. Typecheck and17/17 tests were rerun successfully after reading current source.

SHA256 current sources:
- traveling-dna.tsx: F6C0D200C6EDE52B1A2DD3C8F255F45E733180777653D7EFCEB4F0C553CC3BF6
- travel-math.ts: 51FEA60E4F5CBB41B719751BE2A7E08989DE9D2FDF28394999F84FFFC5F8A617
- traveling-dna.css: 60121A1D803B0D959C885F60EC0E84359EE8AE6AEECD89428BE8A1C1E1831F44

JNSZ evidence:320/360/768/1440 geometry/hits/reflow, image-node proof, pause/reduced, explicit return, screenshot observations. Current uQcr evidence: final build/typecheck17tests; repeated small gestures crossing selection threshold;320 all6 forward/reverse scrolling and numbered selections, visible hit targets, rear trusted activation; history Growing room return; PageDown. No fresh full four-viewport independent acceptance is claimed. Source/style geometry is unchanged between those artifacts; only raw idle target selection changed.

PM reports Security Reviewer subsequently found no confirmed findings in current source; the exact reviewed hash was not supplied to engineering. A focused security delta, if their read predates09:38:03, is only beginSettling's raw scrollDesignPosition + settledDesign target calculation and active state assignment before the existing tween. It introduces no input source/sink, listener, storage or cleanup change. Match the hash above to establish exact review scope. Miranda and PM received the current frozen identity; no independent rendered review result has been received.

Miranda later supplied historical JNSZ rendered results: geometry/hits/contain/static/keyboard/fragment/history sampled checks passed across320/360/768/1440. Their direct4.2 raw jump settling at visual2 reproduces the same stale-target defect fixed in current uQcr. This is prior-artifact evidence; focused current-build confirmation remains pending. Their earlier provider failure did not constitute a review result.

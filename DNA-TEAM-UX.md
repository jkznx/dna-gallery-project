# DNA team UX/accessibility review

## 11 November 2026 — Connections revision

Reviewer: Dr. Miranda. Task: independent read-only review of Connections, filtered/related detail returns, and retained traveling DNA. Local browser only; no application changes, builds, restarts, deployment, or new assets.

### Verdict and artifact boundary

**Partial: no confirmed defect in sampled loaded-page checks; current-artifact acceptance awaits build reconciliation.** This is a sampled accessibility audit, not a WCAG conformance statement.

- At the start, independently read `server.pid = 8388`, `.next/BUILD_ID = A5vePUKPIcMHTE1gWfXJt`, and live Node PID 8388.
- At the end, independently read `server.pid = 33960`, `.next/BUILD_ID = B1CV2YVN1gS0ew12I5X9Q`. PID 8388 had exited. Live Node PID 33960 reports start time 11 November 2026, 21:59:09 Bangkok (14:59:09 UTC).
- Browser work spanned approximately 14:57–15:03 UTC. Navigations therefore crossed a server replacement. Initial Connections desktop inspection belongs to the originally loaded client. Later loaded pages passed the checks below, but the entire matrix cannot be attributed to one frozen artifact.
- `GRAPH-ENGINEERING.md` still names the original A5ve/PID8388 build at final read. Requested exact delta/current frozen identity from Ultron, message `a8cfeb9a-795c-4a73-81f9-aee5cff5b819`. No response received when this section was written.
- The current error log was empty at final read. This is only a log observation, not proof of whole-session runtime health.

### Independently observed Connections behavior

All eight filter links were activated. Counts and result headings agreed: Yellow 4; Cream 3; Plum 4; Lavender 6; Round forms 3; Flowing curves 3; Botanical forms 1; Rhythm & repetition 2. All studies contained six artworks. Round forms contained Soft orbit, Daylight, Afterglow. Botanical forms contained Growing room.

These URLs recovered without a broken page:

- `?concept=missing`: six studies, All studies current, explanatory notice.
- `?concept=yellow&concept=plum`: same safe recovery and notice.
- `?concept=round-forms&concept=round-forms`: same recovery and notice (duplicate values are treated as ambiguous, not as a single filter).
- `?concept=`: six studies, All studies current, no unnecessary invalid-filter notice.
- `?concept=%3Cscript%3E`: six studies and notice; no script execution was observed. This was a display/recovery check, not a security assessment.

Filtered return samples:

- Desktop: Round forms → Soft orbit → related Daylight → Back to connections returned to `?concept=round-forms` and three matching studies.
- 320: Botanical forms → Growing room → related Soft orbit → Back to connections returned to `?concept=botanical` and Growing room as the sole study.
- 360: Yellow → Soft orbit → related Growing room → Back to connections retained `?concept=yellow` and four studies.
- 768: Round forms → Daylight → Back to connections retained Round forms.
- Native browser Back from Soft orbit also returned to the Yellow filter with four studies at 320. Exact origin focus restoration was not established; browser focus was body after this return.
- Related paths kept the originating Connections filter even when a recommended study lay outside that filter. Its return link correctly led to the originating filtered results.
- DNA flow, Grid view and Connections were named native links with the current view indicated by `aria-current`. Grid navigation was exercised at 360.

### Responsive and accessibility observations

Requested viewport widths were 320, 360, 768 and 1440 CSS px. Browser `innerWidth` confirmed these widths. A desktop scrollbar reduced document client widths to 305, 345, 753 and 1425 respectively; browser snapshot viewport reporting rounded these differently. Comparisons used document `scrollWidth` against `clientWidth`.

| Width | Connections | Detail/other sampled paths |
| --- | --- | --- |
| 320 | One-column results; tab labels share a row; each view tab and filter at least 44px high; scrollWidth/clientWidth both 305 | Expanded evidence and filtered/related returns fit; traveling DNA controls and pause fit |
| 360 | One-column results; tab labels share a row; scrollWidth/clientWidth both 345 | Yellow related-return and Grid fit |
| 768 | Two-column Connections grid; tab labels share a row; scrollWidth/clientWidth both 753 | Three-column related studies and expanded disclosure fit; reduced-motion DNA static gallery fits |
| 1440 | Three-column Connections grid; tab labels share a row; scrollWidth/clientWidth both 1425 | Related returns and all-six DNA control sequence fit |

Keyboard path was sampled with trusted Tab/Enter/Space input. Initial desktop order: Skip to content → DNA home → Gallery → Info → DNA flow → Grid view → Connections → All studies → Yellow → Cream → Plum → Lavender → Round forms → Flowing curves → Botanical forms → Rhythm & repetition. Subsequent mobile Tabs reached artwork links and their concept links in DOM order. No trap was observed in the sampled sequence; this was not a full traversal of every repeated link.

Skip to content activated with Enter and moved focus to `main#main`. Yellow and Botanical filters activated with Enter. Focus outlines were visible in inspected desktop/mobile stops. Computed focus used dark plum solid outline (browser reported 2.4px after rendering), with an offset. Immediate geometry reads during smooth scroll were transient; settled sampled focus was within the viewport. A 320 screenshot showed Cream focused, with its complete ring visible and no covering header.

Native `details` disclosures started closed. Enter on the first `summary` opened the evidence, and Space closed it. Focus stayed on SUMMARY. At 320, its ring and source quotations were visibly readable in a screenshot. At 768, opening evidence did not cause horizontal overflow. Evidence showed both source artwork names and caption/description excerpts, with the sample-data qualification. The browser semantic snapshot did not enumerate SUMMARY controls and included some closed content in its text projection, so DOM state, trusted keyboard activation and screenshots were used together; snapshot text alone was not treated as evidence that closed content was visible.

Connections had `lang=en`, one H1, one results H2 and artwork H3s. All six initial artwork images loaded, had informative alt text and used contain fitting. Links had visible names; no unnamed interactive control was found in the sampled paths.

Computed color sample on Connections: cream body `rgb(255,246,215)`, dark plum text/focus `rgb(45,35,51)`, muted text `rgb(102,87,107)`, selected paper text `rgb(255,251,238)` on plum. Calculated contrast ratios: body text/focus against cream 13.87:1; muted against cream 6.18:1; selected text against plum 14.49:1. These samples exceed relevant text/focus thresholds; every visual state/color combination was not audited.

### Retained traveling DNA observations

- Six persistent image nodes, no detached image hero in the inspected traveling host. On desktop, retained in-memory node references remained identical through 0→5→0 and each Next/Previous step 1→2→3→4→5→4→3→2→1→0. Every resting selected card had scale 1, contain-fit image and bounds inside the viewport. Neighbor cards were smaller; for example at index 5 its selected bounds were 500×336 while adjacent visible index 4 measured approximately 110×77.
- Desktop trusted click on the smaller In between card from index 0 selected index 1. View design opened In between; the explicit return opened `/helix#artwork-sample-002`, restored index 1 and focused its card button.
- At 320, trusted picker clicks selected all six designs. Each settled selected card measured approximately 217×269, fully within the viewport; document scrollWidth/clientWidth remained 305. A reverse scroll from index 5 settled at 4. Clicking the selected actual Growing room card worked; this latter check does not establish a rear-card mobile hit test.
- Pause at 320 exposed six named static detail links; resume restored interactive mode. Pause was restored to its initial enabled-motion setting before leaving the test.
- At 768 with emulated system reduced motion, the gallery became static, exposed all six detail links, and disabled the motion toggle with the system-preference explanation. Reduced-motion emulation was restored to false afterward.
- No DNA source was changed. These are regression samples of the preserved same-card requirement, not a fresh exhaustive trajectory/crossing/overlap matrix.

### Findings, diagnostics, limits, and writes

No confirmed blocker, serious or minor accessibility defect from the checks above. Current-build acceptance remains pending because identity changed during review. No application fix was requested; Ultron was asked for reconciliation and a focused final retest scope.

Nonblocking image-preload warnings appeared after rapid navigation/resizing. No new application runtime exception appeared in the browser diagnostics observed. Two early scripted selectors used guessed concept IDs and found no element; the actual named links were then used successfully. These were test-selector errors, not product defects. One immediate post-navigation DOM read preceded render completion; the following settled snapshot confirmed the correct result.

Not tested: physical touch devices, screen-reader announcements, other browser engines, zoom/large text, fully JavaScript-disabled browser, all focus stops, all contrast states, exhaustive crossing targets, full natural-scroll forward/reverse on this revision, repeated small gestures, production load/performance, or relevance against real artwork. Reported engineering 22 tests/build/typecheck were not rerun; no build/typecheck cache was written by this review.

Only this evidence file was created. No application source, assets, build output or server lifecycle was changed. Browser navigation and temporary viewport/motion test state were used; no screenshot files or other temporary files were created.

## Focused reconciliation — live cVHl revision, 11 November 2026

**Focused current-build check completed: no confirmed defect in the sampled flows below.** The earlier mixed-client matrix remains historical and is not relabeled as a full current-build acceptance.

Ultron requested a focused check of frozen B1CV2YVN1gS0ew12I5X9Q/PID33960, describing an Info-only guard and generic artwork-group label. Before browser work began, that process had already been replaced. Independently read current `server.pid = 12124`, `.next/BUILD_ID = cVHl-3pI9bz5HTtkBm9sL`, live Node PID12124 with start time 22:05:02 Bangkok. Fresh HTTP navigation began after this read. The same build/PID were independently re-read at completion; identity remained stable throughout this focused pass (approximately 15:06–15:08 UTC).

The live revision contains more than the described Info-only delta: Connections now identifies original generated sample studies near the heading; results use matches/topic language; singleton links say Only in this study; ubiquitous topics explain their reach; filter and related evidence now names the concept, metadata field, matched token and source excerpt. Current source reads confirmed these changes in Connections, ArtworkConnections and ConnectionEvidence. Exact full diff/build provenance was not independently established. This pass therefore checked those visible additions as well as Info and the requested return/motion smoke.

Observed on the stable cVHl artifact:

- **Info at 320 and 1440:** three images loaded (Growing room, Soft orbit, Afterglow), informative alt text retained, generic group label Studies from the sample collection. No horizontal overflow: document clientWidth/scrollWidth 305/305 at 320 and 1425/1425 at 1440. Source filters undefined featured records before mapping. Sparse/empty adapters were not injected; their runtime case remains an engineering assertion, not a rendered result from this review.
- **320 filtered route:** Info Explore Connections → Enter on Round forms → Soft orbit → Enter on Why connected? → related Daylight → Back to connections returned to `?concept=round-forms`, three studies. Disclosure opened with SUMMARY focused. Detail and returned results had scrollWidth/clientWidth 305/305. The three view labels remained on one row and each measured 44px high.
- **320 invalid filter:** `?concept=missing` returned six studies and the explicit recovery notice.
- **320 Lavender:** six studies and This topic appears in all 6 studies. Evidence identified Lavender, Image description (alt), matched Lavender, followed by the source quotation; no overflow.
- **320 Botanical forms:** one Growing room result, 1 study matches, singleton label Botanical forms · Only in this study. Evidence identified Botanical forms, Image description (alt), matched stem and the relevant complete image description.
- **320 DNA:** six traveling cards/six image nodes. Trusted picker selected Afterglow, settled position/index5, image fitting contain; no overflow. Pause exposed six static detail links; resume returned to interactive mode. Initial motion preference restored.
- **768 reduced motion:** system emulation produced static DNA and six detail links; document widths 753/753. Fresh Connections Round forms showed three studies and labeled source evidence without overflow.
- **1440:** Connections Round forms retained three results and document widths 1425/1425. Info navigation and its three loaded artworks passed. Desktop viewport and reduced-motion=false were restored afterward.

No application exception appeared in the focused browser diagnostics; nonblocking image-preload warnings remained after navigation/resizing. No app writes, tests, builds, restarts, new assets or screenshot files. Only this evidence file was appended. The earlier physical-input, screen-reader, other-engine, zoom, sparse-data, exhaustive focus/contrast/crossing and performance limits still apply. The full four-width matrix, all-six same-node reference comparison, duplicate-filter suite and natural-scroll coverage were not repeated on cVHl.

### Final F1/F2/F4/F5/F7 closure on the same cVHl build

Following Ultron's explicit frozen cVHl reconciliation request, verified PID12124/build cVHl-3pI9bz5HTtkBm9sL remained current before and after the final bounded checks. No duplicate viewport matrix was run.

- **F1:** Fresh Botanical → Growing room → first Why connected? disclosure opened using Enter at 1440. Its Soft orbit recommendation rendered six separate evidence entries: Yellow/Cream/Lavender for each of Growing room and Soft orbit. Each names Image description (alt), preserves the actual case-sensitive literal matched token (for example yellow and Lavender), and includes the full corresponding source quotation. This supplements the earlier filtered-list evidence checks. Current graph SHA256 `5E6C9E3D2D0B629058BFD6A55D2D125FF19E6B6EEF3AAE928D9EAB9E9331F328` and evidence-component SHA256 `6FE14FBFFC517422FE5FAD1FA5DCAFB0B12685FBEB9BA52A01F507A237791AE6` independently match the handoff.
- **F2/F4/F5:** Covered by the preceding stable-cVHl rendered checks: Botanical singleton/matches wording, near-heading generated-sample disclosure, and Lavender universal-topic notice. These are current-build observations, not baseline acceptance transferred forward.
- **F7:** README line 13 matches the authoritative site-navigation.css variables and rendered computed variables: cream #fff6d7, paper #fffbee, lavender #dda9ef, yellow #f8ed94, ink #2d2333. Its separate Plum topic swatch #594061 matches the graph vocabulary. The historical globals.css defaults are explicitly distinguished in README.

Result: no confirmed defect in the requested bounded F1/F2/F4/F5/F7 scope. Prior documented device/accessibility/performance limits remain. Build/typecheck/23 tests and unchanged ranking are engineering-reported, not rerun by this review. Only this evidence file changed.

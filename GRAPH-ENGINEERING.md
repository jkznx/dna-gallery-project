# Artwork connections

## Design decision

Keep the large traveling DNA as the primary gallery. Add Connections as a third gallery view, with a quiet palette of cream #fff6d7, paper #fffbee, lavender #dda9ef, yellow #f8ed94 and plum #2d2333. Keep local Montserrat for navigation and artwork titles and Caveat for the existing handwritten accents. Use a left-aligned heading, wrapping topic links and an image-led results grid. The distinctive element remains the artwork and its visible shared thread; no new animation or generic dashboard metrics.

Review against the brief: a standalone node diagram would add complexity without helping visitors open artwork. Instead, expose useful graph paths as named concepts and related studies, with source excerpts available on demand. Keep the existing Gallery/Info navbar and DNA geometry.

## Implementation contract

Build an in-memory bipartite graph from the public content adapter: artwork nodes, concept nodes and evidence-bearing descriptor edges. Use a small explicit vocabulary over captions and alt descriptions. These editorial categories describe the sample metadata; they are not AI image analysis or claims about artists, dates or materials.

Two-hop recommendations follow artwork -> concept -> artwork. Weight a shared concept by inverse document frequency so ubiquitous lavender does not dominate distinctive forms. Show the matched concepts and exact metadata excerpts. Never recommend the artwork itself. Rebuild from the current adapter output; deleted artwork cannot survive as a stored edge. No new database, model, account, private data, or dependency.

Connections filters use shareable native links and server-rendered pages. Detail links preserve the existing layout return parameter. Unknown filters recover to the full collection with an explanation. Unmatched records remain visible under All studies.

## Verification — 11 November 2026

- Production build and strict TypeScript check passed. All 22 tests passed, including five graph tests for evidence, valid endpoints, ranking, identity collisions, content removal, empty results and deterministic rebuilding.
- Final production build: `A5vePUKPIcMHTE1gWfXJt`. Started locally on 127.0.0.1:3000 using hidden Node process 8388. No external deployment.
- Desktop browser: six studies/eight concepts; Round forms filters to Soft orbit, Daylight and Afterglow. Detail explanations show exact source excerpts. Following a related study and returning preserves the selected filter. Unknown filter recovers to all six. All six images loaded after scrolling.
- 320px browser: Botanical forms returns Growing room; detail evidence opens; Back to connections retains the filter. Keyboard Enter activates the Yellow filter and returns four studies. No horizontal overflow on Connections or detail. Fixed a narrow tab label wrap and verified all three view tabs remain on one line with 44px minimum height.
- 768px browser with reduced motion: Connections, Info, Grid and Gallery loaded without horizontal overflow. Gallery honored the static system preference. Desktop viewport restored after checking.
- Existing DNA smoke at 320px: selecting Afterglow works, pause exposes all six detail links, Connections navigation works. Test pause setting restored afterward. DNA motion source/geometry were not edited.
- Direct HTTP returned 200 with three server-rendered artwork links and source text for Round forms. This checks initial HTML; a fully JavaScript-disabled browser session was not exercised.
- No new application runtime errors observed during the final sampled flows. Rapid earlier navigation produced nonblocking image-preload warnings; an earlier connection-refused diagnostic belongs to the previously stopped preview. Physical devices, screen readers, other browser engines, production load, relevance on real artwork and performance benchmarks remain untested.

Changed files: graph module, Connections route, related-artwork component/styles, layout stylesheet import, gallery view links, detail return/navigation, Info guidance, test runners and five tests, README and this document. Build output/typecheck cache, `server.pid`, and `graph-server.log`/`graph-server-error.log` were also written. No dependencies or remote services were added.

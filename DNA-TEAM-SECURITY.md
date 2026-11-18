# DNA Connections security review

2026-11-11 — Critical: 0; High: 0; Medium: 0; Low: 0 confirmed findings.

No confirmed security vulnerability in the reviewed Connections/graph integration. This verdict applies to the public, six-fixture local gallery and the exact source hashes below. No security fix requested.

## Evidence and trust boundaries

- **Query and navigation:** `src/app/connections/page.tsx:9–13` accepts a concept only when a single string exactly matches the graph vocabulary. Unknown values and repeated parameters select the public collection and a fixed notice (`:17`), without reflecting the raw query. `src/app/artwork/[slug]/page.tsx:15–24` resolves artwork through the fixture adapter, returns not found for unknown slugs, restricts layout to helix/grid, and reconstructs return/navigation URLs from a fixed Connections flag and a matched concept ID. Related links consume that reconstructed query (`src/components/artwork-connections.tsx:13`); no user-supplied URL or navigation destination is forwarded.
- **Rendering and source disclosure:** `src/content/artwork-graph.ts:3–15,33–35` takes evidence exclusively from fixture alt/description fields using eight fixed expressions. Evidence is rendered as React text children (`src/app/connections/page.tsx:22`, `src/components/artwork-connections.tsx:14`), not interpreted HTML. Swatches and concept identifiers are fixed literals. `src/content/gallery.ts:12–26` contains six generated public samples with local image paths; the graph introduces no private data source, filesystem lookup, external fetch, or secret input. Showing full caption/alt evidence is intentional public metadata exposure.
- **Stale/nonpublic graph paths:** `src/content/artwork-graph.ts:26–41` allocates edges and ID sets afresh from supplied records, rejects duplicate IDs, and retains only concepts used by those records. Both route callers build from `listArtworks()` for the current render. There is no persisted graph index that can independently retain deleted artwork. This is source-level rebuild behavior, not verification of deployment cache invalidation. The current adapter has no draft/private records or publishing workflow.
- **Request work:** loops operate on six fixed artworks, eight vocabulary rules and at most 48 descriptor edges. Query parameters cannot enlarge that input, supply expressions, change traversal depth or control the recommendation limit. Related artwork uses the default limit of three (`src/components/artwork-connections.tsx:7`); its implementation filters existing records rather than recursively traversing input (`src/content/artwork-graph.ts:54–65`). Repeated edge scans would need a separate performance assessment for a future large collection; no present attacker-controlled amplification path was found.
- **Related integration:** reviewed gallery links, shared stylesheet import, Connections styles and the existing grid focus-return helper. Connections adds server-rendered links and evidence disclosure, with no new browser storage, DOM HTML construction, backend or network integration.

## Checks run

Read the Secure Code Guidance skill, `GRAPH-ENGINEERING.md`, the scoped source/callers, `tests/artwork-graph.test.ts`, `tests/content.test.ts`, package manifest and Next configuration. Searched source/tests for graph consumers, query/navigation construction, HTML injection sinks and external request calls. Calculated SHA-256 file hashes using `Get-FileHash` and read `.next/BUILD_ID`, which is `A5vePUKPIcMHTE1gWfXJt`, matching the supplied baseline. Reading that file does not prove which source produced the build or which process serves it.

The five graph tests were inspected, not executed. Their assertions cover exact public evidence/valid endpoints, ranking/self-exclusion, removed/edited records, unknown IDs/invalid limits/empty input, duplicate IDs and deterministic rankings (`tests/artwork-graph.test.ts:6–62`). Route query-array handling and rendered escaping were assessed from source; these tests do not independently exercise those routes.

## Exact source hashes (SHA-256)

```text
src/content/artwork-graph.ts CE03F72C47BDD9122B0AF3FEBE9E5A2D615DB919A119ADDB31AC868BF40D55A3
src/app/connections/page.tsx B006FA96D3C10D288A27C41C25280E1B8C172443132675C36E974CFF5A5EBEF9
src/components/artwork-connections.tsx E1E492166A946D6E37E4C253A4DA35E06726B0CF0C29A46E78A2A47D5EA9BEF6
src/app/artwork/[slug]/page.tsx 70F72DDFBCED192FCCEA00FE989CCBE87C3A886B2438F742D899F7DE96D5E0BF
src/content/gallery.ts E714431D680C071F9F2C6FD04D3DF5FFA83BC528C0800BB777B2C1B54B7C4E09
src/components/gallery.tsx 255B3F5AC0D09587AA87774C801C3B2F411A3397EDFC0AB9A75B9045CE59E4B6
src/components/artwork-link.tsx A97E65718A1BE614DBF7ECB89024CB1B8964135A3A18314D22DC8DA08095319E
src/components/artwork-connections.css C1DEB69446A0E2F99D75A2FCF7D9CFF9691A38D68895C4BBE56BAF4B1C47F1E3
src/app/layout.tsx 4C59A1F914297C89C69F168BA137FD0A2C7C18A0D8DD810D48D47EEB7993BE56
tests/artwork-graph.test.ts 18D58A1EDF828D516ADEBD712429224E199FFAE9C71219D682B09C0C06297AFA
tests/content.test.ts E1ABB63089335370D5775E5395D925908E78EAD212747C4E8C0FCB9DD37D6C01
package-lock.json D7B0F4BA3A55B5553C985EFE261D221EC6BD276C55A3149080E51B2353C9C7CB
```

The three supplied baseline source hashes match. No engineering correction or subsequent delta was requested during this review; later changes require checking against this snapshot.

## Not run

No build, typecheck, tests, dependency audit, HTTP/browser probes, runtime process verification or load testing. Engineering's reported passing build/22 tests and browser checks are not independently verified here. No current dependency vulnerability verdict is made.

## Out of scope

Production hosting controls, authentication, uploads, private records, future adapters, publish/unpublish cache behavior and a repeat audit of the unchanged DNA motion implementation. A future content source must preserve the public-only adapter boundary before graph construction; this is a future integration condition, not a current vulnerability.

## Writes

Created only `DNA-TEAM-SECURITY.md`. No application source, test, configuration, service, process or build artifact was changed.

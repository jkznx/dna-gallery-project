# DNA Gallery 3D – P3 security and dependency review
Reviewer: Security Reviewer, 2026-11-18. Deployment assumed (as stated): local only, 127.0.0.1, not deployed. Read-only review; compared with `backups\pre-p2-20261118\`. No installs, servers or edits.

## Summary
Critical 0 · High 0 · Medium 0 · Low 2 · Info 3. No confirmed vulnerability.

## Findings
1. **Low – No security headers/CSP for production** (`next.config.ts:3-7`). Config only sets turbopack root and `poweredByHeader:false`. The 3D scene uses an inline `<noscript><style>` (`src/components/gallery.tsx:54`) and `svg.innerHTML` (below), so a future strict CSP must allow inline styles (or use a nonce). Not a local-dev risk. *Before any deployment:* add CSP (`default-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'`), `X-Content-Type-Options`, `Referrer-Policy`; WebGL needs no `unsafe-eval` with three r187 as far as I know (inference; test).
2. **Low – `svg.innerHTML` with generated markup** (`src/components/helix3d-scene.tsx:442`, built at `:429-441`). Abuse path: none today. The string is built only from `toFixed(1)` numbers (`f1`, `:379`) and constant colours, so no content string (title, slug, URL) enters it. It would become injection if someone later adds an artwork title or id to `paths`. Suggest a one-line comment or building nodes with `createElementNS`. Defense-in-depth, not a vulnerability.
3. **Info – sessionStorage parsing is safe** (`helix3d-scene.tsx:494-498`, `:362`, `:205`, `:346`). Reads are in `try/catch`; restore only happens when `saved.id` equals `artwork-<id>` of a fixture artwork (`findIndex`, so unknown ids are ignored) and `saved.y` is finite. `JSON.parse` of a non-object yields `undefined` via `?.`. Stored data: artwork id, scroll Y, index, and a `"0"/"1"` pause flag. Same-origin script could tamper with it, with only a scroll/selection effect. Note `saved.index` is written but not read back in the restore path I saw; no issue.
4. **Info – Textures/images** : no `TextureLoader`, `ImageLoader`, `fetch`, `crossOrigin`, or URL building in the new files. Artwork pictures are DOM `next/image` elements (`helix3d-scene.tsx:63,68`) with `src` from fixture `artwork.image`, all fixed `/samples/*.png` (`src/content/gallery.ts`); no user-controlled URL, no path traversal, no remote image host configured. If textures are later loaded from the same URLs, keep them fixture-only; user-supplied URLs would need an allow-list.
5. **Info – `run-local.cmd` PATH handling is process-only** (`run-local.cmd:3,34-45`; `setlocal` at top scopes `set`). The `npm` branch resolves npm next to the chosen Node (`NODE_DIR`), adds `NODE_DIR` to `PATH` for this process, and runs `node npm-cli.js %1..%9`. Variables are quoted. Caveats: (a) when `node` is on PATH, `where node` takes the first PATH hit, so a planted `node.exe` earlier in PATH wins, same as any shell use; (b) `%1..%9` expands user-supplied arguments unquoted, so metacharacters such as `&` in an argument could run extra commands. This only matters if arguments come from untrusted input; they come from the local user/agents. Fallback Node paths (`%USERPROFILE%\.cache\codex-runtimes\...`, `%ProgramFiles%\nodejs`) are fixed locations.

## Dependency pin and lockfile (requested check 1)
- `package.json`: `three` and `@types/three` both exactly `0.187.0` (no ranges); other pins unchanged.
- Lockfile v3, 89 packages. Versus `package-lock.json.bak`: **8 packages added, 0 removed, 0 changed**: `three` 0.187.0, `@types/three` 0.187.0, and transitive `@dimforge/rapier3d-compat` 0.12.0, `@tweenjs/tween.js` 23.1.3, `@types/stats.js` 0.17.4, `@types/webxr` 0.5.24, `fflate` 0.8.3, `meshoptimizer` 1.1.1. Licenses MIT/Apache-2.0.
- All 89 `resolved` URLs start with `https://registry.npmjs.org/`; all have `integrity` (sha512). **No package has `hasInstallScript`**, so `npm ci` runs no lifecycle scripts for the new packages.
- Not verified: that the integrity values match registry content (no network use by me), and Ultron's reported `npm audit` result (0 vulnerabilities). Several transitive packages are three's own dependencies (inference: only ones the scene imports are bundled; the rest are dev/type or unused code paths).
- Residual: `three` r187 is a very recent release and `meshoptimizer`/`rapier3d-compat` are WASM-bearing packages; they ship in `node_modules` but should only reach the bundle if imported (unchecked, see Not run).

## No new network calls / external URLs (check 2)
Grep of `src` for `fetch(`, `XMLHttpRequest`, `http(s)://`, `window.open`, `WebSocket`, `sendBeacon`, `EventSource` finds none in the new files. Hits for `location` are `location.hash` reads matched against fixture ids (`helix3d-scene.tsx:364`). No remote image config in `next.config.ts`.

## DOM injection (check 5)
No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write` anywhere in `src`. Only `innerHTML` use in the new code is finding 2. `el.style.transform` is set from numbers (`:433`).

## Deployment must-change list
1. Add CSP and the security headers (finding 1).
2. Keep drafts/private artwork out of `public/` (existing note).
3. Run `npm ci` then `npm audit` against the real registry in the build environment; confirm lockfile integrity there.
4. Replace `run-local.cmd` with the hosting platform's start command; do not ship it.
5. Bind to a real host/port only behind TLS; the scripts bind to `127.0.0.1`.

## Checks run
- Parsed `package.json` and `package-lock.json` (registry host, integrity, install scripts, license, added/removed/changed vs backup).
- Read `next.config.ts`, `run-local.cmd`, `helix-gallery.tsx`, the layout/gallery diffs against backups, and the relevant parts of `helix3d-scene.tsx` (innerHTML at 429-442, restore at 485-500, storage keys).
- Grepped `src` for DOM-injection, network, storage and loader patterns.
- Current hashes (first 16 hex): package-lock `1e8c7fa21c9f0ad1`, package.json `47f2541e2c452ea1`, helix3d-scene.tsx `b3222e8b2f506f2e`, helix-gallery.tsx `e6ac9dc4787b5453`, next.config.ts `c2c6268521b0a810`, run-local.cmd `6ea9d0b221f37e78`.

## Not run
`npm audit`/`npm ci`/build/tests/typecheck; registry integrity verification; a browser or WebGL test; a bundle analysis to confirm which transitive packages are actually shipped; full line-by-line read of `helix3d-scene.tsx` (about 520 lines; I read the DOM-writing, storage, and loading parts), `helix3d-math.ts`, `helix3d-layout.ts`, `helix3d.css` and the tests.

## Out of scope
Production hosting, the graph/Connections/Saved features (reviewed earlier, `DNA-TEAM-SECURITY.md`), WebGL driver-level risks, accessibility.

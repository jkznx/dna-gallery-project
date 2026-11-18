import test from "node:test";
import assert from "node:assert/strict";
import { listArtworks } from "../src/content/gallery.ts";
import { buildArtworkGraph } from "../src/content/artwork-graph.ts";
import { connectionsHref, normalizeQuery, searchArtworks } from "../src/content/artwork-search.ts";
import { createSavedStore, parseSavedIds, SAVED_KEY } from "../src/components/saved-store.ts";

test("search finds titles, image descriptions, captions and graph topics", async () => {
  const graph = buildArtworkGraph(await listArtworks());
  assert.deepEqual(searchArtworks(graph, "DAYLIGHT").map((artwork) => artwork.slug), ["daylight"]);
  assert.equal(searchArtworks(graph, "yellow").length, 4);
  assert.deepEqual(searchArtworks(graph, "round forms").map((artwork) => artwork.slug), ["soft-orbit", "daylight", "afterglow"]);
  assert.deepEqual(searchArtworks(graph, "repetition").map((artwork) => artwork.slug), ["soft-orbit", "little-waves"]);
  assert.equal(searchArtworks(graph, "").length, 6);
});
test("search requires every word, handles accents and returns honest empty results", async () => {
  const artworks = await listArtworks();
  const graph = buildArtworkGraph(artworks);
  assert.deepEqual(searchArtworks(graph, "yellow leaves").map((artwork) => artwork.slug), ["growing-room"]);
  assert.equal(searchArtworks(graph, "yellow nonexistent").length, 0);
  assert.equal(searchArtworks(buildArtworkGraph([{ ...artworks[0], title: "Café study" }]), "cafe").length, 1);
});
test("queries are bounded and return URLs encode untrusted characters as data", () => {
  assert.equal(normalizeQuery(["yellow", "plum"]), "");
  assert.equal(normalizeQuery("  yellow \n leaves "), "yellow leaves");
  assert.equal(normalizeQuery("a".repeat(200)).length, 120);
  const href = connectionsHref("yellow", "a&from=saved #?<>");
  const url = new URL(href, "http://localhost");
  assert.equal(url.pathname, "/connections");
  assert.equal(url.searchParams.get("concept"), "yellow");
  assert.equal(url.searchParams.get("q"), "a&from=saved #?<>");
  assert.equal(url.searchParams.get("from"), null);
});
test("saved records validate versions, IDs, duplicates, size and malformed JSON", () => {
  assert.deepEqual(parseSavedIds("{bad"), []);
  assert.deepEqual(parseSavedIds('{"version":2,"ids":["sample-001"]}'), []);
  assert.deepEqual(parseSavedIds(JSON.stringify({ version: 1, ids: ["sample-001", "sample-001", null, {}, "../../private", "", "sample-002"] })), ["sample-001", "sample-002"]);
  assert.deepEqual(parseSavedIds("x".repeat(50001)), []);
});
function memoryStorage() {
  let raw: string | null = null;
  return { getItem: (_key: string) => raw, setItem: (_key: string, value: string) => { raw = value; } };
}
test("saving toggles once, persists across store recreation and notifies subscribers", () => {
  const storage = memoryStorage();
  const store = createSavedStore(() => storage);
  assert.equal(store.getSnapshot().ready, false);
  let changes = 0;
  const unsubscribe = store.subscribe(() => changes++);
  store.refresh();
  store.toggle("sample-001");
  assert.equal(store.getSnapshot().temporary, false);
  assert.deepEqual(parseSavedIds(storage.getItem(SAVED_KEY)), ["sample-001"]);
  const reloaded = createSavedStore(() => storage);
  reloaded.refresh();
  assert.deepEqual(reloaded.getSnapshot().ids, ["sample-001"]);
  unsubscribe();
  const before = changes;
  store.toggle("sample-001");
  assert.equal(changes, before);
  assert.deepEqual(store.getSnapshot().ids, []);
});
test("external changes refresh, and updates merge the latest stored IDs", () => {
  const storage = memoryStorage();
  const first = createSavedStore(() => storage);
  const second = createSavedStore(() => storage);
  first.refresh(); second.refresh();
  first.toggle("sample-001");
  second.toggle("sample-002");
  first.refresh();
  assert.deepEqual(first.getSnapshot().ids, ["sample-001", "sample-002"]);
  second.toggle("sample-001");
  first.refresh();
  assert.deepEqual(first.getSnapshot().ids, ["sample-002"]);
});
test("storage read and quota failures retain usable temporary choices", () => {
  const denied = createSavedStore(() => { throw new Error("storage denied"); });
  denied.refresh(); denied.toggle("sample-001"); denied.toggle("sample-002");
  assert.equal(denied.getSnapshot().temporary, true);
  assert.deepEqual(denied.getSnapshot().ids, ["sample-001", "sample-002"]);
  denied.toggle("sample-001");
  assert.deepEqual(denied.getSnapshot().ids, ["sample-002"]);
  const quota = createSavedStore(() => ({ getItem: () => '{"version":1,"ids":["sample-001"]}', setItem: () => { throw new Error("quota"); } }));
  quota.refresh(); quota.toggle("sample-002");
  assert.equal(quota.getSnapshot().temporary, true);
  assert.deepEqual(quota.getSnapshot().ids, ["sample-001", "sample-002"]);
});

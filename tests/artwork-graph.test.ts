import test from "node:test";
import assert from "node:assert/strict";
import { listArtworks } from "../src/content/gallery.ts";
import { buildArtworkGraph, relatedArtworks, artworksForConcept } from "../src/content/artwork-graph.ts";

test("every relationship retains exact public metadata evidence and valid endpoints", async () => {
  const artworks = await listArtworks();
  const graph = buildArtworkGraph(artworks);
  assert.ok(graph.edges.length > artworks.length);
  for (const edge of graph.edges) {
    const artwork = artworks.find((item) => item.id === edge.artworkId);
    assert.ok(artwork);
    assert.ok(graph.concepts.some((concept) => concept.id === edge.conceptId));
    assert.equal(edge.evidence.quote, artwork[edge.evidence.field]);
    assert.ok(edge.evidence.matched.length > 0);
    assert.ok(edge.evidence.quote.includes(edge.evidence.matched));
  }
  assert.equal(new Set(graph.edges.map((edge) => `${edge.artworkId}/${edge.conceptId}`)).size, graph.edges.length);
  assert.equal(artworksForConcept(graph, "yellow").length, 4);
  assert.deepEqual(artworksForConcept(graph, "round-forms").map((artwork) => artwork.slug), ["soft-orbit", "daylight", "afterglow"]);
});

test("evidence keeps the literal matched term, its original case, field and complete quote", async () => {
  const [artwork] = await listArtworks();
  const graph = buildArtworkGraph([{ ...artwork, alt: "A YELLOW sun over lavender hills", description: "A study of repetition." }]);
  const evidence = (id: string) => graph.edges.find((edge) => edge.conceptId === id)?.evidence;
  assert.deepEqual(evidence("yellow"), { field: "alt", quote: "A YELLOW sun over lavender hills", matched: "YELLOW" });
  assert.deepEqual(evidence("round-forms"), { field: "alt", quote: "A YELLOW sun over lavender hills", matched: "sun" });
  assert.deepEqual(evidence("rhythm"), { field: "description", quote: "A study of repetition.", matched: "repetition" });
});

test("related studies have two-hop evidence, exclude self and rank specific connections higher", async () => {
  const graph = buildArtworkGraph(await listArtworks());
  const related = relatedArtworks(graph, "sample-001", 10);
  assert.equal(related.length, 5);
  assert.equal(related[0].artwork.id, "sample-003");
  assert.equal(related.find((match) => match.artwork.id === "sample-003")?.score, related.find((match) => match.artwork.id === "sample-006")?.score);
  assert.ok(related.findIndex((match) => match.artwork.id === "sample-003") < related.findIndex((match) => match.artwork.id === "sample-002"));
  for (const match of related) {
    assert.notEqual(match.artwork.id, "sample-001");
    for (const concept of match.shared) {
      assert.ok(match.evidence.some((edge) => edge.artworkId === "sample-001" && edge.conceptId === concept.id));
      assert.ok(match.evidence.some((edge) => edge.artworkId === match.artwork.id && edge.conceptId === concept.id));
    }
  }
});

test("removing or changing content removes stale concepts and recommendations", async () => {
  const artworks = await listArtworks();
  const subset = artworks.filter((artwork) => artwork.id !== "sample-005");
  const graph = buildArtworkGraph(subset);
  assert.ok(!graph.concepts.some((concept) => concept.id === "botanical"));
  assert.ok(!graph.edges.some((edge) => edge.artworkId === "sample-005"));
  assert.ok(!relatedArtworks(graph, "sample-001", 10).some((match) => match.artwork.id === "sample-005"));
  const edited = buildArtworkGraph([{ ...artworks[0], alt: "An unclassified composition", description: "An unclassified study" }]);
  assert.equal(edited.artworks.length, 1);
  assert.equal(edited.edges.length, 0);
});

test("unknown IDs, empty data and invalid limits fail closed", async () => {
  const graph = buildArtworkGraph(await listArtworks());
  assert.deepEqual(relatedArtworks(graph, "not-public"), []);
  assert.deepEqual(artworksForConcept(graph, "not-a-concept"), []);
  for (const limit of [-1, 0, NaN, Infinity]) assert.deepEqual(relatedArtworks(graph, "sample-001", limit), []);
  assert.equal(relatedArtworks(graph, "sample-001", 1).length, 1);
  assert.deepEqual(buildArtworkGraph([]), { artworks: [], concepts: [], edges: [] });
});

test("identity collisions are rejected and rebuild order does not change rankings", async () => {
  const artworks = await listArtworks();
  assert.throws(() => buildArtworkGraph([artworks[0], artworks[0]]), /unique artwork IDs/);
  const ids = (records: typeof artworks) => relatedArtworks(buildArtworkGraph(records), "sample-001", 10).map((match) => match.artwork.id);
  assert.deepEqual(ids(artworks), ids([...artworks].reverse()));
});

import type { Artwork } from "./gallery.ts";

type Field = "alt" | "description";
export type Concept = Readonly<{ id: string; label: string; kind: "color" | "form" | "theme"; swatch?: string }>;
type Rule = Concept & { field: Field; pattern: RegExp };
const vocabulary: readonly Rule[] = [
  { id: "yellow", label: "Yellow", kind: "color", swatch: "#f8ed94", field: "alt", pattern: /\byellow\b/i },
  { id: "cream", label: "Cream", kind: "color", swatch: "#fff6d7", field: "alt", pattern: /\bcream\b/i },
  { id: "plum", label: "Plum", kind: "color", swatch: "#594061", field: "alt", pattern: /\bplum\b/i },
  { id: "lavender", label: "Lavender", kind: "color", swatch: "#dda9ef", field: "alt", pattern: /\blavender\b/i },
  { id: "round-forms", label: "Round forms", kind: "form", field: "alt", pattern: /\b(rings|disc|sun|concentric)\b/i },
  { id: "flowing-curves", label: "Flowing curves", kind: "form", field: "alt", pattern: /\b(curved|waves|arches)\b/i },
  { id: "botanical", label: "Botanical forms", kind: "form", field: "alt", pattern: /\b(stem|leaves)\b/i },
  { id: "rhythm", label: "Rhythm & repetition", kind: "theme", field: "description", pattern: /\b(rhythm|repetition)\b/i },
];

export type DescriptorEdge = Readonly<{
  artworkId: string; conceptId: string;
  evidence: Readonly<{ field: Field; quote: string; matched: string }>;
}>;
export type ArtworkGraph = Readonly<{
  artworks: readonly Artwork[]; concepts: readonly Concept[]; edges: readonly DescriptorEdge[];
}>;

/** Build exclusively from the current public records; no retained index or LLM claims. */
export function buildArtworkGraph(artworks: readonly Artwork[]): ArtworkGraph {
  const edges: DescriptorEdge[] = [];
  const ids = new Set<string>();
  for (const artwork of artworks) {
    if (ids.has(artwork.id)) throw new Error("Artwork graph requires unique artwork IDs");
    ids.add(artwork.id);
    for (const rule of vocabulary) {
      const match = rule.pattern.exec(artwork[rule.field]);
      if (match) edges.push({
        artworkId: artwork.id, conceptId: rule.id,
        evidence: { field: rule.field, quote: artwork[rule.field], matched: match[0] },
      });
    }
  }
  const used = new Set(edges.map((edge) => edge.conceptId));
  const concepts = vocabulary.filter((rule) => used.has(rule.id)).map(({ id, label, kind, swatch }) => ({ id, label, kind, swatch }));
  return { artworks: [...artworks], concepts, edges };
}

export function artworksForConcept(graph: ArtworkGraph, conceptId: string): readonly Artwork[] {
  const ids = new Set(graph.edges.filter((edge) => edge.conceptId === conceptId).map((edge) => edge.artworkId));
  return graph.artworks.filter((artwork) => ids.has(artwork.id));
}

export function conceptsForArtwork(graph: ArtworkGraph, artworkId: string): readonly Concept[] {
  const ids = new Set(graph.edges.filter((edge) => edge.artworkId === artworkId).map((edge) => edge.conceptId));
  return graph.concepts.filter((concept) => ids.has(concept.id));
}

export function relatedArtworks(graph: ArtworkGraph, artworkId: string, limit = 3) {
  const sourceConcepts = new Set(conceptsForArtwork(graph, artworkId).map((concept) => concept.id));
  if (!sourceConcepts.size || !Number.isFinite(limit) || limit <= 0) return [];
  const frequency = new Map(graph.concepts.map((concept) => [concept.id, artworksForConcept(graph, concept.id).length]));
  return graph.artworks.filter((artwork) => artwork.id !== artworkId).map((artwork) => {
    const shared = conceptsForArtwork(graph, artwork.id).filter((concept) => sourceConcepts.has(concept.id));
    const score = shared.reduce((sum, concept) => sum + Math.log(1 + graph.artworks.length / frequency.get(concept.id)!), 0);
    const evidence = graph.edges.filter((edge) => (edge.artworkId === artworkId || edge.artworkId === artwork.id) && shared.some((concept) => concept.id === edge.conceptId));
    return { artwork, shared, evidence, score };
  }).filter((match) => match.shared.length > 0)
    .sort((a, b) => b.score - a.score || a.artwork.sortOrder - b.artwork.sortOrder || a.artwork.id.localeCompare(b.artwork.id))
    .slice(0, Math.floor(limit));
}

import type { Artwork } from "./gallery.ts";
import { conceptsForArtwork, type ArtworkGraph } from "./artwork-graph.ts";

export function normalizeQuery(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, 120) : "";
}
function searchable(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("en");
}
export function searchArtworks(graph: ArtworkGraph, query: string): readonly Artwork[] {
  const words = searchable(normalizeQuery(query)).split(" ").filter(Boolean);
  if (!words.length) return graph.artworks;
  return graph.artworks.filter((artwork) => {
    const text = searchable([artwork.title, artwork.alt, artwork.description, artwork.medium,
      ...conceptsForArtwork(graph, artwork.id).map((concept) => concept.label)].join(" "));
    return words.every((word) => text.includes(word));
  });
}
export function connectionsHref(concept?: string, query?: string): string {
  const params = new URLSearchParams();
  if (concept) params.set("concept", concept);
  const cleanQuery = normalizeQuery(query);
  if (cleanQuery) params.set("q", cleanQuery);
  return `/connections${params.size ? `?${params}` : ""}`;
}

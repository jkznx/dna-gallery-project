import Image from "next/image";
import Link from "next/link";
import { artworksForConcept, conceptsForArtwork, relatedArtworks, type ArtworkGraph } from "@/content/artwork-graph";
import { ConnectionEvidence } from "./connection-evidence";
import { SaveStudyButton } from "./saved-studies";

export function ArtworkConnections({ graph, artworkId, query }: { graph: ArtworkGraph; artworkId: string; query: string }) {
  const concepts = conceptsForArtwork(graph, artworkId);
  const matches = relatedArtworks(graph, artworkId);
  if (!concepts.length) return null;
  return <section className="related-studies" aria-labelledby="related-title">
    <div className="connections-section-heading"><div><h2 id="related-title">Follow a shared thread.</h2><p>More studies connected by color, form, or rhythm.</p></div><Link className="connections-text-link" href="/connections">Explore all connections</Link></div>
    <nav className="concept-links" aria-label="Explore this study’s topics">{concepts.map((concept) => <Link key={concept.id} href={`/connections?concept=${concept.id}`}>{concept.label}{artworksForConcept(graph, concept.id).length === 1 ? " · Only in this study" : ""}</Link>)}</nav>
    {matches.length > 0 && <ul className="connection-results related-results">{matches.map(({ artwork, shared, evidence }) => <li key={artwork.id}>
      <Link className="connection-artwork" href={`/artwork/${artwork.slug}?${query}`}><div className="connection-image"><Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 85vw, 30vw"/></div><h3>{artwork.title}</h3><p>Shared: {shared.map((concept) => concept.label).join(", ")}</p></Link>
      <SaveStudyButton id={artwork.id} title={artwork.title}/>
      <details className="connection-evidence"><summary>Why connected?</summary><p>Matched from the sample captions and image descriptions:</p><ul>{[artworkId, artwork.id].map((id) => <li key={id}><strong>{graph.artworks.find((item) => item.id === id)?.title}</strong>{evidence.filter((edge) => edge.artworkId === id).map((edge) => <ConnectionEvidence key={edge.conceptId} label={shared.find((concept) => concept.id === edge.conceptId)!.label} evidence={edge.evidence}/>)}</li>)}</ul></details>
    </li>)}</ul>}
  </section>;
}

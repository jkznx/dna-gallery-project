import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ConnectionEvidence } from "@/components/connection-evidence";
import { listArtworks } from "@/content/gallery";
import { artworksForConcept, buildArtworkGraph, conceptsForArtwork } from "@/content/artwork-graph";
import { connectionsHref, normalizeQuery, searchArtworks } from "@/content/artwork-search";
import { StudySearch } from "@/components/study-search";
import { SaveStudyButton } from "@/components/saved-studies";

export const metadata: Metadata = { title: "Connections", description: "Find shared colors, forms, and rhythms across the sample collection." };

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ concept?: string | string[]; q?: string | string[] }> }) {
  const graph = buildArtworkGraph(await listArtworks());
  const options = await searchParams;
  const requested = options.concept;
  const query = normalizeQuery(options.q);
  const selected = typeof requested === "string" ? graph.concepts.find((concept) => concept.id === requested) : undefined;
  const searched = searchArtworks(graph, query);
  const selectedIds = new Set(selected ? artworksForConcept(graph, selected.id).map((artwork) => artwork.id) : []);
  const artworks = selected ? searched.filter((artwork) => selectedIds.has(artwork.id)) : searched;
  const detailParams = new URLSearchParams({ layout: "grid", from: "connections" });
  if (selected) detailParams.set("concept", selected.id);
  if (query) detailParams.set("q", query);
  const topicCount = (id: string) => { const ids = new Set(artworksForConcept(graph, id).map((artwork) => artwork.id)); return searched.filter((artwork) => ids.has(artwork.id)).length; };
  return <article className="connections-page">
    <header className="connections-heading"><div><h1>Find your thread.</h1><p className="eyebrow">Sample collection · Original generated studies</p><p>A color catches your eye. A shape feels familiar.<br/>See where it takes you through the collection.</p></div><nav className="layout-switch" aria-label="Gallery view"><Link href="/gallery">DNA flow</Link><Link href="/grid">Grid view</Link><Link href="/connections" aria-current="page">Connections</Link></nav></header>
    <StudySearch key={`${selected?.id ?? "all"}:${query}`} query={query} concept={selected?.id}/>
    {(query || selected) && <div className="search-context"><p>{query ? <>Searching for <strong>“{query}”</strong>{selected ? ` in ${selected.label}` : ""}.</> : <>Browsing {selected?.label}.</>}</p><Link href="/connections">Reset search and topic</Link></div>}
    <nav className="concept-filter" aria-label="Filter studies by connection"><Link href={connectionsHref(undefined, query)} aria-current={!selected ? "page" : undefined}>All studies <span>{searched.length}</span></Link>{graph.concepts.map((concept) => <Link href={connectionsHref(concept.id, query)} key={concept.id} aria-current={selected?.id === concept.id ? "page" : undefined}>{concept.swatch && <i aria-hidden="true" style={{ backgroundColor: concept.swatch }}/>} {concept.label} <span>{topicCount(concept.id)}</span></Link>)}</nav>
    {requested && !selected && <p className="connection-notice">That connection isn’t in this collection. {query ? "Showing your search results without a topic filter." : "Showing all studies instead."}</p>}
    <section aria-labelledby="connection-results-title"><div className="connection-result-heading"><h2 id="connection-results-title">{selected?.label ?? (query ? "Your search results" : "Every study, a place to start.")}</h2><p>{artworks.length} {artworks.length === 1 ? "study" : "studies"}{selected || query ? (artworks.length === 1 ? " matches" : " match") : " to explore"}</p></div>
      {selected && artworksForConcept(graph, selected.id).length === graph.artworks.length && <p className="connection-notice">This topic appears in all {graph.artworks.length} studies.</p>}
      {artworks.length === 0 ? <div className="search-empty"><h3>{graph.artworks.length ? "No studies found." : "The next collection is taking shape."}</h3><p>{graph.artworks.length ? "Try a title, a color, or a simpler phrase. You can also reset the search and topic to see the whole collection." : "Come back soon."}</p><Link className="connections-text-link" href="/connections">View all studies</Link></div> : <ul className="connection-results">{artworks.map((artwork, index) => <li key={artwork.id}>
        <Link className="connection-artwork" href={`/artwork/${artwork.slug}?${detailParams}`}><div className="connection-image"><Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 90vw, (max-width: 900px) 44vw, 30vw" priority={index === 0}/></div><h3>{artwork.title}</h3></Link>
        <SaveStudyButton id={artwork.id} title={artwork.title}/>
        <div className="concept-links" aria-label={`Topics for ${artwork.title}`}>{conceptsForArtwork(graph, artwork.id).map((concept) => <Link key={concept.id} href={connectionsHref(concept.id, query)} aria-current={selected?.id === concept.id ? "page" : undefined}>{concept.label}{artworksForConcept(graph, concept.id).length === 1 ? " · Only in this study" : ""}</Link>)}</div>
        {selected && graph.edges.filter((edge) => edge.artworkId === artwork.id && edge.conceptId === selected.id).map((edge) => <div className="connection-source" key={edge.conceptId}><ConnectionEvidence label={selected.label} evidence={edge.evidence}/></div>)}
      </li>)}</ul>}
    </section>
    <aside className="connections-note"><p>Connections follow the colors, forms, and themes described in our sample captions. Open a study to see what it shares with the others.</p><Link className="connections-text-link" href="/gallery">Return to the DNA flow</Link></aside>
  </article>;
}

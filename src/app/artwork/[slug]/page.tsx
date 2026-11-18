import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtwork, listArtworks } from "@/content/gallery";
import { buildArtworkGraph } from "@/content/artwork-graph";
import { ArtworkConnections } from "@/components/artwork-connections";
import { connectionsHref, normalizeQuery } from "@/content/artwork-search";
import { SaveStudyButton } from "@/components/saved-studies";

export async function generateStaticParams() { return (await listArtworks()).map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const artwork = await getArtwork((await params).slug);
  return { title: artwork?.title ?? "Artwork not found" };
}

export default async function ArtworkPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ layout?: string; from?: string; concept?: string; q?: string }> }) {
  const artwork = await getArtwork((await params).slug);
  if (!artwork) notFound();
  const options = await searchParams;
  const layout = options.layout === "helix" ? "helix" : "grid";
  const artworks = await listArtworks();
  const graph = buildArtworkGraph(artworks);
  const fromConnections = options.from === "connections";
  const fromSaved = options.from === "saved";
  const concept = graph.concepts.find((item) => item.id === options.concept);
  const searchQuery = fromConnections ? normalizeQuery(options.q) : "";
  const backHref = fromSaved ? "/saved" : fromConnections ? connectionsHref(concept?.id, searchQuery) : `/${layout}#artwork-${artwork.id}`;
  const detailParams = new URLSearchParams({ layout });
  if (fromSaved) detailParams.set("from", "saved");
  if (fromConnections) { detailParams.set("from", "connections"); if (concept) detailParams.set("concept", concept.id); if (searchQuery) detailParams.set("q", searchQuery); }
  const query = detailParams.toString();
  const index = artworks.findIndex((item) => item.slug === artwork.slug);
  const previous = artworks[index - 1];
  const next = artworks[index + 1];
  return <article className="detail">
    <Link className="back-link" href={backHref}>← {fromSaved ? "Back to saved studies" : fromConnections ? "Back to connections" : "Back to collection"}</Link>
    <div className="detail-layout">
      <div className="detail-image"><Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 760px) 90vw, 58vw" priority/></div>
      <div className="detail-copy"><p className="eyebrow">{artwork.medium}</p><h1>{artwork.title}</h1><p>{artwork.description}</p><dl><div><dt>Collection</dt><dd>Studies in connection</dd></div><div><dt>Source</dt><dd>Original generated fixture</dd></div><div><dt>Status</dt><dd>Sample — awaiting real artwork</dd></div></dl><p className="handwritten">a thread worth following</p></div>
    </div>
    <div className="detail-save"><SaveStudyButton id={artwork.id} title={artwork.title}/></div>
    <nav className="detail-nav" aria-label="Other artwork">
      {previous ? <Link href={`/artwork/${previous.slug}?${query}`}>← {previous.title}</Link> : <span>Start of collection</span>}
      <span>{index + 1} / {artworks.length}</span>
      {next ? <Link href={`/artwork/${next.slug}?${query}`}>{next.title} →</Link> : <span>End of collection</span>}
    </nav>
    <ArtworkConnections graph={graph} artworkId={artwork.id} query={query}/>
  </article>;
}

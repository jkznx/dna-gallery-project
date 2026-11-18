import Image from "next/image";
import Link from "next/link";
import { listArtworks, type Artwork } from "@/content/gallery";
import { ArtworkLink, RestoreGalleryFocus } from "@/components/artwork-link";
// The 2D traveling version stays available as a fallback: swap HelixGallery for <TravelingDna artworks={artworks}/> to revert.
import { HelixGallery } from "@/components/helix-gallery";
import { StudySearch } from "@/components/study-search";
import { SaveStudyButton } from "@/components/saved-studies";

export type Layout = "helix" | "grid";

function DnaMark() {
  return <svg viewBox="0 0 64 100" fill="none" aria-hidden="true"><path d="M10 0C10 25 54 25 54 50S10 75 10 100M54 0C54 25 10 25 10 50S54 75 54 100" stroke="currentColor" strokeWidth="3"/><path d="M15 12H49M24 25H40M15 38H49M10 50H54M15 62H49M24 75H40M15 88H49" stroke="currentColor" strokeWidth="2"/></svg>;
}

/** The static gallery: every artwork as a normal link. Used by /grid and as the 3D view's fallback (no JavaScript, no WebGL). */
function ArtworkList({ artworks, layout }: { artworks: readonly Artwork[]; layout: Layout }) {
  return <ol className="artworks artworks--grid">
    {artworks.map((artwork, index) => <li key={artwork.id} className={`artwork artwork--${index % 6}`}>
      <ArtworkLink id={`artwork-${artwork.id}`} layout={layout} href={`/artwork/${artwork.slug}?layout=${layout}`}>
        <div className="image-frame"><Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 90vw, (max-width: 900px) 44vw, 30vw" priority={layout === "grid" && index < 2}/><span className="view-artwork" aria-hidden="true">View study ↗</span></div>
        <div className="artwork-caption"><div><h3>{artwork.title}</h3><p>{artwork.medium}</p></div><span aria-hidden="true">↗</span></div>
      </ArtworkLink>
      <SaveStudyButton id={artwork.id} title={artwork.title}/>
    </li>)}
  </ol>;
}

export async function Gallery({ layout }: { layout: Layout }) {
  const artworks = await listArtworks();
  const introContent = <>
    <div><p className="eyebrow">An exploration of form &amp; feeling</p>
      <h1 id="gallery-title">A little art.<br/><span>A shared thread.</span></h1>
      <p className="intro-copy">Six studies. Two winding strands. Find the connections in between.</p>
      {layout === "helix" && <p className="intro-links"><Link href="/grid">Grid view</Link><span aria-hidden="true"> · </span><Link href="/connections">Connections</Link><span aria-hidden="true"> · </span><a href="#study-search-input" data-focus-search="">Search</a></p>}
    </div>
    <div className="intro-aside"><DnaMark/><p className="handwritten">connected by curiosity</p></div>
  </>;
  return <>
    {layout === "grid" && <RestoreGalleryFocus layout={layout}/>}
    {layout === "helix" ? <HelixGallery artworks={artworks} intro={<div className="intro">{introContent}</div>}/> : <section className="intro" aria-labelledby="gallery-title">{introContent}</section>}
    <section aria-labelledby="collection-title" className="collection">
      <div className="collection-heading"><div><p className="eyebrow">Selected studies</p><h2 id="collection-title">The collection <span>({String(artworks.length).padStart(2, "0")})</span></h2></div>
        <nav aria-label="Gallery view" className="layout-switch">
          <Link href="/gallery" aria-current={layout === "helix" ? "page" : undefined}>DNA flow</Link>
          <Link href="/grid" aria-current={layout === "grid" ? "page" : undefined}>Grid view</Link>
          <Link href="/connections">Connections</Link>
        </nav>
      </div>
      <p className="layout-note">{layout === "helix" ? "Scroll through the helix above, or open any study from the list." : "The whole collection, at your own pace. Choose a study for a closer look."}</p>
      <StudySearch/>
      {artworks.length === 0 ? <p className="empty-state">The next collection is taking shape. Come back soon.</p> :
        layout === "helix" ? <div className="h3d-static"><ArtworkList artworks={artworks} layout="helix"/></div> : <ArtworkList artworks={artworks} layout="grid"/>}
    </section>
    {layout === "helix" && <noscript><style>{"body .helix3d[data-state=pending]{min-height:0} body .helix3d[data-state=pending] ~ .collection .h3d-static{display:block}"}</style></noscript>}
    <aside className="sample-note"><p>Six original sample studies, made for exploration.</p><Link href="/info">The story behind the thread &#8599;</Link></aside>
  </>;
}


import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listArtworks, type Artwork } from "@/content/gallery";

export const metadata: Metadata = { title: "Info", description: "The idea behind DNA: six studies in form, feeling, and connection." };

export default async function InfoPage() {
  const artworks = await listArtworks();
  const featured = [artworks[4], artworks[0], artworks[5]].filter((artwork): artwork is Artwork => artwork !== undefined);
  return <article className="info-page" aria-labelledby="info-title">
    <header className="info-heading">
      <div className="info-heading-copy">
        <p className="eyebrow">The idea behind DNA</p>
        <h1 id="info-title">Different forms.<br/><span>Same curiosity.</span></h1>
        <p className="intro-copy">Some things belong together before you know why. A curve, a color, a familiar feeling. DNA follows that thread.</p>
        <Link className="info-gallery-link" href="/gallery">Find your connection <span aria-hidden="true">&#8599;</span></Link>
      </div>
      <div className="info-art" aria-label="Studies from the sample collection">
        {featured.map((artwork, index) => <figure className={`info-art-piece info-art-piece--${index}`} key={artwork.id}>
          <Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 40vw, 240px" priority={index === 1}/>
          <figcaption>{artwork.title}</figcaption>
        </figure>)}
        <p className="handwritten info-accent">a little different, together.</p>
      </div>
    </header>
    <section className="info-story" aria-labelledby="info-collection">
      <div><p className="eyebrow">Studies in connection</p><h2 id="info-collection">A shared thread.<br/>A different point of view.</h2></div>
      <div><p>Six digital studies explore simple shapes, soft color, and the space between them. Lavender, warm cream, and a little yellow give each image a shared language.</p><p>The DNA path makes those connections visible. Each artwork travels along the same two strands, grows into the foreground, then makes room for the next.</p><p className="info-disclosure">This is a sample collection. The images and captions were created to explore the gallery experience.</p></div>
    </section>
    <section className="info-guide" aria-labelledby="info-explore">
      <div><p className="eyebrow">Make yourself at home</p><h2 id="info-explore">Your pace.<br/>Your point of view.</h2><Link className="info-text-link" href="/gallery">Back to the collection &#8599;</Link></div>
      <dl className="info-guide-list">
        <div><dt>Find something familiar</dt><dd>Search by title, color, form, or topic. Combine your search with a Connections topic to narrow the collection.</dd></div>
        <div><dt>Keep your favorites</dt><dd>Choose Save study on a study, then open Saved to revisit your picks. Choices stay in this browser, with no account needed.</dd></div>
        <div><dt>Follow the flow</dt><dd>Scroll down to bring the next study forward. Scroll up to retrace the thread. The numbered choices and Previous / Next work too.</dd></div>
        <div><dt>Stay a little longer</dt><dd>Choose View design to see the full artwork and read its story. Return to continue where you left off.</dd></div>
        <div><dt>Find a shared thread</dt><dd><Link className="connections-text-link" href="/connections">Explore Connections</Link> to browse shared colors and forms. Each study also suggests related pieces, with an explanation of what they share.</dd></div>
        <div><dt>Keep it still</dt><dd>Pause DNA motion for a complete static gallery, or choose Grid view. Reduced-motion preferences are respected automatically.</dd></div>
      </dl>
    </section>
  </article>;
}

import type { Metadata } from "next";
import { listArtworks } from "@/content/gallery";
import { SavedStudies } from "@/components/saved-studies";

export const metadata: Metadata = { title: "Saved studies", description: "Your own collection of saved sample studies, kept in this browser." };

export default async function SavedPage() {
  return <article className="saved-page"><header className="saved-heading"><h1>Your little collection.</h1><p>Studies you want to come back to.</p><p className="saved-privacy">Saved in this browser. No account needed. Sample collection of original generated studies.</p></header>
    <noscript><p className="connection-notice">Saved studies need JavaScript to read this browser’s choices. The Gallery and Connections views remain available.</p></noscript>
    <SavedStudies artworks={await listArtworks()}/>
  </article>;
}

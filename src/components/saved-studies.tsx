"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { Artwork } from "@/content/gallery";
import { createSavedStore, EMPTY_SAVED, SAVED_KEY } from "./saved-store";

const store = createSavedStore(() => window.localStorage);
let subscribers = 0;
function handleStorage(event: StorageEvent) {
  if (event.key === SAVED_KEY || event.key === null) store.refresh();
}
function subscribe(listener: () => void) {
  const unsubscribe = store.subscribe(listener);
  if (subscribers++ === 0) {
    window.addEventListener("storage", handleStorage);
    store.refresh();
  }
  return () => {
    unsubscribe();
    if (--subscribers === 0) window.removeEventListener("storage", handleStorage);
  };
}
function useSaved() { return useSyncExternalStore(subscribe, store.getSnapshot, () => EMPTY_SAVED); }

export function SaveStudyButton({ id, title, onRemove }: { id: string; title: string; onRemove?: () => void }) {
  const { ids, ready, temporary } = useSaved();
  const saved = ids.includes(id);
  return <div className="save-study-control">
    <button type="button" className="save-study" aria-label={`Save ${title}`} aria-pressed={saved} disabled={!ready} onClick={() => { store.toggle(id); if (saved && onRemove) requestAnimationFrame(onRemove); }}>
      <svg viewBox="0 0 20 24" width="16" height="19" aria-hidden="true"><path d="M3 2h14v20l-7-5-7 5V2Z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>{saved ? "Saved" : "Save study"}
    </button>
    <span className="save-feedback" role="status" aria-live="polite">{ready && saved ? `${title} saved${temporary ? " until this page reloads" : " in this browser"}.` : ""}</span>
    {temporary && <small className="save-storage-note">Browser storage is unavailable. Changes last until this page reloads.</small>}
  </div>;
}

export function SavedStudies({ artworks }: { artworks: readonly Artwork[] }) {
  const { ids, ready, temporary } = useSaved();
  const saved = artworks.filter((artwork) => ids.includes(artwork.id));
  if (!ready) return <p className="saved-loading" role="status">Loading your saved studies…</p>;
  return <>
    <p className="saved-count" id="saved-summary" role="status" tabIndex={-1}>{saved.length} {saved.length === 1 ? "saved study" : "saved studies"}</p>
    {temporary && <p className="connection-notice" role="status">Browser storage is unavailable. Your choices are kept until this page reloads.</p>}
    {saved.length === 0 ? <section className="saved-empty"><h2>Keep a little inspiration.</h2><p>Choose Save study on an artwork to collect it here. {temporary ? "Your choices last until this page reloads." : "Your choices stay in this browser."}</p><Link className="info-gallery-link" href="/connections">Explore the collection</Link></section> :
      <ul className="connection-results saved-results">{saved.map((artwork) => <li key={artwork.id}>
        <Link className="connection-artwork" href={`/artwork/${artwork.slug}?layout=grid&from=saved`}><div className="connection-image"><Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 90vw, (max-width: 900px) 44vw, 30vw"/></div><h2>{artwork.title}</h2><p>{artwork.medium}</p></Link>
        <SaveStudyButton id={artwork.id} title={artwork.title} onRemove={() => document.getElementById("saved-summary")?.focus({ preventScroll: true })}/>
      </li>)}</ul>}
  </>;
}

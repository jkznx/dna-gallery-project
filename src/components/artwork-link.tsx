"use client";

import { useEffect, type ReactNode, type MouseEvent } from "react";

const storageKey = (layout: string) => `dna-gallery-return:${layout}`;

export function ArtworkLink({ id, href, layout, children }: { id: string; href: string; layout: string; children: ReactNode }) {
  function remember(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    try { sessionStorage.setItem(storageKey(layout), JSON.stringify({ id, y: window.scrollY })); } catch { /* Navigation remains usable when storage is unavailable. */ }
  }
  return <a id={id} className="artwork-link" href={href} onClick={remember}>{children}</a>;
}

/** Native history handles scrolling; restore the specific keyboard origin as well. */
export function RestoreGalleryFocus({ layout }: { layout: string }) {
  useEffect(() => {
    function restore() {
      try {
        const saved = JSON.parse(sessionStorage.getItem(storageKey(layout)) ?? "null");
        if (!saved || typeof saved.id !== "string" || !Number.isFinite(saved.y)) return;
        const origin = document.getElementById(saved.id);
        if (!origin?.matches("a.artwork-link")) return;
        requestAnimationFrame(() => { origin.focus({ preventScroll: true }); window.scrollTo(0, saved.y); });
      } catch { /* Browser-native history is the fallback. */ }
    }
    function onPageShow(event: PageTransitionEvent) { if (event.persisted) restore(); }
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (location.hash.startsWith("#artwork-")) {
      const origin = document.getElementById(location.hash.slice(1));
      if (origin?.matches("a.artwork-link")) requestAnimationFrame(() => {
        origin.focus({ preventScroll: true });
        // Honor the explicitly requested fragment even when hydration runs
        // before the browser's initial anchor positioning. Never animate it.
        origin.scrollIntoView({ block: "start", behavior: "instant" });
      });
    } else if (navigation?.type === "back_forward") restore();
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [layout]);
  return null;
}

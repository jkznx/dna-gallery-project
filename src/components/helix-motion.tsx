"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cardReveal, helixGeometry, strandProgress } from "./helix-math";

const geometry = helixGeometry();
const preferenceKey = "dna-gallery-motion-paused";

export function HelixMotion({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const clip = useRef<SVGRectElement>(null);
  const clipId = useId();
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const active = ready && !paused && !reduced;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    try { setPaused(sessionStorage.getItem(preferenceKey) === "1"); } catch { /* Optional preference only. */ }
    setReady(true);
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    const root = stage.current;
    const rectangle = clip.current;
    if (!root || !rectangle) return;
    if (!active) {
      rectangle.setAttribute("height", "1000");
      root.dataset.progress = "1";
      return;
    }

    let frame = 0;
    let alive = true;
    let top = 0;
    let height = 1;
    let viewport = window.innerHeight;
    let cards: { element: HTMLElement; top: number; height: number }[] = [];

    function paint() {
      frame = 0;
      const scroll = window.scrollY;
      const progress = strandProgress(scroll, viewport, top, height);
      rectangle!.setAttribute("height", (progress * 1000).toFixed(2));
      root!.dataset.progress = progress.toFixed(4);
      for (const card of cards) {
        const reveal = cardReveal(scroll, viewport, card.top, card.height);
        card.element.style.setProperty("--card-reveal", reveal.toFixed(4));
      }
    }
    function schedule() { if (alive && !frame) frame = requestAnimationFrame(paint); }
    function measure() {
      if (!alive) return;
      const bounds = root!.getBoundingClientRect();
      top = bounds.top + window.scrollY;
      height = bounds.height;
      viewport = window.innerHeight;
      // Measure stable list items, never the animated image interiors.
      cards = Array.from(root!.querySelectorAll<HTMLElement>(".artwork")).map((element) => {
        const box = element.getBoundingClientRect();
        return { element, top: box.top + window.scrollY, height: box.height };
      });
      schedule();
    }
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    document.fonts.ready.then(() => { if (alive) measure(); });
    measure();
    return () => {
      alive = false;
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      cancelAnimationFrame(frame);
    };
  }, [active]);

  function toggle() {
    const next = !paused;
    setPaused(next);
    try { sessionStorage.setItem(preferenceKey, next ? "1" : "0"); } catch { /* Motion still toggles without storage. */ }
  }

  const lines = <>{geometry.rungs.map(({ y, left, right }, i) => <line key={i} x1={left} x2={right} y1={y} y2={y}/>)}{geometry.paths.map((d, i) => <path key={i} d={d}/>)}</>;

  return <div className="helix-experience" data-motion={active ? "on" : "off"}>
    <div className="motion-controls">
      <button type="button" aria-label="Scroll motion" aria-pressed={active} aria-describedby="motion-description" disabled={!ready || reduced} onClick={toggle}>{!ready ? "Scroll motion unavailable" : reduced ? "Motion off (system preference)" : active ? "Pause scroll motion" : "Enable scroll motion"}</button>
      <p id="motion-description" aria-live="polite">{!ready ? "Complete static strand. Scroll motion loads when available." : reduced ? "Motion off: reduced-motion preference. All artwork is visible." : active ? "Motion on: scroll down to trace the DNA; scroll up to reverse." : "Motion paused: complete strand and all artwork visible."}</p>
    </div>
    <div ref={stage} className="dna-stage" data-progress="1">
      <svg className="dna-track" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <defs><clipPath id={clipId}><rect ref={clip} x="0" y="0" width="100" height="1000"/></clipPath></defs>
        <g className="dna-base">{lines}</g>
        <g className="dna-trace" clipPath={`url(#${clipId})`}><g className="dna-trace-edge">{lines}</g><g className="dna-trace-color">{lines}</g></g>
      </svg>
      {children}
    </div>
  </div>;
}

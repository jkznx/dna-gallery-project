"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Artwork } from "@/content/gallery";
import { ladderGeometry, resizedTimelineOffset, scrollDesignPosition, settledDesign } from "./ladder-math";

const initialGeometry = ladderGeometry(0);
const pauseKey = "dna-gallery-motion-paused";
const returnKey = "dna-gallery-return:helix";

export function DnaLadder({ artworks }: { artworks: readonly Artwork[] }) {
  const root = useRef<HTMLDivElement>(null);
  const space = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const offset = useRef(0);
  const resumeSelection = useRef<number | null>(null);
  const dimensions = useRef({ top: 0, step: 1 });
  const schedulePaint = useRef<() => void>(() => {});
  const pendingReturn = useRef<{ index: number; y?: number; offset?: number } | null>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const interactive = ready && !paused && !reduced;
  const current = artworks[active];

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    try { setPaused(sessionStorage.getItem(pauseKey) === "1"); } catch { /* Optional preference. */ }
    const fragment = artworks.findIndex((item) => location.hash === `#artwork-${item.id}`);
    if (fragment >= 0) pendingReturn.current = { index: fragment };
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward") {
      try {
        const saved = JSON.parse(sessionStorage.getItem(returnKey) ?? "null");
        const index = artworks.findIndex((item) => `artwork-${item.id}` === saved?.id);
        if (index >= 0 && Number.isFinite(saved?.y)) pendingReturn.current = { index, y: saved.y, offset: Number.isFinite(saved.offset) ? saved.offset : 0 };
      } catch { /* Direct fragments still work without storage. */ }
    }
    if (pendingReturn.current) { activeRef.current = pendingReturn.current.index; setActive(activeRef.current); }
    setReady(true);
    const changed = () => { if (media.matches) resumeSelection.current = activeRef.current; setReduced(media.matches); };
    media.addEventListener("change", changed);
    return () => media.removeEventListener("change", changed);
  }, [artworks]);

  useEffect(() => {
    const host = root.current;
    const scene = space.current;
    if (!host || !scene || !ready) return;
    let frame = 0;
    let restorationFrame = 0;
    let alive = true;
    let measured = false;
    let compact = false;
    const paths = Array.from(scene.querySelectorAll<SVGPathElement>(".ladder-strand"));
    const rungs = Array.from(scene.querySelectorAll<SVGLineElement>(".ladder-rung"));
    const connectors = Array.from(scene.querySelectorAll<SVGLineElement>(".ladder-connector"));
    const previews = Array.from(scene.querySelectorAll<HTMLElement>(".ladder-preview"));

    function paint() {
      frame = 0;
      if (!alive || !interactive) return;
      const { top, step } = dimensions.current;
      const position = scrollDesignPosition(scrollY, top, step, offset.current, artworks.length);
      host!.dataset.position = position.toFixed(4);
      const next = settledDesign(position, activeRef.current, artworks.length);
      if (next !== activeRef.current) { activeRef.current = next; setActive(next); }
      const geometry = ladderGeometry(position, compact);
      paths.forEach((path, i) => path.setAttribute("d", geometry.paths[i]));
      const line = (element: SVGLineElement, a: { x: number; y: number }, b: { x: number; y: number }) => {
        element.setAttribute("x1", a.x.toFixed(2)); element.setAttribute("y1", a.y.toFixed(2));
        element.setAttribute("x2", b.x.toFixed(2)); element.setAttribute("y2", b.y.toFixed(2));
      };
      rungs.forEach((element, i) => line(element, geometry.rungs[i].a, geometry.rungs[i].b));
      connectors.forEach((element, i) => line(element, geometry.connectors[i].from, geometry.connectors[i].to));
      previews.forEach((element, i) => {
        const pose = geometry.previews[i];
        element.style.setProperty("--preview-x", `${pose.x.toFixed(3)}%`);
        element.style.setProperty("--preview-y", `${pose.y.toFixed(3)}%`);
        element.style.setProperty("--preview-depth", `${pose.z.toFixed(2)}px`);
        element.style.setProperty("--preview-yaw", `${pose.yaw.toFixed(2)}deg`);
        element.style.setProperty("--preview-roll", `${pose.roll.toFixed(2)}deg`);
        element.style.setProperty("--preview-scale", pose.scale.toFixed(4));
      });
    }
    function schedule() { if (alive && !frame) frame = requestAnimationFrame(paint); }
    schedulePaint.current = schedule;
    function measure() {
      if (!alive) return;
      const previous = dimensions.current;
      const box = host!.getBoundingClientRect();
      const controlsHeight = controls.current?.getBoundingClientRect().height ?? 0;
      host!.style.setProperty("--ladder-controls-height", `${controlsHeight}px`);
      const sceneBounds = scene!.getBoundingClientRect();
      const sceneHeight = sceneBounds.height;
      compact = sceneBounds.width < 600;
      dimensions.current = { top: box.top + scrollY, step: Math.max(1, (box.height - sceneHeight - controlsHeight) / Math.max(1, artworks.length - 1)) };
      if (measured && interactive) offset.current = resizedTimelineOffset(scrollY, previous, dimensions.current, offset.current);
      measured = true;
      schedule();
    }
    function pageShown(event: PageTransitionEvent) {
      measure();
      if (event.persisted) host!.querySelector<HTMLElement>(`[data-design-index="${activeRef.current}"] ${interactive ? ".ladder-select" : ".ladder-static-view"}`)?.focus({ preventScroll: true });
    }
    function fragmentChanged() {
      const index = artworks.findIndex((item) => location.hash === `#artwork-${item.id}`);
      if (index < 0) return;
      activeRef.current = index; setActive(index); offset.current = 0;
      const item = host!.querySelector<HTMLElement>(`[data-design-index="${index}"]`);
      if (interactive) {
        window.scrollTo({ top: dimensions.current.top + index * dimensions.current.step, behavior: "instant" });
        item?.querySelector<HTMLButtonElement>(".ladder-select")?.focus({ preventScroll: true });
        schedule();
      } else {
        item?.scrollIntoView({ block: "center", behavior: "instant" });
        item?.querySelector<HTMLAnchorElement>(".ladder-static-view")?.focus({ preventScroll: true });
      }
    }
    const observer = new ResizeObserver(measure);
    observer.observe(host); if (controls.current) observer.observe(controls.current);
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", pageShown);
    window.addEventListener("hashchange", fragmentChanged);
    if (interactive) window.addEventListener("scroll", schedule, { passive: true });
    document.fonts.ready.then(() => { if (alive) measure(); });
    measure();
    if (interactive && resumeSelection.current !== null) {
      const index = resumeSelection.current;
      offset.current = index - (scrollY - dimensions.current.top) / dimensions.current.step;
      activeRef.current = index; setActive(index); resumeSelection.current = null;
      schedule();
    }
    const saved = pendingReturn.current;
    if (saved) {
      pendingReturn.current = null;
      restorationFrame = requestAnimationFrame(() => {
        restorationFrame = 0;
        if (!alive) return;
        const item = host!.querySelector<HTMLElement>(`[data-design-index="${saved.index}"]`);
        if (interactive) {
          offset.current = saved.offset ?? 0;
          window.scrollTo({ top: saved.y ?? dimensions.current.top + saved.index * dimensions.current.step, behavior: "instant" });
          item?.querySelector<HTMLButtonElement>(".ladder-select")?.focus({ preventScroll: true });
          schedule();
        } else {
          resumeSelection.current = saved.index;
          item?.scrollIntoView({ block: "center", behavior: "instant" });
          item?.querySelector<HTMLAnchorElement>(".ladder-static-view")?.focus({ preventScroll: true });
        }
      });
    }
    return () => {
      alive = false; observer.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(restorationFrame);
      schedulePaint.current = () => {};
      window.removeEventListener("resize", measure); window.removeEventListener("scroll", schedule);
      window.removeEventListener("pageshow", pageShown);
      window.removeEventListener("hashchange", fragmentChanged);
    };
  }, [interactive, ready, artworks.length]);

  function select(index: number) {
    const next = Math.max(0, Math.min(artworks.length - 1, index));
    const { top, step } = dimensions.current;
    offset.current = next - (scrollY - top) / step;
    activeRef.current = next; setActive(next); schedulePaint.current();
  }
  function remember(id: string) {
    try { sessionStorage.setItem(returnKey, JSON.stringify({ id: `artwork-${id}`, y: scrollY, offset: offset.current })); } catch { /* Native navigation remains available. */ }
  }
  function toggle() {
    const value = !paused;
    if (!value) resumeSelection.current = activeRef.current;
    setPaused(value);
    try { sessionStorage.setItem(pauseKey, value ? "1" : "0"); } catch { /* Optional preference. */ }
  }

  return <div ref={root} className="ladder-experience" data-mode={interactive ? "interactive" : "static"} data-active-index={active} data-position="0" style={{ "--ladder-steps": artworks.length - 1 } as CSSProperties}>
    <div ref={controls} className="ladder-controls">
      <button type="button" aria-label="3D motion" aria-pressed={interactive} disabled={!ready || reduced} onClick={toggle}>{!ready ? "Static gallery" : reduced ? "Motion off (system preference)" : interactive ? "Pause 3D motion" : "Enable 3D motion"}</button>
      <p>{interactive ? "Scroll down or up to bring a design to the center. Or select a small preview." : "Complete static gallery. All designs and detail links are available."}</p>
    </div>
    <div ref={space} className="ladder-space">
      <svg className="ladder-spine" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <g className="ladder-rungs">{initialGeometry.rungs.map(({ a, b }, i) => <line className="ladder-rung" key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>)}</g>
        {initialGeometry.paths.map((d, i) => <path className="ladder-strand" key={i} d={d}/>)}
        <g className="ladder-connectors">{initialGeometry.connectors.map(({ from, to }, i) => <line className="ladder-connector" key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}/>)}</g>
      </svg>
      <div className="ladder-feature" aria-label="Centered design">
        <div className="ladder-feature-art" key={current.id}><Image src={current.image} alt={current.alt} width={current.width} height={current.height} sizes="(max-width: 600px) 60vw, 40vw" priority/></div>
        <div className="ladder-feature-caption" aria-live="polite" aria-atomic="true"><h3>{current.title}</h3><p>{current.medium}</p></div>
        <a className="ladder-view" href={`/artwork/${current.slug}?layout=helix`} onClick={() => remember(current.id)}>View design ↗</a>
      </div>
      <ol className="ladder-previews" aria-label="Designs in collection order">
        {artworks.map((artwork, index) => <li key={artwork.id} id={`artwork-${artwork.id}`} className="ladder-preview" data-design-index={index} style={{ "--preview-row": Math.floor(index / 2), "--preview-side": index % 2 } as CSSProperties}>
          <button type="button" className="ladder-select" aria-label={`Show ${artwork.title} in center`} aria-pressed={index === active} disabled={!interactive} onClick={() => select(index)}>
            <Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 70vw, 25vw"/>
            <span className="ladder-preview-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          </button>
          <h3 className="ladder-static-title">{artwork.title}</h3>
          <p className="ladder-static-title">{artwork.medium}</p>
          <a className="ladder-static-view" href={`/artwork/${artwork.slug}?layout=helix`} onClick={() => remember(artwork.id)}>View {artwork.title} ↗</a>
        </li>)}
      </ol>
      <nav className="ladder-navigation" aria-label="Centered design navigation">
        <button type="button" disabled={active === 0} onClick={() => select(active - 1)}>← Previous</button>
        <p aria-live="polite">{active + 1} of {artworks.length}</p>
        <button type="button" disabled={active === artworks.length - 1} onClick={() => select(active + 1)}>Next →</button>
      </nav>
    </div>
  </div>;
}

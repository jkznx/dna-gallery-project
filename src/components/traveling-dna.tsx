"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Artwork } from "@/content/gallery";
import { resizedTimelineOffset, scrollDesignPosition, settledDesign } from "./ladder-math";
import { followTravelPosition, settledTravelPosition, travelingScene } from "./travel-math";

const initialGeometry = travelingScene(0, 1000, 580, 6);
const pauseKey = "dna-gallery-motion-paused";
const returnKey = "dna-gallery-return:helix";

export function TravelingDna({ artworks }: { artworks: readonly Artwork[] }) {
  const root = useRef<HTMLDivElement>(null);
  const space = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const offset = useRef(0);
  const resumeSelection = useRef<number | null>(null);
  const dimensions = useRef({ top: 0, step: 1 });
  const schedulePaint = useRef<() => void>(() => {});
  const cancelSettling = useRef<() => void>(() => {});
  const lastPosition = useRef(0);
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
    const viewport = canvas.current;
    if (!host || !scene || !viewport || !ready) return;
    let frame = 0;
    let restorationFrame = 0;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    let tween: { from: number; to: number; start: number } | null = null;
    let following = false, direction = 1;
    let atRest = false;
    let lastScroll = scrollY;
    let alive = true;
    let measured = false;
    let width = 1000, height = 580;
    const paths = Array.from(scene.querySelectorAll<SVGPathElement>(".travel-strand"));
    const rungs = Array.from(scene.querySelectorAll<SVGLineElement>(".travel-rung"));
    const nodes = Array.from(scene.querySelectorAll<SVGCircleElement>(".travel-node"));
    const cards = Array.from(scene.querySelectorAll<HTMLElement>(".travel-card"));
    const pickers = Array.from(scene.querySelectorAll<HTMLButtonElement>(".travel-picker button"));
    if (!interactive) cards.forEach((card) => { card.removeAttribute("aria-hidden"); delete card.dataset.visible; });

    function paint(now = performance.now()) {
      frame = 0;
      if (!alive || !interactive) return;
      const { top, step } = dimensions.current;
      let position = scrollDesignPosition(scrollY, top, step, offset.current, artworks.length);
      host!.dataset.scrollPosition = position.toFixed(4);
      if (tween) {
        position = settledTravelPosition(tween.from, tween.to, now - tween.start);
        if (now - tween.start >= 220) {
          tween = null; atRest = true;
        }
      } else if (atRest && !following) {
        position = activeRef.current;
      } else if (following) {
        const next = followTravelPosition(lastPosition.current, position, direction);
        if (next === lastPosition.current || next === position) following = false;
        position = next;
      }
      lastPosition.current = position;
      lastScroll = scrollY;
      host!.dataset.position = position.toFixed(4);
      const next = settledDesign(position, activeRef.current, artworks.length);
      if (next !== activeRef.current) { activeRef.current = next; setActive(next); }
      const geometry = travelingScene(position, width, height, artworks.length);
      paths.forEach((path, i) => path.setAttribute("d", geometry.paths[i]));
      const line = (element: SVGLineElement, a: { x: number; y: number }, b: { x: number; y: number }) => {
        element.setAttribute("x1", a.x.toFixed(2)); element.setAttribute("y1", a.y.toFixed(2));
        element.setAttribute("x2", b.x.toFixed(2)); element.setAttribute("y2", b.y.toFixed(2));
      };
      rungs.forEach((element, i) => line(element, geometry.rungs[i].a, geometry.rungs[i].b));
      nodes.forEach((node, i) => {
        const point = i % 2 ? geometry.rungs[Math.floor(i / 2)].b : geometry.rungs[Math.floor(i / 2)].a;
        node.setAttribute("cx", point.x.toFixed(2)); node.setAttribute("cy", point.y.toFixed(2));
      });
      cards.forEach((element, i) => {
        const pose = geometry.cards[i];
        const button = element.querySelector<HTMLButtonElement>(".travel-select")!;
        if (!pose.selectable && element.contains(document.activeElement)) pickers[i]?.focus({ preventScroll: true });
        element.setAttribute("aria-hidden", String(!pose.selectable));
        element.dataset.visible = String(pose.opacity > 0);
        button.tabIndex = pose.selectable ? 0 : -1;
        button.style.pointerEvents = pose.selectable ? "auto" : "none";
        element.style.zIndex = String(Math.round(1000 + pose.promotion * 1000 + pose.z));
        element.style.setProperty("--card-x", `${pose.x.toFixed(3)}px`);
        element.style.setProperty("--card-y", `${pose.y.toFixed(3)}px`);
        element.style.setProperty("--card-z", `${pose.z.toFixed(3)}px`);
        element.style.setProperty("--card-scale", pose.scale.toFixed(5));
        element.style.setProperty("--card-yaw", `${pose.yaw.toFixed(3)}deg`);
        element.style.setProperty("--card-opacity", pose.opacity.toFixed(4));
        element.style.setProperty("--card-width", `${pose.frameWidth.toFixed(3)}px`);
        element.style.setProperty("--card-height", `${pose.frameHeight.toFixed(3)}px`);
      });
      if (tween || following) schedule();
    }
    function schedule() { if (alive && !frame) frame = requestAnimationFrame(paint); }
    schedulePaint.current = schedule;
    function stopSettling() {
      clearTimeout(settleTimer); tween = null; following = false; atRest = false;
      cancelAnimationFrame(frame); frame = 0;
    }
    cancelSettling.current = stopSettling;
    function beginSettling() {
      if (!alive) return;
      // Decide from accumulated document progress even if painting was throttled.
      const { top, step } = dimensions.current;
      const raw = scrollDesignPosition(scrollY, top, step, offset.current, artworks.length);
      const next = settledDesign(raw, activeRef.current, artworks.length);
      if (next !== activeRef.current) { activeRef.current = next; setActive(next); }
      if (Math.abs(lastPosition.current - activeRef.current) < 0.005) { atRest = true; following = false; return; }
      following = false; atRest = false;
      tween = { from: lastPosition.current, to: activeRef.current, start: performance.now() };
      schedule();
    }
    function onScroll() {
      const delta = scrollY - lastScroll;
      if (delta) direction = Math.sign(delta);
      tween = null; atRest = false; following = true;
      clearTimeout(settleTimer);
      schedule();
      settleTimer = setTimeout(beginSettling, 180);
    }
    function measure() {
      if (!alive) return;
      const previous = dimensions.current;
      const box = host!.getBoundingClientRect();
      const controlsHeight = controls.current?.getBoundingClientRect().height ?? 0;
      host!.style.setProperty("--travel-controls-height", `${controlsHeight}px`);
      const sceneHeight = scene!.getBoundingClientRect().height;
      const viewportBounds = viewport!.getBoundingClientRect();
      width = viewportBounds.width; height = viewportBounds.height;
      dimensions.current = { top: box.top + scrollY, step: Math.max(1, (box.height - sceneHeight - controlsHeight) / Math.max(1, artworks.length - 1)) };
      if (measured && interactive) offset.current = resizedTimelineOffset(scrollY, previous, dimensions.current, offset.current);
      measured = true;
      schedule();
    }
    function pageShown(event: PageTransitionEvent) {
      measure();
      if (event.persisted) host!.querySelector<HTMLElement>(`[data-design-index="${activeRef.current}"] ${interactive ? ".travel-select" : ".travel-static-view"}`)?.focus({ preventScroll: true });
    }
    function fragmentChanged() {
      const index = artworks.findIndex((item) => location.hash === `#artwork-${item.id}`);
      if (index < 0) return;
      activeRef.current = index; setActive(index); offset.current = 0;
      const item = host!.querySelector<HTMLElement>(`[data-design-index="${index}"]`);
      if (interactive) {
        stopSettling();
        window.scrollTo({ top: dimensions.current.top + index * dimensions.current.step, behavior: "instant" });
        cancelAnimationFrame(frame); paint();
        item?.querySelector<HTMLButtonElement>(".travel-select")?.focus({ preventScroll: true });
        beginSettling();
      } else {
        item?.scrollIntoView({ block: "center", behavior: "instant" });
        item?.querySelector<HTMLAnchorElement>(".travel-static-view")?.focus({ preventScroll: true });
      }
    }
    const observer = new ResizeObserver(measure);
    observer.observe(host); if (controls.current) observer.observe(controls.current);
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", pageShown);
    window.addEventListener("hashchange", fragmentChanged);
    if (interactive) window.addEventListener("scroll", onScroll, { passive: true });
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
          stopSettling();
          offset.current = saved.offset ?? 0;
          window.scrollTo({ top: saved.y ?? dimensions.current.top + saved.index * dimensions.current.step, behavior: "instant" });
          cancelAnimationFrame(frame); paint();
          item?.querySelector<HTMLButtonElement>(".travel-select")?.focus({ preventScroll: true });
          beginSettling();
        } else {
          resumeSelection.current = saved.index;
          item?.scrollIntoView({ block: "center", behavior: "instant" });
          item?.querySelector<HTMLAnchorElement>(".travel-static-view")?.focus({ preventScroll: true });
        }
      });
    }
    return () => {
      alive = false; observer.disconnect(); stopSettling(); cancelAnimationFrame(restorationFrame);
      schedulePaint.current = () => {};
      cancelSettling.current = () => {};
      window.removeEventListener("resize", measure); window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", pageShown);
      window.removeEventListener("hashchange", fragmentChanged);
    };
  }, [interactive, ready, artworks.length]);

  function select(index: number) {
    cancelSettling.current();
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

  return <div ref={root} className="travel-experience" data-mode={interactive ? "interactive" : "static"} data-active-index={active} data-position="0" style={{ "--travel-steps": artworks.length - 1 } as CSSProperties}>
    <div ref={controls} className="travel-controls">
      <button type="button" aria-label="DNA motion" aria-pressed={interactive} disabled={!ready || reduced} onClick={toggle}>{!ready ? "Static gallery" : reduced ? "Motion off (system preference)" : interactive ? "Pause DNA motion" : "Enable DNA motion"}</button>
      <p>{interactive ? "Scroll down to carry designs through the DNA focus. Scroll up to reverse." : "Complete static gallery. All six designs and their detail links are available."}</p>
    </div>
    <div ref={space} className="travel-stage">
      <div ref={canvas} className="travel-canvas">
        <svg className="travel-spine" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g className="travel-rungs">{initialGeometry.rungs.map(({ a, b }, i) => <line className="travel-rung" key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}/>)}</g>
          {initialGeometry.paths.map((d, i) => <path className="travel-strand" key={i} d={d}/>)}
          <g className="travel-nodes">{initialGeometry.rungs.flatMap(({ a, b }, i) => [<circle className="travel-node" key={i + "a"} cx={a.x} cy={a.y} r="3"/>, <circle className="travel-node" key={i + "b"} cx={b.x} cy={b.y} r="3"/>])}</g>
        </svg>
        <ol className="travel-cards" aria-label="Designs traveling in collection order">
          {artworks.map((artwork, index) => <li key={artwork.id} id={"artwork-" + artwork.id} className="travel-card" data-design-index={index} data-selected={index === active}>
            <button type="button" className="travel-select" aria-label={"Select " + artwork.title} aria-pressed={index === active} tabIndex={interactive ? 0 : -1} disabled={!interactive} onClick={() => select(index)}>
              <Image src={artwork.image} alt={artwork.alt} width={artwork.width} height={artwork.height} sizes="(max-width: 600px) 82vw, 500px" loading="eager" priority={index === 0}/>
            </button>
            <h3 className="travel-static-title">{artwork.title}</h3><p className="travel-static-title">{artwork.medium}</p>
            <a className="travel-static-view" href={"/artwork/" + artwork.slug + "?layout=helix"} onClick={() => remember(artwork.id)}>View {artwork.title} &#8599;</a>
          </li>)}
        </ol>
      </div>
      <div className="travel-footer">
        <div className="travel-caption" aria-live="polite" aria-atomic="true"><h3>{current.title}</h3><p>{current.medium}</p></div>
        <a className="travel-view" href={"/artwork/" + current.slug + "?layout=helix"} onClick={() => remember(current.id)}>View design &#8599;</a>
        <nav className="travel-navigation" aria-label="Design navigation"><button type="button" disabled={active === 0} onClick={() => select(active - 1)}>&#8592; Previous</button><p aria-live="polite">{active + 1} of {artworks.length}</p><button type="button" disabled={active === artworks.length - 1} onClick={() => select(active + 1)}>Next &#8594;</button></nav>
        <nav className="travel-picker" aria-label="Choose any design">{artworks.map((artwork, index) => <button type="button" key={artwork.id} aria-label={"Select design " + String(index + 1).padStart(2, "0") + ": " + artwork.title} aria-pressed={index === active} onClick={() => select(index)}>{String(index + 1).padStart(2, "0")}</button>)}</nav>
      </div>
    </div>
  </div>;
}

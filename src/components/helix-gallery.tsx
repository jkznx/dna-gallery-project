"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Artwork } from "@/content/gallery";
import { RestoreGalleryFocus } from "./artwork-link";

/** Small client shell for /gallery and /helix. It never imports three.js itself: the 3D scene is a separate chunk
 * loaded only after a WebGL check passes, so Grid, Info, Connections and Saved never download it.
 * States: "pending" (server render / before the check), "3d" (scene mounted), "static" (no WebGL, or the scene
 * failed). Without JavaScript the page keeps the server-rendered static gallery (CSS `@media (scripting)`). */
export type HelixState = "pending" | "3d" | "static";

function FailToStatic({ onFail }: { onFail: () => void }) { useEffect(() => { onFail(); }, [onFail]); return null; }
let failHandler: () => void = () => {};
const Helix3DScene = dynamic(
  () => import("./helix3d-scene").then((m) => m.Helix3DScene).catch(() => function SceneUnavailable() { return <FailToStatic onFail={failHandler}/>; }),
  { ssr: false, loading: () => null },
);

function webglAvailable(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = (probe.getContext("webgl2") || probe.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}

export function HelixGallery({ artworks, intro }: { artworks: readonly Artwork[]; intro: ReactNode }) {
  const host = useRef<HTMLElement>(null);
  const introBox = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<HelixState>("pending");
  useEffect(() => {
    failHandler = () => setState("static");
    setState(artworks.length > 0 && webglAvailable() ? "3d" : "static");
    return () => { failHandler = () => {}; };
  }, [artworks.length]);
  /** "Search" in the intro is a plain #study-search-input link (works without JavaScript); with JavaScript it also focuses the field. */
  function focusSearch(event: MouseEvent<HTMLDivElement>) {
    if (!(event.target as Element).closest?.("a[data-focus-search]")) return;
    requestAnimationFrame(() => document.getElementById("study-search-input")?.focus({ preventScroll: true }));
  }
  return <>
    <section ref={host} className="helix3d" data-state={state} aria-labelledby="gallery-title">
      <div className="h3d-stage">
        <div className="h3d-frame">
          {/* the intro comes first so its links follow the header nav in Tab order; CSS stacks it above the canvas */}
          <div ref={introBox} className="h3d-intro" onClick={focusSearch}>{intro}</div>
          {state === "3d" && <Helix3DScene artworks={artworks} hostRef={host} introRef={introBox} onFail={() => setState("static")}/>}
        </div>
      </div>
    </section>
    {state === "static" && <RestoreGalleryFocus layout="helix"/>}
  </>;
}

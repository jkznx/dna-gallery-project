"use client";

/** DNA Gallery 3D · the WebGL scene (P2). Loaded lazily by helix-gallery.tsx, so three.js ships only to /gallery and
 * /helix. Ported from prototype-3d/app.js; look by Dr. Miranda (design-p0), decisions from design-p0/P1-DECISIONS.md.
 *
 * Rules kept from the DNA flow: scrolling is never hijacked (passive listener) and the animation never scrolls the
 * page. Previous/Next/picker jump the page instantly to that artwork's slot (a user action) and the camera flies.
 * 180 ms after scrolling stops, the nearest artwork becomes active and the view eases onto it without scrolling.
 * Pause motion and prefers-reduced-motion give the still pose; camera moves become a cut with a short fade. */

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import * as THREE from "three";
import type { Artwork } from "@/content/gallery";
import * as HM from "./helix3d-math";
import { layoutCallouts, type PrevPlacement, type Rect } from "./helix3d-layout";

const pauseKey = "dna-gallery-motion-paused";
const returnKey = "dna-gallery-return:helix";
const pad2 = (i: number) => String(i + 1).padStart(2, "0");
const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0].replace(/\.$/, "").toLowerCase();

type Props = { artworks: readonly Artwork[]; hostRef: RefObject<HTMLElement | null>; introRef: RefObject<HTMLDivElement | null>; onFail: () => void };
type Engine = { go: (i: number) => void; toggleMotion: () => void; afterCardRender: (from: DOMRect | null) => void; rememberReturn: () => void; dispose: () => void };

export function Helix3DScene({ artworks, hostRef, introRef, onFail }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null), svgRef = useRef<SVGSVGElement>(null), scrimRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLAnchorElement>(null), dockRef = useRef<HTMLDivElement>(null), smallsRef = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null), flipFrom = useRef<DOMRect | null>(null);
  const [active, setActive] = useState(0);
  const [motion, setMotion] = useState(true);
  const [live, setLive] = useState("");
  const total = String(artworks.length).padStart(2, "0");

  useEffect(() => {
    const host = hostRef.current, intro = introRef.current, canvas = canvasRef.current, svg = svgRef.current, scrim = scrimRef.current;
    const card = cardRef.current, dock = dockRef.current, smallsBox = smallsRef.current;
    if (!host || !intro || !canvas || !svg || !scrim || !card || !dock || !smallsBox) return;
    try {
      engine.current = createEngine({
        host, intro, canvas, svg, scrim, card, dock, smalls: Array.from(smallsBox.children) as HTMLElement[], artworks,
        onSelect(i, announce, from) { flipFrom.current = from; setActive(i); if (announce) setLive(`${pad2(i)} of ${total}, ${artworks[i].title}`); },
        onMotion: setMotion, onFail,
      });
    } catch { onFail(); }
    return () => { engine.current?.dispose(); engine.current = null; };
  }, [artworks, hostRef, introRef, onFail, total]);

  useLayoutEffect(() => { engine.current?.afterCardRender(flipFrom.current); flipFrom.current = null; }, [active]);

  const current = artworks[active];
  const pauseLabel = motion ? "Pause motion" : "Resume motion";
  function openActive(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    engine.current?.rememberReturn();
  }
  return <>
    <canvas ref={canvasRef} className="h3d-canvas" aria-hidden="true"/>
    <div ref={scrimRef} className="h3d-scrim" aria-hidden="true"/>
    <svg ref={svgRef} className="h3d-leaders" aria-hidden="true" focusable="false"/>
    <div ref={smallsRef} className="h3d-smalls" aria-hidden="true">
      {artworks.map((artwork, i) => <button type="button" key={artwork.id} className="h3d-small" tabIndex={-1} data-i={i} onClick={() => engine.current?.go(i)}>
        <figure><Image src={artwork.image} alt="" width={artwork.width} height={artwork.height} sizes="84px"/><figcaption><b>{pad2(i)}</b>{artwork.title}</figcaption></figure>
        <span className="h3d-dotn">{pad2(i)}</span>
      </button>)}
    </div>
    <a ref={cardRef} className="h3d-active" href={`/artwork/${current.slug}?layout=helix`} aria-label={`View artwork: ${current.title}, ${pad2(active)} of ${total}`} onClick={openActive}>
      <figure><Image src={current.image} alt="" width={current.width} height={current.height} sizes="(max-width: 600px) 96px, 218px" loading="eager"/></figure>
      <span className="h3d-active-text">
        <span className="h3d-num">{pad2(active)} / {total} · Selected</span>
        <span className="h3d-title">{current.title}</span>
        <span className="h3d-medium">{current.medium}</span>
        <span className="h3d-hand">{firstSentence(current.description)}</span>
        <span className="h3d-view">View artwork <span aria-hidden="true">→</span></span>
      </span>
    </a>
    <div ref={dockRef} className="h3d-dock" role="group" aria-label="Choose an artwork">
      <button type="button" className="h3d-btn h3d-prev" aria-label="Previous artwork" aria-disabled={active === 0 || undefined} onClick={() => engine.current?.go(active - 1)}><span aria-hidden="true">←</span><span className="h3d-lbl"> Previous</span></button>
      <div className="h3d-picker">{artworks.map((artwork, i) => <button type="button" key={artwork.id} aria-label={`${pad2(i)} ${artwork.title}`} title={artwork.title} aria-current={i === active ? "true" : undefined} onClick={() => engine.current?.go(i)}>{pad2(i)}</button>)}</div>
      <button type="button" className="h3d-btn h3d-next" aria-label="Next artwork" aria-disabled={active === artworks.length - 1 || undefined} onClick={() => engine.current?.go(active + 1)}><span className="h3d-lbl">Next </span><span aria-hidden="true">→</span></button>
      <button type="button" className="h3d-btn h3d-pause" data-motion={motion ? "on" : "off"} aria-label={pauseLabel} title={pauseLabel} onClick={() => engine.current?.toggleMotion()}>
        {motion
          ? <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><rect x="3" y="2" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="9.6" y="2" width="3.4" height="12" rx="1" fill="currentColor"/></svg>
          : <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M4 2.2v11.6a.8.8 0 0 0 1.2.7l9.4-5.8a.8.8 0 0 0 0-1.4L5.2 1.5A.8.8 0 0 0 4 2.2z" fill="currentColor"/></svg>}
        <span className="h3d-lbl">{pauseLabel}</span>
      </button>
    </div>
    <p className="h3d-live" aria-live="polite" aria-atomic="true">{live}</p>
  </>;
}

// =====================================================================================================================
type EngineCtx = {
  host: HTMLElement; intro: HTMLElement; canvas: HTMLCanvasElement; svg: SVGSVGElement; scrim: HTMLElement; card: HTMLAnchorElement;
  dock: HTMLElement; smalls: HTMLElement[]; artworks: readonly Artwork[];
  onSelect: (i: number, announce: boolean, from: DOMRect | null) => void; onMotion: (on: boolean) => void; onFail: () => void;
};
type Mode = "wide" | "tall" | "phone";

function createEngine(ctx: EngineCtx): Engine {
  const { host, intro, canvas, svg, scrim, card, dock, smalls, artworks } = ctx;
  const frame = canvas.parentElement as HTMLElement, stage = frame.parentElement as HTMLElement;
  const header = document.querySelector<HTMLElement>(".site-header");
  const P = HM.makeParams({ count: artworks.length }), RL = HM.rungLayout(P), clamp = HM.clamp;

  // ---------------- renderer, studio light, pearl-clay ----------------
  // three r155+ uses physical light units; ×π and unmanaged colours keep Miranda's approved r147 look.
  THREE.ColorManagement.enabled = false;
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  R.setClearColor(0, 0); R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1;
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200), PI = Math.PI;
  scene.add(new THREE.HemisphereLight("#fffaf0", "#c9a9d3", 0.42 * PI));
  const key = new THREE.DirectionalLight("#fff3df", 2.1 * PI); key.position.set(-7, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight("#dda9ef", 1.6 * PI); rim.position.set(9, 3, -8); scene.add(rim);
  const fill = new THREE.DirectionalLight("#f8ed94", 0.45 * PI); fill.position.set(4, -8, 6); scene.add(fill);
  function pearl(k: number, grain: number, mat: THREE.MeshPhysicalMaterialParameters): THREE.MeshPhysicalMaterial {
    const m = new THREE.MeshPhysicalMaterial({ color: "#efe1c3", roughness: 0.62, metalness: 0, sheen: 0.8, sheenColor: new THREE.Color("#dda9ef"),
      sheenRoughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.5, ...mat });
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", `
      { vec3 vd=normalize(vViewPosition); float fr=pow(1.0-abs(dot(normal,vd)),2.3);
        vec3 tint=mix(vec3(0.973,0.929,0.580),vec3(0.867,0.663,0.937),clamp(normal.y*0.6+0.5,0.0,1.0));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,tint,fr*${k.toFixed(2)});
        float n=fract(sin(dot(floor(gl_FragCoord.xy*0.75),vec2(12.9898,78.233)))*43758.5453);
        gl_FragColor.rgb+=(n-0.5)*${grain.toFixed(3)}; }
      #include <dithering_fragment>`);
    };
    m.customProgramCacheKey = () => `pearl-${k}-${grain}`;   // each sheen strength gets its own program
    return m;
  }
  const MAT_STRAND = pearl(0.62, 0.018, { roughness: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.5 });   // same sheen strength as the rungs (Miranda, P2 review M1)
  const MAT_RUNG = pearl(0.62, 0.018, { roughness: 0.55 });
  const MAT_ACTIVE = pearl(0.9, 0.018, { color: "#ecc8f2", roughness: 0.5 });
  const outer = new THREE.Group(), inner = new THREE.Group(); outer.add(inner); scene.add(outer);

  // ---------------- liquid ribbon strands (one strand rebuilt per breathing frame; analytic normals) ----------------
  const N = Math.round(P.length * 14), M = 22, L = P.length;
  function strandGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * M * 3), 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(N * M * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + ((j + 1) % M), c = a + M, d = b + M; idx.push(a, b, c, b, d, c); }   // outward-facing winding (matches the outward normals below)
    g.setIndex(idx); return g;
  }
  const strands = [0, 1].map(() => { const g = strandGeometry(); const mesh = new THREE.Mesh(g, MAT_STRAND); mesh.frustumCulled = false; inner.add(mesh); return g; });
  const pa: HM.Vec3 = [0, 0, 0], pb: HM.Vec3 = [0, 0, 0], pc: HM.Vec3 = [0, 0, 0], ax: HM.Vec3 = [0, 0, 0];
  function updateStrand(k: number, t: number) {
    const g = strands[k], pos = g.attributes.position.array as Float32Array, nor = g.attributes.normal.array as Float32Array, e = (L / (N - 1)) * 0.5;
    for (let i = 0; i < N; i++) {
      const y = -L / 2 + (i / (N - 1)) * L;
      HM.strandPoint(y, k, t, P, pa); HM.strandPoint(y + e, k, t, P, pb); HM.strandPoint(y - e, k, t, P, pc); HM.axisPoint(y, t, P, ax);
      let tx = pb[0] - pc[0], ty = pb[1] - pc[1], tz = pb[2] - pc[2]; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      let nx = pa[0] - ax[0], ny = pa[1] - ax[1], nz = pa[2] - ax[2]; const d = nx * tx + ny * ty + nz * tz;
      nx -= tx * d; ny -= ty * d; nz -= tz * d; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const [wide, thin, tw] = HM.section(y, k, t);
      for (let j = 0; j < M; j++) {
        const f = (j / M) * HM.TAU + tw, cf = Math.cos(f), sf = Math.sin(f), c = cf * thin, s = sf * wide, o = (i * M + j) * 3;
        pos[o] = pa[0] + nx * c + bx * s; pos[o + 1] = pa[1] + ny * c + by * s; pos[o + 2] = pa[2] + nz * c + bz * s;
        const qx = nx * cf * wide + bx * sf * thin, qy = ny * cf * wide + by * sf * thin, qz = nz * cf * wide + bz * sf * thin, ql = Math.hypot(qx, qy, qz);
        nor[o] = qx / ql; nor[o + 1] = qy / ql; nor[o + 2] = qz / ql;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  }

  // ---------------- droplet rungs, instanced ----------------
  const pts: THREE.Vector2[] = [];
  for (let i = 0, seg = 64; i <= seg; i++) {
    const u = i / seg, v = Math.abs(u - 0.5) * 2, cap = Math.pow(Math.sin(Math.PI * u), 0.38);
    const r = 0.065 + 0.25 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.94 + 0.03)), 1.15) * (1 - 0.25 * v);
    pts.push(new THREE.Vector2(Math.max(1e-4, r * cap), u - 0.5));
  }
  const DROPLET = new THREE.LatheGeometry(pts, 28);
  const hash = (k: number) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rungVar = RL.ys.map((_, j) => 0.82 + 0.36 * hash(j));
  const rungs = new THREE.InstancedMesh(DROPLET, MAT_RUNG, RL.ys.length); rungs.frustumCulled = false; inner.add(rungs);
  const activeRung = new THREE.Mesh(DROPLET, MAT_ACTIVE); activeRung.frustumCulled = false; inner.add(activeRung);
  const UP = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const _m = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function updateRungs(t: number) {
    const act = RL.artworkRung[active];
    for (let j = 0; j < RL.ys.length; j++) {
      const y = RL.ys[j];
      HM.strandPoint(y, 0, t, P, pa); HM.strandPoint(y, 1, t, P, pb);
      _d.set(pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]); const len = _d.length(); _d.multiplyScalar(1 / len);
      _p.set((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2); _q.setFromUnitVectors(UP, _d);
      const w = rungVar[j] * (1 + 0.08 * Math.sin(y * 1.54 + t * 0.9)); _s.set(w, len * 0.9, w);
      if (j === act) { activeRung.position.copy(_p); activeRung.quaternion.copy(_q); activeRung.scale.copy(_s); rungs.setMatrixAt(j, ZERO); }
      else rungs.setMatrixAt(j, _m.compose(_p, _q, _s));
    }
    rungs.instanceMatrix.needsUpdate = true;
  }
  const partT = [NaN, NaN];
  function updateGeometry(t: number) { updateStrand(0, t); updateStrand(1, t); updateRungs(t); partT[0] = partT[1] = t; }

  // ---------------- state ----------------
  let W = innerWidth, H = innerHeight, mode: Mode = "wide", hostTop = 0;
  let active = 0, cur = 0, vel = 0, target = 0, scrolling = false, progScroll: number | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | undefined, progTimer: ReturnType<typeof setTimeout> | undefined;
  let flight: { t0: number; dur: number; p0: number; p1: number; r0: number; dr: number } | null = null;
  let breathT = 1.4, lastGeomAt = -1e9, needRender = true, raf = 0, last = 0, alive = true;
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  const storedPause = () => { try { return sessionStorage.getItem(pauseKey) === "1"; } catch { return false; } };
  let motion = !reduceMQ.matches && !storedPause();
  type Lay = { card: Rect; fig: Rect; dock: Rect; intro: Rect[]; introBottom: number; sizes: [number, number][]; bottom: number };
  let lay: Lay | null = null;
  const prevOff: Record<number, PrevPlacement> = {};

  // ---------------- layout ----------------
  const rel = (r: DOMRect, fr: DOMRect): Rect => ({ x: r.left - fr.left, y: r.top - fr.top, w: r.width, h: r.height });
  function lineRects(el: Element, fr: DOMRect): Rect[] {
    if (getComputedStyle(el).display === "none") return [];
    const rg = document.createRange(); rg.selectNodeContents(el);
    return Array.from(rg.getClientRects()).filter((r) => r.width > 1).map((r) => ({ x: r.left - fr.left - 4, y: r.top - fr.top - 2, w: r.width + 8, h: r.height + 4 }));
  }
  function measureCard() {
    if (!lay) return;
    const fr = frame.getBoundingClientRect();
    lay.card = rel(card.getBoundingClientRect(), fr); lay.fig = rel(card.querySelector("figure")!.getBoundingClientRect(), fr);
  }
  function layout() {
    W = document.documentElement.clientWidth; H = innerHeight;
    mode = W <= 600 ? "phone" : W / H < 1.05 ? "tall" : "wide";
    host.dataset.mode = mode;
    host.style.marginTop = "0px";
    const natural = host.getBoundingClientRect().top + scrollY;
    host.style.marginTop = `${-natural}px`;                  // the stage starts under the transparent site header
    host.style.height = `${H + HM.scrollRange(H, P)}px`;
    host.style.setProperty("--h3d-vh", `${H}px`);
    hostTop = host.getBoundingClientRect().top + scrollY;
    const sr = stage.getBoundingClientRect();
    frame.style.left = `${-sr.left}px`; frame.style.width = `${W}px`;
    const hb = header?.getBoundingClientRect(), hcs = header ? getComputedStyle(header) : null;
    const m = hb && hcs ? hb.left + parseFloat(hcs.paddingLeft) : 20;
    host.style.setProperty("--h3d-m", `${Math.round(m)}px`);
    host.style.setProperty("--h3d-hdr", `${Math.round(hb ? hb.height : 88)}px`);
    host.style.setProperty("--h3d-thumb", mode === "wide" ? (W < 1100 ? "72px" : "84px") : mode === "tall" ? "76px" : "28px");
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setSize(W, H, false);
    const fr = frame.getBoundingClientRect();
    const introLines = Array.from(intro.querySelectorAll(".eyebrow, h1, .intro-copy, .intro-links")).flatMap((e) => lineRects(e, fr));
    const introBottom = introLines.reduce((b, r) => Math.max(b, r.y + r.h), 0);
    const dk = rel(dock.getBoundingClientRect(), fr);
    card.classList.remove("h3d-compact");
    if (mode === "wide") {
      const top = introBottom + 28, avail = dk.y - 18 - top;
      host.style.setProperty("--h3d-fig", `${Math.round(clamp((avail - 22) / 1.25, 120, 218))}px`);
      card.style.top = `${top}px`; card.style.bottom = "";
      if (card.getBoundingClientRect().bottom - fr.top > dk.y - 10) card.classList.add("h3d-compact");
    } else { host.style.removeProperty("--h3d-fig"); card.style.top = ""; card.style.bottom = `${H - dk.y + 12}px`; }
    if (mode === "phone") {
      const b = introBottom;
      scrim.style.height = `${b + 80}px`;
      scrim.style.background = `linear-gradient(to bottom, #fff6d7 0px, #fff6d7 ${b - 16}px, #fff6d7cc ${b + 8}px, #fff6d700 ${b + 80}px)`;
    }
    lay = { card: { x: 0, y: 0, w: 0, h: 0 }, fig: { x: 0, y: 0, w: 0, h: 0 }, dock: dk, intro: introLines, introBottom, sizes: [], bottom: 0 };
    measureCard();
    lay.bottom = mode === "wide" ? dk.y : Math.min(dk.y, lay.card.y);
    smalls.forEach((el, i) => { const shown = el.dataset.show; el.dataset.show = "1"; lay!.sizes[i] = [el.offsetWidth, el.offsetHeight]; if (shown) el.dataset.show = shown; else delete el.dataset.show; });
    const wide = mode === "wide";
    cam.fov = wide ? 28 : 34; cam.aspect = W / H; cam.position.set(0, 0, wide ? 24 : mode === "phone" ? 19.5 : 22); cam.updateProjectionMatrix();
    if (wide) outer.rotation.set(0.28, 0.2, -0.62); else outer.rotation.set(0.22, 0.35, -0.16);
    let fx: number, fy: number;
    const hdrH = hb ? hb.height : 88;
    if (wide) { fx = clamp(lay.card.x + lay.card.w + 0.4 * W, 0.66 * W, 0.78 * W); fy = (hdrH + dk.y) / 2 + 8; }
    else { fx = W * (mode === "phone" ? 0.56 : 0.6); fy = introBottom + (lay.card.y - introBottom) * 0.5; }
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
    outer.position.set((fx / W * 2 - 1) * halfH * cam.aspect, -(fy / H * 2 - 1) * halfH, 0);
    needRender = true; kick();
  }

  // ---------------- selection ----------------
  function select(i: number, announce: boolean) {
    if (i === active && announce) return;
    const fromEl = smalls[i], from = fromEl.dataset.show ? fromEl.getBoundingClientRect() : null;
    active = i; host.dataset.active = String(i);
    updateRungs(breathT);
    ctx.onSelect(i, announce, announce && motion ? from : null);
    needRender = true; kick();
  }
  function afterCardRender(from: DOMRect | null) {
    measureCard();
    if (!lay) return;
    if (!motion) { card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }); }
    else if (from) {
      const fig = card.querySelector("figure")!.getBoundingClientRect(), cr = card.getBoundingClientRect(), s = from.width / fig.width;
      const tx = from.left - cr.left - (fig.left - cr.left) * s, ty = from.top - cr.top - (fig.top - cr.top) * s;
      card.animate([{ transform: `translate(${tx}px,${ty}px) scale(${s})`, opacity: 0.5 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
    }
    needRender = true; kick();
  }
  function cut() { canvas.classList.add("h3d-cut"); setTimeout(() => { cur = HM.progressOf(active, P); vel = 0; needRender = true; kick(); canvas.classList.remove("h3d-cut"); }, 75); }
  const flightE = (now: number) => HM.easeInOutCubic(clamp((now - flight!.t0) / flight!.dur, 0, 1));
  const flightPos = (now: number) => flight!.p0 + (flight!.p1 - flight!.p0) * flightE(now);
  const flightRot = (now: number) => flight!.r0 + flight!.dr * flightE(now);
  function jumpTo(y: number) {
    if (Math.abs(scrollY - y) < 1) return;
    progScroll = y; window.scrollTo({ top: y, behavior: "instant" });
    clearTimeout(progTimer); progTimer = setTimeout(() => { progScroll = null; }, 120);
  }
  /** Previous/Next/picker/thumbnail: jump to the artwork's slot (instant), fly the camera. Focus stays where it is. */
  function go(iRaw: number) {
    const i = clamp(iRaw, 0, artworks.length - 1);
    clearTimeout(settleTimer); scrolling = false;
    jumpTo(hostTop + HM.indexToScroll(i, H, P));
    target = HM.progressOf(i, P);
    const changed = i !== active;
    select(i, true);
    if (!motion) { if (changed) cut(); }
    else if (Math.abs(cur - target) > 1e-4) {
      const now = performance.now(), r0 = flight ? flightRot(now) : HM.travel(cur, P).rotY, p0 = flight ? flightPos(now) : cur;
      flight = { t0: now, dur: 700, p0, p1: target, r0, dr: HM.flightDelta(r0, HM.travel(target, P).rotY) }; vel = 0;
    }
    kick();
  }

  // ---------------- scroll: passive, never prevented, never driven by the animation ----------------
  const scrollProgress = () => HM.scrollToProgress(scrollY - hostTop, H, P);
  function onScroll() {
    if (progScroll !== null && Math.abs(scrollY - progScroll) < 2) { progScroll = null; return; }
    progScroll = null;
    target = scrollProgress();
    scrolling = true; host.dataset.settled = "0";
    clearTimeout(settleTimer); settleTimer = setTimeout(settle, 180);
    kick();
  }
  function settle() {
    scrolling = false; host.dataset.settled = "1";
    const i = HM.nearestIndex(scrollProgress(), P), changed = i !== active;
    select(i, true);
    target = HM.progressOf(i, P);
    if (!motion && changed) cut();
    kick();
  }

  // ---------------- motion preference ----------------
  function applyMotion(on: boolean) {
    motion = on; ctx.onMotion(on);
    if (!on) { flight = null; cur = target = HM.progressOf(active, P); vel = 0; }
    needRender = true; kick();
  }
  function toggleMotion() {
    const on = !motion;
    // the user's choice is remembered for the session, except under OS reduced motion (then it lasts until reload)
    if (!reduceMQ.matches) try { sessionStorage.setItem(pauseKey, on ? "0" : "1"); } catch { /* optional */ }
    applyMotion(on);
  }
  const onReduceChange = () => applyMotion(!reduceMQ.matches && !storedPause());

  // ---------------- keyboard inside the dock and on the active card ----------------
  function onKey(e: KeyboardEvent) {
    const t = e.target as Element | null;
    if (e.altKey || e.ctrlKey || e.metaKey || !t?.closest || !t.closest(".h3d-dock, .h3d-active")) return;
    const k = ({ ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: artworks.length - 1 } as Record<string, number>)[e.key];
    if (k === undefined) return;
    e.preventDefault(); go(k);
  }

  // ---------------- return context ----------------
  function rememberReturn() {
    try { sessionStorage.setItem(returnKey, JSON.stringify({ id: `artwork-${artworks[active].id}`, y: scrollY, index: active })); } catch { /* native history still works */ }
  }
  function fragmentIndex() { return artworks.findIndex((a) => location.hash === `#artwork-${a.id}`); }
  function restoreTo(i: number, focus: boolean) {
    flight = null; vel = 0;
    jumpTo(hostTop + HM.indexToScroll(i, H, P));
    target = cur = HM.progressOf(i, P);
    select(i, false);
    if (focus) card.focus({ preventScroll: true });
    needRender = true; kick();
  }
  function onHash() { const i = fragmentIndex(); if (i >= 0) restoreTo(i, true); }
  function onPageShow(e: PageTransitionEvent) { layout(); if (e.persisted) card.focus({ preventScroll: true }); }

  // ---------------- overlay: anchors, leader lines, callouts ----------------
  const V = new THREE.Vector3(), V2 = new THREE.Vector3();
  const toScreen = (v: THREE.Vector3): [number, number, number] => { v.project(cam); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z]; };
  const f1 = (n: number) => n.toFixed(1);
  function placeOverlay() {
    if (!lay) return;
    // reads first (header scrolls away; frame may be partly scrolled out at the end of the section)
    const fr = frame.getBoundingClientRect(), hb = header?.getBoundingClientRect();
    const hdrBottom = hb ? Math.max(0, hb.bottom - fr.top) : 0;
    const bounds: Rect = { x: 8, y: hdrBottom + 8, w: W - 16, h: lay.bottom - hdrBottom - 16 };
    const blockedBase: Rect[] = [{ x: 0, y: 0, w: W, h: hdrBottom }, lay.dock, lay.card, ...lay.intro];
    const A = artworks.map((_, i) => {
      const y = RL.ys[RL.artworkRung[i]];
      HM.strandPoint(y, 0, breathT, P, pa); HM.strandPoint(y, 1, breathT, P, pb);
      V.set(pa[0], pa[1], pa[2]).applyMatrix4(inner.matrixWorld); V2.set(pb[0], pb[1], pb[2]).applyMatrix4(inner.matrixWorld);
      const [x, yy, z] = toScreen(V.distanceToSquared(cam.position) <= V2.distanceToSquared(cam.position) ? V : V2);
      const covered = blockedBase.some((r) => x >= r.x - 4 && x <= r.x + r.w + 4 && yy >= r.y - 4 && yy <= r.y + r.h + 4);
      return { x, y: yy, ok: z < 1 && !covered && x >= bounds.x && x <= bounds.x + bounds.w && yy >= bounds.y && yy <= bounds.y + bounds.h };
    });
    const fY = HM.focusY(cur, P);
    HM.axisPoint(fY - 2, breathT, P, pa); HM.axisPoint(fY + 2, breathT, P, pb);
    const a0 = toScreen(V.set(pa[0], pa[1], pa[2]).applyMatrix4(inner.matrixWorld)), a1 = toScreen(V.set(pb[0], pb[1], pb[2]).applyMatrix4(inner.matrixWorld));
    const al = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) || 1, ux = (a1[0] - a0[0]) / al, uy = (a1[1] - a0[1]) / al;
    const outward = (x: number, y: number): [number, number] => { const d = (x - a0[0]) * ux + (y - a0[1]) * uy, cx = x - a0[0] - ux * d, cy = y - a0[1] - uy * d, l = Math.hypot(cx, cy) || 1; return [cx / l, cy / l]; };
    const blocked = blockedBase.slice();
    const a = A[active];
    let paths = "";
    if (a.ok) {
      const wide = mode === "wide";
      const sx = wide ? lay.card.x + lay.card.w + 4 : lay.fig.x + lay.fig.w / 2, sy = wide ? lay.fig.y + lay.fig.h * 0.35 : lay.card.y;
      const c1 = wide ? [(sx + a.x) / 2, sy] : [sx, (sy + a.y) / 2], c2 = wide ? [(sx + a.x) / 2, a.y] : [a.x, (sy + a.y) / 2];
      paths += `<path d="M${f1(sx)},${f1(sy)} C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(a.x)},${f1(a.y)}" fill="none" stroke="#2d2333" stroke-width="1.4"/>` +
        `<circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="9" fill="none" stroke="#2d2333" stroke-width="1.4"/><circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="3.5" fill="#2d2333"/>`;
      for (let k = 1; k < 16; k++) {
        const u = k / 16, v = 1 - u;
        const bx = v * v * v * sx + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * a.x, by = v * v * v * sy + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * a.y;
        blocked.push({ x: bx - 6, y: by - 6, w: 12, h: 12 });
      }
      blocked.push({ x: a.x - 14, y: a.y - 14, w: 28, h: 28 });
    }
    // neighbours whose anchor is hidden still take part, so the "at least one neighbour" rule can place them
    const neighbours = [active + 1, active - 1].filter((i) => i >= 0 && i < artworks.length)
      .sort((p, q) => Number(A[q].ok) - Number(A[p].ok));
    const items = A.map((p, i) => ({ i, p })).filter(({ i, p }) => i !== active && (p.ok || neighbours.includes(i)))
      .map(({ i, p }) => ({ id: i, ax: p.x, ay: p.y, w: lay!.sizes[i][0], h: lay!.sizes[i][1] }));
    const res = layoutCallouts({ items, bounds, blocked, prev: prevOff, outward, gap: 8, ensureOneOf: neighbours });
    const dot = mode === "phone";
    let shown = 0;
    smalls.forEach((el, i) => {
      const r = res[i];
      if (i === active || !r || !r.visible) {
        if (el.dataset.show) delete el.dataset.show;
        delete prevOff[i];
        if (i !== active && A[i].ok) paths += `<circle cx="${f1(A[i].x)}" cy="${f1(A[i].y)}" r="2.6" fill="#2d2333" fill-opacity=".55"/>`;
        return;
      }
      shown++;
      if (!el.dataset.show) { el.dataset.show = "1"; el.classList.remove("h3d-fresh"); void el.offsetWidth; el.classList.add("h3d-fresh"); }
      el.style.transform = `translate(${f1(r.x)}px,${f1(r.y)}px)`;
      prevOff[i] = r.forced ? { dx: r.dx, dy: r.dy, forced: true, x: r.x, y: r.y } : { dx: r.dx, dy: r.dy };
      const [w, h] = lay!.sizes[i], p = A[i];
      let bx = clamp(p.x, r.x, r.x + w), by = clamp(p.y, r.y, r.y + h);
      if (dot) { const cx = r.x + w / 2, cy = r.y + h / 2, d = Math.hypot(p.x - cx, p.y - cy) || 1; bx = cx + ((p.x - cx) / d) * 14; by = cy + ((p.y - cy) / d) * 14; }
      paths += `<path d="M${f1(bx)},${f1(by)} Q${f1((bx + p.x) / 2)},${f1((by + p.y) / 2 - 14)} ${f1(p.x)},${f1(p.y)}" fill="none" stroke="#2d2333" stroke-opacity=".55" stroke-width="1"/>`;
      if (p.ok) paths += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="2.6" fill="#2d2333"/>`;
    });
    // phone: keep leader lines and dots out of the headline zone (intro top to intro bottom + 8 px). Numbers only.
    if (dot) paths = `<defs><clipPath id="h3d-clip"><rect x="0" y="${f1(lay.introBottom + 8)}" width="${f1(W)}" height="${f1(H)}"/></clipPath></defs><g clip-path="url(#h3d-clip)">${paths}</g>`;
    svg.innerHTML = paths;
    host.dataset.neighbours = String(shown);
  }

  // ---------------- render on demand ----------------
  function kick() { if (alive && !raf) raf = requestAnimationFrame(frameTick); }
  function frameTick(now: number) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now;
    let moving = false, rotY: number | null = null;
    if (flight) {
      rotY = flightRot(now); cur = flightPos(now); moving = true;
      if (now - flight.t0 >= flight.dur) { cur = flight.p1; flight = null; rotY = null; vel = 0; }
    } else if (motion) {
      if (Math.abs(cur - target) > 1e-6 || Math.abs(vel) > 1e-6) {
        [cur, vel] = HM.springStep(cur, vel, target, HM.SPRING_OMEGA, dt);
        if (Math.abs(cur - target) < 2e-5 && Math.abs(vel) < 2e-4) { cur = target; vel = 0; }
        moving = true;
      }
    } else { cur = HM.progressOf(active, P); vel = 0; }
    const breathing = motion && !scrolling && !moving && !document.hidden;
    if (breathing) breathT += dt;
    if ((partT[0] !== breathT || partT[1] !== breathT) && now - lastGeomAt >= 12) {
      const k = partT[0] !== breathT && (partT[1] === breathT || partT[0] <= partT[1]) ? 0 : 1;
      updateStrand(k, breathT); if (k === 1) updateRungs(breathT); partT[k] = breathT; lastGeomAt = now; needRender = true;
    }
    const tr = HM.travel(cur, P), ry = rotY === null ? tr.rotY : rotY;
    if (ry !== inner.rotation.y || tr.ty !== inner.position.y) { inner.rotation.y = ry; inner.position.y = tr.ty; needRender = true; }
    if (needRender) {
      needRender = false; scene.updateMatrixWorld(); R.render(scene, cam); placeOverlay();
      host.dataset.progress = cur.toFixed(4);
    }
    if (moving || breathing || flight || partT[0] !== breathT || partT[1] !== breathT) kick(); else last = 0;
  }

  // ---------------- start ----------------
  function onLost(e: Event) { e.preventDefault(); ctx.onFail(); }
  const onResize = () => { layout(); target = cur = HM.progressOf(active, P); vel = 0; flight = null; };
  canvas.addEventListener("webglcontextlost", onLost);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize);
  addEventListener("keydown", onKey);
  addEventListener("hashchange", onHash);
  addEventListener("pageshow", onPageShow);
  reduceMQ.addEventListener("change", onReduceChange);
  updateGeometry(breathT);
  layout();
  // initial artwork: explicit fragment, then history return, then the current scroll position
  let initial = fragmentIndex(), explicit = initial >= 0;
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!explicit && nav?.type === "back_forward") {
    try {
      const saved = JSON.parse(sessionStorage.getItem(returnKey) ?? "null");
      const i = artworks.findIndex((a) => `artwork-${a.id}` === saved?.id);
      if (i >= 0 && Number.isFinite(saved?.y)) { initial = i; explicit = true; }
    } catch { /* storage unavailable */ }
  }
  if (!explicit) initial = HM.nearestIndex(scrollProgress(), P);
  active = initial; host.dataset.active = String(initial); host.dataset.settled = "1";
  ctx.onSelect(initial, false, null); ctx.onMotion(motion);
  if (explicit) requestAnimationFrame(() => { if (alive) restoreTo(initial, true); });
  cur = target = HM.progressOf(initial, P);
  updateRungs(breathT);
  document.fonts.ready.then(() => { if (alive) layout(); });

  return {
    go, toggleMotion, afterCardRender, rememberReturn,
    dispose() {
      alive = false; cancelAnimationFrame(raf); clearTimeout(settleTimer); clearTimeout(progTimer);
      canvas.removeEventListener("webglcontextlost", onLost);
      removeEventListener("scroll", onScroll); removeEventListener("resize", onResize); removeEventListener("keydown", onKey);
      removeEventListener("hashchange", onHash); removeEventListener("pageshow", onPageShow); reduceMQ.removeEventListener("change", onReduceChange);
      strands.forEach((g) => g.dispose()); DROPLET.dispose(); rungs.dispose(); MAT_STRAND.dispose(); MAT_RUNG.dispose(); MAT_ACTIVE.dispose(); R.dispose();
      host.style.removeProperty("margin-top"); host.style.removeProperty("height");
    },
  };
}

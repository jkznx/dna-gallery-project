/* DNA Gallery 3D · P1 prototype (Prof. Ultron). Standalone page logic; the math lives in helix-math.js and
   callout-layout.js (both tested with node --test). Scene look follows Dr. Miranda's design-p0 mockup.

   Rules kept from the current DNA flow:
   - Scrolling is never hijacked (passive listener only) and the animation never scrolls the page.
     Previous/Next/picker jump the page instantly to that artwork's scroll slot (user action), then the camera flies.
   - The nearest artwork becomes active 180 ms after scrolling stops; the view then eases onto it without scrolling.
   - Pause motion and prefers-reduced-motion show the still pose; camera moves become a cut with a short fade. */
(function () {
  "use strict";
  const HM = window.HelixMath, CL = window.CalloutLayout;
  window.__dnaErrors = [];
  addEventListener("error", (e) => window.__dnaErrors.push(String(e.message || e)));

  const ART = [
    ["soft-orbit", "Soft orbit", "A study of circles finding their own rhythm."],
    ["in-between", "In between", "Two shapes, a little space, and a conversation in color."],
    ["daylight", "Daylight", "A bright interruption in a quiet afternoon."],
    ["little-waves", "Little waves", "Repetition with room for a small surprise."],
    ["growing-room", "Growing room", "A botanical gesture drawn from simple shapes."],
    ["afterglow", "Afterglow", "The last warm light, held in a small frame."],
  ];
  const IMG = (s) => `../public/samples/${s}.png`;
  const HREF = (s) => `/artwork/${s}?layout=helix`;
  const pad2 = (i) => String(i + 1).padStart(2, "0");
  const P = HM.makeParams({ count: ART.length });
  const RL = HM.rungLayout(P);
  const Q = Object.fromEntries(location.hash.slice(1).split("&").filter(Boolean).map((p) => p.split("=")));
  const $ = (id) => document.getElementById(id);
  const body = document.body, canvas = $("gl"), svg = $("leaders");
  const clamp = HM.clamp;

  // ---------------- WebGL or the static fallback ----------------
  let R;
  try {
    if (!window.THREE) throw new Error("three.js missing");
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) throw new Error("no WebGL");
    R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { body.classList.add("no-webgl"); window.__ready = true; return; }
  R.setClearColor(0, 0); R.outputEncoding = THREE.sRGBEncoding;
  R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;

  // ---------------- scene, camera, studio light ----------------
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight("#fffaf0", "#c9a9d3", 0.42));
  const key = new THREE.DirectionalLight("#fff3df", 2.1); key.position.set(-7, 8, 9); scene.add(key);
  const rim = new THREE.DirectionalLight("#dda9ef", 1.6); rim.position.set(9, 3, -8); scene.add(rim);
  const fill = new THREE.DirectionalLight("#f8ed94", 0.45); fill.position.set(4, -8, 6); scene.add(fill);

  // pearl-clay: cream base, lavender (top-facing) to yellow (down-facing) sheen at glancing angles, faint grain
  function pearl(opts) {
    const m = new THREE.MeshPhysicalMaterial(Object.assign({ color: "#efe1c3", roughness: 0.62, metalness: 0, sheen: 0.8,
      sheenColor: new THREE.Color("#dda9ef"), sheenRoughness: 0.55, clearcoat: 0.18, clearcoatRoughness: 0.5 }, opts.mat || {}));
    const k = opts.sheen, grain = opts.grain;
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", `
      { vec3 vd=normalize(vViewPosition); float fr=pow(1.0-abs(dot(normal,vd)),2.3);
        vec3 tint=mix(vec3(0.973,0.929,0.580),vec3(0.867,0.663,0.937),clamp(normal.y*0.6+0.5,0.0,1.0));
        gl_FragColor.rgb=mix(gl_FragColor.rgb,tint,fr*${k.toFixed(2)});
        float n=fract(sin(dot(floor(gl_FragCoord.xy*0.75),vec2(12.9898,78.233)))*43758.5453);
        gl_FragColor.rgb+=(n-0.5)*${grain.toFixed(3)}; }
      #include <dithering_fragment>`);
    };
    return m;
  }
  // "recommended" mix: medium sheen
  const MAT_STRAND = pearl({ sheen: 0.68, grain: 0.018, mat: { roughness: 0.5, clearcoat: 0.22, clearcoatRoughness: 0.5 } });
  const MAT_RUNG = pearl({ sheen: 0.62, grain: 0.018, mat: { roughness: 0.55 } });
  const MAT_ACTIVE = pearl({ sheen: 0.9, grain: 0.018, mat: { color: "#ecc8f2", roughness: 0.5 } });

  const outer = new THREE.Group(), inner = new THREE.Group();
  outer.add(inner); scene.add(outer);

  // ---------------- liquid ribbon strands ----------------
  const N = Math.round(P.length * 14), M = 22, L = P.length;   // ≈ 76 rows per turn; tuned for the 30 Hz breathing budget
  function strandGeometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(N * M * 3), 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(new Float32Array(N * M * 3), 3));
    const idx = [];
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + ((j + 1) % M), c = a + M, d = b + M; idx.push(a, c, b, b, c, d); }
    g.setIndex(idx); return g;
  }
  const strands = [0, 1].map(() => { const g = strandGeometry(); const mesh = new THREE.Mesh(g, MAT_STRAND); mesh.frustumCulled = false; inner.add(mesh); return g; });
  const pa = [0, 0, 0], pb = [0, 0, 0], pc = [0, 0, 0], ax = [0, 0, 0];
  // One strand per call. Normals come straight from the elliptical cross-section (outward ∝ wide·cosφ·N + thin·sinφ·B),
  // which is much cheaper than computeVertexNormals and keeps breathing frames inside the 60 fps budget.
  function updateStrand(k, t) {
    const g = strands[k], pos = g.attributes.position.array, nor = g.attributes.normal.array, e = (L / (N - 1)) * 0.5;
    for (let i = 0; i < N; i++) {
      const y = -L / 2 + (i / (N - 1)) * L;
      HM.strandPoint(y, k, t, P, pa); HM.strandPoint(y + e, k, t, P, pb); HM.strandPoint(y - e, k, t, P, pc); HM.axisPoint(y, t, P, ax);
      let tx = pb[0] - pc[0], ty = pb[1] - pc[1], tz = pb[2] - pc[2]; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
      let nx = pa[0] - ax[0], ny = pa[1] - ax[1], nz = pa[2] - ax[2]; const d = nx * tx + ny * ty + nz * tz;
      nx -= tx * d; ny -= ty * d; nz -= tz * d; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const [wide, thin, tw] = HM.section(y, k, t);
      for (let j = 0; j < M; j++) {
        const f = (j / M) * Math.PI * 2 + tw, cf = Math.cos(f), sf = Math.sin(f), c = cf * thin, s = sf * wide, o = (i * M + j) * 3;
        pos[o] = pa[0] + nx * c + bx * s; pos[o + 1] = pa[1] + ny * c + by * s; pos[o + 2] = pa[2] + nz * c + bz * s;
        let qx = nx * cf * wide + bx * sf * thin, qy = ny * cf * wide + by * sf * thin, qz = nz * cf * wide + bz * sf * thin; const ql = Math.hypot(qx, qy, qz);
        nor[o] = qx / ql; nor[o + 1] = qy / ql; nor[o + 2] = qz / ql;
      }
    }
    g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true;
  }

  // ---------------- droplet rungs (two droplets meeting at a soft neck), instanced ----------------
  function rungGeometry(prof, seg) {
    const pts = [];
    for (let i = 0; i <= seg; i++) { const u = i / seg, cap = Math.pow(Math.sin(Math.PI * u), 0.38); pts.push(new THREE.Vector2(Math.max(1e-4, prof(u) * cap), u - 0.5)); }
    return new THREE.LatheGeometry(pts, 28);
  }
  const DROPLET = rungGeometry((u) => { const v = Math.abs(u - 0.5) * 2; return 0.065 + 0.25 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.94 + 0.03)), 1.15) * (1 - 0.25 * v); }, 64);
  const hash = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const rungVar = RL.ys.map((_, j) => 0.82 + 0.36 * hash(j));
  const rungs = new THREE.InstancedMesh(DROPLET, MAT_RUNG, RL.ys.length); rungs.frustumCulled = false; inner.add(rungs);
  const activeRung = new THREE.Mesh(DROPLET, MAT_ACTIVE); activeRung.frustumCulled = false; inner.add(activeRung);
  const UP = new THREE.Vector3(0, 1, 0), _d = new THREE.Vector3(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);
  function updateRungs(t) {
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
  const partT = [NaN, NaN];   // breathing time last applied to strand 0 / strand 1 (+ rungs)
  function updateGeometry(t) { updateStrand(0, t); updateStrand(1, t); updateRungs(t); partT[0] = partT[1] = t; }

  // ---------------- DOM: active card, small callouts, picker ----------------
  const smallsBox = $("smalls"), picker = $("picker"), card = $("active"), live = $("live");
  const smallEls = ART.map(([slug, title], i) => {
    const b = document.createElement("button");
    b.className = "small"; b.tabIndex = -1; b.hidden = true; b.dataset.i = i;
    const fig = document.createElement("figure"), img = document.createElement("img"), cap = document.createElement("figcaption"), n = document.createElement("b"), dn = document.createElement("span");
    img.src = IMG(slug); img.alt = ""; img.width = 160; img.height = 200; img.decoding = "async";
    n.textContent = pad2(i); cap.append(n, title); fig.append(img, cap); dn.className = "dotn"; dn.textContent = pad2(i);
    b.append(fig, dn); b.addEventListener("click", () => go(i)); smallsBox.append(b); return b;
  });
  const pickBtns = ART.map(([, title], i) => {
    const b = document.createElement("button"); b.textContent = pad2(i); b.setAttribute("aria-label", `${pad2(i)} ${title}`);
    b.addEventListener("click", () => go(i)); picker.append(b); return b;
  });
  ART.forEach(([slug]) => { const im = new Image(); im.src = IMG(slug); });   // warm the cache for the active card

  // ---------------- state ----------------
  let W = innerWidth, Hh = innerHeight, mode = "wide";
  let active = 0, cur = 0, vel = 0, target = 0, flight = null, scrolling = false, settleTimer = 0, progScroll = null;
  let breathT = 1.4, lastGeomAt = -1e9, needRender = true, raf = 0, last = 0;
  const reduceMQ = matchMedia("(prefers-reduced-motion: reduce)");
  let stored = null; try { stored = sessionStorage.getItem("dna3d-motion"); } catch (e) {}
  let motion = Q.still === "1" ? false : stored !== null ? stored === "on" : !reduceMQ.matches;
  let lay = null;
  const prevOff = {};
  const perf = (window.__perf = { renders: 0, geom: 0, moving: [], breathing: [], cost: [], geomCost: [], lastRender: 0, kind: "" });

  // ---------------- layout per viewport ----------------
  function rect(el) { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom }; }
  function lineRects(el) {
    if (!el || getComputedStyle(el).display === "none") return [];
    const rg = document.createRange(); rg.selectNodeContents(el);
    return [...rg.getClientRects()].filter((r) => r.width > 1).map((r) => ({ x: r.left - 4, y: r.top - 2, w: r.width + 8, h: r.height + 4 }));
  }
  function measureCard() {
    const c = rect(card), f = rect(card.querySelector("figure"));
    lay.card = c; lay.fig = f;
    lay.blocked = [lay.hdr, lay.dock, c, ...lay.intro];
  }
  function layout() {
    W = innerWidth; Hh = innerHeight;
    mode = W < 600 ? "phone" : W / Hh < 1.05 ? "tall" : "wide";
    body.classList.remove("wide", "tall", "phone"); body.classList.add(mode);
    body.style.setProperty("--m", mode === "wide" ? (W >= 1200 ? "80px" : "48px") : "");
    body.style.setProperty("--thumb", mode === "wide" ? (W < 1100 ? "72px" : "84px") : "");
    $("spacer").style.height = Hh + HM.scrollRange(Hh, P) + "px";
    R.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); R.setSize(W, Hh, false);
    const hdr = rect(document.querySelector("header")), dock = rect($("dock")), introEl = $("intro");
    card.classList.remove("compact");
    if (mode === "wide") {
      const top = introEl.getBoundingClientRect().bottom + 28, avail = dock.y - 18 - top;
      body.style.setProperty("--fig", Math.round(clamp((avail - 22) / 1.25, 120, 218)) + "px");
      card.style.top = top + "px"; card.style.bottom = "";
      if (card.getBoundingClientRect().bottom > dock.y - 10) card.classList.add("compact");
    } else { body.style.setProperty("--fig", ""); card.style.top = ""; card.style.bottom = Hh - dock.y + 12 + "px"; }
    const intro = [...introEl.children].flatMap(lineRects);
    lay = { hdr: { x: 0, y: 0, w: W, h: hdr.bottom }, dock: { x: 0, y: dock.y, w: W, h: Hh - dock.y }, intro, sizes: [] };
    measureCard();
    const bottom = mode === "wide" ? dock.y : Math.min(dock.y, lay.card.y);
    lay.bounds = { x: 8, y: hdr.bottom + 8, w: W - 16, h: bottom - hdr.bottom - 16 };
    smallEls.forEach((el, i) => { const h = el.hidden; el.hidden = false; lay.sizes[i] = [el.offsetWidth, el.offsetHeight]; el.hidden = h; });
    // camera + where the focused rung lands on screen
    const wide = mode === "wide";
    cam.fov = wide ? 28 : 34; cam.aspect = W / Hh; cam.position.set(0, 0, wide ? 24 : mode === "phone" ? 19.5 : 22); cam.updateProjectionMatrix();
    if (wide) outer.rotation.set(0.28, 0.2, -0.62); else outer.rotation.set(0.22, 0.35, -0.16);
    let fx, fy;
    if (wide) { fx = clamp(lay.card.right + 0.4 * W, 0.66 * W, 0.78 * W); fy = (hdr.bottom + dock.y) / 2 + 8; }
    else { const top = introEl.getBoundingClientRect().bottom; fx = W * (mode === "phone" ? 0.56 : 0.6); fy = top + (lay.card.y - top) * 0.5; }
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
    outer.position.set((fx / W * 2 - 1) * halfH * cam.aspect, -(fy / Hh * 2 - 1) * halfH, 0);
    needRender = true; kick();
  }

  // ---------------- selection ----------------
  function fillCard(i) {
    const [slug, title, desc] = ART[i];
    $("aImg").src = IMG(slug); $("aNum").textContent = `${pad2(i)} / ${pad2(ART.length - 1)} · Selected`;
    $("aTitle").textContent = title; $("aMedium").textContent = `Digital study · Sample ${pad2(i)}`;
    $("aHand").textContent = desc.toLowerCase().replace(/\.$/, ""); card.href = HREF(slug);
    pickBtns.forEach((b, k) => b.setAttribute("aria-current", k === i ? "true" : "false"));
  }
  function select(i, announce) {
    if (i === active && announce) return;
    const fromEl = smallEls[i], from = !fromEl.hidden ? fromEl.getBoundingClientRect() : null;
    active = i; fillCard(i); measureCard(); updateRungs(breathT);
    if (announce) live.textContent = `${pad2(i)} of ${pad2(ART.length - 1)}: ${ART[i][1]}`;
    const fig = card.querySelector("figure").getBoundingClientRect(), cr = card.getBoundingClientRect();
    if (!motion) card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
    else if (from && announce) {
      const s = from.width / fig.width;
      const tx = from.left - cr.left - (fig.left - cr.left) * s, ty = from.top - cr.top - (fig.top - cr.top) * s;
      card.animate([{ transform: `translate(${tx}px,${ty}px) scale(${s})`, opacity: 0.5 }, { transform: "none", opacity: 1 }],
        { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
    } else if (announce) card.animate([{ opacity: 0, transform: "translateX(-12px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
    needRender = true; kick();
  }
  function cut() { canvas.classList.add("cut"); setTimeout(() => { cur = HM.progressOf(active, P); vel = 0; needRender = true; kick(); canvas.classList.remove("cut"); }, 75); }

  /** Previous/Next/picker/thumbnail: jump the page to the artwork's scroll slot (instant), fly the camera, focus the card. */
  function go(i) {
    i = clamp(i, 0, ART.length - 1);
    clearTimeout(settleTimer); scrolling = false;
    const y = HM.indexToScroll(i, Hh, P);
    if (Math.abs(scrollY - y) >= 1) { progScroll = y; window.scrollTo({ top: y, behavior: "instant" }); setTimeout(() => (progScroll = null), 120); }
    target = HM.progressOf(i, P);
    const changed = i !== active;
    select(i, true);
    if (!motion) { if (changed) cut(); }
    else if (Math.abs(cur - target) > 1e-4) {
      const r0 = flight ? flightRot(performance.now()) : HM.travel(cur, P).rotY;
      const p0 = flight ? flightPos(performance.now()) : cur;
      flight = { t0: performance.now(), dur: 700, p0, p1: target, r0, dr: HM.flightDelta(r0, HM.travel(target, P).rotY) };
      vel = 0;
    }
    card.focus({ preventScroll: true });
    kick();
  }
  const flightE = (now) => HM.easeInOutCubic(clamp((now - flight.t0) / flight.dur, 0, 1));
  const flightPos = (now) => flight.p0 + (flight.p1 - flight.p0) * flightE(now);
  const flightRot = (now) => flight.r0 + flight.dr * flightE(now);

  // ---------------- scroll (passive; never prevented, never driven by the animation) ----------------
  function onScroll() {
    if (progScroll !== null && Math.abs(scrollY - progScroll) < 2) { progScroll = null; return; }
    progScroll = null;
    target = HM.scrollToProgress(scrollY, Hh, P);
    scrolling = true; clearTimeout(settleTimer); settleTimer = setTimeout(settle, 180);
    if (motion) kick();
  }
  function settle() {
    scrolling = false;
    const i = HM.nearestIndex(HM.scrollToProgress(scrollY, Hh, P), P);
    const changed = i !== active;
    select(i, true);
    target = HM.progressOf(i, P);           // the view eases onto the artwork; the page does not move
    if (!motion && changed) cut();
    kick();
  }
  addEventListener("scroll", onScroll, { passive: true });

  // ---------------- controls ----------------
  $("prev").addEventListener("click", () => go(active - 1));
  $("next").addEventListener("click", () => go(active + 1));
  function setMotion(on, remember) {
    motion = on;
    $("pause").setAttribute("aria-pressed", String(!on));
    $("pauseIcon").textContent = on ? "❚❚" : "▶";
    if (remember) try { sessionStorage.setItem("dna3d-motion", on ? "on" : "off"); } catch (e) {}
    if (!on) { flight = null; cur = target = HM.progressOf(active, P); vel = 0; }
    needRender = true; kick();
  }
  $("pause").addEventListener("click", () => setMotion(!motion, true));
  reduceMQ.addEventListener && reduceMQ.addEventListener("change", (e) => { let s = null; try { s = sessionStorage.getItem("dna3d-motion"); } catch (x) {} if (s === null) setMotion(!e.matches, false); });
  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !e.target.closest || !e.target.closest(".dock,.active-card")) return;
    const k = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: ART.length - 1 }[e.key];
    if (k === undefined) return; e.preventDefault(); go(k);
  });
  addEventListener("resize", () => { layout(); target = cur = HM.progressOf(active, P); vel = 0; flight = null; });

  // ---------------- overlay: anchors, leader lines, callouts ----------------
  const V = new THREE.Vector3(), V2 = new THREE.Vector3();
  function toScreen(v) { v.project(cam); return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * Hh, v.z]; }
  function anchorOf(i) {
    const y = RL.ys[RL.artworkRung[i]];
    HM.strandPoint(y, 0, breathT, P, pa); HM.strandPoint(y, 1, breathT, P, pb);
    V.set(pa[0], pa[1], pa[2]).applyMatrix4(inner.matrixWorld); V2.set(pb[0], pb[1], pb[2]).applyMatrix4(inner.matrixWorld);
    const near = V.distanceToSquared(cam.position) <= V2.distanceToSquared(cam.position) ? V : V2;
    const [x, y2, z] = toScreen(near);
    const B = lay.bounds;
    const covered = lay.blocked.some((r) => x >= r.x - 4 && x <= r.x + r.w + 4 && y2 >= r.y - 4 && y2 <= r.y + r.h + 4);   // under text, header, dock or card
    return { x, y: y2, ok: z < 1 && !covered && x >= B.x && x <= B.x + B.w && y2 >= B.y && y2 <= B.y + B.h };
  }
  function axisDir() {
    const f = HM.focusY(cur, P);
    HM.axisPoint(f - 2, breathT, P, pa); HM.axisPoint(f + 2, breathT, P, pb);
    const a = toScreen(V.set(pa[0], pa[1], pa[2]).applyMatrix4(inner.matrixWorld)), b = toScreen(V.set(pb[0], pb[1], pb[2]).applyMatrix4(inner.matrixWorld));
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    return { x: a[0], y: a[1], ux: dx / l, uy: dy / l };
  }
  const f1 = (n) => n.toFixed(1);
  function placeOverlay() {
    const A = ART.map((_, i) => anchorOf(i)), a = A[active], ax0 = axisDir();
    const blocked = lay.blocked.slice();
    let paths = "";
    if (a.ok) {
      const wide = mode === "wide";
      const sx = wide ? lay.card.right + 4 : lay.fig.x + lay.fig.w / 2, sy = wide ? lay.fig.y + lay.fig.h * 0.35 : lay.card.y;
      const c1 = wide ? [(sx + a.x) / 2, sy] : [sx, (sy + a.y) / 2], c2 = wide ? [(sx + a.x) / 2, a.y] : [a.x, (sy + a.y) / 2];
      paths += `<path d="M${f1(sx)},${f1(sy)} C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(a.x)},${f1(a.y)}" fill="none" stroke="#2d2333" stroke-width="1.4"/>` +
        `<circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="9" fill="none" stroke="#2d2333" stroke-width="1.4"/><circle cx="${f1(a.x)}" cy="${f1(a.y)}" r="3.5" fill="#2d2333"/>`;
      for (let k = 1; k < 16; k++) {      // keep small cards off the active leader line
        const u = k / 16, v = 1 - u, bx = v * v * v * sx + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * a.x, by = v * v * v * sy + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * a.y;
        blocked.push({ x: bx - 6, y: by - 6, w: 12, h: 12 });
      }
      blocked.push({ x: a.x - 14, y: a.y - 14, w: 28, h: 28 });
    }
    const items = [];
    A.forEach((p, i) => { if (i !== active && p.ok) items.push({ id: i, ax: p.x, ay: p.y, w: lay.sizes[i][0], h: lay.sizes[i][1] }); });
    const outward = (x, y) => { const cx = (x - ax0.x) - ax0.ux * ((x - ax0.x) * ax0.ux + (y - ax0.y) * ax0.uy), cy = (y - ax0.y) - ax0.uy * ((x - ax0.x) * ax0.ux + (y - ax0.y) * ax0.uy), l = Math.hypot(cx, cy) || 1; return [cx / l, cy / l]; };
    const res = CL.layoutCallouts({ items, bounds: lay.bounds, blocked, prev: prevOff, outward, gap: 8 });
    const dot = mode === "phone";
    smallEls.forEach((el, i) => {
      const r = res[i];
      if (i === active || !r || !r.visible) { if (!el.hidden) el.hidden = true; delete prevOff[i];
        if (i !== active && A[i].ok) paths += `<circle cx="${f1(A[i].x)}" cy="${f1(A[i].y)}" r="2.6" fill="#2d2333" fill-opacity=".55"/>`;
        return; }
      if (el.hidden) { el.hidden = false; el.classList.remove("fresh"); void el.offsetWidth; el.classList.add("fresh"); }
      el.style.transform = `translate(${f1(r.x)}px,${f1(r.y)}px)`; prevOff[i] = { dx: r.dx, dy: r.dy };
      const [w, h] = lay.sizes[i], p = A[i];
      let bx = clamp(p.x, r.x, r.x + w), by = clamp(p.y, r.y, r.y + h);
      if (dot) { const cx = r.x + w / 2, cy = r.y + h / 2, d = Math.hypot(p.x - cx, p.y - cy) || 1; bx = cx + ((p.x - cx) / d) * 14; by = cy + ((p.y - cy) / d) * 14; }
      paths += `<path d="M${f1(bx)},${f1(by)} Q${f1((bx + p.x) / 2)},${f1((by + p.y) / 2 - 14)} ${f1(p.x)},${f1(p.y)}" fill="none" stroke="#2d2333" stroke-opacity=".55" stroke-width="1"/><circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="2.6" fill="#2d2333"/>`;
    });
    svg.innerHTML = paths;
  }

  // ---------------- render on demand ----------------
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60; last = now;
    let moving = false, rotY = null;
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
    // breathing: only when nothing else moves (pauses while scrolling and during flights); geometry at ≤ 30 Hz
    const breathing = motion && !scrolling && !moving && !document.hidden;
    if (breathing) breathT += dt;
    // breathing geometry: one strand per frame, alternating (each strand ≈ 30 Hz; strand 1 also moves the rungs)
    const stale = partT[0] !== breathT || partT[1] !== breathT;
    if (stale && now - lastGeomAt >= 12) {
      const k = partT[0] !== breathT && (partT[1] === breathT || partT[0] <= partT[1] || partT[1] !== partT[1]) ? 0 : 1;
      const g0 = performance.now();
      updateStrand(k, breathT); if (k === 1) updateRungs(breathT); partT[k] = breathT;
      perf.geomCost.push(performance.now() - g0); if (perf.geomCost.length > 300) perf.geomCost.shift();
      lastGeomAt = now; needRender = true; perf.geom++;
    }
    const tr = HM.travel(cur, P), ry = rotY === null ? tr.rotY : rotY;
    if (ry !== inner.rotation.y || tr.ty !== inner.position.y) { inner.rotation.y = ry; inner.position.y = tr.ty; needRender = true; }
    if (needRender) {
      needRender = false; const c0 = performance.now(); scene.updateMatrixWorld(); R.render(scene, cam); placeOverlay(); perf.cost.push(performance.now() - c0); if (perf.cost.length > 600) perf.cost.shift();
      perf.renders++;
      const kind = moving ? "moving" : breathing ? "breathing" : "";
      if (kind && perf.kind === kind && perf.lastRender) { const arr = perf[kind]; arr.push(now - perf.lastRender); if (arr.length > 600) arr.shift(); }
      perf.lastRender = now; perf.kind = kind;
    }
    if (moving || breathing || flight || partT[0] !== breathT || partT[1] !== breathT) raf = requestAnimationFrame(frame);
    else { last = 0; perf.kind = ""; }
  }

  // ---------------- start ----------------
  window.__dna = {
    state: () => ({ active, cur, target, scrolling, flying: !!flight, motion, mode, breathT, scrollY, step: HM.scrollStep(Hh) }),
    go, nearestFor: (y) => HM.nearestIndex(HM.scrollToProgress(y, Hh, P), P),
    /** Test hook: render n travel frames back to back, waiting for the GPU each time (1-pixel readPixels forces a sync). Returns ms per frame. */
    benchRender(n, withGeometry) {
      const gl = R.getContext(), out = [], px = new Uint8Array(4);
      for (let k = 0; k < n; k++) {
        const t0 = performance.now(), tr = HM.travel((k % 100) / 100, P);
        inner.rotation.y = tr.rotY; inner.position.y = tr.ty;
        if (withGeometry) { updateStrand(k % 2, breathT + k * 0.016); if (k % 2) updateRungs(breathT + k * 0.016); }   // one strand per frame, as in the live loop
        scene.updateMatrixWorld(); R.render(scene, cam); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); out.push(performance.now() - t0);
      }
      needRender = true; kick(); return out;
    },
  };
  layout();
  const startAt = Q.a !== undefined ? clamp(parseInt(Q.a, 10) || 0, 0, ART.length - 1) : HM.nearestIndex(HM.scrollToProgress(scrollY, Hh, P), P);
  active = startAt; fillCard(startAt); measureCard();
  if (Q.a !== undefined) { progScroll = HM.indexToScroll(startAt, Hh, P); window.scrollTo({ top: progScroll, behavior: "instant" }); setTimeout(() => (progScroll = null), 120); }
  cur = target = HM.progressOf(startAt, P);
  setMotion(motion, false);
  updateGeometry(breathT);
  document.fonts.ready.then(() => { layout(); requestAnimationFrame(() => requestAnimationFrame(() => { window.__ready = true; })); });
})();

/* DNA Gallery 3D · helix math (P1 prototype).
   Pure functions, no three.js and no DOM, so the same code runs in the page (classic script → window.HelixMath)
   and under `node --test` (CommonJS). P2 can port this file to TypeScript for the app's test runner.

   Coordinates: helix-local space, y along the helix axis. Strand k (0 or 1) sits at angle
   theta(y) = y / pitch * 2π + kπ around a gently S-bent axis. "Travel" = the inner group transform that
   brings the rung at focusY to the origin, always facing the same way (phase0): this is the camera moving
   along the helix, expressed as moving the helix past a fixed camera. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.HelixMath = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /** Shape and travel parameters. Values follow Miranda's P0 mockup (design-p0/mockup.html). */
  function makeParams(over) {
    return Object.assign({
      count: 6,            // artworks
      radius: 1.6,         // helix radius
      pitch: 5.4,          // y distance for one full turn
      length: 40,          // strand length in y (must exceed travel span + visible window)
      turnsPerArtwork: 0.5,// "about 1/2 a turn per artwork"
      rungsPerTurn: 10,
      wobble: 1,           // S-bend amplitude scale (0 = straight axis, used in tests)
      breathe: 0.07,       // radius change, fraction (< ±7 %)
      phase0: Math.PI - 0.5, // angle of strand 0 at the focused rung, in the travelled frame
    }, over || {});
  }

  /** Axis offset (S-bend) at height y and breathing time t. */
  function axisOffset(y, t, P) {
    const w = P.wobble;
    return [w * (0.55 * Math.sin(y * 0.21 + t * 0.32) + 0.18 * Math.sin(y * 0.53 - t * 0.21)),
            w * (0.35 * Math.sin(y * 0.17 - t * 0.27))];
  }
  /** Breathing radius. sin(y*.45 + t*.6) → one cycle ≈ 10.5 s, amplitude P.breathe. */
  function radiusAt(y, t, P) { return P.radius * (1 + P.breathe * Math.sin(y * 0.45 + t * 0.6)); }
  function thetaAt(y, k, P) { return (y / P.pitch) * TAU + k * Math.PI; }

  /** Point on strand k at height y, time t. Returns [x, y, z]; writes into `out` when given. */
  function strandPoint(y, k, t, P, out) {
    const [ax, az] = axisOffset(y, t, P), r = radiusAt(y, t, P), th = thetaAt(y, k, P);
    const o = out || [0, 0, 0];
    o[0] = ax + r * Math.cos(th); o[1] = y; o[2] = az + r * Math.sin(th);
    return o;
  }
  function axisPoint(y, t, P, out) { const [ax, az] = axisOffset(y, t, P); const o = out || [0, 0, 0]; o[0] = ax; o[1] = y; o[2] = az; return o; }

  /** Ribbon cross-section: [wide (along the axis), thin (outward), twist] for strand k. Swells and thins along y. */
  function section(y, k, t) {
    const sw = 0.5 + 0.5 * Math.sin(y * 1.15 + k * 1.7 + t * 0.55) * 0.75 + 0.25 * Math.sin(y * 2.9 - t * 0.4 + k);
    return [0.08 + 0.5 * sw * sw, 0.07 + 0.03 * sw, 0.6 * Math.sin(y * 0.35 + t * 0.2)];
  }

  // ---------------- artworks and rungs ----------------
  const artSpacing = (P) => P.pitch * P.turnsPerArtwork;
  /** y of artwork i; the six are centred on y = 0. */
  function artworkY(i, P) { return (i - (P.count - 1) / 2) * artSpacing(P); }
  /** Rung heights on a regular grid that passes through every artwork's y. Returns { ys, artworkRung[] }. */
  function rungLayout(P) {
    const step = P.pitch / P.rungsPerTurn, y0 = artworkY(0, P), half = P.length / 2 - step;
    const jMin = Math.ceil((-half - y0) / step), jMax = Math.floor((half - y0) / step);
    const ys = []; for (let j = jMin; j <= jMax; j++) ys.push(y0 + j * step);
    const per = Math.round(artSpacing(P) / step);
    const artworkRung = []; for (let i = 0; i < P.count; i++) artworkRung.push(-jMin + i * per);
    return { ys, step, artworkRung };
  }

  // ---------------- travel: progress p ∈ [0,1] → helix transform ----------------
  const progressOf = (i, P) => (P.count > 1 ? i / (P.count - 1) : 0);
  const focusY = (p, P) => artworkY(0, P) + clamp(p, 0, 1) * (artworkY(P.count - 1, P) - artworkY(0, P));
  /** Inner-group transform for progress p: rotate about y by rotY, then translate by ty.
      Keeps the focused rung at the origin, facing phase0. */
  function travel(p, P) { const y = focusY(p, P); return { ty: -y, rotY: thetaAt(y, 0, P) - P.phase0 }; }
  /** Same transform as three.js (rotation.y then position.y) applied to a point; used by tests and for anchors. */
  function applyTravel(pt, tr, out) {
    const c = Math.cos(tr.rotY), s = Math.sin(tr.rotY), o = out || [0, 0, 0];
    const x = pt[0], z = pt[2];
    o[0] = x * c + z * s; o[1] = pt[1] + tr.ty; o[2] = -x * s + z * c;
    return o;
  }
  /** Rotation used by a flight from rotation r0 to r1: shortest equivalent turn, at most half a turn (π).
      The end pose is identical to r1 because the two differ by whole turns. */
  function flightDelta(r0, r1) { let d = (r1 - r0) % TAU; if (d > Math.PI) d -= TAU; if (d <= -Math.PI) d += TAU; return d; }

  // ---------------- scroll mapping and selection ----------------
  /** Scroll distance between two artworks for a viewport height (px). */
  const scrollStep = (vh) => Math.max(240, Math.round(vh * 0.7));
  /** Total scroll range for `count` artworks. */
  const scrollRange = (vh, P) => scrollStep(vh) * (P.count - 1);
  function scrollToProgress(scrollY, vh, P) { const r = scrollRange(vh, P); return r > 0 ? clamp(scrollY / r, 0, 1) : 0; }
  const indexToScroll = (i, vh, P) => clamp(i, 0, P.count - 1) * scrollStep(vh);
  /** Nearest artwork to progress p (ties go to the lower index). */
  function nearestIndex(p, P) { return clamp(Math.round(clamp(p, 0, 1) * (P.count - 1) - 1e-9), 0, P.count - 1); }

  // ---------------- easing ----------------
  /** Critically damped spring, exact step. omega 15 (SPRING_OMEGA) → settles within 1 % in ≈ 0.44 s with no overshoot. */
  function springStep(x, v, target, omega, dt) {
    const a = x - target, b = v + omega * a, e = Math.exp(-omega * dt);
    return [target + (a + b * dt) * e, (b - omega * (a + b * dt)) * e];
  }
  const SPRING_OMEGA = 15;
  const easeInOutCubic = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  const easeOutCubic = (u) => 1 - Math.pow(1 - u, 3);

  return { TAU, clamp, makeParams, axisOffset, radiusAt, thetaAt, strandPoint, axisPoint, section, artworkY, rungLayout,
    progressOf, focusY, travel, applyTravel, flightDelta, scrollStep, scrollRange, scrollToProgress, indexToScroll, nearestIndex,
    springStep, SPRING_OMEGA, easeInOutCubic, easeOutCubic };
});

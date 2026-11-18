/** DNA Gallery 3D · helix math (P2, ported from prototype-3d/helix-math.js).
 * Pure functions: no three.js, no DOM. Used by the Helix3D scene and by tests/helix3d-math.test.ts.
 *
 * Coordinates: helix-local space, y along the helix axis. Strand k (0 or 1) sits at angle
 * theta(y) = y / pitch · 2π + kπ around a gently S-bent axis. "Travel" is the inner-group transform that brings
 * the rung at focusY to the origin, always facing phase0: the camera moving along the helix, expressed as the
 * helix moving past a fixed camera. One artwork per ½ turn (Dr. Miranda, P1-DECISIONS §1). */

export type Vec3 = [number, number, number];
export type HelixParams = Readonly<{
  count: number; radius: number; pitch: number; length: number; turnsPerArtwork: number;
  rungsPerTurn: number; wobble: number; breathe: number; phase0: number;
}>;
export type Travel = Readonly<{ ty: number; rotY: number }>;

export const TAU = Math.PI * 2;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
/** Critically damped spring stiffness: settles within 1 % in ≈ 0.44 s with no overshoot. */
export const SPRING_OMEGA = 15;

export function makeParams(over: Partial<HelixParams> = {}): HelixParams {
  return {
    count: 6, radius: 1.6, pitch: 5.4, length: 40, turnsPerArtwork: 0.5, rungsPerTurn: 10,
    wobble: 1, breathe: 0.07, phase0: Math.PI - 0.5, ...over,
  };
}

/** Axis offset (S-bend) at height y and breathing time t. */
export function axisOffset(y: number, t: number, P: HelixParams): [number, number] {
  const w = P.wobble;
  return [w * (0.55 * Math.sin(y * 0.21 + t * 0.32) + 0.18 * Math.sin(y * 0.53 - t * 0.21)), w * (0.35 * Math.sin(y * 0.17 - t * 0.27))];
}
/** Breathing radius: sin(y·.45 + t·.6) → one cycle ≈ 10.5 s, amplitude P.breathe (< ±7 %). */
export const radiusAt = (y: number, t: number, P: HelixParams) => P.radius * (1 + P.breathe * Math.sin(y * 0.45 + t * 0.6));
export const thetaAt = (y: number, k: number, P: HelixParams) => (y / P.pitch) * TAU + k * Math.PI;

/** Point on strand k at height y, time t. Writes into `out` when given. */
export function strandPoint(y: number, k: number, t: number, P: HelixParams, out: Vec3 = [0, 0, 0]): Vec3 {
  const [ax, az] = axisOffset(y, t, P), r = radiusAt(y, t, P), th = thetaAt(y, k, P);
  out[0] = ax + r * Math.cos(th); out[1] = y; out[2] = az + r * Math.sin(th);
  return out;
}
export function axisPoint(y: number, t: number, P: HelixParams, out: Vec3 = [0, 0, 0]): Vec3 {
  const [ax, az] = axisOffset(y, t, P); out[0] = ax; out[1] = y; out[2] = az; return out;
}

/** Ribbon cross-section for strand k: [wide (along the axis), thin (outward), twist]. Swells and thins along y. */
export function section(y: number, k: number, t: number): [number, number, number] {
  const sw = 0.5 + 0.5 * Math.sin(y * 1.15 + k * 1.7 + t * 0.55) * 0.75 + 0.25 * Math.sin(y * 2.9 - t * 0.4 + k);
  return [0.08 + 0.5 * sw * sw, 0.07 + 0.03 * sw, 0.6 * Math.sin(y * 0.35 + t * 0.2)];
}

// ---------------- artworks and rungs ----------------
const artSpacing = (P: HelixParams) => P.pitch * P.turnsPerArtwork;
/** y of artwork i; the artworks are centred on y = 0. */
export const artworkY = (i: number, P: HelixParams) => (i - (P.count - 1) / 2) * artSpacing(P);
/** Rung heights on a regular grid passing through every artwork's y. */
export function rungLayout(P: HelixParams): { ys: number[]; step: number; artworkRung: number[] } {
  const step = P.pitch / P.rungsPerTurn, y0 = artworkY(0, P), half = P.length / 2 - step;
  const jMin = Math.ceil((-half - y0) / step), jMax = Math.floor((half - y0) / step);
  const ys: number[] = []; for (let j = jMin; j <= jMax; j++) ys.push(y0 + j * step);
  const per = Math.round(artSpacing(P) / step);
  const artworkRung: number[] = []; for (let i = 0; i < P.count; i++) artworkRung.push(-jMin + i * per);
  return { ys, step, artworkRung };
}

// ---------------- travel: progress p ∈ [0,1] → helix transform ----------------
export const progressOf = (i: number, P: HelixParams) => (P.count > 1 ? i / (P.count - 1) : 0);
export const focusY = (p: number, P: HelixParams) => artworkY(0, P) + clamp(p, 0, 1) * (artworkY(P.count - 1, P) - artworkY(0, P));
/** Inner-group transform for progress p (rotation.y, then position.y). Keeps the focused rung at the origin facing phase0. */
export function travel(p: number, P: HelixParams): Travel { const y = focusY(p, P); return { ty: -y, rotY: thetaAt(y, 0, P) - P.phase0 }; }
/** Same transform as three.js applies (rotate about y, then translate), for tests. */
export function applyTravel(pt: Vec3, tr: Travel, out: Vec3 = [0, 0, 0]): Vec3 {
  const c = Math.cos(tr.rotY), s = Math.sin(tr.rotY), x = pt[0], z = pt[2];
  out[0] = x * c + z * s; out[1] = pt[1] + tr.ty; out[2] = -x * s + z * c;
  return out;
}
/** Flight rotation from r0 to r1: shortest equivalent turn (≤ ½ turn); the end pose equals r1 (whole turns apart). */
export function flightDelta(r0: number, r1: number): number {
  let d = (r1 - r0) % TAU; if (d > Math.PI) d -= TAU; if (d <= -Math.PI) d += TAU; return d;
}

// ---------------- scroll mapping and selection ----------------
/** Scroll distance between two artworks for a stage height (px). */
export const scrollStep = (vh: number) => Math.max(240, Math.round(vh * 0.7));
export const scrollRange = (vh: number, P: HelixParams) => scrollStep(vh) * (P.count - 1);
/** Progress for a scroll offset measured from the top of the 3D section. */
export function scrollToProgress(offsetY: number, vh: number, P: HelixParams): number { const r = scrollRange(vh, P); return r > 0 ? clamp(offsetY / r, 0, 1) : 0; }
export const indexToScroll = (i: number, vh: number, P: HelixParams) => clamp(i, 0, P.count - 1) * scrollStep(vh);
/** Nearest artwork to progress p; ties go to the lower index. */
export const nearestIndex = (p: number, P: HelixParams) => clamp(Math.round(clamp(p, 0, 1) * (P.count - 1) - 1e-9), 0, P.count - 1);

// ---------------- easing ----------------
/** Critically damped spring, exact step (frame-rate independent). Returns [x, v]. */
export function springStep(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  const a = x - target, b = v + omega * a, e = Math.exp(-omega * dt);
  return [target + (a + b * dt) * e, (b - omega * (a + b * dt)) * e];
}
export const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - u, 3);

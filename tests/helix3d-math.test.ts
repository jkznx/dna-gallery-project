import test from "node:test";
import assert from "node:assert/strict";
import * as H from "../src/components/helix3d-math.ts";

const P = H.makeParams();
const close = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

test("3D helix: strands are half a turn apart on the radius", () => {
  const Q = H.makeParams({ wobble: 0, breathe: 0 });
  for (const y of [-7.3, -1, 0, 2.2, 9.9]) {
    const a = H.strandPoint(y, 0, 0, Q), b = H.strandPoint(y, 1, 0, Q);
    assert.ok(close(Math.hypot(a[0], a[2]), Q.radius, 1e-12));
    assert.ok(close(a[0], -b[0], 1e-12) && close(a[2], -b[2], 1e-12));
    assert.equal(a[1], y);
  }
});

test("3D helix: breathing stays under ±7 % with a ~10 s cycle", () => {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 2000; i++) { const r = H.radiusAt(i * 0.37, i * 0.013, P) / P.radius; lo = Math.min(lo, r); hi = Math.max(hi, r); }
  assert.ok(lo >= 0.93 - 1e-12 && hi <= 1.07 + 1e-12, `range ${lo}..${hi}`);
  const period = (2 * Math.PI) / 0.6;
  assert.ok(period > 9.5 && period < 11);
  assert.ok(close(H.radiusAt(3, 1, P), H.radiusAt(3, 1 + period, P), 1e-9));
});

test("3D helix: artworks are half a turn apart, centred, each on its own rung", () => {
  const ys = Array.from({ length: P.count }, (_, i) => H.artworkY(i, P));
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i] - ys[i - 1], P.pitch / 2, 1e-12));
  assert.ok(close(ys[0] + ys[ys.length - 1], 0, 1e-12));
  const L = H.rungLayout(P);
  L.artworkRung.forEach((r, i) => assert.ok(close(L.ys[r], ys[i], 1e-9)));
  assert.equal(new Set(L.artworkRung).size, P.count);
  for (const y of L.ys) assert.ok(Math.abs(y) <= P.length / 2);
  assert.ok(L.ys.length >= 60 && L.ys.length <= 80, `rung count ${L.ys.length}`);
});

test("3D helix: travel brings every artwork to the same place, facing the same way", () => {
  const Q = H.makeParams({ wobble: 0, breathe: 0 }), L = H.rungLayout(Q);
  const ref = H.applyTravel(H.strandPoint(H.artworkY(0, Q), 0, 0, Q), H.travel(0, Q));
  for (let i = 0; i < Q.count; i++) {
    const p = H.applyTravel(H.strandPoint(L.ys[L.artworkRung[i]], 0, 0, Q), H.travel(H.progressOf(i, Q), Q));
    for (let c = 0; c < 3; c++) assert.ok(close(p[c], ref[c], 1e-9), `artwork ${i} coord ${c}`);
  }
  assert.ok(close(ref[1], 0, 1e-12));
});

test("3D helix: ½ turn per artwork; flights turn at most ½ turn and end in the same pose", () => {
  for (let i = 0; i < P.count - 1; i++) assert.ok(close(H.travel(H.progressOf(i + 1, P), P).rotY - H.travel(H.progressOf(i, P), P).rotY, Math.PI, 1e-9));
  for (let i = 0; i < P.count; i++) for (let j = 0; j < P.count; j++) {
    const r0 = H.travel(H.progressOf(i, P), P).rotY, r1 = H.travel(H.progressOf(j, P), P).rotY, d = H.flightDelta(r0, r1);
    assert.ok(Math.abs(d) <= Math.PI + 1e-12);
    assert.ok(close(Math.cos(r0 + d), Math.cos(r1), 1e-9) && close(Math.sin(r0 + d), Math.sin(r1), 1e-9));
  }
});

test("3D helix: scroll maps linearly to progress, clamps, and round-trips for all six", () => {
  for (const vh of [720, 768, 900, 1080, 844, 1024, 740]) {
    const step = H.scrollStep(vh);
    assert.equal(H.scrollRange(vh, P), step * (P.count - 1));
    assert.equal(H.scrollToProgress(-50, vh, P), 0);
    assert.equal(H.scrollToProgress(1e6, vh, P), 1);
    for (let i = 0; i < P.count; i++) {
      const y = H.indexToScroll(i, vh, P);
      assert.ok(close(H.scrollToProgress(y, vh, P), H.progressOf(i, P), 1e-12));
      assert.equal(H.nearestIndex(H.scrollToProgress(y, vh, P), P), i);
    }
  }
});

test("3D helix: nearest artwork across all six, between and at midpoints", () => {
  const n = P.count - 1;
  for (let i = 0; i < P.count; i++) {
    assert.equal(H.nearestIndex(i / n, P), i);
    if (i < n) {
      assert.equal(H.nearestIndex((i + 0.49) / n, P), i);
      assert.equal(H.nearestIndex((i + 0.51) / n, P), i + 1);
      assert.equal(H.nearestIndex((i + 0.5) / n, P), i);
    }
  }
  assert.equal(H.nearestIndex(-1, P), 0); assert.equal(H.nearestIndex(2, P), n);
});

test("3D helix: critically damped spring settles in ~0.45 s without overshoot, frame-rate independent", () => {
  let x = 0, v = 0, t = 0, settled: number | null = null, max = -Infinity;
  while (t < 2) { [x, v] = H.springStep(x, v, 1, H.SPRING_OMEGA, 1 / 60); t += 1 / 60; max = Math.max(max, x); if (Math.abs(x - 1) >= 0.01) settled = null; else if (settled === null) settled = t; }
  assert.ok(max <= 1 + 1e-9); assert.ok(settled !== null && settled > 0.3 && settled < 0.48, `settle ${settled}`);
  let a: [number, number] = [0, 0]; for (let i = 0; i < 6; i++) a = H.springStep(a[0], a[1], 1, H.SPRING_OMEGA, 1 / 60);
  const b = H.springStep(0, 0, 1, H.SPRING_OMEGA, 0.1);
  assert.ok(close(a[0], b[0], 1e-9) && close(a[1], b[1], 1e-9));
});

test("3D helix: easing and ribbon section", () => {
  for (const f of [H.easeInOutCubic, H.easeOutCubic]) { assert.equal(f(0), 0); assert.ok(close(f(1), 1, 1e-12)); }
  let lo = Infinity, hi = -Infinity;
  for (let y = -20; y <= 20; y += 0.05) for (const k of [0, 1]) { const [w, th] = H.section(y, k, 3.1); lo = Math.min(lo, w); hi = Math.max(hi, w); assert.ok(th > 0.06 && th < 0.11); }
  assert.ok(lo > 0.07 && hi > 0.45 && hi / lo > 4);
});

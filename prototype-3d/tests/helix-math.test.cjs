// node --test prototype-3d/tests/   (from dna-gallery)  ·  P1 helix math
const test = require("node:test");
const assert = require("node:assert/strict");
const H = require("../helix-math.js");

const P = H.makeParams();
const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test("strands are half a turn apart and sit on the radius (straight axis, no breathing)", () => {
  const Q = H.makeParams({ wobble: 0, breathe: 0 });
  for (const y of [-7.3, -1, 0, 2.2, 9.9]) {
    const a = H.strandPoint(y, 0, 0, Q), b = H.strandPoint(y, 1, 0, Q);
    assert.ok(close(Math.hypot(a[0], a[2]), Q.radius, 1e-12));
    assert.ok(close(a[0], -b[0], 1e-12) && close(a[2], -b[2], 1e-12), "strand 1 is strand 0 rotated by π");
    assert.equal(a[1], y);
  }
});

test("breathing stays under ±7 % and has a ~10 s cycle", () => {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < 2000; i++) { const r = H.radiusAt(i * 0.37, i * 0.013, P) / P.radius; lo = Math.min(lo, r); hi = Math.max(hi, r); }
  assert.ok(lo >= 0.93 - 1e-12 && hi <= 1.07 + 1e-12, `range ${lo}..${hi}`);
  const period = (2 * Math.PI) / 0.6;
  assert.ok(period > 9.5 && period < 11, `period ${period}`);
  assert.ok(close(H.radiusAt(3, 1, P), H.radiusAt(3, 1 + period, P), 1e-9));
});

test("artworks are half a turn apart, centred, and each sits on its own rung", () => {
  const ys = [...Array(P.count)].map((_, i) => H.artworkY(i, P));
  for (let i = 1; i < ys.length; i++) assert.ok(close(ys[i] - ys[i - 1], P.pitch / 2, 1e-12));
  assert.ok(close(ys[0] + ys[ys.length - 1], 0, 1e-12));
  const L = H.rungLayout(P);
  assert.equal(L.artworkRung.length, P.count);
  L.artworkRung.forEach((r, i) => assert.ok(close(L.ys[r], ys[i], 1e-9), `artwork ${i} on rung ${r}`));
  assert.equal(new Set(L.artworkRung).size, P.count);
  for (const y of L.ys) assert.ok(Math.abs(y) <= P.length / 2, "rungs stay on the strands");
  assert.ok(L.ys.length >= 60 && L.ys.length <= 80, `rung count ${L.ys.length}`);
});

test("travel brings every artwork to the same place, facing the same way", () => {
  const Q = H.makeParams({ wobble: 0, breathe: 0 }), L = H.rungLayout(Q);
  const ref = H.applyTravel(H.strandPoint(H.artworkY(0, Q), 0, 0, Q), H.travel(0, Q));
  for (let i = 0; i < Q.count; i++) {
    const tr = H.travel(H.progressOf(i, Q), Q);
    const p = H.applyTravel(H.strandPoint(L.ys[L.artworkRung[i]], 0, 0, Q), tr);
    for (let c = 0; c < 3; c++) assert.ok(close(p[c], ref[c], 1e-9), `artwork ${i} coord ${c}: ${p[c]} vs ${ref[c]}`);
  }
  // the focused rung is centred on the axis at the origin, and strand 0 points at phase0
  assert.ok(close(ref[1], 0, 1e-12));
  assert.ok(close(Math.atan2(ref[2], ref[0]), Q.phase0 > Math.PI ? Q.phase0 - 2 * Math.PI : Q.phase0, 1e-9));
});

test("travel rotates half a turn per artwork and flights turn at most half a turn", () => {
  for (let i = 0; i < P.count - 1; i++) {
    const a = H.travel(H.progressOf(i, P), P).rotY, b = H.travel(H.progressOf(i + 1, P), P).rotY;
    assert.ok(close(b - a, Math.PI, 1e-9));
  }
  for (let i = 0; i < P.count; i++) for (let j = 0; j < P.count; j++) {
    const r0 = H.travel(H.progressOf(i, P), P).rotY, r1 = H.travel(H.progressOf(j, P), P).rotY, d = H.flightDelta(r0, r1);
    assert.ok(Math.abs(d) <= Math.PI + 1e-12, `${i}→${j}: ${d}`);
    const end = r0 + d; assert.ok(close(Math.cos(end), Math.cos(r1), 1e-9) && close(Math.sin(end), Math.sin(r1), 1e-9), "same end pose");
  }
  assert.ok(close(H.flightDelta(0, 3 * Math.PI), Math.PI, 1e-12));
  assert.ok(close(H.flightDelta(0, -0.4), -0.4, 1e-12));
});

test("scroll maps linearly to progress, clamps at the ends and round-trips per artwork", () => {
  for (const vh of [768, 900, 1080, 844, 1024]) {
    const step = H.scrollStep(vh);
    assert.equal(H.scrollRange(vh, P), step * (P.count - 1));
    assert.equal(H.scrollToProgress(-50, vh, P), 0);
    assert.equal(H.scrollToProgress(1e6, vh, P), 1);
    for (let i = 0; i < P.count; i++) {
      const y = H.indexToScroll(i, vh, P);
      assert.ok(close(H.scrollToProgress(y, vh, P), H.progressOf(i, P), 1e-12));
      assert.equal(H.nearestIndex(H.scrollToProgress(y, vh, P), P), i);
    }
    assert.equal(H.indexToScroll(-3, vh, P), 0);
    assert.equal(H.indexToScroll(99, vh, P), H.scrollRange(vh, P));
  }
  assert.equal(H.scrollStep(200), 240, "minimum step");
});

test("nearest artwork is correct across all six, including between and at the midpoints", () => {
  const n = P.count - 1;
  for (let i = 0; i < P.count; i++) {
    assert.equal(H.nearestIndex(i / n, P), i);
    if (i < n) {
      assert.equal(H.nearestIndex((i + 0.49) / n, P), i);
      assert.equal(H.nearestIndex((i + 0.51) / n, P), i + 1);
      assert.equal(H.nearestIndex((i + 0.5) / n, P), i, "a tie goes to the lower index");
    }
  }
  assert.equal(H.nearestIndex(-1, P), 0);
  assert.equal(H.nearestIndex(2, P), n);
});

test("critically damped spring: no overshoot, settles within ~0.45 s at SPRING_OMEGA", () => {
  for (const [x0, v0] of [[0, 0], [0, 3], [0, -2]]) {
    let x = x0, v = v0, t = 0, settled = null, dt = 1 / 60, max = -Infinity;
    while (t < 2) { [x, v] = H.springStep(x, v, 1, H.SPRING_OMEGA, dt); t += dt; max = Math.max(max, x); if (Math.abs(x - 1) >= 0.01) settled = null; else if (settled === null) settled = t; }
    if (v0 >= 0 && v0 <= 3) assert.ok(max <= 1 + 0.06, `overshoot ${max}`);
    if (v0 === 0) { assert.ok(max <= 1 + 1e-9, "no overshoot from rest"); assert.ok(settled > 0.3 && settled < 0.48, `settle ${settled}`); }
    assert.ok(Math.abs(x - 1) < 1e-6);
  }
  // frame-rate independent: one 0.1 s step equals six 1/60 s steps
  let a = [0, 0]; for (let i = 0; i < 6; i++) a = H.springStep(a[0], a[1], 1, H.SPRING_OMEGA, 1 / 60);
  const b = H.springStep(0, 0, 1, H.SPRING_OMEGA, 0.1);
  assert.ok(close(a[0], b[0], 1e-9) && close(a[1], b[1], 1e-9));
});

test("easing curves start at 0, end at 1 and are monotonic", () => {
  for (const f of [H.easeInOutCubic, H.easeOutCubic]) {
    assert.equal(f(0), 0); assert.ok(close(f(1), 1, 1e-12));
    let last = 0; for (let u = 0; u <= 1.0001; u += 0.01) { const v = f(Math.min(1, u)); assert.ok(v >= last - 1e-12); last = v; }
  }
});

test("ribbon section swells and thins but never collapses", () => {
  let lo = Infinity, hi = -Infinity;
  for (let y = -20; y <= 20; y += 0.05) for (const k of [0, 1]) { const [w, th] = H.section(y, k, 3.1); lo = Math.min(lo, w); hi = Math.max(hi, w); assert.ok(th > 0.06 && th < 0.11); }
  assert.ok(lo > 0.07 && hi > 0.45 && hi / lo > 4, `wide ${lo}..${hi}`);
});

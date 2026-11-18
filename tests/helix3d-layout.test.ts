import test from "node:test";
import assert from "node:assert/strict";
import { layoutCallouts, overlaps, inside, segHitsRect, type CalloutItem, type Rect } from "../src/components/helix3d-layout.ts";

function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const SIZES: [number, number][] = [[1920, 1080], [1440, 900], [1366, 768], [1280, 720], [1024, 768], [768, 1024], [390, 844]];

function scene(W: number, H: number, rand: () => number) {
  const phone = W <= 600, tall = W / H < 1.05;
  const header: Rect = { x: 0, y: 0, w: W, h: phone ? 68 : 88 };
  const dock: Rect = { x: 0, y: H - (phone ? 76 : 84), w: W, h: phone ? 76 : 84 };
  const intro: Rect = phone || tall ? { x: 20, y: 86, w: W - 40, h: 120 } : { x: 80, y: 128, w: 470, h: 170 };
  const active: Rect = phone || tall ? { x: 20, y: dock.y - 160, w: W - 40, h: 146 } : { x: 80, y: 330, w: 450, h: 290 };
  const bounds: Rect = { x: 8, y: header.h + 8, w: W - 16, h: (phone || tall ? active.y : dock.y) - header.h - 16 };
  const card = phone ? [28, 28] : W < 1100 ? [72, 112] : [84, 124];
  const items: CalloutItem[] = [0, 1, 2, 3, 4].map((i) => {
    const t = (i + 0.3 + rand() * 0.4) / 5;
    return { id: i, ax: W * (phone || tall ? 0.3 + rand() * 0.5 : 0.55 + t * 0.4 + rand() * 0.04), ay: header.h + t * (dock.y - header.h), w: card[0], h: card[1] };
  });
  return { items, bounds, blocked: [header, dock, intro, active] };
}
function check(sc: ReturnType<typeof scene>, res: ReturnType<typeof layoutCallouts>, tag: string) {
  const vis = sc.items.filter((it) => res[it.id]?.visible).map((it) => ({ x: res[it.id].x, y: res[it.id].y, w: it.w, h: it.h, it }));
  for (const r of vis) {
    assert.ok(inside(r, sc.bounds), `${tag} inside`);
    for (const b of sc.blocked) assert.ok(!overlaps(r, b, 0), `${tag} blocked`);
  }
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) assert.ok(!overlaps(vis[i], vis[j], 7.99), `${tag} overlap`);
  return vis;
}

test("3D callouts: no overlaps, in bounds, never over blocked areas, at all 7 sizes", () => {
  for (const [W, H] of SIZES) {
    const rand = rng(W * 7 + H);
    for (let n = 0; n < 200; n++) { const sc = scene(W, H, rand); check(sc, layoutCallouts({ ...sc, outward: (ax) => [ax > W * 0.6 ? 1 : -1, 0] }), `${W}x${H}`); }
  }
});

test("3D callouts: at least one neighbour is shown even when both neighbour anchors are hidden", () => {
  for (const [W, H] of SIZES) {
    const rand = rng(W + H * 3);
    for (let n = 0; n < 50; n++) {
      const sc = scene(W, H, rand);
      sc.items[1].ax = W + 200; sc.items[1].ay = -100;              // off-screen
      sc.items[2].ax = sc.blocked[1].x + 30; sc.items[2].ay = sc.blocked[1].y + 20;   // under the dock
      const res = layoutCallouts({ ...sc, ensureOneOf: [2, 1] });
      const vis = check(sc, res, `${W}x${H} ensure`);
      assert.ok(res[1].visible || res[2].visible, `${W}x${H}: a neighbour is visible`);
      assert.ok(vis.some((v) => v.it.id === 2 || v.it.id === 1));
      assert.ok(res[2].forced || res[1].forced);
    }
  }
});

test("3D callouts: a forced card keeps its slot while valid; normal cards keep their offsets", () => {
  const sc = scene(1440, 900, rng(5));
  sc.items[1].ax = 2000;
  const a = layoutCallouts({ ...sc, ensureOneOf: [1] });
  const prev = Object.fromEntries(Object.entries(a).filter(([, v]) => v.visible).map(([k, v]) => [k, v.forced ? { dx: v.dx, dy: v.dy, forced: true, x: v.x, y: v.y } : { dx: v.dx, dy: v.dy }]));
  const b = layoutCallouts({ ...sc, items: sc.items.map((it) => ({ ...it, ax: it.ax + 3, ay: it.ay - 2 })), prev, ensureOneOf: [1] });
  assert.equal(b[1].x, a[1].x); assert.equal(b[1].y, a[1].y);
  for (const [id, v] of Object.entries(b)) if (prev[id] && !prev[id].forced && v.visible && v.reused) assert.equal(v.dx, prev[id].dx);
});

test("3D callouts: hidden or crowded cards are hidden, never overlapping", () => {
  const sc = scene(1366, 768, rng(9)); sc.items[0].ax = -40; sc.items[1].ay = 20;
  const res = layoutCallouts(sc); assert.equal(res[0].visible, false); assert.equal(res[1].visible, false);
  const items = Array.from({ length: 12 }, (_, i) => ({ id: i, ax: 200 + (i % 3) * 4, ay: 200 + i * 3, w: 84, h: 124 }));
  const r2 = layoutCallouts({ items, bounds: { x: 0, y: 0, w: 420, h: 420 } });
  const vis = items.filter((it) => r2[it.id].visible).map((it) => ({ x: r2[it.id].x, y: r2[it.id].y, w: it.w, h: it.h }));
  assert.ok(vis.length > 0 && vis.length < 12);
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) assert.ok(!overlaps(vis[i], vis[j], 7.99));
  assert.equal(segHitsRect(0, 15, 30, 15, { x: 10, y: 10, w: 10, h: 10 }, 0), true);
  assert.equal(segHitsRect(0, 0, 5, 30, { x: 10, y: 10, w: 10, h: 10 }, 0), false);
});

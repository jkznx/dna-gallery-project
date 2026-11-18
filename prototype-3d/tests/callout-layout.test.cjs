// node --test prototype-3d/tests/   ·  P1 automatic callout layout
const test = require("node:test");
const assert = require("node:assert/strict");
const { layoutCallouts, overlaps, inside, segHitsRect } = require("../callout-layout.js");

// deterministic pseudo-random
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const SIZES = [[1920, 1080], [1440, 900], [1366, 768], [1024, 768], [768, 1024], [390, 844]];
function scene(W, H, rand) {
  const phone = W < 600, tall = W / H < 1.05;
  const header = { x: 0, y: 0, w: W, h: phone ? 68 : 88 };
  const dock = { x: 0, y: H - (phone ? 76 : 84), w: W, h: phone ? 76 : 84 };
  const intro = phone || tall ? { x: 20, y: 86, w: W - 40, h: 120 } : { x: 80, y: 128, w: 470, h: 170 };
  const active = phone || tall ? { x: 20, y: dock.y - 160, w: W - 40, h: 146 } : { x: 80, y: 330, w: 450, h: 290 };
  const bounds = { x: 8, y: header.h + 8, w: W - 16, h: dock.y - header.h - 16 };
  const card = phone ? [28, 28] : W < 1100 ? [72, 112] : [84, 124];
  // anchors spread along a diagonal "helix" band on the right, like the real scene
  const items = [0, 1, 2, 3, 4].map((i) => {
    const t = (i + 0.3 + rand() * 0.4) / 5;
    return { id: "a" + i, ax: W * (phone || tall ? 0.3 + rand() * 0.5 : 0.55 + t * 0.4 + rand() * 0.04), ay: header.h + t * (dock.y - header.h), w: card[0], h: card[1] };
  });
  return { items, bounds, blocked: [header, dock, intro, active] };
}

test("no overlaps, nothing outside the bounds or over blocked areas, at all six sizes (200 random scenes each)", () => {
  for (const [W, H] of SIZES) {
    const rand = rng(W * 7 + H);
    let shown = 0, total = 0;
    for (let n = 0; n < 200; n++) {
      const sc = scene(W, H, rand);
      const res = layoutCallouts({ ...sc, outward: (ax) => [ax > W * 0.6 ? 1 : -1, 0] });
      const vis = sc.items.filter((it) => res[it.id].visible).map((it) => ({ x: res[it.id].x, y: res[it.id].y, w: it.w, h: it.h, it }));
      for (const r of vis) {
        assert.ok(inside(r, sc.bounds), `${W}x${H} inside`);
        for (const b of sc.blocked) assert.ok(!overlaps(r, b, 0), `${W}x${H} blocked`);
        for (const it of sc.items) if (it !== r.it) assert.ok(!(it.ax > r.x && it.ax < r.x + r.w && it.ay > r.y && it.ay < r.y + r.h), "covers another anchor");
      }
      for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) assert.ok(!overlaps(vis[i], vis[j], 7.99), `${W}x${H} cards overlap`);
      shown += vis.length; total += sc.items.filter((it) => it.ax >= sc.bounds.x && it.ay >= sc.bounds.y && it.ay <= sc.bounds.y + sc.bounds.h).length;
    }
    assert.ok(shown / total > 0.85, `${W}x${H}: only ${shown}/${total} cards placed`);
  }
});

test("hysteresis: a still-valid previous offset is kept exactly", () => {
  const sc = scene(1440, 900, rng(5));
  const first = layoutCallouts(sc);
  const prev = Object.fromEntries(Object.entries(first).filter(([, v]) => v.visible).map(([k, v]) => [k, { dx: v.dx, dy: v.dy }]));
  const moved = { ...sc, items: sc.items.map((it) => ({ ...it, ax: it.ax + 3, ay: it.ay - 2 })), prev };
  const second = layoutCallouts(moved);
  let reused = 0;
  for (const [id, v] of Object.entries(second)) if (prev[id] && v.visible && v.reused) { reused++; assert.equal(v.dx, prev[id].dx); assert.equal(v.dy, prev[id].dy); }
  assert.ok(reused >= Object.keys(prev).length - 1, `kept ${reused}/${Object.keys(prev).length}`);
});

test("a card whose anchor is off-screen or under the chrome is hidden, never drawn", () => {
  const sc = scene(1366, 768, rng(9));
  sc.items[0].ax = -40; sc.items[1].ay = 20;
  const res = layoutCallouts(sc);
  assert.equal(res.a0.visible, false); assert.equal(res.a1.visible, false);
});

test("a crowded scene hides cards rather than overlapping them", () => {
  const items = [...Array(12)].map((_, i) => ({ id: "c" + i, ax: 200 + (i % 3) * 4, ay: 200 + i * 3, w: 84, h: 124 }));
  const res = layoutCallouts({ items, bounds: { x: 0, y: 0, w: 420, h: 420 }, blocked: [] });
  const vis = items.filter((it) => res[it.id].visible).map((it) => ({ x: res[it.id].x, y: res[it.id].y, w: it.w, h: it.h }));
  assert.ok(vis.length > 0 && vis.length < 12);
  for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) assert.ok(!overlaps(vis[i], vis[j], 7.99));
});

test("segment/rectangle test", () => {
  const r = { x: 10, y: 10, w: 10, h: 10 };
  assert.equal(segHitsRect(0, 15, 30, 15, r, 0), true);
  assert.equal(segHitsRect(0, 0, 5, 30, r, 0), false);
  assert.equal(segHitsRect(0, 0, 9, 9, r, 0), false);
});

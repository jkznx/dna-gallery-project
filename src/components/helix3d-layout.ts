/** DNA Gallery 3D · automatic callout layout (P2, ported from prototype-3d/callout-layout.js).
 * Places the neighbour cards (or phone dots) next to their helix anchors: no card overlaps another card, a blocked
 * area (header, intro text, active card, dock, the active leader line) or another anchor, and every card stays inside
 * the bounds. Pure function, no DOM: the scene measures rectangles and passes them in.
 *
 * Hysteresis: a card keeps its previous offset while that spot is still valid, so cards travel with the helix.
 * Miranda's rule (P1-DECISIONS §1): when none of `ensureOneOf` is visible, the first one that fits is placed at the
 * nearest free slot inside the bounds even if its anchor is hidden; its leader still points at the anchor. */

export type Rect = { x: number; y: number; w: number; h: number };
export type CalloutItem = { id: number; ax: number; ay: number; w: number; h: number };
export type Placement = { x: number; y: number; dx: number; dy: number; visible: boolean; reused: boolean; forced: boolean };
export type PrevPlacement = { dx: number; dy: number; forced?: boolean; x?: number; y?: number };
export type LayoutInput = {
  items: CalloutItem[]; bounds: Rect; blocked?: Rect[]; prev?: Record<number, PrevPlacement>;
  outward?: (ax: number, ay: number) => [number, number]; gap?: number; angles?: number; radii?: number[]; anchorPad?: number;
  /** ids of the active artwork's neighbours, in order of preference */
  ensureOneOf?: number[];
};

export const overlaps = (a: Rect, b: Rect, g: number) => a.x < b.x + b.w + g && a.x + a.w + g > b.x && a.y < b.y + b.h + g && a.y + a.h + g > b.y;
export const inside = (r: Rect, B: Rect) => r.x >= B.x && r.y >= B.y && r.x + r.w <= B.x + B.w && r.y + r.h <= B.y + B.h;
const pointIn = (px: number, py: number, B: Rect) => px >= B.x && px <= B.x + B.w && py >= B.y && py <= B.y + B.h;

/** Does segment p→q cross rectangle r (shrunk by pad)? Liang–Barsky clip. */
export function segHitsRect(px: number, py: number, qx: number, qy: number, r: Rect, pad: number): boolean {
  const x0 = r.x + pad, y0 = r.y + pad, x1 = r.x + r.w - pad, y1 = r.y + r.h - pad;
  if (x1 <= x0 || y1 <= y0) return false;
  let t0 = 0, t1 = 1; const dx = qx - px, dy = qy - py;
  for (const [p, q] of [[-dx, px - x0], [dx, x1 - px], [-dy, py - y0], [dy, y1 - py]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

export function layoutCallouts(o: LayoutInput): Record<number, Placement> {
  const gap = o.gap ?? 8, angles = o.angles ?? 16, prev = o.prev ?? {}, B = o.bounds, blocked = o.blocked ?? [];
  const anchorPad = o.anchorPad ?? 7;
  const anchorRects = o.items.map((it) => ({ id: it.id, x: it.ax - anchorPad, y: it.ay - anchorPad, w: 2 * anchorPad, h: 2 * anchorPad }));
  const placed: Rect[] = [], out: Record<number, Placement> = {};
  const order = o.items.slice().sort((a, b) => (prev[b.id] && !prev[b.id].forced ? 1 : 0) - (prev[a.id] && !prev[a.id].forced ? 1 : 0) || a.ay - b.ay);
  function valid(it: CalloutItem, r: Rect, checkLeader = true): boolean {
    if (!inside(r, B)) return false;
    for (const b of blocked) if (overlaps(r, b, 0)) return false;
    for (const p of placed) if (overlaps(r, p, gap)) return false;
    for (const a of anchorRects) if (a.id !== it.id && overlaps(r, a, 2)) return false;
    if (checkLeader) {
      const cx = Math.max(r.x, Math.min(it.ax, r.x + r.w)), cy = Math.max(r.y, Math.min(it.ay, r.y + r.h));
      for (const p of placed) if (segHitsRect(it.ax, it.ay, cx, cy, p, 2)) return false;
    }
    return true;
  }
  for (const it of order) {
    const res: Placement = { x: 0, y: 0, dx: 0, dy: 0, visible: false, reused: false, forced: false };
    out[it.id] = res;
    if (!pointIn(it.ax, it.ay, B)) continue;
    let best: Rect | null = null;
    const pv = prev[it.id];
    if (pv && !pv.forced) { const r = { x: it.ax + pv.dx, y: it.ay + pv.dy, w: it.w, h: it.h }; if (valid(it, r)) { best = r; res.reused = true; } }
    if (!best) {
      const base = Math.hypot(it.w, it.h) / 2 + 14;
      const radii = o.radii ?? [base, base + 22, base + 48, base + 80, base + 120];
      const [ux, uy] = o.outward ? o.outward(it.ax, it.ay) : [0, 0];
      let bestScore = Infinity;
      for (const rad of radii) for (let k = 0; k < angles; k++) {
        const a = (k / angles) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
        const r = { x: it.ax + dx * rad - it.w / 2, y: it.ay + dy * rad - it.h / 2, w: it.w, h: it.h };
        if (!valid(it, r)) continue;
        const score = rad * (1 + 0.45 * (1 - (dx * ux + dy * uy)));
        if (score < bestScore) { bestScore = score; best = r; }
      }
    }
    if (best) { placed.push(best); Object.assign(res, { x: best.x, y: best.y, dx: best.x - it.ax, dy: best.y - it.ay, visible: true }); }
  }
  // at least one neighbour of the active artwork stays visible
  const ensure = (o.ensureOneOf ?? []).filter((id) => o.items.some((it) => it.id === id));
  if (ensure.length && !ensure.some((id) => out[id]?.visible)) {
    for (const id of ensure) {
      const it = o.items.find((x) => x.id === id)!;
      const res = out[id] ?? (out[id] = { x: 0, y: 0, dx: 0, dy: 0, visible: false, reused: false, forced: false });
      const tx = Math.max(B.x, Math.min(it.ax, B.x + B.w)) - it.w / 2, ty = Math.max(B.y, Math.min(it.ay, B.y + B.h)) - it.h / 2;
      let best: Rect | null = null;
      const pv = prev[id];
      if (pv?.forced && pv.x !== undefined && pv.y !== undefined) { const r = { x: pv.x, y: pv.y, w: it.w, h: it.h }; if (valid(it, r, false)) best = r; }
      if (!best) {
        let bd = Infinity;
        for (let y = B.y; y + it.h <= B.y + B.h; y += 12) for (let x = B.x; x + it.w <= B.x + B.w; x += 12) {
          const d = Math.hypot(x - tx, y - ty); if (d >= bd) continue;
          const r = { x, y, w: it.w, h: it.h }; if (valid(it, r, false)) { bd = d; best = r; }
        }
      }
      if (best) { placed.push(best); Object.assign(res, { x: best.x, y: best.y, dx: best.x - it.ax, dy: best.y - it.ay, visible: true, forced: true }); break; }
    }
  }
  return out;
}

/* DNA Gallery 3D · automatic callout layout (P1 prototype).
   Places the small artwork cards next to their helix anchors so that no card overlaps another card, a blocked
   area (header, intro text, active card, dock, the active leader line) or another anchor, and every card stays
   inside the bounds. Pure function, no DOM: the page measures rectangles and passes them in.

   Hysteresis: a card keeps its previous offset from its anchor while that spot is still valid, so cards travel
   with the helix instead of jumping every frame. A card that fits nowhere is reported as hidden (its anchor
   dot can still show); it is never drawn overlapping. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CalloutLayout = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const overlaps = (a, b, g) => a.x < b.x + b.w + g && a.x + a.w + g > b.x && a.y < b.y + b.h + g && a.y + a.h + g > b.y;
  const inside = (r, B) => r.x >= B.x && r.y >= B.y && r.x + r.w <= B.x + B.w && r.y + r.h <= B.y + B.h;
  const pointIn = (px, py, B) => px >= B.x && px <= B.x + B.w && py >= B.y && py <= B.y + B.h;
  /** Does segment p→q cross rectangle r (shrunk by `pad`)? Liang–Barsky clip. */
  function segHitsRect(px, py, qx, qy, r, pad) {
    const x0 = r.x + pad, y0 = r.y + pad, x1 = r.x + r.w - pad, y1 = r.y + r.h - pad;
    if (x1 <= x0 || y1 <= y0) return false;
    let t0 = 0, t1 = 1; const dx = qx - px, dy = qy - py;
    for (const [p, q] of [[-dx, px - x0], [dx, x1 - px], [-dy, py - y0], [dy, y1 - py]]) {
      if (p === 0) { if (q < 0) return false; continue; }
      const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t0 <= t1;
  }

  /**
   * @param {object} o
   *  items:   [{ id, ax, ay, w, h }]      anchor (screen px) and card size
   *  bounds:  { x, y, w, h }               cards must stay inside
   *  blocked: [{ x, y, w, h }]             areas no card may cover
   *  prev:    { [id]: { dx, dy } }         last offsets (card top-left minus anchor)
   *  outward: (ax, ay) => [ux, uy]         preferred direction (e.g. away from the helix axis); optional
   *  gap:     min space between cards (px), default 8
   *  radii:   candidate distances from the anchor to the card centre; default from the card size
   *  angles:  directions tried per radius, default 16
   * @returns {{ [id]: { x, y, dx, dy, visible, reused } }}
   */
  function layoutCallouts(o) {
    const gap = o.gap ?? 8, angles = o.angles ?? 16, prev = o.prev || {}, B = o.bounds, blocked = o.blocked || [];
    const anchorPad = o.anchorPad ?? 7;
    const anchorRects = o.items.map((it) => ({ id: it.id, x: it.ax - anchorPad, y: it.ay - anchorPad, w: 2 * anchorPad, h: 2 * anchorPad }));
    const placed = [], out = {};
    // place items with a still-valid previous offset first (keeps them stable), then the rest top to bottom
    const order = o.items.slice().sort((a, b) => (prev[b.id] ? 1 : 0) - (prev[a.id] ? 1 : 0) || a.ay - b.ay);
    function valid(it, r) {
      if (!inside(r, B)) return false;
      for (const b of blocked) if (overlaps(r, b, 0)) return false;
      for (const p of placed) if (overlaps(r, p, gap)) return false;
      for (const a of anchorRects) if (a.id !== it.id && overlaps(r, a, 2)) return false;
      // the leader (anchor → nearest card edge point) must not cut through another card
      const cx = Math.max(r.x, Math.min(it.ax, r.x + r.w)), cy = Math.max(r.y, Math.min(it.ay, r.y + r.h));
      for (const p of placed) if (segHitsRect(it.ax, it.ay, cx, cy, p, 2)) return false;
      return true;
    }
    for (const it of order) {
      const res = { x: 0, y: 0, dx: 0, dy: 0, visible: false, reused: false };
      out[it.id] = res;
      if (!pointIn(it.ax, it.ay, B)) continue;               // anchor off-screen or under the chrome: no card
      let best = null;
      const pv = prev[it.id];
      if (pv) { const r = { x: it.ax + pv.dx, y: it.ay + pv.dy, w: it.w, h: it.h }; if (valid(it, r)) { best = r; res.reused = true; } }
      if (!best) {
        const base = Math.hypot(it.w, it.h) / 2 + 14;
        const radii = o.radii || [base, base + 22, base + 48, base + 80, base + 120];
        const [ux, uy] = o.outward ? o.outward(it.ax, it.ay) : [0, 0];
        let bestScore = Infinity;
        for (const rad of radii) for (let k = 0; k < angles; k++) {
          const a = (k / angles) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
          const r = { x: it.ax + dx * rad - it.w / 2, y: it.ay + dy * rad - it.h / 2, w: it.w, h: it.h };
          if (!valid(it, r)) continue;
          const score = rad * (1 + 0.45 * (1 - (dx * ux + dy * uy)));   // short leaders, pointing outward
          if (score < bestScore) { bestScore = score; best = r; }
        }
      }
      if (best) { placed.push(best); Object.assign(res, { x: best.x, y: best.y, dx: best.x - it.ax, dy: best.y - it.ay, visible: true }); }
    }
    return out;
  }
  return { layoutCallouts, overlaps, inside, segHitsRect };
});

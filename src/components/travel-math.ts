export function travelPoint(u: number, side: number, width: number, height: number) {
  const compact = width < 600;
  const promotion = Math.exp(-(u * u) / 0.22);
  const phase = u * Math.PI * 0.75;
  const radius = compact ? width * 0.28 : Math.min(width * 0.30, 300);
  const x = side * radius * Math.sin(phase);
  const y = u * height * 0.43;
  const z = (side * 80 * Math.cos(phase) - 120) * (1 - promotion);
  const perspective = 1200 / (1200 - z);
  return { x, y, z, promotion, perspective, projectedX: width / 2 + x * perspective, projectedY: height / 2 + y * perspective };
}

export function travelingCard(index: number, position: number, width: number, height: number) {
  // Increasing position moves the same card DOWN the curve through the focus.
  const u = position - index;
  const side = index % 2 ? 1 : -1;
  const point = travelPoint(u, side, width, height);
  const scale = 0.22 + 0.78 * point.promotion;
  const frameWidth = Math.min(width * 0.82, 500);
  const frameHeight = height * 0.60;
  const opacity = Math.max(0, Math.min(1, (1.5 - Math.abs(u)) / 0.4));
  const halfHeight = frameHeight * scale * point.perspective / 2;
  const selectable = opacity > 0.98 && point.projectedY - halfHeight >= 10 && point.projectedY + halfHeight <= height - 10;
  return { ...point, u, side, scale, frameWidth, frameHeight, opacity, selectable,
    yaw: side * 18 * Math.cos(u * Math.PI * 0.75) * (1 - point.promotion),
  };
}

export function travelingScene(position: number, width: number, height: number, count: number) {
  const svgPoint = (u: number, side: number) => {
    const point = travelPoint(u, side, width, height);
    return { x: point.projectedX / width * 1000, y: point.projectedY / height * 1000 };
  };
  const paths = [-1, 1].map((side) => Array.from({ length: 145 }, (_, i) => {
    const p = svgPoint(-1.8 + i / 144 * 3.6, side);
    return `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(" "));
  // A design's u=position-index always coincides with one of these moving rungs.
  const shift = ((position % 0.2) + 0.2) % 0.2;
  const rungs = Array.from({ length: 21 }, (_, i) => {
    const u = (i - 10) * 0.2 + shift;
    return { a: svgPoint(u, -1), b: svgPoint(u, 1) };
  });
  return { paths, rungs, cards: Array.from({ length: count }, (_, index) => travelingCard(index, position, width, height)) };
}

export function settledTravelPosition(from: number, to: number, elapsed: number) {
  const t = Math.max(0, Math.min(1, elapsed / 220));
  const ease = t * t * (3 - 2 * t);
  return from + (to - from) * ease;
}

export function followTravelPosition(current: number, raw: number, direction: number) {
  const goal = direction >= 0 ? Math.max(current, raw) : Math.min(current, raw);
  return Math.abs(goal - current) < 0.002 ? goal : current + (goal - current) * 0.45;
}

export function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }

export function strandProgress(scroll: number, viewport: number, top: number, height: number): number {
  return height > 0 ? clamp((scroll + viewport * 0.8 - top) / height) : 1;
}

export function cardReveal(scroll: number, viewport: number, top: number, height: number): number {
  return clamp((scroll + viewport * 0.92 - top) / Math.max(1, Math.min(height, viewport) * 0.5));
}

// Both paths share a vertical coordinate system, so one top-to-bottom clip traces
// both strands and their rungs together. No random/client-only geometry.
export function helixGeometry() {
  const height = 1000;
  const x = (y: number, side: number) => 50 + side * 34 * Math.cos(y / height * Math.PI * 6);
  const path = (side: number) => Array.from({ length: 241 }, (_, i) => {
    const y = i / 240 * height;
    return `${i === 0 ? "M" : "L"}${x(y, side).toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
  const rungs = Array.from({ length: 37 }, (_, i) => {
    const y = i / 36 * height;
    return { y, left: Math.min(x(y, -1), x(y, 1)), right: Math.max(x(y, -1), x(y, 1)) };
  });
  return { paths: [path(-1), path(1)], rungs };
}

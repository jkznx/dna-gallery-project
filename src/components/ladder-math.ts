export const bounded = (value: number, maximum: number) => Math.max(0, Math.min(maximum, value));

export function scrollDesignPosition(scroll: number, top: number, step: number, offset: number, count: number) {
  return bounded((scroll - top) / Math.max(1, step) + offset, count - 1);
}

export function resizedTimelineOffset(scroll: number, previous: { top: number; step: number }, next: { top: number; step: number }, offset: number) {
  // Preserve the unbounded timeline, including the lead-in before the stage.
  return (scroll - previous.top) / Math.max(1, previous.step) + offset - (scroll - next.top) / Math.max(1, next.step);
}

/** A small dead band prevents rapid selection flicker around a halfway point. */
export function settledDesign(position: number, current: number, count: number) {
  let next = bounded(current, count - 1);
  while (next < count - 1 && position > next + 0.58) next++;
  while (next > 0 && position < next - 0.58) next--;
  return next;
}

/** Two mirrored preview lanes stay outside the calm center on small screens. */
export function previewPose(position: number, index: number, compact: boolean) {
  const side = index % 2 ? 1 : -1;
  const row = Math.floor(index / 2);
  const phase = position * 0.85 + row * 0.8;
  const z = side * 28 * Math.sin(phase);
  return {
    x: (side < 0 ? 8 : 92) - side * Math.sin(phase) * (compact ? 0.4 : 1.8),
    y: 22 + row * 28 + Math.sin(phase + (side > 0 ? 0.7 : 0)) * (compact ? 2 : 4),
    z, yaw: -side * (14 + Math.cos(phase) * 6),
    roll: -side * Math.sin(phase) * (compact ? 1 : 2.5),
    scale: 0.94 + (z + 28) / 56 * 0.06,
  };
}

/** Perspective projection of two actual 3D helices, rather than a single arc. */
export function ladderGeometry(position: number, compact = false) {
  const point = (t: number, side: number) => {
    const angle = t * Math.PI * 4 + position * 0.85;
    const z = side * 120 * Math.sin(angle);
    const perspective = 1200 / (1200 - z);
    return { x: 500 + side * 370 * Math.cos(angle) * perspective, y: 300 + (t * 480 - 240) * perspective, z };
  };
  const paths = [-1, 1].map((side) => Array.from({ length: 121 }, (_, i) => {
    const p = point(i / 120, side);
    return `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(" "));
  const rungs = Array.from({ length: 25 }, (_, i) => ({ a: point(i / 24, -1), b: point(i / 24, 1) }));
  const previews = Array.from({ length: 6 }, (_, i) => previewPose(position, i, compact));
  const connectors = previews.map((pose, i) => {
    const t = (pose.y * 6 - 60) / 480;
    const perspective = 1200 / (1200 - pose.z);
    return { from: { x: 500 + (pose.x * 10 - 500) * perspective, y: 300 + (pose.y * 6 - 300) * perspective }, to: point(t, i % 2 ? 1 : -1) };
  });
  return { paths, rungs, connectors, previews };
}

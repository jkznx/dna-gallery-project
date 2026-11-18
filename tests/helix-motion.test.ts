import test from "node:test";
import assert from "node:assert/strict";
import { cardReveal, helixGeometry, strandProgress } from "../src/components/helix-math.ts";

test("DNA progress clamps and reverses deterministically across deep links and resize", () => {
  assert.equal(strandProgress(0, 800, 1000, 3000), 0);
  const forward = strandProgress(1800, 800, 1000, 3000);
  assert.ok(forward > strandProgress(900, 800, 1000, 3000));
  assert.equal(strandProgress(10000, 800, 1000, 3000), 1);
  assert.ok(strandProgress(1800, 1000, 1000, 3000) > forward);
  assert.equal(strandProgress(0, 800, 1000, 0), 1);
});

test("reveal remains bounded and completes before artwork passes through the viewport", () => {
  assert.equal(cardReveal(0, 800, 1800, 500), 0);
  assert.equal(cardReveal(1800, 800, 1800, 500), 1);
  assert.ok(cardReveal(1300, 800, 1800, 500) > 0);
});

test("static geometry contains two complete finite strands and mirrored rungs", () => {
  const { paths, rungs } = helixGeometry();
  assert.equal(paths.length, 2);
  for (const path of paths) {
    assert.ok(path.startsWith("M"));
    assert.ok(path.endsWith("1000.00"));
    assert.ok(!/NaN|Infinity/.test(path));
  }
  assert.equal(rungs.length, 37);
  for (const rung of rungs) {
    assert.ok(rung.left >= 16 && rung.right <= 84);
    assert.ok(Math.abs(rung.left + rung.right - 100) < 0.0001);
  }
});

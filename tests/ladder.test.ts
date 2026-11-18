import test from "node:test";
import assert from "node:assert/strict";
import { ladderGeometry, previewPose, resizedTimelineOffset, scrollDesignPosition, settledDesign } from "../src/components/ladder-math.ts";

test("ordinary forward/reverse scrolling can select all six designs", () => {
  let index = 0;
  const visited = new Set<number>();
  for (let y = 1000; y <= 4000; y += 30) {
    index = settledDesign(scrollDesignPosition(y, 1000, 600, 0, 6), index, 6);
    visited.add(index);
  }
  assert.deepEqual([...visited], [0, 1, 2, 3, 4, 5]);
  for (let y = 4000; y >= 1000; y -= 30) index = settledDesign(scrollDesignPosition(y, 1000, 600, 0, 6), index, 6);
  assert.equal(index, 0);
});
test("selection dead band resists flicker and handles deep jumps", () => {
  assert.equal(settledDesign(.55, 0, 6), 0);
  assert.equal(settledDesign(.60, 0, 6), 1);
  assert.equal(settledDesign(.45, 1, 6), 1);
  assert.equal(settledDesign(.40, 1, 6), 0);
  assert.equal(settledDesign(5, 0, 6), 5);
});
test("manual selection offsets the timeline without changing document scroll", () => {
  const scroll = 1800, top = 1000, step = 600;
  const offset = 4 - (scroll - top) / step;
  assert.equal(scrollDesignPosition(scroll, top, step, offset, 6), 4);
  assert.ok(Math.abs(scrollDesignPosition(scroll - 600, top, step, offset, 6) - 3) < 1e-10);
  assert.equal(scrollDesignPosition(scroll + 600, top, step, offset, 6), 5);
});
test("perspective ladder changes depth and has finite bounded geometry", () => {
  const first = ladderGeometry(0), rotated = ladderGeometry(1);
  assert.notEqual(first.paths[0], rotated.paths[0]);
  assert.equal(first.paths.length, 2);
  assert.equal(first.rungs.length, 25);
  assert.equal(first.connectors.length, 6);
  for (const position of [0, .5, 1, 2, 3, 4, 5]) {
    const geometry = ladderGeometry(position);
    for (const path of geometry.paths) assert.ok(!/NaN|Infinity/.test(path));
    for (const { a, b } of geometry.rungs) for (const p of [a,b]) {
      assert.ok(p.x > 0 && p.x < 1000 && p.y >= 0 && p.y <= 600);
      assert.ok(Math.abs(p.z) <= 120);
    }
  }
});

test("resize and font measurement preserve the lead-in and selected timeline position", () => {
  const previous = { top: 744, step: 798 };
  assert.equal(resizedTimelineOffset(0, previous, previous, 0), 0);
  const next = { top: 1000, step: 600 };
  const scroll = 2340;
  const offset = resizedTimelineOffset(scroll, previous, next, 0);
  assert.ok(Math.abs(scrollDesignPosition(scroll, next.top, next.step, offset, 6) - 2) < 1e-10);
});

test("reference-inspired preview flow stays on two bounded readable lanes", () => {
  for (const compact of [true, false]) for (const position of [0,.5,1,2,3,4,5]) {
    for (let row = 0; row < 3; row++) {
      const left = previewPose(position, row * 2, compact), right = previewPose(position, row * 2 + 1, compact);
      assert.ok(Math.abs(left.x + right.x - 100) < 1e-10);
      assert.ok(left.x >= 6 && left.x <= 10 && right.x >= 90 && right.x <= 94);
      for (const pose of [left, right]) {
        assert.ok(pose.y >= 18 && pose.y <= 82);
        assert.ok(pose.scale >= .94 && pose.scale <= 1);
        assert.ok(Math.abs(pose.roll) <= 2.5 && Math.abs(pose.z) <= 28);
      }
    }
  }
  assert.notDeepEqual(previewPose(0,0,false),previewPose(1,0,false));
  assert.deepEqual(ladderGeometry(2,true).previews[3],previewPose(2,3,true));
});

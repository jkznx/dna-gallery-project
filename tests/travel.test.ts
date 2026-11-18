import test from "node:test";
import assert from "node:assert/strict";
import { followTravelPosition, settledTravelPosition, travelPoint, travelingCard, travelingScene } from "../src/components/travel-math.ts";

test("the same card travels down a curve, promotes, then recedes; reverse is exact", () => {
  const before = travelingCard(2,1,1000,560), focus = travelingCard(2,2,1000,560), after = travelingCard(2,3,1000,560);
  assert.ok(before.projectedY < focus.projectedY && focus.projectedY < after.projectedY);
  assert.ok(before.scale < .25 && after.scale < .25);
  assert.equal(focus.scale,1); assert.ok(focus.yaw === 0 && focus.z === 0);
  assert.ok(before.z < 0 && after.z < 0);
  assert.notEqual(before.x,focus.x); assert.notEqual(after.x,focus.x);
  assert.deepEqual(travelingCard(2,1,1000,560),before);
});

test("each resting selection has exactly one fully promoted design", () => {
  for(let position=0;position<6;position++) {
    const scene=travelingScene(position,1000,560,6);
    assert.equal(scene.cards.filter(card=>card.promotion>.9).length,1);
    assert.equal(scene.cards.findIndex(card=>card.promotion>.9),position);
    assert.ok(scene.cards[position].selectable);
    assert.equal(scene.paths.length,2);
  }
});

test("card centers and moving rung endpoints share the helix geometry", () => {
  for(const position of [0,.3,.5,1.7,2,3.45,5]) {
    const scene=travelingScene(position,305,448,6);
    for(const card of scene.cards.filter(card=>card.selectable)) {
      const point=travelPoint(card.u,card.side,305,448);
      const expected={x:point.projectedX/305*1000,y:point.projectedY/448*1000};
      assert.ok(scene.rungs.some(rung=>[rung.a,rung.b].some(p=>Math.abs(p.x-expected.x)<1e-6&&Math.abs(p.y-expected.y)<1e-6)));
    }
  }
});

test("visible card hit boxes stay separate through crossings on narrow and wide canvases", () => {
  for(const [width,height] of [[265,448],[305,448],[677,573],[1282,560]]) {
    for(let step=0;step<=100;step++) {
      const cards=travelingScene(step/20,width,height,6).cards.filter(card=>card.selectable);
      for(const card of cards) {
        assert.ok(Number.isFinite(card.x+card.y+card.z+card.scale));
        const half=card.frameWidth*card.scale*card.perspective/2;
        assert.ok(card.projectedX-half>=0&&card.projectedX+half<=width);
      }
      for(let a=0;a<cards.length;a++) for(let b=a+1;b<cards.length;b++) {
        const first=cards[a],second=cards[b];
        const halfHeight=(first.frameHeight*first.scale*first.perspective+second.frameHeight*second.scale*second.perspective)/2;
        assert.ok(Math.abs(first.projectedY-second.projectedY)>halfHeight);
      }
    }
  }
});

test("finite visual settling is monotonic and stops exactly at the selected design", () => {
  assert.equal(settledTravelPosition(2.45,2,0),2.45);
  assert.equal(settledTravelPosition(2.45,2,220),2);
  assert.equal(settledTravelPosition(2.45,2,1000),2);
  let previous=2.45;
  for(let elapsed=0;elapsed<=220;elapsed+=10) {
    const value=settledTravelPosition(2.45,2,elapsed);
    assert.ok(value<=previous&&value>=2); previous=value;
  }
});

test("new scroll follows its direction while raw document progress is retained", () => {
  assert.equal(followTravelPosition(1,.8,1),1);
  assert.ok(followTravelPosition(1,1.2,1)>1);
  assert.equal(followTravelPosition(1,1.2,-1),1);
  assert.ok(followTravelPosition(1,.8,-1)<1);
  let position=0;
  for(let frame=0;frame<30;frame++) position=followTravelPosition(position,3,1);
  assert.equal(position,3);
});

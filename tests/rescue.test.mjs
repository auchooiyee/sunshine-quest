import test from 'node:test';
import assert from 'node:assert/strict';
import {createBridgeRescue,RESCUE} from '../src/missions/bridge-rescue.js';

function atDesign(){const run=createBridgeRescue();run.move(1000);run.pick(8);run.pick(2);assert.equal(run.checkAnchors(),true);return run;}
test('incorrect or repeated anchors keep the river closed and report a useful retry',()=>{
  const run=createBridgeRescue();assert.equal(run.light(),false);assert.equal(run.build(),false);
  run.move(1000);assert.equal(run.x,RESCUE.layout.station);assert.equal(run.phase,'anchors');
  run.pick(2);run.pick(2);assert.equal(run.checkAnchors(),false);assert.equal(run.feedback,'rescuePickTwo');
  run.pick(2);run.pick(9);assert.equal(run.checkAnchors(),false);assert.equal(run.feedback,'rescueWrongAnchors');
  run.move(1000);assert.equal(run.x,RESCUE.layout.station);
  run.pick(9);run.pick(8);assert.equal(run.checkAnchors(),true);assert.equal(run.phase,'design');
});
test('one design fits both constraints; building and walking across are required to light the beacon',()=>{
  const passing=[];
  for(const span of RESCUE.spanValues)for(const k of RESCUE.curveValues){const run=atDesign();run.tune(span,k);if(run.build())passing.push([span,k]);}
  assert.deepEqual(passing,[[6,1]]);
  const run=atDesign();run.tune(6,.75);assert.equal(run.build(),false);assert.equal(run.feedback,'rescueWrongHeight');
  run.tune(6,1);assert.equal(run.build(),true);assert.equal(run.light(),false);
  const {left,right,baseline,heightScale,beacon}=RESCUE.layout;
  assert.equal(run.surface(left),baseline);assert.equal(run.surface(right),baseline);assert.equal(run.surface((left+right)/2),baseline-9*heightScale);
  run.move(right-run.x-1);assert.equal(run.phase,'cross');assert.equal(run.light(),false);
  run.move(beacon-run.x);assert.equal(run.phase,'beacon');assert.equal(run.light(),true);assert.equal(run.phase,'complete');assert.equal(run.light(),false);
});

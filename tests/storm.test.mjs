import test from 'node:test';
import assert from 'node:assert/strict';
import {createStormRelay,relayPlan,STORM} from '../src/missions/storm-relay.js';

test('both routes have valid plans and an exact-distance plan can fail the reserve',()=>{
  const accepted=[];
  for(const route of Object.keys(STORM.routes))for(const time of STORM.seconds)for(const speed of STORM.speeds){
    const plan=relayPlan(route,time,speed),run=createStormRelay();
    assert.equal(plan.planned,time*speed+2*(8-time));assert.equal(plan.remaining,90-36-STORM.routes[route].permit-3*speed-2*time);
    run.tune(route,time,speed);if(run.check())accepted.push([route,time,speed,plan.remaining]);
  }
  assert.deepEqual(accepted,[['ridge',3,6,20],['ridge',4,5,21],['ridge',6,4,20],['valley',4,6,24]]);
  const tooCostly=relayPlan('ridge',2,8);assert.equal(tooCostly.correctDistance,true);assert.equal(tooCostly.correctReserve,false);assert.equal(tooCostly.remaining,16);
  assert.equal(relayPlan('unknown',4,6),null);assert.equal(relayPlan('ridge',2.5,8),null);
});

test('changing plans resets approval; unloading requires the approved trip to arrive',()=>{
  const run=createStormRelay();assert.equal(run.launch(),false);assert.equal(run.unload(),false);
  run.tune('ridge',4,5);assert.equal(run.check(),true);run.tune('valley',4,5);assert.equal(run.launch(),false);assert.equal(run.check(),false);
  run.tune('valley',4,6);assert.equal(run.check(),true);assert.equal(run.launch(),true);assert.equal(run.tune('ridge',4,5),false);
  run.advance(4);assert.equal(run.travelled,24);assert.equal(run.unload(),false);run.advance(3);assert.equal(run.travelled,30);
  assert.equal(run.advance(2),true);assert.equal(run.travelled,32);assert.equal(run.elapsed,8);assert.equal(run.unload(),true);assert.equal(run.phase,'complete');assert.equal(run.plan.remaining,24);
});

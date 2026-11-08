import test from 'node:test';
import assert from 'node:assert/strict';
import {createSupplyDelivery,DELIVERY} from '../src/missions/supply-delivery.js';

test('every plan covering 28 metres works, and the feedback distinguishes short trips from overshoots',()=>{
  const valid=[];
  for(const time of DELIVERY.seconds)for(const speed of DELIVERY.speeds){
    const mission=createSupplyDelivery();mission.tune(time,speed);
    if(mission.check())valid.push([time,speed]);
    else assert.equal(mission.feedback,mission.plannedDistance<28?'short':'past');
  }
  assert.deepEqual(valid,[[2,8],[3,6],[4,5],[6,4]]);
  const mission=createSupplyDelivery();assert.equal(mission.board(),false);assert.equal(mission.tune(2.5,8),false);
  mission.tune(4,5);mission.check();mission.tune(4,4);assert.equal(mission.board(),false);
});

test('riding the selected plan changes speed at the switch and delivery requires unloading at the depot',()=>{
  const mission=createSupplyDelivery();
  assert.equal(mission.advance(8),false);assert.equal(mission.unload(),false);
  mission.tune(3,6);assert.equal(mission.check(),true);assert.equal(mission.unload(),false);assert.equal(mission.board(),true);
  mission.advance(2.5);assert.equal(mission.distance,15);assert.equal(mission.speed,6);
  mission.advance(.5);assert.equal(mission.distance,18);assert.equal(mission.speed,2);
  assert.equal(mission.tune(4,5),false);assert.equal(mission.advance(-1),false);assert.equal(mission.unload(),false);
  assert.equal(mission.advance(10),true);assert.equal(mission.phase,'arrived');assert.equal(mission.elapsed,8);assert.equal(mission.distance,28);assert.equal(mission.speed,0);
  assert.equal(mission.unload(),true);assert.equal(mission.phase,'complete');assert.equal(mission.unload(),false);
});

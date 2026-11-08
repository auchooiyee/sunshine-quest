import test from 'node:test';
import assert from 'node:assert/strict';
import {checkLanding,createCanyonLanding,CANYON} from '../src/missions/canyon-landing.js';

test('the landing grid accepts every integer point in the intersection, but excludes strict equality',()=>{
  const valid=[];
  for(let x=0;x<=CANYON.bound;x++)for(let y=0;y<=CANYON.bound;y++)if(checkLanding({x,y}).every(r=>r.accepted))valid.push([x,y]);
  assert.deepEqual(valid,[[3,1],[3,2],[3,3],[4,1],[4,2]]);
  const dashed=checkLanding({x:3,y:4});assert.equal(dashed[2].value,7);assert.equal(dashed[2].excluded,true);assert.deepEqual(dashed.map(r=>r.accepted),[true,true,false,true]);
  const solid=checkLanding({x:4,y:2});assert.equal(solid[3].value,10);assert.equal(solid[3].accepted,true);
  const limit=checkLanding({x:5,y:1});assert.equal(limit[3].value,11);assert.equal(limit[3].accepted,false);assert.equal(limit[3].excluded,false);
  for(const point of [null,{x:null,y:2},{x:3,y:2.5},{x:7,y:2}])assert.equal(checkLanding(point),null);
});

test('a changed or incomplete point cannot launch; validated coordinates stay fixed during flight',()=>{
  const run=createCanyonLanding();assert.equal(run.launch(),false);assert.equal(run.advance(10),false);
  run.select(3,null);assert.equal(run.check(),false);assert.deepEqual(run.review,[]);
  run.select(3,1);assert.equal(run.check(),true);run.select(3,4);assert.equal(run.launch(),false);assert.equal(run.check(),false);
  run.select(4,2);assert.equal(run.check(),true);assert.equal(run.launch(),true);assert.equal(run.select(3,2),false);
  assert.equal(run.advance(CANYON.duration/2),false);assert.equal(run.progress,.5);assert.equal(run.advance(10),true);assert.deepEqual(run.point,{x:4,y:2});assert.equal(run.phase,'complete');assert.equal(run.launch(),false);
});

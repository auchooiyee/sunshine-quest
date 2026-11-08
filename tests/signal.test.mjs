import test from 'node:test';
import assert from 'node:assert/strict';
import {createCrystalSignal,fraction,signalModel,SIGNAL} from '../src/missions/crystal-signal.js';

test('the tree covers all ordered outcomes and uses the remaining count when drawing without replacement',()=>{
  for(const red of SIGNAL.redChoices)for(const replacement of [true,false]){
    const {branches,mixed,secondTotal}=signalModel(red,replacement);
    assert.equal(Object.values(branches).reduce((sum,b)=>sum+b.num,0),mixed.den);
    assert.equal(branches.RR.secondCount,red-(replacement?0:1));
    assert.equal(branches.RB.secondCount,6-red);
    assert.equal(branches.BR.secondCount,red);
    assert.equal(secondTotal,replacement?6:5);
  }
  const mixed=signalModel(2,false).mixed;assert.equal(fraction(mixed.num,mixed.den),'8/15');
  const balanced=signalModel(3,true).mixed;assert.equal(fraction(balanced.num,balanced.den),'1/2');
});

test('only 2 red or 4 red without replacement reaches 8/15 and wrong plans explain why',()=>{
  const accepted=[];
  for(const red of SIGNAL.redChoices)for(const replacement of [true,false]){
    const run=createCrystalSignal();run.tune(red,replacement);
    if(run.check())accepted.push([red,replacement]);else assert.equal(run.feedback,replacement?'replacement':red===3?'high':'low');
  }
  assert.deepEqual(accepted,[[2,false],[4,false]]);
});

test('the ferry needs both distinct orders, with a fresh bag for each demonstration',()=>{
  const run=createCrystalSignal();run.tune(2,false);assert.equal(run.check(),true);
  assert.equal(run.send(),false);assert.equal(run.advance(9),false);
  run.pick('R');assert.deepEqual(run.remaining,{R:1,B:4});run.clearFirst();assert.deepEqual(run.remaining,{R:2,B:4});
  run.pick('R');run.pick('R');assert.equal(run.feedback,'same');assert.deepEqual(run.demonstrated,[]);
  run.pick('R');run.pick('B');assert.deepEqual(run.demonstrated,['RB']);assert.deepEqual(run.remaining,{R:2,B:4});assert.equal(run.send(),false);
  run.pick('R');run.pick('B');assert.equal(run.feedback,'repeat');assert.deepEqual(run.demonstrated,['RB']);
  run.pick('B');assert.deepEqual(run.remaining,{R:2,B:3});run.pick('R');assert.equal(run.phase,'ready');assert.equal(run.send(),true);
  run.advance(SIGNAL.duration/2);assert.equal(run.progress,.5);assert.equal(run.phase,'sailing');assert.equal(run.advance(SIGNAL.duration),true);assert.equal(run.phase,'complete');
});

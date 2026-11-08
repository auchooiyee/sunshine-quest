import test from 'node:test';
import assert from 'node:assert/strict';
import {createCampMarket,MARKET} from '../src/missions/camp-market.js';

function choose(run,food,medical,lamp){run.choose('food',food);run.choose('medical',medical);run.choose('lamp',lamp);}
test('market allows every basket that supplies the camp and protects the reserve',()=>{
  const accepted=[];
  for(let food=0;food<=4;food++)for(let medical=0;medical<=3;medical++)for(let lamp=0;lamp<=3;lamp++){
    const run=createCampMarket();choose(run,food,medical,lamp);
    const spending=12*food+20*medical+15*lamp;
    assert.equal(run.spent,spending);assert.equal(run.remaining,100-spending);
    if(run.check())accepted.push([food,medical,lamp]);else assert.equal(run.feedback,food<2||!medical||!lamp?'missing':spending>100?'over':'reserve');
  }
  assert.deepEqual(accepted,[[2,1,1],[2,1,2],[2,2,1],[3,1,1]]);
  assert.equal(MARKET.target.saving,20);
});

test('editing voids approval and the chosen quantities carry through unpacking and lighting',()=>{
  const run=createCampMarket();assert.equal(run.unpack(),false);assert.equal(run.light(),false);
  choose(run,1,1,0);assert.equal(run.check(),false);assert.deepEqual(run.missing,[{key:'food',count:1},{key:'lamp',count:1}]);
  assert.equal(run.choose('lamp',1.5),false);assert.equal(run.choose('food',5),false);
  choose(run,2,1,2);assert.equal(run.check(),true);assert.equal(run.remaining,26);
  run.choose('food',4);assert.equal(run.unpack(),false);assert.equal(run.check(),false);assert.equal(run.feedback,'reserve');
  choose(run,2,1,2);assert.equal(run.check(),true);assert.equal(run.light(),false);assert.equal(run.unpack(),true);
  assert.equal(run.choose('lamp',1),false);assert.equal(run.light(),true);assert.deepEqual(run.basket,{food:2,medical:1,lamp:2});assert.equal(run.light(),false);
});

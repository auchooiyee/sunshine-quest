import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createQuest } from '../src/missions/quest.js';
import { supplyManifest, finaleExample, isFinaleUnlocked, SCENARIO } from '../src/missions/finale.js';
import { validate } from '../src/math/challenges.js';
import { applicationFor } from '../src/missions/application.js';
import { createGame } from '../engine.js';
import { encodeAssignment, decodeAssignment, assignmentKey } from '../src/missions/assignment.js';
import { decodeSave, writeSave, loadSave, STORAGE_KEY, CONTENT_VERSION } from '../src/storage/save-store.js';
import { en, ms } from '../locales/finale.js';
const data=JSON.parse(readFileSync(new URL('../data/mathematics/f4/finale.json',import.meta.url),'utf8'));
function pass(q,answer){assert.equal(q.start(q.next.id),true);q.edit(answer);assert.equal(q.submit().correct,true);q.close();}
const bridge={span:8,k:.75};
function travel(route={x:3,y:3},delivery={t1:4,v1:9}){const q=createQuest(data);pass(q,bridge);pass(q,route);pass(q,delivery);return q;}

test('teacher preview is one valid connected example; five authored checks total 500 XP',()=>{
  assert.deepEqual(data.scenario,SCENARIO);assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  const example=finaleExample(data),q=createQuest(data);
  for(const def of example){
    for(const lang of ['en','ms']){assert.ok(def.title[lang]);assert.ok(def.prompt[lang]);assert.equal(def.hints[lang].length,3);assert.ok(def.explanation[lang]);}
    assert.equal(validate(q.next,def.answer).correct,true);pass(q,def.answer);
  }
  assert.equal(q.complete,true);assert.equal(q.xp,500);assert.equal(q.independent,5);
  const m=supplyManifest(q.save());assert.equal(m.bridgeCost,80);assert.equal(m.routeCost,45);assert.equal(m.distance,48);assert.equal(m.deliveryCost,53);assert.equal(m.available,182);assert.equal(m.supplies,85);assert.equal(m.savings,95);assert.equal(m.unallocated,2);
  assert.equal(m.bridgeCost+m.routeCost+m.deliveryCost+m.supplies+m.savings+m.unallocated,360);
});
test('a different safe route carries into distance, token probabilities and the remaining budget',()=>{
  const q=createQuest(data);pass(q,bridge);pass(q,{x:2,y:2});assert.equal(q.next.target.distance,32);assert.match(q.next.prompt.en,/\(2, 2\)/);pass(q,{t1:4,v1:5});
  assert.equal(q.next.model.red,2);assert.equal(q.next.model.blue,2);assert.equal(q.next.answer.conditional,2/3);assert.equal(q.next.answer.combined,1/3);
  q.start('risk');q.edit({conditional:'3/5',combined:'3/10'});assert.equal(q.submit().correct,false);q.edit({conditional:'2/3',combined:'1/3'});assert.equal(q.submit().correct,true);q.close();
  assert.equal(q.next.model.budget,217);pass(q,{food:3,medical:1,lamp:2,saving:70});assert.equal(q.xp,500);assert.equal(q.independent,4);assert.equal(supplyManifest(q.save()).unallocated,27);
});
test('alternative exact speed plans change fees without changing the required route distance',()=>{
  const a=travel(),b=travel({x:3,y:3},{t1:7,v1:6});assert.equal(supplyManifest(a.save()).distance,48);assert.equal(supplyManifest(b.save()).distance,48);
  assert.equal(supplyManifest(a.save()).available,182);assert.equal(supplyManifest(b.save()).available,191);
  pass(b,{conditional:'3/5',combined:'3/10'});assert.equal(validate(b.next,{food:3,medical:1,lamp:2,saving:70}).correct,true);
  pass(a,{conditional:'3/5',combined:'3/10'});assert.equal(validate(a.next,{food:3,medical:1,lamp:2,saving:70}).correct,false);
});
test('all accepted routes and whole-number speed plans leave a feasible camp budget',()=>{
  let routes=0,plans=0;
  for(let x=2;x<=6;x++)for(let y=2;y<=6;y++){
    const q=createQuest(data);pass(q,bridge);if(!validate(q.next,{x,y}).correct)continue;routes++;
    pass(q,{x,y});assert.equal(q.next.target.distance,8*(x+y));let validPlans=0;
    for(let t1=1;t1<=9;t1++)for(let v1=0;v1<=16;v1++){
      if(v1*t1+2*(10-t1)!==8*(x+y))continue;
      const run=createQuest(data,q.save());pass(run,{t1,v1});pass(run,run.next.answer);assert.ok(run.next.model.budget>=115);assert.equal(validate(run.next,run.next.answer).correct,true);validPlans++;plans++;
    }
    assert.ok(validPlans>0,`route ${x},${y}`);
  }
  assert.ok(routes>10);assert.ok(plans>30);
});
test('changed upstream saved answers invalidate downstream completion against the new scenario',()=>{
  const q=createQuest(data);for(const def of finaleExample(data))pass(q,def.answer);
  const altered=q.save();altered.sessions.route.draft={x:2,y:2};const restored=createQuest(data,altered);
  assert.deepEqual(restored.completed,['bridge','route']);assert.equal(restored.next.target.distance,32);assert.equal(restored.xp,200);
  altered.sessions.delivery.draft={t1:4,v1:5};const next=createQuest(data,altered);assert.deepEqual(next.completed,['bridge','route','delivery']);assert.equal(next.next.answer.conditional,2/3);
  const fake=createQuest(data,{completed:['budget'],sessions:{budget:{draft:{food:2,medical:1,lamp:1,saving:30}}}});assert.equal(fake.xp,0);
});
test('closing, hints and reload preserve a connected draft; completed answers and rewards are frozen',()=>{
  const q=travel();q.start('risk');q.hint();q.edit({conditional:'3/5'});q.close();const restored=createQuest(data,q.save());restored.start('risk');assert.equal(restored.session.hints,1);assert.equal(restored.session.draft.conditional,'3/5');assert.equal(restored.submit().reason,'invalid');restored.edit({combined:'3/10'});assert.equal(restored.submit().correct,true);assert.equal(restored.independent,3);assert.equal(restored.xp,400);assert.equal(restored.submit().reason,'unavailable');assert.equal(restored.xp,400);
  restored.edit({conditional:99});assert.equal(restored.session.draft.conditional,'3/5');
});
test('v2 saves and existing class codes migrate; final five-step missions have separate storage',()=>{
  const config={v:1,world:'finale',tasks:5,assist:true,guided:false,language:'ms'};assert.deepEqual(decodeAssignment(encodeAssignment(config)),config);
  for(const tasks of [3,6])assert.equal(decodeAssignment(btoa(JSON.stringify({...config,tasks}))),null);
  const old={schemaVersion:2,contentVersion:2,currentRegion:'motion',regions:{motion:{world:null,quest:{completed:[]}}},language:'ms'};
  assert.equal(decodeSave(old).contentVersion,CONTENT_VERSION);assert.equal(decodeSave(old).currentRegion,'motion');
  const entries=new Map([[STORAGE_KEY,JSON.stringify(old)]]),memory={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
  assert.equal(writeSave(memory,{currentRegion:'finale',assignment:config,regions:{finale:{world:null,quest:travel().save()}}},assignmentKey(config)),true);assert.equal(entries.get(STORAGE_KEY),JSON.stringify(old));assert.equal(loadSave(memory,assignmentKey(config)).data.currentRegion,'finale');
  assert.equal(isFinaleUnlocked(Array.from({length:5},()=>({complete:true}))),true);assert.equal(isFinaleUnlocked([{complete:true}]),false);assert.equal(isFinaleUnlocked(Array.from({length:5},(_,i)=>({complete:i!==4}))),false);
});
test('bridge, route, cart, crystals and camp coexist; new effects preserve cart time and riding',()=>{
  const q=travel(),defs=q.challenges,applications=defs.filter(d=>q.completed.includes(d.id)).map(d=>applicationFor(d,q.save().sessions[d.id].draft)).filter(Boolean),game=createGame(null,{mathQuest:true});
  game.configureQuest({limit:4165,blueprint:{...bridge,origin:820},application:{kind:'expedition',effects:applications}});game.start();game.state.enemies.forEach(e=>e.alive=false);Object.assign(game.state.player,{x:2470,y:450,onGround:true});game.update(.1,{});
  const elapsed=game.state.application.effects.find(e=>e.kind==='cart').elapsed,x=game.state.player.x;
  assert.equal(game.state.platforms.filter(p=>p.questBridge).length,16);assert.ok(game.state.platforms.filter(p=>p.questBridge).every(p=>p.x>=820&&p.x<1100));assert.equal(game.state.platforms.filter(p=>p.questApplication).length,2);
  pass(q,q.next.answer);const effect=applicationFor(q.challenges[3],q.save().sessions.risk.draft);
  game.configureQuest({limit:4165,blueprint:{...bridge,origin:820},application:{kind:'expedition',effects:[...applications,effect]}});assert.equal(game.state.application.effects.find(e=>e.kind==='cart').elapsed,elapsed);assert.equal(game.state.player.x,x);
  game.togglePause();const before=JSON.stringify(game.state);game.update(.1,{});assert.equal(JSON.stringify(game.state),before);
  assert.deepEqual(game.state.application.effects.map(e=>e.kind),['waypoint','cart','crystals']);pass(q,{food:2,medical:1,lamp:1,saving:95});assert.equal(applicationFor(q.challenges[4],q.save().sessions.budget.draft).origin,3720);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WORLDS } from '../config/worlds.js';
import { validate, motionDistance, budgetTotal } from '../src/math/challenges.js';
import { createQuest } from '../src/missions/quest.js';
import { applicationFor } from '../src/missions/application.js';
import { decodeSave, loadSave, writeSave, STORAGE_KEY } from '../src/storage/save-store.js';
import { encodeAssignment, decodeAssignment, assignmentKey, assignmentCurriculum } from '../src/missions/assignment.js';
import { renderAppliedGraph } from '../src/ui/applied-graph.js';
import { createGame } from '../engine.js';
import { en, ms } from '../locales/expedition.js';
const data=new Map(WORLDS.map(w=>[w.id,JSON.parse(readFileSync(new URL('../'+w.path,import.meta.url),'utf8'))]));
const get=(id,i)=>data.get(id).challenges[i];

test('24 new authored checks have bilingual hints, field labels, and valid example solutions',()=>{
  let checks=0;
  for(const world of WORLDS.slice(1)){
    const curriculum=data.get(world.id),quest=createQuest(curriculum);
    assert.equal(curriculum.reviewStatus,'prototype-awaiting-teacher-review');
    for(const def of curriculum.challenges){
      assert.equal(validate(def,def.answer).correct,true,`${world.id}/${def.id}`);
      for(const lang of ['en','ms']){assert.ok(def.title[lang]);assert.ok(def.prompt[lang]);assert.equal(def.hints[lang].length,3);assert.ok(def.explanation[lang]);assert.ok(def.fields.every(f=>f.label[lang]));}
      quest.start(def.id);quest.edit(def.answer);assert.equal(quest.submit().correct,true);checks++;
      const graph=renderAppliedGraph(def,def.answer,'en');assert.ok(!graph.markup.includes('NaN'));assert.ok(!graph.markup.includes('Infinity'));
    }
    assert.equal(quest.xp,450);assert.equal(quest.independent,6);assert.equal(createQuest(curriculum,quest.save()).complete,true);
  }
  assert.equal(checks,24);assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
});
test('inequalities accept multiple feasible points and reject dashed boundaries, negatives, and fractional coordinates',()=>{
  assert.equal(validate(get('inequalities',0),{x:2,y:6}).correct,true);
  assert.equal(validate(get('inequalities',0),{x:4,y:2}).correct,true);
  assert.equal(validate(get('inequalities',0),{x:1,y:1}).correct,false);
  assert.equal(validate(get('inequalities',0),{x:3.5,y:2}).correct,false);
  assert.equal(validate(get('inequalities',1),{x:3,y:4}).correct,false);
  assert.equal(validate(get('inequalities',1),{x:3,y:3}).correct,true);
  assert.equal(validate(get('inequalities',4),{x:2,y:3}).correct,false);
  assert.equal(validate(get('inequalities',5),{x:5,y:3}).correct,false);
  assert.equal(validate(get('inequalities',5),{x:4,y:-2}).correct,false);
  assert.equal(applicationFor(get('inequalities',0),{x:1,y:1}),null);
});
test('motion uses actual gradients and total graph area, and accepts alternative two-stage delivery plans',()=>{
  const points=get('motion',0).model.points;assert.equal((points[1][1]-points[0][1])/(points[1][0]-points[0][0]),5);
  const area=get('motion',1).model.segments.reduce((sum,s)=>sum+s.duration*s.speed,0);assert.equal(area,24);
  assert.equal(validate(get('motion',1),{value:area}).correct,true);
  assert.equal(motionDistance(get('motion',2),{t1:3,v1:12}),50);
  assert.equal(validate(get('motion',2),{t1:3,v1:12}).correct,true);
  assert.equal(validate(get('motion',2),{t1:5,v1:5}).correct,false);
  assert.equal(validate(get('motion',2),{t1:0,v1:8}).correct,false);
  assert.equal(validate(get('motion',2),{t1:10,v1:5}).correct,false);
  assert.equal(validate(get('motion',2),{t1:2.5,v1:14}).correct,false);
});
test('probability distinguishes replacement and conditional events; fractions do not get a loose graph tolerance',()=>{
  assert.match(get('probability',5).prompt.en,/3\/14/);
  assert.match(renderAppliedGraph(get('probability',5),{red:4,blue:4},'en').summary,/P\(RR\)=3\/14/);
  assert.equal(validate(get('probability',0),{conditional:'3/5',combined:'9/25'}).correct,true);
  assert.equal(validate(get('probability',1),{conditional:'2/4',combined:'3/10'}).correct,true);
  assert.equal(validate(get('probability',1),{conditional:'3/5',combined:'9/25'}).correct,false);
  assert.equal(validate(get('probability',1),{conditional:0.5,combined:0.31}).correct,false);
  assert.equal(validate(get('probability',4),{conditional:'3/5',combined:'3/10'}).correct,true);
  assert.equal(validate(get('probability',4),{conditional:'3/5',combined:'3/0'}).reason,'invalid');
  assert.equal(validate(get('probability',2),{red:3,blue:3}).correct,true);
  assert.equal(validate(get('probability',2),{red:3,blue:2}).correct,false);
  assert.equal(validate(get('probability',2),{red:-3,blue:9}).correct,false);
});
test('financial plans enforce essentials, savings and budget while accepting multiple sensible plans',()=>{
  assert.equal(budgetTotal(get('finance',2),{food:3,medical:1,lamp:2}),120);
  assert.equal(validate(get('finance',2),{food:2,medical:1,lamp:1,saving:30}).correct,true);
  assert.equal(validate(get('finance',2),{food:3,medical:1,lamp:2,saving:40}).correct,true);
  for(const draft of [{food:2,medical:0,lamp:1,saving:30},{food:2,medical:1,lamp:1,saving:20},{food:6,medical:3,lamp:4,saving:30},{food:2.5,medical:1,lamp:1,saving:30}])assert.equal(validate(get('finance',2),draft).correct,false);
  const model=get('finance',3).model;assert.equal(Math.ceil((model.goal-model.initial)/(model.income-model.expenses[0])),4);
  assert.equal(validate(get('finance',3),{value:3}).correct,false);
});
test('M1 saves migrate without losing drafts, hints, rewards, or independent evidence; M2 regions round-trip',()=>{
  const quest=createQuest(data.get('quadratics'));quest.start('roots');quest.hint();quest.edit({first:0,second:6});quest.submit();quest.close();quest.start('vertex');quest.edit({x:'3'});
  const migrated=decodeSave({schemaVersion:1,contentVersion:1,quest:quest.save(),world:{version:2,wood:8},language:'ms',assist:false});
  assert.equal(migrated.currentRegion,'quadratics');assert.equal(migrated.regions.quadratics.world.wood,8);assert.equal(migrated.regions.quadratics.quest.sessions.vertex.draft.x,'3');
  assert.equal(createQuest(data.get('quadratics'),migrated.regions.quadratics.quest).xp,75);
  migrated.currentRegion='motion';migrated.regions.motion={world:null,quest:createQuest(data.get('motion')).save()};
  const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  assert.equal(writeSave(storage,migrated),true);assert.equal(loadSave(storage).data.regions.quadratics.quest.sessions.roots.hints,1);
  assert.equal(loadSave(storage).data.currentRegion,'motion');
  assert.equal(decodeSave({...migrated,schemaVersion:2,currentRegion:'unknown'}),null);
  assert.equal(decodeSave({...migrated,schemaVersion:2,regions:[]}),null);
});
test('class codes are bounded, versioned and canonical; mission saves cannot overwrite expeditions',()=>{
  const config={v:1,world:'probability',tasks:3,assist:true,guided:true,language:'ms'},code=encodeAssignment(config);
  assert.deepEqual(decodeAssignment(code),config);assert.equal(encodeAssignment(decodeAssignment(code)),code);
  for(const invalid of ['', 'x'.repeat(513),'alert(1)',btoa('{}'),btoa(JSON.stringify({...config,v:99})),btoa(JSON.stringify({...config,tasks:30})),btoa(JSON.stringify({...config,assist:'true'}))])assert.equal(decodeAssignment(invalid),null);
  const short=assignmentCurriculum(data.get('probability'),config);assert.equal(short.challenges.length,3);
  const entries=new Map([[STORAGE_KEY,'expedition-untouched']]),storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
  const save={assignment:config,currentRegion:config.world,regions:{probability:{world:null,quest:createQuest(short).save()}},language:'ms',assist:true};
  assert.equal(writeSave(storage,save,assignmentKey(config)),true);assert.equal(entries.get(STORAGE_KEY),'expedition-untouched');assert.deepEqual(loadSave(storage,assignmentKey(config)).data.assignment,config);
  assert.equal(decodeSave({...save,schemaVersion:2,contentVersion:2,currentRegion:'finance',regions:{finance:save.regions.probability}}),null);
});
test('application effects follow validated answers; cart motion follows the graph and freezes during mathematics',()=>{
  const game=createGame(null,{mathQuest:true}),plan=applicationFor(get('motion',2),{t1:5,v1:8});
  game.configureQuest({limit:4165,application:plan});game.start();game.state.enemies.filter(e=>e.type!=='boss').forEach(e=>e.alive=false);Object.assign(game.state.player,{x:2540,y:450,onGround:true});
  for(let i=0;i<50;i++)game.update(.1,{});
  assert.ok(Math.abs(game.state.application.elapsed-5)<1e-6);assert.ok(Math.abs(game.state.platforms.find(p=>p.questCart).x-2808)<1e-6);
  game.togglePause();const elapsed=game.state.application.elapsed;game.update(.1,{});assert.equal(game.state.application.elapsed,elapsed);game.togglePause();
  for(let i=0;i<50;i++)game.update(.1,{});assert.ok(Math.abs(game.state.platforms.find(p=>p.questCart).x-2880)<1e-6);
  assert.ok(Math.abs(game.state.player.x-2900)<1e-6);assert.equal(game.state.player.y,450);
  const previous=game.state.application.elapsed;game.configureQuest({limit:4165,application:plan});assert.equal(game.state.application.elapsed,previous);
  game.configureQuest({limit:4165,application:applicationFor(get('inequalities',2),{x:3,y:3})});assert.equal(game.state.platforms.filter(p=>p.questApplication).length,1);assert.equal(game.state.platforms.some(p=>p.questCart),false);
  assert.equal(applicationFor(get('probability',2),{red:3,blue:3}).red,3);assert.equal(applicationFor(get('finance',2),{food:3,medical:1,lamp:2,saving:40}).saving,40);
});
test('expanded field schemas retain supported practice and reject unrelated or unsafe draft properties',()=>{
  const q=createQuest(data.get('finance'));q.start('roots');q.edit({value:'3',x:99,constructor:'evil'});assert.deepEqual(q.session.draft,{value:'3'});q.submit();q.edit({value:'4'});q.submit();assert.equal(q.independent,0);
  const restored=createQuest(data.get('finance'),q.save());assert.equal(restored.xp,75);assert.equal(restored.independent,0);
  const save=q.save();save.sessions.roots.independent=true;assert.equal(createQuest(data.get('finance'),save).independent,0);
  q.edit({value:99});q.hint();assert.equal(q.session.draft.value,'4');assert.equal(q.session.hints,0);
});

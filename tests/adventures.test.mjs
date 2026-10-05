import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADVENTURES} from '../config/adventures.js';
import {WORLDS} from '../config/worlds.js';
import {createGame} from '../engine.js';
import {createQuest} from '../src/missions/quest.js';
import {selectVariant} from '../src/math/variants.js';
import {roots,vertex} from '../src/math/quadratics.js';
import {constructionsFor,constructionSummary} from '../src/missions/constructions.js';
import {en,ms} from '../locales/adventure.js';
const banks=new Map(WORLDS.map(w=>[w.id,JSON.parse(readFileSync(new URL('../'+w.path,import.meta.url),'utf8'))]));
const answer=d=>d.answer||(d.kind==='roots'?Object.fromEntries(roots(d.model).map((v,i)=>[i?'second':'first',v])):d.kind==='vertex'?vertex(d.model):{span:d.target.span,k:4*d.target.height/d.target.span**2});
function complete(id,variant=0){const q=createQuest(selectVariant(banks.get(id),variant));while(q.next){q.start(q.next.id);q.edit(answer(q.active));assert.equal(q.submit().correct,true);q.close();}return q;}
const configure=(g,id,q,extras={})=>{const b=constructionsFor(id,q);g.configureQuest({limit:4165,route:ADVENTURES[id],blueprints:b.bridges,application:b.effects.length?{kind:'expedition',effects:b.effects}:null,constructions:b.items,...extras});return b;};

test('five distinct routes have reachable stations, matching workshops, guarded boundaries and bilingual briefings',()=>{
  assert.equal(new Set(Object.values(ADVENTURES).map(r=>JSON.stringify(r.stations))).size,5);
  assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  for(const route of Object.values(ADVENTURES)){
    const g=createGame(null,{mathQuest:true});g.configureQuest({route,limit:route.gates[0][1]-28});g.start();
    g.state.enemies.filter(e=>e.type!=='boss').forEach(e=>e.alive=false);
    for(let i=0;i<160;i++)g.update(.1,{right:true,jump:i%12===0});
    assert.equal(g.state.player.x,route.gates[0][1]-28);
    assert.equal(g.state.enemies.at(-1).x,route.stations.guardian);
    for(const [i,[id,gate]] of route.gates.entries()){assert.ok(route.stations[id]<gate);assert.ok(gate<Object.values(route.stations)[i+1]);}
    g.configureQuest({route,limit:4165});Object.assign(g.state.player,{x:route.bench,y:500});assert.ok(g.getRecipes().every(r=>r.atBench));
    for(const lang of ['en','ms'])for(const key of ['npc','mission','brief','guardian','restored','relic'])assert.ok(route[key][lang]);
  }
});
test('all 90 task versions produce matching persistent constructions including changed Guardian models',()=>{
  let count=0;
  for(const world of WORLDS)for(const variant of [0,1,2]){
    const q=complete(world.id,variant),built=constructionsFor(world.id,q);count+=built.items.length;
    assert.equal(built.items.length,6);assert.equal(built.items.filter(i=>i.guardian).length,3);
    const restored=createQuest(banks.get(world.id),q.save());assert.deepEqual(constructionsFor(world.id,restored),built);
    for(const item of built.items)for(const lang of ['en','ms'])assert.ok(!/NaN|undefined/.test(constructionSummary(item,lang)));
    if(world.id==='quadratics'){assert.equal(built.bridges.length,2);assert.notEqual(built.bridges[0].span,built.bridges[1].span);}
    if(world.id==='inequalities')assert.equal(built.effects.length,6);
    if(world.id==='motion')assert.equal(built.effects.filter(e=>e.kind==='cart').length,2);
    if(world.id==='finance')for(const item of built.items.filter(i=>i.kind==='budget-plan'))assert.equal(item.spent+item.values.saving+item.remaining,item.model.budget);
    const invalid=q.save();invalid.sessions.roots.draft={};const rejected=createQuest(banks.get(world.id),invalid);assert.equal(constructionsFor(world.id,rejected).items.length,0);
  }
  assert.equal(count,90);
});
test('both arches retain their own mathematical width, height and collision surfaces',()=>{
  const q=complete('quadratics'),g=createGame(null,{mathQuest:true}),built=configure(g,'quadratics',q);
  assert.equal(g.state.platforms.filter(p=>p.questBridge).length,32);
  for(const bridge of built.bridges){const pieces=g.state.platforms.filter(p=>p.bridgeId===bridge.id);assert.equal(pieces.length,16);assert.equal(pieces[15].x+pieces[15].w-1-pieces[0].x,bridge.span*32);const localX=bridge.span*7.5/16;assert.equal(pieces[7].y,500-bridge.k*localX*(bridge.span-localX)*7);}
});
test('separate delivery carts preserve clocks on reconfigure, pause and save, and replay without changing learning',()=>{
  const q=complete('motion'),g=createGame(null,{mathQuest:true});configure(g,'motion',q);g.start();g.state.enemies.forEach(e=>e.alive=false);g.state.player.x=4000;
  for(let i=0;i<20;i++)g.update(.1,{});
  const carts=g.state.application.effects.filter(e=>e.kind==='cart');assert.equal(carts.length,2);assert.ok(carts.every(c=>Math.abs(c.elapsed-2)<1e-6));
  for(const a of carts){const platform=g.state.platforms.find(p=>p.effectId===a.id);assert.ok(Math.abs(platform.x-(a.origin+2*a.v1/a.distance*(a.trackWidth??360)))<1e-6);}
  configure(g,'motion',q);assert.ok(g.state.application.effects.every(c=>Math.abs(c.elapsed-2)<1e-6));
  g.togglePause();g.update(.1,{});const saved=g.save();
  const restored=createGame(saved,{mathQuest:true});configure(restored,'motion',q);assert.deepEqual(restored.save().cartProgress,saved.cartProgress);
  restored.restoreSave(saved);configure(restored,'motion',q);assert.deepEqual(restored.save().cartProgress,saved.cartProgress);
  const evidence=q.save();restored.replayCarts();assert.ok(restored.state.application.effects.every(c=>c.elapsed===0));assert.deepEqual(q.save(),evidence);
  const bad={...saved,cartProgress:[{signature:'invented',elapsed:999}]};const safe=createGame(bad,{mathQuest:true});configure(safe,'motion',q);assert.ok(safe.state.application.effects.every(c=>c.elapsed===0));
});
test('rescue returns to the last configured restored checkpoint and preserves materials',()=>{
  const g=createGame(null,{mathQuest:true,assist:false});g.configureQuest({route:ADVENTURES.inequalities,checkpoint:1255,limit:1790,assist:false});g.start();g.state.wood=9;g.state.enemies.forEach(e=>e.alive=false);
  const e=g.state.enemies[0];Object.assign(e,{alive:true,x:1500,y:500,homeX:1500});Object.assign(g.state.player,{x:1500,y:500,hp:.01,invulnerable:0});g.update(.02,{});
  assert.equal(g.state.player.x,1255);assert.equal(g.state.player.hp,5);assert.equal(g.state.wood,9);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createGame } from '../engine.js';
import { createQuest } from '../src/missions/quest.js';
import { roots, vertex, parseNumber, validate, designModel } from '../src/math/quadratics.js';
import { decodeSave, loadSave, writeSave, STORAGE_KEY } from '../src/storage/save-store.js';
import en from '../locales/en.js';
import ms from '../locales/ms.js';
const data=JSON.parse(readFileSync(new URL('../data/mathematics/f4/bab01.json',import.meta.url),'utf8'));
const answers=[{first:0,second:6},{x:3,y:9},{span:8,k:.75},{first:8,second:2},{x:5,y:9},{span:10,k:1}];

test('all six authored checks share the graph model; answers and explanations have both languages',()=>{
  for(const [i,def] of data.challenges.entries()){
    assert.equal(validate(def,answers[i]).correct,true,def.id);
    for(const language of ['en','ms']){assert.ok(def.title[language]);assert.ok(def.prompt[language]);assert.equal(def.hints[language].length,3);assert.ok(def.explanation[language]);}
  }
  assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  assert.deepEqual(roots(data.challenges[0].model),[0,6]);
  assert.deepEqual(vertex(designModel(8,.75)),{x:4,y:12});
  assert.deepEqual(vertex(designModel(10,1)),{x:5,y:25});
});
test('number parsing rejects blanks, code, infinity and invalid fractions; roots accept either order',()=>{
  for(const value of ['', ' ', null, undefined, NaN, Infinity,'Infinity','1e309','3/0','alert(1)','2,3'])assert.equal(parseNumber(value),null);
  assert.equal(parseNumber(' 3 / 4 '),.75);assert.equal(parseNumber('-1.5'),-1.5);
  assert.equal(validate(data.challenges[0],{first:'6',second:'0'}).correct,true);
  assert.equal(validate(data.challenges[0],{first:'6',second:'6'}).correct,false);
  assert.equal(validate(data.challenges[0],{first:'',second:'6'}).reason,'invalid');
  assert.equal(validate(data.challenges[2],{span:8,k:'3/4'}).correct,true);
  assert.equal(validate(data.challenges[2],{span:8,k:1}).correct,false);
  assert.equal(validate(data.challenges[2],{span:10,k:.75}).correct,false);
});
test('quests enforce order, freeze rewards after success, and separate first answer from supported success',()=>{
  const quest=createQuest(data);assert.equal(quest.start('design'),false);assert.equal(quest.start('roots'),true);
  quest.edit({first:1,second:6});assert.equal(quest.submit().correct,false);
  quest.hint();quest.edit(answers[0]);assert.equal(quest.submit().correct,true);
  assert.equal(quest.xp,75);assert.equal(quest.independent,0);assert.equal(quest.submit().reason,'unavailable');assert.equal(quest.xp,75);
  for(let i=1;i<6;i++){assert.equal(quest.start(data.challenges[i].id),true);quest.edit(answers[i]);assert.equal(quest.submit().correct,true);}
  assert.equal(quest.complete,true);assert.equal(quest.xp,450);assert.equal(quest.independent,5);
  const restored=createQuest(data,quest.save());assert.equal(restored.complete,true);assert.equal(restored.xp,450);assert.equal(restored.independent,5);
});
test('drafts and hint usage survive closing, saving and reopening; invalid submissions do not consume first attempt',()=>{
  const quest=createQuest(data);quest.start('roots');quest.edit({first:'0'});quest.hint();assert.equal(quest.submit().reason,'invalid');quest.close();
  const restored=createQuest(data,quest.save());restored.start('roots');assert.equal(restored.session.draft.first,'0');assert.equal(restored.session.hints,1);assert.equal(restored.session.attempts,0);
  restored.edit({second:'6'});restored.submit();assert.equal(restored.independent,0);
});
test('bounded attempt history never turns repeated guessing into an independent first answer',()=>{
  const quest=createQuest(data);quest.start('roots');quest.edit({first:1,second:2});
  for(let i=0;i<105;i++)quest.submit();quest.edit(answers[0]);quest.submit();
  assert.equal(quest.records.length,100);assert.equal(quest.session.attempts,106);assert.equal(quest.independent,0);
  assert.equal(createQuest(data,quest.save()).independent,0);
});
test('malformed or out-of-order completed saves cannot unlock a route with an invalid blueprint',()=>{
  const quest=createQuest(data,{completed:['design'],sessions:{design:{draft:{span:'oops',k:Infinity}}}});assert.deepEqual(quest.completed,[]);
  const forged=createQuest(data,{completed:['roots'],sessions:{roots:{draft:{first:2,second:3}}}});assert.deepEqual(forged.completed,[]);
  assert.equal(decodeSave('{bad'),null);assert.equal(decodeSave({schemaVersion:2,contentVersion:1,quest:{}}),null);
  assert.equal(decodeSave({schemaVersion:1,contentVersion:99,quest:{}}),null);
  assert.equal(decodeSave({schemaVersion:1,contentVersion:1,quest:[]}),null);
});
test('branded storage keeps upstream data intact and fails gracefully when storage is unavailable',()=>{
  const entries=new Map([['yoyo-sunshine-forest-v1','original']]);const memory={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v)};
  const quest=createQuest(data);assert.equal(writeSave(memory,{quest:quest.save(),language:'ms'}),true);assert.equal(loadSave(memory).data.language,'ms');assert.equal(entries.get('yoyo-sunshine-forest-v1'),'original');
  entries.set(STORAGE_KEY,'broken');assert.equal(loadSave(memory).damaged,true);
  const broken={getItem(){throw Error('Unavailable');},setItem(){throw Error('Quota');}};assert.equal(loadSave(broken).available,false);assert.equal(writeSave(broken,{}),false);
});
test('math-world gates cannot be jumped, blueprints create collision surfaces, melee cannot bypass guardian',()=>{
  const game=createGame(null,{mathQuest:true});game.configureQuest({limit:1072});game.start();
  for(let i=0;i<90;i++)game.update(.1,{right:true,jump:i%2===0});assert.ok(game.state.player.x<=1072);
  game.configureQuest({limit:4165,blueprint:{span:8,k:.75},shields:3});assert.equal(game.state.platforms.filter(p=>p.questBridge).length,16);
  game.state.enemies.filter(e=>e.type!=='boss').forEach(e=>e.alive=false);
  game.state.player.x=3600;game.state.player.facing=1;
  for(let i=0;i<80;i++)game.update(.1,{attack:true});
  assert.equal(game.state.enemies.at(-1).hp,30);assert.equal(game.state.trophy,false);assert.ok(game.state.events.some(e=>e.type==='guardian'));
  game.configureQuest({limit:4165,blueprint:{span:8,k:.75},shields:0,complete:true});assert.equal(game.state.mode,'complete');assert.equal(game.state.trophy,true);game.start();assert.equal(game.state.mode,'playing');
});
test('paused mathematics freezes movement, enemies and elapsed adventure time',()=>{
  const game=createGame(null,{mathQuest:true});game.start();game.togglePause();const before=JSON.stringify(game.state);game.update(.1,{right:true,attack:true,jump:true});assert.equal(JSON.stringify(game.state),before);
});

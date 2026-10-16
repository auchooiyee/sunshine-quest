import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../engine.js';
import {BALANCE,WEAPON_TIERS} from '../balance.js';
import {ADVENTURES} from '../config/adventures.js';
import {en,ms} from '../locales/equipment.js';
const tick=(g,seconds)=>{for(let i=0;i<Math.ceil(seconds*120);i++)g.update(1/120);};
function workshop(){const g=createGame(null,{mathQuest:true});g.configureQuest({route:ADVENTURES.quadratics,limit:4165});g.start();g.state.wood=100;g.state.stone=100;g.state.enemies.forEach(e=>e.alive=false);return g;}

test('both weapon tracks upgrade in order, charge once and stop at level four',()=>{
 for(const tool of ['sword','axe']){
  const g=workshop(),path=WEAPON_TIERS[tool];
  assert.equal(g.getWeapon(tool).level,1);
  assert.equal(g.craft(path[2]),false);assert.equal(g.craft(path[3]),false);
  let wood=100,stone=100;
  for(const [i,id] of path.slice(1).entries()){
   assert.equal(g.craft(id),true);wood-=BALANCE.recipes[id].wood;stone-=BALANCE.recipes[id].stone;
   assert.equal(g.getWeapon(tool).level,i+2);assert.equal(g.state.equipment,tool);
   assert.equal(g.state.wood,wood);assert.equal(g.state.stone,stone);
   assert.equal(g.craft(id),false);assert.equal(g.state.wood,wood);assert.equal(g.state.stone,stone);
  }
  assert.equal(g.getWeapon(tool==='sword'?'axe':'sword').level,1);
  assert.ok(g.getRecipes().filter(r=>path.includes(r.id)).every(r=>r.owned&&!r.available));
 }
});
test('insufficient materials, wrong location and inactive play cannot spend resources',()=>{
 const g=workshop();g.state.wood=6;g.state.stone=5;assert.equal(g.craft('stoneSword'),false);assert.equal(g.state.wood,6);assert.equal(g.state.stone,5);
 g.state.stone=6;g.state.player.x=800;assert.equal(g.craft('stoneSword'),false);
 g.state.player.x=ADVENTURES.quadratics.bench;g.togglePause();assert.equal(g.craft('stoneSword'),true);assert.equal(g.state.wood,0);assert.equal(g.state.stone,0);
 const fresh=createGame(null,{mathQuest:true});fresh.state.wood=100;fresh.state.stone=100;assert.equal(fresh.craft('stoneSword'),false);
 assert.equal(g.craft('__proto__'),false);assert.equal(g.craft('constructor'),false);
});
test('higher swords deal their listed damage while the axe harvests rocks faster',()=>{
 for(let level=1;level<=4;level++){
  const g=workshop();for(const id of WEAPON_TIERS.sword.slice(1,level))g.craft(id);
  const enemy=g.state.enemies[0];Object.assign(enemy,{alive:true,x:800,y:500,hp:30,maxHp:30,hitTimer:999});g.state.player.x=750;
  g.attack();tick(g,.25);assert.equal(enemy.hp,30-g.getWeapon().damage);
 }
 for(let level=1;level<=4;level++){
  const g=workshop();for(const id of WEAPON_TIERS.axe.slice(1,level))g.craft(id);g.equip('axe');
  const rock=g.state.rocks[0];g.state.player.x=rock.x-45;const before=g.state.stone;
  const hits=Math.ceil(rock.hp/g.getWeapon().rockDamage);
  for(let n=0;n<hits;n++){assert.equal(g.attack(),true);tick(g,g.getWeapon().cooldown+.03);}
  assert.equal(rock.depleted,true);assert.equal(g.state.stone,before+6);
  g.attack();tick(g,.8);assert.equal(g.state.stone,before+6);
 }
});
test('upgrading during a paused swing retains the original hit, then equips the new level',()=>{
 const g=workshop();g.attack();const original=g.state.player.actionWeapon;g.togglePause();
 g.craft('stoneSword');g.craft('reinforcedSword');assert.equal(g.getWeapon().level,3);assert.equal(g.state.player.actionWeapon,original);assert.equal(original.damage,2);
 g.togglePause();tick(g,.6);g.attack();assert.equal(g.state.player.actionWeapon.level,3);
});
test('weapon levels and exact materials survive reload, while restart and separate regions stay independent',()=>{
 const g=workshop();for(const id of WEAPON_TIERS.sword.slice(1))g.craft(id);g.craft('stoneAxe');
 const saved=g.save(),restored=createGame(JSON.parse(JSON.stringify(saved)),{mathQuest:true});
 assert.equal(restored.getWeapon('sword').level,4);assert.equal(restored.getWeapon('axe').level,2);
 assert.equal(restored.state.wood,saved.wood);assert.equal(restored.state.stone,saved.stone);
 restored.restoreSave(null);restored.configureQuest({route:ADVENTURES.finance,limit:4165});assert.equal(restored.getWeapon('sword').level,1);
 restored.restoreSave(saved);assert.equal(restored.getWeapon('sword').level,4);
 restored.restart();assert.equal(restored.getWeapon('sword').level,1);
});
test('old stone weapons migrate to level two; malformed upgrade chains do not skip levels',()=>{
 const legacy=createGame({version:1,crafted:true});assert.equal(legacy.getWeapon('sword').level,2);
 const stone=createGame({version:2,upgrades:{stoneSword:true,stoneAxe:true}});assert.equal(stone.getWeapon('sword').level,2);assert.equal(stone.getWeapon('axe').level,2);
 const bad=createGame({version:2,upgrades:{reinforcedSword:true,crystalSword:true,stoneAxe:'true',crystalAxe:true}});
 assert.equal(bad.getWeapon('sword').level,1);assert.equal(bad.getWeapon('axe').level,1);assert.equal(bad.state.upgrades.crystalSword,false);
});
test('chapter resources afford both full weapon tracks and shields without replaying',()=>{
 const g=workshop();g.state.wood=0;g.state.stone=0;g.equip('axe');
 for(const resource of [...g.state.trees,...g.state.rocks]){
  Object.assign(g.state.player,{x:resource.x-40,y:500,facing:1});
  for(let i=0;i<3;i++){g.attack();tick(g,.8);}
 }
 for(const platform of g.state.platforms){g.state.player.x=platform.x+48;g.jump();tick(g,.7);g.state.player.y=500;}
 assert.equal(g.state.wood,56);assert.equal(g.state.stone,36);g.state.player.x=180;
 for(const path of Object.values(WEAPON_TIERS))for(const id of path.slice(1))assert.equal(g.craft(id),true);
 assert.equal(g.craft('woodArmor'),true);assert.equal(g.craft('stoneArmor'),true);
 assert.equal(g.state.wood,0);assert.equal(g.state.stone,1);
});
test('existing mined rocks stay mined and new deposits are added to old chapter saves',()=>{
 const g=createGame({version:2,rocks:[{id:'rock-0',hp:0},{id:'rock-1',hp:2}]},{mathQuest:true});
 assert.equal(g.state.rocks[0].depleted,true);assert.equal(g.state.rocks[1].hp,2);assert.equal(g.state.rocks.length,5);assert.ok(g.state.rocks.slice(2).every(r=>r.hp===6));
 assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
 for(const path of Object.values(WEAPON_TIERS))for(const id of path)assert.ok(en[id+'Name']&&ms[id+'Name']);
});

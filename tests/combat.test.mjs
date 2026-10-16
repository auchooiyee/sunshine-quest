import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../engine.js';
import {ADVENTURES} from '../config/adventures.js';
import {ENCOUNTERS} from '../config/encounters.js';
const tick=(g,n,input={})=>{for(let i=0;i<Math.round(n*120);i++)g.update(1/120,input);};
const create=(id='quadratics',limit=4165)=>{const g=createGame(null,{mathQuest:true});g.configureQuest({route:ADVENTURES[id],limit,assist:false});g.start();return g;};
const isolate=(g,index=0)=>{g.state.enemies.forEach(e=>e.alive=false);const e=g.state.enemies[index];Object.assign(e,{alive:true,x:850,y:500,hitTimer:999});Object.assign(g.state.player,{x:750,y:500,facing:1});return e;};

test('third sword strike has extra reach and damage; missed timing resets the combo',()=>{
 const g=create(),e=isolate(g);e.x=1000;
 for(let i=0;i<2;i++){g.attack();tick(g,.58);assert.equal(e.hp,6);}
 e.x=895;g.attack();tick(g,.22);assert.equal(e.hp,2);assert.equal(g.state.player.combo,3);
 assert.equal(g.state.combat.hits.at(-1).damage,4);
 tick(g,1.2);g.attack();assert.equal(g.state.player.combo,1);
});
test('power thrust stays directional and cannot bypass the mathematics guardian',()=>{
 const g=create(),e=isolate(g);e.x=620;
 tick(g,1.5,{attack:true});assert.equal(e.hp,6);
 const boss=g.state.enemies.at(-1);boss.alive=true;boss.x=g.state.player.x+80;
 tick(g,1.3,{attack:true});assert.equal(boss.hp,30);assert.ok(g.state.events.some(e=>e.type==='guardian'));
});
test('dash is bounded by locked gates, consumes cooldown and freezes while paused',()=>{
 const g=create('quadratics',1072);g.state.enemies.forEach(e=>e.alive=false);g.state.player.x=1050;
 assert.equal(g.dash(),true);tick(g,.2);assert.equal(g.state.player.x,1072);assert.equal(g.dash(),false);
 g.togglePause();const before=structuredClone(g.state.combat);tick(g,2);assert.deepEqual(g.state.combat,before);
 g.togglePause();tick(g,1);assert.equal(g.dash(),true);
});
test('dash evades an incoming orb and held input cannot auto-repeat it',()=>{
 const g=create();isolate(g).alive=false;
 g.state.projectiles.push({x:790,y:470,vx:0,vy:0,damage:1,life:2});
 tick(g,.1,{dash:true});assert.equal(g.state.player.hp,5);
 const x=g.state.player.x;tick(g,2,{dash:true});assert.ok(g.state.player.x-x<80);assert.equal(g.state.combat.dashCooldown,0);
});
test('beetle telegraphs, commits its charge direction and can be interrupted by a sword',()=>{
 const g=create('inequalities'),e=isolate(g);e.hitTimer=0;
 tick(g,.1);assert.equal(e.skillPhase,'windup');const direction=e.facing;
 g.state.player.x=1050;tick(g,.7);assert.equal(e.skillPhase,'charge');assert.equal(e.facing,direction);
 tick(g,.1);assert.ok(e.vx<0);
 Object.assign(g.state.player,{x:e.x-80,facing:1,invulnerable:3});g.attack();tick(g,.22);assert.equal(e.skillPhase,'recovery');assert.equal(e.hp,4);
});
test('slime leaps and wisp floats and fires a visible aimed projectile',()=>{
 const g=create(),slime=isolate(g);slime.hitTimer=0;slime.hopTimer=0;
 tick(g,.1);assert.ok(slime.y<500);assert.ok(slime.vx<0);
 const wisp=isolate(g,5);wisp.hitTimer=0;wisp.shotTimer=.1;wisp.x=1000;
 tick(g,.2);assert.ok(wisp.y<475);assert.ok(g.state.projectiles.some(s=>s.kind==='wisp'&&s.vx<0));
});
test('timed sword impact disperses a forward orb but not a rear orb',()=>{
 const g=create();isolate(g).alive=false;
 g.state.projectiles=[{x:840,y:470,vx:0,vy:0,life:3},{x:670,y:470,vx:0,vy:0,life:3}];
 g.attack();tick(g,.21);assert.equal(g.state.projectiles.length,1);assert.equal(g.state.projectiles[0].x,670);
});
test('every region has its own roster; defeated and partly damaged creatures survive save reload',()=>{
 for(const [id,types] of Object.entries(ENCOUNTERS)){
  const g=create(id);assert.deepEqual(g.state.enemies.slice(0,6).map(e=>e.type),types);
  g.state.enemies[0].hp=0;g.state.enemies[0].alive=false;g.state.enemies[2].hp=3;
  const restored=createGame(g.save(),{mathQuest:true});restored.configureQuest({route:ADVENTURES[id],limit:4165});
  assert.equal(restored.state.enemies[0].alive,false);assert.equal(restored.state.enemies[2].hp,3);
  assert.deepEqual(restored.state.enemies.slice(0,6).map(e=>e.type),types);
 }
});
test('axe breaks a sword combo and damage and resource yields remain unchanged',()=>{
 const g=create();isolate(g).alive=false;g.state.player.x=555;
 g.attack();tick(g,.6);assert.equal(g.equip('axe'),true);g.attack();tick(g,.3);
 assert.equal(g.state.combat.chain,0);assert.equal(g.state.trees[0].hp,3);
});

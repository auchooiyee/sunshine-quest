import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from './engine.js';
import { BALANCE } from './balance.js';

function tick(game, seconds, input = {}) { for (let i = 0; i < Math.ceil(seconds * 60); i++) game.update(1 / 60, input); }
function begun() { const game = createGame(); game.start(); return game; }
function quiet(game) { for (const enemy of game.state.enemies) { enemy.x = 4100; enemy.hitTimer = 1e4; enemy.hopTimer = 1e4; } }
function strike(game) { assert.equal(game.attack(), true); tick(game, game.getWeapon().cooldown + .02); }

 test('movement boundaries, jump edge, walk/jump states and both platforms stay reachable', () => {
  const g = begun(); quiet(g);
  tick(g, 2, { left: true }); assert.equal(g.state.player.x, 35); assert.equal(g.state.player.action, 'walk');
  tick(g, 18, { right: true }); assert.equal(g.state.player.x, 4165);
  g.state.player.x = 400;
  g.update(1 / 60, { jump: true }); assert.ok(g.state.player.y < 500); assert.equal(g.state.player.action, 'jump');
  tick(g, 2, { jump: true }); assert.equal(g.state.player.y, 500); assert.equal(g.state.player.onGround, true);
  g.update(1 / 60, {}); g.update(1 / 60, { jump: true }); assert.ok(g.state.player.y < 500);
  for (const platform of begun().state.platforms) {
    const landing = begun(); quiet(landing); landing.state.player.x = platform.x + 50;
    landing.jump(); tick(landing, .7);
    assert.equal(landing.state.player.y, platform.y); assert.equal(landing.state.player.onGround, true);
    tick(landing, 1, { right: true }); assert.equal(landing.state.player.y, 500);
  }
});

test('wind-up applies no damage, impact occurs once, cooldown and tool lock protect the animation', () => {
  const g = begun(); quiet(g); const tree = g.state.trees[0]; g.state.player.x = tree.x - 45;
  assert.equal(g.attack(), true); assert.equal(g.state.player.action, 'sword'); assert.equal(tree.hp, 6);
  assert.equal(g.attack(), false); assert.equal(g.equip('axe'), false);
  tick(g, .1); assert.equal(tree.hp, 6);
  tick(g, .1); assert.equal(tree.hp, 5); assert.ok(tree.hitTimer > 0);
  tick(g, .3); assert.equal(tree.hp, 5); assert.equal(g.state.player.action, 'idle');
  assert.equal(g.attack(), false); tick(g, .1); assert.equal(g.equip('axe'), true);
  assert.equal(g.attack(), true); assert.equal(g.state.player.action, 'axe');
});

test('wood axe takes three hits, sword six, stone axe one; pile yields eight exactly once', () => {
  for (const [tool, upgraded, count] of [['sword', false, 6], ['axe', false, 3], ['axe', true, 1]]) {
    const g = begun(); quiet(g); g.equip(tool); g.state.upgrades.stoneAxe = upgraded;
    const tree = g.state.trees[0]; g.state.player.x = tree.x - 45;
    for (let n = 0; n < count - 1; n++) { strike(g); assert.equal(tree.felled, false); }
    strike(g); assert.equal(tree.hp, 0); assert.equal(tree.felled, true); assert.equal(g.state.wood, 8);
    strike(g); assert.equal(g.state.wood, 8);
  }
});

test('only a single front-facing target is hit; nearby enemy takes precedence over a pile', () => {
  const g = begun(); quiet(g); const tree = g.state.trees[0], enemy = g.state.enemies[0];
  g.state.player.x = 550; enemy.x = 600;
  strike(g); assert.equal(enemy.hp, 4); assert.equal(tree.hp, 6);
  enemy.x = 500; g.state.player.x = 540; g.state.player.facing = -1;
  strike(g); assert.equal(enemy.hp, 2); assert.equal(tree.hp, 6);
  enemy.x = 700; g.state.player.x = 550; g.state.player.facing = -1;
  strike(g); assert.equal(tree.hp, 6); assert.equal(enemy.hp, 2);
});

test('sword has higher monster damage and shorter cooldown than axe at each tier', () => {
  for (const stone of [false, true]) {
    const damage = [];
    for (const tool of ['sword', 'axe']) {
      const g = begun(); quiet(g); g.equip(tool); g.state.upgrades.stoneSword = stone; g.state.upgrades.stoneAxe = stone;
      const enemy = g.state.enemies.at(-1); enemy.x = 750; g.state.player.x = 700;
      strike(g); damage.push(enemy.maxHp - enemy.hp);
    }
    assert.ok(damage[0] > damage[1]);
    const prefix = stone ? 'stone' : 'wood'; assert.ok(BALANCE.weapons[prefix + 'Sword'].cooldown < BALANCE.weapons[prefix + 'Axe'].cooldown);
  }
});

test('stone extraction and platform rewards require physical collection; no ground pickup or duplication', () => {
  const g = begun(); quiet(g); g.equip('axe'); g.state.upgrades.stoneAxe = true;
  const rock = g.state.rocks[0]; g.state.player.x = rock.x - 45;
  strike(g); assert.equal(rock.hp, 3); strike(g); assert.equal(rock.depleted, true); assert.equal(g.state.stone, 6);
  strike(g); assert.equal(g.state.stone, 6);
  for (const platform of g.state.platforms) {
    g.state.player.x = platform.x + 48; g.state.player.y = 500; g.state.player.hp = 3;
    const before = g.state.stone; tick(g, .2); assert.equal(g.state.stone, before);
    g.jump(); tick(g, .7); assert.equal(g.state.player.y, 390); assert.equal(g.state.stone, before + 3);
    tick(g, .3, { right: true }); assert.equal(g.state.player.hp, 4);
    tick(g, .2); assert.equal(g.state.stone, before + 3); assert.equal(g.state.player.hp, 4);
  }
  assert.equal(g.state.platformRewards.filter(r => r.collected).length, 4);
});

test('workbench opens on input edge, crafting checks location, cost, prerequisite and duplicate ownership', () => {
  const g = begun(); quiet(g); g.state.wood = 50; g.state.stone = 18;
  assert.equal(g.craft('stoneSword'), false); assert.equal(g.craft('__proto__'), false);
  g.state.player.x = 1450;
  g.update(1 / 60, { interact: true }); tick(g, .1, { interact: true });
  assert.equal(g.state.events.filter(e => e.type === 'workbench').length, 1); assert.equal(g.state.wood, 50);
  assert.equal(g.craft('stoneArmor'), false); assert.equal(g.state.stone, 18);
  assert.equal(g.craft('stoneSword'), true); assert.equal(g.state.wood, 44); assert.equal(g.state.stone, 12);
  assert.equal(g.state.crafted, true); assert.equal(g.getWeapon().name, '石剑');
  assert.equal(g.craft('stoneSword'), false); assert.equal(g.state.wood, 44);
  for (const id of ['stoneAxe', 'woodArmor', 'stoneArmor']) assert.equal(g.craft(id), true);
  assert.equal(g.state.stone, 0); assert.equal(g.state.wood, 26); assert.ok(g.getRecipes().every(r => r.owned && !r.available));
  const poor = begun(); poor.state.player.x = 1450; assert.equal(poor.craft('stoneSword'), false); assert.equal(poor.state.wood, 0);
});

test('armor reduces real contact and projectile damage; hurt cancels wind-up; rescue preserves progress', () => {
  for (const [armor, expected] of [[null, 4.4], ['woodArmor', 4.49], ['stoneArmor', 4.61]]) {
    const g = begun(); quiet(g); if (armor) g.state.upgrades[armor] = true;
    const enemy = g.state.enemies[0]; enemy.x = 800; enemy.hitTimer = 0; g.state.player.x = 800;
    g.attack(); g.update(1 / 60); assert.equal(g.state.player.hp, expected); assert.equal(g.state.player.action, 'hurt');
    tick(g, .25); assert.equal(enemy.hp, 6); assert.equal(g.state.player.hp, expected);
    g.state.wood = 8; g.state.player.hp = .1; g.state.player.invulnerable = 0;
    enemy.x = g.state.player.x; g.update(1 / 60);
    assert.equal(g.state.player.hp, 5); assert.equal(g.state.player.x, 180); assert.equal(g.state.wood, 8);
  }
  const projectile = begun(); quiet(projectile); projectile.state.upgrades.stoneArmor = true;
  projectile.state.projectiles.push({ x: 180, y: 470, vx: 0, vy: 0, life: 1, damage: .7 }); projectile.update(1 / 60);
  assert.equal(projectile.state.player.hp, 4.545);
});

test('hopper visibly leaps without aggro, moves in air, pauses on ground, and spore fires', () => {
  const g = begun(); const hopper = g.state.enemies.find(e => e.type === 'hopper');
  const x = hopper.x; assert.ok(Math.abs(hopper.x - g.state.player.x) > 420);
  tick(g, .2); assert.equal(hopper.x, x); assert.equal(hopper.y, 500); assert.equal(hopper.action, 'crouch');
  tick(g, .45); assert.ok(hopper.y < 500); assert.notEqual(hopper.x, x); assert.equal(hopper.action, 'jump');
  let landed = false;
  for (let i = 0; i < 60; i++) { g.update(1 / 60); if (hopper.action === 'land') { landed = true; break; } }
  assert.ok(landed); const landingX = hopper.x; tick(g, .15); assert.equal(hopper.x, landingX);
  const spore = g.state.enemies.find(e => e.type === 'spore'); g.state.player.x = spore.x - 350; spore.shotTimer = .01;
  g.update(1 / 60); assert.equal(g.state.projectiles.length, 1); assert.ok(spore.vx !== 0);
});

test('complete resource economy affords all upgrades plus twelve home wood, boss and saved completion', () => {
  const g = begun(); quiet(g); g.equip('axe');
  for (const tree of g.state.trees) { g.state.player.x = tree.x - 40; g.state.player.facing = 1; for (let hit = 0; hit < 3; hit++) strike(g); }
  assert.equal(g.state.wood, 56);
  for (const rock of g.state.rocks) { g.state.player.x = rock.x - 40; for (let hit = 0; hit < 3; hit++) strike(g); }
  for (const platform of g.state.platforms) { g.state.player.x = platform.x + 48; g.jump(); tick(g, .7); g.state.player.y = 500; }
  assert.equal(g.state.stone, 18);
  g.state.player.x = 1450;
  for (const id of ['stoneSword', 'stoneAxe', 'woodArmor', 'stoneArmor']) assert.equal(g.craft(id), true);
  assert.equal(g.state.wood, 32); assert.equal(g.state.stone, 0); g.equip('sword');
  assert.equal(g.returnHome(), false);
  const boss = g.state.enemies.at(-1); boss.x = 3700;
  for (let hit = 0; hit < 6; hit++) { g.state.player.x = boss.x - 55; g.state.player.y = boss.y; g.state.player.facing = 1; g.state.player.invulnerable = 5; strike(g); }
  assert.equal(boss.alive, false); assert.equal(boss.hp, 0);
  g.state.player.x = boss.x; g.state.player.y = 500; tick(g, .05); assert.equal(g.state.trophy, true);
  assert.equal(g.returnHome(), true); g.interact(); assert.equal(g.state.mode, 'complete');
  const frozen = g.state.player.x; tick(g, 1, { right: true }); assert.equal(g.state.player.x, frozen);
  assert.equal(createGame(g.save()).state.mode, 'complete');
});

test('v2 saves resources, upgrades, partial HP, rewards and drops; v1 migration preserves progress and economy', () => {
  const g = begun(); quiet(g); g.state.wood = 7; g.state.stone = 4; g.state.upgrades.stoneAxe = true; g.equip('axe');
  g.state.player.hp = 3.49; g.state.platformRewards[0].collected = true; g.state.rocks[0].hp = 3;
  g.state.drops.push({ id: 'unclaimed', type: 'stone', x: 2000, y: 480, amount: 6 });
  const restored = createGame(JSON.stringify(g.save()));
  assert.equal(restored.state.wood, 7); assert.equal(restored.state.stone, 4); assert.equal(restored.state.equipment, 'axe');
  assert.equal(restored.state.player.hp, 3.49); assert.equal(restored.state.platformRewards[0].collected, true); assert.equal(restored.state.rocks[0].hp, 3);
  assert.equal(restored.state.drops[0].amount, 6); assert.equal(restored.state.crafted, true);
  const migrated = createGame({ version: 1, wood: 9, crafted: true, trees: [{ id: 'tree-0', hp: 0 }, { id: 'tree-1', hp: 1 }], enemies: [{ id: 'enemy-0', hp: 1 }, { id: 'enemy-6', hp: 0 }], player: { x: 2000, hp: 3 } });
  assert.equal(migrated.state.wood, 14); assert.equal(migrated.state.upgrades.stoneSword, true); assert.equal(migrated.state.trees[0].felled, true); assert.equal(migrated.state.trees[1].hp, 2);
  assert.equal(migrated.state.enemies[0].hp, 3); assert.equal(migrated.state.enemies.at(-1).alive, false); assert.equal(migrated.state.player.x, 2000);
  assert.ok(migrated.state.drops.some(d => d.type === 'trophy')); assert.equal(migrated.save().version, 2);
  assert.equal(createGame(migrated.save()).state.wood, 14); // migration compensation is only once
  for (const bad of [null, 'broken json', [], { version: 3 }, { version: 2, wood: Infinity, stone: -3, player: { x: NaN, hp: -10 }, trees: [null], enemies: [null], drops: [null, { type: 'invalid' }], upgrades: [] }]) {
    const badGame = createGame(bad); assert.ok(Number.isFinite(badGame.state.player.x)); assert.ok(badGame.state.player.hp > 0); assert.ok(Number.isFinite(badGame.state.wood)); assert.ok(badGame.state.stone >= 0);
  }
});

test('pause freezes animation as well as motion, restart resets upgrades and rewards', () => {
  const g = begun(); g.state.wood = 10; g.state.upgrades.stoneSword = true; g.state.platformRewards[0].collected = true;
  g.attack(); g.togglePause(); const x = g.state.player.x;
  tick(g, 1, { right: true, attack: true }); assert.equal(g.state.player.x, x); assert.equal(g.state.elapsed, 0); assert.equal(g.state.player.actionElapsed, 0);
  g.togglePause(); tick(g, .1, { right: true }); assert.ok(g.state.player.x > x);
  const oldState = g.state; g.restart(); assert.notEqual(g.state, oldState); assert.equal(g.state.mode, 'ready'); assert.equal(g.state.wood, 0);
  assert.equal(g.state.upgrades.stoneSword, false); assert.equal(g.state.platformRewards[0].collected, false);
  g.start(); tick(g, .1, { right: true }); assert.ok(g.state.player.x > 180);
});


test('paused workbench crafts and auto-equips, while an active swing retains its original weapon', () => {
  const g = begun(); quiet(g); g.state.player.x = 1450; g.state.wood = 20; g.state.stone = 20;
  g.attack(); const original = g.state.player.actionWeapon;
  g.togglePause(); assert.equal(g.craft('stoneAxe'), true);
  assert.equal(g.state.equipment, 'axe'); assert.equal(g.state.player.action, 'sword'); assert.equal(g.state.player.actionWeapon, original);
  assert.equal(g.state.player.actionWeapon.name, '木剑');
  g.togglePause(); tick(g, .6); assert.equal(g.attack(), true); assert.equal(g.state.player.action, 'axe'); assert.equal(g.state.player.actionWeapon.name, '石斧');
  g.togglePause(); g.state.player.x = 180; assert.equal(g.craft('stoneSword'), false);
  g.state.player.x = 1450; assert.equal(g.craft('stoneSword'), true); assert.equal(g.state.equipment, 'sword');
});

function bossArena() {
  const g = begun();
  for (const enemy of g.state.enemies) if (enemy.type !== 'boss') enemy.alive = false;
  const boss = g.state.enemies.at(-1); g.state.player.x = 3500; boss.skillTimer = 0;
  return { g, boss };
}

test('king telegraphs at a locked point, jumps, and only landing emits two ground waves', () => {
  const { g, boss } = bossArena();
  g.update(1 / 60); assert.equal(boss.skillPhase, 'windup'); const origin = boss.x;
  tick(g, .8); assert.equal(boss.x, origin); assert.equal(boss.y, 500); assert.equal(g.state.shockwaves.length, 0); assert.equal(g.state.player.hp, 5);
  tick(g, .15); assert.equal(boss.skillPhase, 'air'); assert.ok(boss.y < 500); assert.equal(g.state.shockwaves.length, 0);
  tick(g, .5); assert.equal(boss.skillPhase, 'recovery'); assert.equal(g.state.shockwaves.length, 2);
  assert.deepEqual(g.state.shockwaves.map(w => w.vx), [-200, 200]); assert.ok(g.state.shockwaves.every(w => w.damage === 1.2));
  assert.equal(boss.x, origin);
});

test('king waves hurt grounded players, can be jumped, respect armor and invulnerability', () => {
  for (const [jumping, armor, expected] of [[false, null, 3.8], [true, null, 5], [false, 'stoneArmor', 4.22]]) {
    const { g, boss } = bossArena();
    if (armor) g.state.upgrades[armor] = true;
    tick(g, 1.45); assert.equal(boss.skillPhase, 'recovery');
    g.state.player.x = boss.x - 70;
    if (jumping) g.jump();
    tick(g, .4); assert.equal(g.state.player.hp, expected);
    if (!jumping) {
      g.state.shockwaves.push({ x: g.state.player.x, y: 500, vx: 0, life: 1, damage: 1.2 });
      g.update(1 / 60); assert.equal(g.state.player.hp, expected);
    }
  }
});

test('pause freezes king telegraph and waves; reload resets transient skill; rescue and victory clear waves', () => {
  const { g, boss } = bossArena(); g.update(1 / 60);
  const timer = boss.skillTimer; g.togglePause(); tick(g, 1); assert.equal(boss.skillTimer, timer);
  g.togglePause(); tick(g, 1.45); assert.equal(g.state.shockwaves.length, 2);
  const before = JSON.stringify(g.state.shockwaves); g.togglePause(); tick(g, 1); assert.equal(JSON.stringify(g.state.shockwaves), before);
  const restored = createGame(g.save()); assert.equal(restored.state.shockwaves.length, 0); assert.equal(restored.state.enemies.at(-1).skillPhase, 'idle');
  g.togglePause(); g.state.player.hp = .1;
  g.state.shockwaves.push({ x: g.state.player.x, y: 500, vx: 0, life: 1, damage: 1.2 });
  g.update(1 / 60); assert.equal(g.state.player.x, 180); assert.equal(g.state.shockwaves.length, 0); assert.equal(boss.skillPhase, 'idle');
  boss.hp = 1; boss.hitTimer = 100; g.state.player.x = boss.x - 70; g.state.player.facing = 1;
  g.state.shockwaves.push({ x: 4000, y: 500, vx: 0, life: 1, damage: 1.2 });
  g.attack(); tick(g, .25); assert.equal(boss.alive, false); assert.equal(g.state.shockwaves.length, 0);
});

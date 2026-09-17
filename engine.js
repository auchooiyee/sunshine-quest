import { BALANCE } from './balance.js';
/** Framework-free, deterministic simulation. Positions are world pixels, time is seconds. */
export function createGame(saved) {
  const WORLD = 4200, GROUND = 500;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const number = (v, fallback, min = 0, max = 1e6) => typeof v === 'number' && Number.isFinite(v) ? clamp(v, min, max) : fallback;
  let sequence = 0, previous = {}, state;
  function fresh() {
    return {
      mode: 'ready', worldWidth: WORLD, groundY: GROUND,
      player: { x: 180, y: GROUND, vx: 0, vy: 0, facing: 1, hp: 5, maxHp: 5, invulnerable: 0, attackTimer: 0, onGround: true, action: 'idle', actionElapsed: 0, actionDuration: 0, actionFacing: 1, actionHit: false, actionWeapon: null },
      wood: 0, stone: 0, equipment: 'sword', upgrades: { stoneSword: false, stoneAxe: false, woodArmor: false, stoneArmor: false },
      defeated: 0, crafted: false, trophy: false, elapsed: 0,
      trees: [600, 950, 1300, 1900, 2350, 2800, 3300].map((x, i) => ({ id: `tree-${i}`, x, y: GROUND, hp: BALANCE.resources.hp, maxHp: BALANCE.resources.hp, felled: false, hitTimer: 0 })),
      rocks: [1050, 3000].map((x, i) => ({ id: `rock-${i}`, x, y: GROUND, hp: BALANCE.resources.hp, maxHp: BALANCE.resources.hp, depleted: false, hitTimer: 0 })),
      enemies: [ ['red', 820], ['hopper', 1180], ['spore', 1730], ['red', 2200], ['hopper', 2510], ['spore', 3110], ['boss', 3700] ].map(([type, x], i) => ({ id: `enemy-${i}`, type, x, y: GROUND, homeX: x, hp: BALANCE.enemies[type].hp, maxHp: BALANCE.enemies[type].hp, alive: true, hitTimer: 0, phase: i * .7, facing: -1, vx: 0, vy: 0, action: 'idle', landTimer: 0, shotTimer: 1.8 + i * .1, skillPhase: 'idle', skillTimer: BALANCE.enemies.boss.stomp.cycle, skillOriginX: x, hopTimer: .4 + (i % 3) * .18 })),
      platforms: [{ x: 1800, y: 390, w: 180 }, { x: 2600, y: 390, w: 160 }],
      platformRewards: [1800, 2600].flatMap((x, i) => [
        { id: `platform-${i}-stone`, x: x + 48, y: 370, type: 'stone', amount: 3, collected: false },
        { id: `platform-${i}-heart`, x: x + 120, y: 370, type: 'heart', amount: 1, collected: false }
      ]),
      drops: [], particles: [], projectiles: [], shockwaves: [], events: []
    };
  }
  function emit(text) { state.events.push({ type: 'toast', text }); }
  function sound(name) { state.events.push({ type: 'sound', name }); }
  function restore(data) {
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { return; } }
    if (!data || ![1, 2].includes(data.version) || typeof data !== 'object') return;
    const legacy = data.version === 1;
    state.wood = Math.floor(number(data.wood, 0, 0, 999));
    state.stone = Math.floor(number(data.stone, 0, 0, 999));
    for (const id of Object.keys(state.upgrades)) state.upgrades[id] = data.upgrades?.[id] === true;
    if (legacy && data.crafted === true) state.upgrades.stoneSword = true;
    if (state.upgrades.stoneArmor) state.upgrades.woodArmor = true;
    state.crafted = state.upgrades.stoneSword || state.upgrades.stoneAxe;
    state.equipment = data.equipment === 'axe' ? 'axe' : 'sword';
    state.elapsed = number(data.elapsed, 0, 0, 86400);
    for (const tree of state.trees) {
      const entry = Array.isArray(data.trees) && data.trees.find(t => t && t.id === tree.id);
      if (entry) { tree.hp = number(entry.hp, legacy ? 3 : tree.maxHp, 0, legacy ? 3 : tree.maxHp) * (legacy ? 2 : 1); tree.felled = tree.hp === 0; }
    }
    for (const rock of state.rocks) {
      const entry = Array.isArray(data.rocks) && data.rocks.find(r => r && r.id === rock.id);
      if (entry) { rock.hp = number(entry.hp, rock.maxHp, 0, rock.maxHp); rock.depleted = rock.hp === 0; }
    }
    for (const enemy of state.enemies) {
      const entry = Array.isArray(data.enemies) && data.enemies.find(e => e && e.id === enemy.id);
      const oldMax = enemy.type === 'boss' ? 12 : enemy.type === 'spore' ? 3 : 2;
      if (entry) { enemy.hp = number(entry.hp, legacy ? oldMax : enemy.maxHp, 0, legacy ? oldMax : enemy.maxHp) * (legacy ? enemy.maxHp / oldMax : 1); enemy.alive = enemy.hp > 0; }
    }
    for (const reward of state.platformRewards) {
      reward.collected = Array.isArray(data.platformRewards) && data.platformRewards.some(r => r && r.id === reward.id && r.collected === true);
    }
    state.defeated = state.enemies.filter(e => !e.alive).length;
    state.trophy = data.trophy === true && !state.enemies.at(-1).alive;
    if (Array.isArray(data.drops)) {
      state.drops = data.drops.slice(0, 100).filter(d => d && ['wood', 'stone', 'heart', 'trophy'].includes(d.type)).map(d => ({ id: `drop-${sequence++}`, type: d.type, amount: Math.floor(number(d.amount, 1, 1, 99)), x: number(d.x, 180, 25, WORLD - 25), y: number(d.y, GROUND - 20, 20, GROUND) }));
    }
    // A v1 felled pile paid 3 wood; top it up to the new yield so migrated saves can afford upgrades.
    if (legacy) state.wood = Math.min(999, state.wood + state.trees.filter(t => t.felled).length * (BALANCE.resources.wood - 3));
    if (!state.enemies.at(-1).alive && !state.trophy && !state.drops.some(d => d.type === 'trophy')) drop('trophy', 3700);
    if (data.player && typeof data.player === 'object') {
      state.player.x = number(data.player.x, 180, 35, WORLD - 35);
      state.player.hp = number(data.player.hp, 5, .05, 5);
      // Restore on the ground; floating coordinates from a mid-jump save are deliberately not trusted.
    }
    if (data.completed === true && state.trophy && state.wood >= BALANCE.goalWood) state.mode = 'complete';
  }
  function drop(type, x, amount = 1) { state.drops.push({ id: `drop-${sequence++}`, type, amount, x: clamp(x, 25, WORLD - 25), y: GROUND - 20 }); }
  function puff(x, y, color, count = 7) {
    for (let i = 0; i < count; i++) state.particles.push({ x, y, vx: Math.cos(i * 2.4) * 75, vy: -70 - (i % 3) * 35, life: .65, maxLife: .65, color });
  }
  function getWeapon() { return BALANCE.weapons[`${state.upgrades[state.equipment === 'sword' ? 'stoneSword' : 'stoneAxe'] ? 'stone' : 'wood'}${state.equipment === 'sword' ? 'Sword' : 'Axe'}`]; }
  function equip(id) {
    if (!['sword', 'axe'].includes(id) || !['ready', 'playing'].includes(state.mode)) return false;
    // Tool changes take effect after the current swing; never change the weapon under an active animation.
    if (['sword', 'axe', 'hurt'].includes(state.player.action)) return false;
    state.equipment = id; return true;
  }
  function atBench() { return Math.abs(state.player.x - 1450) < 150 && Math.abs(state.player.y - GROUND) < 70; }
  function getRecipes() {
    return Object.entries(BALANCE.recipes).map(([id, recipe]) => ({ id, ...recipe, owned: state.upgrades[id], available: !state.upgrades[id] && (!recipe.requires || state.upgrades[recipe.requires]) && state.wood >= recipe.wood && state.stone >= recipe.stone, atBench: atBench() }));
  }
  function craft(id) {
    if (!Object.hasOwn(BALANCE.recipes, id) || !['playing', 'paused'].includes(state.mode) || !atBench()) return false;
    const recipe = BALANCE.recipes[id];
    if (state.upgrades[id]) { emit(`${recipe.name}已经做好啦。`); return false; }
    if (recipe.requires && !state.upgrades[recipe.requires]) { emit('先做好木护甲，才能升级石护甲。'); return false; }
    if (state.wood < recipe.wood || state.stone < recipe.stone) { emit(`还需要材料：木头 ${recipe.wood}、石头 ${recipe.stone}。`); return false; }
    state.wood -= recipe.wood; state.stone -= recipe.stone; state.upgrades[id] = true;
    if (id === 'stoneSword') state.equipment = 'sword';
    if (id === 'stoneAxe') state.equipment = 'axe';
    state.crafted = state.upgrades.stoneSword || state.upgrades.stoneAxe;
    sound('craft'); emit(`${recipe.name}做好啦！${recipe.description}`); return true;
  }
  function start() { if (state.mode === 'ready') { state.mode = 'playing'; emit('收集 12 块木头，找到森林徽章，再回家！斧头采木，剑打蘑菇。'); } }
  function togglePause() { if (state.mode === 'playing') state.mode = 'paused'; else if (state.mode === 'paused') state.mode = 'playing'; previous = {}; }
  function jump() {
    const p = state.player;
    if (state.mode !== 'playing' || !p.onGround) return false;
    p.vy = -600; p.onGround = false; sound('jump'); return true;
  }
  function hurt(damage = .6) {
    const p = state.player;
    if (p.invulnerable > 0) return;
    const reduction = state.upgrades.stoneArmor ? BALANCE.armor.stoneArmor : state.upgrades.woodArmor ? BALANCE.armor.woodArmor : 0;
    p.hp = Math.max(0, Math.round((p.hp - damage * (1 - reduction)) * 1000) / 1000);
    p.invulnerable = 1.4; p.action = 'hurt'; p.actionElapsed = 0; p.actionDuration = .32; p.actionHit = true;
    sound('hurt'); puff(p.x, p.y - 30, '#f2b77c');
    if (p.hp <= 0) {
      Object.assign(p, { hp: p.maxHp, x: 180, y: GROUND, vx: 0, vy: 0, onGround: true, action: 'idle', actionElapsed: 0, actionDuration: 0 });
      state.projectiles.length = 0; state.shockwaves.length = 0;
      for (const e of state.enemies) if (e.type === 'boss') { e.skillPhase = 'idle'; e.skillTimer = BALANCE.enemies.boss.stomp.cycle; e.y = GROUND; e.vy = 0; }
      emit('小狗把你接回家啦！休息好了，材料和冒险进度都还在。');
    }
  }
  function attack() {
    const p = state.player;
    if (state.mode !== 'playing' || p.attackTimer > 0 || p.action === 'hurt') return false;
    const weapon = getWeapon();
    p.attackTimer = weapon.cooldown; p.action = weapon.tool; p.actionElapsed = 0; p.actionDuration = weapon.duration;
    p.actionFacing = p.facing; p.actionHit = false; p.actionWeapon = weapon;
    sound('swing'); return true;
  }
  function resolveHit() {
    const p = state.player, weapon = p.actionWeapon;
    if (!weapon) return;
    const inRange = (o, distance = 112) => Math.abs(o.x - p.x) < distance && (o.x - p.x) * p.actionFacing >= 0 && Math.abs(o.y - p.y) < 85;
    const nearest = list => list.sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const enemy = nearest(state.enemies.filter(e => e.alive && inRange(e, e.type === 'boss' ? 140 : 112)));
    if (enemy) {
      enemy.hp = Math.max(0, enemy.hp - weapon.damage); enemy.hitTimer = .3;
      enemy.x = clamp(enemy.x + p.actionFacing * 24, 360, WORLD - 70); puff(enemy.x, enemy.y - 35, '#f0cd6d'); sound('hit');
      if (enemy.hp === 0) {
        enemy.alive = false; state.defeated++; drop('wood', enemy.x); drop('heart', enemy.x + 25);
        if (enemy.type === 'boss') { state.shockwaves.length = 0; enemy.skillPhase = 'idle'; drop('trophy', enemy.x); emit('大蘑菇让开了小路！快拾起闪亮的森林徽章。'); sound('win'); }
      }
      return;
    }
    const resource = nearest([...state.trees.filter(t => !t.felled), ...state.rocks.filter(r => !r.depleted)].filter(r => inRange(r)));
    if (!resource) return;
    const isRock = resource.id.startsWith('rock-');
    resource.hp = Math.max(0, resource.hp - (isRock ? weapon.rockDamage : weapon.treeDamage)); resource.hitTimer = .28;
    puff(resource.x, resource.y - 45, isRock ? '#afa995' : '#bf8550'); sound('chop');
    if (resource.hp === 0) {
      if (isRock) resource.depleted = true; else resource.felled = true;
      const type = isRock ? 'stone' : 'wood', amount = BALANCE.resources[type];
      drop(type, resource.x, amount); emit(`${isRock ? '石头' : '木块'} +${amount}，靠近就能收进背包！`);
    }
  }
  function interact() {
    if (state.mode === 'ready') { start(); return true; }
    if (state.mode !== 'playing') return false;
    const p = state.player;
    if (p.x < 320) {
      if (state.trophy && state.wood >= BALANCE.goalWood) { state.mode = 'complete'; sound('win'); emit('第一天冒险完成！带着满满的收获回家啦。'); return true; }
      emit(state.trophy ? `再收集 ${BALANCE.goalWood - state.wood} 块木头，就能完成今天的冒险。` : '家的灯一直为你亮着。去森林收集木头和森林徽章吧！'); return false;
    }
    if (atBench()) { state.events.push({ type: 'workbench' }); return true; }
    if (state.trophy && p.x > 3400) return returnHome();
    return false;
  }
  function returnHome() {
    if (state.mode !== 'playing' || !state.trophy) return false;
    Object.assign(state.player, { x: 180, y: GROUND, vx: 0, vy: 0, onGround: true, invulnerable: 1.4, action: 'idle', actionElapsed: 0, actionDuration: 0, actionHit: true });
    state.projectiles.length = 0; state.shockwaves.length = 0;
      for (const e of state.enemies) if (e.type === 'boss') { e.skillPhase = 'idle'; e.skillTimer = BALANCE.enemies.boss.stomp.cycle; e.y = GROUND; e.vy = 0; } emit('到家啦！按 E 把今天的收获放进冒险收藏箱。'); return true;
  }
  function getPrompt() {
    if (state.mode === 'complete') return '今天的冒险圆满完成';
    if (state.mode === 'ready') return '从家门口出发';
    if (state.player.x < 320) return state.trophy && state.wood >= BALANCE.goalWood ? 'E · 带着收获回家' : '向右走，阳光森林在等你';
    if (atBench()) return 'E · 工作台：制作石器和护甲';
    if (state.trophy && state.player.x > 3400) return 'E · 沿着小路回家';
    if (state.trees.some(t => !t.felled && Math.abs(t.x - state.player.x) < 110)) return `J · 采集木块${state.equipment === 'sword' ? '（切换斧头更快）' : ''}`;
    if (state.rocks.some(r => !r.depleted && Math.abs(r.x - state.player.x) < 110)) return 'J · 开采石头';
    if (state.platformRewards.some(r => !r.collected && Math.abs(r.x - state.player.x) < 160)) return '跳上树台，找找上面的石头和爱心';
    return '';
  }
  function collect(item) {
    const amount = item.amount || 1;
    if (item.type === 'wood') state.wood += amount;
    else if (item.type === 'stone') state.stone += amount;
    else if (item.type === 'heart') state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
    else { state.trophy = true; emit('获得森林徽章！可以回家，也可以继续收集木头。'); }
    sound('pickup');
  }
  function update(dt, input = {}) {
    if (state.mode !== 'playing') { previous = { ...input }; return; }
    dt = number(dt, 0, 0, .1);
    if (input.jump && !previous.jump) jump();
    if (input.interact && !previous.interact) interact();
    if (input.equipment && input.equipment !== previous.equipment) equip(input.equipment);
    if (state.mode !== 'playing') { previous = { ...input }; return; }
    const p = state.player;
    const steps = Math.max(1, Math.ceil(dt / (1 / 60))), step = dt / steps;
    for (let s = 0; s < steps; s++) {
      state.elapsed += step;
      p.invulnerable = Math.max(0, p.invulnerable - step); p.attackTimer = Math.max(0, p.attackTimer - step);
      let swinging = ['sword', 'axe'].includes(p.action);
      p.vx = ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 245 * (swinging ? .42 : p.action === 'hurt' ? .3 : 1);
      if (p.vx && !swinging) p.facing = Math.sign(p.vx);
      p.x = clamp(p.x + p.vx * step, 35, WORLD - 35);
      const oldY = p.y; p.vy += 1400 * step; p.y += p.vy * step; p.onGround = false;
      let floor = GROUND;
      for (const platform of state.platforms) if (p.x > platform.x - 14 && p.x < platform.x + platform.w + 14 && oldY <= platform.y + 1 && p.y >= platform.y && p.vy >= 0) floor = Math.min(floor, platform.y);
      if (p.y >= floor) { p.y = floor; p.vy = 0; p.onGround = true; }
      if (input.attack) attack();
      swinging = ['sword', 'axe'].includes(p.action);
      if (swinging || p.action === 'hurt') {
        p.actionElapsed += step;
        if (swinging && !p.actionHit && p.actionElapsed + 1e-9 >= p.actionWeapon.hitAt) { p.actionHit = true; resolveHit(); }
        if (p.actionElapsed + 1e-9 >= p.actionDuration) p.action = !p.onGround ? 'jump' : p.vx ? 'walk' : 'idle';
      } else { p.action = !p.onGround ? 'jump' : p.vx ? 'walk' : 'idle'; p.actionElapsed += step; }
      for (const resource of [...state.trees, ...state.rocks]) resource.hitTimer = Math.max(0, resource.hitTimer - step);
      for (const enemy of state.enemies) {
        if (!enemy.alive) { enemy.vx = 0; continue; }
        enemy.phase += step; enemy.hitTimer = Math.max(0, enemy.hitTimer - step); enemy.landTimer = Math.max(0, enemy.landTimer - step);
        const dx = p.x - enemy.x, distance = Math.abs(dx), active = distance < (enemy.type === 'boss' ? 540 : 420) && p.x > 380;
        if (active) enemy.facing = dx < 0 ? -1 : 1;
        enemy.vx = 0;
        if (enemy.type === 'boss') {
          const skill = BALANCE.enemies.boss.stomp;
          // Wind-up locks the landing point; committed attacks complete even if the player retreats.
          if (enemy.skillPhase === 'idle') {
            if (active && enemy.hitTimer === 0) {
              enemy.skillTimer -= step;
              if (enemy.skillTimer <= 0) {
                enemy.skillPhase = 'windup'; enemy.skillTimer = skill.windup; enemy.skillOriginX = enemy.x;
                emit('蘑菇国王正在蓄力！落地时跳起，躲开地面的冲击波！');
              } else if (distance > 68) enemy.vx = enemy.facing * 49;
            }
          } else if (enemy.skillPhase === 'windup') {
            enemy.x = enemy.skillOriginX; enemy.skillTimer -= step;
            if (enemy.skillTimer <= 0) { enemy.skillPhase = 'air'; enemy.vy = -skill.jumpSpeed; enemy.skillTimer = 0; }
          } else if (enemy.skillPhase === 'air') {
            enemy.x = enemy.skillOriginX;
          } else if (enemy.skillPhase === 'recovery') {
            enemy.skillTimer -= step;
            if (enemy.skillTimer <= 0) { enemy.skillPhase = 'idle'; enemy.skillTimer = skill.cycle - skill.windup - 2 * skill.jumpSpeed / 1400 - skill.recovery; }
          }
        } else if (enemy.type === 'hopper') {
          // Hoppers visibly leap even before aggro: crouch, airborne travel, squash on landing.
          if (enemy.y >= GROUND) {
            enemy.hopTimer -= step; enemy.action = 'crouch';
            if (enemy.hopTimer <= 0 && enemy.hitTimer === 0) {
              if (!active && Math.abs(enemy.x - enemy.homeX) > 100) enemy.facing = enemy.x < enemy.homeX ? 1 : -1;
              enemy.vy = -410; enemy.hopTimer = .38; enemy.action = 'jump';
            }
          }
          if (enemy.y < GROUND || enemy.vy < 0) { enemy.action = 'jump'; if (enemy.hitTimer === 0) enemy.vx = enemy.facing * (active ? 130 : 75); }
        } else if (enemy.hitTimer === 0 && active) {
          if (enemy.type === 'spore') {
            enemy.shotTimer -= step;
            if (distance < 160) enemy.vx = -enemy.facing * 28;
            else if (distance > 310) enemy.vx = enemy.facing * 22;
            if (enemy.shotTimer <= 0) {
              const mouthX = enemy.x + enemy.facing * 27, mouthY = enemy.y - 29;
              const aimX = p.x - mouthX, aimY = p.y - 30 - mouthY, length = Math.hypot(aimX, aimY) || 1;
              state.projectiles.push({ x: mouthX, y: mouthY, vx: aimX / length * 185, vy: aimY / length * 185, life: 3.4, damage: BALANCE.enemies.spore.damage }); enemy.shotTimer = 2.4;
            }
          } else if (distance > (enemy.type === 'boss' ? 68 : 42)) enemy.vx = enemy.facing * (enemy.type === 'boss' ? 49 : 57);
        }
        enemy.x = clamp(enemy.x + enemy.vx * step, 380, WORLD - 65);
        const wasAirborne = enemy.y < GROUND;
        enemy.vy += 1400 * step; enemy.y = Math.min(GROUND, enemy.y + enemy.vy * step);
        if (enemy.y === GROUND) { enemy.vy = 0; if (wasAirborne) { enemy.landTimer = .16; enemy.vx = 0; } }
        if (enemy.type === 'boss' && enemy.skillPhase === 'air' && wasAirborne && enemy.y === GROUND) {
          const skill = BALANCE.enemies.boss.stomp;
          enemy.skillPhase = 'recovery'; enemy.skillTimer = skill.recovery;
          emit('冲击波来了！跳起来躲开。');
          for (const direction of [-1, 1]) state.shockwaves.push({ x: enemy.x, y: GROUND, vx: direction * skill.speed, life: skill.life, damage: skill.damage });
          puff(enemy.x, GROUND - 8, '#e8c579', 16); sound('chop');
        }
        if (enemy.type === 'boss' && enemy.skillPhase === 'windup') enemy.action = 'crouch';
        else if (enemy.hitTimer > 0) enemy.action = 'hurt';
        else if (enemy.landTimer > 0) enemy.action = 'land';
        else if (enemy.type !== 'hopper') enemy.action = enemy.y < GROUND ? 'jump' : enemy.vx ? 'walk' : 'idle';
        if (enemy.hitTimer === 0 && Math.abs(enemy.x - p.x) < (enemy.type === 'boss' ? 62 : 37) && Math.abs(enemy.y - p.y) < (enemy.type === 'boss' ? 80 : 53)) hurt(BALANCE.enemies[enemy.type].damage);
      }
      for (let i = state.shockwaves.length - 1; i >= 0; i--) {
        const wave = state.shockwaves[i]; if (!wave) continue;
        wave.x += wave.vx * step; wave.life -= step;
        if (wave.life <= 0 || wave.x < 0 || wave.x > WORLD) { state.shockwaves.splice(i, 1); continue; }
        if (Math.abs(wave.x - p.x) < 32 && p.y > GROUND - 28) { state.shockwaves.splice(i, 1); hurt(wave.damage); }
      }
      for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const shot = state.projectiles[i]; if (!shot) continue;
        shot.x += shot.vx * step; shot.y += shot.vy * step; shot.life -= step;
        if (Math.hypot(shot.x - p.x, shot.y - (p.y - 30)) < 29) { state.projectiles.splice(i, 1); hurt(shot.damage || BALANCE.enemies.spore.damage); }
        else if (shot.life <= 0 || shot.x < 0 || shot.x > WORLD || shot.y > GROUND) state.projectiles.splice(i, 1);
      }
      for (let i = state.drops.length - 1; i >= 0; i--) {
        const item = state.drops[i];
        if (Math.abs(item.x - p.x) > 74 || Math.abs(item.y - (p.y - 20)) > 65) continue;
        collect(item); state.drops.splice(i, 1);
      }
      for (const item of state.platformRewards) {
        if (item.collected || Math.abs(item.x - p.x) > 35 || Math.abs(item.y - (p.y - 20)) > 32) continue;
        item.collected = true; collect(item); emit(item.type === 'stone' ? '树台上的石头 +3！可以带去工作台。' : '找到一颗爱心，补充体力！');
      }
      for (let i = state.particles.length - 1; i >= 0; i--) { const part = state.particles[i]; part.life -= step; part.x += part.vx * step; part.y += part.vy * step; part.vy += 200 * step; if (part.life <= 0) state.particles.splice(i, 1); }
    }
    previous = { ...input };
  }
  function save() {
    return { version: 2, player: { x: state.player.x, hp: state.player.hp }, wood: state.wood, stone: state.stone, equipment: state.equipment, upgrades: { ...state.upgrades }, crafted: state.crafted, trophy: state.trophy, elapsed: state.elapsed, completed: state.mode === 'complete', trees: state.trees.map(({ id, hp }) => ({ id, hp })), rocks: state.rocks.map(({ id, hp }) => ({ id, hp })), enemies: state.enemies.map(({ id, hp }) => ({ id, hp })), platformRewards: state.platformRewards.map(({ id, collected }) => ({ id, collected })), drops: state.drops.map(({ type, x, y, amount }) => ({ type, x, y, amount })) };
  }
  function restart() { state = fresh(); previous = {}; sequence = 0; }
  state = fresh(); restore(saved);
  return { get state() { return state; }, start, update, attack, interact, jump, restart, save, getPrompt, togglePause, returnHome, getWeapon, getRecipes, craft, equip };
}

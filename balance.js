export const WEAPON_TIERS = Object.freeze({
  sword: ['woodSword', 'stoneSword', 'reinforcedSword', 'crystalSword'],
  axe: ['woodAxe', 'stoneAxe', 'reinforcedAxe', 'crystalAxe'],
});
/** Axe for gathering, sword for combat; costs and progression live here. */
export const BALANCE = Object.freeze({
  weapons: {
    woodSword: { level: 1, name: '木剑', tool: 'sword', damage: 2, cooldown: .55, duration: .43, hitAt: .18, treeDamage: 1, rockDamage: 1 },
    woodAxe: { level: 1, name: '木斧', tool: 'axe', damage: 1, cooldown: .75, duration: .55, hitAt: .22, treeDamage: 2, rockDamage: 2 },
    stoneSword: { level: 2, name: '石剑', tool: 'sword', damage: 5, cooldown: .5, duration: .4, hitAt: .17, treeDamage: 1, rockDamage: 1 },
    stoneAxe: { level: 2, name: '石斧', tool: 'axe', damage: 2, cooldown: .65, duration: .5, hitAt: .2, treeDamage: 6, rockDamage: 3 },
    reinforcedSword: { level: 3, name: '强化剑', tool: 'sword', damage: 7, cooldown: .44, duration: .35, hitAt: .14, treeDamage: 1, rockDamage: 1 },
    crystalSword: { level: 4, name: '晶石剑', tool: 'sword', damage: 9, cooldown: .38, duration: .3, hitAt: .12, treeDamage: 1, rockDamage: 1 },
    reinforcedAxe: { level: 3, name: '强化斧', tool: 'axe', damage: 3, cooldown: .56, duration: .44, hitAt: .17, treeDamage: 6, rockDamage: 4 },
    crystalAxe: { level: 4, name: '晶石斧', tool: 'axe', damage: 4, cooldown: .46, duration: .36, hitAt: .14, treeDamage: 6, rockDamage: 6 }
  },
  recipes: {
    stoneSword: { name: '石剑', wood: 6, stone: 6, description: '攻击 5 · 挥剑更快，适合打怪' },
    stoneAxe: { name: '石斧', wood: 4, stone: 4, description: '木堆一斧采完 · 挖石更快' },
    reinforcedSword: { name: '强化剑', wood: 8, stone: 4, requires: 'stoneSword', description: '攻击 7 · 更快出剑' },
    crystalSword: { name: '晶石剑', wood: 10, stone: 6, requires: 'reinforcedSword', description: '攻击 9 · 晶石剑光' },
    reinforcedAxe: { name: '强化斧', wood: 6, stone: 3, requires: 'stoneAxe', description: '采矿 4 · 更快采集' },
    crystalAxe: { name: '晶石斧', wood: 8, stone: 4, requires: 'reinforcedAxe', description: '矿石一斧采完 · 晶石斧光' },
    woodArmor: { name: '木护甲', wood: 8, stone: 0, description: '受到的伤害减少 15%' },
    stoneArmor: { name: '石护甲', wood: 6, stone: 8, requires: 'woodArmor', description: '受到的伤害减少 35% · 需要木护甲' }
  },
  armor: { woodArmor: .15, stoneArmor: .35 },
  enemies: {
    slime: { name: '苔藓史莱姆', hp: 6, damage: .5 },
    beetle: { name: '琥珀甲虫', hp: 6, damage: .8 },
    wisp: { name: '湖光幽灵', hp: 8, damage: .6 },
    red: { name: '红帽菇', hp: 6, damage: .6, skill: '追赶碰撞', description: '靠近后追赶，碰撞造成 0.6 心伤害。' },
    hopper: { name: '跳跳菇', hp: 6, damage: .6, skill: '跳跃扑撞', description: '蹲下后跳起扑来，碰撞造成 0.6 心伤害。' },
    spore: { name: '喷菇', hp: 8, damage: .7, skill: '孢子喷射', description: '每 2.4 秒瞄准喷出孢子，命中或碰撞造成 0.7 心伤害。' },
    boss: { name: '蘑菇国王', hp: 30, damage: .9, skill: '大地重踏', description: '碰撞 0.9 心；约每 4.5 秒蓄力重踏，双向地波 1.2 心。看到蓄力后跳起躲开地波！', stomp: { cycle: 4.5, windup: .9, jumpSpeed: 350, recovery: .6, damage: 1.2, speed: 200, life: 1.5 } }
  },
  resources: { wood: 8, stone: 6, hp: 6 },
  goalWood: 12
});

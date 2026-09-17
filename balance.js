/** Day 1 scale of Forest Guardian: axe for wood, sword for combat; all tuning lives here. */
export const BALANCE = Object.freeze({
  weapons: {
    woodSword: { name: '木剑', tool: 'sword', damage: 2, cooldown: .55, duration: .43, hitAt: .18, treeDamage: 1, rockDamage: 1 },
    woodAxe: { name: '木斧', tool: 'axe', damage: 1, cooldown: .75, duration: .55, hitAt: .22, treeDamage: 2, rockDamage: 2 },
    stoneSword: { name: '石剑', tool: 'sword', damage: 5, cooldown: .5, duration: .4, hitAt: .17, treeDamage: 1, rockDamage: 1 },
    stoneAxe: { name: '石斧', tool: 'axe', damage: 2, cooldown: .65, duration: .5, hitAt: .2, treeDamage: 6, rockDamage: 3 }
  },
  recipes: {
    stoneSword: { name: '石剑', wood: 6, stone: 6, description: '攻击 5 · 挥剑更快，适合打怪' },
    stoneAxe: { name: '石斧', wood: 4, stone: 4, description: '木堆一斧采完 · 挖石更快' },
    woodArmor: { name: '木护甲', wood: 8, stone: 0, description: '受到的伤害减少 15%' },
    stoneArmor: { name: '石护甲', wood: 6, stone: 8, requires: 'woodArmor', description: '受到的伤害减少 35% · 需要木护甲' }
  },
  armor: { woodArmor: .15, stoneArmor: .35 },
  enemies: {
    red: { name: '红帽菇', hp: 6, damage: .6, skill: '追赶碰撞', description: '靠近后追赶，碰撞造成 0.6 心伤害。' },
    hopper: { name: '跳跳菇', hp: 6, damage: .6, skill: '跳跃扑撞', description: '蹲下后跳起扑来，碰撞造成 0.6 心伤害。' },
    spore: { name: '喷菇', hp: 8, damage: .7, skill: '孢子喷射', description: '每 2.4 秒瞄准喷出孢子，命中或碰撞造成 0.7 心伤害。' },
    boss: { name: '蘑菇国王', hp: 30, damage: .9, skill: '大地重踏', description: '碰撞 0.9 心；约每 4.5 秒蓄力重踏，双向地波 1.2 心。看到蓄力后跳起躲开地波！', stomp: { cycle: 4.5, windup: .9, jumpSpeed: 350, recovery: .6, damage: 1.2, speed: 200, life: 1.5 } }
  },
  resources: { wood: 8, stone: 6, hp: 6 },
  goalWood: 12
});

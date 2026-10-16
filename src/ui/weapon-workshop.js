import {BALANCE,WEAPON_TIERS} from '../../balance.js';

export function renderWeaponWorkshop({container,game,t,escape,onCraft}){
  container.replaceChildren();
  const recipes=game.getRecipes(),atBench=recipes[0].atBench,active=['playing','paused'].includes(game.state.mode);
  const materialText=(wood,stone)=>`${wood} ${t('wood')} · ${stone} ${t('stone')}`;
  const header=document.createElement('div');header.className='workshop-inventory';
  header.innerHTML=`<div><small>${escape(t('weaponInventory'))}</small><strong>${escape(materialText(game.state.wood,game.state.stone))}</strong></div><span class="workshop-location ${atBench?'ready':''}">${escape(t(!active?'startToUpgrade':atBench?'atWorkshop':'awayWorkshop'))}</span>`;
  container.append(header);
  for(const tool of ['sword','axe']){
    const current=game.getWeapon(tool),path=WEAPON_TIERS[tool],nextId=path[current.level],next=nextId?BALANCE.weapons[nextId]:null;
    const recipe=recipes.find(r=>r.id===nextId),card=document.createElement('section');card.className='weapon-upgrade';card.dataset.tool=tool;card.dataset.level=current.level;
    const title=t(path[current.level-1]+'Name');
    const stats=tool==='sword'?[['weaponDamage','damage'],['weaponCooldown','cooldown']]:[['weaponDamage','damage'],['woodHits','treeDamage'],['stoneHits','rockDamage'],['weaponCooldown','cooldown']];
    const value=(weapon,key)=>['treeDamage','rockDamage'].includes(key)?Math.ceil(BALANCE.resources.hp/weapon[key]):key==='cooldown'?`${weapon[key].toFixed(2)} s`:weapon[key];
    card.innerHTML=`<div class="weapon-card-title"><div class="weapon-emblem" aria-hidden="true"><img src="assets/${tool==='sword'?'stone-sword':'wood-axe'}.png" alt=""></div><div><small>${escape(t(tool))} · Lv.${current.level} / 4</small><h3 tabindex="-1">${escape(title)}</h3></div><span class="weapon-level">Lv.${current.level}</span></div>
      <ol class="weapon-tier-list" aria-label="${escape(t('weaponProgress'))}">${path.map((id,i)=>`<li class="${i<current.level?'unlocked':''} ${i+1===current.level?'current':''}" ${i+1===current.level?'aria-current="step"':''}><b>Lv.${i+1}</b><span>${escape(t(id+'Name'))}</span><small>${i===0?escape(t('weaponOwned')):escape(materialText(BALANCE.recipes[id].wood,BALANCE.recipes[id].stone))}</small></li>`).join('')}</ol>
      <div class="weapon-stats-heading"><span></span><span>${escape(t('weaponCurrent'))}</span><span>${escape(t(next?'weaponNext':'weaponMax'))}</span></div><dl class="weapon-stats">${stats.map(([label,key])=>`<div><dt>${escape(t(label))}</dt><dd>${value(current,key)}</dd><dd>${next?value(next,key):'—'}</dd></div>`).join('')}</dl>`;
    const footer=document.createElement('div');footer.className='weapon-upgrade-action';
    if(recipe){
      const missingWood=Math.max(0,recipe.wood-game.state.wood),missingStone=Math.max(0,recipe.stone-game.state.stone);
      const missing=[missingWood?`${missingWood} ${t('wood')}`:null,missingStone?`${missingStone} ${t('stone')}`:null].filter(Boolean).join(' · ');
      const cost=document.createElement('div');cost.innerHTML=`<strong>${escape(t('weaponCost'))}: ${escape(materialText(recipe.wood,recipe.stone))}</strong><small>${escape(missing?`${t('weaponNeed')}: ${missing}`:t(atBench?'atWorkshop':'awayWorkshop'))}</small>`;
      const button=document.createElement('button');button.className='primary';button.disabled=!recipe.available||!atBench||!active;
      button.textContent=`${t('weaponUpgrade')} Lv.${next.level}`;button.setAttribute('aria-label',`${t('weaponUpgrade')} Lv.${next.level} · ${t(nextId+'Name')}`);button.onclick=()=>onCraft(nextId,tool);footer.append(cost,button);
    }else {const done=document.createElement('strong');done.className='weapon-max';done.textContent=`✦ ${t('weaponMax')}`;footer.append(done);}
    card.append(footer);container.append(card);
  }
  const heading=document.createElement('h3');heading.className='armor-heading';heading.textContent=t('armorSection');container.append(heading);
  for(const recipe of recipes.filter(r=>['woodArmor','stoneArmor'].includes(r.id))){
    const row=document.createElement('div');row.className='recipe';row.innerHTML=`<div><strong>${escape(t(recipe.id==='woodArmor'?'craftArmor':'craftStoneArmor'))}</strong><small>${escape(materialText(recipe.wood,recipe.stone))}${recipe.requires&&!game.state.upgrades[recipe.requires]?` · ${escape(t('armorPrerequisite'))}`:''}</small></div>`;
    const button=document.createElement('button');button.className='outline';button.disabled=recipe.owned||!recipe.available||!atBench||!active;button.textContent=t(recipe.owned?'owned':!atBench?'workshop':recipe.available?'craftButton':'needs');button.onclick=()=>onCraft(recipe.id);row.append(button);container.append(row);
  }
}

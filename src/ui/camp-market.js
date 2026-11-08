import {createCampMarket,MARKET,MARKET_KEY} from '../missions/camp-market.js';

const {model,target}=MARKET;
const labels={food:'marketFood',medical:'marketMedical',lamp:'marketLamp'};
const icons={food:'◆',medical:'✚',lamp:'✦'};
const camp=`<svg id="market-scene" viewBox="0 0 720 202" role="img"><title></title>
  <defs><linearGradient id="market-grass" x2="0" y2="1"><stop stop-color="#9c9663"/><stop offset="1" stop-color="#344b3c"/></linearGradient><radialGradient id="market-glow"><stop stop-color="#ffd881" stop-opacity=".69"/><stop offset="1" stop-color="#ffd881" stop-opacity="0"/></radialGradient></defs>
  <path d="M0 143q73 -20 177 -9t181 -2q183 -24 362 -5v75H0Z" fill="url(#market-grass)"/>
  <path d="M0 181q154 -30 334 -24t386 -11v40q-153 -9 -344 8l-376 8Z" fill="#c1a979" opacity=".57"/>
  <g transform="translate(484 153)"><path d="M-99 2l81 -100 92 100Z" fill="#a87855" stroke="#4c4438" stroke-width="5"/><path d="M-18 -98l92 100h57l-76 -87Z" fill="#715d4b" stroke="#4c4438" stroke-width="4"/><path d="M-18 -88l-35 88h65Z" fill="#4c5143"/><path id="market-tent-light" d="M-14 -69l-26 68h43Z" fill="#ffc779" opacity=".0"/><path d="M-98 2l-32 4m209 -4 20 6" stroke="#c4a76d" stroke-width="2"/></g>
  <g transform="translate(266 154)"><path d="M-59 1v-63m117 63v-63" stroke="#624837" stroke-width="6"/><path d="M-77 -53l18 -31h116l17 31Z" fill="#c39862" stroke="#5e5940" stroke-width="3"/><path d="M-57 -82l-13 28h24l12 -28Zm51 0 -4 28h25l-5 -28Zm47 0 8 28h19L56 -82Z" fill="#e9c18a"/><path d="M-59 -20h117v15H-59Z" fill="#9d744b" stroke="#614737" stroke-width="3"/></g>
  <g id="market-cart" transform="translate(95 170)"><path d="M-35 -18h70l-8 19h-56Z" fill="#b4865c" stroke="#554333" stroke-width="3"/><circle cx="-20" r="7" fill="#534637" stroke="#b5a68d" stroke-width="2"/><circle cx="19" r="7" fill="#534637" stroke="#b5a68d" stroke-width="2"/></g>
  <g id="market-food-props"></g><g id="market-medical-props"></g><g id="market-lamp-props"></g>
  <image id="market-hero" href="assets/hero.png" x="-20" y="-44" width="42" height="46" transform="translate(46 159)"/>
  <path d="M0 202v-31q14 9 18 20 -1 -20 9 -31 9 16 13 34 10 -10 18 -7l5 15z M720 202h-59q8 -14 20 -19l2 11q2 -16 11 -29 8 10 9 22 10 -16 17 -18z" fill="#365445"/>
</svg>`;

export function createMarketUI({t,openDialog,switchLanguage,storage,tone,getPlayerName,onPilot=()=>{}}){
  let game=createCampMarket(),earned=false,returnTo=null,previousPhase;
  try{earned=storage.getItem(MARKET_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='camp-market';dialog.setAttribute('aria-labelledby','market-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="marketEyebrow"></span><h2 id="market-title" tabindex="-1" data-i18n="marketTitle"></h2></div><div class="rescue-head-actions"><button id="market-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="market-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps market-steps">${['Shop','Stock','Light'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="marketStep${step}"></b></li>`).join('')}</ol>
    <p id="market-objective" tabindex="-1" role="status"></p>
    <div class="market-visuals"><div class="market-stage">${camp}<span id="market-player" dir="auto"></span><span class="market-cash" data-i18n="marketBudget"></span></div>
    <div class="market-budget"><div><span data-i18n="marketSpent"></span><strong id="market-spent"></strong></div><div><span data-i18n="marketLeft"></span><strong id="market-remaining"></strong></div><div class="market-meter" aria-hidden="true"><span id="market-meter-spent"></span><i></i></div><small data-i18n="marketReserveTarget"></small></div></div>
    <form id="market-plan"><div class="rescue-tuning market-tuning">${model.items.map(({key,maximum})=>`<label id="market-card-${key}"><span class="market-item"><span class="market-icon ${key}" aria-hidden="true">${icons[key]}</span><span data-i18n="${labels[key]}"></span></span><span id="market-price-${key}" class="market-price"></span><select id="market-quantity-${key}">${Array.from({length:maximum+1},(_,n)=>`<option>${n}</option>`).join('')}</select><small id="market-subtotal-${key}"></small></label>`).join('')}</div>
    <div class="rescue-controls market-actions"><button id="market-check" type="submit" class="primary" data-i18n="marketCheck"></button><button id="market-unpack" type="button" class="primary" hidden data-i18n="marketUnpack"></button></div></form>
    <p id="market-feedback" role="alert" hidden></p><details id="market-hint"><summary data-i18n="rescueHint"></summary><p data-i18n="marketHint"></p></details>
    <p id="market-inventory" hidden></p><button id="market-light" class="primary" hidden data-i18n="marketLight"></button>
    <div id="market-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="marketBadge"></strong></div><div class="rescue-controls"><button id="market-canyon" class="primary" data-i18n="canyonNext"></button><button id="market-map" class="outline" data-i18n="marketMap"></button><button id="market-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const step={plan:0,ready:1,stocked:2,complete:3};
  const phaseText={plan:'marketPlan',ready:'marketReady',stocked:'marketStocked',complete:'marketComplete'};
  const fill=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  const money=n=>n<0?`−RM${-n}`:`RM${n}`;
  const props=(n,draw)=>Array.from({length:n},(_,i)=>draw(i)).join('');
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,basket,spent,remaining,missing,feedback}=game;
    const changed=phase!==previousPhase;previousPhase=phase;dialog.dataset.phase=phase;
    const shopping=phase==='plan'||phase==='ready',unpacked=!shopping,lit=phase==='complete';
    [...dialog.querySelectorAll('.market-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<step[phase]);if(i===step[phase])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('market-player').textContent=getPlayerName();$('market-objective').textContent=t(phaseText[phase]);
    $('market-spent').textContent=money(spent);$('market-remaining').textContent=money(remaining);
    $('market-remaining').classList.toggle('market-deficit',remaining<target.saving);
    $('market-meter-spent').style.width=`${Math.min(100,spent/model.budget*100)}%`;
    $('market-meter-spent').classList.toggle('market-deficit',remaining<target.saving);
    $('market-plan').hidden=!shopping;$('market-check').hidden=phase!=='plan';$('market-unpack').hidden=phase!=='ready';
    $('market-hint').hidden=phase!=='plan';if(changed)$('market-hint').open=false;
    $('market-inventory').hidden=!unpacked;$('market-inventory').textContent=fill('marketInventory',basket);
    $('market-light').hidden=phase!=='stocked';$('market-finish').hidden=!lit;
    for(const {key,price,minimum} of model.items){
      $('market-quantity-'+key).value=String(basket[key]);
      $('market-price-'+key).textContent=`${fill('marketUnit',{price})} · ${fill('marketMin',{min:minimum})}`;
      $('market-subtotal-'+key).textContent=fill('marketSubtotal',{amount:basket[key]*price});
      $('market-card-'+key).classList.toggle('market-missing',feedback==='missing'&&basket[key]<minimum);
    }
    $('market-feedback').hidden=!feedback;
    $('market-feedback').textContent=feedback==='missing'?fill('marketMissing',{items:missing.map(({key,count})=>`${count} × ${t(labels[key])}`).join(', ')}):feedback==='over'?fill('marketOver',{gap:-remaining}):feedback==='reserve'?fill('marketShort',{left:remaining,gap:target.saving-remaining}):'';
    $('market-scene').querySelector('title').textContent=t('marketScene');
    $('market-tent-light').setAttribute('opacity',lit?'.78':'0');
    $('market-hero').setAttribute('transform',`translate(${unpacked?372:46} ${unpacked?154:159})`);
    $('market-cart').style.display=unpacked?'none':'';
    $('market-food-props').innerHTML=props(basket.food,i=>`<g transform="translate(${unpacked?174+i*26:72+i*13} ${unpacked?166:150})"><path d="M-9 0v-15H9V0Z" fill="#b8854b" stroke="#69492f" stroke-width="2"/><path d="M-7 -13 7 -2M-7 -2 7 -13" stroke="#e1ad70" stroke-width="1.8"/></g>`);
    $('market-medical-props').innerHTML=props(basket.medical,i=>`<g transform="translate(${unpacked?536+i*24:85+i*13} ${unpacked?168:134})"><rect x="-9" y="-13" width="18" height="13" rx="2" fill="#c1d3a4" stroke="#50684b" stroke-width="2"/><path d="M-4 -6H4M0 -10v8" stroke="#95514d" stroke-width="2"/></g>`);
    $('market-lamp-props').innerHTML=props(basket.lamp,i=>`<g transform="translate(${unpacked?425+i*74:101+i*12} ${unpacked?132:119})">${lit?'<circle cx="0" cy="-23" r="40" fill="url(#market-glow)"/>':''}<path d="M0 15v-36" stroke="#573d31" stroke-width="3"/><path d="M-8 -20v-10l8 -6 8 6v10Z" fill="${lit?'#ffe1a2':'#87907a'}" stroke="#624c37" stroke-width="2"/></g>`);
    if(focus&&changed)$(phase==='ready'?'market-unpack':phase==='stocked'?'market-light':phase==='complete'?'market-canyon':'market-objective').focus({preventScroll:true});
  }
  for(const {key} of model.items)$('market-quantity-'+key).onchange=()=>{game.choose(key,Number($('market-quantity-'+key).value));render();};
  $('market-plan').onsubmit=event=>{event.preventDefault();const correct=game.check();onPilot('check',{step:'budget',correct});if(correct)tone('pickup');render(true);};
  $('market-unpack').onclick=()=>{if(game.unpack()){tone('craft');render(true);}};
  $('market-light').onclick=()=>{if(!game.light())return;earned=true;try{storage.setItem(MARKET_KEY,'earned');}catch{}onPilot('complete');tone('win');render(true);};
  $('market-replay').onclick=()=>{onPilot('restart');game=createCampMarket();previousPhase=null;render(true);};
  $('market-language').onclick=switchLanguage;$('market-exit').onclick=$('market-map').onclick=()=>dialog.close();
  $('market-canyon').onclick=()=>dialog.close('canyon');
  dialog.addEventListener('close',()=>{const callback=returnTo;returnTo=null;const destination=dialog.returnValue;if(callback)setTimeout(()=>callback(destination),0);});
  return {get earned(){return earned;},render,
    open(onClose){if(!openDialog(dialog))return;returnTo=onClose;dialog.returnValue='';game=createCampMarket();previousPhase=null;render();$('market-title').focus({preventScroll:true});}
  };
}

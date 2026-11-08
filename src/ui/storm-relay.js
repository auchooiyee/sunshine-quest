import {createStormRelay,STORM,STORM_KEY} from '../missions/storm-relay.js';

const routeNames={ridge:'stormRidge',valley:'stormValley'};
const tracks={ridge:'M78 129 C176 127 206 73 302 74 S473 128 626 125',valley:'M78 129 C157 131 177 184 293 181 S448 147 626 125'};
const terrain=`<svg id="storm-scene" viewBox="0 0 720 207" role="img"><title></title>
  <defs><linearGradient id="storm-ground" x2="0" y2="1"><stop stop-color="#739089"/><stop offset="1" stop-color="#2a4b51"/></linearGradient></defs>
  <g stroke="#d2e1e5" stroke-width="1.2" opacity=".32">${Array.from({length:18},(_,i)=>{const x=i*43;const y=26+(i%4)*15;return `<path d="M${x} ${y}l-9 20"/>`;}).join('')}</g>
  <path d="M0 118q109 1 188 -44t173 10q137 65 359 23v100H0Z" fill="url(#storm-ground)"/>
  <path d="M0 182q112 -42 229 -14t235 -17q127 -41 256 -20v76H0Z" fill="#315e60" opacity=".68"/>
  <path d="M0 201q160 -24 238 -8t229 -20 253 -7v41H0Z" fill="#263f48" opacity=".74"/>
  ${Object.entries(tracks).map(([key,d])=>`<g class="storm-track" data-track="${key}"><path d="${d}" stroke="#2c3d43" stroke-width="11" fill="none"/><path id="storm-track-${key}" d="${d}" stroke="#a9baad" stroke-width="5" fill="none"/></g>`).join('')}
  <g transform="translate(645 126)"><path d="M-29 0v-45h57V0Z" fill="#abb18c" stroke="#35474a" stroke-width="4"/><path d="M-39 -43 0 -72l39 29Z" fill="#68765e" stroke="#374e4c" stroke-width="4"/><path d="M-8 0v-29h19V0Z" fill="#34534f"/><rect id="storm-shelter-lamp" x="-24" y="-34" width="12" height="13" rx="2" fill="#788e7c"/></g>
  <g id="storm-crates" transform="translate(598 122)" style="display:none"><path d="M-11 -2v-16h22v16Z M12 -2v-12h17v12Z" fill="#c59658" stroke="#654936" stroke-width="2"/><path d="M-9 -15 9 -4 M14 -12l12 8" stroke="#e4b779" stroke-width="2"/></g>
  <g id="storm-cart" transform="translate(78 129)"><ellipse rx="24" ry="4" cy="3" fill="#152f38" opacity=".55"/><path d="M-25 -20h50l-5 17h-40Z" fill="#b98451" stroke="#573e31" stroke-width="3"/><path d="M-8 -21v-13h18v13Z" fill="#e2b775" stroke="#775439" stroke-width="2"/><circle cx="-13" r="5" fill="#263d3c" stroke="#d0baa1" stroke-width="1.5"/><circle cx="13" r="5" fill="#263d3c" stroke="#d0baa1" stroke-width="1.5"/></g>
  <g fill="#f2ecd0" font-size="16" font-weight="bold" text-anchor="middle"><text x="288" y="57">28 m</text><text x="294" y="166">32 m</text></g>
</svg>`;

export function createStormUI({t,openDialog,switchLanguage,storage,tone,getPlayerName}){
  let game=createStormRelay(),earned=false,returnTo=null,previousPhase,liveTick=-1;
  try{earned=storage.getItem(STORM_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='storm-relay';dialog.setAttribute('aria-labelledby','storm-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="stormEyebrow"></span><h2 id="storm-title" tabindex="-1" data-i18n="stormTitle"></h2></div><div class="rescue-head-actions"><button id="storm-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="storm-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps storm-steps">${['Plan','Run','Finish'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="stormStep${step}"></b></li>`).join('')}</ol>
    <p id="storm-objective" tabindex="-1" role="status"></p>
    <div class="storm-visuals"><div class="storm-stage">${terrain}<span id="storm-player" dir="auto"></span></div><div class="storm-targets"><div id="storm-distance-card"><span data-i18n="stormDistance"></span><strong id="storm-distance"></strong></div><div id="storm-reserve-card"><span data-i18n="stormReserve"></span><strong id="storm-reserve"></strong></div></div></div>
    <form id="storm-plan"><fieldset class="storm-routes"><legend data-i18n="stormRoute"></legend><div>${Object.keys(STORM.routes).map(route=>`<label><input type="radio" name="storm-route" id="storm-route-${route}" value="${route}"><span><b data-i18n="${routeNames[route]}"></b><small id="storm-info-${route}"></small></span></label>`).join('')}</div></fieldset>
    <div class="storm-inputs"><label><span data-i18n="stormTime"></span><select id="storm-time">${STORM.seconds.map(n=>`<option>${n}</option>`).join('')}</select></label><label><span data-i18n="stormSpeed"></span><select id="storm-speed">${STORM.speeds.map(n=>`<option>${n}</option>`).join('')}</select></label><button id="storm-check" class="primary" data-i18n="stormCheck"></button><button id="storm-send" class="primary" type="button" hidden data-i18n="stormSend"></button></div><p class="storm-fixed" data-i18n="stormSecondStage"></p></form>
    <div id="storm-feedback" role="status" hidden><p id="storm-distance-feedback"></p><p id="storm-reserve-feedback"></p></div>
    <details id="storm-details"><summary data-i18n="stormCalculations"></summary><p id="storm-distance-math"></p><p id="storm-cost-math"></p><p data-i18n="stormFee"></p></details><details id="storm-hint"><summary data-i18n="rescueHint"></summary><p data-i18n="stormHint"></p></details>
    <div id="storm-ride" hidden><strong id="storm-live"></strong><button id="storm-skip" class="outline" data-i18n="stormSkip"></button></div><button id="storm-unload" class="primary" hidden data-i18n="stormUnload"></button>
    <div id="storm-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="stormBadge"></strong></div><div class="rescue-controls"><button id="storm-map" class="primary" data-i18n="stormMap"></button><button id="storm-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const lengths={};
  const phaseText={plan:'stormPlan',ready:'stormReady',riding:'stormRiding',arrived:'stormArrived',complete:'stormComplete'};
  const step={plan:0,ready:0,riding:1,arrived:2,complete:3};
  const fill=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  function paintRide(force=false){
    const plan=game.plan;
    const rail=$('storm-track-'+plan.route),length=lengths[plan.route]??=rail.getTotalLength();
    const position=rail.getPointAtLength(length*Math.min(1,game.travelled/plan.distance));
    $('storm-cart').setAttribute('transform',`translate(${position.x} ${position.y})`);
    const tick=Math.floor(game.elapsed*10);
    if(force||liveTick!==tick){liveTick=tick;$('storm-live').textContent=fill('stormLive',{time:game.elapsed.toFixed(1),distance:game.travelled.toFixed(1),target:plan.distance});}
  }
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,plan,checked}=game,changed=phase!==previousPhase;previousPhase=phase;dialog.dataset.phase=phase;
    const planning=phase==='plan'||phase==='ready',done=phase==='complete';
    [...dialog.querySelectorAll('.storm-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<step[phase]);if(i===step[phase])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('storm-player').textContent=getPlayerName();$('storm-objective').textContent=fill(phaseText[phase],{route:t(routeNames[plan.route]),remaining:plan.remaining});
    $('storm-plan').hidden=!planning;$('storm-check').hidden=phase!=='plan';$('storm-send').hidden=phase!=='ready';$('storm-feedback').hidden=!checked||phase!=='plan';$('storm-hint').hidden=phase!=='plan';
    $('storm-ride').hidden=phase!=='riding';$('storm-unload').hidden=phase!=='arrived';$('storm-finish').hidden=!done;
    $('storm-distance').textContent=`${plan.planned} / ${plan.distance} m`;$('storm-reserve').textContent=plan.remaining<0?`−RM${-plan.remaining}`:`RM${plan.remaining}`;
    for(const [id,ok] of [['storm-distance-card',plan.correctDistance],['storm-reserve-card',plan.correctReserve]]){
      $(id).classList.toggle('storm-pass',checked&&ok);$(id).classList.toggle('storm-fail',checked&&!ok);
    }
    $('storm-distance-feedback').textContent=plan.correctDistance?t('stormDistancePass'):fill(plan.planned<plan.distance?'stormShort':'stormPast',{gap:Math.abs(plan.distance-plan.planned)});
    $('storm-reserve-feedback').textContent=plan.correctReserve?t('stormReservePass'):fill('stormReserveFail',{gap:STORM.reserve-plan.remaining});
    for(const [id,ok] of [['storm-distance-feedback',plan.correctDistance],['storm-reserve-feedback',plan.correctReserve]])$(id).classList.toggle('storm-fail',!ok);
    for(const [route,data] of Object.entries(STORM.routes)){
      $('storm-route-'+route).checked=route===plan.route;
      $('storm-info-'+route).textContent=fill('stormRouteInfo',data);
      dialog.querySelector(`[data-track="${route}"]`).classList.toggle('is-chosen',route===plan.route);
    }
    $('storm-time').value=String(plan.t1);$('storm-speed').value=String(plan.v1);
    $('storm-distance-math').textContent=fill('stormDistanceMath',{speed:plan.v1,time:plan.t1,rest:STORM.model.duration-plan.t1,planned:plan.planned});
    $('storm-cost-math').textContent=fill('stormCostMath',plan);
    $('storm-scene').querySelector('title').textContent=t('stormScene');
    $('storm-crates').style.display=done?'':'none';$('storm-cart').style.display=done?'none':'';
    if(dialog.open)paintRide(true);
    if(focus&&changed)$(phase==='ready'?'storm-send':phase==='arrived'?'storm-unload':done?'storm-map':'storm-objective').focus({preventScroll:true});
  }
  const tune=()=>{const route=dialog.querySelector('input[name="storm-route"]:checked').value;game.tune(route,Number($('storm-time').value),Number($('storm-speed').value));render();};
  for(const id of ['storm-route-ridge','storm-route-valley','storm-time','storm-speed'])$(id).onchange=tune;
  $('storm-plan').onsubmit=event=>{event.preventDefault();if(game.check())tone('pickup');render(true);};
  $('storm-send').onclick=()=>{if(game.launch()){tone('craft');render(true);}};
  $('storm-skip').onclick=()=>{if(game.advance(STORM.model.duration)){tone('pickup');render(true);}};
  $('storm-unload').onclick=()=>{if(!game.unload())return;earned=true;try{storage.setItem(STORM_KEY,'earned');}catch{}tone('win');render(true);};
  $('storm-replay').onclick=()=>{game=createStormRelay();previousPhase=null;$('storm-details').open=false;$('storm-hint').open=false;render(true);};
  $('storm-language').onclick=switchLanguage;$('storm-exit').onclick=$('storm-map').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{const callback=returnTo;returnTo=null;if(callback)setTimeout(callback,0);});
  return {get earned(){return earned;},render,
    tick(dt){if(!dialog.open||game.phase!=='riding')return;if(game.advance(dt)){tone('pickup');render(true);}else paintRide();},
    open(onClose){if(!openDialog(dialog))return;returnTo=onClose;game=createStormRelay();previousPhase=null;$('storm-details').open=false;$('storm-hint').open=false;render();$('storm-title').focus({preventScroll:true});}
  };
}

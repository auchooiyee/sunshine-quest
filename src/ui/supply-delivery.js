import {createSupplyDelivery,DELIVERY,DELIVERY_KEY} from '../missions/supply-delivery.js';

const {model,target,seconds,speeds}=DELIVERY;
const track=distance=>62+11.8*distance;
const gx=time=>39+time*36,gy=speed=>118-speed*11;
const ties=Array.from({length:40},(_,i)=>`<path d="M${i*19} 150l-8 13"/>`).join('');
const landscape=`<svg viewBox="0 0 720 190" role="img" id="delivery-scene"><title></title>
  <defs><linearGradient id="delivery-grass" x2="0" y2="1"><stop stop-color="#91a26c"/><stop offset=".32" stop-color="#597954"/><stop offset="1" stop-color="#254c42"/></linearGradient></defs>
  <path d="M0 116q145 -20 270 2t230 -3q92 -17 220 -8v83H0Z" fill="url(#delivery-grass)"/>
  <path d="M0 136q166 -15 318 -6t402 -5v58H0Z" fill="#46664c" opacity=".6"/>
  <g fill="#294f43" opacity=".88"><path d="M0 190v-43l13 20 4 -39 17 38 16 -15 11 39z M720 190h-65l22 -38 3 23 18 -47 7 33 15 -23z"/></g>
  <g transform="translate(${track(target.distance)} 144)">
    <path d="M-31 1v-42l34 -28 32 28v42Z" fill="#e5d1a2" stroke="#284c40" stroke-width="4"/>
    <path d="M-40 -39 2 -76 45 -38 35 -36 2 -62 -32 -36Z" fill="#3e6960" stroke="#234738" stroke-width="4"/>
    <path d="M-9 0v-29h24V0Z" fill="#31564a"/><rect id="delivery-lamp" x="-24" y="-30" width="11" height="13" rx="2" fill="#87a68a"/>
    <path d="M37 7v-48" stroke="#483927" stroke-width="4"/><path d="M37 -40h31l-5 8 5 9H37Z" fill="#eaca7c" stroke="#6c5639" stroke-width="2"/>
  </g>
  <path d="M0 155H720" stroke="#252f2a" stroke-width="15"/>
  <g stroke="#a07d56" stroke-width="4">${ties}</g><path d="M0 152H720 M0 162H720" stroke="#c6c9ab" stroke-width="2.6"/>
  <path d="M${track(target.distance)} 147v23" stroke="#ffe49a" stroke-width="3"/>
  <g id="delivery-stop" transform="translate(${track(24)} 162)"><path d="M0 -7l-6 9h12Z" fill="#f2cf76" stroke="#21443a" stroke-width="1.5"/><circle cy="9" r="3" fill="#ffdf88"/></g>
  <g id="delivery-depot-crates" transform="translate(${track(target.distance)+29} 143)" style="display:none"><path d="M-7 3v-15h16V3Z M10 3v-11h15V3Z" fill="#ce9a56" stroke="#65482c" stroke-width="2"/><path d="M-5 -10 7 0 M12 -6l10 7" stroke="#e7bc79" stroke-width="2"/></g>
  <g id="delivery-cart"><ellipse cy="2" rx="26" ry="5" fill="#22352a" opacity=".55"/><image id="delivery-rider" href="assets/hero.png" x="-24" y="-63" width="45" height="48" style="display:none"/>
    <path d="M-26 -23h52l-5 20h-40Z" fill="#af7044" stroke="#473b2c" stroke-width="3"/><path d="M-26 -22h52 M-21 -15h42" stroke="#e5bf7d" stroke-width="3"/>
    <path id="delivery-cargo" d="M1 -24v-13h17v13Z M3 -34l13 8 M-12 -24v-9H0v9Z" fill="#daa764" stroke="#71482f" stroke-width="2"/>
    <g fill="#303b33" stroke="#b1baa0" stroke-width="1.7"><circle cx="-13" r="5"/><circle cx="14" r="5"/></g>
  </g>
</svg>`;

const graph=`<svg id="delivery-graph" viewBox="0 0 350 146" role="img"><title></title><desc></desc>
  <text id="delivery-speed-label" x="39" y="13" fill="#48685a" font-size="11"></text>
  <g stroke="#b9cdc0" stroke-width="1">${[2,4,6,8].map(n=>`<path d="M39 ${gy(n)}H327"/>`).join('')}</g>
  <g fill="#38564a" font-size="12" text-anchor="end">${[2,4,6,8].map(n=>`<text x="32" y="${gy(n)+4}">${n}</text>`).join('')}</g>
  <rect id="delivery-area-one" y="74" x="39" width="144" height="44" fill="#9ac8aa"/>
  <rect id="delivery-area-two" y="96" x="183" width="144" height="22" fill="#efd8a0"/>
  <path d="M39 24V118H332" fill="none" stroke="#476858" stroke-width="1.4"/><path id="delivery-profile" fill="none" stroke="#216658" stroke-width="3"/>
  <path id="delivery-divider" fill="none" stroke="#4c7666" stroke-dasharray="4 3"/>
  <g fill="#38564a" font-size="12" text-anchor="middle"><text x="39" y="135">0</text><text id="delivery-switch-tick" x="183" y="135">4</text><text x="327" y="135">8</text></g>
  <text id="delivery-time-label" x="319" y="144" text-anchor="end" fill="#48685a" font-size="10"></text>
  <g id="delivery-progress-line" style="display:none"><path d="M0 24V118" stroke="#a75822" stroke-width="2"/><circle id="delivery-graph-dot" r="5" fill="#a75822" stroke="#fffaf0" stroke-width="1.5"/></g>
</svg>`;

export function createDeliveryUI({t,openDialog,switchLanguage,storage,tone,getPlayerName}){
  let game=createSupplyDelivery(),previousPhase,returnTo=null,earned=false,liveSecond=-1;
  try{earned=storage.getItem(DELIVERY_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='supply-delivery';dialog.setAttribute('aria-labelledby','delivery-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="deliveryEyebrow"></span><h2 id="delivery-title" tabindex="-1" data-i18n="deliveryTitle"></h2></div><div class="rescue-head-actions"><button id="delivery-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="delivery-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps delivery-steps">${['Plan','Ride','Unload'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="deliveryStep${step}"></b></li>`).join('')}</ol>
    <p id="delivery-objective" tabindex="-1" role="status"></p>
    <div class="delivery-visuals"><div class="delivery-stage">${landscape}<span id="delivery-player" dir="auto"></span><span class="delivery-goal" data-i18n="deliveryGoal"></span><span id="delivery-stop-key" class="delivery-stop-key"><span aria-hidden="true">▲</span> <span data-i18n="deliveryPredicted"></span></span></div><div class="delivery-chart">${graph}</div></div>
    <form id="delivery-plan"><div class="rescue-tuning delivery-tuning"><label><span data-i18n="deliveryTime"></span><select id="delivery-time">${seconds.map(n=>`<option>${n}</option>`).join('')}</select></label><label><span data-i18n="deliverySpeed"></span><select id="delivery-speed">${speeds.map(n=>`<option>${n}</option>`).join('')}</select></label><div class="rescue-height"><span data-i18n="deliveryDistance"></span><output id="delivery-distance" for="delivery-time delivery-speed"></output></div></div>
      <p class="delivery-math" id="delivery-math"></p><div class="rescue-controls"><button id="delivery-check" type="submit" class="primary" data-i18n="deliveryCheck"></button><button id="delivery-board" type="button" class="primary" hidden data-i18n="deliveryBoard"></button></div></form>
    <p id="delivery-feedback" role="alert" hidden></p><details id="delivery-hint"><summary data-i18n="rescueHint"></summary><p data-i18n="deliveryHintText"></p><p data-i18n="deliveryHintWork"></p></details>
    <div id="delivery-ride" hidden><p id="delivery-live"></p><button id="delivery-skip" class="outline" data-i18n="deliverySkipRide"></button></div><button id="delivery-unload" class="primary" hidden data-i18n="deliveryUnload"></button>
    <div id="delivery-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="deliveryBadge"></strong></div><div class="rescue-controls"><button id="delivery-signal" class="primary" data-i18n="signalNext"></button><button id="delivery-map" class="outline" data-i18n="deliveryFinishMap"></button><button id="delivery-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const step={plan:0,ready:0,riding:1,arrived:2,complete:3};
  const phaseText={plan:'deliveryPlan',ready:'deliveryReady',riding:'deliveryRiding',arrived:'deliveryArrived',complete:'deliveryComplete'};
  const show=(id,visible)=>$(id).style.display=visible?'':'none';
  const fmt=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  function paintRide(force=false){
    const {elapsed,distance,speed,phase}=game;
    $('delivery-cart').setAttribute('transform',`translate(${track(distance).toFixed(2)} 150)`);
    if(phase!=='riding'&&phase!=='arrived'&&phase!=='complete')return;
    $('delivery-progress-line').setAttribute('transform',`translate(${gx(elapsed)} 0)`);
    $('delivery-graph-dot').setAttribute('cy',gy(speed));
    const second=Math.floor(elapsed*10);
    if(force||liveSecond!==second){liveSecond=second;$('delivery-live').textContent=fmt('deliveryLive',{time:elapsed.toFixed(1),distance:distance.toFixed(1),speed});}
  }
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,t1,v1,plannedDistance,feedback}=game;
    const planning=phase==='plan'||phase==='ready',done=phase==='complete',changed=phase!==previousPhase;
    dialog.dataset.phase=phase;previousPhase=phase;
    [...dialog.querySelectorAll('.delivery-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<step[phase]);if(i===step[phase])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('delivery-player').textContent=getPlayerName();$('delivery-objective').textContent=t(phaseText[phase]);
    $('delivery-plan').hidden=!planning;$('delivery-check').hidden=phase!=='plan';$('delivery-board').hidden=phase!=='ready';
    $('delivery-hint').hidden=phase!=='plan';if(changed)$('delivery-hint').open=false;
    $('delivery-ride').hidden=phase!=='riding';$('delivery-unload').hidden=phase!=='arrived';$('delivery-finish').hidden=!done;
    $('delivery-time').value=String(t1);$('delivery-speed').value=String(v1);$('delivery-distance').textContent=`${plannedDistance} m`;
    $('delivery-math').textContent=`${t('deliverySlow')} · ${v1} × ${t1} + ${model.v2} × ${model.duration-t1} = ${plannedDistance} m`;
    $('delivery-feedback').hidden=!feedback;$('delivery-feedback').textContent=feedback?fmt(feedback==='short'?'deliveryShort':'deliveryPast',{gap:Math.abs(target.distance-plannedDistance)}):'';
    $('delivery-scene').querySelector('title').textContent=t('deliveryScene');
    $('delivery-graph').querySelector('title').textContent=t('deliveryGraph');
    $('delivery-graph').querySelector('desc').textContent=$('delivery-math').textContent;
    $('delivery-speed-label').textContent=t('deliveryAxisSpeed');$('delivery-time-label').textContent=t('deliveryAxisTime');
    $('delivery-area-one').setAttribute('y',gy(v1));$('delivery-area-one').setAttribute('height',118-gy(v1));$('delivery-area-one').setAttribute('width',gx(t1)-gx(0));
    $('delivery-area-two').setAttribute('x',gx(t1));$('delivery-area-two').setAttribute('width',gx(model.duration)-gx(t1));
    $('delivery-profile').setAttribute('d',`M${gx(0)} ${gy(v1)} H${gx(t1)} V${gy(model.v2)} H${gx(model.duration)}`);
    $('delivery-divider').setAttribute('d',`M${gx(t1)} ${gy(v1)} V118`);
    $('delivery-switch-tick').setAttribute('x',gx(t1));$('delivery-switch-tick').textContent=t1;
    $('delivery-stop').setAttribute('transform',`translate(${track(plannedDistance)} 162)`);
    $('delivery-stop').querySelector('path').setAttribute('fill',feedback?'#eb8d72':'#f2cf76');
    show('delivery-stop',planning);$('delivery-stop-key').hidden=!planning;show('delivery-progress-line',!planning);show('delivery-rider',!planning);show('delivery-cargo',!done);show('delivery-depot-crates',done);
    paintRide(true);
    if(focus&&changed)$(phase==='ready'?'delivery-board':phase==='arrived'?'delivery-unload':phase==='complete'?'delivery-signal':'delivery-objective').focus({preventScroll:true});
  }
  $('delivery-time').onchange=$('delivery-speed').onchange=()=>{game.tune(Number($('delivery-time').value),Number($('delivery-speed').value));render();};
  $('delivery-plan').onsubmit=event=>{event.preventDefault();if(game.check())tone('pickup');render(true);};
  $('delivery-board').onclick=()=>{if(game.board()){tone('craft');render(true);}};
  $('delivery-skip').onclick=()=>{if(game.advance(model.duration)){tone('pickup');render(true);}};
  $('delivery-unload').onclick=()=>{if(!game.unload())return;earned=true;try{storage.setItem(DELIVERY_KEY,'earned');}catch{}tone('win');render(true);};
  $('delivery-replay').onclick=()=>{game=createSupplyDelivery();previousPhase=null;render(true);};
  $('delivery-language').onclick=switchLanguage;
  $('delivery-exit').onclick=()=>dialog.close();
  $('delivery-map').onclick=()=>dialog.close('map');
  $('delivery-signal').onclick=()=>dialog.close('signal');
  dialog.addEventListener('keydown',event=>{
    if(event.code!=='KeyE'||event.altKey||event.ctrlKey||event.metaKey||event.target instanceof HTMLSelectElement)return;
    if(game.phase==='ready')$('delivery-board').click();else if(game.phase==='arrived')$('delivery-unload').click();
  });
  dialog.addEventListener('close',()=>{const callback=returnTo;returnTo=null;const destination=dialog.returnValue;if(callback)setTimeout(()=>callback(destination),0);});
  return {get earned(){return earned;},render,
    tick(dt){if(!dialog.open||game.phase!=='riding')return;if(game.advance(dt)){tone('pickup');render(true);}else paintRide();},
    open(onClose){if(!openDialog(dialog))return;returnTo=onClose;dialog.returnValue='';game=createSupplyDelivery();previousPhase=null;render();$('delivery-title').focus({preventScroll:true});}
  };
}

import {createBridgeRescue,RESCUE,RESCUE_KEY} from '../missions/bridge-rescue.js';
import {designModel,valueAt} from '../math/quadratics.js';

const {layout,trace,anchors,target,spanValues,curveValues}=RESCUE;
const W=720,H=288,axis=n=>layout.left+(n-anchors[0])*layout.metre;
const sy=y=>layout.baseline-y*layout.heightScale;
function archPath(start,end,sample){
  const points=Array.from({length:49},(_,i)=>{
    const x=start+(end-start)*i/48;return `${axis(x).toFixed(2)} ${sy(sample(x)).toFixed(2)}`;
  });
  return `M${points.join(' L')}`;
}
const scene=`<svg id="rescue-scene" viewBox="0 0 ${W} ${H}" role="img">
  <title></title><defs>
    <linearGradient id="rescue-water" x2="0" y2="1"><stop stop-color="#80c3b2"/><stop offset=".37" stop-color="#247e84"/><stop offset="1" stop-color="#174857"/></linearGradient>
    <linearGradient id="rescue-earth" x2="0" y2="1"><stop stop-color="#5e653a"/><stop offset=".18" stop-color="#3d5438"/><stop offset="1" stop-color="#1b352d"/></linearGradient>
    <linearGradient id="rescue-beam" x2="0" y2="1"><stop stop-color="#ffe69a" stop-opacity=".05"/><stop offset="1" stop-color="#ffd17a" stop-opacity=".75"/></linearGradient>
  </defs>
  <path d="M402 149q21 7 18 14c-7 14 55 18 89 34L594 288H159l84 -104c45 -8 112 -13 143 -27q12 -6 16 -8Z" fill="url(#rescue-water)" opacity=".92"/>
  <g fill="none" stroke="#b3f4dd" opacity=".49" stroke-linecap="round"><path d="M315 184q36 -7 68 0t76 -2 M275 202q34 -7 73 0t75 -1 M226 233q39 -8 88 -1t100 -1 M373 254q54 -10 100 -3t77 -4 M227 274q69 -10 138 -4" stroke-width="2"/><path d="M377 166l34 -2 M423 221l65 -1 M303 249l45 -3" stroke-width="1.5"/></g>
  <g fill="url(#rescue-earth)"><path d="M0 214q70 -8 127 3l71 2 17 34 -23 35H0Z"/><path d="M530 219l37 -4q84 -17 153 -4v77H553l-18 -25 -19 -13Z"/></g>
  <g fill="none" stroke-linecap="round"><path d="M0 218q70 -8 127 1h71 M530 219l37 -4q84 -17 153 -4" stroke="#8aab66" stroke-width="8"/><path d="M8 246l61 -7 36 8 42 -3 35 14 M553 249l57 -13 43 3 52 -10" stroke="#bdc294" opacity=".29" stroke-width="2"/></g>
  <g fill="#8f9980" stroke="#465749" stroke-width="2"><path d="M173 250l8 -10 15 -4 12 13 -11 9z M194 268l7 -6 10 -2 8 8 -10 4z M524 251l9 -15 14 1 14 14 -12 6z M556 270l8 -10 14 7 -4 6z"/></g>
  <g fill="none" stroke="#d3ba72" stroke-width="2" stroke-linecap="round"><path d="M183 220q-1 -12 -9 -18 M183 220q5 -15 10 -18 M547 218q-1 -9 -7 -13 M547 218q6 -14 14 -15"/></g>
  <g id="rescue-broken-deck" fill="#967046" stroke="#4c3b2c" stroke-width="3" stroke-linejoin="round"><path d="M192 213l26 -12 7 1 -4 6 8 2 -31 13z M536 212l-27 -12 -6 1 4 7 -9 1 32 14z"/></g>
  <g id="rescue-post" transform="translate(157 219)"><path d="M0 0v-49" stroke="#3f3022" stroke-width="8"/><path d="M-18 -51h24l11 8 -11 8h-24z" fill="#e7bc6e" stroke="#513c28" stroke-width="3"/><circle cy="-43" r="3" fill="#3a583e"/></g>
  <g transform="translate(635 209)"><path d="M-16 0l4 -25h24l4 25 M-21 1h42" stroke="#1f392e" stroke-width="5" fill="#596f48"/><path d="M-14 -22v-21h28v21Z" fill="#223d39" stroke="#cab37a" stroke-width="3"/><path d="M-20 -43 0 -61l20 18Z" fill="#4d6649" stroke="#223c31" stroke-width="3"/><path id="rescue-beacon-glow" d="M-11 -41 -50 -117H50L11 -41Z" fill="url(#rescue-beam)"/><path id="rescue-beacon-light" d="M-10 -40h20v15h-20z" fill="#628783"/><path d="M0 -41v16" stroke="#90794d" stroke-width="2"/></g>
  <rect id="rescue-scrim" x="72" y="31" width="592" height="226" rx="17" fill="#102d27" opacity=".87"/>
  <g id="rescue-grid" fill="none" stroke="#f0efd1" stroke-opacity=".25">
    <path d="M90 51V219H640" stroke-opacity=".65" stroke-width="2"/>
    ${Array.from({length:11},(_,i)=>`<path d="M${axis(i)} 56V224"/><text x="${axis(i)}" y="242" text-anchor="middle" fill="#f6f0d5" stroke="none" font-size="16">${i}</text>`).join('')}
    <text id="rescue-axis" x="631" y="206" text-anchor="end" fill="#f6f0d5" stroke="none" font-size="14"></text>
  </g>
  <path id="rescue-target-line" d="M${layout.left} ${sy(target.height)}H${layout.right} M${layout.right} ${sy(target.height)}V${layout.baseline}" fill="none" stroke="#f7ce7a" stroke-dasharray="5 5" stroke-width="2"/>
  <text id="rescue-target-text" x="${layout.right-7}" y="${sy(target.height)-10}" text-anchor="end" fill="#ffdf91" font-size="16"></text>
  <path id="rescue-trace" d="${archPath(anchors[0],anchors[1],x=>valueAt(trace,x))}" stroke="#9ee0d3" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g id="rescue-picks"></g>
  <g id="rescue-bridge"><path id="rescue-bridge-shadow" fill="none" stroke="#263d2c" stroke-width="16" stroke-linecap="round"/><path id="rescue-bridge-deck" fill="none" stroke="#e9bc73" stroke-width="9" stroke-linecap="round"/><path id="rescue-bridge-seams" fill="none" stroke="#835937" stroke-width="4" stroke-dasharray="1 9"/></g>
  <circle id="rescue-far-anchor" cx="${layout.right}" cy="${layout.baseline}" r="7" fill="#f7ce7a"/>
  <circle id="rescue-preview-end" cy="${layout.baseline}" r="7" fill="#a1e5d3"/>
  <circle id="rescue-peak" r="6" fill="#a1e5d3"/>
  <g id="rescue-avatar"><ellipse cy="-2" rx="14" ry="4" fill="#0b281c" opacity=".6"/><image href="assets/hero.png" x="-25" y="-57" width="50" height="55"/></g>
  <g fill="#1a382e" opacity=".9"><path d="M0 0h78Q60 16 35 18q20 8 22 25 -23 2 -34 -12 4 17 -9 33Q6 56 0 49Z M720 0h-89q16 14 38 18 -17 7 -25 20 25 8 44 -9 -10 22 4 37 18 -7 28 -24Z"/><path d="M0 288v-37q12 8 18 25 -5 -26 6 -41 12 19 15 40 9 -9 17 -10l2 23z M720 288h-61q5 -16 17 -24l2 13q4 -25 18 -42 6 15 5 33 11 -13 19 -15z"/></g>
</svg>`;

export function createRescueUI({t,openDialog,switchLanguage,storage,tone,getPlayerName}){
  let game=createBridgeRescue(),held=0,heldFor=0,keyboard=0,returnTo=null,previousPhase;
  let earned=false;try{earned=storage.getItem(RESCUE_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='bridge-rescue';dialog.setAttribute('aria-labelledby','rescue-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="rescueEyebrow"></span><h2 id="rescue-title" tabindex="-1" data-i18n="rescueTitle"></h2></div><div class="rescue-head-actions"><button id="rescue-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="rescue-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps">${['Walk','Anchors','Build','Light'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="rescueStep${step}"></b></li>`).join('')}</ol>
    <div class="rescue-stage">${scene}<span id="rescue-player" dir="auto"></span></div><p id="rescue-objective" role="status" tabindex="-1"></p>
    <div id="rescue-movement" class="rescue-controls"><div><button type="button" class="outline" id="rescue-left">←</button><button type="button" class="primary" id="rescue-right">→</button></div><small data-i18n="rescueMove"></small></div>
    <section id="rescue-anchor-panel" hidden><p id="rescue-pick-label" data-i18n="rescuePick"></p><div id="rescue-points" role="group" aria-labelledby="rescue-pick-label">${Array.from({length:11},(_,i)=>`<button type="button" class="outline" data-point="${i}" aria-pressed="false">${i}</button>`).join('')}</div><button id="rescue-check" class="primary" data-i18n="rescueCheck"></button></section>
    <form id="rescue-build-panel" hidden><div class="rescue-tuning"><label><span data-i18n="rescueSpan"></span><select id="rescue-span">${spanValues.map(v=>`<option>${v}</option>`).join('')}</select></label><label><span data-i18n="rescueCurve"></span><select id="rescue-curve">${curveValues.map(v=>`<option>${v}</option>`).join('')}</select></label><div class="rescue-height"><span data-i18n="rescueHeight"></span><output id="rescue-height" for="rescue-span rescue-curve"></output></div></div><p class="rescue-equation">y = k · d(L − d) · <span data-i18n="rescueDistance"></span></p><button id="rescue-build" class="primary" data-i18n="rescueBuild"></button></form>
    <p id="rescue-feedback" role="alert" hidden></p><details id="rescue-hint" hidden><summary data-i18n="rescueHint"></summary><p id="rescue-hint-text"></p></details>
    <button id="rescue-light" class="primary" hidden data-i18n="rescueLight"></button><div id="rescue-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="rescueBadge"></strong></div><div class="rescue-controls"><button id="rescue-delivery" class="primary" data-i18n="deliveryNext"></button><button id="rescue-next" class="outline" data-i18n="rescueNext"></button><button id="rescue-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const phaseText={approach:'rescueApproach',anchors:'rescueAnchors',design:'rescueDesign',cross:'rescueCross',beacon:'rescueBeacon',complete:'rescueComplete'};
  const phaseNumber={approach:0,anchors:1,design:2,cross:3,beacon:3,complete:4};
  const stop=()=>{held=0;heldFor=0;keyboard=0;};
  const display=id=>$(id).style.display='';
  const show=(id,yes)=>{if(yes)display(id);else $(id).style.display='none';};
  function paintAvatar(){ $('rescue-avatar').setAttribute('transform',`translate(${game.x} ${game.surface(game.x)})`); }
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,span,k,height,selected,feedback}=game;
    const changed=previousPhase!==phase;
    if(changed){stop();$('rescue-hint').open=false;}
    previousPhase=phase;dialog.dataset.phase=phase;
    const index=phaseNumber[phase];
    [...dialog.querySelectorAll('.rescue-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<index);if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('rescue-objective').textContent=t(phaseText[phase]);
    $('rescue-player').textContent=getPlayerName();
    $('rescue-scene').querySelector('title').textContent=t('rescueScene');
    $('rescue-left').setAttribute('aria-label',t('rescueLeft'));$('rescue-right').setAttribute('aria-label',t('rescueRight'));
    $('rescue-axis').textContent=t('rescueAxis');$('rescue-target-text').textContent=t('rescueTarget');
    const survey=phase==='anchors',design=phase==='design',walk=phase==='approach'||phase==='cross',built=index>=3;
    $('rescue-anchor-panel').hidden=!survey;$('rescue-build-panel').hidden=!design;$('rescue-movement').hidden=!walk;
    $('rescue-light').hidden=phase!=='beacon';$('rescue-finish').hidden=phase!=='complete';$('rescue-hint').hidden=!survey&&!design;
    $('rescue-hint-text').textContent=t(survey?'rescueRootHint':'rescueDesignHint');
    $('rescue-feedback').hidden=!feedback;$('rescue-feedback').textContent=feedback?t(feedback):'';
    for(const id of ['rescue-scrim','rescue-grid'])show(id,survey||design);
    show('rescue-trace',survey);show('rescue-picks',survey);show('rescue-target-line',design);show('rescue-target-text',design);
    show('rescue-post',!survey&&!design);show('rescue-avatar',!survey&&!design);show('rescue-bridge',design||built);show('rescue-broken-deck',phase==='approach');
    show('rescue-far-anchor',design);show('rescue-peak',design);show('rescue-preview-end',design&&span!==target.span);
    for(const el of dialog.querySelectorAll('[data-point]')){
      const n=Number(el.dataset.point),on=selected.includes(n);el.setAttribute('aria-pressed',String(on));
      el.classList.toggle('off-target',on&&feedback==='rescueWrongAnchors'&&!anchors.includes(n));
    }
    $('rescue-picks').innerHTML=selected.map(n=>`<circle cx="${axis(n)}" cy="${layout.baseline}" r="9" fill="${feedback==='rescueWrongAnchors'&&!anchors.includes(n)?'#f28477':'#ffe29b'}" stroke="#102d27" stroke-width="3"/>`).join('');
    $('rescue-span').value=String(span);$('rescue-curve').value=String(k);$('rescue-height').textContent=`${Number(height.toFixed(2))} m`;
    if(design||built){
      const model=designModel(span,k),path=archPath(anchors[0],anchors[0]+span,x=>valueAt(model,x-anchors[0]));
      for(const id of ['rescue-bridge-shadow','rescue-bridge-deck','rescue-bridge-seams'])$(id).setAttribute('d',path);
      $('rescue-peak').setAttribute('cx',axis(anchors[0]+span/2));$('rescue-peak').setAttribute('cy',sy(height));
      $('rescue-peak').setAttribute('fill',feedback&&height!==target.height?'#f28477':'#a1e5d3');
      $('rescue-preview-end').setAttribute('cx',axis(anchors[0]+span));
      $('rescue-preview-end').setAttribute('fill',feedback&&span!==target.span?'#f28477':'#a1e5d3');
    }
    paintAvatar();
    if(focus&&changed)$(phase==='beacon'?'rescue-light':'rescue-objective').focus({preventScroll:true});
  }
  function move(delta){if(game.move(delta))render(true);else paintAvatar();}
  for(const [id,dir] of [['rescue-left',-1],['rescue-right',1]]){
    const button=$(id);
    button.onclick=()=>move(dir*38);
    button.onpointerdown=event=>{if(event.button!==0)return;held=dir;heldFor=0;button.setPointerCapture(event.pointerId);};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{held=0;heldFor=0;});
  }
  const directions={ArrowLeft:-1,KeyA:-1,ArrowRight:1,KeyD:1};
  dialog.addEventListener('keydown',event=>{
    if(event.altKey||event.metaKey||event.ctrlKey)return;
    if(event.code==='KeyE'&&game.phase==='beacon'){event.preventDefault();$('rescue-light').click();return;}
    if(!directions[event.code]||!['approach','cross'].includes(game.phase))return;
    event.preventDefault();keyboard=directions[event.code];if(!event.repeat)move(keyboard*12);
  });
  window.addEventListener('keyup',event=>{if(directions[event.code]===keyboard)keyboard=0;});
  window.addEventListener('blur',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  $('rescue-points').onclick=event=>{const button=event.target.closest('[data-point]');if(button){game.pick(Number(button.dataset.point));render();}};
  $('rescue-scene').onclick=event=>{
    if(game.phase!=='anchors')return;
    const svg=$('rescue-scene'),point=new DOMPoint(event.clientX,event.clientY).matrixTransform(svg.getScreenCTM().inverse());
    if(Math.abs(point.y-layout.baseline)>35||point.x<axis(0)-20||point.x>axis(10)+20)return;
    game.pick(Math.round((point.x-axis(0))/layout.metre));render();
  };
  $('rescue-check').onclick=()=>{if(game.checkAnchors())tone('pickup');render(true);};
  $('rescue-span').onchange=$('rescue-curve').onchange=()=>{game.tune(Number($('rescue-span').value),Number($('rescue-curve').value));render();};
  $('rescue-build-panel').onsubmit=event=>{event.preventDefault();if(game.build())tone('craft');render(true);};
  $('rescue-light').onclick=()=>{if(!game.light())return;earned=true;try{storage.setItem(RESCUE_KEY,'earned');}catch{}tone('win');render(true);};
  $('rescue-replay').onclick=()=>{game=createBridgeRescue();previousPhase=null;render(true);};
  $('rescue-language').onclick=switchLanguage;
  $('rescue-exit').onclick=()=>dialog.close();
  $('rescue-next').onclick=()=>dialog.close('next');
  $('rescue-delivery').onclick=()=>dialog.close('delivery');
  dialog.addEventListener('close',()=>{stop();const callback=returnTo;returnTo=null;const destination=dialog.returnValue;if(callback)setTimeout(()=>callback(destination),0);});
  return {
    get earned(){return earned;},
    render,
    tick(dt){if(!dialog.open)return;if(held)heldFor+=dt;const direction=keyboard||(heldFor>.14?held:0);if(direction)move(direction*dt*185);},
    open(onClose){
      if(!openDialog(dialog))return;
      returnTo=onClose;dialog.returnValue='';game=createBridgeRescue();previousPhase=null;render();$('rescue-title').focus({preventScroll:true});
    }
  };
}

import {createCrystalSignal,fraction,SIGNAL,SIGNAL_KEY} from '../missions/crystal-signal.js';

const lake=`<svg id="signal-scene" viewBox="0 0 720 200" role="img"><title></title>
  <defs><linearGradient id="signal-water" x2="0" y2="1"><stop stop-color="#345e7b"/><stop offset="1" stop-color="#122b49"/></linearGradient><radialGradient id="signal-moon"><stop stop-color="#efe3b2" stop-opacity=".64"/><stop offset="1" stop-color="#efe3b2" stop-opacity="0"/></radialGradient></defs>
  <circle cx="502" cy="42" r="54" fill="url(#signal-moon)"/><circle cx="502" cy="42" r="20" fill="#fbebbe"/>
  <path d="M0 99q123 -13 196 0t154 -1q158 -13 370 0V200H0Z" fill="url(#signal-water)"/>
  <path d="M495 104h14l14 65h-50Z" fill="#eedcb4" opacity=".14"/>
  <g fill="none" stroke="#a2cad3" opacity=".52" stroke-linecap="round"><path d="M46 126q52 -6 101 0m30 -16 75 -2m105 21 93 -3m17 15 105 -1m-519 20 108 -4m161 24 108 -2m81 -1 106 -4m-407 -26 64 -3m309 -20 76 -5" stroke-width="2"/></g>
  <path d="M0 135q51 -13 116 12l38 53H0Z M720 128q-56 -3 -103 17l-37 55h140Z" fill="#2e574f"/>
  <path d="M0 139q51 -16 112 10m608 -18q-50 -2 -98 16" stroke="#91ae7f" stroke-width="5" fill="none"/>
  <g fill="#976f4c" stroke="#433b3c" stroke-width="3"><path d="M606 136h90v10h-90Z M612 146h7v26h-7Z M681 146h7v21h-7Z"/></g>
  <g stroke="#422e35" stroke-width="4" fill="#51465c"><path d="M635 124V74m45 50V74"/><path d="M624 74l11 -10 11 10v21h-22z M669 74l11 -10 11 10v21h-22z"/></g>
  <rect id="signal-rb-lamp" x="628" y="76" width="14" height="14" rx="3" fill="#7c858b"/>
  <rect id="signal-br-lamp" x="673" y="76" width="14" height="14" rx="3" fill="#7c858b"/>
  <g id="signal-boat" transform="translate(88 146)"><ellipse cy="10" rx="48" ry="6" fill="#102a43" opacity=".64"/><path d="M-48 -3h96l-13 15h-68Z" fill="#bf8659" stroke="#443c46" stroke-width="4"/><path d="M-30 -6v-27h40l11 12v15Z" fill="#e5c996" stroke="#3c4754" stroke-width="3"/><rect x="-22" y="-26" width="16" height="13" rx="2" fill="#63949b"/><path d="M25 -7v-29l14 7 -14 7Z" fill="#f1ce82" stroke="#55475a" stroke-width="2"/></g>
</svg>`;
const paths=[['RR',41],['RB',76],['BR',124],['BB',159]];
const tree=`<svg id="signal-tree" viewBox="0 0 355 177" role="img"><title></title><desc></desc>
  <g fill="#375359" font-size="12" text-anchor="middle"><text id="signal-tree-head-first" x="68" y="18"/><text id="signal-tree-head-second" x="180" y="18"/><text id="signal-tree-head-path" x="286" y="18"/></g>
  <g fill="none" stroke="#759096" stroke-width="2"><path d="M27 100 121 58 227 41 M121 58 227 76 M27 100 121 141 227 124 M121 141 227 159"/></g>
  <circle cx="26" cy="100" r="8" fill="#406b6a"/><path d="M121 48l10 10 -10 10 -10 -10Z" fill="#b85869"/><circle cx="121" cy="141" r="9" fill="#44859f"/>
  <g fill="#375359" font-size="13" text-anchor="middle"><text id="signal-tree-first-r" x="66" y="69"/><text id="signal-tree-first-b" x="66" y="133"/></g>
  ${paths.map(([order,y])=>`<g class="signal-tree-path" data-order="${order}"><rect x="228" y="${y-12}" width="116" height="24" rx="6" fill="#ecf2ec"/><text x="184" y="${y+(order==='RB'||order==='BB'?12:-7)}" text-anchor="middle" class="signal-tree-conditional"/><text x="286" y="${y+5}" text-anchor="middle" class="signal-tree-outcome"/></g>`).join('')}
</svg>`;

export function createSignalUI({t,openDialog,switchLanguage,storage,tone,getPlayerName}){
  let game=createCrystalSignal(),earned=false,returnTo=null,previousPhase;
  try{earned=storage.getItem(SIGNAL_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='crystal-signal';dialog.setAttribute('aria-labelledby','signal-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="signalEyebrow"></span><h2 id="signal-title" tabindex="-1" data-i18n="signalTitle"></h2></div><div class="rescue-head-actions"><button id="signal-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="signal-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps signal-steps">${['Plan','Trace','Dock'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="signalStep${step}"></b></li>`).join('')}</ol>
    <p id="signal-objective" tabindex="-1" role="status"></p>
    <div class="signal-visuals"><div class="signal-stage">${lake}<span id="signal-player" dir="auto"></span><span class="signal-target" data-i18n="signalTarget"></span></div><div class="signal-chart">${tree}<p id="signal-sum"></p></div></div>
    <div class="signal-bag"><div id="signal-gems" aria-hidden="true"></div><span id="signal-bag-count"></span></div>
    <form id="signal-plan"><div class="rescue-tuning signal-tuning"><label><span data-i18n="signalRedCount"></span><select id="signal-red">${SIGNAL.redChoices.map(n=>`<option>${n}</option>`).join('')}</select></label><label><span data-i18n="signalRule"></span><select id="signal-rule"><option value="return" data-i18n="signalReturn"></option><option value="keep" data-i18n="signalKeep"></option></select></label><div class="rescue-height"><span data-i18n="signalChance"></span><output id="signal-chance" for="signal-red signal-rule"></output></div></div><button id="signal-check" class="primary" data-i18n="signalCheck"></button></form>
    <div id="signal-draw" hidden><p id="signal-draw-status" aria-live="polite"></p><div class="rescue-controls"><button id="signal-pick-red" class="outline"><i class="signal-gem red" aria-hidden="true"></i><span data-i18n="signalPickRed"></span></button><button id="signal-pick-blue" class="outline"><i class="signal-gem blue" aria-hidden="true"></i><span data-i18n="signalPickBlue"></span></button><button id="signal-clear" class="text-button" data-i18n="signalResetDraw"></button></div></div>
    <p id="signal-feedback" role="status" hidden></p><details id="signal-hint"><summary data-i18n="rescueHint"></summary><p data-i18n="signalHint"></p></details>
    <button id="signal-send" class="primary" hidden data-i18n="signalSend"></button><button id="signal-skip" class="outline" hidden data-i18n="signalSkip"></button>
    <div id="signal-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="signalBadge"></strong></div><div class="rescue-controls"><button id="signal-map" class="primary" data-i18n="signalMap"></button><button id="signal-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const step={plan:0,trace:1,ready:2,sailing:2,complete:3};
  const phaseText={plan:'signalPlan',trace:'signalTrace',ready:'signalReady',sailing:'signalSailing',complete:'signalComplete'};
  const feedbackText={replacement:'signalReplacement',low:'signalLow',high:'signalHigh',same:'signalSame',repeat:'signalRepeat',one:'signalOne'};
  const fill=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  function paintBoat(){ $('signal-boat').setAttribute('transform',`translate(${88+490*game.progress} 146)`); }
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,red,replacement,first,feedback,model,demonstrated}=game;
    const changed=phase!==previousPhase;previousPhase=phase;dialog.dataset.phase=phase;
    [...dialog.querySelectorAll('.signal-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<step[phase]);if(i===step[phase])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('signal-player').textContent=getPlayerName();$('signal-objective').textContent=t(phaseText[phase]);
    $('signal-plan').hidden=phase!=='plan';$('signal-draw').hidden=phase!=='trace';$('signal-send').hidden=phase!=='ready';$('signal-skip').hidden=phase!=='sailing';$('signal-finish').hidden=phase!=='complete';
    $('signal-hint').hidden=phase!=='plan'&&phase!=='trace';if(changed)$('signal-hint').open=false;
    $('signal-clear').hidden=!first;
    $('signal-red').value=String(red);$('signal-rule').value=replacement?'return':'keep';
    const {R,B}=game.remaining;
    $('signal-gems').replaceChildren(...[...Array(R).fill('red'),...Array(B).fill('blue')].map(colour=>{const el=document.createElement('i');el.className=`signal-gem ${colour}`;return el;}));
    $('signal-bag-count').textContent=fill('signalBag',{red:R,blue:B,total:R+B});
    $('signal-draw-status').textContent=first?fill('signalFirst',{colour:t(first==='R'?'signalRed':'signalBlue')}):t('signalChoose');
    $('signal-pick-red').disabled=R===0;$('signal-pick-blue').disabled=B===0;
    $('signal-feedback').hidden=!feedback;$('signal-feedback').textContent=feedback?t(feedbackText[feedback]):'';
    $('signal-feedback').classList.toggle('signal-good',feedback==='one');
    const {branches,mixed}=model;
    const rb=fraction(branches.RB.num,branches.RB.den),br=fraction(branches.BR.num,branches.BR.den),chance=fraction(mixed.num,mixed.den);
    $('signal-chance').textContent=chance;
    const codes={R:t('signalRedCode'),B:t('signalBlueCode')}, label=order=>`${codes[order[0]]}→${codes[order[1]]}`;
    $('signal-sum').textContent=`${label('RB')} + ${label('BR')}: ${rb} + ${br} = ${chance}`;
    $('signal-tree').querySelector('title').textContent=t('signalTree');$('signal-tree').querySelector('desc').textContent=fill('signalTreeSummary',{redBlue:label('RB'),blueRed:label('BR'),rb,br,mixed:chance});
    $('signal-tree-head-first').textContent=t('signalFirstDraw');$('signal-tree-head-second').textContent=t('signalSecondDraw');$('signal-tree-head-path').textContent=t('signalPathChance');
    $('signal-scene').querySelector('title').textContent=t('signalScene');
    $('signal-tree-first-r').textContent=`${model.counts.R}/${SIGNAL.total}`;$('signal-tree-first-b').textContent=`${model.counts.B}/${SIGNAL.total}`;
    for(const node of dialog.querySelectorAll('[data-order]')){
      const order=node.dataset.order,{num,den,secondCount,secondTotal}=branches[order];
      node.querySelector('.signal-tree-conditional').textContent=`${secondCount}/${secondTotal}`;
      node.querySelector('.signal-tree-outcome').textContent=`${label(order)}  ${fraction(num,den)}`;
      node.classList.toggle('is-mixed',SIGNAL.orders.includes(order));node.classList.toggle('is-lit',demonstrated.includes(order));
    }
    for(const [id,order] of [['signal-rb-lamp','RB'],['signal-br-lamp','BR']])$(id).classList.toggle('is-lit',demonstrated.includes(order));
    paintBoat();
    if(focus&&changed)$(phase==='ready'?'signal-send':phase==='complete'?'signal-map':'signal-objective').focus({preventScroll:true});
  }
  function finish(){earned=true;try{storage.setItem(SIGNAL_KEY,'earned');}catch{}tone('win');render(true);}
  $('signal-red').onchange=$('signal-rule').onchange=()=>{game.tune(Number($('signal-red').value),$('signal-rule').value==='return');render();};
  $('signal-plan').onsubmit=event=>{event.preventDefault();if(game.check())tone('pickup');render(true);};
  for(const [id,colour] of [['signal-pick-red','R'],['signal-pick-blue','B']])$(id).onclick=()=>{const before=game.demonstrated.length;if(game.pick(colour)){if(game.demonstrated.length>before)tone('pickup');render(true);}};
  $('signal-clear').onclick=()=>{if(game.clearFirst())render();};
  $('signal-send').onclick=()=>{if(game.send()){tone('craft');render(true);}};
  $('signal-skip').onclick=()=>{if(game.advance(SIGNAL.duration))finish();};
  $('signal-replay').onclick=()=>{game=createCrystalSignal();previousPhase=null;render(true);};
  $('signal-language').onclick=switchLanguage;$('signal-exit').onclick=$('signal-map').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{const callback=returnTo;returnTo=null;if(callback)setTimeout(callback,0);});
  return {get earned(){return earned;},render,
    tick(dt){if(!dialog.open||game.phase!=='sailing')return;if(game.advance(dt))finish();else paintBoat();},
    open(onClose){if(!openDialog(dialog))return;returnTo=onClose;game=createCrystalSignal();previousPhase=null;render();$('signal-title').focus({preventScroll:true});}
  };
}

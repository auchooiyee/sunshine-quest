import {createCanyonLanding,CANYON,CANYON_KEY} from '../missions/canyon-landing.js';
import {renderAppliedGraph} from './applied-graph.js';

const scene=`<svg id="canyon-scene" viewBox="0 0 720 208" role="img"><title></title>
  <defs><linearGradient id="canyon-ridge" x2="0" y2="1"><stop stop-color="#bc8864"/><stop offset="1" stop-color="#684954"/></linearGradient><radialGradient id="canyon-sun"><stop stop-color="#f6da99" stop-opacity=".7"/><stop offset="1" stop-color="#f6da99" stop-opacity="0"/></radialGradient></defs>
  <circle cx="193" cy="47" r="64" fill="url(#canyon-sun)"/><circle cx="193" cy="47" r="21" fill="#ffe5a9"/>
  <path d="M0 96l44 -7 39 30 72 -12 41 27 79 -30 54 21 33 -10 56 -30 67 16 54 -22 59 24 54 -31 68 18v118H0Z" fill="#956c6b" opacity=".68"/>
  <path d="M0 120h76l35 15 20 17 31 56H0Z M720 100h-73l-40 16h-40l-48 17h-55l-49 14h-40l-45 18h-49l-42 15 18 28h463Z" fill="url(#canyon-ridge)"/>
  <path d="M0 120h76l35 15 20 17 M720 100h-73l-40 16h-40l-48 17h-55l-49 14h-40l-45 18h-49l-42 15" fill="none" stroke="#e3bd81" stroke-width="4"/>
  <path d="M7 155h70l25 15 9 14 M706 132h-55l-30 13h-53l-40 17h-66l-42 14h-38l-35 15h-34 M672 160l-59 7 -36 18h-58l-48 14" fill="none" stroke="#e4a97e" stroke-width="2" opacity=".7"/>
  <g transform="translate(674 103)"><path d="M-24 0h48l-7 -31h-34z" fill="#67493f" stroke="#4d3e39" stroke-width="3"/><path d="M-28 -29 0 -54l28 25Z" fill="#435f52" stroke="#3e4d43" stroke-width="4"/><path id="canyon-lookout-light" d="M-10 -27h20v13h-20Z" fill="#786e61"/></g>
  <path id="canyon-flight-path" fill="none" stroke="#f1ddab" stroke-opacity=".68" stroke-width="2" stroke-dasharray="5 6" style="display:none"/>
  <g id="canyon-pad" style="display:none"><path d="M-17 1v26M17 1v26M-17 23 17 8" fill="none" stroke="#735543" stroke-width="3"/><ellipse rx="31" ry="7" fill="#694b4c"/><ellipse rx="24" ry="5" fill="#e4c783" stroke="#6a5547" stroke-width="2"/><path d="M-5 -3v6m10 -6v6m-10 -3H5" fill="none" stroke="#5e5941" stroke-width="1.6"/></g>
  <g id="canyon-glider" transform="translate(75 81)"><path d="M-37 -9 37 -9 13 6H-14Z" fill="#ead297" stroke="#634d48" stroke-width="3"/><path d="M-22 -9 0 -20l22 11Z" fill="#aa694e" stroke="#6e4b40" stroke-width="2"/><path d="M-10 6v5m20 -5v5" stroke="#594643" stroke-width="2"/><rect x="-11" y="11" width="22" height="12" rx="2" fill="#ba8951" stroke="#6d4d37" stroke-width="2"/></g>
  <g id="canyon-crate" style="display:none"><path d="M-11 -2v-16h22v16Z" fill="#bf8954" stroke="#644732" stroke-width="2"/><path d="M-9 -16 9 -3m0 -13L-9 -3" stroke="#e8b577" stroke-width="2"/></g>
</svg>`;
const start={x:75,y:81};
const landing=point=>({x:246+point.x*68,y:184-point.y*19});
const flightPoint=(end,p)=>({x:start.x+(end.x-start.x)*p,y:start.y+(end.y-22-start.y)*p-Math.sin(p*Math.PI)*31});
const coords=`<option value="">—</option>${Array.from({length:CANYON.bound+1},(_,n)=>`<option>${n}</option>`).join('')}`;

export function createCanyonUI({t,openDialog,switchLanguage,storage,tone,getPlayerName,getLanguage,getFieldBadges}){
  let game=createCanyonLanding(),earned=false,returnTo=null,previousPhase,geometry;
  try{earned=storage.getItem(CANYON_KEY)==='earned';}catch{}
  const dialog=document.createElement('dialog');dialog.id='canyon-landing';dialog.setAttribute('aria-labelledby','canyon-title');
  dialog.innerHTML=`<div class="rescue-head"><div><span class="eyebrow" data-i18n="canyonEyebrow"></span><h2 id="canyon-title" tabindex="-1" data-i18n="canyonTitle"></h2></div><div class="rescue-head-actions"><button id="canyon-language" class="outline" aria-label="Language / Bahasa">EN / BM</button><button id="canyon-exit" class="outline" data-i18n="rescueExit"></button></div></div>
    <ol class="rescue-steps canyon-steps">${['Survey','Check','Land'].map((step,i)=>`<li><span>${i+1}</span><b data-i18n="canyonStep${step}"></b></li>`).join('')}</ol>
    <p id="canyon-objective" tabindex="-1" role="status"></p>
    <div class="canyon-visuals"><div class="canyon-stage">${scene}<span id="canyon-player" dir="auto"></span><span id="canyon-pad-label"></span></div><div class="canyon-chart"><svg id="canyon-graph" viewBox="0 0 540 360" role="img"></svg></div></div>
    <div class="canyon-legend"><span><i></i><span data-i18n="canyonSolid"></span></span><span><i class="dashed"></i><span data-i18n="canyonDashed"></span></span></div>
    <ul id="canyon-rules">${CANYON.constraints.map((rule,i)=>`<li data-rule="${i}"><strong>${rule.label}</strong><span></span></li>`).join('')}</ul>
    <form id="canyon-plan"><div class="canyon-plan-controls"><label>x <select id="canyon-x">${coords}</select></label><label>y <select id="canyon-y">${coords}</select></label><button id="canyon-check" class="primary" type="submit" data-i18n="canyonCheck"></button><button id="canyon-launch" class="primary" type="button" hidden data-i18n="canyonLaunch"></button></div></form>
    <p id="canyon-feedback" role="alert" hidden></p><details id="canyon-hint"><summary data-i18n="rescueHint"></summary><p data-i18n="canyonHint"></p></details><button id="canyon-skip" class="outline" hidden data-i18n="canyonSkip"></button>
    <div id="canyon-finish" hidden><div class="rescue-badge"><span aria-hidden="true">✦</span><strong data-i18n="canyonBadge"></strong></div><p id="canyon-storm-note"></p><div class="rescue-controls"><button id="canyon-storm" class="primary" hidden data-i18n="stormNext"></button><button id="canyon-map" class="primary" data-i18n="canyonMap"></button><button id="canyon-replay" class="outline" data-i18n="rescueReplay"></button></div></div>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const step={plan:0,ready:1,flying:2,complete:3};
  const phaseText={plan:'canyonPlan',ready:'canyonReady',flying:'canyonFlying',complete:'canyonComplete'};
  const fill=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  const show=(id,visible)=>$(id).style.display=visible?'':'none';
  function paintGlider(){
    const {point,progress,phase}=game;
    const {x,y}=phase==='flying'||phase==='complete'?flightPoint(landing(point),progress):start;
    $('canyon-glider').setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  }
  function render(focus=false){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const {phase,point,review}=game;
    const changed=phase!==previousPhase;previousPhase=phase;dialog.dataset.phase=phase;
    const planning=phase==='plan'||phase==='ready',safe=phase!=='plan',done=phase==='complete';
    const hasPoint=point.x!==null&&point.y!==null,pointLabel=hasPoint?`(${point.x}, ${point.y})`:'—';
    [...dialog.querySelectorAll('.canyon-steps li')].forEach((el,i)=>{el.classList.toggle('done',i<step[phase]);if(i===step[phase])el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('canyon-player').textContent=getPlayerName();$('canyon-objective').textContent=fill(phaseText[phase],{point:pointLabel});
    $('canyon-plan').hidden=!planning;$('canyon-check').hidden=phase!=='plan';$('canyon-launch').hidden=phase!=='ready';$('canyon-skip').hidden=phase!=='flying';$('canyon-finish').hidden=!done;
    const badges=done?getFieldBadges():0,stormReady=badges===5;
    $('canyon-storm').hidden=!stormReady;$('canyon-storm-note').hidden=stormReady;$('canyon-storm-note').textContent=fill('stormLocked',{earned:badges});
    $('canyon-map').className=stormReady?'outline':'primary';
    $('canyon-hint').hidden=phase!=='plan';if(changed)$('canyon-hint').open=false;
    $('canyon-x').value=point.x??'';$('canyon-y').value=point.y??'';
    const failed=phase==='plan'&&review!==null;
    $('canyon-feedback').hidden=!failed;
    $('canyon-feedback').textContent=failed?t(!review.length?'canyonSelectBoth':review.some(result=>result.excluded)?'canyonBoundary':'canyonInvalid'):'';
    const graph=renderAppliedGraph({kind:'inequality',model:{...CANYON,unitGrid:true},title:{en:t('canyonGraph'),ms:t('canyonGraph')}},hasPoint?point:{},getLanguage());
    geometry=graph.geometry;$('canyon-graph').innerHTML=graph.markup;
    const marker=$('canyon-graph').querySelector('circle');if(marker)marker.setAttribute('fill',safe?'#2d7858':failed?'#ab4d3c':'#bd8a2e');
    $('canyon-graph').querySelectorAll('line').forEach((line,i)=>{if(review?.[i]&&!review[i].accepted){line.setAttribute('stroke','#aa4938');line.setAttribute('stroke-width','4');}});
    for(const el of dialog.querySelectorAll('[data-rule]')){
      const result=review?.[Number(el.dataset.rule)];el.classList.toggle('canyon-pass',Boolean(result?.accepted));el.classList.toggle('canyon-fail',Boolean(result&&!result.accepted));
      el.querySelector('span').textContent=result?`${t(result.accepted?'canyonPass':'canyonFail')} · ${fill('canyonTestValue',{value:result.value})}`:'';
    }
    $('canyon-scene').querySelector('title').textContent=t('canyonScene');
    $('canyon-pad-label').textContent=`${t('canyonPoint')}: ${pointLabel}`;
    show('canyon-pad',safe);show('canyon-flight-path',phase==='flying');show('canyon-crate',done);show('canyon-glider',!done);
    if(safe){const end=landing(point);$('canyon-pad').setAttribute('transform',`translate(${end.x} ${end.y})`);$('canyon-crate').setAttribute('transform',`translate(${end.x} ${end.y})`);$('canyon-flight-path').setAttribute('d','M'+Array.from({length:17},(_,i)=>{const {x,y}=flightPoint(end,i/16);return `${x.toFixed(2)} ${y.toFixed(2)}`;}).join(' L'));}
    paintGlider();
    if(focus&&changed)$(phase==='ready'?'canyon-launch':done?(stormReady?'canyon-storm':'canyon-map'):'canyon-objective').focus({preventScroll:true});
  }
  $('canyon-x').onchange=$('canyon-y').onchange=()=>{
    const parse=value=>value===''?null:Number(value);
    game.select(parse($('canyon-x').value),parse($('canyon-y').value));render();
  };
  $('canyon-graph').onclick=event=>{
    if(!geometry||!['plan','ready'].includes(game.phase))return;
    const {W,H,left,right,top,bottom,maxX,maxY}=geometry;
    const point=new DOMPoint(event.clientX,event.clientY).matrixTransform($('canyon-graph').getScreenCTM().inverse());
    if(point.x<left-5||point.x>W-right+5||point.y<top-5||point.y>H-bottom+5)return;
    game.select(Math.round((point.x-left)/(W-left-right)*maxX),Math.round((H-bottom-point.y)/(H-bottom-top)*maxY));render();
  };
  function finish(){earned=true;try{storage.setItem(CANYON_KEY,'earned');}catch{}tone('win');render(true);}
  $('canyon-plan').onsubmit=event=>{event.preventDefault();if(game.check())tone('pickup');render(true);};
  $('canyon-launch').onclick=()=>{if(game.launch()){tone('craft');render(true);}};
  $('canyon-skip').onclick=()=>{if(game.advance(CANYON.duration))finish();};
  $('canyon-replay').onclick=()=>{game=createCanyonLanding();previousPhase=null;render(true);};
  $('canyon-language').onclick=switchLanguage;$('canyon-exit').onclick=$('canyon-map').onclick=()=>dialog.close();
  $('canyon-storm').onclick=()=>dialog.close('storm');
  dialog.addEventListener('close',()=>{const callback=returnTo;returnTo=null;const destination=dialog.returnValue;if(callback)setTimeout(()=>callback(destination),0);});
  return {get earned(){return earned;},render,
    tick(dt){if(!dialog.open||game.phase!=='flying')return;if(game.advance(dt))finish();else paintGlider();},
    open(onClose){if(!openDialog(dialog))return;returnTo=onClose;dialog.returnValue='';game=createCanyonLanding();previousPhase=null;render();$('canyon-title').focus({preventScroll:true});}
  };
}

import { createGame } from './engine.js';
import { createForestRenderer } from './src/forest-renderer.js';
import { createQuest } from './src/missions/quest.js';
import { designModel, valueAt, vertex, roots, parseNumber, formatQuadratic } from './src/math/quadratics.js';
import {selectVariant,variantOptions,selectDifficulty} from './src/math/variants.js';
import {learningCSV} from './src/learning/report.js';
import { loadSave, writeSave, decodeSave, STORAGE_KEY, CONTENT_VERSION } from './src/storage/save-store.js';
import { WORLDS, REGIONS, getWorld, worldText } from './config/worlds.js';
import { FINAL_WORLD } from './config/finale.js';
import { supplyManifest, finaleExample, isFinaleUnlocked } from './src/missions/finale.js';
import { encodeAssignment, decodeAssignment, assignmentKey, assignmentCurriculum } from './src/missions/assignment.js';
import { renderAppliedGraph } from './src/ui/applied-graph.js';
import { applicationFor } from './src/missions/application.js';
import en from './locales/en.js';
import ms from './locales/ms.js';
import { en as expeditionEN, ms as expeditionMS } from './locales/expedition.js';
import { en as finaleEN, ms as finaleMS } from './locales/finale.js';
import {en as practiceEN,ms as practiceMS} from './locales/practice.js';
import {en as pilotEN,ms as pilotMS} from './locales/pilot.js';
import {fetchJSON,settleLoads} from './src/loading.js';
import {createTutorial} from './src/ui/tutorial.js';
import {adventureFor} from './config/adventures.js';
import {constructionsFor,constructionSummary} from './src/missions/constructions.js';
import {en as adventureEN,ms as adventureMS} from './locales/adventure.js';
import {en as learningEN,ms as learningMS} from './locales/learning.js';
import {newRun,archiveRun} from './src/learning/history.js';
import {diagnostic} from './src/learning/feedback.js';
import {createLearningTools,download} from './src/ui/learning-tools.js';
import {assignmentURL,assignmentFromURL} from './src/missions/assignment.js';
import {en as levelsEN,ms as levelsMS} from './locales/levels.js';

const $ = id => document.getElementById(id);
const storage = { getItem:key=>localStorage.getItem(key), setItem:(key,value)=>localStorage.setItem(key,value) };
const assignmentParam=new URLSearchParams(location.search).get('assignment');
const assignment=assignmentParam?assignmentFromURL(location.href):null;
const saveKey=assignment?assignmentKey(assignment):STORAGE_KEY;
const stored = loadSave(storage,saveKey);
let currentWorld=getWorld(assignment?.world||stored.data?.currentRegion),regions=stored.data?.regions||{};
let language=stored.data?.language || assignment?.language || 'en', assist=assignment?assignment.assist:stored.data?.assist !== false;
let history=stored.data?.history||[];
const messages={en:{...en,...expeditionEN,...finaleEN,...practiceEN,...pilotEN,...adventureEN,...learningEN,...levelsEN},ms:{...ms,...expeditionMS,...finaleMS,...practiceMS,...pilotMS,...adventureMS,...learningMS,...levelsMS}};
const t = key => assignment?.tasks===3&&['questLead','introText','finishedText'].includes(key)?messages[language].shortMissionText:key==='guardian'&&adventureFor(currentWorld.id)?adventureFor(currentWorld.id).guardian[language]:worldText(currentWorld,key,language) || messages[language][key] || messages.en[key] || key;
const game=createGame(regions[currentWorld.id]?.world,{mathQuest:true,assist});
const curricula=new Map();
let previewTime=0,previewRunning=false;
let curriculum, quest, loaded=false, autosave=0, last=0, toastUntil=0, uiSignature='', feedback=null, rootPick=0, soundOn=false, audioContext;
let modalWasPlaying=false, openingModal=false, replacingSave=false;
let loadingNow=false, loadingPhase='loadingLessons', loadFailed=false, recoveryPending=stored.damaged, modalOpener=null;
let reportLabel=stored.data?.reportLabel||'',restartWithVariant=false;
const input={}, stage=$('stage');
const renderer=createForestRenderer($('world'),stage,game,()=>quest,t,()=>currentWorld.id,()=>currentWorld);
const tutorial=createTutorial({t,openDialog,switchLanguage});
const stationX=id=>currentWorld.id==='finale'?FINAL_WORLD.stations[id]:adventureFor(currentWorld.id).stations[id];
const benchX=()=>adventureFor(currentWorld.id)?.bench??1450;
const dialogs=[...document.querySelectorAll('dialog')];
const anyModal=()=>dialogs.some(d=>d.open);
const escaped = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clearInput(){for(const key of Object.keys(input))input[key]=false;document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('pressed'));}
function snapshotSave(){const previous=regions[currentWorld.id]||{};regions[currentWorld.id]={...previous,run:previous.run||newRun(),reviews:previous.reviews||{},world:game.save(),quest:quest.save()};return {regions,history,currentRegion:currentWorld.id,assignment,language,assist,reportLabel};}
const learningTools=createLearningTools({context:()=>{snapshotSave();return {region:regions[currentWorld.id],history,bank:selectDifficulty(curricula.get(currentWorld.id),assignment?.level),bankFor:id=>assignmentCurriculum(curricula.get(id),assignment),quest,language};},persist,t,openDialog,openJournal:()=>{renderJournal();openDialog($('journal'));}});
function persist(){if(!loaded||!quest||replacingSave)return;if(!recoveryPending)stored.available=writeSave(storage,snapshotSave(),saveKey);$('save-status').textContent=t(recoveryPending?'recoveryStatus':stored.available?'saveOK':'saveBad');}
function toast(key){$('toast').textContent=t(key);$('toast').hidden=false;toastUntil=performance.now()+3500;}
function tone(name){
  if(!soundOn)return;
  try{audioContext ||= new AudioContext();if(audioContext.state==='suspended')audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain(),at=audioContext.currentTime;const notes={jump:440,pickup:650,craft:770,win:880,hurt:160,swing:220};o.frequency.value=notes[name]||330;g.gain.setValueAtTime(.045,at);g.gain.exponentialRampToValueAtTime(.001,at+.15);o.connect(g);g.connect(audioContext.destination);o.start(at);o.stop(at+.16);}catch{soundOn=false;$('sound-button').setAttribute('aria-pressed','false');}
}
function configureWorld(){
  const completed=quest.completed;
  const final=currentWorld.id==='finale',saved=quest.save();
  const route=adventureFor(currentWorld.id),built=constructionsFor(currentWorld.id,quest);
  const limit=final?(quest.next?.gateLimit??4165):(route.gates.find(([id])=>!completed.includes(id))?.[1]??4193)-28;
  const bridgeId=final?'bridge':'design';
  const blueprint=['quadratics','finale'].includes(currentWorld.id)&&completed.includes(bridgeId)?saved.sessions[bridgeId].draft:null;
  const effects=quest.challenges.filter(def=>completed.includes(def.id)).map(def=>applicationFor(def,saved.sessions[def.id].draft)).filter(Boolean);
  const application=final?{kind:'expedition',effects}:built.effects.length?{kind:'expedition',effects:built.effects}:null;
  const lastDef=quest.challenges.find(d=>d.id===completed.at(-1));
  game.configureQuest({limit,route,checkpoint:lastDef?stationX(lastDef.station)-75:180,constructions:built.items,...(!final?{blueprints:built.bridges}:{}),blueprint:blueprint?{span:parseNumber(blueprint.span),k:parseNumber(blueprint.k),...(final?{origin:820}:{})}:null,application,shields:quest.complete?0:final?Math.ceil((5-completed.length)*3/5):3-completed.filter(id=>id.startsWith('guardian-')).length,complete:quest.complete,assist});
}
function applyLanguage(){
  document.documentElement.lang=language;
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
  $('language').textContent=language==='en'?'EN / BM':'BM / EN';$('challenge-language').textContent=$('language').textContent;
  $('challenge-close').setAttribute('aria-label',t('close'));$('math-graph').setAttribute('aria-label',t('graphText'));
  for(const button of document.querySelectorAll('[data-close]'))button.setAttribute('aria-label',t('close'));
  $('stage').setAttribute('aria-label',`${t('moveHelp')}: A / D. ${t('jumpHelp')}: Space. ${t('actionHelp')}: J. ${t('interactHelp')}: E.`);
  $('assist').checked=assist;
  $('assist').disabled=Boolean(assignment);
  $('question-set').textContent=`${assignment?.level?t(assignment.level==='foundation'?'foundation':'challengeLevel')+' · ':''}${t('questionSet')}: ${t(['setOriginal','setB','setC'][quest?.variantIndex||0])}`;
  $('question-set').hidden=currentWorld.id==='finale';
  $('region-number').textContent=currentWorld.id==='finale'?t('finale'):`${String(WORLDS.indexOf(currentWorld)+1).padStart(2,'0')} / 05`;
  $('class-banner').hidden=!assignment;
  $('class-label').textContent=assignment?`${t('classMode')} · ${assignment.tasks} ${t('checks')} · ${t(assignment.guided?'guided':'independentMode')}${assignment.instanceId?` · ${t('lessonIdentity')}: ${assignment.instanceId.slice(-8)}${assignment.dueLabel?' · '+assignment.dueLabel:''}`:''}`:'';
  $('leave-class').hidden=!assignment;
  if($('region-map').open)renderRegionMap();
  if($('teacher').open){renderTeacherPreview();learningTools.renderReports();}
  if(loaded){$('start-button').textContent=t(game.state.elapsed>0 || quest.completed.length?'continue':'start');updateUI(true);}
  if($('challenge').open)renderChallenge();
  if($('journal').open)renderJournal();
  if($('workshop').open)renderWorkshop();
  tutorial.render();
  renderAdventure();
  $('load-message').textContent=t(loadFailed?'loadError':loadingPhase);
  $('save-recovery').hidden=!recoveryPending;
  persist();
}
function switchLanguage(){language=language==='en'?'ms':'en';applyLanguage();}
function openDialog(dialog){
  if(anyModal())return false;
  clearInput();modalOpener=document.activeElement;modalWasPlaying=game.state.mode==='playing';
  if(modalWasPlaying)game.togglePause();openingModal=true;dialog.showModal();openingModal=false;updateUI(true);return true;
}
function handleDialogClose(dialog){
  clearInput();
  if(dialog.id==='completion' && quest.complete)game.start();
  if(dialog.id==='challenge'){
    previewRunning=false;
    const completedChallenge=feedback?.correct===true;
    quest.close();feedback=null;
    if(completedChallenge && quest.complete){modalWasPlaying=false;showCompletion();return;}
  }
  if(modalWasPlaying && game.state.mode==='paused')game.togglePause();
  modalWasPlaying=false;persist();updateUI(true);
  if(!anyModal())(modalOpener?.isConnected&&modalOpener.getClientRects().length?modalOpener:stage).focus({preventScroll:true});
}
for(const dialog of dialogs)dialog.addEventListener('close',()=>handleDialogClose(dialog));
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>$(button.dataset.close).close();
function updateUI(force=false){
  if(!quest)return;
  const s=game.state, next=quest.next, at=next?.station, p=s.player;
  const near=next && Math.abs(p.x-stationX(at))<160;
  const workshop=!near && Math.abs(p.x-benchX())<130;
  const signature=[currentWorld.id,language,s.mode,p.hp,s.wood,s.stone,s.equipment,quest.completed.length,quest.independent,Math.floor(p.x/50),near,workshop,assist,anyModal()].join('|');
  const fraction=Math.min(1,Math.max(0,(p.x-180)/(stationX('guardian')-180)));$('trail-progress').style.width=(fraction*100)+'%';$('trail-player').style.left=(fraction*100)+'%';
  if(!force&&signature===uiSignature)return;uiSignature=signature;
  $('intro').hidden=s.mode!=='ready';$('pause-overlay').hidden=s.mode!=='paused'||anyModal();
  $('hearts').textContent=Array.from({length:5},(_,i)=>p.hp>=i+1?'♥':p.hp>i?'◐':'♡').join(' ');$('hearts').setAttribute('aria-label',`${t('health')}: ${p.hp.toFixed(1)} / 5`);
  $('wood-count').textContent=s.wood;$('stone-count').textContent=s.stone;
  $('equip-sword').setAttribute('aria-pressed',String(s.equipment==='sword'));$('equip-axe').setAttribute('aria-pressed',String(s.equipment==='axe'));
  const maxXP=curriculum.challenges.reduce((sum,d)=>sum+d.reward,0),checks=curriculum.challenges.length;
  $('xp-total').innerHTML=`${quest.xp} <small>/ ${maxXP}</small>`;$('xp-progress').max=maxXP;$('xp-progress').value=quest.xp;$('independent-count').innerHTML=`${quest.independent} <small>/ ${checks}</small>`;
  const ids=[...new Set(curriculum.challenges.map(d=>d.station))];
  $('mission-list').innerHTML=ids.map((id,i)=>{
    const group=curriculum.challenges.filter(d=>d.station===id),remaining=group.filter(d=>!quest.completed.includes(d.id)).length;
    const done=remaining===0,active=at===id;
    const status=done?t('completed'):active?t('next'):t('locked');
    return `<li class="${done?'done':active?'active':'locked'}" ${active?'aria-current="step"':''}><span class="mission-number">${done?'✓':String(i+1).padStart(2,'0')}</span><span><b>${escaped(t(id))}</b><small>${escaped(status)}${id==='guardian'&&group.length>1&&!done?' · '+remaining+' '+escaped(t('shields')):''}</small></span></li>`;
  }).join('');
  $('objective-text').textContent=assignment?.level&&next?next.prompt[language]:t(next?'objective'+at[0].toUpperCase()+at.slice(1):'objectiveDone');
  $('checkpoint').hidden=!assist||quest.complete;$('checkpoint').disabled=!loaded||anyModal();
  $('interaction').hidden=s.mode!=='playing'||(!near&&!workshop);
  $('interaction').querySelector('span').textContent=t(near?at:'craft');
  $('location').textContent=p.x<420?t('trailHome'):t((adventureFor(currentWorld.id)?.gates||FINAL_WORLD.gates).find(([,x])=>p.x<x)?.[0]||'guardian');
  $('save-status').textContent=t(recoveryPending?'recoveryStatus':stored.available?'saveOK':'saveBad');
  $('pause-button').textContent=t(s.mode==='paused'?'resume':'pause');
  $('completion-stats').textContent=`${quest.xp} XP · ${quest.independent} / ${checks} ${t('independent')}`;
  renderManifest();
  renderAdventure();
}
function begin(){if(!loaded||anyModal())return;game.start();clearInput();stage.focus({preventScroll:true});persist();updateUI(true);}
function interact(){
  if(!loaded||anyModal())return;
  if(game.state.mode==='ready'){begin();return;}
  if(game.state.mode!=='playing')return;
  if(quest.complete){toast('allComplete');return;}
  const next=quest.next;
  if(Math.abs(game.state.player.x-stationX(next.station))<160){openChallenge(next.id);return;}
  if(Math.abs(game.state.player.x-benchX())<130){renderWorkshop();openDialog($('workshop'));return;}
  toast('needStation');
}
function openChallenge(id){
  if(anyModal()||!quest.start(id))return;
  prepareDraft();
  feedback=null;rootPick=0;previewTime=0;previewRunning=false;renderChallenge();openDialog($('challenge'));persist();
}
function prepareDraft(){
  if(assignment?.guided&&quest.session.hints===0&&quest.session.attempts===0)quest.hint();
  for(const f of quest.active.fields||[]){const value=parseNumber(quest.session.draft[f.key]);if(f.type==='range'&&(value===null||value<f.min||value>f.max||Math.abs((value-f.min)/f.step-Math.round((value-f.min)/f.step))>1e-6))quest.edit({[f.key]:f.initial??f.min});}
  if(quest.active.kind==='design'){
    const draft=quest.session.draft;
    const span=parseNumber(draft.span), k=parseNumber(draft.k);
    quest.edit({span:span!==null&&span>=4&&span<=10?span:quest.active.model.span,k:k!==null&&k>=.25&&k<=1.5?k:quest.active.model.k});
  }
}
function addField(key,label,value,{min,max,step}={}){
  const wrapper=document.createElement('label');wrapper.className='field';
  const header=document.createElement('span');header.textContent=label;
  const output=document.createElement('b');output.id='value-'+key;
  const inputEl=document.createElement('input');inputEl.id='answer-'+key;inputEl.name=key;
  inputEl.type=min===undefined?'text':'range';inputEl.value=value??'';inputEl.autocomplete='off';
  if(min!==undefined){inputEl.min=min;inputEl.max=max;inputEl.step=step;output.textContent=inputEl.value;header.append(output);}
  else{inputEl.inputMode='decimal';inputEl.maxLength=32;inputEl.placeholder='…';}
  inputEl.disabled=feedback?.correct===true;
  inputEl.addEventListener('input',()=>{quest.edit({[key]:inputEl.value});if(output)output.textContent=inputEl.value;feedback=null;$('feedback').hidden=true;renderGraph();persist();});
  wrapper.append(header,inputEl);$('answer-fields').append(wrapper);
}
function renderChallenge(){
  const def=quest.active;if(!def)return;
  $('challenge-eyebrow').textContent=t(def.station==='guardian'?'guardianLabel':'challengeLabel');
  $('challenge-title').textContent=def.title[language];$('challenge-prompt').textContent=def.prompt[language];
  const route=adventureFor(currentWorld.id),guardian=def.station==='guardian'&&route;
  $('guardian-encounter').hidden=!guardian;
  if(guardian){$('guardian-name').textContent=route.guardian[language];$('guardian-phases').textContent=`${t('guardianProgress')}: ${quest.completed.filter(id=>id.startsWith('guardian-')).length} / 3`;$('guardian-encounter').style.setProperty('--region-accent',route.colors[2]);}
  $('inspect-world').hidden=!feedback?.correct||quest.complete;
  $('answer-fields').replaceChildren();const draft=quest.session.draft;
  if(def.fields){for(const f of def.fields)addField(f.key,f.label[language],draft[f.key],f.type==='range'?f:{});}
  else if(def.kind==='design'){
    const target=document.createElement('div');target.className='target-card';target.innerHTML=`${escaped(t('target'))}<strong>${def.target.span} m · ${def.target.height} m</strong>`;$('answer-fields').append(target);
    addField('span',t('span'),draft.span,{min:4,max:10,step:1});addField('k',t('scale'),draft.k,{min:.25,max:1.5,step:.25});
  }else if(def.kind==='roots'){addField('first',t('firstRoot'),draft.first);addField('second',t('secondRoot'),draft.second);}
  else{addField('x',t('vertexX'),draft.x);addField('y',t('vertexY'),draft.y);}
  if(def.evidence?.length){const title=document.createElement('h3');title.textContent=t('reasoningCheck');$('answer-fields').append(title);for(const f of def.evidence)addField(f.key,f.label[language],draft[f.key]);}
  $('submit-answer').hidden=feedback?.correct===true;$('continue-challenge').hidden=feedback?.correct!==true;
  $('continue-challenge').textContent=t(def.station==='guardian'&&!quest.complete?'nextPhase':'continueQuest');
  $('preview-action').hidden=def.kind!=='motion-plan';$('preview-action').textContent=t('previewPlan');
  renderHints();renderGraph();renderFeedback();
}
function renderHints(){
  const def=quest.active;if(!def)return;
  $('hints').replaceChildren();for(const text of def.hints[language].slice(0,quest.session.hints)){const li=document.createElement('li');li.textContent=text;$('hints').append(li);}
  $('hint-button').textContent=t(quest.session.hints>=3?'hintDone':quest.session.hints?'nextHint':'hint');$('hint-button').disabled=quest.session.hints>=3||feedback?.correct===true;
}
let graphGeometry;
function renderGraph(){
  const def=quest.active;if(!def)return;const draft=quest.session.draft;
  if(def.fields){
    const graph=renderAppliedGraph(def,draft,language,previewTime);graphGeometry=graph.geometry;
    $('math-graph').innerHTML=graph.markup;$('math-graph').setAttribute('aria-label',def.title[language]);
    $('equation').textContent=graph.equation;$('graph-summary').textContent=graph.summary;
    $('graph-instructions').hidden=false;$('graph-instructions').textContent=graph.instructions;return;
  }
  const model=def.kind==='design'?designModel(Number(draft.span),Number(draft.k)):def.model;
  const maxY=def.kind==='design'?Math.max(14,def.target.height*1.25,vertex(model).y*1.15):Math.max(12,vertex(model).y*1.2);
  const minX=-1,maxX=11,minY=-2,W=540,H=360,left=46,right=20,top=22,bottom=35;
  const sx=x=>left+(x-minX)/(maxX-minX)*(W-left-right),sy=y=>H-bottom-(y-minY)/(maxY-minY)*(H-top-bottom);
  graphGeometry={minX,maxX,minY,maxY,left,right,top,bottom,W,H};
  let markup=`<title>${escaped(t('graphText'))}</title><defs><clipPath id="plot-clip"><rect x="${left}" y="${top}" width="${W-left-right}" height="${H-top-bottom}"/></clipPath></defs>`;
  for(let x=0;x<=10;x++)markup+=`<line x1="${sx(x)}" x2="${sx(x)}" y1="${top}" y2="${H-bottom}" stroke="#dce5d2"/><text x="${sx(x)}" y="${sy(0)+19}" text-anchor="middle" font-size="10" fill="#7b8e6d">${x}</text>`;
  const tick=maxY>22?5:2;for(let y=0;y<=maxY;y+=tick)markup+=`<line x1="${left}" x2="${W-right}" y1="${sy(y)}" y2="${sy(y)}" stroke="#dce5d2"/><text x="${sx(0)-9}" y="${sy(y)+4}" text-anchor="end" font-size="10" fill="#7b8e6d">${y}</text>`;
  markup+=`<line x1="${left}" x2="${W-right}" y1="${sy(0)}" y2="${sy(0)}" stroke="#839873"/><line x1="${sx(0)}" x2="${sx(0)}" y1="${top}" y2="${H-bottom}" stroke="#839873"/><text x="${W-right}" y="${sy(0)-8}" text-anchor="end" fill="#4d7044" font-size="12">x (m)</text><text x="${sx(0)+9}" y="${top+8}" fill="#4d7044" font-size="12">y (m)</text>`;
  let path='';for(let i=0;i<=180;i++){const x=minX+(maxX-minX)*i/180;path+=(i?' L':'M')+sx(x).toFixed(2)+' '+sy(valueAt(model,x)).toFixed(2);}
  markup+=`<g clip-path="url(#plot-clip)"><path d="${path}" fill="none" stroke="#2e6b4b" stroke-width="3.5" stroke-linecap="round"/>`;
  const points=[];
  if(def.kind==='roots'){for(const key of ['first','second']){const x=parseNumber(draft[key]);if(x!==null)points.push({x,y:0});}}
  if(def.kind==='vertex'){const x=parseNumber(draft.x),y=parseNumber(draft.y);if(x!==null&&y!==null)points.push({x,y});}
  if(def.kind==='design')points.push(vertex(model));
  for(const point of points)markup+=`<circle cx="${sx(point.x)}" cy="${sy(point.y)}" r="6" fill="#d1a443" stroke="#fffbee" stroke-width="2"/>`;
  markup+='</g>';$('math-graph').innerHTML=markup;
  $('equation').textContent=def.kind==='design'?`y = ${Number(draft.k)}x(${Number(draft.span)} − x)`:`y = ${formatQuadratic(model)}`;
  $('graph-instructions').hidden=def.kind==='design';
  $('graph-instructions').textContent=t('graphHelp');
  $('graph-summary').textContent=def.kind==='design'?`${t('span')}: ${draft.span} · ${t('height')}: ${Number(vertex(model).y.toFixed(2))} m`:points.length?points.map(p=>`(${p.x}, ${p.y})`).join('  ·  '):t('noSelection');
}
$('math-graph').addEventListener('click',event=>{
  const def=quest.active;if(!def||!['roots','vertex','inequality'].includes(def.kind)||feedback?.correct||!graphGeometry)return;
  const svg=$('math-graph'),matrix=svg.getScreenCTM();if(!matrix)return;
  const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()),g=graphGeometry;
  if(point.x<g.left||point.x>g.W-g.right||point.y<g.top||point.y>g.H-g.bottom)return;
  const x=Math.round(g.minX+(point.x-g.left)/(g.W-g.left-g.right)*(g.maxX-g.minX));
  const y=Math.round(g.minY+(g.H-g.bottom-point.y)/(g.H-g.top-g.bottom)*(g.maxY-g.minY));
  if(def.kind==='roots'){const key=rootPick++%2===0?'first':'second';quest.edit({[key]:String(x)});$('answer-'+key).value=x;}
  else{quest.edit({x:String(x),y:String(y)});$('answer-x').value=x;$('answer-y').value=y;}
  feedback=null;$('feedback').hidden=true;renderGraph();persist();
});
function renderFeedback(){
  $('feedback').hidden=!feedback;if(!feedback)return;
  $('feedback').classList.toggle('error',!feedback.correct);
  const title=document.createElement('strong');title.textContent=t(feedback.correct?'correct':'incorrect');
  const message=document.createElement('span');message.textContent=feedback.correct?quest.active.explanation[language]:t(feedback.reason==='invalid'?'invalid':diagnostic(quest.active,quest.session.draft)||'wrong'+feedback.reason[0].toUpperCase()+feedback.reason.slice(1));
  $('feedback').replaceChildren(title,message);
  if(feedback.correct){const reward=document.createElement('small');reward.textContent=` +${feedback.reward} ${t('earned')}`;$('feedback').append(reward);}
}
$('answer-form').addEventListener('submit',event=>{
  event.preventDefault();if(!quest.active||feedback?.correct)return;
  feedback=quest.submit();if(feedback.correct){configureWorld();tone('craft');}
  renderChallenge();persist();updateUI(true);
});
$('hint-button').onclick=()=>{quest.hint();renderHints();persist();};
$('challenge-close').onclick=()=>$('challenge').close();
$('inspect-world').onclick=()=>{$('challenge').close();};
$('replay-carts').onclick=()=>{if(!loaded||anyModal())return;game.replayCarts();if(game.state.mode==='ready'||game.state.mode==='complete')game.start();if(game.state.mode==='paused')game.togglePause();persist();stage.focus({preventScroll:true});updateUI(true);};
$('continue-challenge').onclick=()=>{
  if(!feedback?.correct)return;
  if(quest.active.station==='guardian'&&!quest.complete){quest.close();quest.start(quest.next.id);prepareDraft();feedback=null;rootPick=0;previewTime=0;previewRunning=false;renderChallenge();$('challenge').scrollTop=0;persist();return;}
  $('challenge').close();toast('restored');
};
function renderJournal(){
  $('journal-summary').textContent=`${currentWorld.name[language]} · ${quest.xp} XP · ${quest.completed.length} / ${curriculum.challenges.length} ${t('completed')} · ${quest.independent} ${t('independent')}`;
  $('journal-regions').textContent=assignment?t('classIsolated'):WORLDS.map(w=>`${w.name[language]}: ${regionQuest(w).completed.length}/6`).join(' · ');
  $('journal-records').replaceChildren();
  $('report-label').value=reportLabel;
  $('report-scope').textContent=`${t('reportScope')}: ${t(assignment?'reportClass':'reportExpedition')}`;
  $('next-variant').hidden=Boolean(assignment)||currentWorld.id==='finale';
  $('variant-note').hidden=currentWorld.id==='finale';
  $('reset-message').textContent=t(restartWithVariant?'variantResetPrompt':'resetPrompt');
  renderCollection();
  learningTools.renderJournal();
  for(const def of quest.challenges){
    const session=quest.save().sessions[def.id],complete=quest.completed.includes(def.id);
    const status=complete?t(session.independent?'independentPass':'supportedPass'):session.attempts?t('working'):t('notStarted');
    const row=document.createElement('div');row.className='journal-row';row.innerHTML=`<div><strong>${escaped(def.title[language])}</strong><small>${escaped(t('attempts'))}: ${session.attempts} · ${escaped(t('hints'))}: ${session.hints}</small></div><span class="journal-status">${escaped(status)}</span>`;$('journal-records').append(row);
  }
}
function showCompletion(){clearInput();$('completion-stats').textContent=`${quest.xp} XP · ${quest.independent} / ${curriculum.challenges.length} ${t('independent')}`;$('next-region').hidden=Boolean(assignment);openDialog($('completion'));tone('win');persist();}
function renderWorkshop(){
  const names={stoneSword:'craftSword',stoneAxe:'craftAxe',woodArmor:'craftArmor',stoneArmor:'craftStoneArmor'};
  $('recipe-list').replaceChildren();
  for(const recipe of game.getRecipes()){
    const row=document.createElement('div');row.className='recipe';row.innerHTML=`<div><strong>${escaped(t(names[recipe.id]))}</strong><small>${recipe.wood} ${escaped(t('wood'))} · ${recipe.stone} ${escaped(t('stone'))}</small></div>`;
    const button=document.createElement('button');button.className='outline';button.disabled=recipe.owned||!recipe.available;button.textContent=t(recipe.owned?'owned':recipe.available?'craftButton':'needs');
    button.onclick=()=>{if(game.craft(recipe.id)){renderWorkshop();tone('craft');persist();updateUI(true);}};row.append(button);$('recipe-list').append(row);
  }
}
$('start-button').onclick=begin;$('interaction').onclick=interact;
for(const id of ['guide-button','intro-guide'])$(id).onclick=()=>{if(loaded)tutorial.open();};
$('intro-regions').onclick=()=>$('region-button').click();
function joinFromEntry(){if(!loaded)return;if(!$('region-map').open)$('region-button').click();$('join-input').scrollIntoView({block:'center'});$('join-input').focus();}
$('intro-join').onclick=$('map-join').onclick=joinFromEntry;
$('map-continue').onclick=()=>{modalWasPlaying=false;modalOpener=stage;$('region-map').close();if(game.state.mode==='paused')game.togglePause();begin();};
$('recovery-download').onclick=()=>{
  const url=URL.createObjectURL(new Blob([stored.damagedRaw??''],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download='mathwithcye-original-save.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('recovery-replace').onclick=()=>{if(!loaded||!confirm(t('recoveryConfirm')))return;recoveryPending=false;$('save-recovery').hidden=true;persist();};
function regionQuest(world){return world.id===currentWorld.id?quest:createQuest(curricula.get(world.id),regions[world.id]?.quest);}
function finalUnlocked(){return isFinaleUnlocked(WORLDS.map(regionQuest));}
function changeRegion(world){
  if(assignment)return;
  if(world.id==='finale'&&!finalUnlocked()){toast('finaleLocked');return;}
  if(world.id===currentWorld.id){$('region-map').close();return;}
  snapshotSave();modalWasPlaying=false;clearInput();$('region-map').close();
  currentWorld=world;curriculum=curricula.get(world.id);quest=createQuest(curriculum,regions[world.id]?.quest);
  game.restoreSave(regions[world.id]?.world);
  feedback=null;configureWorld();renderer.resetCamera();persist();applyLanguage();updateUI(true);if(quest.complete)showCompletion();
}
function manifestMarkup(){
  const m=supplyManifest(quest.save()),money=n=>`RM${Number(n.toFixed(2))}`;
  const rows=[['manifestStart',money(m.initialBudget)],['manifestBridge',m.stages.bridge?money(m.bridgeCost):t('manifestPending')],['manifestRoute',m.stages.route?money(m.routeCost):t('manifestPending')],['manifestDelivery',m.stages.delivery?money(m.deliveryCost):t('manifestPending')],['manifestAvailable',money(m.available)]];
  if(m.stages.route)rows.push(['manifestDistance',`${m.distance} m`]);
  if(m.stages.budget)rows.push(['manifestSupplies',money(m.supplies)],['manifestSaving',money(m.savings)],['manifestRemainder',money(m.unallocated)]);
  const choices=[];
  if(m.stages.bridge)choices.push(['bridgeChoice',`${m.span} m × RM10 = ${money(m.bridgeCost)}`]);
  if(m.stages.route)choices.push(['routeChoice',`(${m.x}, ${m.y}) → 8(${m.x} + ${m.y}) = ${m.distance} m · RM(10 × ${m.x} + 5 × ${m.y}) = ${money(m.routeCost)}`]);
  if(m.stages.delivery)choices.push(['deliveryChoice',`${m.v1} m/s × ${m.t1} s + 2 m/s × ${10-m.t1} s = ${m.distance} m · RM(5 × ${m.v1} + 2 × ${m.t1}) = ${money(m.deliveryCost)}`]);
  if(m.stages.risk)choices.push(['signalChoice',`${m.x} R + ${m.y} B`]);
  if(m.stages.budget){const d=quest.save().sessions.budget.draft;choices.push(['suppliesChoice',`${d.food} × RM20 + ${d.medical} × RM30 + ${d.lamp} × RM15 = ${money(m.supplies)}`]);}
  return `<dl class="manifest-rows">${rows.map(([label,value])=>`<div class="${label==='manifestAvailable'?'manifest-balance':''}"><dt>${escaped(t(label))}</dt><dd>${escaped(value)}</dd></div>`).join('')}</dl><details class="choice-ledger"><summary>${escaped(t('choiceLedger'))}</summary><dl>${choices.map(([key,value])=>`<dt>${escaped(t(key))}</dt><dd>${escaped(value)}</dd>`).join('')}</dl><p>${escaped(t('choiceNote'))}</p></details>`;
}
function renderAdventure(){
  const route=adventureFor(currentWorld.id);
  $('intro-brief').hidden=$('field-station').hidden=!route;
  $('journal-brief-text').textContent=route?`${route.npc[language]} · ${route.mission[language]}. ${route.brief[language]}`:currentWorld.intro[language];
  document.body.dataset.region=currentWorld.id;
  if(!route){document.documentElement.style.setProperty('--region-accent','#254f40');$('completion-restored').textContent='';return;}
  document.documentElement.style.setProperty('--region-accent',route.colors[2]);
  $('intro-npc').textContent=route.npc[language];$('intro-brief-text').textContent=route.brief[language];
  $('field-npc').textContent=route.npc[language];$('field-mission').textContent=route.mission[language];$('field-brief-text').textContent=route.brief[language];
  const items=game.state.constructions||[];
  const latest=items.length?constructionSummary(items.at(-1),language):t('fieldEmpty');
  if($('field-latest').textContent!==latest)$('field-latest').textContent=latest;
  $('construction-list').innerHTML=items.map(item=>`<li><strong>${escaped(item.title[language])}</strong><span>${escaped(constructionSummary(item,language))}</span></li>`).join('');
  const carts=items.some(i=>i.kind==='motion-plan');$('replay-carts').hidden=$('replay-note').hidden=!carts;
  $('completion-restored').textContent=quest?.complete&&quest.challenges.length===6?route.restored[language]:'';
}
function renderCollection(){
  $('restoration-collection').hidden=Boolean(assignment);
  if(assignment)return;
  $('relic-list').innerHTML=WORLDS.map(world=>{const route=adventureFor(world.id),done=regionQuest(world).complete;return `<div class="relic ${done?'earned':''}" data-relic="${world.id}" aria-label="${escaped(route.relic[language]+': '+t(done?'relicEarned':'relicLocked'))}"><span aria-hidden="true">${route.glyph}</span><strong>${escaped(route.relic[language])}</strong><small>${escaped(t(done?'relicEarned':'relicLocked'))}</small></div>`;}).join('');
}
function renderManifest(){
  const final=currentWorld.id==='finale';$('supply-manifest').hidden=!final;$('completion-manifest').hidden=!final;
  if(final)for(const id of ['manifest-values','completion-manifest']){const open=$(id).querySelector('details')?.open;$(id).innerHTML=manifestMarkup();$(id).querySelector('details').open=Boolean(open);}
}
function renderRegionMap(){
  $('map-continue').textContent=`${t(game.state.elapsed>0||quest.completed.length?'resumeRegion':'start')} · ${currentWorld.name[language]}`;
  $('region-cards').replaceChildren();let total=0,complete=0;
  for(const world of WORLDS){
    const progress=regionQuest(world);total+=progress.xp;if(progress.complete)complete++;
    const card=document.createElement('article');card.className='region-card';
    card.innerHTML=`<span class="eyebrow">${escaped(`${t('teacherChapter')} ${world.chapter}`)}</span><h3>${escaped(world.name[language])}</h3><p>${escaped(world.lesson[language])}</p><div class="region-evidence">${progress.completed.length}/6 ${escaped(t('checks'))} · ${progress.xp}/450 XP</div><progress max="6" value="${progress.completed.length}" aria-label="${escaped(world.name[language])}"></progress>`;
    const button=document.createElement('button');button.className=world.id===currentWorld.id?'outline':'primary';button.textContent=t(world.id===currentWorld.id?'currentRegion':'regionEnter');button.disabled=Boolean(assignment);
    button.onclick=()=>changeRegion(world);card.append(button);$('region-cards').append(card);
  }
  const finalProgress=regionQuest(FINAL_WORLD),unlocked=finalUnlocked();
  const finalCard=document.createElement('article');finalCard.className='region-card finale-card';finalCard.id='finale-card';
  finalCard.innerHTML=`<span class="eyebrow">${escaped(t('finale'))}</span><h3>${escaped(FINAL_WORLD.name[language])}</h3><p>${escaped(t('finaleCardText'))}</p><div class="region-evidence">${finalProgress.completed.length}/5 ${escaped(t('checks'))} · ${finalProgress.xp}/500 XP</div><progress max="5" value="${finalProgress.completed.length}" aria-label="${escaped(FINAL_WORLD.name[language])}"></progress><small>${escaped(unlocked?t('finaleUnlocked'):t('finaleUnlock'))}</small>`;
  const enter=document.createElement('button');enter.id='enter-finale';enter.className='primary';enter.disabled=!unlocked||Boolean(assignment);enter.textContent=t(currentWorld.id==='finale'?'currentRegion':'regionEnter');enter.onclick=()=>changeRegion(FINAL_WORLD);
  const practice=document.createElement('button');practice.id='practice-finale';practice.className='outline';practice.disabled=Boolean(assignment);practice.textContent=t('finalePractice');practice.onclick=()=>launchAssignment({v:1,world:'finale',tasks:5,assist:true,guided:false,language});
  finalCard.append(enter,practice);$('region-cards').append(finalCard);
  $('course-progress').textContent=assignment?t('classIsolated'):`${t('courseXP')}: ${total} / 2250 · ${complete} / 5 ${t('completed')}`;
}
$('region-button').onclick=()=>{if(!loaded)return;renderRegionMap();openDialog($('region-map'));};
$('next-region').onclick=()=>{$('completion').close();setTimeout(()=>$('region-button').click(),0);};
function teacherConfig(){const variant=Number($('teacher-variant').value),level=$('teacher-level').value;return {v:1,world:$('teacher-world').value,tasks:Number($('teacher-tasks').value),assist:$('teacher-assist').checked,guided:$('teacher-support').value==='guided',language:$('teacher-language').value,...(variant?{variant}:{}),...(level!=='standard'?{level}:{})};}
function renderTeacherPreview(){
  for(const option of $('teacher-world').options){const w=getWorld(option.value);option.textContent=`${w.chapter??t('finale')} · ${w.name[language]}`;}
  const final=$('teacher-world').value==='finale';
  $('teacher-level').disabled=final;if(final)$('teacher-level').value='standard';
  const level=$('teacher-level').value,special=level!=='standard';
  $('teacher-variant').disabled=final;if(final)$('teacher-variant').value='0';
  for(const option of $('teacher-variant').options)option.disabled=option.hidden=special&&option.value==='2';
  if(special&&$('teacher-variant').value==='2')$('teacher-variant').value='0';
  for(const option of $('teacher-tasks').options){option.disabled=option.hidden=final?option.value!=='5':special?option.value!=='3':option.value==='5';}
  if(final)$('teacher-tasks').value='5';else if(special)$('teacher-tasks').value='3';else if($('teacher-tasks').value==='5')$('teacher-tasks').value='6';
  $('teacher-level-note').textContent=t(final?'finaleTeacherNote':level==='foundation'?'foundationNote':level==='challenge'?'challengeLevelNote':'standardNote');
  $('teacher-level-review').hidden=!special;
  const config=teacherConfig(),data=assignmentCurriculum(curricula.get(config.world),config);
  $('finale-teacher-note').hidden=!final;
  $('teacher-answers').replaceChildren();
  for(const def of final?finaleExample(data):data.challenges){
    const answer=def.answer||(def.kind==='roots'?Object.fromEntries(roots(def.model).map((v,i)=>[i?'second':'first',v])):def.kind==='vertex'?vertex(def.model):{span:def.target.span,k:4*def.target.height/def.target.span**2});
    const labels=def.fields?Object.fromEntries(def.fields.map(f=>[f.key,f.label[language]])):{first:t('firstRoot'),second:t('secondRoot'),x:t('vertexX'),y:t('vertexY'),span:t('span'),k:t('scale')};
    for(const f of def.evidence||[])labels[f.key]=f.label[language];
    const item=document.createElement('li');item.innerHTML=`<strong>${escaped(def.title[language])}</strong><p>${escaped(def.prompt[language])}</p><code>${escaped(Object.entries(answer).map(([k,v])=>`${labels[k]} = ${Number.isFinite(v)?Number(v.toFixed(6)):v}`).join(' · '))}</code><p>${escaped(def.explanation[language])}</p>`;$('teacher-answers').append(item);
  }
  $('teacher-output').hidden=true;
}
$('teacher-button').onclick=()=>{if(!loaded)return;if(!$('teacher-world').options.length)for(const world of REGIONS){const option=new Option(world.name[language],world.id);$('teacher-world').add(option);}$('teacher-world').value=currentWorld.id;$('teacher-level').value=assignment?.level||'standard';$('teacher-variant').value=String(quest.variantIndex);$('teacher-language').value=language;renderTeacherPreview();learningTools.renderReports();openDialog($('teacher'));};
for(const id of ['teacher-world','teacher-level','teacher-variant','teacher-tasks','teacher-support','teacher-assist','teacher-language'])$(id).onchange=renderTeacherPreview;
$('generate-code').onclick=()=>{
  const config={...teacherConfig(),instanceId:'lesson-'+crypto.randomUUID(),dueLabel:$('teacher-due').value.trim()},code=encodeAssignment(config),url=assignmentURL(config,location.href);
  $('generated-code').value=code;$('generated-link').value=url.href;$('teacher-output').hidden=false;
};
$('teacher-due').oninput=()=>{$('teacher-output').hidden=true;};
function launchAssignment(config){persist();replacingSave=true;location.assign(assignmentURL(config,location.href).href);}
$('launch-class').onclick=()=>launchAssignment(assignmentFromURL($('generated-link').value));
$('copy-class-code').onclick=async()=>{try{await navigator.clipboard.writeText($('generated-code').value);$('copy-status').textContent=t('codeCopySuccess');}catch{$('generated-code').focus();$('generated-code').select();$('copy-status').textContent=t('codeCopyFallback');}};
$('copy-class-link').onclick=async()=>{try{await navigator.clipboard.writeText($('generated-link').value);$('copy-status').textContent=t('codeCopied');}catch{$('generated-link').focus();$('generated-link').select();$('copy-status').textContent=t('copyFallback');}};
$('join-form').onsubmit=event=>{
  event.preventDefault();const input=$('join-input').value.trim(),config=/^https?:\/\//.test(input)?assignmentFromURL(input):decodeAssignment(input);if(!config){$('join-error').textContent=t('invalidCode');return;}launchAssignment(config);
};
$('leave-class').onclick=()=>{persist();const url=new URL(location.href);url.search='';url.hash='';replacingSave=true;location.assign(url.href);};
$('preview-action').onclick=()=>{previewTime=0;previewRunning=true;renderGraph();};
$('language').onclick=$('challenge-language').onclick=switchLanguage;
$('journal-button').onclick=()=>{if(!loaded)return;renderJournal();openDialog($('journal'));};
$('pause-button').onclick=$('resume-button').onclick=()=>{if(!loaded||anyModal()||game.state.mode==='ready'||game.state.mode==='complete')return;game.togglePause();clearInput();stage.focus({preventScroll:true});updateUI(true);};
$('sound-button').onclick=()=>{soundOn=!soundOn;$('sound-button').setAttribute('aria-pressed',String(soundOn));tone('pickup');};
$('assist').onchange=()=>{assist=$('assist').checked;if(!loaded)return;const exploring=quest.complete&&game.state.mode==='playing';configureWorld();if(exploring)game.start();persist();updateUI(true);};
$('checkpoint').onclick=()=>{
  if(!loaded||anyModal()||!assist||quest.complete)return;if(game.state.mode==='ready')game.start();
  if(game.state.mode!=='playing')return;
  Object.assign(game.state.player,{x:stationX(quest.next.station)-75,y:500,vx:0,vy:0,onGround:true,invulnerable:2});game.state.projectiles.length=0;game.state.shockwaves.length=0;clearInput();renderer.resetCamera();toast('checkpointToast');stage.focus({preventScroll:true});persist();updateUI(true);
};
$('equip-sword').onclick=()=>{if(!anyModal())game.equip('sword');stage.focus({preventScroll:true});updateUI(true);};
$('equip-axe').onclick=()=>{if(!anyModal())game.equip('axe');stage.focus({preventScroll:true});updateUI(true);};
$('review-button').onclick=()=>{$('completion').close();setTimeout(()=>{renderJournal();openDialog($('journal'));},0);};
$('finish-exit').onclick=()=>{game.start();$('completion').close();updateUI(true);};
$('restart-button').onclick=()=>{restartWithVariant=false;renderJournal();$('reset-confirm').hidden=false;};$('cancel-restart').onclick=()=>{$('reset-confirm').hidden=true;};
$('next-variant').onclick=()=>{if(assignment||currentWorld.id==='finale')return;restartWithVariant=true;renderJournal();$('reset-confirm').hidden=false;};
$('confirm-restart').onclick=()=>{
  snapshotSave();try{history=archiveRun(history,currentWorld.id,regions[currentWorld.id],reportLabel);}catch{ $('history-status').textContent=t('historyFull');$('history-status').scrollIntoView({block:'center'});return;}
  regions[currentWorld.id]={run:newRun(),reviews:{}};
  const index=restartWithVariant?(quest.variantIndex+1)%variantOptions(curricula.get(currentWorld.id)).length:quest.variantIndex;
  modalWasPlaying=false;$('journal').close();curriculum=assignmentCurriculum(curricula.get(currentWorld.id),assignment);quest=createQuest(selectVariant(curriculum,index));game.restart();feedback=null;configureWorld();renderer.resetCamera();$('reset-confirm').hidden=true;restartWithVariant=false;persist();applyLanguage();updateUI(true);
};
$('clear-history').onclick=()=>{
  if(!history.length||!confirm(t('clearHistoryConfirm')))return;
  download(JSON.stringify({...snapshotSave(),schemaVersion:2,contentVersion:CONTENT_VERSION},null,2),'mathwithcye-history-backup.json','application/json');
  history=[];persist();renderJournal();$('history-status').textContent=t('historyCleared');
};
$('report-label').oninput=()=>{reportLabel=$('report-label').value.slice(0,40);persist();};
$('export-csv').onclick=()=>{
  const url=URL.createObjectURL(new Blob([learningCSV(snapshotSave(),curricula)],{type:'text/csv;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download=assignment?'mathwithcye-class-learning.csv':'mathwithcye-expedition-learning.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('report-status').textContent=t('reportExported');
};
$('export-progress').onclick=()=>{const data={...snapshotSave(),schemaVersion:2,contentVersion:CONTENT_VERSION,exportedAt:new Date().toISOString()};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download=assignment?'mathwithcye-class-progress.json':'mathwithcye-sunshine-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('import-progress').onclick=()=>$('import-file').click();
$('import-file').onchange=async()=>{
  const file=$('import-file').files[0];$('import-file').value='';if(!file)return;
  if(file.size>1000000){alert(t('importInvalid'));return;}
  try{const data=decodeSave(await file.text());if(!data){alert(t('importInvalid'));return;}if(!confirm(t('importConfirm')))return;
    const destinationKey=data.assignment?assignmentKey(data.assignment):STORAGE_KEY;
    if(!writeSave(storage,data,destinationKey)){alert(t('saveBad'));return;}replacingSave=true;const url=data.assignment?assignmentURL(data.assignment,location.href):new URL(location.pathname,location.origin);location.assign(url.href);
  }catch{alert(t('importInvalid'));}
};
const keys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'attack',KeyE:'interact'};
window.addEventListener('keydown',event=>{
  if(!loaded||anyModal()||event.ctrlKey||event.metaKey||event.altKey||event.target instanceof HTMLInputElement)return;
  if(event.target instanceof HTMLButtonElement && (event.code==='Space'||event.code==='Enter'))return;
  if(event.code==='Escape'&&!event.repeat){$('pause-button').click();return;}
  if(event.code==='Digit1'||event.code==='Digit2'){event.preventDefault();game.equip(event.code==='Digit1'?'sword':'axe');return;}
  const action=keys[event.code];if(!action)return;event.preventDefault();
  if(action==='interact'){if(!event.repeat)interact();}else if(action==='jump'){if(!event.repeat)game.jump();}else input[action]=true;
});
window.addEventListener('keyup',event=>{if(keys[event.code])input[keys[event.code]]=false;});
for(const button of document.querySelectorAll('[data-control]')){
  button.addEventListener('pointerdown',event=>{event.preventDefault();if(!loaded||anyModal()||game.state.mode!=='playing')return;button.setPointerCapture(event.pointerId);const action=button.dataset.control;if(action==='interact')interact();else if(action==='jump')game.jump();else input[action]=true;button.classList.add('pressed');});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>{input[button.dataset.control]=false;button.classList.remove('pressed');});
}
$('world').addEventListener('pointerdown',event=>{
  if(event.button!==0||!loaded||anyModal()||game.state.mode!=='playing')return;
  event.preventDefault();stage.focus({preventScroll:true});$('world').setPointerCapture(event.pointerId);
  const rect=$('world').getBoundingClientRect(),target=(event.clientX-rect.left)/rect.width*renderer.viewWidth+renderer.camera;
  const player=game.state.player;if(!['sword','axe'].includes(player.action))player.facing=target>=player.x?1:-1;
  input.attack=true;game.attack();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('world').addEventListener(event,()=>{input.attack=false;});
function pauseForFocus(){clearInput();if(!openingModal&&game.state.mode==='playing')game.togglePause();persist();updateUI(true);}
window.addEventListener('blur',pauseForFocus);document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForFocus();});window.addEventListener('pagehide',persist);
function frame(now){
  const dt=Math.min((now-last)/1000||1/60,.05);last=now;
  if(!anyModal())game.update(dt,input);
  for(const event of game.state.events.splice(0)){
    if(event.type==='sound')tone(event.name);
    if(event.type==='guardian'&&!anyModal())interact();
    if(event.type==='toast'&&event.text.includes('接回家'))toast('rescue');
    if(event.type==='toast'&&event.text.includes('+'))toast('collectToast');
  }
  if(previewRunning&&$('challenge').open&&quest.active?.kind==='motion-plan'){previewTime=Math.min(previewTime+dt,quest.active.model.duration);renderGraph();if(previewTime>=quest.active.model.duration)previewRunning=false;}
  renderer.render(dt);updateUI();if(now>toastUntil)$('toast').hidden=true;
  if(game.state.mode==='playing')autosave+=dt;if(autosave>2.5){persist();autosave=0;}
  requestAnimationFrame(frame);
}
async function init(){
  if(loadingNow||loaded)return;
  loadingNow=true;loadFailed=false;loadingPhase='loadingLessons';$('retry-load').hidden=true;$('retry-load').disabled=true;$('load-note').hidden=true;
  applyLanguage();
  try{
    await settleLoads(REGIONS.filter(world=>!curricula.has(world.id)).map(async world=>{
      const data=await fetchJSON(world.path);if(!Array.isArray(data?.challenges)||!data.challenges.length)throw new Error('Invalid curriculum');curricula.set(world.id,data);
    }));
    let relocked=false;
    if(currentWorld.id==='finale'&&!assignment&&!isFinaleUnlocked(WORLDS.map(w=>createQuest(curricula.get(w.id),regions[w.id]?.quest)))){
      currentWorld=getWorld('quadratics');game.restoreSave(regions.quadratics?.world);relocked=true;
    }
    curriculum=assignmentCurriculum(curricula.get(currentWorld.id),assignment);quest=createQuest(curriculum,regions[currentWorld.id]?.quest);configureWorld();
    loadingPhase='loadingForest';$('load-message').textContent=t(loadingPhase);
    await renderer.load();loaded=true;$('loading').hidden=true;$('start-button').disabled=false;applyLanguage();updateUI(true);requestAnimationFrame(frame);
    if(stored.damaged)toast('saveDamaged');if(assignmentParam&&!assignment)toast('invalidCode');if(relocked)toast('finaleLocked');if(quest.complete)showCompletion();else if(new URLSearchParams(location.search).get('view')==='regions')$('region-button').click();
  }catch(error){loadFailed=true;$('load-message').textContent=t('loadError');$('load-note').hidden=false;$('retry-load').hidden=false;$('retry-load').disabled=false;}
  finally{loadingNow=false;}
}
$('retry-load').onclick=init;
// Read-only QA snapshot; all user actions still go through the displayed controls.
window.mathQuest={snapshot:()=>JSON.parse(JSON.stringify({loaded,language,assist,region:currentWorld.id,assignment,world:game.state,quest:quest?.save(),xp:quest?.xp,independent:quest?.independent,active:quest?.active?.id,next:quest?.next?.id,manifest:currentWorld.id==='finale'&&quest?supplyManifest(quest.save()):null,graph:graphGeometry}))};
init();

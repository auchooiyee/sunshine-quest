import {reviewQueue} from '../learning/review.js';
import {HISTORY_LIMIT} from '../learning/history.js';
import {readReport,mergeReports,classSummary,summaryCSV} from '../learning/class-reports.js';
import {diagnostic} from '../learning/feedback.js';
import {fieldKeys} from '../math/challenges.js';
import {renderAppliedGraph} from './applied-graph.js';
import {createQuest} from '../missions/quest.js';
import {getWorld} from '../../config/worlds.js';
const $=id=>document.getElementById(id);
const element=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
export function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function createLearningTools({context,persist,t,openDialog,openJournal}){
  let activeReview=null,reviewID=null,reports=[];
  function saveReview(){const c=context();c.region.reviews[reviewID]=activeReview.save();persist();}
  function renderReview(){
    const c=context(),q=activeReview,def=q.challenges[0],session=q.save().sessions[def.id];
    $('fresh-title').textContent=def.title[c.language];$('fresh-prompt').textContent=def.prompt[c.language];
    $('fresh-fields').replaceChildren();
    const fallback={first:t('firstRoot'),second:t('secondRoot'),x:t('vertexX'),y:t('vertexY'),span:t('span'),k:t('scale')};
    for(const key of fieldKeys(def)){
      const f=[...(def.fields||[]),...(def.evidence||[])].find(f=>f.key===key),range=f?.type==='range'?f:def.kind==='design'&&['span','k'].includes(key)?(key==='span'?{min:4,max:10,step:1}:{min:.25,max:1.5,step:.25}):null;
      const label=element('label',f?.label[c.language]||fallback[key]||key,'field'),input=document.createElement('input'),value=element('output','');
      input.name=key;input.type=range?'range':'text';input.inputMode='decimal';input.maxLength=32;input.autocomplete='off';
      if(range){input.min=range.min;input.max=range.max;input.step=range.step;}
      input.value=session.draft[key]??(range?range.initial??range.min:'');input.disabled=q.complete;
      if(range&&!q.complete&&session.draft[key]===undefined){q.edit({[key]:input.value});saveReview();}
      value.textContent=range?input.value:'';
      input.oninput=()=>{q.edit({[key]:input.value});value.textContent=range?input.value:'';saveReview();$('fresh-feedback').textContent='';draw();};label.append(input,value);$('fresh-fields').append(label);
    }
    function draw(){
      $('fresh-graph').hidden=!def.fields;
      if(def.fields){$('fresh-graph').innerHTML=renderAppliedGraph(def,q.save().sessions[def.id].draft,c.language,0).markup;$('fresh-graph').setAttribute('aria-label',def.title[c.language]);}
    }
    draw();$('fresh-hints').replaceChildren(...def.hints[c.language].slice(0,session.hints).map(h=>element('li',h)));
    $('fresh-submit').disabled=q.complete;$('fresh-hint').disabled=q.complete||session.hints>=3;
    $('fresh-status').textContent=q.complete?`${t(q.independent?'independentPass':'supportedPass')} · ${t('reviewSaved')}`:t('reviewInput');
  }
  function startReview(item){activeReview=item.practice;reviewID=item.id;activeReview.start(item.id);context().region.reviews[reviewID]=activeReview.save();persist();$('journal').close();setTimeout(()=>{renderReview();$('fresh-feedback').textContent='';openDialog($('fresh-review'));},0);}
  $('fresh-form').onsubmit=e=>{e.preventDefault();if(!activeReview||activeReview.complete)return;const def=activeReview.active,result=activeReview.submit();saveReview();renderReview();$('fresh-feedback').textContent=result.correct?def.explanation[context().language]:t(result.reason==='invalid'?'invalid':diagnostic(def,activeReview.session.draft)||'incorrect');};
  $('fresh-hint').onclick=()=>{activeReview.hint();saveReview();renderReview();};
  $('fresh-back').onclick=()=>{$('fresh-review').close();setTimeout(openJournal,0);};
  function renderJournal(){
    const c=context();$('history-list').replaceChildren();
    $('history-count').textContent=`${c.history.length} / ${HISTORY_LIMIT}`;
    for(const run of [...c.history].reverse()){
      const q=createQuest(c.bankFor(run.regionId),run.quest),row=element('li','');
      row.append(element('strong',`${getWorld(run.regionId).name[c.language]} · ${q.variantId}`),element('p',`${run.learnerCode||'—'} · ${new Date(run.archivedAt).toLocaleString(c.language==='ms'?'ms-MY':'en-MY')} · ${q.completed.length}/${q.challenges.length} · ${q.independent} ${t('independent')}`));$('history-list').append(row);
    }
    if(!c.history.length)$('history-list').append(element('li',t('historyEmpty')));
    $('clear-history').disabled=!c.history.length;
    $('review-list').replaceChildren();
    const queue=reviewQueue(c.bank,c.quest.save(),c.region.reviews);
    for(const item of queue){const row=element('div','','journal-row');row.append(element('strong',item.title[c.language]));
      if(item.complete)row.append(element('span',t(item.independent?'independentPass':'supportedPass')));
      else{const button=element('button',t(c.region.reviews[item.id]?'reviewResume':'reviewStart'),'outline');button.dataset.review=item.id;button.onclick=()=>startReview(item);row.append(button);}
      $('review-list').append(row);
    }
    if(!queue.length)$('review-list').append(element('p',t('reviewEmpty')));
  }
  const scope=r=>r.assignment_instance||r.mission_code||'expedition';
  function renderReports(){
    const chosen=$('report-lesson').value,scopes=[...new Set(reports.map(scope))].sort();
    const scopeLabel=s=>{const r=reports.find(r=>scope(r)===s);return r?.assignment_instance?`${r.due_label||t('lessonIdentity')} · ${s.slice(-8)}`:s;};
    $('report-lesson').replaceChildren(new Option(t('allLessons'),''),...scopes.map(s=>new Option(scopeLabel(s),s)));$('report-lesson').value=scopes.includes(chosen)?chosen:'';
    const rows=reports.filter(r=>!$('report-lesson').value||scope(r)===$('report-lesson').value),s=classSummary(rows,$('report-roster').value.split(/\r?\n/));
    $('class-counts').textContent=rows.length?`${t('submitted')}: ${s.learners.length} · ${s.learners.join(', ')}${$('report-roster').value.trim()?` · ${t('missingReports')}: ${s.missing.join(', ')||'—'}`:''}`:t('noReports');
    $('report-warnings').textContent=[s.legacy?t('legacyReports'):'',s.unscoped?t('unscopedReports'):''].filter(Boolean).join(' ');
    $('class-task-rows').replaceChildren();
    for(const task of s.tasks){const row=element('li',''),metrics=element('div','','report-metrics'),set=(task.set.startsWith('foundation')?t('foundation')+' · ':task.set.startsWith('challenge')?t('challengeLevel')+' · ':'')+t(task.set.includes('-b-')?'setB':task.set==='practice-c-v1'?'setC':'setOriginal');
      row.append(element('strong',`${scopeLabel(task.lesson)} · ${context().language==='ms'?task.titleMS:task.title} · ${set} · ${t(task.kind==='review'?'reviewTitle':'routePractice')}`));
      for(const key of ['runs','started','completed','independent','supported','missed']){const item=element('span','');item.append(element('b',task[key]),element('small',t('metric'+key)));metrics.append(item);}
      row.append(metrics);$('class-task-rows').append(row);
    }
    $('export-summary').disabled=!rows.length;return s;
  }
  $('import-reports').onclick=()=>$('report-files').click();
  $('report-files').onchange=async()=>{
    const files=[...$('report-files').files];$('report-files').value='';if(!files.length)return;$('class-report-status').textContent='';
    try{if(files.length>20||files.some(f=>f.size>1000000))throw new Error('reportSize');let next=reports;
      for(const file of files)next=mergeReports(next,readReport(await file.text()));reports=next;renderReports();$('class-report-status').textContent=t('reportsImported');
    }catch(error){$('class-report-status').textContent=t(['reportSize','reportInvalid'].includes(error.message)?error.message:'reportInvalid');}
  };
  $('report-lesson').onchange=$('report-roster').oninput=renderReports;
  $('clear-reports').onclick=()=>{reports=[];renderReports();$('class-report-status').textContent='';};
  $('export-summary').onclick=()=>download(summaryCSV(renderReports()),'mathwithcye-class-summary.csv','text/csv;charset=utf-8');
  return {renderJournal,renderReports};
}

import {FIELD_MISSIONS,fieldPlaytestCSV,readFieldPlaytest,mergeFieldPlaytests,summarizeFieldPlaytests,fieldSummaryCSV} from '../learning/field-playtest.js';
import {download} from './learning-tools.js';

export function createFieldPlaytestUI({t,openDialog,switchLanguage,playtest,requested,onContinue,onMap}){
  let imports=[],importing=false;
  const dialog=document.createElement('dialog');dialog.id='field-playtest';dialog.setAttribute('aria-labelledby','field-playtest-title');
  dialog.innerHTML=`<div class="rescue-head"><h2 id="field-playtest-title" tabindex="-1" data-i18n="fieldPilotTitle"></h2><div class="rescue-head-actions"><button id="field-playtest-language" class="outline" aria-label="Language / Bahasa">EN / BM</button></div></div>
    <section id="field-playtest-student" hidden><p data-i18n="fieldPilotConsent"></p><p id="field-playtest-progress" role="status"></p><p id="field-playtest-saved" hidden></p>
    <div class="rescue-controls"><button id="field-playtest-start" class="primary" hidden data-i18n="fieldPilotStart"></button><button id="field-playtest-continue" class="primary" hidden data-i18n="fieldPilotContinue"></button><button id="field-playtest-download" class="primary" hidden data-i18n="fieldPilotDownload"></button><button id="field-playtest-stop" class="outline" hidden data-i18n="fieldPilotStop"></button></div><div id="field-playtest-table" class="field-playtest-table" hidden></div></section>
    <details id="field-playtest-teacher"><summary data-i18n="fieldPilotTeacher"></summary><label class="field-playtest-link"><span data-i18n="fieldPilotStudentLink"></span><input id="field-playtest-link" readonly></label><div class="rescue-controls"><button id="field-playtest-copy" class="outline" data-i18n="fieldPilotCopy"></button><a id="field-playtest-open-link" target="_blank" rel="noopener" data-i18n="fieldPilotStudentLink"></a></div><p id="field-playtest-copy-status" role="status"></p>
    <div class="rescue-controls"><button id="field-playtest-import" class="outline" data-i18n="fieldPilotImport"></button><input id="field-playtest-files" type="file" multiple accept=".csv,text/csv" hidden><button id="field-playtest-export-summary" class="outline" disabled data-i18n="fieldPilotDownloadSummary"></button></div><p id="field-playtest-import-status" role="status"></p><p data-i18n="fieldPilotSummaryNote"></p><div id="field-playtest-summary" class="field-playtest-table"></div></details>
    <button id="field-playtest-close" class="outline" data-i18n="fieldPilotExit"></button>`;
  document.body.append(dialog);
  const $=id=>dialog.querySelector('#'+id);
  const ids=Object.keys(FIELD_MISSIONS);
  const text=(key,data)=>t(key).replace(/\{(\w+)\}/g,(_,name)=>String(data[name]??''));
  const format=n=>n===null?'—':Number(n.toFixed(1)).toString();
  const headers=['fieldPilotMission','fieldPilotCompleted','fieldPilotIncorrect','fieldPilotHints'];
  const link=new URL(location.pathname,location.origin);link.searchParams.set('view','regions');link.searchParams.set('playtest','1');
  $('field-playtest-link').value=link.href;$('field-playtest-open-link').href=link.href;
  let next=null,status=null;
  function table(container,header,rows){
    const el=document.createElement('table'),head=el.createTHead().insertRow(),body=el.createTBody();
    for(const key of header){const cell=document.createElement('th');cell.scope='col';cell.textContent=t(key);head.append(cell);}
    for(const values of rows){const row=body.insertRow();values.forEach((value,index)=>{const cell=index===0?document.createElement('th'):document.createElement('td');if(index===0)cell.scope='row';cell.textContent=value;row.append(cell);});}
    container.replaceChildren(el);
  }
  function render(){
    for(const el of dialog.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
    const run=playtest.snapshot(),remaining=run?ids.find(id=>!run.rows[id].completed):ids[0];
    $('field-playtest-student').hidden=!requested;
    $('field-playtest-start').hidden=Boolean(run);$('field-playtest-continue').hidden=!run?.active||!remaining;
    $('field-playtest-download').hidden=!run;$('field-playtest-stop').hidden=!run?.active;
    $('field-playtest-saved').hidden=!run;$('field-playtest-table').hidden=!run;
    $('field-playtest-saved').textContent=t(playtest.saved?'fieldPilotSaved':'fieldPilotMemoryOnly');
    $('field-playtest-close').textContent=t(requested&&!run?'fieldPilotDecline':'fieldPilotExit');
    $('field-playtest-progress').textContent=run?`${text('fieldPilotStatus',{done:ids.filter(id=>run.rows[id].completed).length,total:ids.length})} · ${t(run.active?'fieldPilotRecording':'fieldPilotStopped')}`:'';
    if(run)table($('field-playtest-table'),[...headers,'fieldPilotActive','fieldPilotFirst'],ids.map(id=>{
      const r=run.rows[id];return [t(FIELD_MISSIONS[id]),t(r.completed?'fieldPilotYes':r.visits?'fieldPilotNo':'fieldPilotNotStarted'),r.incorrect,r.hints,r.visits?format(r.activeMs/1000):'—',format(r.firstCheckMs===null?null:r.firstCheckMs/1000)];
    }));
    $('field-playtest-import-status').textContent=status?t(status):imports.length?text('fieldPilotImported',{count:imports.length}):t('fieldPilotNoImports');
    $('field-playtest-export-summary').disabled=!imports.length;
    if(imports.length)table($('field-playtest-summary'),['fieldPilotMission','fieldPilotStarted',...headers.slice(1),'fieldPilotMedian','fieldPilotMedianFirst'],summarizeFieldPlaytests(imports).map(r=>[t(FIELD_MISSIONS[r.mission]),r.started,r.completed,r.incorrect,r.hints,format(r.medianCompletedSeconds),format(r.medianFirstCheckSeconds)]));
  }
  function proceed(){
    const run=playtest.snapshot();if(!run?.active)return;
    next=ids.find(id=>!run.rows[id].completed);if(next)dialog.close();
  }
  $('field-playtest-start').onclick=()=>{if(playtest.start())proceed();};
  $('field-playtest-continue').onclick=proceed;
  $('field-playtest-stop').onclick=()=>{playtest.stop();render();$('field-playtest-download').focus();};
  $('field-playtest-download').onclick=()=>{playtest.checkpoint();const run=playtest.snapshot();if(run)download(fieldPlaytestCSV(run),`sunshine-playtest-${run.id}.csv`,'text/csv;charset=utf-8');};
  $('field-playtest-language').onclick=switchLanguage;
  $('field-playtest-close').onclick=()=>dialog.close();
  $('field-playtest-copy').onclick=async()=>{
    try{await navigator.clipboard.writeText(link.href);$('field-playtest-copy-status').textContent=t('fieldPilotCopied');}
    catch{$('field-playtest-link').focus();$('field-playtest-link').select();$('field-playtest-copy-status').textContent=t('fieldPilotSelect');}
  };
  $('field-playtest-import').onclick=()=>{if(!importing)$('field-playtest-files').click();};
  $('field-playtest-files').onchange=async event=>{
    const files=[...event.target.files];event.target.value='';if(!files.length||importing)return;
    if(files.length>30||files.some(file=>file.size>=100000)){status='fieldPilotImportLimit';render();return;}
    importing=true;$('field-playtest-import').disabled=true;
    try{const incoming=await Promise.all(files.map(async file=>readFieldPlaytest(await file.text())));imports=mergeFieldPlaytests(imports,incoming);status=null;}
    catch(error){status=error.message==='reportSize'?'fieldPilotImportLimit':'fieldPilotImportError';}
    finally{importing=false;$('field-playtest-import').disabled=false;render();}
  };
  $('field-playtest-export-summary').onclick=()=>{if(imports.length)download(fieldSummaryCSV(imports),'sunshine-field-playtest-summary.csv','text/csv;charset=utf-8');};
  dialog.addEventListener('close',()=>{const target=next;next=null;setTimeout(()=>target?onContinue(target):onMap(),0);});
  return {render,open(){if(!openDialog(dialog))return;render();$('field-playtest-teacher').open=!requested;$('field-playtest-title').focus({preventScroll:true});}};
}

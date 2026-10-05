import {REPORT_COLUMNS,LEGACY_REPORT_COLUMNS,csvCell} from './report.js';
import {REGIONS} from '../../config/worlds.js';
import {decodeAssignment,encodeAssignment} from '../missions/assignment.js';

/** Strict RFC-style CSV reader: quoted newlines and escaped quotes are supported. */
export function parseCSV(text){
  if(typeof text!=='string'||text.length>1000000)throw new Error('reportSize');
  text=text.replace(/^\ufeff/,'');const rows=[];let row=[],cell='',quoted=false,closed=false;
  const push=()=>{row.push(cell);cell='';closed=false;};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
    if(c==='"'){if(cell||closed)throw new Error('reportInvalid');quoted=true;}
    else if(c===',')push();
    else if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;push();rows.push(row);row=[];if(rows.length>10000)throw new Error('reportSize');}
    else{if(closed)throw new Error('reportInvalid');cell+=c;}
  }
  if(quoted)throw new Error('reportInvalid');
  if(cell||closed||row.length){push();rows.push(row);}
  return rows;
}
const integer=(s,max)=>/^\d+$/.test(s)&&Number(s)<=max;
const bool=s=>s==='true'||s==='false';
export function readReport(text){
  const [header,...rows]=parseCSV(text),version=JSON.stringify(header)===JSON.stringify(REPORT_COLUMNS)?2:JSON.stringify(header)===JSON.stringify(LEGACY_REPORT_COLUMNS)?1:0;
  if(!version||!rows.length)throw new Error('reportInvalid');
  return rows.map(cells=>{
    if(cells.length!==header.length||cells.some(c=>c.length>10000))throw new Error('reportInvalid');
    // Undo only the formula-safety prefix emitted by the game, for identity matching.
    const r=Object.fromEntries(header.map((h,i)=>[h,/^'\s*[=+\-@]/.test(cells[i])?cells[i].slice(1):cells[i]]));
    if(r.report_version!==String(version)||!Number.isFinite(Date.parse(r.exported_at_utc))||r.learner_code.length>40||!r.learner_code.trim()||r.form!=='4'||r.subject!=='Mathematics'||!REGIONS.some(w=>w.id===r.region_id)||!['expedition','class_mission'].includes(r.mode)||!['completed_independent','completed_supported','in_progress','not_started'].includes(r.status)||!integer(r.attempts,1000000)||!integer(r.hints_used,3)||!integer(r.xp,1000)||!bool(r.completed)||!bool(r.independent_first_answer)||!r.task_id||r.task_id.length>80||!r.question_set||r.question_set.length>80)throw new Error('reportInvalid');
    if(r.mode==='class_mission'){const config=decodeAssignment(r.mission_code);if(!config||config.world!==r.region_id)throw new Error('reportInvalid');r.mission_code=encodeAssignment(config);}
    else if(r.mission_code)throw new Error('reportInvalid');
    const done=r.completed==='true',independent=r.independent_first_answer==='true';
    if(done!==(r.status.startsWith('completed_'))||independent!==(r.status==='completed_independent')||(done&&Number(r.attempts)<1)||(independent&&(r.attempts!=='1'||r.hints_used!=='0'))||(!done&&r.xp!=='0')||(r.last_attempt_at_utc&&!Number.isFinite(Date.parse(r.last_attempt_at_utc))))throw new Error('reportInvalid');
    let draft;try{draft=JSON.parse(r.answer_draft);}catch{throw new Error('reportInvalid');}
    if(!draft||typeof draft!=='object'||Array.isArray(draft))throw new Error('reportInvalid');
    if(version===2&&(!/^[\w:-]{1,180}$/.test(r.run_id)||!['current','archived','review'].includes(r.run_kind)||!bool(r.migrated_run)||(r.assignment_instance&&!/^lesson-[\w-]{1,64}$/.test(r.assignment_instance))||r.due_label.length>60||(r.mode==='expedition'&&r.assignment_instance)))throw new Error('reportInvalid');
    if(version===2&&(r.run_kind==='review'?(!/^[\w-]{1,80}$/.test(r.source_run_id)||r.run_id!==`${r.source_run_id}:review:${r.task_id}`||r.xp!=='0'):Boolean(r.source_run_id)))throw new Error('reportInvalid');
    return {...r,version};
  });
}
const key=r=>JSON.stringify([r.learner_code,r.mode,r.assignment_instance||r.mission_code||'expedition',r.run_id||'legacy',r.region_id,r.question_set,r.task_id]);
/** Newest exports replace earlier snapshots of the same task; retries are not new learners. */
export function mergeReports(existing,incoming){
  const map=new Map(existing.map(r=>[key(r),r]));
  for(const r of incoming){const k=key(r),prior=map.get(k);if(!prior||Date.parse(r.exported_at_utc)>=Date.parse(prior.exported_at_utc))map.set(k,r);}
  if(map.size>20000)throw new Error('reportSize');return [...map.values()];
}
export function classSummary(rows,roster=[]){
  const learners=[...new Set(rows.map(r=>r.learner_code))].sort();
  const tasks=new Map();
  for(const r of rows){const group=JSON.stringify([r.assignment_instance||r.mission_code||'expedition',r.region_id,r.question_set,r.task_id,r.run_kind==='review'?'review':'route']);
    if(!tasks.has(group))tasks.set(group,{lesson:r.assignment_instance||r.mission_code||'expedition',region:r.region_id,set:r.question_set,task:r.task_id,title:r.task_title_en,titleMS:r.task_title_ms,kind:r.run_kind==='review'?'review':'route',runs:0,started:0,completed:0,independent:0,supported:0,missed:0});
    const t=tasks.get(group);t.runs++;t.started+=Number(r.status!=='not_started');t.completed+=Number(r.completed==='true');t.independent+=Number(r.independent_first_answer==='true');t.supported+=Number(Number(r.hints_used)>0);t.missed+=Number(Number(r.attempts)>(r.completed==='true'?1:0));
  }
  return {learners,missing:[...new Set(roster.map(s=>s.trim()).filter(Boolean))].filter(s=>!learners.includes(s)),tasks:[...tasks.values()].sort((a,b)=>b.missed-a.missed),legacy:rows.some(r=>r.version===1),unscoped:rows.some(r=>r.mode==='class_mission'&&!r.assignment_instance)};
}
export function summaryCSV(summary){
  const columns=['lesson','region','set','task','title','kind','runs','started','completed','independent','supported','missed'];
  return '\ufeff'+[columns,...summary.tasks.map(t=>columns.map(c=>t[c]))].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}

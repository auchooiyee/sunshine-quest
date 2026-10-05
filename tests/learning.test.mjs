import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLDS} from '../config/worlds.js';
import {createQuest} from '../src/missions/quest.js';
import {newRun,archiveRun,HISTORY_LIMIT} from '../src/learning/history.js';
import {reviewQueue} from '../src/learning/review.js';
import {diagnostic} from '../src/learning/feedback.js';
import {learningCSV,REPORT_COLUMNS,LEGACY_REPORT_COLUMNS,csvCell} from '../src/learning/report.js';
import {readReport,mergeReports,classSummary,parseCSV,summaryCSV} from '../src/learning/class-reports.js';
import {decodeSave,CONTENT_VERSION} from '../src/storage/save-store.js';
import {assignmentURL,assignmentFromURL,assignmentKey,encodeAssignment,decodeAssignment} from '../src/missions/assignment.js';
import {en,ms} from '../locales/learning.js';
import {selectVariant} from '../src/math/variants.js';
import {roots,vertex} from '../src/math/quadratics.js';
const banks=new Map(WORLDS.map(w=>[w.id,JSON.parse(readFileSync(new URL('../'+w.path,import.meta.url),'utf8'))]));
function sample(){const q=createQuest(banks.get('quadratics'));q.start('roots');q.hint();q.edit({first:0,second:6});q.submit();return {q,save:{schemaVersion:2,contentVersion:CONTENT_VERSION,currentRegion:'quadratics',reportLabel:'CYE001',regions:{quadratics:{run:newRun(),quest:q.save(),reviews:{}}},history:[]}};}
const table=rows=>'\ufeff'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
const answer=d=>d.answer||(d.kind==='roots'?{first:roots(d.model)[0],second:roots(d.model)[1]}:d.kind==='vertex'?vertex(d.model):{span:d.target.span,k:4*d.target.height/d.target.span**2});

test('all 90 supported chapter task versions have a feasible separate same-objective review',()=>{
  let count=0;
  for(const data of banks.values())for(const variant of [0,1,2]){
    const q=createQuest(selectVariant(data,variant));
    while(q.next){const d=q.next;q.start(d.id);q.hint();q.edit(answer(d));assert.equal(q.submit().correct,true);q.close();}
    const before=q.save(),queue=reviewQueue(data,before);assert.equal(queue.length,6);
    for(const item of queue){const fresh=item.practice,d=fresh.next;fresh.start(d.id);fresh.edit(answer(d));assert.equal(fresh.submit().correct,true);assert.equal(fresh.independent,1);assert.notEqual(fresh.variantId,q.variantId);count++;}
    assert.deepEqual(q.save(),before);
  }
  assert.equal(count,90);
});

test('earlier runs preserve supported evidence and learner identity; history refuses silent pruning',()=>{
  const {save}=sample(),region=save.regions.quadratics;
  const history=archiveRun([], 'quadratics',region,save.reportLabel);region.quest.sessions.roots.hints=3;
  assert.equal(history[0].quest.sessions.roots.hints,1);assert.equal(history[0].learnerCode,'CYE001');
  assert.throws(()=>archiveRun(Array(HISTORY_LIMIT).fill(history[0]),'quadratics',region,'CYE001'),/historyFull/);
  assert.equal(archiveRun([],'quadratics',{quest:{sessions:{}}},'').length,0);
  save.history=history;save.regions.quadratics.run=newRun();
  assert.deepEqual(decodeSave(JSON.stringify(save)).history,history);
  save.regions.quadratics.run=history[0].run;assert.equal(decodeSave(save),null);
});
test('content 4 migration creates stable saved run identity without claiming historical attempts',()=>{
  const {save}=sample();save.contentVersion=4;delete save.regions.quadratics.run;
  const migrated=decodeSave(save);assert.equal(migrated.regions.quadratics.run.migrated,true);assert.deepEqual(migrated.history,[]);
  assert.deepEqual(migrated.regions.quadratics.quest,save.regions.quadratics.quest);
  assert.equal(decodeSave(JSON.stringify(migrated)).regions.quadratics.run.id,migrated.regions.quadratics.run.id);
});
test('fresh review uses a different set, resumes support and does not alter original evidence',()=>{
  const {q,save}=sample(),before=q.save();let queue=reviewQueue(banks.get('quadratics'),before);
  assert.equal(queue.length,1);const fresh=queue[0].practice;assert.equal(fresh.variantIndex,1);
  fresh.start('roots');fresh.edit({first:0,second:6});assert.equal(fresh.submit().correct,false);fresh.hint();fresh.edit({first:0,second:8});assert.equal(fresh.submit().correct,true);
  save.regions.quadratics.reviews.roots=fresh.save();queue=reviewQueue(banks.get('quadratics'),before,save.regions.quadratics.reviews);
  assert.equal(queue[0].complete,true);assert.equal(queue[0].independent,false);assert.deepEqual(q.save(),before);
  const rows=readReport(learningCSV(save,banks));assert.equal(rows.length,7);assert.equal(rows.at(-1).run_kind,'review');assert.equal(rows.at(-1).xp,'0');assert.equal(rows.at(-1).source_run_id,save.regions.quadratics.run.id);
});
test('report roundtrip keeps current/archive/review identities and duplicate imports count once',()=>{
  const {save}=sample();save.history=archiveRun([],'quadratics',save.regions.quadratics,'CYE001');save.regions.quadratics={run:newRun(),quest:createQuest(banks.get('quadratics')).save(),reviews:{}};
  const old=readReport(learningCSV(save,banks,'2026-10-05T10:00:00Z')),later=readReport(learningCSV(save,banks,'2026-10-06T10:00:00Z'));
  assert.equal(old.length,12);const merged=mergeReports(mergeReports(old,later),old);assert.equal(merged.length,12);assert.ok(merged.every(r=>r.exported_at_utc==='2026-10-06T10:00:00Z'));
  const summary=classSummary(merged,['CYE001','CYE002','CYE002']);assert.deepEqual(summary.learners,['CYE001']);assert.deepEqual(summary.missing,['CYE002']);assert.equal(summary.tasks[0].runs,2);assert.equal(summary.tasks[0].completed,1);assert.equal(summary.tasks[0].supported,1);
  assert.equal(parseCSV(summaryCSV(summary)).length,7);
});
test('legacy CSV schema still imports; quoting, Unicode and formula-safe learner codes roundtrip',()=>{
  const {save}=sample();save.reportLabel='=SUM(1,2)';const current=parseCSV(learningCSV(save,banks));
  const legacy=[LEGACY_REPORT_COLUMNS,...current.slice(1).map(r=>['1',...r.slice(1,LEGACY_REPORT_COLUMNS.length)])];
  const rows=readReport(table(legacy));assert.equal(rows[0].version,1);assert.equal(classSummary(rows).legacy,true);
  assert.equal(readReport(learningCSV(save,banks))[0].learner_code,'=SUM(1,2)');
  assert.deepEqual(parseCSV(table([['one','two'],['a,"b"\nc','中文']])),[['one','two'],['a,"b"\nc','中文']]);
});
test('CSV rejects unknown schemas, corrupt quotes, blank identities and contradictory evidence',()=>{
  const {save}=sample(),rows=parseCSV(learningCSV(save,banks));
  for(const [column,value] of [['learner_code',''],['hints_used','4'],['attempts','-1'],['completed','false'],['independent_first_answer','true'],['run_id','<script>'],['assignment_instance','bad'],['report_version','3']]){
    const altered=structuredClone(rows);altered[1][REPORT_COLUMNS.indexOf(column)]=value;assert.throws(()=>readReport(table(altered)),/reportInvalid/,column);
  }
  assert.throws(()=>readReport('x,y\n1,2'),/reportInvalid/);assert.throws(()=>parseCSV('"abc'),/reportInvalid/);assert.throws(()=>parseCSV('"x"oops'),/reportInvalid/);
});
test('lesson links isolate identical six-digit settings, labels do not change storage identity, legacy resumes',()=>{
  const config={v:1,world:'quadratics',tasks:3,assist:true,guided:false,language:'en'},a={...config,instanceId:'lesson-a',dueLabel:'星期二 / Selasa'},b={...config,instanceId:'lesson-b'};
  assert.equal(encodeAssignment(a),encodeAssignment(b));assert.match(encodeAssignment(a),/^\d{6}$/);
  assert.deepEqual(assignmentFromURL(assignmentURL(a,'https://example.test/?view=regions')),a);
  assert.notEqual(assignmentKey(a),assignmentKey(b));assert.equal(assignmentKey(a),assignmentKey({...a,dueLabel:'changed'}));
  assert.equal(assignmentKey(decodeAssignment(encodeAssignment(config))),assignmentKey(config));
  assert.equal(assignmentFromURL('https://example.test/?assignment='+encodeAssignment(config)+'&lesson=invalid'),null);
});
test('targeted feedback names only observed mathematical violations and has bilingual keys',()=>{
  assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  assert.equal(diagnostic({kind:'inequality',model:{constraints:[{a:1,b:0,c:3,op:'<'}]}},{x:3,y:1}),'excludedBoundary');
  assert.equal(diagnostic({kind:'probability-plan',target:{total:8}},{red:3,blue:4}),'bagTotal');
  assert.equal(diagnostic({kind:'roots'},{first:7,second:3}),null);
});

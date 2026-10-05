import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLDS} from '../config/worlds.js';
import {selectVariant,variantOptions,ORIGINAL_VARIANT} from '../src/math/variants.js';
import {createQuest} from '../src/missions/quest.js';
import {validate,motionDistance,budgetTotal} from '../src/math/challenges.js';
import {roots,vertex,formatQuadratic} from '../src/math/quadratics.js';
import {assignmentCurriculum,encodeAssignment,decodeAssignment,assignmentKey} from '../src/missions/assignment.js';
import {decodeSave,CONTENT_VERSION} from '../src/storage/save-store.js';
import {REPORT_COLUMNS,learningRows,learningCSV,csvCell} from '../src/learning/report.js';
import {en,ms} from '../locales/practice.js';
const banks=new Map(WORLDS.map(w=>[w.id,JSON.parse(readFileSync(new URL('../'+w.path,import.meta.url),'utf8'))]));
const pass=(q,answer)=>{q.start(q.next.id);q.edit(answer);assert.equal(q.submit().correct,true);q.close();};

test('60 additional bilingual tasks have feasible answers and agree with their independent mathematical models',()=>{
  let count=0;assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  for(const world of WORLDS){const base=banks.get(world.id);assert.equal(variantOptions(base).length,3);
    for(const index of [1,2]){const selected=selectVariant(base,index),q=createQuest(selected);
      assert.deepEqual(selected.challenges.map(d=>d.id),base.challenges.map(d=>d.id));
      for(const [i,d] of selected.challenges.entries()){
        assert.notDeepEqual({model:d.model,target:d.target},{model:base.challenges[i].model,target:base.challenges[i].target});assert.equal(validate(d,d.answer).correct,true);
        for(const language of ['en','ms']){assert.ok(d.title[language]);assert.ok(d.prompt[language]);assert.equal(d.hints[language].length,3);assert.ok(d.explanation[language]);for(const f of d.fields||[])assert.ok(f.label[language]);}
        if(d.kind==='roots')assert.deepEqual(Object.values(d.answer),roots(d.model));
        if(d.kind==='vertex')assert.deepEqual(d.answer,vertex(d.model));
        if(d.kind==='design')assert.equal(d.answer.k*d.answer.span**2/4,d.target.height);
        if(d.kind==='motion-plan')assert.equal(motionDistance(d,d.answer),d.target.distance);
        if(d.model.graph==='distance'){const [a,b,c]=d.model.points;const start=a[1]===b[1]?b:a,end=a[1]===b[1]?c:b;assert.equal(d.answer.value,(end[1]-start[1])/(end[0]-start[0]));}
        if(d.model.graph==='speed')assert.equal(d.answer.value,d.model.segments.reduce((sum,s)=>sum+s.duration*s.speed,0));
        if(d.kind==='probability-reading'){const {red,blue,replacement,event}=d.model,total=red+blue,second=(event==='RR'?red-(replacement?0:1):blue)/(total-(replacement?0:1));assert.equal(d.answer.conditional,second);assert.ok(Math.abs(d.answer.combined-red/total*second)<1e-12);}
        if(d.kind==='finance-reading'){const monthly=d.model.income-d.model.expenses.reduce((s,n)=>s+n,0);assert.equal(d.answer.value,d.model.chart==='balance'?monthly:Math.ceil((d.model.goal-d.model.initial)/monthly));}
        if(d.kind==='budget-plan')assert.ok(budgetTotal(d,d.answer)+d.answer.saving<=d.model.budget);
        pass(q,d.answer);count++;
      }
      assert.equal(q.xp,450);assert.equal(q.independent,6);
    }
  }
  assert.equal(count,60);assert.equal(formatQuadratic({a:-1,b:8,c:0}),'−x² + 8x');assert.equal(formatQuadratic({a:-1,b:8,c:-7}),'−x² + 8x − 7');
});
test('question set identity, drafts, hints and validated rewards survive restore; unknown sets cannot restore completion',()=>{
  const data=banks.get('quadratics'),q=createQuest(selectVariant(data,1));q.start('roots');q.hint();q.edit({first:0,second:8});q.submit();q.close();q.start('vertex');q.edit({x:'4'});
  const restored=createQuest(data,q.save());assert.equal(restored.variantId,'practice-b-v1');assert.equal(restored.xp,75);assert.equal(restored.independent,0);assert.equal(restored.save().sessions.vertex.draft.x,'4');assert.equal(restored.next.model.b,8);
  const bad=q.save();bad.variantId='invented';assert.equal(createQuest(data,bad).xp,0);
  const different=createQuest(selectVariant(data,2),q.save());assert.equal(different.xp,0);assert.equal(different.next.model.b,4);
  const old=createQuest(data);pass(old,{first:0,second:6});const legacy=old.save();delete legacy.variantId;assert.equal(createQuest(data,legacy).xp,75);assert.equal(createQuest(data,legacy).variantId,ORIGINAL_VARIANT);
});
test('teacher sets keep canonical task codes stable and isolate different question sets',()=>{
  const config={v:1,world:'motion',tasks:3,assist:true,guided:false,language:'ms'},original=encodeAssignment(config);
  assert.equal(encodeAssignment({...config,variant:0}),original);
  for(const variant of [1,2]){const code=encodeAssignment({...config,variant}),decoded=decodeAssignment(code);assert.equal(decoded.variant,variant);assert.notEqual(assignmentKey(decoded),assignmentKey(config));const short=assignmentCurriculum(banks.get('motion'),decoded);assert.equal(short.challenges.length,3);assert.equal(createQuest(short).variantIndex,variant);}
  for(const variant of [-1,3,1.5,'1'])assert.equal(decodeAssignment(btoa(JSON.stringify({...config,variant}))),null);
  assert.equal(decodeAssignment(btoa(JSON.stringify({...config,world:'finale',tasks:5,variant:1}))),null);
});
test('content 2 and 3 saves migrate to content 4 with original work and bounded learner labels',()=>{
  for(const version of [2,3]){const migrated=decodeSave({schemaVersion:2,contentVersion:version,currentRegion:'motion',regions:{motion:{world:{wood:8},quest:createQuest(banks.get('motion')).save()}},reportLabel:'CYE001\n'});assert.equal(migrated.contentVersion,CONTENT_VERSION);assert.equal(migrated.regions.motion.world.wood,8);assert.equal(migrated.reportLabel,'CYE001');}
  const bounded=decodeSave({schemaVersion:2,contentVersion:4,currentRegion:'motion',regions:{motion:{quest:{}}},reportLabel:'a'.repeat(100)});assert.equal(bounded.reportLabel.length,40);
});
test('CSV evidence uses validated completions, exact attempts and hints for visited routes only',()=>{
  const q=createQuest(selectVariant(banks.get('quadratics'),1));q.start('roots');q.edit({first:0,second:6});q.submit();q.hint();q.edit({first:0,second:8});q.submit();q.close();pass(q,{x:4,y:16});
  const save={regions:{quadratics:{quest:q.save()},motion:{quest:createQuest(banks.get('motion')).save()}},reportLabel:'CYE007'};
  const rows=learningRows(save,banks,'2026-10-04T00:00:00.000Z'),objects=rows.map(row=>Object.fromEntries(REPORT_COLUMNS.map((c,i)=>[c,row[i]])));
  assert.equal(rows.length,12);assert.ok(rows.every(row=>row.length===REPORT_COLUMNS.length));
  assert.equal(objects[0].status,'completed_supported');assert.equal(objects[0].attempts,2);assert.equal(objects[0].hints_used,1);assert.equal(objects[0].independent_first_answer,false);assert.equal(objects[0].question_set,'practice-b-v1');assert.equal(objects[0].learner_code,'CYE007');assert.match(objects[0].last_attempt_at_utc,/Z$/);
  assert.equal(objects[1].status,'completed_independent');assert.equal(objects[1].xp,75);assert.equal(objects[2].status,'not_started');assert.equal(objects[2].xp,0);
  save.regions.quadratics.quest.variantId='invalid';assert.equal(learningRows(save,banks)[0][REPORT_COLUMNS.indexOf('xp')],0);
});
test('class CSV contains only its configured checks and retains assignment and variant identity',()=>{
  const assignment={v:1,world:'finance',tasks:3,assist:true,guided:true,language:'en',variant:2},q=createQuest(assignmentCurriculum(banks.get('finance'),assignment));pass(q,q.next.answer);
  const rows=learningRows({assignment,regions:{finance:{quest:q.save()},quadratics:{quest:{}}}},banks);
  assert.equal(rows.length,3);assert.ok(rows.every(row=>row[REPORT_COLUMNS.indexOf('mode')]==='class_mission'));
  assert.equal(rows[0][REPORT_COLUMNS.indexOf('mission_code')],encodeAssignment(assignment));assert.equal(rows[0][REPORT_COLUMNS.indexOf('question_set')],'practice-c-v1');
});
test('CSV preserves Unicode, commas, quotes and line breaks, blocks text formulas and handles malformed timestamps',()=>{
  assert.equal(csvCell('A,"B"\nC'),'"A,""B""\nC"');assert.equal(csvCell('  =1+1'),'"\'  =1+1"');assert.equal(csvCell('@SUM(1,2)'),'"\'@SUM(1,2)"');assert.equal(csvCell(-2),'"-2"');
  const q=createQuest(banks.get('motion')),state=q.save();state.records=[{id:'roots',at:1e100,correct:false,hints:0,first:true}];
  const csv=learningCSV({reportLabel:'=HYPERLINK("x")',regions:{motion:{quest:state}}},banks,'2026-10-04T00:00:00.000Z');
  assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('\r\n'));assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"Baca trek"'));assert.equal(learningRows({regions:{motion:{quest:state}}},banks)[0].at(-1),'');
});

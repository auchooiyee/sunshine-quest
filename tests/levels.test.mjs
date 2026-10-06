import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WORLDS} from '../config/worlds.js';
import {selectDifficulty,selectVariant,variantOptions} from '../src/math/variants.js';
import {validate,fieldKeys,motionDistance,budgetTotal,satisfies} from '../src/math/challenges.js';
import {roots,vertex} from '../src/math/quadratics.js';
import {createQuest} from '../src/missions/quest.js';
import {constructionsFor} from '../src/missions/constructions.js';
import {encodeAssignment,decodeAssignment,checkAssignment,assignmentKey,assignmentCurriculum,assignmentURL,assignmentFromURL} from '../src/missions/assignment.js';
import {reviewQueue} from '../src/learning/review.js';
import {learningCSV} from '../src/learning/report.js';
import {readReport,mergeReports} from '../src/learning/class-reports.js';
import {decodeSave,CONTENT_VERSION} from '../src/storage/save-store.js';
import {newRun,archiveRun} from '../src/learning/history.js';
import {en,ms} from '../locales/levels.js';
const banks=new Map(WORLDS.map(w=>[w.id,JSON.parse(readFileSync(new URL('../'+w.path,import.meta.url),'utf8'))]));
const config=(world,level,variant=0)=>({v:1,world,level,tasks:3,assist:true,guided:false,language:'en',...(variant?{variant}:{})});

test('60 bilingual level task versions have complete fields, feasible answers and honest review metadata',()=>{
  let count=0;assert.deepEqual(Object.keys(en).sort(),Object.keys(ms).sort());
  for(const w of WORLDS)for(const level of ['foundation','challenge'])for(const variant of [0,1]){
    const data=assignmentCurriculum(banks.get(w.id),config(w.id,level,variant)),q=createQuest(data);
    assert.equal(data.challenges.length,3);assert.equal(variantOptions(selectDifficulty(banks.get(w.id),level)).length,2);
    for(const d of data.challenges){
      assert.equal(d.difficulty,level);assert.match(d.reviewStatus,/awaiting/);assert.ok(d.skill);assert.deepEqual(Object.keys(d.answer).sort(),fieldKeys(d).sort());
      for(const language of ['en','ms']){assert.ok(d.prompt[language]);assert.ok(d.explanation[language]);assert.equal(d.hints[language].length,3);assert.ok(d.difficultyRationale[language]);for(const f of [...(d.fields||[]),...(d.evidence||[])])assert.ok(f.label[language]);}
      assert.equal(validate(d,d.answer).correct,true,`${w.id}/${level}/${variant}/${d.id}`);
      q.start(d.id);q.edit(d.answer);assert.equal(q.submit().correct,true);q.close();count++;
    }
    assert.equal(q.xp,250);assert.equal(q.independent,3);assert.equal(constructionsFor(w.id,q).items.length,3);
    assert.equal(createQuest(data,q.save()).complete,true);
  }
  assert.equal(count,60);
});
test('level examples agree with independent calculations, not just the game validator',()=>{
  for(const data of banks.values())for(const level of ['foundation','challenge'])for(const variant of [0,1])for(const d of selectVariant(selectDifficulty(data,level),variant).challenges){
    const a=d.answer,m=d.model;
    if(d.kind==='roots')assert.deepEqual([a.first,a.second],roots(m));
    if(d.kind==='vertex')assert.deepEqual({x:a.x,y:a.y},vertex(m));
    if(d.kind==='design')assert.equal(a.k*a.span*a.span/4,d.target.height);
    if(d.kind==='inequality'){assert.ok(m.constraints.every(c=>satisfies(a,c)));if(d.decisions){const costs=d.decisions.routes.filter(p=>m.constraints.every(c=>satisfies(p,c))).map(p=>p.x*d.decisions.weights[0]+p.y*d.decisions.weights[1]);assert.equal(a.cost,Math.min(...costs));}}
    if(d.kind==='motion-plan'){assert.equal(motionDistance(d,a),d.target.distance);if(d.decisions)assert.ok(5*a.v1+2*a.t1<=d.decisions.deliveryBudget);}
    if(d.kind==='motion-reading'&&m.graph==='distance'){const moving=m.points.slice(1).map((p,i)=>({ds:p[1]-m.points[i][1],dt:p[0]-m.points[i][0]})).find(p=>p.ds>0);if(a.moving!==undefined){assert.equal(a.moving,moving.ds/moving.dt);assert.equal(a.value,m.points.at(-1)[1]/m.points.at(-1)[0]);}else assert.equal(a.value,moving.ds/moving.dt);}
    if(d.kind==='motion-reading'&&m.graph==='speed'){assert.equal(a.value,m.segments.reduce((sum,s)=>sum+s.speed*s.duration,0));if(a.average!==undefined)assert.equal(a.average,a.value/m.segments.reduce((sum,s)=>sum+s.duration,0));}
    if(d.kind==='probability-reading'){const total=m.red+m.blue,num=m.event==='RR'?m.red-(m.replacement?0:1):m.blue,den=total-(m.replacement?0:1);assert.equal(a.conditional,num/den);if(a.combined!==undefined)assert.equal(a.combined,m.red/total*num/den);if(a.change!==undefined){const replaced=m.red/total*(m.event==='RR'?m.red:m.blue)/total;assert.ok(Math.abs(a.change-Math.abs(replaced-a.combined))<1e-12);}}
    if(d.kind==='probability-plan'){assert.equal(a.red+a.blue,d.target.total);assert.ok(Math.abs(a.red/(a.red+a.blue)*(a.red-1)/(a.red+a.blue-1)-d.target.probability)<1e-12);}
    if(d.kind==='finance-reading'){const monthly=m.income-m.expenses.reduce((sum,n)=>sum+n,0);assert.equal(a.value,m.chart==='balance'?monthly:Math.ceil((m.goal-m.initial)/monthly));if(a.shortfall!==undefined)assert.equal(a.shortfall,m.goal-m.initial-(a.value-1)*monthly);}
    if(d.kind==='budget-plan'){assert.ok(budgetTotal(d,a)+a.saving<=m.budget);if(d.decisions?.maximumSaving)assert.equal(a.saving,m.budget-m.items.reduce((sum,i)=>sum+i.price*i.minimum,0));}
  }
});
test('correct primary answers cannot bypass missing or incorrect Challenge evidence',()=>{
  for(const data of banks.values())for(const variant of [0,1])for(const d of selectVariant(selectDifficulty(data,'challenge'),variant).challenges){
    const key=d.evidence[0].key,missing={...d.answer};delete missing[key];assert.equal(validate(d,missing).reason,'invalid');
    assert.equal(validate(d,{...d.answer,[key]:d.answer[key]+1}).reason,'evidence');
    const q=createQuest({variantId:'check',variantIndex:0,challenges:[d]});q.start(d.id);q.edit({...d.answer,[key]:d.answer[key]+1});assert.equal(q.submit().correct,false);assert.equal(q.xp,0);q.edit({[key]:d.answer[key]});assert.equal(q.submit().correct,true);assert.equal(q.independent,0);
  }
});
test('decision conditions reject costlier feasible routes, over-budget delivery and non-maximal savings',()=>{
  const route=selectDifficulty(banks.get('inequalities'),'challenge').challenges[0];assert.equal(validate(route,{x:3,y:1,cost:7}).correct,false);assert.equal(validate(route,{x:2,y:2,cost:6}).correct,true);
  const delivery=selectDifficulty(banks.get('motion'),'challenge').challenges[2];assert.equal(validate(delivery,{t1:5,v1:8,fee:50}).correct,false);assert.equal(validate(delivery,{t1:6,v1:7,fee:47}).correct,true);
  const budget=selectDifficulty(banks.get('finance'),'challenge').challenges[2];assert.equal(validate(budget,{food:2,medical:1,lamp:1,saving:30,minimumCost:85}).correct,false);
});
test('Foundation reduces representations/choices and stays distinct from Challenge proof requirements',()=>{
  const q=selectDifficulty(banks.get('quadratics'),'foundation');assert.match(q.challenges[0].prompt.en,/x\(4/);assert.match(q.challenges[1].prompt.en,/\(x − 2\)²/);
  const p=selectDifficulty(banks.get('probability'),'foundation');assert.ok(p.challenges.every(d=>d.fields.length===1&&!d.evidence));
  const m=selectDifficulty(banks.get('motion'),'foundation').challenges[2];assert.equal(validate(m,{t1:4,v1:4}).correct,false);assert.equal(validate(m,m.answer).correct,true);
  assert.equal(banks.get('quadratics').challenges.length,6);assert.equal(variantOptions(banks.get('quadratics')).length,3);
});
test('160 new configurations have unique six-digit codes; group, set and old storage remain isolated',()=>{
  const codes=new Set();
  for(const w of WORLDS)for(const level of ['foundation','challenge'])for(const variant of [0,1])for(const assist of [true,false])for(const guided of [true,false])for(const language of ['en','ms']){
    const c={...config(w.id,level,variant),assist,guided,language},code=encodeAssignment(c);assert.match(code,/^\d{6}$/);assert.deepEqual(decodeAssignment(code),c);assert.ok(!codes.has(code));codes.add(code);
    assert.notEqual(assignmentKey(c),assignmentKey({...c,level:undefined}));
  }
  assert.equal(codes.size,160);assert.equal(checkAssignment({...config('motion','foundation'),tasks:6}),null);assert.equal(checkAssignment({...config('motion','foundation'),variant:2}),null);assert.equal(checkAssignment({...config('finale','challenge'),tasks:5}),null);
  const lesson={...config('motion','challenge',1),instanceId:'lesson-level-test',dueLabel:'4A'};assert.deepEqual(assignmentFromURL(assignmentURL(lesson,'https://example.test')),lesson);
});
test('group-specific review, history, JSON and CSV preserve level and extra evidence independently',()=>{
  const assignment=config('quadratics','challenge'),bank=banks.get('quadratics'),q=createQuest(assignmentCurriculum(bank,assignment));q.start('roots');q.hint();q.edit(q.active.answer);q.submit();
  const region={run:newRun(),quest:q.save(),reviews:{}},queue=reviewQueue(selectDifficulty(bank,'challenge'),region.quest);assert.equal(queue[0].practice.variantId,'challenge-b-v1');const fresh=queue[0].practice;fresh.start('roots');fresh.edit(fresh.active.answer);fresh.submit();region.reviews.roots=fresh.save();
  const history=archiveRun([],'quadratics',region,'L01'),save={schemaVersion:2,contentVersion:CONTENT_VERSION,currentRegion:'quadratics',assignment,reportLabel:'L01',regions:{quadratics:{run:newRun(),quest:createQuest(assignmentCurriculum(bank,assignment)).save(),reviews:{}}},history};
  const restored=decodeSave(JSON.stringify(save));assert.equal(restored.assignment.level,'challenge');assert.equal(restored.history[0].quest.sessions.roots.draft.width,6);
  const rows=readReport(learningCSV(restored,banks));assert.equal(rows.length,7);assert.equal(rows.at(-1).question_set,'challenge-b-v1');assert.equal(rows.at(-1).independent_first_answer,'true');assert.equal(rows.at(-1).xp,'0');assert.equal(mergeReports(rows,rows).length,7);
});

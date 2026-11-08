import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createFieldPlaytest, FIELD_PILOT_KEY, fieldPlaytestCSV, fieldSummaryCSV,
  mergeFieldPlaytests, readFieldPlaytest, summarizeFieldPlaytests
} from '../src/learning/field-playtest.js';

const firstId='11111111-1111-4111-8111-111111111111';
const secondId='22222222-2222-4222-8222-222222222222';

function fixture(id=firstId,enabled=true){
  let time=0;
  const data=new Map();
  const options={enabled,version:'0.17.0',now:()=>time,uuid:()=>id,
    storage:{getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)}};
  return {pilot:createFieldPlaytest(options),data,at:value=>{time=value;},reload:()=>createFieldPlaytest(options)};
}

test('field playtest requires consent on the dedicated link',()=>{
  const off=fixture(firstId,false);
  assert.equal(off.pilot.start(),false);
  assert.equal(off.data.size,0);
  const {pilot,data}=fixture();
  pilot.open('rescue');pilot.event('rescue','complete');pilot.checkpoint();
  assert.equal(pilot.snapshot(),null);
  assert.equal(data.size,0);
  assert.equal(pilot.start(),true);
  assert.equal(pilot.start(),false);
  assert.ok(data.has(FIELD_PILOT_KEY));
  assert.ok(Object.values(pilot.snapshot().rows).every(row=>row.visits===0&&!row.completed));
});

test('field playtest counts checks, hints and visits only while the mission is active',()=>{
  const {pilot,at,reload}=fixture();
  pilot.start();
  at(1000);pilot.open('rescue');
  at(1500);pilot.visibility(false);
  at(5000);pilot.visibility(true);
  at(5500);pilot.event('rescue','check',{step:'anchors',correct:false});
  pilot.event('rescue','hint');pilot.event('storm','hint');pilot.event('rescue','check',{step:'unknown',correct:false});
  pilot.event('rescue','check',{step:'anchors'});
  at(6500);pilot.close('rescue');
  at(9000);pilot.open('rescue');
  at(10000);pilot.event('rescue','check',{step:'design',correct:true});
  at(11000);pilot.event('rescue','complete');
  at(20000);pilot.checkpoint();
  const recorded=reload();
  assert.equal(recorded.active,true);
  assert.equal(recorded.saved,true);
  assert.deepEqual(recorded.snapshot().rows.rescue,{
    visits:2,activeMs:4000,firstCheckMs:1000,checks:2,incorrect:1,hints:1,completed:true,lastCheck:'design'
  });
  recorded.stop();recorded.open('storm');recorded.event('storm','complete');
  assert.equal(reload().active,false);
  assert.equal(reload().snapshot().rows.storm.visits,0);
});

test('a report remains downloadable if browser storage is unavailable',()=>{
  const fail=()=>{throw new Error('Storage unavailable');};
  const pilot=createFieldPlaytest({enabled:true,version:'0.17.0',uuid:()=>firstId,
    storage:{getItem:fail,setItem:fail}});
  assert.equal(pilot.start(),true);
  assert.equal(pilot.saved,false);
  assert.equal(readFieldPlaytest(fieldPlaytestCSV(pilot.snapshot())).id,firstId);
});

test('teacher import rejects malformed rows and uses the newest export per session',()=>{
  const first=fixture(),second=fixture(secondId);
  first.pilot.start();
  const old=readFieldPlaytest(fieldPlaytestCSV(first.pilot.snapshot()));
  for(const [run,firstCheck,finish] of [[first,1000,3000],[second,2000,5000]]){
    const {pilot,at}=run;
    if(!pilot.active)pilot.start();
    pilot.open('storm');
    at(firstCheck);pilot.event('storm','check',{step:'plan',correct:false});
    pilot.event('storm','hint');
    at(finish);pilot.event('storm','check',{step:'plan',correct:true});pilot.event('storm','complete');
  }
  const csv=fieldPlaytestCSV(first.pilot.snapshot());
  assert.throws(()=>readFieldPlaytest(csv.replace('"storm"','"rescue"')),/reportInvalid/);
  assert.throws(()=>readFieldPlaytest(csv.replace('"3.0","1.0"','"3.0","9.0"')),/reportInvalid/);
  assert.throws(()=>readFieldPlaytest(csv.replace('field_playtest_version','class_report_version')),/reportInvalid/);
  const current=readFieldPlaytest(csv),other=readFieldPlaytest(fieldPlaytestCSV(second.pilot.snapshot()));
  const merged=mergeFieldPlaytests([current],[old,current,other]);
  assert.equal(merged.length,2);
  assert.deepEqual(summarizeFieldPlaytests(merged).find(row=>row.mission==='storm'),{
    mission:'storm',started:2,completed:2,incorrect:2,hints:2,medianCompletedSeconds:4,medianFirstCheckSeconds:1.5
  });
  assert.match(fieldSummaryCSV(merged),/"storm","2","2","2","2","4","1\.5"/);
});

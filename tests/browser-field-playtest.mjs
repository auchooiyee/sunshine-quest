import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {encodeAssignment} from '../src/missions/assignment.js';
import {MARKET_KEY} from '../src/missions/camp-market.js';
import {FIELD_PILOT_KEY,readFieldPlaytest} from '../src/learning/field-playtest.js';
import {parseCSV} from '../src/learning/class-reports.js';

const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.QUEST_URL||'http://127.0.0.1:4173';
const pilotURL=new URL('/?view=regions&playtest=1',base).href;
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));
await mkdir(output,{recursive:true});
const errors=[];

async function open(page,url){
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);
}
async function click(page,...ids){for(const id of ids)await page.locator('#'+id).click();}
async function select(page,id,value){await page.locator('#'+id).selectOption(String(value));}
async function nickname(page){await page.locator('#player-input').fill('试玩学生');await click(page,'player-confirm');}
async function walk(page,phase){
  await page.keyboard.down('d');
  try{await page.locator(`#bridge-rescue[open][data-phase="${phase}"]`).waitFor();}
  finally{await page.keyboard.up('d');}
}
async function download(page,id){
  const [file]=await Promise.all([page.waitForEvent('download'),click(page,id)]);
  return {name:file.suggestedFilename(),buffer:await readFile(await file.path())};
}
const stored=page=>page.evaluate(key=>sessionStorage.getItem(key),FIELD_PILOT_KEY);
const importFile=(name,buffer)=>({name,mimeType:'text/csv',buffer});

try{
  const student=await browser.newPage({viewport:{width:1200,height:900}});
  await student.addInitScript(key=>localStorage.setItem(key,'earned'),MARKET_KEY);
  await open(student,pilotURL);
  await nickname(student);
  await student.locator('#field-playtest[open]').waitFor();
  assert.equal(await stored(student),null);
  await click(student,'field-playtest-start');
  await walk(student,'anchors');
  await student.locator('[data-point="1"]').click();
  await student.locator('[data-point="8"]').click();
  await click(student,'rescue-check');
  await student.locator('#rescue-hint summary').click();
  await student.waitForFunction(key=>JSON.parse(sessionStorage.getItem(key)).rows.rescue.hints===1,FIELD_PILOT_KEY);
  await student.locator('[data-point="1"]').click();
  await student.locator('[data-point="2"]').click();
  await click(student,'rescue-check');
  await select(student,'rescue-span',6);await select(student,'rescue-curve',1);
  await click(student,'rescue-build');
  await walk(student,'beacon');
  await click(student,'rescue-light','rescue-next','map-field-playtest');
  const partial=await download(student,'field-playtest-download');
  const bridge=readFieldPlaytest(partial.buffer.toString());
  assert.equal(bridge.rows.rescue.completed,true);
  assert.equal(bridge.rows.rescue.checks,3);
  assert.equal(bridge.rows.rescue.incorrect,1);
  assert.equal(bridge.rows.rescue.hints,1);
  assert.equal(bridge.rows.market.completed,false);
  assert.ok(bridge.rows.rescue.firstCheckMs>0);

  await student.reload();
  await student.locator('#field-playtest[open]').waitFor();
  assert.match(await student.locator('#field-playtest-progress').innerText(),/1\/6/);
  await click(student,'field-playtest-continue');
  await select(student,'delivery-speed',5);
  await click(student,'delivery-check','delivery-board','delivery-skip','delivery-unload','delivery-signal');
  await select(student,'signal-rule','keep');await select(student,'signal-red',2);
  await click(student,'signal-check','signal-pick-red','signal-pick-red','signal-pick-red','signal-pick-blue',
    'signal-pick-blue','signal-pick-red','signal-send','signal-skip','signal-market');
  for(const [item,n] of [['food',2],['medical',1],['lamp',1]])await select(student,'market-quantity-'+item,n);
  await click(student,'market-check','market-unpack','market-light','market-canyon');
  await select(student,'canyon-x',4);await select(student,'canyon-y',2);
  await click(student,'canyon-check','canyon-launch','canyon-skip','canyon-storm','storm-check');
  await select(student,'storm-time',4);await select(student,'storm-speed',5);
  await click(student,'storm-check','storm-send','storm-skip','storm-unload','storm-playtest-report');
  await student.locator('#field-playtest[open]').getByText(/6\/6 completed/).waitFor();
  await click(student,'field-playtest-stop');
  assert.match(await student.locator('#field-playtest-progress').innerText(),/Recording stopped/);
  const final=await download(student,'field-playtest-download');
  const finalCSV=final.buffer.toString(),complete=readFieldPlaytest(finalCSV);
  assert.equal(complete.id,bridge.id);
  assert.equal(complete.version,await student.locator('meta[name="application-version"]').getAttribute('content'));
  assert.equal(complete.rows.signal.checks,4);
  assert.equal(complete.rows.signal.incorrect,1);
  assert.equal(complete.rows.storm.incorrect,1);
  assert.ok(Object.values(complete.rows).every(r=>r.completed&&r.visits===1&&r.checks>0));
  assert.doesNotMatch(finalCSV,/试玩学生|nickname|learner|student_name/);

  const teacher=await browser.newPage({viewport:{width:1200,height:900}});
  await open(teacher,base+'/?view=regions');await nickname(teacher);
  await click(teacher,'rescue-exit','map-field-playtest');
  assert.equal(await stored(teacher),null);
  assert.equal(await teacher.locator('#field-playtest-link').inputValue(),pilotURL);
  assert.equal(await teacher.locator('#field-playtest-student').isVisible(),false);
  const files=teacher.locator('#field-playtest-files');
  await files.setInputFiles([importFile('old.csv',partial.buffer),importFile('new.csv',final.buffer)]);
  await teacher.getByText('Imported sessions: 1').waitFor();
  await files.setInputFiles([importFile('bad.csv',Buffer.from('wrong schema')),importFile('repeat.csv',partial.buffer)]);
  await teacher.getByText('Existing imports are unchanged.',{exact:false}).waitFor();
  const summary=await download(teacher,'field-playtest-export-summary');
  assert.deepEqual(parseCSV(summary.buffer.toString()).find(row=>row[0]==='storm').slice(1,5),['1','1','1','0']);
  await teacher.screenshot({path:output+'/field-playtest-teacher.png'});

  const phone=await browser.newPage({viewport:{width:390,height:667},isMobile:true,hasTouch:true});
  await open(phone,pilotURL);await nickname(phone);
  await phone.locator('#field-playtest-language').tap();
  assert.match(await phone.locator('#field-playtest-title').innerText(),/Uji main/);
  assert.equal(await phone.locator('#field-playtest').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  await phone.screenshot({path:output+'/field-playtest-phone.png'});
  await phone.locator('#field-playtest-close').tap();
  await phone.locator('#region-map[open]').waitFor();
  assert.equal(await stored(phone),null);

  const assignment={v:1,world:'finale',tasks:5,assist:true,guided:false,language:'en'};
  const assigned=await browser.newPage();
  await open(assigned,base+'/?playtest=1&assignment='+encodeAssignment(assignment));await nickname(assigned);
  await click(assigned,'intro-regions');
  assert.equal(await assigned.locator('#map-field-playtest').isVisible(),false);
  assert.equal(await stored(assigned),null);
  assert.deepEqual(errors,[]);
  console.log('Field playtest: opt-in, all six missions, refresh, CSV privacy, teacher deduplication, invalid imports, BM phone and assignment isolation passed.');
}finally{await browser.close();}

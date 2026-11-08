import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {encodeAssignment} from '../src/missions/assignment.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),url=process.env.QUEST_URL||'http://127.0.0.1:4173';
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));await mkdir(output,{recursive:true});
const checks=[],errors=[];
const phase=(p,key)=>p.locator(`#crystal-signal[open][data-phase="${key}"]`).waitFor();
const snap=p=>p.evaluate(()=>window.mathQuest.snapshot());
const count=(p)=>p.locator('#signal-gems .signal-gem').count();
async function ready(p,target){p.on('pageerror',e=>errors.push(e.message));await p.goto(target);await p.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
async function nickname(p){await p.locator('#player-input').fill('小明');await p.locator('#player-confirm').click();}
async function map(p){await ready(p,url+'/?view=regions');await nickname(p);await p.locator('#rescue-exit').click();await p.locator('#region-map').waitFor();}
async function pick(p,order,action='click'){for(const colour of order)await p.locator(colour==='R'?'#signal-pick-red':'#signal-pick-blue')[action]();}
try{
  const p=await browser.newPage({viewport:{width:1440,height:900}});await map(p);const before=await snap(p);
  await p.locator('#map-delivery').click();await p.locator('#delivery-speed').selectOption('5');await p.locator('#delivery-check').click();await p.locator('#delivery-board').click();await p.locator('#delivery-skip').click();await p.locator('#delivery-unload').click();
  assert.equal(await p.locator('#delivery-map').isVisible(),true);await p.locator('#delivery-signal').click();await phase(p,'plan');assert.equal(await p.locator('#signal-player').innerText(),'小明');checks.push('Cart completion offers the lake mission directly, plus the existing map action');
  assert.equal(await p.locator('#signal-chance').innerText(),'1/2');await p.locator('#signal-check').click();assert.match(await p.locator('#signal-feedback').innerText(),/six in the bag/);assert.equal(await p.locator('#signal-pick-red').isVisible(),false);
  await p.locator('#signal-rule').selectOption('keep');assert.equal(await p.locator('#signal-chance').innerText(),'3/5');assert.equal(await p.locator('#signal-tree [data-order="RB"] .signal-tree-conditional').textContent(),'3/5');
  await p.locator('#signal-check').click();assert.match(await p.locator('#signal-feedback').innerText(),/above 8\/15/);await p.locator('#signal-red').selectOption('1');await p.locator('#signal-check').click();assert.match(await p.locator('#signal-feedback').innerText(),/below 8\/15/);
  await p.locator('#signal-red').selectOption('2');assert.equal(await p.locator('#signal-chance').innerText(),'8/15');assert.match(await p.locator('#signal-sum').innerText(),/4\/15 \+ 4\/15 = 8\/15/);await p.screenshot({path:output+'/signal-desktop-plan.png'});await p.locator('#signal-check').click();await phase(p,'trace');checks.push('Bag and return rule update the exact branch probabilities; invalid bags do not open the signal controls');
  await pick(p,'R');assert.equal(await count(p),5);assert.match(await p.locator('#signal-bag-count').innerText(),/1 red \+ 4 blue/);await pick(p,'R');assert.equal(await count(p),6);assert.match(await p.locator('#signal-feedback').innerText(),/same colour/);assert.equal(await p.locator('#signal-scene .is-lit').count(),0);
  await pick(p,'RB');assert.equal(await p.locator('#signal-rb-lamp.is-lit').count(),1);assert.equal(await p.locator('#signal-send').isVisible(),false);await pick(p,'RB');assert.match(await p.locator('#signal-feedback').innerText(),/already lit/);assert.equal(await p.locator('#signal-scene .is-lit').count(),1);
  await pick(p,'BR');await phase(p,'ready');assert.equal(await p.locator('#signal-scene .is-lit').count(),2);await p.screenshot({path:output+'/signal-desktop-lanterns.png'});checks.push('Selecting a first crystal visibly removes it; only the two different orders light both lanterns');
  const parked=await p.locator('#signal-boat').getAttribute('transform');await p.locator('#signal-send').click();await phase(p,'sailing');await phase(p,'complete');assert.notEqual(await p.locator('#signal-boat').getAttribute('transform'),parked);assert.match(await p.locator('#signal-finish').innerText(),/Signal Keeper/);await p.screenshot({path:output+'/signal-desktop-complete.png'});
  const after=await snap(p);assert.deepEqual(after.quest,before.quest);assert.equal(after.xp,before.xp);assert.equal(after.world.wood,before.world.wood);await p.locator('#signal-map').click();await p.locator('#region-map').waitFor();assert.match(await p.locator('#map-signal').innerText(),/Replay/);await p.reload();await p.locator('#region-map').waitFor();assert.match(await p.locator('#map-signal').innerText(),/Replay/);checks.push('The ferry docks and the local badge persists, without changing learning evidence or materials');
  const phone=await browser.newPage({viewport:{width:390,height:667},isMobile:true,hasTouch:true,reducedMotion:'reduce'});await map(phone);await phone.locator('#map-signal').tap();await phase(phone,'plan');await phone.locator('#signal-language').tap();assert.match(await phone.locator('#signal-title').innerText(),/Isyarat Kristal/);
  await phone.locator('#signal-rule').selectOption('keep');await phone.locator('#signal-red').selectOption('4');const rect=await phone.locator('#signal-check').boundingBox();assert.ok(rect.y+rect.height<=667);assert.equal(await phone.locator('#crystal-signal').evaluate(el=>el.scrollWidth>el.clientWidth),false);await phone.screenshot({path:output+'/signal-phone-plan.png'});
  await phone.locator('#signal-check').tap();await pick(phone,'BRRB','tap');await phase(phone,'ready');await phone.locator('#signal-send').tap();await phone.locator('#signal-skip').tap();await phase(phone,'complete');assert.match(await phone.locator('#signal-finish').innerText(),/Penjaga Isyarat/);checks.push('The BM phone layout fits the controls and accepts the other valid bag and reversed order');
  const assignment={v:1,world:'probability',tasks:3,assist:true,guided:false,language:'en'},student=await browser.newPage();await ready(student,url+'/?assignment='+encodeAssignment(assignment));await nickname(student);await student.locator('#intro-regions').click();assert.equal(await student.locator('#map-signal').isVisible(),false);assert.equal((await snap(student)).assignment.world,'probability');checks.push('Teacher-assigned Probability Lake still opens its original classroom lesson');
  assert.deepEqual(errors,[]);const report={at:new Date().toISOString(),checks,errors};await writeFile(output+'/signal-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

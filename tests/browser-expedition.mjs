/** Full M2 browser flow: normal controls, isolated profiles, no write hooks. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WORLDS } from '../config/worlds.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));await mkdir(output,{recursive:true});
const url=process.env.QUEST_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,channel:'chrome'}),checks=[],errors=[];
const data=new Map(await Promise.all(WORLDS.map(async w=>[w.id,JSON.parse(await readFile(new URL('../'+w.path,import.meta.url),'utf8'))])));
const snap=p=>p.evaluate(()=>window.mathQuest.snapshot());
function watch(page){page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
async function ready(page,target=url){await page.goto(target);await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
async function choose(page,id){await page.locator('#region-button').click();const w=WORLDS.find(w=>w.id===id);await page.locator('.region-card').filter({hasText:w.name.en}).locator('button').click();await page.waitForFunction(id=>window.mathQuest.snapshot().region===id,id);}
async function station(page){await page.locator('#checkpoint').click();await page.locator('#interaction').click();}
async function fill(page,def,answer=def.answer){
  for(const f of def.fields){const input=page.locator('#answer-'+f.key);if(f.type==='range'){await input.focus();await input.press('Home');for(let i=0;i<Math.round((answer[f.key]-f.min)/f.step);i++)await input.press('ArrowRight');}else await input.fill(String(answer[f.key]));}
}
async function point(page,x,y){
  const p=await page.locator('#math-graph').evaluate((svg,values)=>{const g=window.mathQuest.snapshot().graph;const p=new DOMPoint(g.left+values.x/g.maxX*(g.W-g.left-g.right),g.H-g.bottom-values.y/g.maxY*(g.H-g.top-g.bottom)).matrixTransform(svg.getScreenCTM());return{x:p.x,y:p.y};},{x,y});
  await page.mouse.click(p.x,p.y);
}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});watch(page);await ready(page);
  await page.locator('#region-button').click();await page.screenshot({path:output+'/regions.png',fullPage:true});await page.locator('[data-close="region-map"]').click();
  for(const world of WORLDS.slice(1)){
    await choose(page,world.id);await page.locator('#start-button').click();
    for(const [i,def] of data.get(world.id).challenges.entries()){
      if(i<=3)await station(page);
      if(world.id==='inequalities'&&i===0){await point(page,3,3);assert.equal(await page.locator('#answer-x').inputValue(),'3');assert.equal(await page.locator('#answer-y').inputValue(),'3');}
      if(world.id==='inequalities'&&i===1){await fill(page,def,{x:3,y:4});await page.locator('#submit-answer').click();assert.equal((await snap(page)).quest.completed.length,1);assert.equal((await snap(page)).quest.sessions.vertex.attempts,1);assert.match(await page.locator('#feedback').innerText(),/Not quite/);}
      if(world.id==='probability'&&i===1){await page.locator('#answer-conditional').fill('3/5');await page.locator('#answer-combined').fill('9/25');await page.locator('#submit-answer').click();assert.equal((await snap(page)).quest.completed.length,1);}
      if(world.id==='finance'&&i===2){await fill(page,def,{food:6,medical:3,lamp:4,saving:30});await page.locator('#submit-answer').click();assert.equal((await snap(page)).quest.completed.length,2);assert.match(await page.locator('#graph-summary').innerText(),/RM-140/);}
      if(world.id==='probability'&&i===1){await page.locator('#answer-conditional').fill('1/2');await page.locator('#answer-combined').fill('3/10');}else await fill(page,def);
      if(world.id==='motion'&&i===2){
        const before=await snap(page);await page.locator('#preview-action').click();await page.waitForTimeout(700);assert.match(await page.locator('#graph-summary').innerText(),/Planned distance: 50 m/);assert.equal((await snap(page)).world.elapsed,before.world.elapsed);
      }
      await page.locator('#submit-answer').click();assert.equal((await snap(page)).quest.completed.length,i+1,`${world.id}/${def.id}`);
      if(i===2){await page.screenshot({path:output+`/${world.id}-challenge.png`,fullPage:true});assert.ok((await snap(page)).world.application);}
      await page.locator('#continue-challenge').click();
      if(i===2){await page.screenshot({path:output+`/${world.id}-restored.png`,fullPage:true});}
    }
    assert.equal((await snap(page)).xp,450);assert.equal((await snap(page)).world.trophy,true);await page.locator('#finish-exit').click();checks.push(`${world.id}: six checks, safe retries, applied world effect and completion`);
  }
  await page.reload();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);await page.locator('#finish-exit').click();await page.locator('#region-button').click();assert.match(await page.locator('#course-progress').innerText(),/1800 \/ 2250/);await page.screenshot({path:output+'/course-progress.png',fullPage:true});await page.locator('[data-close="region-map"]').click();
  await page.locator('#journal-button').click();const download=page.waitForEvent('download');await page.locator('#export-progress').click();await(await download).saveAs(output+'/expedition-export.json');await page.locator('[data-close="journal"]').click();
  const exported=JSON.parse(await readFile(output+'/expedition-export.json','utf8'));assert.equal(exported.schemaVersion,2);assert.equal(Object.keys(exported.regions).length,5);checks.push('Region progress, course XP and export persist across refresh');
  await page.locator('#teacher-button').click();await page.locator('#teacher-world').selectOption('probability');await page.locator('#teacher-tasks').selectOption('3');await page.locator('#teacher-support').selectOption('guided');await page.locator('#teacher-language').selectOption('ms');
  assert.equal(await page.locator('#teacher-answers li').count(),3);await page.locator('.teacher-preview summary').click();await page.screenshot({path:output+'/teacher.png',fullPage:true});await page.locator('#generate-code').click();const classLink=await page.locator('#generated-link').inputValue();await page.locator('#launch-class').click();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().assignment);
  assert.equal((await snap(page)).language,'ms');assert.equal((await snap(page)).xp,0);assert.equal((await snap(page)).assignment.tasks,3);assert.equal(await page.locator('#assist').isDisabled(),true);await page.locator('#start-button').click();await station(page);
  assert.equal((await snap(page)).quest.sessions.roots.hints,1);assert.equal(await page.locator('#hints li').count(),1);
  await fill(page,data.get('probability').challenges[0]);await page.locator('#submit-answer').click();assert.equal((await snap(page)).xp,75);assert.equal((await snap(page)).independent,0);await page.locator('#continue-challenge').click();
  await page.reload();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);assert.equal((await snap(page)).xp,75);assert.equal((await snap(page)).quest.sessions.roots.hints,1);
  await page.locator('#leave-class').click();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&!window.mathQuest.snapshot().assignment);assert.equal((await snap(page)).region,'finance');assert.equal((await snap(page)).xp,450);await page.locator('#finish-exit').click();checks.push('Teacher preview, generated code, BM guided mission and save isolation');
  await page.locator('#region-button').click();await page.locator('#join-input').fill('not-a-valid-code');await page.locator('#join-form button').click();assert.match(await page.locator('#join-error').innerText(),/invalid/);await page.locator('#join-input').fill(classLink);await page.locator('#join-form button').click();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().assignment);assert.equal((await snap(page)).xp,75);checks.push('Join-code validation and matching mission recovery');
  await page.locator('#start-button').click();for(let i=1;i<3;i++){await station(page);await fill(page,data.get('probability').challenges[i]);await page.locator('#submit-answer').click();await page.locator('#continue-challenge').click();}
  assert.equal((await snap(page)).xp,250);assert.equal((await snap(page)).quest.completed.length,3);assert.equal((await snap(page)).independent,0);assert.equal(await page.locator('#mission-list li').count(),3);await page.locator('#finish-exit').click();checks.push('Three-station mission completes without Guardian or independent-answer inflation');
  const imported=await browser.newPage();watch(imported);await ready(imported);await imported.locator('#journal-button').click();imported.once('dialog',d=>d.accept());await imported.locator('#import-file').setInputFiles(output+'/expedition-export.json');await imported.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().xp===450);await imported.locator('#finish-exit').click();await imported.locator('#region-button').click();assert.match(await imported.locator('#course-progress').innerText(),/1800 \/ 2250/);checks.push('All-region import preserves every completed route');
  const migrated=await browser.newPage();watch(migrated);await migrated.addInitScript(()=>{if(!sessionStorage.seeded){localStorage.setItem('mathwithcye-sunshine-quest-v1',JSON.stringify({schemaVersion:1,contentVersion:1,language:'en',quest:{completed:['roots'],sessions:{roots:{draft:{first:0,second:6},hints:1,attempts:1,independent:false},vertex:{draft:{x:'3'},hints:2,attempts:0}},records:[]},world:{version:2,wood:8,player:{x:1000,hp:4}}}));sessionStorage.seeded='yes';}});await ready(migrated);assert.equal((await snap(migrated)).xp,75);assert.equal((await snap(migrated)).world.wood,8);assert.equal((await snap(migrated)).quest.sessions.vertex.hints,2);await migrated.reload();await migrated.waitForFunction(()=>window.mathQuest?.snapshot().loaded);assert.equal((await snap(migrated)).quest.sessions.vertex.draft.x,'3');checks.push('Actual M1 browser save migrates with materials, draft, hint and XP intact');
  const blocked=await browser.newPage();watch(blocked);await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Disabled');}}));await ready(blocked);await choose(blocked,'motion');await blocked.locator('#start-button').click();assert.equal((await snap(blocked)).region,'motion');assert.match(await blocked.locator('#save-status').innerText(),/unavailable/);checks.push('Region switching also works with browser storage disabled');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});watch(mobile);await ready(mobile);await mobile.locator('#region-button').tap();assert.equal(await mobile.locator('#region-map').evaluate(e=>e.scrollWidth>e.clientWidth),false);await mobile.screenshot({path:output+'/mobile-regions.png',fullPage:true});await mobile.locator('.region-card').filter({hasText:'Finance Camp'}).locator('button').tap();await mobile.locator('#teacher-button').tap();assert.equal(await mobile.locator('#teacher').evaluate(e=>e.scrollWidth>e.clientWidth),false);await mobile.screenshot({path:output+'/mobile-teacher.png',fullPage:true});await mobile.locator('[data-close="teacher"]').tap();await mobile.locator('#start-button').tap();await station(mobile);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await mobile.locator('#challenge').evaluate(e=>e.scrollWidth>e.clientWidth),false);await mobile.screenshot({path:output+'/mobile-finance.png',fullPage:true});checks.push('Phone layouts for region map, teacher settings and budget tasks');
  assert.deepEqual(errors,[]);const report={at:new Date().toISOString(),checks,errors,note:'Chrome desktop and mobile emulation; physical devices and teacher content review remain pending.'};await writeFile(output+'/expedition-browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

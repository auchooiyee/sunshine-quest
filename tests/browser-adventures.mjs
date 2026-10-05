import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {WORLDS} from '../config/worlds.js';
import {ADVENTURES} from '../config/adventures.js';
import {roots,vertex} from '../src/math/quadratics.js';
import {encodeAssignment} from '../src/missions/assignment.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'}),url=process.env.QUEST_URL||'http://127.0.0.1:4173';
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));await mkdir(output,{recursive:true});
const errors=[],checks=[],snap=p=>p.evaluate(()=>window.mathQuest.snapshot());
const answer=d=>d.answer||(d.kind==='roots'?Object.fromEntries(roots(d.model).map((v,i)=>[i?'second':'first',v])):d.kind==='vertex'?vertex(d.model):{span:d.target.span,k:4*d.target.height/d.target.span**2});
async function ready(p,target=url){p.on('pageerror',e=>errors.push(e.message));await p.goto(target);await p.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
async function fill(p,values){for(const [key,value] of Object.entries(values)){const field=p.locator('#answer-'+key);if(await field.getAttribute('type')==='range'){const min=Number(await field.getAttribute('min')),step=Number(await field.getAttribute('step'));await field.focus();await field.press('Home');for(let n=0;n<Math.round((value-min)/step);n++)await field.press('ArrowRight');}else await field.fill(String(value));}}
try{
  for(const world of WORLDS){
    const page=await browser.newPage({viewport:{width:1440,height:1050}});await ready(page);
    if(world.id!=='quadratics'){await page.locator('#region-button').click();await page.locator('.region-card').filter({hasText:world.name.en}).locator('button').click();}
    assert.equal((await snap(page)).world.routeId,world.id);
    await page.locator('#intro-brief summary').click();assert.match(await page.locator('#intro-brief-text').innerText(),new RegExp(ADVENTURES[world.id].brief.en.slice(0,20)));
    await page.locator('#start-button').click();await page.locator('#stage').screenshot({path:output+`/v06-${world.id}-entrance.png`});
    const bank=JSON.parse(await readFile(new URL('../'+world.path,import.meta.url),'utf8'));
    for(const [index,def] of bank.challenges.entries()){
      if(!await page.locator('#challenge').isVisible()){await page.locator('#checkpoint').click();await page.locator('#interaction').click();}
      assert.equal((await snap(page)).world.player.x,ADVENTURES[world.id].stations[def.station]-75);
      if(index>=3){assert.equal(await page.locator('#guardian-encounter').isVisible(),true);assert.equal(await page.locator('#guardian-name').innerText(),ADVENTURES[world.id].guardian.en);}
      await fill(page,answer(def));await page.locator('#submit-answer').click();assert.equal((await snap(page)).world.constructions.length,index+1);
      if(index===3){await page.locator('#inspect-world').click();await page.locator('#stage').screenshot({path:output+`/v06-${world.id}-guardian.png`});assert.equal(await page.locator('#construction-list li').count(),4);}
      else await page.locator('#continue-challenge').click();
    }
    await page.locator('#completion').waitFor({state:'visible'});assert.equal((await snap(page)).xp,450);assert.ok(await page.locator('#completion-restored').innerText());await page.locator('#finish-exit').click();
    await page.locator('#journal-button').click();assert.equal(await page.locator(`[data-relic="${world.id}"].earned`).count(),1);assert.equal(await page.locator('.relic.earned').count(),1);await page.locator('[data-close="journal"]').click();
    if(world.id==='motion'){
      const evidence=(await snap(page)).quest;await page.locator('#replay-carts').click();await page.waitForFunction(()=>window.mathQuest.snapshot().world.application.effects.every(a=>a.elapsed>.25));await page.locator('#journal-button').click();
      const before=(await snap(page)).world.application.effects.map(a=>a.elapsed);await page.reload();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);assert.deepEqual((await snap(page)).world.application.effects.map(a=>a.elapsed),before);assert.deepEqual((await snap(page)).quest,evidence);
    }else{await page.reload();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
    assert.equal((await snap(page)).world.constructions.length,6);await page.locator('#finish-exit').click();await page.locator('#stage').screenshot({path:output+`/v06-${world.id}-restored.png`});
    checks.push(`${world.id}: distinct route, briefing, six constructions, Guardian inspection, keepsake and save recovery`);await page.close();
  }
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await ready(phone,url+'/?assignment='+encodeAssignment({v:1,world:'inequalities',tasks:3,assist:true,guided:false,language:'ms'}));await phone.locator('#start-button').tap();
  const bank=JSON.parse(await readFile(new URL('../data/mathematics/f4/bab06.json',import.meta.url),'utf8'));
  for(const def of bank.challenges.slice(0,3)){await phone.locator('#checkpoint').tap();await phone.locator('#interaction').tap();await fill(phone,def.answer);await phone.locator('#submit-answer').tap();await phone.locator('#continue-challenge').tap();}
  await phone.locator('#finish-exit').tap();await phone.locator('#field-station summary').tap();assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.match(await phone.locator('#field-npc').innerText(),/juruukur/i);await phone.screenshot({path:output+'/v06-phone-notebook.png',fullPage:true});await phone.locator('#journal-button').tap();assert.equal(await phone.locator('#restoration-collection').isVisible(),false);
  checks.push('Phone BM short mission, reduced motion, notebook and classroom reward isolation');
  assert.deepEqual(errors,[]);const result={at:new Date().toISOString(),checks,errors};await writeFile(output+'/adventures-browser-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}

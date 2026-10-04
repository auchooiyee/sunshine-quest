/** Run with the dev server active and Playwright available (or PLAYWRIGHT_PACKAGE set). */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));
await mkdir(output,{recursive:true});
const url=process.env.QUEST_URL || 'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const errors=[], checks=[];
function attach(page){page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});}
const snapshot=page=>page.evaluate(()=>window.mathQuest.snapshot());
async function ready(page){await page.goto(url);await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
async function checkpoint(page){await page.locator('#checkpoint').click();await page.locator('#interaction').click();}
async function setSlider(page,key,value){const slider=page.locator('#answer-'+key);await slider.focus();await slider.press('Home');const step=key==='span'?1:.25,min=key==='span'?4:.25;for(let i=0;i<Math.round((value-min)/step);i++)await slider.press('ArrowRight');}
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});attach(page);await ready(page);
  await page.screenshot({path:output+'/desktop.png',fullPage:true});await page.locator('#start-button').click();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1700);await page.keyboard.up('ArrowRight');
  const moved=await snapshot(page);assert.ok(moved.world.player.x>450);await page.keyboard.press('KeyE');
  await page.locator('#answer-first').fill('1');await page.locator('#answer-second').fill('6');await page.locator('#submit-answer').click();
  assert.match(await page.locator('#feedback').innerText(),/Not quite/);
  const frozen=await snapshot(page);await page.waitForTimeout(400);const after=await snapshot(page);
  assert.equal(after.world.elapsed,frozen.world.elapsed);assert.equal(after.world.player.hp,frozen.world.player.hp);checks.push('Movement and safe retry / pause');
  await page.locator('#hint-button').click();await page.locator('#challenge-language').click();assert.equal(await page.getAttribute('html','lang'),'ms');assert.equal(await page.locator('#answer-first').inputValue(),'1');
  await page.locator('#challenge-close').click();await page.reload();await page.waitForFunction(()=>window.mathQuest.snapshot().loaded);await page.locator('#start-button').click();await checkpoint(page);
  assert.equal(await page.locator('#answer-first').inputValue(),'1');assert.equal((await snapshot(page)).quest.sessions.roots.hints,1);checks.push('Language, draft and hint recovery');
  await page.locator('#answer-first').fill('6');await page.locator('#answer-second').fill('0');await page.locator('#submit-answer').click();assert.equal((await snapshot(page)).xp,75);assert.equal((await snapshot(page)).independent,0);await page.locator('#continue-challenge').click();
  await checkpoint(page);await page.locator('#answer-x').fill('3');await page.locator('#answer-y').fill('9');await page.locator('#submit-answer').click();await page.screenshot({path:output+'/math-station.png',fullPage:true});await page.locator('#continue-challenge').click();
  await checkpoint(page);await setSlider(page,'span',8);await setSlider(page,'k',.75);await page.locator('#submit-answer').click();assert.equal((await snapshot(page)).world.platforms.filter(p=>p.questBridge).length,16);await page.locator('#continue-challenge').click();await page.screenshot({path:output+'/bridge-built.png',fullPage:true});checks.push('Anchors, vertex and live bridge construction');
  await checkpoint(page);await page.locator('#answer-first').fill('2');await page.locator('#answer-second').fill('8');await page.locator('#submit-answer').click();assert.equal((await snapshot(page)).world.enemies.at(-1).hp,20);await page.locator('#continue-challenge').click();
  await page.locator('#answer-x').fill('5');await page.locator('#answer-y').fill('9');await page.locator('#submit-answer').click();assert.equal((await snapshot(page)).world.enemies.at(-1).hp,10);await page.locator('#continue-challenge').click();
  await setSlider(page,'span',10);await setSlider(page,'k',1);await page.locator('#submit-answer').click();await page.locator('#continue-challenge').click();await page.locator('#completion').waitFor({state:'visible'});
  assert.equal((await snapshot(page)).xp,450);assert.equal((await snapshot(page)).independent,5);await page.screenshot({path:output+'/complete.png',fullPage:true});checks.push('All Guardian phases and completion');
  await page.locator('#review-button').click();await page.locator('#journal').waitFor({state:'visible'});const downloadPromise=page.waitForEvent('download');await page.locator('#export-progress').click();await (await downloadPromise).saveAs(output+'/progress-export.json');await page.locator('[data-close="journal"]').click();await page.reload();await page.waitForFunction(()=>window.mathQuest.snapshot().loaded);await page.locator('#completion').waitFor({state:'visible'});await page.locator('#finish-exit').click();assert.equal((await snapshot(page)).world.mode,'playing');assert.equal((await snapshot(page)).xp,450);checks.push('Journal, export and completed save recovery');
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});attach(mobile);await ready(mobile);assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:output+'/mobile.png',fullPage:true});
  await mobile.locator('#start-button').tap();await mobile.locator('#checkpoint').tap();await mobile.locator('[data-control="interact"]').tap();assert.equal(await mobile.locator('#challenge').evaluate(el=>el.scrollWidth>el.clientWidth),false);
  for(const x of [6,0]){
    const click=await mobile.locator('#math-graph').evaluate((svg,x)=>{const g=window.mathQuest.snapshot().graph;const p=new DOMPoint(g.left+(x-g.minX)/(g.maxX-g.minX)*(g.W-g.left-g.right),g.H-g.bottom-(0-g.minY)/(g.maxY-g.minY)*(g.H-g.top-g.bottom)).matrixTransform(svg.getScreenCTM());return{x:p.x,y:p.y};},x);
    await mobile.touchscreen.tap(click.x,click.y);
  }
  assert.equal(await mobile.locator('#answer-first').inputValue(),'6');assert.equal(await mobile.locator('#answer-second').inputValue(),'0');await mobile.locator('#submit-answer').tap();assert.equal((await snapshot(mobile)).xp,75);await mobile.screenshot({path:output+'/mobile-challenge.png',fullPage:true});checks.push('Mobile layout, touch and graph selection');
  await mobile.locator('#continue-challenge').tap();await mobile.setViewportSize({width:844,height:390});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await mobile.screenshot({path:output+'/mobile-landscape.png',fullPage:true});checks.push('Landscape layout');
  const imported=await browser.newPage();attach(imported);await ready(imported);await imported.locator('#journal-button').click();
  const invalidAlert=imported.waitForEvent('dialog');await imported.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});const invalidDialog=await invalidAlert;assert.match(invalidDialog.message(),/not a compatible/);await invalidDialog.accept();
  const confirmImport=imported.waitForEvent('dialog');await imported.locator('#import-file').setInputFiles(output+'/progress-export.json');await (await confirmImport).accept();await imported.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().xp===450);assert.equal((await snapshot(imported)).independent,5);assert.equal((await snapshot(imported)).language,'ms');checks.push('Import validation and recovery');
  const blocked=await browser.newPage();attach(blocked);await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('Storage disabled');}}));await ready(blocked);await blocked.locator('#start-button').click();assert.match(await blocked.locator('#save-status').innerText(),/Saving unavailable/);checks.push('Storage-disabled fallback');
  const corrupt=await browser.newPage();attach(corrupt);await corrupt.addInitScript(()=>localStorage.setItem('mathwithcye-sunshine-quest-v1','{broken'));await ready(corrupt);assert.equal((await snapshot(corrupt)).xp,0);assert.match(await corrupt.locator('#toast').innerText(),/unreadable save/);checks.push('Corrupted save fallback');
  assert.deepEqual(errors,[]);
  const report={at:new Date().toISOString(),checks,errors,note:'Chrome desktop and mobile emulation. Real Android/iOS hardware and teacher review remain pending.'};await writeFile(output+'/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

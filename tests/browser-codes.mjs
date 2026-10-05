import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {encodeAssignment,decodeAssignment} from '../src/missions/assignment.js';
import {selectVariant} from '../src/math/variants.js';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_PACKAGE||'playwright');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const url=process.env.QUEST_URL||'http://127.0.0.1:4173';
const output=fileURLToPath(new URL('../artifacts/',import.meta.url));
await mkdir(output,{recursive:true});
const errors=[],checks=[],snap=p=>p.evaluate(()=>window.mathQuest.snapshot());
async function ready(p,target=url){await p.goto(target);await p.waitForFunction(()=>window.mathQuest?.snapshot().loaded);}
async function answer(p,values){await p.locator('#checkpoint').click();await p.locator('#interaction').click();for(const [key,value] of Object.entries(values))await p.locator('#answer-'+key).fill(String(value));await p.locator('#submit-answer').click();await p.locator('#continue-challenge').click();}
try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await ready(page);
  await page.locator('#teacher-button').click();await page.locator('#teacher-world').selectOption('finance');await page.locator('#teacher-variant').selectOption('2');await page.locator('#teacher-tasks').selectOption('3');await page.locator('#generate-code').click();
  const code=await page.locator('#generated-code').inputValue();assert.match(code,/^\d{6}$/);assert.equal(decodeAssignment(code).variant,2);
  assert.equal(new URL(await page.locator('#generated-link').inputValue()).searchParams.get('assignment'),code);
  await page.locator('#copy-class-code').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),code);
  await page.screenshot({path:output+'/six-digit-teacher.png',fullPage:true});
  checks.push('Teacher creates and copies exactly six digits; the link retains the same settings');
  await page.locator('[data-close="teacher"]').click();await page.locator('#start-button').click();await answer(page,{first:0,second:6});
  const config=decodeAssignment(code),old=btoa(JSON.stringify(config)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  await ready(page,url+'/?assignment='+old);await page.locator('#start-button').click();
  const bank=JSON.parse(await readFile(new URL('../data/mathematics/f4/bab10.json',import.meta.url),'utf8'));
  await answer(page,selectVariant(bank,2).challenges[0].answer);assert.equal((await snap(page)).xp,75);
  await ready(page);await page.locator('#intro-join').click();
  await page.locator('#join-input').fill(code.slice(0,-1)+(Number(code.at(-1))+1)%10);await page.locator('#join-form button').click();assert.ok(await page.locator('#join-error').innerText());assert.equal((await snap(page)).assignment,null);
  await page.locator('#join-input').fill(code);await page.locator('#join-form button').click();await page.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().assignment?.world==='finance');
  assert.equal((await snap(page)).xp,75);assert.equal((await snap(page)).quest.variantId,'practice-c-v1');assert.equal(new URL(page.url()).searchParams.get('assignment'),code);
  checks.push('Mistyped code is rejected; six digits resume progress created through a legacy link');
  await ready(page,url+'/?assignment='+old);assert.equal((await snap(page)).xp,75);await ready(page);assert.equal((await snap(page)).xp,75);assert.equal((await snap(page)).assignment,null);
  checks.push('Legacy links still resume the same classroom save and free adventure stays separate');
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await ready(phone);
  await phone.locator('#teacher-button').tap();await phone.locator('#teacher-language').selectOption('ms');await phone.locator('#generate-code').tap();
  const phoneCode=await phone.locator('#generated-code').inputValue();assert.match(phoneCode,/^\d{6}$/);assert.equal(await phone.locator('#teacher').evaluate(e=>e.scrollWidth>e.clientWidth),false);
  await phone.locator('#generated-code').scrollIntoViewIfNeeded();await phone.screenshot({path:output+'/six-digit-phone.png',fullPage:true});await phone.locator('[data-close="teacher"]').tap();await phone.locator('#intro-join').tap();assert.equal(await phone.locator('#join-input').getAttribute('inputmode'),'numeric');await phone.locator('#join-input').fill(phoneCode);await phone.locator('#join-form button').tap();await phone.waitForFunction(()=>window.mathQuest?.snapshot().loaded&&window.mathQuest.snapshot().assignment);assert.equal((await snap(phone)).language,'ms');
  checks.push('Phone supports readable six-digit output, numeric entry and BM mission launch');
  assert.deepEqual(errors,[]);const result={at:new Date().toISOString(),checks,errors};await writeFile(output+'/codes-browser-report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}

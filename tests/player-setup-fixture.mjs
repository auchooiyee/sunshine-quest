// Older browser suites exercise gameplay after the initial player setup.
export async function completePlayerSetup(page){
  if(!await page.locator('#player-setup').isVisible())return;
  const starter=await page.locator('#player-setup').getAttribute('data-next')==='rescue';
  await page.locator('#player-input').fill('Test Explorer');
  await page.locator('#player-confirm').click();
  await page.locator('#player-setup').waitFor({state:'hidden'});
  if(starter){await page.locator('#rescue-exit').click();await page.locator('#bridge-rescue').waitFor({state:'hidden'});}
}

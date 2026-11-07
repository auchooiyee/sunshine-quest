// Older browser suites exercise gameplay after the initial player setup.
export async function completePlayerSetup(page){
  if(!await page.locator('#player-setup').isVisible())return;
  await page.locator('#player-input').fill('Test Explorer');
  await page.locator('#player-confirm').click();
  await page.locator('#player-setup').waitFor({state:'hidden'});
}

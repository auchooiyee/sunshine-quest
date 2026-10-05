import { parseNumber } from '../math/quadratics.js';

// Deliberately isolated from game, quest and storage: practice cannot award XP.
export function createTutorial({ t, openDialog, switchLanguage }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'play-guide';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.innerHTML = `
    <div class="dialog-top"><span class="eyebrow" data-i18n="howToPlay"></span><button id="guide-language" class="outline" data-i18n="guideLanguage"></button><button data-close="play-guide" class="close-button" aria-label="Close">×</button></div>
    <h2 id="guide-title" data-i18n="guideTitle"></h2><p data-i18n="guideNote"></p>
    <p id="guide-progress" aria-live="polite"></p>
    <section class="guide-step" id="guide-step-0"><h3 tabindex="-1" data-i18n="guideMoveTitle"></h3><p data-i18n="guideMoveText"></p>
      <div class="guide-trail" aria-hidden="true"><span id="guide-explorer">●</span><span class="guide-flag">⚑</span></div>
      <div class="guide-controls"><button id="guide-left" class="outline" data-i18n="guideLeft"></button><button id="guide-right" class="primary" data-i18n="guideRight"></button></div><p id="guide-movement" role="status"></p>
    </section>
    <section class="guide-step" id="guide-step-1" hidden><h3 tabindex="-1" data-i18n="guideMathTitle"></h3><p data-i18n="guideMathText"></p>
      <svg id="guide-bridge" viewBox="0 0 400 160" role="img"><title></title><path d="M25 140 H375" stroke="#78957d"/><path id="guide-arch" d="M50 140 Q200 -95 350 140" fill="none" stroke="#467c62" stroke-width="7" stroke-dasharray="9 7"/><text x="50" y="156" text-anchor="middle">0 m</text><text x="350" y="156" text-anchor="middle">6 m</text></svg>
      <form id="guide-form"><div class="guide-fields"><label><span data-i18n="guideFirst"></span><input id="guide-first" inputmode="decimal" autocomplete="off" maxlength="32"></label><label><span data-i18n="guideSecond"></span><input id="guide-second" inputmode="decimal" autocomplete="off" maxlength="32"></label></div><button class="primary" data-i18n="guideTest"></button></form>
      <button id="guide-hint" class="text-button" data-i18n="guideHint"></button><p id="guide-hint-text" data-i18n="guideHintText" hidden></p><p id="guide-feedback" role="status"></p>
    </section>
    <section class="guide-step" id="guide-step-2" hidden><h3 tabindex="-1" data-i18n="guideSaveTitle"></h3><p data-i18n="guideSaveText"></p><p class="guide-save-note" data-i18n="guideSaveNote"></p></section>
    <div class="guide-navigation"><button id="guide-back" class="outline" data-i18n="guideBack"></button><button id="guide-next" class="primary"></button><button data-close="play-guide" class="text-button" data-i18n="guideSkip"></button></div>`;
  document.body.append(dialog);
  const $ = id => dialog.querySelector('#' + id);
  let step = 0, position = 8, result = null;
  function render() {
    for (const element of dialog.querySelectorAll('[data-i18n]')) element.textContent = t(element.dataset.i18n);
    for (let index = 0; index < 3; index++) $('guide-step-' + index).hidden = step !== index;
    $('guide-progress').textContent = `${t('guideProgress')} ${step + 1} / 3`;
    $('guide-back').disabled = step === 0;
    $('guide-next').textContent = t(step === 2 ? 'guideFinish' : 'guideNext');
    $('guide-explorer').style.left = position + '%';
    $('guide-movement').textContent = t(position >= 88 ? 'guideArrived' : 'guideMoving');
    $('guide-feedback').textContent = result ? t(result) : '';
    $('guide-bridge').querySelector('title').textContent = t('guideBridge');
    $('guide-arch').setAttribute('stroke-dasharray', result === 'guideBuilt' ? 'none' : '9 7');
  }
  function move(direction) { position = Math.max(8, Math.min(88, position + direction * 20)); render(); }
  function go(next) { step = next; render(); $('guide-step-' + step).querySelector('h3').focus(); }
  $('guide-left').onclick = () => move(-1);
  $('guide-right').onclick = () => move(1);
  dialog.addEventListener('keydown', event => {
    if (step !== 0 || event.ctrlKey || event.metaKey || event.altKey) return;
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code)) {
      event.preventDefault(); move(['ArrowLeft', 'KeyA'].includes(event.code) ? -1 : 1);
    }
  });
  $('guide-back').onclick = () => go(Math.max(0, step - 1));
  $('guide-next').onclick = () => step === 2 ? dialog.close() : go(step + 1);
  $('guide-language').onclick = switchLanguage;
  $('guide-hint').onclick = () => { $('guide-hint-text').hidden = false; };
  $('guide-form').onsubmit = event => {
    event.preventDefault();
    const a = parseNumber($('guide-first').value), b = parseNumber($('guide-second').value);
    result = (a === 0 && b === 6) || (a === 6 && b === 0) ? 'guideBuilt' : 'guideWrong';
    render();
  };
  for (const id of ['guide-first', 'guide-second']) $(id).oninput = () => { result = null; render(); };
  return { render, open() {
    if (!openDialog(dialog)) return;
    step = 0; position = 8; result = null;
    $('guide-first').value = ''; $('guide-second').value = ''; $('guide-hint-text').hidden = true;
    render(); $('guide-step-0').querySelector('h3').focus();
  } };
}

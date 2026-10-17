// Drives the built rotmania.html through a full game in jsdom: node sim/ui-smoke.js
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../rotmania-phone.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
const w = dom.window, d = w.document; const errs = [];
w.addEventListener('error', e => errs.push(e.message)); w.alert = m => errs.push('ALERT ' + m); w.confirm = () => true;
w.URL.createObjectURL = () => 'blob:x';
const $ = id => d.getElementById(id); const on = id => $(id).classList.contains('on');
$('seed').value = '42'; $('start').click();
let steps = 0, overlaysSeen = { pass: 0, priv: 0, winter: 0 };
function tick() {
  if (on('passOverlay')) { overlaysSeen.pass++; $('passOk').click(); return true; }
  if (on('privOverlay')) { overlaysSeen.priv++; $('privOk').click(); return true; }
  if (on('winterOverlay')) { overlaysSeen.winter++; $('wOk').click(); return true; }
  if (on('end')) return false;
  // choose an action: build first affordable, else alternate
  const b = [...d.querySelectorAll('#market button[data-slot]')].find(b => !b.disabled);
  if (b && steps % 3 !== 2) { b.click(); return true; }
  if (!$('aAssess').disabled && steps % 5 === 0) { $('aAssess').click(); return true; }
  if (!$('aFund').disabled && steps % 4 === 0) { $('aFund').click(); return true; }
  $('aProduce').click(); return true;
}
let guard = 0;
(async () => {
  while (guard++ < 5000) { steps++; const cont = tick(); await new Promise(r => setTimeout(r, 1)); if (!cont) break; }
  console.log('steps', steps, 'overlays', overlaysSeen, 'ended', on('end'), 'title:', $('endTitle').textContent);
  console.log('score rows', d.querySelectorAll('#scoreTable tr').length - 1, '| log lines', $('log').children.length);
  console.log('errors:', errs.length ? errs : 'none');
  // resume path: start new game, then reload and resume
  $('again').click(); $('seed').value = '7'; $('start').click(); $('passOk').click(); $('privOk').click(); $('aProduce').click();
  const saved = w.localStorage.getItem('rotmania_save'); console.log('save present:', !!saved, 'bytes', saved && saved.length);
  const dom2 = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  dom2.window.localStorage.setItem('rotmania_save', saved);
  // resume button only shows if save existed at load; set before scripts? emulate by clicking anyway
  dom2.window.document.getElementById('resume').click();
  console.log('resumed game screen on:', dom2.window.document.getElementById('game').classList.contains('on'), 'year', dom2.window.document.getElementById('yearLabel').textContent || '(pass overlay first)');
  process.exit(errs.length ? 1 : 0);
})();

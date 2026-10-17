// Plays full games through the v0.4 table UI in jsdom: node sim/table3-smoke.js
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../rotmania.html', 'utf8'); let bad = 0;
for (const seed of ['1', '2', '3', '4', '5']) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  const w = dom.window, d = w.document; const errs = [];
  w.addEventListener('error', e => errs.push(e.message)); w.alert = m => errs.push('ALERT ' + m); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x';
  const $ = id => d.getElementById(id); $('seed').value = seed; $('start').click();
  let g = 0, clicks = 0, privs = 0, slops = 0;
  while (g++ < 6000) {
    if (!$('overlay').classList.contains('hidden')) { if ($('wok')) { slops++; $('wok').click(); continue; } break; }
    if ($('unlock')) { $('unlock').click(); continue; }
    if ($('pok')) { privs++; $('pok').click(); continue; }
    const m = d.querySelector('.mat.active'); if (!m) { errs.push('no active mat'); break; }
    const sel = m.querySelector('.sel'); if (sel) { const b = [...sel.querySelectorAll('button')]; if (b.length) { b[g % b.length].click(); clicks++; continue; } }
    const tiles = [...d.querySelectorAll('.wedge.can')];
    const relic = [...m.querySelectorAll('[data-act]')].find(b => b.textContent.startsWith('Use ') || b.textContent.startsWith('Play '));
    if (relic && g % 3 === 0) { relic.click(); clicks++; continue; }
    if (tiles.length && g % 4 !== 3) { tiles[g % tiles.length].dispatchEvent(new w.Event('click')); clicks++; continue; }
    const buy = [...m.querySelectorAll('[data-act]')].find(b => b.textContent.startsWith('Buy') && !b.disabled); if (buy && g % 5 === 0) { buy.click(); continue; }
    const end = [...m.querySelectorAll('[data-act]')].find(b => b.textContent === 'End turn'); end.click(); clicks++;
  }
  const title = $('obox').querySelector('h2') ? $('obox').querySelector('h2').textContent : 'NO END';
  console.log(`seed ${seed}: ${title} | clicks ${clicks} privates ${privs} slop phases ${slops} | errors: ${errs.join('; ') || 'none'}`);
  if (errs.length || title === 'NO END') bad++;
}
process.exit(bad ? 1 : 0);

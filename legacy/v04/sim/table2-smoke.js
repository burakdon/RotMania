// Plays full games through the v0.3 table UI in jsdom: node sim/table2-smoke.js
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../rotmania.html', 'utf8'); let bad = 0;
for (const seed of ['11', '22', '33', '44', '55', '66']) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  const w = dom.window, d = w.document; const errs = [];
  w.addEventListener('error', e => errs.push(e.message)); w.alert = m => errs.push('ALERT ' + m); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x';
  const $ = id => d.getElementById(id); $('seed').value = seed; $('start').click();
  let g = 0, steps = 0, privs = 0, winters = 0, places = 0;
  while (g++ < 8000) {
    if (!$('overlay').classList.contains('hidden')) { if ($('wok')) { winters++; $('wok').click(); continue; } break; }
    if ($('unlock')) { $('unlock').click(); continue; }
    if ($('pok')) { privs++; $('pok').click(); continue; }
    steps++;
    const mk = [...d.querySelectorAll('#market .card.clickable')]; const m = d.querySelector('.mat.active');
    const pawn = +d.querySelector('#aiPath .pawn').parentElement.textContent || [...d.querySelectorAll('#aiPath .sq')].findIndex(s => s.querySelector('.pawn'));
    const pref = seed === '11' ? mk.find(c => c.classList.contains('D')) : mk.find(c => c.classList.contains('I') || c.classList.contains('O')) || mk[0];
    if (pref && steps % 3 !== 2) { pref.click(); places++; continue; }
    const rows = [...m.querySelectorAll('[data-row]')].filter(b => !b.disabled);
    let btn = rows.find(b => b.dataset.row === 'D' && !b.classList.contains('hot')) || rows.find(b => b.dataset.row === 'I');
    if (seed === '11') btn = rows.find(b => b.dataset.row === 'D') || btn;
    if (steps % 5 === 0) btn = rows.find(b => b.dataset.row === 'O') || btn;
    if (steps % 7 === 0) btn = rows.find(b => b.dataset.row === 'C') || btn;
    if (steps % 11 === 0) { const dec = m.querySelector('.card.clickable'); if (dec) { dec.click(); continue; } }
    btn.click();
  }
  const title = $('obox').querySelector('h2') ? $('obox').querySelector('h2').textContent : 'NO END';
  console.log(`seed ${seed}: ${title} | steps ${steps} places ${places} privates ${privs} winters ${winters} | errors: ${errs.join('; ') || 'none'}`);
  if (errs.length || title === 'NO END') bad++;
}
// gallery renders all cards without error
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' }); const d = dom.window.document;
d.getElementById('start').click(); d.getElementById('menuBtn').click(); d.getElementById('mgallery').click();
console.log('gallery cards rendered:', d.querySelectorAll('#gallery .card').length);
process.exit(bad ? 1 : 0);

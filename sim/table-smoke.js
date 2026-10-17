// Drives rotmania.html (table version) through full games in jsdom: node sim/table-smoke.js
const { JSDOM } = require('jsdom'); const fs = require('fs');
const html = fs.readFileSync(__dirname + '/../rotmania.html', 'utf8');
let allErrs = [];
for (const seed of ['11', '22', '33', '44', '55']) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
  const w = dom.window, d = w.document; const errs = [];
  w.addEventListener('error', e => errs.push(e.message)); w.alert = m => errs.push('ALERT ' + m); w.confirm = () => true; w.URL.createObjectURL = () => 'blob:x';
  const $ = id => d.getElementById(id);
  $('seed').value = seed; $('start').click();
  let g = 0, steps = 0, privs = 0, winters = 0;
  while (g++ < 6000) {
    if (!$('overlay').classList.contains('hidden')) { if ($('wok')) { winters++; $('wok').click(); continue; } break; } // end overlay
    if ($('unlock')) { $('unlock').click(); continue; }
    if ($('pok')) { privs++; $('pok').click(); continue; }
    steps++;
    const mk = [...d.querySelectorAll('#market .card.clickable')];
    const pref = seed === '11' ? mk.find(c => c.classList.contains('D')) : mk.find(c => c.classList.contains('I') || c.classList.contains('S')) || mk[0];
    const m = d.querySelector('.mat.active');
    if (pref && steps % 4 !== 3) { pref.click(); continue; }
    const assess = m.querySelector('[data-act=assess]'); if (assess && !assess.disabled && steps % 6 === 0) { assess.click(); continue; }
    const dec = m.querySelector('.card.clickable'); if (dec && steps % 9 === 0) { dec.click(); continue; }
    m.querySelector('[data-act=produce]').click();
  }
  const title = $('obox').querySelector('h2') ? $('obox').querySelector('h2').textContent : 'NO END';
  console.log(`seed ${seed}: ${title} | steps ${steps} privates ${privs} winters ${winters} | errors: ${errs.join('; ') || 'none'}`);
  allErrs = allErrs.concat(errs);
}
process.exit(allErrs.length ? 1 : 0);

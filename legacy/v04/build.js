// Builds single-file playables: rotmania.html (v0.3 table), legacy/rotmania-v02-table.html, legacy/rotmania-v01-phone.html
const fs = require('fs'), path = require('path'); const R = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
fs.mkdirSync(path.join(__dirname, 'legacy'), { recursive: true });
const e1 = R('src/engine.js'), e2 = R('src/engine2.js'), e3 = R('src/engine3.js'), cards = R('src/cards.js');
fs.writeFileSync(path.join(__dirname, 'rotmania.html'), R('src/table3.html').replace('/*ENGINE*/', () => e3));
fs.writeFileSync(path.join(__dirname, 'legacy/rotmania-v03-table.html'), R('src/table2.html').replace('/*CARDS*/', () => cards).replace('/*ENGINE*/', () => e2));
fs.writeFileSync(path.join(__dirname, 'legacy/rotmania-v02-table.html'), R('src/table.html').replace('/*ENGINE*/', () => e1));
fs.writeFileSync(path.join(__dirname, 'legacy/rotmania-v01-phone.html'), R('src/phone.html').replace('/*ENGINE*/', () => e1));
console.log('built rotmania.html + legacy/');

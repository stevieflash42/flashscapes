// node tools/check.js : sanity-check levels.js
const fs = require('fs');
eval(fs.readFileSync(__dirname + '/../levels.js', 'utf8').replace('const LEVELS', 'var LEVELS').replace('const DICT', 'var DICT'));
let bad = 0, minLen = 99, maxLen = 0; const fail = (m) => { bad++; if (bad < 10) console.log('FAIL', m); };
LEVELS.forEach((lv, i) => {
  const [l, ws] = lv.split(':'), g = new Map(), seen = new Set(), c = {};
  for (const ch of l) c[ch] = (c[ch] || 0) + 1;
  for (const x of ws.split(',')) {
    const w = x.slice(0, -3), [r, cc, d] = [...x.slice(-3)].map(Number);
    minLen = Math.min(minLen, w.length); maxLen = Math.max(maxLen, w.length);
    if (w.length < 3 || w.length > l.length) fail(i + ' len ' + w);
    if (!DICT.has(w)) fail(i + ' not in dict ' + w);
    if (seen.has(w)) fail(i + ' dup ' + w); seen.add(w);
    const u = { ...c }; for (const ch of w) if (!u[ch]--) fail(i + ' letters ' + w);
    for (let k = 0; k < w.length; k++) { const key = (r + (d ? k : 0)) + ',' + (cc + (d ? 0 : k)); if (g.has(key) && g.get(key) !== w[k]) fail(i + ' clash ' + w); g.set(key, w[k]); }
  }
});
for (const w of DICT) if (w.length < 3 || w.length > 7) fail('dict ' + w);
console.log(LEVELS.length, 'levels, word length', minLen + '-' + maxLen, bad ? bad + ' problems' : 'OK');

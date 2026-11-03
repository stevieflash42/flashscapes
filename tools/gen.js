const fs = require('fs');
const dict = new Set(require('./dict.json'));
const freq = fs.readFileSync(__dirname + '/freq.txt', 'utf8').split('\n').filter(w => /^[a-z]{3,8}$/.test(w) && dict.has(w));
const common = freq.slice(0, 9000);
let seed = 7;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const cnt = w => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
const fits = (w, c) => { const u = cnt(w); return Object.keys(u).every(k => u[k] <= (c[k] || 0)); };

function layout(words) {
  const g = new Map(), placed = [];
  const key = (r, c) => r + ',' + c;
  const can = (w, r, c, d) => {
    let cross = 0;
    const dr = d ? 1 : 0, dc = d ? 0 : 1;
    if (g.has(key(r - dr, c - dc)) || g.has(key(r + dr * w.length, c + dc * w.length))) return -1;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i, cc = c + dc * i, ex = g.get(key(rr, cc));
      if (ex) { if (ex !== w[i]) return -1; cross++; }
      else if (g.has(key(rr + dc, cc + dr)) || g.has(key(rr - dc, cc - dr))) return -1;
    }
    return cross;
  };
  const put = (w, r, c, d) => { for (let i = 0; i < w.length; i++) g.set(key(r + (d ? i : 0), c + (d ? 0 : i)), w[i]); placed.push({ w, r, c, d }); };
  put(words[0], 0, 0, 0);
  for (const w of words.slice(1)) {
    const opts = [];
    for (const p of placed) for (let i = 0; i < w.length; i++) for (let j = 0; j < p.w.length; j++) {
      if (w[i] !== p.w[j]) continue;
      const d = p.d ? 0 : 1;
      const r = d ? p.r + (p.d ? j : 0) - i : p.r + (p.d ? j : 0);
      const c = d ? p.c + (p.d ? 0 : j) : p.c + (p.d ? 0 : j) - i;
      if (can(w, r, c, d) >= 1) opts.push([r, c, d]);
    }
    if (opts.length) put(w, ...opts[Math.floor(rnd() * opts.length)]);
  }
  const rs = placed.flatMap(p => [p.r, p.r + (p.d ? p.w.length - 1 : 0)]), cs = placed.flatMap(p => [p.c, p.c + (p.d ? 0 : p.w.length - 1)]);
  const r0 = Math.min(...rs), c0 = Math.min(...cs);
  return { placed: placed.map(p => ({ ...p, r: p.r - r0, c: p.c - c0 })), h: Math.max(...rs) - r0 + 1, w: Math.max(...cs) - c0 + 1 };
}

const levels = [];
const seeds = shuffle(common.filter(w => w.length >= 4 && w.length <= 7));
const want = i => 4 + Math.min(3, Math.floor(i / 20));
for (const s of seeds) {
  if (levels.length >= 100) break;
  const L = Math.min(7, want(levels.length));
  if (s.length !== L) continue;
  const c = cnt(s);
  const pool = common.filter(w => w.length >= 3 && fits(w, c));
  if (pool.length < 6) continue;
  let best = null;
  for (let t = 0; t < 60; t++) {
    const ws = shuffle(pool.slice()).slice(0, 12).sort((a, b) => b.length - a.length);
    const l = layout(ws);
    if (l.h > 8 || l.w > 8 || l.placed.length < 5) continue;
    if (!best || l.placed.length > best.placed.length) best = l;
  }
  if (!best) continue;
  const inGrid = new Set(best.placed.map(p => p.w));
  const bonus = freq.filter(w => fits(w, c) && !inGrid.has(w));
  levels.push({ letters: s, words: best.placed, h: best.h, w: best.w, bonus });
}
levels.sort((a, b) => a.letters.length - b.letters.length || a.words.length - b.words.length);
fs.writeFileSync(__dirname + '/../levels.js', 'const LEVELS=' + JSON.stringify(levels.map(l => ({ l: l.letters, h: l.h, w: l.w, p: l.words.map(p => [p.w, p.r, p.c, p.d]), b: l.bonus }))) + ';');
console.log(levels.length, 'levels');

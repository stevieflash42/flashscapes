// node tools/gen.js  ->  levels.js (6000 levels, 3-7 letter wheels, words spread to minimise reuse)
const fs = require('fs');
const dict = new Set(require('./dict.json'));
const BLOCK = new Set('ass arse bitch bastard cock cum cunt damn dick fag fuck hell homo jizz nazi negro nigga nigger penis piss porn prick pussy rape rapist semen sex shit slut sperm tit tits turd twat vagina whore wank anal anus boob boobs butt crap dildo gay horny kike kill kills killed killer killing lesbian molest naked nude orgasm pedo retard sexy suck sucks tranny'.split(' '));
// proper nouns: stems hunspell lists only capitalised (john, paris, ...)
const stems = fs.readFileSync(__dirname + '/en.dic', 'utf8').split('\n').slice(1).map((l) => l.split('/')[0]);
const lower = new Set(stems.filter((w) => w === w.toLowerCase()));
const PROPER = new Set(stems.filter((w) => /^[A-Z]/.test(w)).map((w) => w.toLowerCase()).filter((w) => !lower.has(w)));
const strip = (w) => { const c = [], e = (x) => w.endsWith(x), n = w.length, d = w[n - 2] === w[n - 3];
  if (e('s')) c.push(w.slice(0, -1)); if (e('es')) c.push(w.slice(0, -2)); if (e('ies')) c.push(w.slice(0, -3) + 'y');
  if (e('ed')) c.push(w.slice(0, -2), w.slice(0, -1), d ? w.slice(0, -3) : ''); if (e('ied')) c.push(w.slice(0, -3) + 'y');
  if (e('ing')) c.push(w.slice(0, -3), w.slice(0, -3) + 'e', w[n - 4] === w[n - 5] ? w.slice(0, -4) : '');
  if (e('er')) c.push(w.slice(0, -2), w.slice(0, -1), d ? w.slice(0, -3) : ''); if (e('est')) c.push(w.slice(0, -3), w.slice(0, -2));
  if (e('ier') || e('iest')) c.push(w.replace(/i(er|est)$/, 'y')); if (e('ily')) c.push(w.slice(0, -3) + 'y');
  if (e('ly')) c.push(w.slice(0, -2)); if (e('ness')) c.push(w.slice(0, -4)); if (e('less')) c.push(w.slice(0, -4)); if (e('ful')) c.push(w.slice(0, -3)); if (e('ment')) c.push(w.slice(0, -4));
  return c.some((x) => x.length > 2 && lower.has(x)); };
const isProper = (w) => PROPER.has(w) && !strip(w);
const webList = new Set(fs.readFileSync(__dirname + '/freq.txt', 'utf8').split('\n').slice(0, 6000));
// subtitle-list words (names, slang) only count if a dictionary stem backs them
const solid = (w) => webList.has(w) || lower.has(w) || strip(w);
// abbreviations, acronyms, clippings, interjections, informal contractions, stray proper nouns
const ABBR = new Set('abs ads aka alt amp app asp ave bio biz bod bot cam cis cit col con cor cos def deg dev devel dis div doc emf eff gov guv hmm hon jun lac las lat lib mac mag max med meh mic mil mun pol pre rec ref reg rem rep res rev rho sec shh sim soc sri sur syn tel til twp vac var veg vol brr psst pix sou mam info pic promo prof stat tech spec tho thru gonna wanna gotta kinda sorta gimme dunno yeah nope yep yup yuk yow nah bah pah rah duh huh aah ooh oho ugh eek costa jews latinas shemale bukkake inkjet telecom schmuck gangsta wouldst wog wop gyp'.split(' '));
// ISO 639-2 / 639-3 language codes: kept out of the grid unless clearly everyday English
const CODES = new Set(fs.readFileSync(__dirname + '/iso639-2.csv', 'utf8').match(/"[a-z]{3}"/g).map((x) => x.slice(1, 4)));
const everyday = new Set(fs.readFileSync(__dirname + '/freq.txt', 'utf8').split('\n').slice(0, 3000));
for (const x of fs.readFileSync(__dirname + '/profanity.txt', 'utf8').split('\n')) { const w = x.trim().toLowerCase(); if (/^[a-z]{3,7}$/.test(w)) BLOCK.add(w); }
['cooze', 'coochie', 'spic', 'chink', 'gook', 'dyke', 'wetback', 'raghead', 'towelhead'].forEach((w) => BLOCK.add(w));
const rank = new Map();
const add = (words) => words.forEach((w) => { if (/^[a-z]{3,7}$/.test(w) && dict.has(w) && !BLOCK.has(w) && !ABBR.has(w) && !isProper(w) && solid(w) && !rank.has(w)) rank.set(w, rank.size); });
// interleave both frequency lists so rank ~ commonness in either
const A = fs.readFileSync(__dirname + '/freq.txt', 'utf8').split('\n');
const B = fs.readFileSync(__dirname + '/freq50k.txt', 'utf8').split('\n').map((l) => l.split(' ')[0]);
const merged = []; for (let i = 0; i < Math.max(A.length, B.length); i++) { if (i < A.length) merged.push(A[i]); if (i < B.length) merged.push(B[i]); }
add(merged);
const all = [...rank.keys()];
const cand = new Set(all.filter((w) => !CODES.has(w) || everyday.has(w)));
// plural/-s forms stay valid as bonus words (DICT) but never go in the grid when their singular is a grid candidate
const bases = (w) => /(ss|us|is)$/.test(w) ? [] : [w.endsWith('ies') && w.slice(0, -3) + 'y', w.endsWith('es') && w.slice(0, -2), w.endsWith('s') && w.slice(0, -1)].filter(Boolean);
// bonus dictionary: the whole source dictionary (3-7 letters) minus profanity, proper nouns and bare language codes, plus a few modern words it lacks
const MODERN = 'emoji emojis selfie selfies wifi vlog vlogs blog blogs email emails hashtag podcast podcasts tweet tweets meme memes google texting texted unfriend unfollow app apps website websites online offline login logout download upload'.split(' ');
// mild words are fine to accept as bonus words but never go in a grid
const MILD = new Set('hell damn kill kills killed killer killing suck sucks sucked butt ass sex sexy nude naked gay lesbian crap piss pissed'.split(' '));
const okBonus = (w) => /^[a-z]{3,7}$/.test(w) && (!BLOCK.has(w) || MILD.has(w)) && (!isProper(w) || MODERN.includes(w)) && (!CODES.has(w) || everyday.has(w) || lower.has(w));
const bonusSet = new Set([...JSON.parse(fs.readFileSync(__dirname + '/dict.json', 'utf8')), ...all, ...MODERN].filter(okBonus));
const broad = [...bonusSet].filter((w) => !rank.has(w));
const DICTWORDS = [...bonusSet];
const rare = new Set(broad.filter((w) => lower.has(w) && !BLOCK.has(w) && !ABBR.has(w) && (!CODES.has(w) || everyday.has(w))));
const pool0 = new Set([...cand, ...rare]);
const GRID = new Set([...pool0].filter((w) => !bases(w).some((b) => b.length >= 3 && pool0.has(b))));
console.log('grid vocab', GRID.size, '(common', [...GRID].filter((w) => !rare.has(w)).length + ')');
console.log('dictionary', DICTWORDS.length, '(common', all.length, '+ broad', broad.length + ')');
const key = (s) => [...s].sort().join('');
const cnt = (w) => { const c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; return c; };
const fits = (w, c) => { const u = cnt(w); return Object.keys(u).every((k) => u[k] <= (c[k] || 0)); };

let seed = 11;
const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

function layout(words) {
  const g = new Map(), placed = [], k = (r, c) => r + ',' + c;
  const can = (w, r, c, d) => {
    let cross = 0; const dr = d ? 1 : 0, dc = d ? 0 : 1;
    if (g.has(k(r - dr, c - dc)) || g.has(k(r + dr * w.length, c + dc * w.length))) return -1;
    for (let i = 0; i < w.length; i++) {
      const rr = r + dr * i, cc = c + dc * i, ex = g.get(k(rr, cc));
      if (ex) { if (ex !== w[i]) return -1; cross++; }
      else if (g.has(k(rr + dc, cc + dr)) || g.has(k(rr - dc, cc - dr))) return -1;
    }
    return cross;
  };
  const put = (w, r, c, d) => { for (let i = 0; i < w.length; i++) g.set(k(r + (d ? i : 0), c + (d ? 0 : i)), w[i]); placed.push({ w, r, c, d }); };
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
    if (opts.length) {
      const area = ([r, c, d]) => {
        const rs = placed.flatMap((p) => [p.r, p.r + (p.d ? p.w.length - 1 : 0)]).concat(r, r + (d ? w.length - 1 : 0));
        const cs = placed.flatMap((p) => [p.c, p.c + (p.d ? 0 : p.w.length - 1)]).concat(c, c + (d ? 0 : w.length - 1));
        return (Math.max(...rs) - Math.min(...rs) + 1) * (Math.max(...cs) - Math.min(...cs) + 1) + rnd() * 6;
      };
      put(w, ...(rnd() < 0.8 ? opts.map((o) => [area(o), o]).sort((a, b) => a[0] - b[0])[0][1] : pick(opts)));
    }
  }
  const rs = placed.flatMap((p) => [p.r, p.r + (p.d ? p.w.length - 1 : 0)]), cs = placed.flatMap((p) => [p.c, p.c + (p.d ? 0 : p.w.length - 1)]);
  const r0 = Math.min(...rs), c0 = Math.min(...cs);
  return { placed: placed.map((p) => ({ ...p, r: p.r - r0, c: p.c - c0 })), h: Math.max(...rs) - r0 + 1, w: Math.max(...cs) - c0 + 1 };
}

// seeds: one per distinct letter multiset, must itself be a grid word
const seeds = {};
for (const w of GRID) { if (rare.has(w)) continue; const n = w.length; ((seeds[n] ||= new Map()).has(key(w)) ? 0 : seeds[n].set(key(w), w)); }
const vec = (w) => { const v = new Uint8Array(26); for (const ch of w) v[ch.charCodeAt(0) - 97]++; return v; };
const GW = [...GRID].map((w) => [w, vec(w)]);
const poolOf = (s) => { const c = vec(s); return GW.filter(([, v]) => { for (let i = 0; i < 26; i++) if (v[i] > c[i]) return false; return true; }).map((x) => x[0]); };
const pools = new Map(); // lazy
const getPool = (s) => pools.get(s) || (pools.set(s, poolOf(s)), pools.get(s));

const MIN = { 3: 3, 4: 6, 5: 7, 6: 8, 7: 8 }, K = { 3: 4, 4: 8, 5: 10, 6: 11, 7: 12 };
const rej = {}, TOTAL = 6000, usage = new Map(), last = new Map(), levels = [];
const CAP3 = { 3: 99, 4: 2, 5: 1, 6: 1, 7: 0 };
const choose = (pool, s, i, n, count, noise) => {
  const sorted = pool.filter((w) => w !== s).map((w) => [w, pen(w, i) + (w.length === 3 ? 300 : 0) + rnd() * noise]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  const out = []; let short = s.length === 3 ? 1 : 0;
  for (const w of sorted) { if (out.length >= count - 1) break; if (w.length === 3 && short >= CAP3[n]) continue; if (w.length === 3) short++; out.push(w); }
  for (const w of sorted) { if (out.length >= MIN[n] - 1) break; if (!out.includes(w)) out.push(w); }
  return out;
};
const COOL = 400; // a word isn't repeated within this many levels while alternatives exist
const pen = (w, i) => (rare.has(w) ? 150 : 0) + (usage.get(w) || 0) * 100 + (i - (last.get(w) ?? -1e9) < COOL ? 1000 : 0);
const avail = { 3: [...seeds[3].values()], 4: [...seeds[4].values()], 5: [...seeds[5].values()], 6: [...seeds[6].values()], 7: [...seeds[7].values()] };
console.log('seeds', Object.fromEntries(Object.entries(avail).map(([n, a]) => [n, a.length])));

for (let i = 0; i < TOTAL; i++) {
  const mean = 3 + 4 * Math.min(1, i / 3000) ** 0.5;
  const ns = [3, 4, 5, 6, 7].filter((n) => avail[n].length), wt = ns.map((n) => Math.exp(-((n - mean) ** 2) / 1.2));
  if (!ns.length) { console.log('exhausted at level', i); break; }
  let t = rnd() * wt.reduce((a, b) => a + b, 0), n = ns[0];
  for (let j = 0; j < ns.length; j++) { t -= wt[j]; if (t <= 0) { n = ns[j]; break; } }
  let bestCost = Infinity, bs = null;
  for (let s = 0; s < 40; s++) {
    const idx = Math.floor(rnd() * avail[n].length), pool = getPool(avail[n][idx]);
    if (pool.length < MIN[n]) { rej[n + 'pool'] = (rej[n + 'pool'] || 0) + 1; avail[n].splice(idx, 1); if (!avail[n].length) break; s--; continue; }
    const cost = [s, ...choose(pool, s, i, n, K[n], 0)].reduce((a, w) => a + pen(w, i) + (w.length === 3 ? 300 : 0), 0);
    if (cost < bestCost) { bestCost = cost; bs = avail[n][idx]; }
  }
  if (!bs) { i--; continue; }
  avail[n].splice(avail[n].indexOf(bs), 1);
  const s = bs, pool = getPool(s);
  let best = null;
  for (let t2 = 0; t2 < 40; t2++) {
    const rest = choose(pool, s, i, n, MIN[n] + Math.floor(rnd() * (K[n] - MIN[n] + 1)), 30);
    const ws = [s, ...rest].sort((a, b) => b.length - a.length);
    const l = layout(ws);
    if (l.h > 10 || l.w > 9 || l.placed.length < MIN[n]) continue;
    const sc = l.placed.length * 1000 - l.placed.reduce((a, p) => a + pen(p.w, i), 0);
    if (!best || sc > best.sc) best = { ...l, sc };
  }
  if (!best) { rej[n + 'layout'] = (rej[n + 'layout'] || 0) + 1; i--; continue; }
  best.placed.forEach((p) => { usage.set(p.w, (usage.get(p.w) || 0) + 1); last.set(p.w, i); });
  levels.push({ s, ...best });
}
const enc = (l) => l.s + ':' + l.placed.map((p) => p.w + p.r + p.c + p.d).join(',');
fs.writeFileSync(__dirname + '/../levels.js', 'const LEVELS=' + JSON.stringify(levels.map(enc)) + ';\nconst DICT=new Set("' + DICTWORDS.join(' ') + '".split(" "));');
const u = [...usage.values()], tot = u.reduce((a, b) => a + b, 0);
console.log(levels.length, 'levels;', usage.size, 'distinct words of', tot, 'placements; max reuse', Math.max(...u), '; avg', (tot / usage.size).toFixed(2));
console.log(rej);
const bylen = {}; levels.forEach((l) => (bylen[l.s.length] = (bylen[l.s.length] || 0) + 1)); console.log(bylen);

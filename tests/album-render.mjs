// Scratch harness: render every seeded album photo to PNG via CDP + analyze overlaps/mode.
// Injects the __albumPhotoSvg test hook (already permanent in rsvp.html), renders each subjectId
// at 400x300 with centre/floor guides, screenshots it, and measures on-screen figure bboxes to
// flag overlaps. Also renders each subject in every FORCED mode when MODE=1 is set.
// Usage: node tests/album-render.mjs [outdir]   (MODE=1 to also dump forced-mode grids)
import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.argv[2] || path.join(REPO, 'tests', '_album_out');
fs.mkdirSync(OUT, { recursive: true });

const srcPath = path.join(REPO, 'rsvp.html');
let html = fs.readFileSync(srcPath, 'utf8');
if (!/window\.__albumPhotoSvg\s*=/.test(html)) {
  html = html.replace('window.__albumAdd = captureAlbumShot;',
    'window.__albumPhotoSvg = albumPhotoSvg;\n  window.__albumAdd = captureAlbumShot;');
}
const scratch = path.join(REPO, 'tests', '_album_scratch.html');
fs.writeFileSync(scratch, html);

const PORT = 9333 + Math.floor(Math.random() * 400);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'albprof-'));
const CHROME = process.env.CHROME || 'google-chrome'; // on PATH (set CHROME=... to override)
const url = 'file://' + scratch + '?t=' + Date.now() + '#play';

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE,
  '--hide-scrollbars', '--window-size=500,400', url
], { stdio: 'ignore' });

const get = p => new Promise((res, rej) => {
  http.get('http://127.0.0.1:' + PORT + p, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitTarget() {
  for (let i = 0; i < 60; i++) {
    try { const l = await get('/json'); const t = l.find(x => x.type === 'page' && x.url.includes('_album_scratch')); if (t) return t; } catch {}
    await sleep(250);
  }
  throw new Error('no target');
}

const SUBJECTS = [
  'shoot-couple', 'shoot-aspen', 'shoot-mouses', 'shoot-family', 'shoot-familykids',
  'shoot-godkids', 'shoot-godsons', 'shoot-irene', 'shoot-madla', 'shoot-hamid',
  'shoot-tehran', 'shoot-baharak', 'shoot-cousins'
];

(async () => {
  const t = await waitTarget();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pend = {};
  const send = (m, pa) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method: m, params: pa || {} })); });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Runtime.evaluate', { expression: 'document.hasFocus=function(){return true;}' });

  let ready = false;
  for (let i = 0; i < 40; i++) {
    const f = await send('Runtime.evaluate', { expression: 'typeof window.__albumPhotoSvg==="function" && typeof window.__albumList==="function" && document.querySelector(".g-behdad")!=null', returnByValue: true });
    if (f.result.value === true) { ready = true; break; }
    await sleep(500);
  }
  if (!ready) { console.error('HOOK/FIGURES MISSING after wait'); process.exit(1); }
  await sleep(800);

  const eval1 = expr => send('Runtime.evaluate', { expression: expr, returnByValue: true }).then(r => r.result.value);

  // renderer: builds host, returns {mode, figs:[{l,r,t,b,w,h}], overlaps:[...]}
  // `sub` is either a seeded subjectId (looked up in __albumList) or a `{...}` record literal, so the
  // same measurement path covers ROOM shots, which have no seeded record to find.
  async function renderAndMeasure(sub, forceMode) {
    const recExpr = sub.trim()[0] === '{' ? sub : `(window.__albumList().find(function(r){return r.subjectId===${JSON.stringify(sub)};}))`;
    const expr = `(function(){
      window.__albumForceMode = ${forceMode ? JSON.stringify(forceMode) : 'null'};
      var rec = ${recExpr};
      if(!rec){return 'NO-REC';}
      var host = document.getElementById('__albtest');
      if(host) host.remove();
      host = document.createElement('div'); host.id='__albtest';
      host.style.cssText='position:fixed;left:0;top:0;width:400px;height:300px;background:#fffdf8;z-index:99999;overflow:hidden;';
      var svg = window.__albumPhotoSvg(rec);
      svg.setAttribute('width','400'); svg.setAttribute('height','300'); svg.style.display='block';
      host.appendChild(svg);
      var g=document.createElement('div'); g.style.cssText='position:absolute;left:200px;top:0;width:1px;height:300px;background:rgba(255,0,0,.5);'; host.appendChild(g);
      var gb=document.createElement('div'); gb.style.cssText='position:absolute;left:0;bottom:0;width:400px;height:1px;background:rgba(0,0,255,.4);'; host.appendChild(gb);
      document.body.appendChild(host);
      var sr=svg.getBoundingClientRect();
      var wraps=[].slice.call(svg.children).filter(function(c){return c.tagName==='g'&&c.getAttribute('transform')&&c.querySelector('*');});
      var figs=wraps.map(function(w){var r=w.getBoundingClientRect();return {l:r.left-sr.left,r:r.right-sr.left,t:r.top-sr.top,b:r.bottom-sr.top,w:r.width,h:r.height};});
      // overlaps: a real collision needs BOTH a big horizontal-interval overlap AND the two figures
      // sharing the same vertical band (same row). Two-row formations deliberately overlap front/back
      // horizontally; those have offset verticals, so we require >55% vertical overlap of the shorter
      // figure to call it a same-row collision.
      var ov=[];
      for(var i=0;i<figs.length;i++)for(var j=i+1;j<figs.length;j++){
        var a=figs[i],b=figs[j];
        var ix=Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l));
        var iy=Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
        var narrow=Math.min(a.r-a.l,b.r-b.l), shortH=Math.min(a.b-a.t,b.b-b.t);
        if(ix>0&&iy>0){
          var frac=ix/narrow, vfrac=iy/shortH;
          if(frac>0.35 && vfrac>0.55) ov.push({i:i,j:j,frac:+frac.toFixed(2),vf:+vfrac.toFixed(2)});
        }
      }
      return JSON.stringify({mode:svg.getAttribute('data-mode'), n:figs.length, figs:figs.map(function(f){return {l:+f.l.toFixed(0),r:+f.r.toFixed(0),t:+f.t.toFixed(0),b:+f.b.toFixed(0)};}), overlaps:ov});
    })()`;
    const v = await eval1(expr);
    if (typeof v !== 'string' || v[0] !== '{') return { err: v };
    return JSON.parse(v);
  }

  // A head off the TOP of the frame is the one defect that ruins a photograph, and the composition's
  // vertical fit is driven by measured figure tops — so every render is asserted against it. Feet may
  // leave the bottom (closeup crops them on purpose); faces may never leave the top.
  const TOP_CLIP = -1; // px slack for rounding at the 400x300 render size
  function topClipped(m) { return (m.figs || []).filter(f => f.t < TOP_CLIP); }
  let anyBadOverlap = false, anyTopClip = false;

  console.log('=== seeded (natural) modes ===');
  for (const sub of SUBJECTS) {
    const m = await renderAndMeasure(sub);
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 400, height: 300, scale: 1 }, format: 'png' });
    fs.writeFileSync(path.join(OUT, sub + '.png'), Buffer.from(shot.data, 'base64'));
    // off-frame check: any figure whose horizontal extent leaves the 0..400 frame by >8px
    const off = (m.figs || []).some(f => f.l < -8 || f.r > 408);
    const clip = topClipped(m);
    if (m.overlaps && m.overlaps.length) anyBadOverlap = true;
    if (clip.length) anyTopClip = true;
    console.log(sub.padEnd(18), (m.mode || '?').padEnd(8), 'n=' + m.n,
      'overlaps=' + JSON.stringify(m.overlaps || []), off ? 'OFF-FRAME!' : '',
      clip.length ? 'TOP-CLIPPED! tops=' + JSON.stringify(clip.map(f => f.t)) : '');
  }

  // ROOM shots + mixed-height groups. These are the shapes the seeded portraits never cover: a shot
  // with NO hosts to anchor on, an arms-up dancer, an adult beside a much shorter kid, and a lone
  // subject. The bar pair rendered decapitated before the composition measured figure tops.
  const room = (id, r, people) => `{id:${id},t:Date.now(),roomShot:true,room:${JSON.stringify(r)},dance:'',season:'',uv:false,` +
    `sky:{night:true,wx:''},subjectId:'room:${r}:t${id}',people:[${people.map(p => `{key:${JSON.stringify(p[0])},grp:'',name:${JSON.stringify(p[1])},roleKey:''}`).join(',')}]}`;
  const ROOM_CASES = [
    ['bar-pair',        room(901, 'kitchen', [['spencer', 'Spencer'], ['jay', 'Jay']])],
    ['bar-solo',        room(902, 'kitchen', [['spencer', 'Spencer']])],
    ['nook-adult-kid',  room(903, 'cuddly',  [['spencer', 'Spencer'], ['irene', 'Irene']])],
    ['nook-kids',       room(904, 'cuddly',  [['irene', 'Irene'], ['robin', 'Robin'], ['navid', 'Navid']])],
    ['office-pair',     room(905, 'office',  [['ali', 'Ali'], ['goli', 'Goli']])],
    ['deck-solo',       room(906, 'balcony', [['lauren', 'Lauren']])],
    ['deck-crowd',      room(907, 'balcony', [['ali', 'Ali'], ['bahareh', 'Bahareh'], ['jay', 'Jay'], ['lauren', 'Lauren']])]
  ];
  console.log('=== room shots / mixed heights (all modes) ===');
  for (const [name, rec] of ROOM_CASES) {
    for (const mode of ['closeup', 'tworow', 'line']) {
      const m = await renderAndMeasure(rec, mode);
      if (m.err || !m.figs) { console.log('  ERR', name, mode, JSON.stringify(m)); anyTopClip = true; continue; }
      if (!m.n) { console.log('  EMPTY!', name, mode); anyTopClip = true; continue; } // a photo with nobody in it is a failure
      const clip = topClipped(m);
      const bad = (m.overlaps || []).filter(o => o.frac > 0.40);
      if (clip.length) { anyTopClip = true; console.log('  TOP-CLIPPED!', name, mode, JSON.stringify(clip.map(f => f.t))); }
      if (bad.length) { anyBadOverlap = true; console.log('  COLLISION', name, mode, JSON.stringify(bad)); }
      await sleep(100);
      const shot = await send('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 400, height: 300, scale: 1 }, format: 'png' });
      fs.writeFileSync(path.join(OUT, 'room-' + name + '-' + mode + '.png'), Buffer.from(shot.data, 'base64'));
    }
    console.log('  ' + name.padEnd(16) + ' ok');
  }

  // ...and again with a BIRTHDAY HAT worn: the hat is real geometry above the head, so it must be
  // both drawn and given headroom. Driven the way the app drives it (the strip's own bd- class).
  console.log('=== birthday hat (headroom + actually drawn) ===');
  await eval1(`document.getElementById('loft-game-strip').classList.add('bd-spencer','bd-jay')`);
  await sleep(300);
  for (const mode of ['closeup', 'tworow', 'line']) {
    const m = await renderAndMeasure(ROOM_CASES[0][1], mode);
    const clip = topClipped(m);
    if (clip.length) { anyTopClip = true; console.log('  TOP-CLIPPED!', 'bd-hat', mode, JSON.stringify(clip.map(f => f.t))); }
    await sleep(100);
    const shot = await send('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 400, height: 300, scale: 1 }, format: 'png' });
    fs.writeFileSync(path.join(OUT, 'bdhat-' + mode + '.png'), Buffer.from(shot.data, 'base64'));
    console.log('  bd-hat ' + mode.padEnd(8) + ' tops=' + JSON.stringify((m.figs || []).map(f => f.t)));
  }
  await eval1(`document.getElementById('loft-game-strip').classList.remove('bd-spencer','bd-jay')`);

  // Forced-mode pass: prove EACH mode is overlap-free at every group size.
  console.log('=== forced modes (overlap audit) ===');
  for (const mode of ['closeup', 'tworow', 'line']) {
    for (const sub of SUBJECTS) {
      const m = await renderAndMeasure(sub, mode);
      const bad = (m.overlaps || []).filter(o => o.frac > 0.40); // >40% interval overlap = collision
      const clip = topClipped(m);
      if (bad.length) { anyBadOverlap = true; console.log('  COLLISION', mode, sub, JSON.stringify(bad)); }
      if (clip.length) { anyTopClip = true; console.log('  TOP-CLIPPED!', mode, sub, JSON.stringify(clip.map(f => f.t))); }
      if (process.env.MODE) {
        await sleep(100);
        const shot = await send('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 400, height: 300, scale: 1 }, format: 'png' });
        fs.writeFileSync(path.join(OUT, 'mode-' + mode + '-' + sub + '.png'), Buffer.from(shot.data, 'base64'));
      }
    }
    console.log('  ' + mode + ': audited ' + SUBJECTS.length + ' subjects');
  }
  await eval1('window.__albumForceMode=null');

  const stab = await eval1(`(function(){var rec=window.__albumList().find(function(r){return r.subjectId==='shoot-family';});
    var a=new XMLSerializer().serializeToString(window.__albumPhotoSvg(rec));
    var b=new XMLSerializer().serializeToString(window.__albumPhotoSvg(rec));
    return a===b ? 'STABLE' : 'UNSTABLE';})()`);
  console.log('stability(shoot-family):', stab);
  console.log(anyBadOverlap ? '*** OVERLAPS DETECTED ***' : 'no collisions detected');
  console.log(anyTopClip ? '*** HEADS CLIPPED OFF THE TOP OF THE FRAME ***' : 'no top-clipping detected');

  ws.close(); chrome.kill('SIGKILL');
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  process.exit(anyBadOverlap || anyTopClip ? 1 : 0);
})().catch(e => { console.error(e); chrome.kill('SIGKILL'); process.exit(1); });

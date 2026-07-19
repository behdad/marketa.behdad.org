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
  async function renderAndMeasure(sub, forceMode) {
    const expr = `(function(){
      window.__albumForceMode = ${forceMode ? JSON.stringify(forceMode) : 'null'};
      var list = window.__albumList();
      var rec = list.find(function(r){return r.subjectId==='${sub}';});
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

  console.log('=== seeded (natural) modes ===');
  let anyBadOverlap = false;
  for (const sub of SUBJECTS) {
    const m = await renderAndMeasure(sub);
    await sleep(150);
    const shot = await send('Page.captureScreenshot', { clip: { x: 0, y: 0, width: 400, height: 300, scale: 1 }, format: 'png' });
    fs.writeFileSync(path.join(OUT, sub + '.png'), Buffer.from(shot.data, 'base64'));
    // off-frame check: any figure whose horizontal extent leaves the 0..400 frame by >8px
    const off = (m.figs || []).some(f => f.l < -8 || f.r > 408);
    if (m.overlaps && m.overlaps.length) anyBadOverlap = true;
    console.log(sub.padEnd(18), (m.mode || '?').padEnd(8), 'n=' + m.n,
      'overlaps=' + JSON.stringify(m.overlaps || []), off ? 'OFF-FRAME!' : '');
  }

  // Forced-mode pass: prove EACH mode is overlap-free at every group size.
  console.log('=== forced modes (overlap audit) ===');
  for (const mode of ['closeup', 'tworow', 'line']) {
    for (const sub of SUBJECTS) {
      const m = await renderAndMeasure(sub, mode);
      const bad = (m.overlaps || []).filter(o => o.frac > 0.40); // >40% interval overlap = collision
      if (bad.length) { anyBadOverlap = true; console.log('  COLLISION', mode, sub, JSON.stringify(bad)); }
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

  ws.close(); chrome.kill('SIGKILL');
  try { fs.rmSync(PROFILE, { recursive: true, force: true }); } catch {}
  process.exit(0);
})().catch(e => { console.error(e); chrome.kill('SIGKILL'); process.exit(1); });

// The room-shot signature must separate two sky states EXACTLY WHEN the polaroid paints them as
// different photographs. One symmetric rule, checked both ways:
//   • states it SEPARATES must render materially different frames, or the album fills with cards
//     that are the same picture (the bar filed one per weather flip, then one per day/night flip:
//     its back wall shifts a single shade and nothing else moves);
//   • states it MERGES must NOT render materially different frames, or a genuinely different
//     photograph is being suppressed as a duplicate.
//
// The pairs are derived from the app's own ALBUM_SKY_SIG, never from a table copied into this file,
// so a room whose backdrop is redrawn is re-judged rather than rubber-stamped. Each of the 4 rooms
// is rendered in all 8 night x wx states with an identical lineup and seed, rasterised through a
// canvas, and compared pixel-by-pixel.
//
// The measure is the PEAK per-channel delta anywhere in frame, not the mean and not the share of
// pixels touched: day-vs-night at the bar moves 42% of the pixels but no single channel by more
// than 24/255, a uniform tint over one drawing, while adding a whole person to the same shot moves
// fewer pixels and peaks at 207. Every run prints the margin either side of MATERIAL_PEAK — as
// shipped, the loudest merged pair is 24 and the quietest separated one 61.
//
// uv (blacklight) and the balcony aurora are deliberately NOT enumerated: they render but are
// absent from the signature, which is the opposite failure (suppression, not duplication) and is
// the owner's call to make, not this test's.
//
// Usage: node tests/album-axis.mjs
import http from 'http';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MATERIAL_PEAK = 30; // a channel delta this large somewhere in frame = a different photograph

// __albumPhotoSvg + __albumSkySig are permanent test hooks in loft-day.html; the page is loaded as-is.
const SRC = path.join(REPO, 'loft-day.html');

const PORT = 9200 + Math.floor(Math.random() * 700);
const PROFILE = fs.mkdtempSync(path.join(os.tmpdir(), 'axisprof-'));
const CHROME = process.env.CHROME || 'google-chrome';
const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + PROFILE,
  '--hide-scrollbars', '--window-size=500,400',
  'file://' + SRC + '?t=' + Date.now()
], { stdio: 'ignore' });

const get = p => new Promise((res, rej) => {
  http.get('http://127.0.0.1:' + PORT + p, x => { let d = ''; x.on('data', c => d += c); x.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const cleanup = () => { try { chrome.kill(); } catch {} };

// one representative lineup per room, from figures that exist in the loaded DOM
const CAST = {
  kitchen: [['spencer', 'Spencer'], ['jay', 'Jay'], ['pouria', 'Pouria']],
  cuddly:  [['irene', 'Irene'], ['robin', 'Robin']],
  office:  [['ali', 'Ali'], ['goli', 'Goli']],
  balcony: [['lauren', 'Lauren'], ['jay', 'Jay']]
};
const ROOMS = Object.keys(CAST);
const WX = ['', 'rain', 'storm', 'overcast'];
const STATES = [];
for (const night of [false, true]) for (const wx of WX) STATES.push({ night, wx, aurora: false });
const label = s => (s.night ? 'night' : 'day') + '/' + (s.wx || 'clear');

let failures = 0;
// the run's tightest calls, printed at the end: this test lives or dies by MATERIAL_PEAK sitting
// in clear air between them, and rasterisation can shift a few counts between Chrome builds
let tightestKept = { peak: Infinity, what: '(none)' }, tightestMerged = { peak: -1, what: '(none)' };
const pass = m => console.log('  ✓ ' + m);
const fail = (m, d) => { failures++; console.log('  ✗ ' + m); if (d) console.log('      ' + d); };

(async () => {
  let t;
  for (let i = 0; i < 80; i++) {
    try { const l = await get('/json'); t = l.find(x => x.type === 'page' && x.url.includes('loft-day.html')); if (t) break; } catch {}
    await sleep(250);
  }
  if (!t) { console.error('no target'); cleanup(); process.exit(1); }
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pend = {};
  const send = (m, pa) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method: m, params: pa || {} })); });
  await new Promise(r => ws.onopen = r);
  ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
  await send('Page.enable'); await send('Runtime.enable');
  const ev = x => send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }).then(r => {
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails.exception || r.exceptionDetails));
    return r.result.value;
  });
  await ev('document.hasFocus=function(){return true;}');

  // freshness gate: both hooks live, and the figures the clones come from are in the DOM
  let ready = false;
  for (let i = 0; i < 60; i++) {
    ready = await ev('typeof window.__albumPhotoSvg==="function" && typeof window.__albumSkySig==="function" && document.querySelector(".g-jay")!=null');
    if (ready) break;
    await sleep(500);
  }
  if (!ready) { console.error('HOOKS/FIGURES MISSING after wait'); cleanup(); process.exit(1); }
  await sleep(800);

  // rasterise a record to raw RGBA at the polaroid's own 200x150
  await ev(`window.__axRaster=function(recJson){return new Promise(function(res,rej){
    var svg=window.__albumPhotoSvg(JSON.parse(recJson));
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
    svg.setAttribute('width','200'); svg.setAttribute('height','150');
    var img=new Image();
    img.onload=function(){
      var c=document.createElement('canvas'); c.width=200; c.height=150;
      var x=c.getContext('2d'); x.drawImage(img,0,0);
      try{ res(Array.from(x.getImageData(0,0,200,150).data)); }catch(e){ rej('canvas tainted: '+e.message); }
    };
    img.onerror=function(){ rej('svg failed to load as an image'); };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
  });}`);

  for (const room of ROOMS) {
    console.log('\n' + room + ':');
    const recFor = s => JSON.stringify({
      id: 777, seed: 777, t: 0, roomShot: true, room, dance: '', season: '', uv: false,
      sky: s, subjectId: 'axis', people: CAST[room].map(p => ({ key: p[0], grp: '', name: p[1], roleKey: '' }))
    });
    // rasterise each state once, then compare every pair in-page (cheap, and no pixel data crosses CDP)
    await ev('window.__axPix=[];');
    for (const s of STATES) await ev(`(async function(){window.__axPix.push(await window.__axRaster(${JSON.stringify(recFor(s))}));return 1;})()`);
    const sigs = [];
    for (const s of STATES) sigs.push(await ev(`window.__albumSkySig(${JSON.stringify(room)}, ${JSON.stringify(s)})`));

    const groups = {};
    sigs.forEach((sg, i) => { (groups[sg] = groups[sg] || []).push(i); });
    console.log('    signature groups: ' + Object.keys(groups).map(k =>
      (k === '' ? '(none)' : k) + ' = {' + groups[k].map(i => label(STATES[i])).join(', ') + '}').join('   '));

    const before = failures;
    for (let i = 0; i < STATES.length; i++) for (let j = i + 1; j < STATES.length; j++) {
      const d = JSON.parse(await ev(`(function(){var A=window.__axPix[${i}],B=window.__axPix[${j}];
        var n=A.length/4,changed=0,max=0;
        for(var k=0;k<n;k++){
          var dd=Math.max(Math.abs(A[k*4]-B[k*4]),Math.abs(A[k*4+1]-B[k*4+1]),Math.abs(A[k*4+2]-B[k*4+2]));
          if(dd>2)changed++; if(dd>max)max=dd; }
        return JSON.stringify({pct:+(100*changed/n).toFixed(1),max:max});})()`));
      const same = sigs[i] === sigs[j];
      const pair = label(STATES[i]) + ' vs ' + label(STATES[j]);
      if (same && d.max > tightestMerged.peak) tightestMerged = { peak: d.max, what: room + ' ' + pair };
      if (!same && d.max < tightestKept.peak) tightestKept = { peak: d.max, what: room + ' ' + pair };
      if (same && d.max >= MATERIAL_PEAK)
        fail(room + ': ' + pair + ' share a signature but render as different photographs — one is being suppressed',
          'peak channel delta ' + d.max + ' (>= ' + MATERIAL_PEAK + '), ' + d.pct + '% of pixels differ');
      else if (!same && d.max < MATERIAL_PEAK)
        fail(room + ': ' + pair + ' get different signatures but render the same photograph — duplicate cards',
          'peak channel delta only ' + d.max + ' (< ' + MATERIAL_PEAK + '), ' + d.pct + '% of pixels nudged');
    }
    const kept = Object.keys(groups).length;
    if (failures === before)
      pass(room + ': ' + STATES.length + ' sky states collapse to ' + kept + ' distinct photograph' + (kept === 1 ? '' : 's') + ', and the signature separates exactly those');
  }

  ws.close(); cleanup();
  console.log('\nmargin around MATERIAL_PEAK=' + MATERIAL_PEAK +
    ':  loudest merged pair ' + tightestMerged.peak + ' (' + tightestMerged.what + ')' +
    '   quietest separated pair ' + tightestKept.peak + ' (' + tightestKept.what + ')');
  console.log(failures ? '\n' + failures + ' axis check(s) failed.' : 'All album-axis assertions passed.');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error('ERR', e); cleanup(); process.exit(1); });

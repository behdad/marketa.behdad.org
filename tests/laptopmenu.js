#!/usr/bin/env node
// Focused test for the office LAPTOP's right-click (contextmenu) menu — the .mon-ctx menu
// that mirrors the desktop dock's look/dismiss wiring. The laptop's two contact tiles are
// its "app icons": right-clicking one → Open launches that video call; the closed lid →
// Open wakes the laptop; a live call → End call hangs up; the open editor offers Translate.
// Context menus stay local to their target and never expose the whole-loft Start over action.
//
// The call overlay (#laptop-call) is a SIBLING of #office-laptop, so the handler is a
// document-level contextmenu listener gated on `.closest('#office-laptop, #laptop-call')`;
// this test confirms that gate (native menu off-laptop) and that it never cross-fires with
// the monitor menu (a single .mon-ctx, correct items). Uses the same one-shot headless
// runner as play.js/menu.js (see lib.js). Kept as its own file so it merges cleanly.
"use strict";
var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report = { errors: [], steps: {} };",
  "  window.addEventListener('error', function(e){ report.errors.push(String(e.message)); });",
  "  function S(k,v){ report.steps[k]=v; }",
  "  function ctxAt(el){ var r=el.getBoundingClientRect(); var e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+Math.min(8,r.width/2),clientY:r.top+Math.min(8,r.height/2)}); return !el.dispatchEvent(e); }",  // returns true when default prevented (custom menu shown)
  "  function menu(){ return document.querySelector('.mon-ctx'); }",
  "  function items(){ var m=menu(); return m?[].map.call(m.querySelectorAll('button span:last-child'),function(s){return s.textContent;}):[]; }",
  "  function lap(){ return document.getElementById('office-laptop'); }",
  "  function el(id){ return document.getElementById(id); }",
  "  function calling(l){ return l.classList.contains('calling')||l.classList.contains('connecting')||l.classList.contains('connected'); }",
  "  async function run(){",
  "    if (window.__goToStage) window.__goToStage('office');",
  "    await sleep(200);",
  "    var l = lap();",
  // closed laptop → Open wakes it
  "    l.classList.remove('open','calling','connecting','connected','lueb');",
  "    S('closed_prevented', ctxAt(el('laptop-hit-pad')));",
  "    S('closed_items', items());",
  "    S('closed_no_start_over', !(menu()&&menu().querySelector('.ctx-loft-reset')));",
  "    var ob=menu()&&menu().querySelector('button.ctx-open'); if(ob) ob.click();",
  "    await sleep(60);",
  "    S('closed_dismissed', !menu());",
  "    S('closed_woke', l.classList.contains('open'));",
  // off-laptop, off-scene (page body) → the LAPTOP menu doesn't fire; native kept, no custom menu.
  "    S('bare_prevented', ctxAt(document.body));",
  "    S('bare_no_menu', !menu());",
  // open + Prague tile → Open starts the Prague call
  "    if(!l.classList.contains('open')) l.classList.add('open');",
  "    l.classList.remove('calling','connecting','connected','lueb');",
  "    S('tile_prevented', ctxAt(el('laptop-calltile')));",
  "    S('tile_items', items());",
  "    var tb=menu()&&menu().querySelector('button.ctx-open'); if(tb) tb.click();",
  "    await sleep(80);",
  "    S('tile_started', calling(l));",
  "    S('tile_prague', !l.classList.contains('lueb'));",
  // live call → End call hangs up
  "    l.classList.remove('calling','connecting'); l.classList.add('connected');",
  "    S('call_prevented', ctxAt(el('laptop-call')));",
  "    S('call_items', items());",
  "    var eb=menu()&&menu().querySelector('button.ctx-kill'); if(eb) eb.click();",
  "    await sleep(1800);",  // a connected call plays the goodbye (1500ms) before it drops the line
  "    S('call_hung_up', !calling(l));",
  // open editor face (not a tile) → Translate the «L'amour» title into the page language
  "    l.classList.add('open'); l.classList.remove('calling','connecting','connected','lueb');",
  "    document.documentElement.lang='en';",
  "    S('editor_prevented', ctxAt(el('laptop-editor')));",
  "    S('editor_items', items());",
  "    var trb=menu()&&menu().querySelector('button.ctx-translate'); if(trb) trb.click();",
  "    await sleep(60);",
  "    S('editor_en', (el('laptop-editor-src')||{}).textContent);",
  // toggle page language → Translate again targets Czech (re-read per click)
  "    document.documentElement.lang='cs';",
  "    ctxAt(el('laptop-editor')); var trc=menu()&&menu().querySelector('button.ctx-translate'); if(trc) trc.click();",
  "    await sleep(60);",
  "    S('editor_cs', (el('laptop-editor-src')||{}).textContent);",
  // Lübeck tile → Open starts the lueb call
  "    l.classList.remove('calling','connecting','connected','lueb');",
  "    ctxAt(el('laptop-luebtile')); var lb=menu()&&menu().querySelector('button.ctx-open'); if(lb) lb.click();",
  "    await sleep(80);",
  "    S('lueb_started', l.classList.contains('lueb') && calling(l));",
  // Esc dismisses
  "    l.classList.remove('calling','connecting','connected','lueb','open');",
  "    ctxAt(el('laptop-hit-pad'));",
  "    S('esc_up', !!menu());",
  "    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));",
  "    await sleep(40);",
  "    S('esc_dismissed', !menu());",
  "    document.getElementById('__report').textContent = JSON.stringify(report);",
  "  }",
  "  run();",
  "})();",
  "</script>"
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 6000);
var fail = 0;
function ok(name, cond) { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail++; }

console.log("laptop right-click (contextmenu) menu:");
if (!r) { console.error("  ✗ no report captured (page did not run)"); process.exit(1); }
var s = r.steps;
ok("no uncaught JS errors", r.errors.length === 0);
ok("closed laptop: right-click shows a custom menu", s.closed_prevented === true);
ok("closed laptop: single Open item", s.closed_items && s.closed_items.length === 1 && /open|otev/i.test(s.closed_items[0] || ""));
ok("closed laptop: context menu has no whole-loft Start over", s.closed_no_start_over === true);
ok("closed laptop: Open wakes the laptop", s.closed_woke === true);
ok("closed laptop: menu dismisses after Open", s.closed_dismissed === true);
ok("bare desk: native menu kept (not prevented)", s.bare_prevented === false);
ok("bare desk: no custom menu", s.bare_no_menu === true);
ok("Prague tile: right-click shows Open", s.tile_prevented === true && s.tile_items && s.tile_items.length === 1);
ok("Prague tile: Open starts the call", s.tile_started === true);
ok("Prague tile: Open dials Prague (not lueb)", s.tile_prague === true);
ok("live call: right-click shows End call", s.call_prevented === true && /end|ukon/i.test((s.call_items || [])[0] || ""));
ok("live call: End call hangs up", s.call_hung_up === true);
ok("open editor face: right-click shows Translate", s.editor_prevented === true && s.editor_items && s.editor_items.length === 1 && /translate|přelož/i.test(s.editor_items[0] || ""));
ok("open editor: Translate swaps L'amour → EN word", /love/i.test(s.editor_en || ""));
ok("open editor: Translate re-evaluates lang → CS word", /láska/i.test(s.editor_cs || ""));
ok("Lübeck tile: Open starts the lueb call", s.lueb_started === true);
ok("Esc dismisses the menu", s.esc_up === true && s.esc_dismissed === true);

if (fail) { console.error("\n" + fail + " laptop-menu check(s) failed."); process.exit(1); }
console.log("\nAll laptop-menu checks passed.");

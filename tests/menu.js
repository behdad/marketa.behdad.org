#!/usr/bin/env node
// Focused test for the runtime-app right-click menus + restart teardown + the DOOM
// fullscreen button. Uses the same one-shot headless-Chrome runner as play.js
// (--dump-dom, no long-lived process, so it runs in-sandbox).
//
// Two menus by design: python/linux fold Restart+Kill into their existing console
// copy/paste menu (.console-ctx); DOOM (a canvas, no copy/paste) gets its own
// standalone menu (.mon-ctx). This verifies UX + wiring + restart TEARDOWN (state
// reset, canvas swap, no throws). It does NOT load the real WASM runtimes (pyodide /
// v86 / doom need real network + wasm, which --virtual-time-budget can't drive), so
// the full runtime RE-INIT completing is out of scope here — that's a live check.
"use strict";
var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report = { errors: [], steps: {} };",
  "  function S(k,v){ report.steps[k]=v; }",
  "  function ctxAt(el){ var r=el.getBoundingClientRect(); var e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+Math.min(20,r.width/2),clientY:r.top+Math.min(20,r.height/2)}); var prevented=!el.dispatchEvent(e); return prevented; }",
  "  function ccMenu(){ return document.querySelector('.console-ctx.show'); }",           // python/linux menu
  "  function ccVisible(sel){ var m=ccMenu(); if(!m) return false; var b=m.querySelector(sel); return !!b && b.style.display!=='none'; }",
  "  function ccText(sel){ var m=ccMenu(); var b=m&&m.querySelector(sel); return b?b.textContent:''; }",
  "  function monMenu(){ return document.querySelector('.mon-ctx'); }",                    // doom menu
  "  function monItems(){ var m=monMenu(); return m?[].map.call(m.querySelectorAll('button span'),function(s){return s.textContent;}):[]; }",
  "  function mon(){ return document.getElementById('office-monitor'); }",
  "  function showApp(cls){ var m=mon(); m.classList.remove('show-python','show-linux','show-doom'); m.classList.add('screen-on','show-caps',cls); window.currentStageName='office'; }",
  "  async function run(){",
  "    if (window.goToStage) window.goToStage('office');",
  "    await sleep(200);",
  // ---- PYTHON (console-ctx) ----
  "    showApp('show-python');",
  "    var pyOut = document.getElementById('monitor-py-out');",
  "    S('py_contextmenu_prevented', ctxAt(pyOut));",
  "    S('py_menu_present', !!ccMenu());",
  "    S('py_has_copy', !!(ccMenu()&&ccMenu().querySelector('button')));",
  "    S('py_restart_visible', ccVisible('.cc-restart'));",
  "    S('py_kill_visible', ccVisible('.cc-kill'));",
  "    S('py_restart_label', ccText('.cc-restart'));",
  "    S('py_kill_label', ccText('.cc-kill'));",
  "    S('menu_html', ccMenu()?ccMenu().outerHTML.replace(/\\s+/g,' ').slice(0,500):'');",
  // click restart -> teardown + hide
  "    pyOut.innerHTML='<div>stale line</div><div>garbage</div>';",
  "    ccMenu().querySelector('.cc-restart').click(); await sleep(100);",
  "    S('py_menu_hidden_after_restart', !ccMenu());",
  "    S('py_out_reset', /python|CPython|snake/i.test(pyOut.textContent) && !/stale line|garbage/.test(pyOut.textContent));",
  // reopen + kill
  "    showApp('show-python'); ctxAt(pyOut); S('py_menu_reopened', !!ccMenu());",
  "    ccMenu().querySelector('.cc-kill').click(); await sleep(100);",
  "    S('py_kill_closed_app', !mon().classList.contains('show-python'));",
  // Esc keeps app, closes menu
  "    showApp('show-python'); ctxAt(pyOut);",
  "    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));",
  "    await sleep(80);",
  "    S('esc_hid_menu', !ccMenu());",
  "    S('esc_kept_app', mon().classList.contains('show-python'));",
  // plain JS console: no restart/kill
  "    var m=mon(); m.classList.remove('show-python','show-linux','show-doom'); m.classList.add('screen-on','show-caps','show-console'); window.currentStageName='office';",
  "    var conOut=document.getElementById('monitor-console-out'); if(conOut){ ctxAt(conOut); S('console_restart_hidden', !ccVisible('.cc-restart')); } else S('console_restart_hidden', 'no-console-out');",
  // ---- LINUX (console-ctx) ----
  "    showApp('show-linux');",
  "    var lxOutEl=document.getElementById('monitor-linux-out');",
  "    ctxAt(lxOutEl); S('linux_menu_present', !!ccMenu()); S('linux_restart_visible', ccVisible('.cc-restart')); S('linux_kill_visible', ccVisible('.cc-kill'));",
  "    if(ccMenu()) ccMenu().querySelector('.cc-restart').click(); await sleep(60); S('linux_restart_hid_menu', !ccMenu());",
  // ---- DOOM (mon-ctx) ----
  "    showApp('show-doom');",
  "    var doomWrap=document.getElementById('monitor-doom-wrap');",
  "    S('doom_ctx_prevented', ctxAt(doomWrap));",
  "    S('doom_menu_present', !!monMenu()); S('doom_items', monItems());",
  "    if(monMenu()) monMenu().querySelector('button.ctx-kill').click(); await sleep(40); S('doom_kill_hid_menu', !monMenu());",
  // fs button
  "    showApp('show-doom');",
  "    window.__fsCalls=[]; HTMLCanvasElement.prototype.requestFullscreen=function(){window.__fsCalls.push(this.id||'canvas');return Promise.resolve();};",
  "    var fsBtn=document.getElementById('monitor-doom-fs'); S('doom_fs_btn_present', !!fsBtn);",
  "    fsBtn.click(); await sleep(40); S('doom_fs_called_on_canvas', (window.__fsCalls||[]).indexOf('canvas')>=0); S('doom_fs_calls', window.__fsCalls);",
  // doom restart teardown
  "    var before=document.getElementById('canvas'); var threw=null;",
  "    try { window.__restartMonitorDoom(); } catch(e){ threw=String(e); }",
  "    var after=document.getElementById('canvas');",
  "    S('doom_restart_threw', threw);",
  "    S('doom_restart_swapped_canvas', !!after && after!==before && after.id==='canvas');",
  "    S('doom_restart_shows_loading', /loading|načít/i.test(document.getElementById('monitor-doom-msg').textContent));",
  // linux/python restart teardown direct
  "    showApp('show-linux'); var lo=document.getElementById('monitor-linux-out'); lo.innerHTML='<div>old</div>'; var lxThrew=null;",
  "    try { window.__restartMonitorLinux(); } catch(e){ lxThrew=String(e); }",
  "    S('linux_restart_threw', lxThrew); S('linux_restart_cleared_out', !/old/.test(lo.textContent));",
  "    var pyThrew=null; try { window.__restartMonitorPython(); } catch(e){ pyThrew=String(e); } S('python_restart_threw', pyThrew);",
  "  }",
  "  window.addEventListener('load', function(){ setTimeout(function(){ run().catch(function(e){ window.__errs.push('harness: '+String(e&&e.stack||e)); }).then(function(){ report.errors=window.__errs; document.getElementById('__report').textContent=JSON.stringify(report); }); }, 400); });",
  "})();",
  "</script>"
].join("\n");

var rep = lib.runPageSync("rsvp.html", HARNESS, 15000, { patchRaf: true });
if (!rep) { console.log("  ✗ harness produced no report (page error before load, or budget too small)"); process.exit(1); }

var fails = 0;
function check(name, cond, detail) {
  if (cond) console.log("  ✓ " + name);
  else { fails++; console.log("  ✗ " + name + (detail !== undefined ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
var s = rep.steps;
console.log("monitor right-click menus + restart + fs button:");
console.log(" python / linux (folded into the console menu):");
check("contextmenu suppresses native menu over python console", s.py_contextmenu_prevented === true);
check("console menu appears over python", s.py_menu_present === true);
check("Restart item visible for python", s.py_restart_visible === true);
check("Kill item visible for python", s.py_kill_visible === true);
check("Restart labelled 'Restart'", /restart/i.test(s.py_restart_label), s.py_restart_label);
check("Kill labelled 'Kill'", /kill/i.test(s.py_kill_label), s.py_kill_label);
check("Restart hides the menu + tears down python output", s.py_menu_hidden_after_restart === true && s.py_out_reset === true);
check("Kill closes the python app", s.py_kill_closed_app === true);
check("Esc hides the menu", s.esc_hid_menu === true);
check("Esc leaves the app open (does not close it)", s.esc_kept_app === true);
check("plain JS console does NOT get a Restart item", s.console_restart_hidden === true || s.console_restart_hidden === "no-console-out");
check("console menu appears over linux with Restart+Kill", s.linux_menu_present === true && s.linux_restart_visible === true && s.linux_kill_visible === true);
check("linux Restart hides the menu", s.linux_restart_hid_menu === true);
console.log(" doom (standalone menu):");
check("contextmenu suppresses native menu over doom", s.doom_ctx_prevented === true);
check("doom menu appears with exactly Restart + Kill", s.doom_menu_present === true && Array.isArray(s.doom_items) && s.doom_items.length === 2 && /restart/i.test(s.doom_items[0]) && /kill/i.test(s.doom_items[1]), s.doom_items);
check("doom Kill hides the menu", s.doom_kill_hid_menu === true);
check("doom fs button present", s.doom_fs_btn_present === true);
check("doom fs button calls requestFullscreen on the canvas", s.doom_fs_called_on_canvas === true, s.doom_fs_calls);
console.log(" restart teardown (no throws, real state reset):");
check("doom restart does not throw + swaps a fresh canvas (id kept)", s.doom_restart_threw === null && s.doom_restart_swapped_canvas === true, s.doom_restart_threw);
check("doom restart shows the loading message", s.doom_restart_shows_loading === true);
check("linux restart does not throw + clears the console", s.linux_restart_threw === null && s.linux_restart_cleared_out === true, s.linux_restart_threw);
check("python restart does not throw", s.python_restart_threw === null, s.python_restart_threw);
check("no uncaught JS errors during the run", Array.isArray(rep.errors) && rep.errors.length === 0, rep.errors);

console.log("\n" + (fails ? ("FAILED " + fails + " check(s)") : "All menu checks passed."));
console.log("captured console menu HTML: " + (s.menu_html || "(none)"));
process.exit(fails ? 1 : 0);

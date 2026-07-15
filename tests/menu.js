#!/usr/bin/env node
// Focused test for the monitor right-click Kill/Restart menus + restart teardown + the
// DOOM fullscreen button. Uses the same one-shot headless-Chrome runner as play.js
// (--dump-dom, no long-lived process, so it runs in-sandbox).
//
// Two menus by design (kept split to avoid a double menu on the console apps):
//   • .console-ctx — python/linux/console fold Kill (and, for the runtimes, Restart) into
//     their existing copy/paste menu.
//   • .mon-ctx — every other real app (mail, weather, mines, music, video, …) plus DOOM
//     (a canvas, no copy/paste) gets this standalone menu. Kill delegates to
//     __closeTopMonitorApp; Restart appears only for DOOM.
// Kill on a self-hosted runtime (doom/python/linux) is DISABLED until the runtime is
// actually running — the running predicates (__doomRunning/__pyRunning/__lxRunning) are
// window-exposed so this harness can flip them (it can't boot the real WASM runtimes,
// which need real network + wasm that --virtual-time-budget can't drive). Full runtime
// RE-INIT completing is out of scope here — that's a live check.
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
  "  function ccMenu(){ return document.querySelector('.console-ctx.show'); }",           // python/linux/console menu
  "  function ccVisible(sel){ var m=ccMenu(); if(!m) return false; var b=m.querySelector(sel); return !!b && b.style.display!=='none'; }",
  "  function ccText(sel){ var m=ccMenu(); var b=m&&m.querySelector(sel); return b?b.textContent:''; }",
  "  function ccKillDisabled(){ var m=ccMenu(); var b=m&&m.querySelector('.cc-kill'); return !!(b&&b.disabled); }",
  "  function monMenu(){ return document.querySelector('.mon-ctx'); }",                    // doom + every non-console app menu
  "  function monItems(){ var m=monMenu(); return m?[].map.call(m.querySelectorAll('button span'),function(s){return s.textContent;}):[]; }",
  "  function monKill(){ var m=monMenu(); return m?m.querySelector('button.ctx-kill'):null; }",
  "  function monRestart(){ var m=monMenu(); return m?m.querySelector('button.ctx-restart'):null; }",
  "  function monKillDisabled(){ var b=monKill(); return !!(b&&b.disabled); }",
  "  function mon(){ return document.getElementById('office-monitor'); }",
  "  var APP_CLASSES=['show-caps','show-nowplaying','show-mail','show-mines','show-weather','show-calendar','show-video','show-tattoo','show-life','show-editor','show-browser','show-tehran','photobooth','show-python','show-linux','show-console','show-doom'];",
  "  function showApp(cls){ var m=mon(); APP_CLASSES.forEach(function(c){m.classList.remove(c);}); m.classList.add('screen-on'); if(cls) m.classList.add(cls); window.currentStageName='office'; }",
  "  async function run(){",
  "    if (window.goToStage) window.goToStage('office');",
  "    await sleep(200);",
  // ---- DESKTOP: no menu ----
  "    showApp('show-caps');",
  "    S('desktop_ctx_prevented', ctxAt(mon()));",     // should be false — native menu kept
  "    S('desktop_no_mon_menu', !monMenu());",
  "    S('desktop_no_cc_menu', !ccMenu());",
  // ---- NON-RUNTIME APPS (mon-ctx): Kill only, enabled, no Restart ----
  "    var nonRt=['show-mail','show-weather','show-mines','show-nowplaying'];",
  "    var nonRtOk=true, nonRtDetail={};",
  "    for (var i=0;i<nonRt.length;i++){ var c=nonRt[i]; showApp(c); var prevented=ctxAt(mon()); var items=monItems(); var kill=monKill(); var ok = prevented===true && !!monMenu() && items.length===1 && /kill/i.test(items[0]||'') && !monRestart() && !!kill && kill.disabled===false; nonRtDetail[c]={prevented:prevented,items:items,hasRestart:!!monRestart(),killDisabled:kill?kill.disabled:'no-kill'}; if(!ok) nonRtOk=false; }",
  "    S('nonruntime_kill_only_enabled', nonRtOk); S('nonruntime_detail', nonRtDetail);",
  // one full close through the generalized Kill (mon-ctx -> __closeTopMonitorApp)
  "    showApp('show-mail'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(80);",
  "    S('mail_kill_closed_app', !mon().classList.contains('show-mail'));",
  "    S('mail_kill_hid_menu', !monMenu());",
  // ---- PYTHON (console-ctx) ----
  "    showApp('show-python');",
  "    var pyOut = document.getElementById('monitor-py-out');",
  "    S('py_contextmenu_prevented', ctxAt(pyOut));",
  "    S('py_menu_present', !!ccMenu());",
  "    S('py_restart_visible', ccVisible('.cc-restart'));",
  "    S('py_kill_visible', ccVisible('.cc-kill'));",
  "    S('py_kill_disabled_when_cold', ccKillDisabled());",   // runtime not loaded → Kill inactive
  "    S('py_restart_label', ccText('.cc-restart'));",
  "    S('py_kill_label', ccText('.cc-kill'));",
  "    S('menu_html', ccMenu()?ccMenu().outerHTML.replace(/\\s+/g,' ').slice(0,500):'');",
  // Restart is the load/failure affordance — it works even while the runtime is cold. It now runs the
  // Monty Python Black Knight flash first, THEN tears down (deferred past the ~2.6s flash). openPython
  // no-ops here (no show-caps), so the reopened welcome doesn't reprint — pyOut just clears.
  "    pyOut.innerHTML='<div>stale line</div><div>garbage</div>';",
  "    ccMenu().querySelector('.cc-restart').click(); await sleep(40);",
  "    S('py_menu_hidden_after_restart', !ccMenu());",
  "    S('py_restart_flash_started', mon().classList.contains('death-python'));",
  "    await sleep(2700);",   // wait out the ~2.6s flash → destroyPython clears the output + drops show-python
  "    S('py_out_reset', !/stale line|garbage/.test(pyOut.textContent) && !mon().classList.contains('death-python'));",
  // mark the runtime running → Kill enabled → runs the Black Knight flash, THEN destroys the app
  "    window.__pyRunning=function(){return true;};",
  "    showApp('show-python'); ctxAt(pyOut); S('py_menu_reopened', !!ccMenu());",
  "    S('py_kill_enabled_when_running', !ccKillDisabled());",
  "    ccMenu().querySelector('.cc-kill').click(); await sleep(40);",
  "    S('py_kill_hid_menu', !ccMenu());",
  "    S('py_kill_flash_started', mon().classList.contains('death-python'));",
  "    S('py_kill_still_open_during_flash', mon().classList.contains('show-python'));",
  "    await sleep(2700);",   // wait out the flash → destroyPython drops show-python
  "    S('py_kill_closed_app', !mon().classList.contains('show-python'));",
  "    S('py_kill_flash_ended', !mon().classList.contains('death-python'));",
  // Esc keeps app, closes menu
  "    showApp('show-python'); ctxAt(pyOut);",
  "    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));",
  "    await sleep(80);",
  "    S('esc_hid_menu', !ccMenu());",
  "    S('esc_kept_app', mon().classList.contains('show-python'));",
  // plain JS console: Kill present + enabled (no runtime), but NO Restart
  "    showApp('show-console');",
  "    var conOut=document.getElementById('monitor-console-out');",
  "    if(conOut){ ctxAt(conOut); S('console_restart_hidden', !ccVisible('.cc-restart')); S('console_kill_visible', ccVisible('.cc-kill')); S('console_kill_enabled', !ccKillDisabled()); }",
  "    else { S('console_restart_hidden','no-console-out'); S('console_kill_visible','no-console-out'); S('console_kill_enabled','no-console-out'); }",
  // ---- LINUX (console-ctx) ----
  "    showApp('show-linux');",
  "    var lxOutEl=document.getElementById('monitor-linux-out');",
  "    ctxAt(lxOutEl); S('linux_menu_present', !!ccMenu()); S('linux_restart_visible', ccVisible('.cc-restart')); S('linux_kill_visible', ccVisible('.cc-kill'));",
  "    S('linux_kill_disabled_when_cold', ccKillDisabled());",
  "    if(ccMenu()) ccMenu().querySelector('.cc-restart').click(); await sleep(60); S('linux_restart_hid_menu', !ccMenu());",
  // ---- DOOM (mon-ctx) ----
  "    showApp('show-doom');",
  "    var doomWrap=document.getElementById('monitor-doom-wrap');",
  "    S('doom_ctx_prevented', ctxAt(doomWrap));",
  "    S('doom_menu_present', !!monMenu()); S('doom_items', monItems());",
  "    S('doom_kill_disabled_when_cold', monKillDisabled());",   // engine not up → Kill inactive
  // mark the engine running → Kill enabled → closes
  "    window.__doomRunning=function(){return true;};",
  "    showApp('show-doom'); ctxAt(doomWrap);",
  "    S('doom_kill_enabled_when_running', !monKillDisabled());",
  // Kill now runs a ~2.1s FATALITY death-flash, THEN destroys the app: the menu hides + the
  // on-screen flash (death-doom) starts immediately; show-doom is torn down only after the flash.
  "    if(monKill()) monKill().click(); await sleep(40); S('doom_kill_hid_menu', !monMenu()); S('doom_kill_flash_started', mon().classList.contains('death-doom')); S('doom_kill_still_open_during_flash', mon().classList.contains('show-doom')); await sleep(2300); S('doom_kill_closed_app', !mon().classList.contains('show-doom')); S('doom_kill_flash_ended', !mon().classList.contains('death-doom'));",
  // fs button
  "    showApp('show-doom');",
  "    window.__fsCalls=[]; HTMLCanvasElement.prototype.requestFullscreen=function(){window.__fsCalls.push(this.id||'canvas');return Promise.resolve();};",
  "    var fsBtn=document.getElementById('monitor-doom-fs'); S('doom_fs_btn_present', !!fsBtn);",
  "    fsBtn.click(); await sleep(40); S('doom_fs_called_on_canvas', (window.__fsCalls||[]).indexOf('canvas')>=0); S('doom_fs_calls', window.__fsCalls);",
  // doom restart teardown — Restart now runs the FATALITY flash, THEN destroys (and would cold-boot,
  // but a real re-boot needs show-caps + the WASM runtime, out of scope here; no show-caps → openDoom
  // no-ops, so we just verify flash-then-teardown). show-doom is set from the fs block above.
  "    var before=document.getElementById('canvas'); var threw=null;",
  "    try { window.__restartMonitorDoom(); } catch(e){ threw=String(e); }",
  "    S('doom_restart_threw', threw);",
  "    S('doom_restart_flash_started', mon().classList.contains('death-doom'));",
  "    await sleep(2300);",  // wait out the ~2.1s flash → destroyDoom swaps the canvas + drops show-doom
  "    var after=document.getElementById('canvas');",
  "    S('doom_restart_swapped_canvas', !!after && after!==before && after.id==='canvas');",
  "    S('doom_restart_torn_down', !mon().classList.contains('show-doom') && !mon().classList.contains('death-doom'));",
  // linux/python restart teardown direct
  // Linux Restart now runs a BSOD flash, THEN destroys (clears the console) and would cold-boot
  // (no show-caps here → openLinux no-ops); verify flash-then-teardown.
  "    showApp('show-linux'); var lo=document.getElementById('monitor-linux-out'); lo.innerHTML='<div>old</div>'; var lxThrew=null;",
  "    try { window.__restartMonitorLinux(); } catch(e){ lxThrew=String(e); }",
  "    S('linux_restart_threw', lxThrew); S('linux_restart_flash_started', mon().classList.contains('death-linux'));",
  "    await sleep(2400);",  // wait out the BSOD flash → destroyLinux clears the console
  "    S('linux_restart_cleared_out', !/old/.test(lo.textContent));",
  // Python Restart now runs the Monty Python Black Knight flash, THEN destroys (clears the output +
  // drops show-python) and would reopen a fresh REPL (no show-caps here → openPython no-ops); verify flash-then-teardown.
  "    showApp('show-python'); var po=document.getElementById('monitor-py-out'); po.innerHTML='<div>old-py</div>'; var pyThrew=null;",
  "    try { window.__restartMonitorPython(); } catch(e){ pyThrew=String(e); }",
  "    S('python_restart_threw', pyThrew); S('python_restart_flash_started', mon().classList.contains('death-python'));",
  "    await sleep(2700);",  // wait out the ~2.6s flash → destroyPython clears the output + drops show-python
  "    S('python_restart_cleared_out', !/old-py/.test(po.textContent)); S('python_restart_torn_down', !mon().classList.contains('show-python') && !mon().classList.contains('death-python'));",
  "  }",
  "  window.addEventListener('load', function(){ setTimeout(function(){ run().catch(function(e){ window.__errs.push('harness: '+String(e&&e.stack||e)); }).then(function(){ report.errors=window.__errs; document.getElementById('__report').textContent=JSON.stringify(report); }); }, 400); });",
  "})();",
  "</script>"
].join("\n");

var rep = lib.runPageSync("rsvp.html", HARNESS, 20000, { patchRaf: true });
if (!rep) { console.log("  ✗ harness produced no report (page error before load, or budget too small)"); process.exit(1); }

var fails = 0;
function check(name, cond, detail) {
  if (cond) console.log("  ✓ " + name);
  else { fails++; console.log("  ✗ " + name + (detail !== undefined ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
var s = rep.steps;
console.log("monitor right-click Kill/Restart menus + restart + fs button:");
console.log(" desktop (no app open):");
check("right-click on the bare desktop shows no menu (native kept)", s.desktop_ctx_prevented === false && s.desktop_no_mon_menu === true && s.desktop_no_cc_menu === true, { prevented: s.desktop_ctx_prevented, mon: !s.desktop_no_mon_menu, cc: !s.desktop_no_cc_menu });
console.log(" non-runtime apps (mail/weather/mines/music) — Kill only, enabled, no Restart:");
check("every sampled non-runtime app shows exactly an enabled Kill, no Restart", s.nonruntime_kill_only_enabled === true, s.nonruntime_detail);
check("generalized Kill closes a non-runtime app (mail) + hides the menu", s.mail_kill_closed_app === true && s.mail_kill_hid_menu === true);
console.log(" python / linux (folded into the console menu):");
check("contextmenu suppresses native menu over python console", s.py_contextmenu_prevented === true);
check("console menu appears over python", s.py_menu_present === true);
check("Restart item visible for python", s.py_restart_visible === true);
check("Kill item visible for python", s.py_kill_visible === true);
check("Kill is DISABLED while the python runtime isn't running", s.py_kill_disabled_when_cold === true);
check("Restart labelled 'Restart'", /restart/i.test(s.py_restart_label), s.py_restart_label);
check("Kill labelled 'Kill'", /kill/i.test(s.py_kill_label), s.py_kill_label);
check("Restart works while cold — hides the menu, runs the Black Knight flash, then tears down python output", s.py_menu_hidden_after_restart === true && s.py_restart_flash_started === true && s.py_out_reset === true);
check("Kill becomes ENABLED once the runtime is running", s.py_kill_enabled_when_running === true);
check("enabled Kill runs the Black Knight flash then destroys the python app", s.py_kill_hid_menu === true && s.py_kill_flash_started === true && s.py_kill_still_open_during_flash === true && s.py_kill_closed_app === true && s.py_kill_flash_ended === true);
check("Esc hides the menu", s.esc_hid_menu === true);
check("Esc leaves the app open (does not close it)", s.esc_kept_app === true);
check("plain JS console gets NO Restart", s.console_restart_hidden === true || s.console_restart_hidden === "no-console-out");
check("plain JS console gets an enabled Kill (no runtime to gate)", (s.console_kill_visible === true && s.console_kill_enabled === true) || s.console_kill_visible === "no-console-out");
check("console menu appears over linux with Restart+Kill", s.linux_menu_present === true && s.linux_restart_visible === true && s.linux_kill_visible === true);
check("linux Kill is DISABLED while the VM isn't running", s.linux_kill_disabled_when_cold === true);
check("linux Restart hides the menu", s.linux_restart_hid_menu === true);
console.log(" doom (standalone menu):");
check("contextmenu suppresses native menu over doom", s.doom_ctx_prevented === true);
check("doom menu appears with Kill + Restart (Kill first)", s.doom_menu_present === true && Array.isArray(s.doom_items) && s.doom_items.length === 2 && /kill/i.test(s.doom_items[0]) && /restart/i.test(s.doom_items[1]), s.doom_items);
check("doom Kill is DISABLED while the engine isn't running", s.doom_kill_disabled_when_cold === true);
check("doom Kill becomes ENABLED once the engine is running", s.doom_kill_enabled_when_running === true);
check("enabled doom Kill runs the FATALITY flash then destroys the app", s.doom_kill_hid_menu === true && s.doom_kill_flash_started === true && s.doom_kill_still_open_during_flash === true && s.doom_kill_closed_app === true && s.doom_kill_flash_ended === true);
check("doom fs button present", s.doom_fs_btn_present === true);
check("doom fs button calls requestFullscreen on the canvas", s.doom_fs_called_on_canvas === true, s.doom_fs_calls);
console.log(" restart teardown (no throws, real state reset):");
check("doom restart runs the flash then tears down + swaps a fresh canvas (id kept)", s.doom_restart_threw === null && s.doom_restart_flash_started === true && s.doom_restart_swapped_canvas === true && s.doom_restart_torn_down === true, s.doom_restart_threw);
check("linux restart runs the BSOD flash then destroys + clears the console", s.linux_restart_threw === null && s.linux_restart_flash_started === true && s.linux_restart_cleared_out === true, s.linux_restart_threw);
check("python restart runs the Black Knight flash then destroys + clears the console", s.python_restart_threw === null && s.python_restart_flash_started === true && s.python_restart_cleared_out === true && s.python_restart_torn_down === true, s.python_restart_threw);
check("no uncaught JS errors during the run", Array.isArray(rep.errors) && rep.errors.length === 0, rep.errors);

console.log("\n" + (fails ? ("FAILED " + fails + " check(s)") : "All menu checks passed."));
console.log("captured console menu HTML: " + (s.menu_html || "(none)"));
process.exit(fails ? 1 : 0);

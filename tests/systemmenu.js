#!/usr/bin/env node
// Focused monitor system-menu/CAPS LOCK lifecycle test. The menu delegates power and
// sleep to the existing tower/saver owners; the lock itself must persist independently,
// block shortcuts, and only clear after both caps are matched or the PC shuts down.
"use strict";
var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function(){",
  " function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  " var report={errors:window.__errs||[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  " async function run(){",
  "  if(window.goToStage)window.goToStage('office'); await sleep(100);",
  "  var mon=document.getElementById('office-monitor'),brand=document.getElementById('monitor-system-brand');",
  "  mon.classList.add('screen-on','show-caps');",
  "  brand.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
  "  var menu=document.getElementById('monitor-system-menu');",
  "  S('menu_open',menu.classList.contains('open'));",
  "  S('menu_actions',[].map.call(menu.querySelectorAll('[data-action]'),function(n){return n.getAttribute('data-action');}));",
  "  window.__markMonitorAppRunning('mail'); window.__monitorSystemAction('sleep');",
  "  S('sleep_saver',mon.classList.contains('show-saver'));",
  "  mon.dispatchEvent(new PointerEvent('pointermove',{bubbles:true})); await sleep(30);",
  "  S('sleep_woke',!mon.classList.contains('show-saver')&&mon.classList.contains('show-caps'));",
  "  S('sleep_kept_apps',window.__monitorAppRunning('mail'));",
  "  window.__monitorSystemAction('lock'); await sleep(30);",
  "  S('lock_started',window.__monitorLocked()&&mon.classList.contains('monitor-locked'));",
  "  S('lock_saved',!!JSON.parse(localStorage.getItem('loftMonitorCapsLock')||'null'));",
  "  mon.dispatchEvent(new PointerEvent('pointermove',{bubbles:true})); mon.dispatchEvent(new MouseEvent('click',{bubbles:true})); await sleep(30);",
  "  S('lock_ignored_wake',window.__monitorLocked()&&mon.classList.contains('show-saver'));",
  "  var blocked=window.__openMonitorApp('mail'); S('lock_blocked_app',/CAPS LOCK/.test(String(blocked))&&!mon.classList.contains('show-mail'));",
  "  var pink=document.querySelector('[data-cap=\"pink\"]'),blue=document.querySelector('[data-cap=\"blue\"]'),marketa=document.querySelector('[data-person=\"marketa\"]'),behdad=document.querySelector('[data-person=\"behdad\"]');",
  "  pink.dispatchEvent(new MouseEvent('click',{bubbles:true})); marketa.dispatchEvent(new MouseEvent('click',{bubbles:true})); await sleep(20);",
  "  S('wrong_no_penalty',window.__monitorLocked()&&!window.__monitorLockState().matched.pink&&!window.__monitorLockState().matched.blue);",
  "  pink.dispatchEvent(new MouseEvent('click',{bubbles:true})); behdad.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
  "  blue.dispatchEvent(new MouseEvent('click',{bubbles:true})); marketa.dispatchEvent(new MouseEvent('click',{bubbles:true})); await sleep(900);",
  "  S('matched_unlocked',!window.__monitorLocked()&&!mon.classList.contains('monitor-locked')&&mon.classList.contains('show-caps'));",
  "  S('unlock_cleared_save',localStorage.getItem('loftMonitorCapsLock')===null);",
  "  window.__monitorSystemAction('lock'); var seed=window.__monitorLockState().seed; mon.classList.remove('monitor-locked');",
  "  S('resume_lock',window.__resumeMonitorLock()&&mon.classList.contains('monitor-locked')&&window.__monitorLockState().seed===seed);",
  "  var tower=document.getElementById('office-pc-desk-trio'); if(tower&&!tower.classList.contains('on'))tower.classList.add('on');",
  "  window.__monitorSystemAction('shutdown'); await sleep(40);",
  "  S('shutdown_off',!!tower&&!tower.classList.contains('on'));",
  "  S('shutdown_cleared_lock',!window.__monitorLocked()&&localStorage.getItem('loftMonitorCapsLock')===null);",
  "  S('shutdown_cleared_apps',!window.__monitorAppRunning('mail'));",
  "  document.getElementById('__report').textContent=JSON.stringify(report);",
  " } run();",
  "})();",
  "</script>"
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
var fail = 0;
function ok(name, cond) { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail++; }
console.log("monitor system menu + CAPS LOCK:");
if (!r) { console.error("  ✗ no report captured"); process.exit(1); }
var s = r.steps;
ok("no uncaught JS errors", r.errors.length === 0);
ok("wordmark opens the system menu", s.menu_open === true);
ok("menu exposes Website, Lock, Sleep, Reboot, Shut down", JSON.stringify(s.menu_actions) === JSON.stringify(["website","lock","sleep","reboot","shutdown"]));
ok("Sleep enters the saver and pointer activity wakes it", s.sleep_saver === true && s.sleep_woke === true);
ok("Sleep preserves running apps", s.sleep_kept_apps === true);
ok("Lock starts and persists", s.lock_started === true && s.lock_saved === true);
ok("ordinary wake gestures cannot bypass Lock", s.lock_ignored_wake === true);
ok("app commands cannot bypass Lock", s.lock_blocked_app === true);
ok("a wrong cap has no penalty", s.wrong_no_penalty === true);
ok("matching both caps unlocks to the desktop", s.matched_unlocked === true && s.unlock_cleared_save === true);
ok("a persisted lock resumes with its layout", s.resume_lock === true);
ok("Shut down powers off and clears lock/apps", s.shutdown_off === true && s.shutdown_cleared_lock === true && s.shutdown_cleared_apps === true);
if (fail) { console.error("\n" + fail + " system-menu check(s) failed."); process.exit(1); }
console.log("\nAll monitor system-menu checks passed.");

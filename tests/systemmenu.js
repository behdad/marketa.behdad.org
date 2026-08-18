#!/usr/bin/env node
// Focused monitor system-menu/CAPS LOCK lifecycle test. The menu delegates power and
// sleep to the monitor's suspend owner; the lock itself must persist independently,
// leave room/browser keys alone, and clear after cap matching, a Caps Lock cycle, or shutdown.
"use strict";
var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function(){",
  " function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  " function key(k){document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));}",
  " var report={errors:window.__errs||[],steps:{}}; function S(k,v){report.steps[k]=v;}",
  " async function run(){",
  "  if(window.__goToStage)window.__goToStage('office'); await sleep(100);",
  "  var mon=document.getElementById('office-monitor'),brand=document.getElementById('monitor-system-brand'),tower=document.getElementById('office-pc-desk-trio');",
  "  if(tower&&!tower.classList.contains('on'))tower.classList.add('on');",
  "  mon.classList.add('screen-on','show-caps');",
  "  S('hidden_gutters_pass_through',[].every.call(document.querySelectorAll('.monitor-runtime-side-hit'),function(n){return getComputedStyle(n).pointerEvents==='none';}));",
  "  brand.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
  "  var menu=document.getElementById('monitor-system-menu');",
  "  function inside(bg,nodes){var b=bg.getBBox();return [].every.call(nodes,function(n){var r=n.getBBox();return r.x>=b.x&&r.x+r.width<=b.x+b.width&&r.y>=b.y&&r.y+r.height<=b.y+b.height;});}",
  "  S('menu_open',menu.classList.contains('open'));",
  "  S('menu_actions',[].map.call(menu.querySelectorAll('[data-action]'),function(n){return n.getAttribute('data-action');}));",
  "  S('tagline_removed',menu.querySelector('.desk-system-tagline')===null);",
  "  S('menu_type',parseFloat(getComputedStyle(menu.querySelector('.desk-system-label')).fontSize));",
  "  S('menu_family',getComputedStyle(menu.querySelector('.desk-system-label')).fontFamily);",
  "  S('menu_title_family',getComputedStyle(menu.querySelector('.desk-system-title')).fontFamily);",
  "  S('caption_family',getComputedStyle(document.querySelector('.scene-caption')).fontFamily);",
  "  var modalCloses=document.querySelectorAll('.monitor-modal-close');",
  "  S('modal_closes_unified',modalCloses.length===4&&[].every.call(modalCloses,function(close){return !!close.querySelector('.mini-hit')&&!!close.querySelector('.monitor-modal-close-base')&&!!close.querySelector('.monitor-modal-close-shine')&&!!close.querySelector('.monitor-modal-close-hover')&&!!close.querySelector('.monitor-modal-close-x')&&!close.querySelector('circle')&&!close.querySelector('text');}));",
  "  S('menu_fit_en',inside(menu.querySelector('.desk-system-panel'),menu.querySelectorAll('.desk-system-title,.desk-system-label'))); window.__setLang('cs'); S('menu_fit_cs',inside(menu.querySelector('.desk-system-panel'),menu.querySelectorAll('.desk-system-title,.desk-system-label'))); window.__setLang('en');",
  "  window.__monitorSystemAction('system'); await sleep(30); var sysinfo=document.getElementById('monitor-system-info-layer');",
  "  var statusLink=sysinfo.querySelector('.monitor-system-info-status-link');",
  "  S('system_open',sysinfo.classList.contains('open')&&/Browser/.test(sysinfo.textContent)&&/Graphics/.test(sysinfo.textContent)&&/Performance/.test(sysinfo.textContent)&&/Hardware/.test(sysinfo.textContent)&&/Best in the latest desktop Chrome\\./.test(sysinfo.textContent)&&statusLink&&/is%3Aissue%20is%3Aopen%20Chrome/.test(statusLink.getAttribute('href')));",
  "  S('system_fit_en',inside(sysinfo.querySelector('.monitor-system-info-bg'),sysinfo.querySelectorAll('.monitor-system-info-title,.monitor-system-info-label,.monitor-system-info-value,.monitor-system-info-recommendation'))); window.__setLang('cs'); window.__openMonitorSystemInfo(); S('system_fit_cs',inside(sysinfo.querySelector('.monitor-system-info-bg'),sysinfo.querySelectorAll('.monitor-system-info-title,.monitor-system-info-label,.monitor-system-info-value,.monitor-system-info-recommendation'))); window.__setLang('en');",
  "  window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})); await sleep(20); S('system_closed',!sysinfo.classList.contains('open')&&!mon.classList.contains('show-system')&&window.__monitorAppRunning('system'));",
  "  var systemApps=window.__chatMonitorApps(); if(window.__monitorZoomIn)window.__monitorZoomIn(); ['s','y','s'].forEach(key); var systemSearch=window.__monitorDockSearch(); key('Enter'); await sleep(40);",
  "  S('system_search',systemSearch.match==='system'&&!document.getElementById('monitor-dock-system')&&systemApps.some(function(app){return app.id==='system'&&app.access==='search';})&&sysinfo.classList.contains('open')&&mon.classList.contains('show-system')&&window.__monitorAppRunning('system'));",
  "  sysinfo.querySelector('.monitor-system-info-bg').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:120,clientY:80})); var systemCtx=document.querySelector('.mon-ctx');",
  "  S('context_family',systemCtx&&getComputedStyle(systemCtx).fontFamily);",
  "  S('system_context',!!systemCtx&&!!systemCtx.querySelector('button.ctx-kill')&&!systemCtx.querySelector('button.ctx-restart')); systemCtx.querySelector('button.ctx-kill').click(); await sleep(300);",
  "  var bugs=sysinfo.querySelectorAll('.monitor-system-info-kill-bug'),receipt=sysinfo.querySelector('.monitor-system-info-kill-receipt');",
  "  S('system_killing',sysinfo.classList.contains('killing')&&!!receipt&&bugs.length===3&&document.getElementById('hunt-caption').textContent==='System killed. The bugs survived.'&&window.__loftMessages.cs.hunt.df_system_quip==='Systém ukončen. Chyby přežily.');",
  "  await sleep(2000); S('system_killed',!sysinfo.classList.contains('open')&&!mon.classList.contains('show-system')&&!window.__monitorAppRunning('system')&&mon.classList.contains('show-caps'));",
  "  window.__monitorSystemAction('about'); await sleep(30); var about=document.getElementById('monitor-about-layer');",
  "  S('about_open',about.classList.contains('open')&&mon.classList.contains('show-about')&&window.__monitorAppRunning('about')&&about.textContent.indexOf('the place we (Markéta & behdad) call home.')>=0&&about.textContent.indexOf('The Loft: where artificial meets higher intelligence.')>=0);",
  "  S('about_type',{title:parseFloat(getComputedStyle(about.querySelector('.monitor-about-title')).fontSize),copy:parseFloat(getComputedStyle(about.querySelector('.monitor-about-copy')).fontSize),motto:parseFloat(getComputedStyle(about.querySelector('.monitor-about-motto')).fontSize)});",
  "  S('about_fit_en',inside(about.querySelector('.monitor-about-bg'),about.querySelectorAll('.monitor-about-mark,.monitor-about-title,.monitor-about-copy,.monitor-about-motto'))); window.__setLang('cs'); S('about_fit_cs',inside(about.querySelector('.monitor-about-bg'),about.querySelectorAll('.monitor-about-mark,.monitor-about-title,.monitor-about-copy,.monitor-about-motto'))); window.__setLang('en');",
  "  window.__killMonitorAbout(); await sleep(300); var aboutRings=about.querySelectorAll('.monitor-about-portal-ring');",
  "  S('about_killing',about.classList.contains('killing')&&about.textContent.indexOf('about:eternity')>=0&&aboutRings.length===4&&!!about.querySelector('.monitor-about-portal-core'));",
  "  await sleep(2200); S('about_killed',!about.classList.contains('open')&&!mon.classList.contains('show-about')&&!window.__monitorAppRunning('about')&&mon.classList.contains('show-caps'));",
  "  window.__monitorSystemAction('credits'); await sleep(80); var credits=document.getElementById('monitor-credits-layer');",
  "  S('credits_open',credits.classList.contains('open')&&credits.textContent.indexOf('Markéta')>=0&&credits.textContent.indexOf('Irene')<credits.textContent.indexOf('Kasra')&&credits.textContent.indexOf('FontTools')>=0&&credits.textContent.indexOf((window.__loftMessages[document.documentElement.lang]||window.__loftMessages.en).credits_made)>=0&&credits.textContent.indexOf('August 2026')>=0&&credits.textContent.indexOf('marketa.behdad.org/loft-day')>=0&&credits.textContent.indexOf('github.com/behdad/marketa.behdad.org')>=0);",
  "  S('credits_type',{title:parseFloat(getComputedStyle(credits.querySelector('.monitor-credits-title')).fontSize),name:parseFloat(getComputedStyle(credits.querySelector('.monitor-credits-name')).fontSize),body:parseFloat(getComputedStyle(credits.querySelector('.monitor-credits-software')).fontSize)});",
  "  S('credits_link_family',getComputedStyle(credits.querySelector('.monitor-credits-link')).fontFamily);",
  "  window.__killMonitorCredits(); await sleep(80); S('credits_killing',credits.classList.contains('killing')&&credits.textContent.indexOf('the gratitude survives.')>=0);",
  "  await sleep(3000); S('credits_killed',!credits.classList.contains('open')&&!mon.classList.contains('show-credits')&&!window.__monitorAppRunning('credits')&&mon.classList.contains('show-caps'));",
  "  window.__markMonitorAppRunning('mail'); mon.classList.add('show-mail'); if(window.__monitorZoomIn)window.__monitorZoomIn(); window.__monitorSystemAction('sleep');",
  "  S('sleep_suspended',window.__monitorSleeping()&&mon.classList.contains('monitor-sleeping')&&mon.classList.contains('screen-on')&&!mon.classList.contains('show-saver'));",
  "  await sleep(2500);",
  "  S('sleep_unzoomed',!mon.classList.contains('dev-zoomed'));",
  "  S('sleep_kept_apps',window.__monitorAppRunning('mail')&&mon.classList.contains('show-mail'));",
  "  mon.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})); await sleep(30);",
  "  S('sleep_woke',!window.__monitorSleeping()&&!mon.classList.contains('monitor-sleeping')&&mon.classList.contains('show-mail'));",
  "  window.__closeTopMonitorApp(); await sleep(500);",
  "  window.__monitorSystemAction('lock'); await sleep(30);",
  "  S('lock_started',window.__monitorLocked()&&mon.classList.contains('monitor-locked')&&mon.classList.contains('show-saver')&&!mon.classList.contains('monitor-lock-awake'));",
  "  S('lock_saved',!!JSON.parse(localStorage.getItem('loftMonitorCapsLock')||'null'));",
  "  var reloadKey=new KeyboardEvent('keydown',{key:'r',ctrlKey:true,bubbles:true,cancelable:true}); window.dispatchEvent(reloadKey);",
  "  S('lock_kept_browser_keys',!reloadKey.defaultPrevented);",
  "  mon.dispatchEvent(new PointerEvent('pointermove',{bubbles:true})); await sleep(30);",
  "  S('lock_activity_challenge',window.__monitorLocked()&&!mon.classList.contains('show-saver')&&mon.classList.contains('monitor-lock-awake'));",
  "  window.__showMonitorLockSaver(); await sleep(20);",
  "  S('lock_idle_saver',window.__monitorLocked()&&mon.classList.contains('show-saver')&&!mon.classList.contains('monitor-lock-awake'));",
  "  window.__wakeMonitorLock();",
  "  var blocked=window.__openMonitorApp('mail'); S('lock_blocked_app',/CAPS LOCK/.test(String(blocked))&&!mon.classList.contains('show-mail'));",
  "  var pink=document.querySelector('[data-cap=\"pink\"]'),blue=document.querySelector('[data-cap=\"blue\"]'),marketa=document.querySelector('[data-person=\"marketa\"]'),behdad=document.querySelector('[data-person=\"behdad\"]');",
  "  var xs=[marketa,behdad,pink,blue].map(function(n){return +(n.getAttribute('transform').match(/translate\\(([^,]+)/)||[])[1];});",
  "  S('lock_centered',xs.reduce(function(a,b){return a+b;},0)/xs.length===316);",
  "  pink.dispatchEvent(new MouseEvent('click',{bubbles:true})); marketa.dispatchEvent(new MouseEvent('click',{bubbles:true})); await sleep(20);",
  "  S('wrong_no_penalty',window.__monitorLocked()&&!window.__monitorLockState().matched.pink&&!window.__monitorLockState().matched.blue);",
  "  pink.dispatchEvent(new MouseEvent('click',{bubbles:true})); behdad.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
  "  blue.dispatchEvent(new MouseEvent('click',{bubbles:true})); marketa.dispatchEvent(new MouseEvent('click',{bubbles:true})); await sleep(900);",
  "  S('matched_unlocked',!window.__monitorLocked()&&!mon.classList.contains('monitor-locked')&&mon.classList.contains('show-caps'));",
  "  S('unlock_cleared_save',localStorage.getItem('loftMonitorCapsLock')===null);",
  "  window.__monitorSystemAction('lock'); window.__wakeMonitorLock();",
  "  function caps(on){var e=new KeyboardEvent('keydown',{key:'CapsLock',bubbles:true,cancelable:true}); Object.defineProperty(e,'getModifierState',{value:function(){return on;}}); window.dispatchEvent(e);}",
  "  caps(true); caps(false); await sleep(900);",
  "  S('caps_cycle_unlocked',!window.__monitorLocked()&&mon.classList.contains('show-caps'));",
  "  window.__monitorSystemAction('lock'); var seed=window.__monitorLockState().seed; mon.classList.remove('monitor-locked');",
  "  S('resume_lock',window.__resumeMonitorLock()&&mon.classList.contains('monitor-locked')&&window.__monitorLockState().seed===seed);",
  "  window.__monitorSystemAction('shutdown'); await sleep(1700);",
  "  S('shutdown_off',!!tower&&!tower.classList.contains('on'));",
  "  S('shutdown_cleared_lock',!window.__monitorLocked()&&localStorage.getItem('loftMonitorCapsLock')===null);",
  "  S('shutdown_cleared_apps',!window.__monitorAppRunning('mail'));",
  "  document.getElementById('__report').textContent=JSON.stringify(report);",
  " } run();",
  "})();",
  "</script>"
].join("\n");

var r = lib.runPageSync("rsvp.html", HARNESS, 21000, { patchRaf: true });
var fail = 0;
function ok(name, cond) { console.log((cond ? "  ✓ " : "  ✗ ") + name); if (!cond) fail++; }
console.log("monitor system menu + CAPS LOCK:");
if (!r) { console.error("  ✗ no report captured"); process.exit(1); }
var s = r.steps;
ok("no uncaught JS errors", r.errors.length === 0);
ok("hidden runtime gutters cannot cover the system menu", s.hidden_gutters_pass_through === true);
ok("wordmark opens the system menu", s.menu_open === true);
ok("menu groups power actions before Help, About, System, and Credits", JSON.stringify(s.menu_actions) === JSON.stringify(["lock","sleep","reboot","shutdown","help","about","system","credits"]));
ok("compact menu leaves the motto for About", s.tagline_removed === true);
ok("system-menu labels use the enlarged type", s.menu_type >= 2.2);
ok("system-menu labels use Source Sans 3 while Loft OS keeps Fraunces",
  /Source Sans 3/.test(s.menu_family || "") && /Fraunces/.test(s.menu_title_family || ""));
ok("bottom instruction captions use Source Sans 3", /Source Sans 3/.test(s.caption_family || ""));
ok("About, Help, System, and Credits share the standard dismiss control", s.modal_closes_unified === true);
ok("enlarged system-menu type fits in English and Czech", s.menu_fit_en === true && s.menu_fit_cs === true);
ok("System reports live diagnostics, fits both languages, and ordinary close retains its task", s.system_open === true && s.system_fit_en === true && s.system_fit_cs === true && s.system_closed === true);
ok("System is searchable without receiving a desktop tile", s.system_search === true);
ok("System context-menu Kill prints escaping bugs, owns bilingual copy, and clears its task", s.system_context === true && s.system_killing === true && s.system_killed === true);
ok("shared context menus use Source Sans 3", /Source Sans 3/.test(s.context_family || ""));
ok("About is a searchable running app with an about:eternity portal Kill gag", s.about_open === true && s.about_killing === true && s.about_killed === true);
ok("About title, copy, and motto use the enlarged type", s.about_type && s.about_type.title >= 5 && s.about_type.copy >= 2.4 && s.about_type.motto >= 2.2);
ok("enlarged About copy fits in English and Czech", s.about_fit_en === true && s.about_fit_cs === true);
ok("Credits rolls people, software, and the closing line", s.credits_open === true);
ok("Credits title, names, and body use the enlarged type", s.credits_type && s.credits_type.title >= 4 && s.credits_type.name >= 2.75 && s.credits_type.body >= 1.7);
ok("Credits URLs use Source Sans 3", /Source Sans 3/.test(s.credits_link_family || ""));
ok("Credits Kill flares, preserves gratitude, and returns to desktop", s.credits_killing === true && s.credits_killed === true);
ok("Sleep suspends and unzooms only the live monitor, then a press wakes it", s.sleep_suspended === true && s.sleep_unzoomed === true && s.sleep_woke === true);
ok("Sleep preserves running apps", s.sleep_kept_apps === true);
ok("Lock starts and persists", s.lock_started === true && s.lock_saved === true);
ok("Lock leaves browser shortcuts alone", s.lock_kept_browser_keys === true);
ok("monitor activity reveals the lock challenge", s.lock_activity_challenge === true);
ok("lock inactivity returns to the saver", s.lock_idle_saver === true);
ok("app commands cannot bypass Lock", s.lock_blocked_app === true);
ok("lock portraits and caps are centered", s.lock_centered === true);
ok("a wrong cap has no penalty", s.wrong_no_penalty === true);
ok("matching both caps unlocks to the desktop", s.matched_unlocked === true && s.unlock_cleared_save === true);
ok("a Caps Lock on/off cycle unlocks", s.caps_cycle_unlocked === true);
ok("a persisted lock resumes with its layout", s.resume_lock === true);
ok("Shut down powers off and clears lock/apps", s.shutdown_off === true && s.shutdown_cleared_lock === true && s.shutdown_cleared_apps === true);
if (fail) {
  console.error("\n" + fail + " system-menu check(s) failed.");
  console.error(JSON.stringify(s, null, 2));
  process.exit(1);
}
console.log("\nAll monitor system-menu checks passed.");

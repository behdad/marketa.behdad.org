#!/usr/bin/env node
// Focused monitor Kill-discovery caption coverage: it is a Phase-2 monitor-focus
// base line, honors the primary input and language, and yields to stronger captions.
"use strict";
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  " function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  " function cap(){return document.getElementById('hunt-caption').textContent;}",
  " async function run(){",
  "  var report={errors:[],steps:{}};var m=document.getElementById('office-monitor');",
  "  if(window.__goToStage)window.__goToStage('office');await sleep(60);window.__currentStageName='office';m.classList.add('screen-on','show-caps');",
  "  if(window.__setSecondRound)window.__setSecondRound(false);if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(20);report.steps.phase1={caption:cap(),key:window.__captionKey&&window.__captionKey()};",
  "  if(window.__setSecondRound)window.__setSecondRound(true);await sleep(20);report.steps.desktop={caption:cap(),key:window.__captionKey&&window.__captionKey(),base:window.__captionState().base&&window.__captionState().base.owner};",
  "  if(window.__captionOverlay)window.__captionOverlay('party_rooms_complete',{owner:'kill-caption-test',scope:'stage:office',priority:80,duration:1000});await sleep(10);report.steps.priority={caption:cap(),overlay:window.__captionState().overlay&&window.__captionState().overlay.owner,base:window.__captionState().base&&window.__captionState().base.owner};window.__cancelCaption('kill-caption-test');await sleep(10);report.steps.restored={caption:cap(),key:window.__captionKey&&window.__captionKey()};",
  "  if(window.__setLang)window.__setLang('cs');await sleep(10);report.steps.czech={caption:cap(),key:window.__captionKey&&window.__captionKey()};",
  "  if(window.__monitorZoomOut)window.__monitorZoomOut();await sleep(10);report.steps.unzoomed={key:window.__captionKey&&window.__captionKey(),owner:window.__captionState().base&&window.__captionState().base.owner};",
  "  report.errors=window.__errs||[];document.getElementById('__report').textContent=JSON.stringify(report);",
  " }window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){document.getElementById('__report').textContent=JSON.stringify({errors:[String(e&&e.stack||e)],steps:{}});});},100);});",
  "})();",
  "</script>"
].join("\n");

function run(opts) { return lib.runPageSync("loft-day.html", HARNESS, 1800, opts); }
function check(name, ok, detail) { console.log("  " + (ok ? "✓" : "✗") + " " + name + (ok ? "" : "   [" + JSON.stringify(detail) + "]")); return ok ? 0 : 1; }
var desktop = run({ patchRaf: true }), touch = run({ patchRaf: true, forceCoarsePointer: true }), fails = 0;
console.log("monitor Kill-discovery caption:");
fails += check("Phase 1 never shows the monitor Kill guidance", desktop && desktop.steps.phase1 && desktop.steps.phase1.key !== "mon_kill_hint_desktop", desktop && desktop.steps.phase1);
fails += check("desktop Phase 2 monitor focus shows the right-click guidance", desktop && desktop.steps.desktop && desktop.steps.desktop.caption === "Right-click a running app to Kill it." && desktop.steps.desktop.base === "monitor-kill-discovery", desktop && desktop.steps.desktop);
fails += check("a stronger temporary caption owns the line and guidance restores afterwards", desktop && desktop.steps.priority && desktop.steps.priority.overlay === "kill-caption-test" && desktop.steps.priority.base === "monitor-kill-discovery" && desktop.steps.restored && desktop.steps.restored.key === "mon_kill_hint_desktop", desktop && { priority: desktop.steps.priority, restored: desktop.steps.restored });
fails += check("Czech monitor focus localizes the desktop guidance", desktop && desktop.steps.czech && desktop.steps.czech.caption === "Pravým kliknutím ukončíš spuštěnou aplikaci.", desktop && desktop.steps.czech);
fails += check("unzooming removes the monitor-owned base caption", desktop && desktop.steps.unzoomed && desktop.steps.unzoomed.owner !== "monitor-kill-discovery", desktop && desktop.steps.unzoomed);
fails += check("coarse primary input uses the press-and-hold guidance", touch && touch.steps.desktop && touch.steps.desktop.caption === "Press and hold a running app to Kill it." && touch.steps.czech && touch.steps.czech.caption === "Podržením ukončíš spuštěnou aplikaci.", touch && { desktop: touch.steps.desktop, czech: touch.steps.czech });
fails += check("no uncaught errors", desktop && touch && desktop.errors.length === 0 && touch.errors.length === 0, { desktop: desktop && desktop.errors, touch: touch && touch.errors });
console.log("\n" + (fails ? "FAILED " + fails + " check(s)" : "All Kill-discovery caption checks passed."));
process.exit(fails ? 1 : 0);

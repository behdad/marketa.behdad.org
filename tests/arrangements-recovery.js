#!/usr/bin/env node
// Settled player-arranged scene geometry round-trips without replaying its gestures.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var row={chair:{x:145},lounger:{notch:2},stools:{x:[110,210,400,540]},cooler:{x:321},blankets:{items:[{id:"cuddly-blanket",x:80,y:-20},{id:"cuddly-yellowblanket",x:-35,y:12},{id:"cuddly-lapblanket",x:48,y:18}],order:["cuddly-lapblanket","cuddly-blanket"]}};',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:true,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{arrangements:row}};',
  'if(!sessionStorage.getItem("arrangements-seeded")){sessionStorage.setItem("arrangements-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{},sounds:0};',
  'function n(id){return parseFloat(document.getElementById(id).style.translate)||0;}',
  'function raised(id,anchorId){var el=document.getElementById(id),a=document.getElementById(anchorId),s=Array.prototype.slice.call(el.parentNode.children);return el.parentNode===a.parentNode&&s.indexOf(el)>s.indexOf(a);}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' ["playChairWhirlSound","playCreakSound","playBoxlockClunkSound","playSwishSound","playGiggleSound"].forEach(function(k){window[k]=function(){report.sounds++;};});',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{',
  '  var cooler=document.getElementById("kitchen-bar-cooler"),chair=document.getElementById("office-chair"),back=document.getElementById("balcony-lounger-back");',
  '  report.steps.restored={chair:n("office-chair"),chairY:(chair.style.translate||"").split(/\\s+/)[1],lounger:back.style.transform,stools:["kitchen-bar-stool-1","kitchen-bar-stool-3","kitchen-bar-stool-2","kitchen-bar-stool-4"].map(n),patrons:["kitchen-bar-patron-a","kitchen-bar-patron-b"].map(n),cooler:n("kitchen-bar-cooler"),lids:[cooler.classList.contains("lid-l-up"),cooler.classList.contains("lid-r-up")],vapour:cooler.querySelectorAll(".cooler-vapour,.cooler-cap").length,blankets:["cuddly-blanket","cuddly-yellowblanket","cuddly-lapblanket"].map(function(id){var t=document.getElementById(id).style.translate.split(/\\s+/);return [parseFloat(t[0]),parseFloat(t[1])];}),raised:[raised("cuddly-blanket","cuddly-couple"),raised("cuddly-yellowblanket","cuddly-couple"),raised("cuddly-lapblanket","cuddly-behdad")],reactions:!!document.querySelector(".spinning,.dizzy,.tugged,.wiggling,.dragging")};',
  '  report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.arrangements;',
  '  window.__restoreCheckpointSystems({arrangements:{chair:{x:9999},lounger:{notch:99},stools:{x:[900,-20,NaN,900]},cooler:{x:-70,lids:8},blankets:{items:[{id:"cuddly-blanket",x:999,y:-999},{id:"not-a-blanket",x:10,y:10}],order:["not-a-blanket","cuddly-blanket","cuddly-blanket"]}}},"afterStage");',
  '  var badCooler=document.getElementById("kitchen-bar-cooler");report.steps.validated={chair:n("office-chair"),lounger:back.style.transform,stools:["kitchen-bar-stool-1","kitchen-bar-stool-3","kitchen-bar-stool-2","kitchen-bar-stool-4"].map(function(id){var base={"kitchen-bar-stool-1":135,"kitchen-bar-stool-3":235,"kitchen-bar-stool-2":356,"kitchen-bar-stool-4":462}[id];return base+n(id);}),cooler:n("kitchen-bar-cooler"),lids:badCooler.classList.contains("lid-up"),blanket:[n("cuddly-blanket"),parseFloat(document.getElementById("cuddly-blanket").style.translate.split(/\\s+/)[1])],unknown:!!document.getElementById("not-a-blanket")};',
  '  window.__resetCheckpointSystems();var resetCooler=document.getElementById("kitchen-bar-cooler"),resetSystems=window.__captureCheckpointSystems();report.steps.reset={chair:n("office-chair"),lounger:back.style.transform,stools:["kitchen-bar-stool-1","kitchen-bar-stool-3","kitchen-bar-stool-2","kitchen-bar-stool-4"].map(n),cooler:n("kitchen-bar-cooler"),lids:resetCooler.classList.contains("lid-up"),blankets:["cuddly-blanket","cuddly-yellowblanket","cuddly-lapblanket"].map(n),raised:[raised("cuddly-blanket","cuddly-couple"),raised("cuddly-yellowblanket","cuddly-couple"),raised("cuddly-lapblanket","cuddly-behdad")],arrangements:resetSystems.arrangements||null};',
  ' }catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},500);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html checkpoint arrangements:");
var r = lib.runPageSync("loft-day.html", HARNESS, 2400, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps, a = s.restored, v = s.validated, z = s.reset;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(a && a.chair === 145 && a.chairY === "-5px" && a.lounger === "rotate(-22deg)",
  "Continue restores the settled chair position and lounger notch", a);
check(a && a.stools.join(",") === "-25,-25,44,78" && a.patrons.join(",") === "-25,-25",
  "Continue restores ordered stool positions through their shared owner", a);
check(a && a.cooler === 321 && !a.lids.some(Boolean) && a.vapour === 0,
  "Continue restores the cooler position without reviving transient lid or vapour state", a);
check(a && JSON.stringify(a.blankets) === JSON.stringify([[80,-20],[-35,12],[48,18]]) &&
  JSON.stringify(a.raised) === JSON.stringify([true,false,true]),
  "Continue restores blanket offsets and only the saved raised paint order", a);
check(a && !a.reactions && r.sounds === 0,
  "restore does not replay drag, click, sound, or one-shot reaction paths", { restored: a, sounds: r.sounds });
check(s.persisted && s.persisted.chair.x === 145 && s.persisted.lounger.notch === 2 &&
  s.persisted.stools.x.join(",") === "110,210,400,540" && s.persisted.cooler.x === 321 &&
  s.persisted.blankets.order.join(",") === "cuddly-lapblanket,cuddly-blanket",
  "the post-Continue checkpoint recaptures the compact arrangements row", s.persisted);
check(v && v.chair === 300 && v.lounger === "rotate(-12deg)" && v.cooler === 0 && !v.lids &&
  v.stools[0] >= 96 && v.stools[3] <= 560 &&
  v.stools.every(function (x, i) { return i === 0 || x - v.stools[i - 1] >= 46; }) &&
  v.blanket[0] === 220 && v.blanket[1] === -50 && !v.unknown,
  "malformed rows are allow-listed, clamped, and kept in valid ordering", v);
check(z && z.chair === 0 && z.lounger === "rotate(-12deg)" && z.stools.every(function (x) { return x === 0; }) &&
  z.cooler === 0 && !z.lids && z.blankets.every(function (x) { return x === 0; }) &&
  z.raised.every(function (x) { return !x; }) && z.arrangements === null,
  "registry reset returns every arrangement owner to its authored default", z);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

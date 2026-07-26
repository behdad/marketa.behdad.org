#!/usr/bin/env node
// April 19 is Bicycle Day in both calendar surfaces. Selecting it arms one
// ten-second acid cadence for the room currently in view; leaving the date or
// resetting the loft tears down the owned timer/trip cleanly.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function day(host,n){return [].find.call(host.querySelectorAll(".calx-day:not(.calx-out)"),function(e){var x=e.querySelector(".calx-num");return x&&x.textContent.trim()===String(n);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return true;};',
  ' window.__jumpToDate(2027,3,19);',
  ' window.__openPhoneAppHere("calendar");await sleep(40);',
  ' var ph=document.querySelector(".calx-phone"),d19=day(ph,19);',
  ' S("english",{label:d19&&d19.getAttribute("aria-label"),icon:d19&&d19.querySelector(".calx-mk")&&d19.querySelector(".calx-mk").textContent,status:window.__bicycleDayStatus()});',
  ' setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d19=day(ph,19);',
  ' S("czech",{label:d19&&d19.getAttribute("aria-label"),icon:d19&&d19.querySelector(".calx-mk")&&d19.querySelector(".calx-mk").textContent});',
  ' setLang("en");if(window.__closePhoneModal)window.__closePhoneModal(true);',
  ' window.goToStage("office");var roomBefore=window.currentStageName;',
  ' var started=window.__bicycleDayTick(),trip=window.__tripState&&window.__tripState();',
  ' S("tick",{started:started,roomBefore:roomBefore,roomAfter:window.currentStageName,trip:trip,status:window.__bicycleDayStatus()});',
  ' window.__jumpToDate(2027,3,20);',
  ' S("leave",{trip:window.__tripState&&window.__tripState(),status:window.__bicycleDayStatus(),tick:window.__bicycleDayTick()});',
  ' window.__jumpToDate(2027,3,19);var resetCalls=0,baseReset=window.__resetBicycleDay;',
  ' window.__resetBicycleDay=function(){resetCalls++;return baseReset();};window.__activateExtinguisher();await sleep(850);',
  ' S("reset",{calls:resetCalls,status:window.__bicycleDayStatus(),trip:window.__tripState&&window.__tripState()});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Bicycle Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && /Bicycle Day.*acid/i.test(s.english.label || "") && /🚲/.test(s.english.icon || "") &&
  s.english.status.active && s.english.status.pending,
  "April 19 is labelled and arms its cadence in the English calendar", s.english);
check(s.czech && /Den na kole.*LSD/i.test(s.czech.label || "") && /🚲/.test(s.czech.icon || ""),
  "the April 19 label is localized in the Czech calendar", s.czech);
check(s.tick && s.tick.started && s.tick.roomBefore === "office" && s.tick.roomAfter === "office" &&
  s.tick.trip && s.tick.trip.active && s.tick.trip.variant === "acid" && s.tick.status.pending,
  "a cadence tick starts acid in whichever room is currently shown and schedules the next pass", s.tick);
check(s.leave && s.leave.trip && !s.leave.trip.active && !s.leave.status.active &&
  !s.leave.status.pending && !s.leave.tick,
  "leaving April 19 stops its owned trip and pending cadence", s.leave);
check(s.reset && s.reset.calls === 1 && s.reset.status.active && s.reset.status.pending &&
  s.reset.trip && !s.reset.trip.active,
  "a loft reset replaces the old April 19 cadence without preserving its trip", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

#!/usr/bin/env node
// April 19 is Bicycle Day in both calendar surfaces. Selecting it arms one
// one-minute acid cadence for the room currently in view; leaving the date or
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
  ' S("english",{icon:d19&&d19.querySelector(".calx-mk")&&d19.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent,status:window.__bicycleDayStatus()});',
  ' window.__setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d19=day(ph,19);',
  ' S("czech",{icon:d19&&d19.querySelector(".calx-mk")&&d19.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' window.__setLang("en");ph=document.querySelector(".calx-phone");d19=day(ph,19);d19.click();await sleep(60);var trip=window.__tripState&&window.__tripState();',
  ' S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.__currentStageName,trip:trip,card:document.getElementById("mol-card-acid").classList.contains("mol-show"),status:window.__bicycleDayStatus()});',
  ' window.__jumpToDate(2027,3,20);',
  ' S("leave",{trip:window.__tripState&&window.__tripState(),status:window.__bicycleDayStatus(),tick:window.__bicycleDayTick()});',
  ' window.__jumpToDate(2027,3,19);window.__stopTrip(false);var repeated=window.__bicycleDayTick();',
  ' S("repeat",{started:repeated,card:document.getElementById("mol-card-acid").classList.contains("mol-show"),trip:window.__tripState&&window.__tripState()});',
  ' window.__jumpToDate(2027,3,20);',
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
check(s.english && /🚲/.test(s.english.icon || "") &&
  s.english.banner === "Bicycle Day (LSD)" &&
  s.english.status.active && s.english.status.pending,
  "April 19 shows its English occasion banner and arms its cadence", s.english);
check(s.czech && s.czech.banner === "Den na kole (LSD)" && /🚲/.test(s.czech.icon || ""),
  "the visible April 19 occasion is localized in Czech", s.czech);
check(s.activate && !s.activate.phone && s.activate.room === "garden" &&
  s.activate.trip && s.activate.trip.active && s.activate.trip.variant === "acid" &&
  s.activate.card && s.activate.status.pending,
  "activating April 19 closes Calendar, pans to the party room, and starts acid with its chemistry card", s.activate);
check(s.leave && s.leave.trip && !s.leave.trip.active && !s.leave.status.active &&
  !s.leave.status.pending && !s.leave.tick,
  "leaving April 19 stops its owned trip and pending cadence", s.leave);
check(s.repeat && s.repeat.started && s.repeat.card &&
  s.repeat.trip && s.repeat.trip.active && s.repeat.trip.variant === "acid",
  "every April 19 cadence pass immediately shows the acid chemistry card", s.repeat);
check(s.reset && s.reset.calls === 1 && s.reset.status.active && s.reset.status.pending &&
  s.reset.trip && !s.reset.trip.active,
  "a loft reset replaces the old April 19 cadence without preserving its trip", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

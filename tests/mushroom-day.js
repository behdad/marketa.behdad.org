#!/usr/bin/env node
// September 20 immediately starts shrooms in the viewed room, then maintains
// one gated one-minute cadence until the date changes or the loft resets.
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
  ' window.__jumpToDate(2027,8,20);window.__goToStage("office");window.__openPhoneAppHere("calendar");await sleep(40);',
  ' var ph=document.querySelector(".calx-phone"),d20=day(ph,20);',
  ' S("english",{icon:d20&&d20.querySelector(".calx-mk")&&d20.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' window.__setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d20=day(ph,20);S("czech",{banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' window.__setLang("en");ph=document.querySelector(".calx-phone");d20=day(ph,20);d20.click();await sleep(60);',
  ' S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.__currentStageName,trip:window.__tripState&&window.__tripState(),card:document.getElementById("mol-card-shrooms").classList.contains("mol-show"),status:window.__mushroomDayStatus()});',
  ' window.__jumpToDate(2027,8,21);S("leave",{trip:window.__tripState&&window.__tripState(),status:window.__mushroomDayStatus(),tick:window.__mushroomDayTick()});',
  ' window.__jumpToDate(2027,8,20);window.__stopTrip(false);window.__goToStage("balcony");var repeated=window.__mushroomDayTick();',
  ' S("repeat",{started:repeated,room:window.__currentStageName,trip:window.__tripState&&window.__tripState(),card:document.getElementById("mol-card-shrooms").classList.contains("mol-show"),status:window.__mushroomDayStatus()});',
  ' var resetCalls=0,baseReset=window.__resetMushroomDay;window.__resetMushroomDay=function(){resetCalls++;return baseReset();};window.__activateExtinguisher();await sleep(850);',
  ' S("reset",{calls:resetCalls,trip:window.__tripState&&window.__tripState(),status:window.__mushroomDayStatus()});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Mushroom Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3400, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && s.english.banner === "International Mushroom Day" && /🍄/.test(s.english.icon || ""),
  "September 20 uses its canonical English occasion banner", s.english);
check(s.czech && /Mezinárodní den hub/.test(s.czech.banner || ""),
  "September 20 has a natural visible Czech name", s.czech);
check(s.activate && !s.activate.phone && s.activate.room === "office" &&
  s.activate.trip && s.activate.trip.active && s.activate.trip.variant === "shrooms" &&
  s.activate.card && s.activate.status.pending,
  "activation closes Calendar and immediately starts shrooms with its chemistry card", s.activate);
check(s.leave && s.leave.trip && !s.leave.trip.active && !s.leave.status.active &&
  !s.leave.status.pending && !s.leave.tick,
  "leaving September 20 stops its owned trip and cadence", s.leave);
check(s.repeat && s.repeat.started && s.repeat.room === "balcony" &&
  s.repeat.trip && s.repeat.trip.active && s.repeat.trip.variant === "shrooms" &&
  s.repeat.card && s.repeat.status.pending,
  "the repeat cadence follows the current room and immediately shows the shrooms chemistry card", s.repeat);
check(s.reset && s.reset.calls === 1 && s.reset.trip && !s.reset.trip.active &&
  s.reset.status.active && s.reset.status.pending,
  "reset clears the current shroom trip and replaces the September 20 cadence", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

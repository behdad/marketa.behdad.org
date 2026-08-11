#!/usr/bin/env node
// April 20 activates the Cuddly 420 scene, then keeps one gated ten-second
// smoking cadence that is cancelled on a date change or loft reset.
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
  ' window.__jumpToDate(2027,3,20);window.loft.garden.set(true);window.__openPhoneAppHere("calendar");await sleep(40);',
  ' var ph=document.querySelector(".calx-phone"),d20=day(ph,20);',
  ' S("english",{icon:d20&&d20.querySelector(".calx-mk")&&d20.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' window.__setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d20=day(ph,20);S("czech",{banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' window.__setLang("en");ph=document.querySelector(".calx-phone");d20=day(ph,20);d20.click();await sleep(60);',
  ' var behdad=document.getElementById("cuddly-behdad");S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.__currentStageName,party:window.__loftControllers.party.status(),smoking:behdad.classList.contains("smoking-joint"),status:window.__marijuanaDayStatus()});',
  ' window.__jumpToDate(2027,3,21);S("leave",{smoking:behdad.classList.contains("smoking-joint"),status:window.__marijuanaDayStatus(),tick:window.__marijuanaDayTick()});',
  ' window.__jumpToDate(2027,3,20);window.__goToStage("office");var away=window.__marijuanaDayTick();window.__goToStage("cuddly");var home=window.__marijuanaDayTick();',
  ' S("roomGate",{away:away,home:home,smoking:behdad.classList.contains("smoking-joint"),status:window.__marijuanaDayStatus()});',
  ' var resetCalls=0,baseReset=window.__resetMarijuanaDay;window.__resetMarijuanaDay=function(){resetCalls++;return baseReset();};window.__activateExtinguisher();await sleep(850);',
  ' S("reset",{calls:resetCalls,smoking:behdad.classList.contains("smoking-joint"),status:window.__marijuanaDayStatus()});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Marijuana Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3400, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && s.english.banner === "420 (Marijuana)" && /🌿/.test(s.english.icon || ""),
  "April 20 uses its canonical English occasion banner", s.english);
check(s.czech && s.czech.banner === "420 (marihuana)",
  "April 20 has a concise visible Czech name", s.czech);
check(s.activate && !s.activate.phone && s.activate.room === "cuddly" && !s.activate.party &&
  s.activate.smoking && s.activate.status.active && s.activate.status.pending,
  "activation closes Calendar, ends the party, pans Cuddly and starts Behdad smoking", s.activate);
check(s.leave && !s.leave.smoking && !s.leave.status.active && !s.leave.status.pending && !s.leave.tick,
  "leaving April 20 cancels its owned joint and cadence", s.leave);
check(s.roomGate && !s.roomGate.away && s.roomGate.home && s.roomGate.smoking && s.roomGate.status.pending,
  "repeat tokes only start while the player is in Cuddly", s.roomGate);
check(s.reset && s.reset.calls === 1 && !s.reset.smoking && s.reset.status.active && s.reset.status.pending,
  "reset cancels the current joint and replaces the April 20 cadence", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

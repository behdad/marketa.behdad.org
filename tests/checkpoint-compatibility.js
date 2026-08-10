#!/usr/bin/env node
// Compatibility recovery: payloads from before the systems registry, and portable
// puzzle/progress handoffs, retain their legacy puzzle state while the next save
// migrates them to adapter-owned rows. Canonical owners still settle shared state.
"use strict";

var lib = require("./lib");

var LEGACY_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{kitchen:{powered:true,warmed:true,ground:true,tamped:true,spent:false,rounds:2,portafilterDone:true,shotFilled:true},office:{prague:true,pc:true,lamp:true,pendant:true,glass:false}},phone:null,album:null};',
  'if(!sessionStorage.getItem("checkpoint-compat-legacy")){sessionStorage.setItem("checkpoint-compat-legacy","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.balcony.bbq.set(true);var smoker=document.getElementById("balcony-smoker"),before=smoker.classList.contains("smoking");',
  ' document.querySelector("#loft-recovery-gate .loft-recovery-btn.primary").click();',
  ' var persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1"));',
  ' document.getElementById("__report").textContent=JSON.stringify({before:before,room:window.currentStageName,coffee:window.__captureKitchenCoffeeState(),smoking:smoker.classList.contains("smoking"),open:smoker.classList.contains("open"),lamp:document.getElementById("office-lamp").classList.contains("dimmed"),pendant:document.getElementById("office-pendant").classList.contains("dimmed"),scrim:document.getElementById("office-lamp-dim").style.opacity,migrated:persisted.systems&&persisted.systems.coffee,errors:window.__errs});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs});}},150);});',
  '})();</script>'
].join("\n");

var PORTABLE_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function handoff(party){return {kind:"loft-session",version:1,progress:{room:"office",maxUnlocked:4,phase2:true,party:party,daylight:true,bbq:false},puzzle:{kitchen:{powered:true,warmed:true,ground:true,tamped:false,spent:false,rounds:3,portafilterDone:false,shotFilled:false},office:{prague:true,pc:true,lamp:true,pendant:true,glass:false}}};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__setKitchenCoffeeState({step:"off",rounds:0});window.balcony.bbq.set(true);',
  ' var imported=window.loftSessionImport(handoff(false)),smoker=document.getElementById("balcony-smoker");',
  ' var settled={coffee:window.__captureKitchenCoffeeState(),smoking:smoker.classList.contains("smoking"),open:smoker.classList.contains("open"),lamp:document.getElementById("office-lamp").classList.contains("dimmed"),pendant:document.getElementById("office-pendant").classList.contains("dimmed"),scrim:document.getElementById("office-lamp-dim").style.opacity,migrated:JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.coffee};',
  ' var partyImported=window.loftSessionImport(handoff(true));',
  ' document.getElementById("__report").textContent=JSON.stringify({imported:imported,settled:settled,partyImported:partyImported,party:!!window.__gardenPartyOn,partyLamp:document.getElementById("office-lamp").classList.contains("dimmed"),partyPendant:document.getElementById("office-pendant").classList.contains("dimmed"),partyScrim:document.getElementById("office-lamp-dim").style.opacity,errors:window.__errs});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs});}},150);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else {
    failures++;
    console.log("  ✗ " + msg + (detail ? " [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html checkpoint compatibility:");
var legacy = lib.runPageSync("loft-day.html", LEGACY_HARNESS, 1500, { patchRaf: true });
var portable = lib.runPageSync("loft-day.html", PORTABLE_HARNESS, 1300, { patchRaf: true });

check(legacy && legacy.errors.length === 0, "legacy recovery has no uncaught page errors", legacy && legacy.errors);
check(legacy && legacy.before && legacy.room === "office" &&
  legacy.coffee.step === "brewed" && legacy.coffee.rounds === 2,
  "an absent systems map leaves legacy puzzle coffee authoritative", legacy);
check(legacy && !legacy.smoking && !legacy.open,
  "restoring legacy bbq:false deterministically stops and closes an existing BBQ", legacy);
check(legacy && legacy.lamp && legacy.pendant && legacy.scrim === "0.6",
  "legacy office lamps and their room scrim settle together", legacy);
check(legacy && legacy.migrated && legacy.migrated.step === "brewed" && legacy.migrated.rounds === 2,
  "the post-Continue save migrates legacy coffee into its adapter row", legacy && legacy.migrated);

check(portable && portable.errors.length === 0, "portable import has no uncaught page errors", portable && portable.errors);
check(portable && portable.imported && portable.settled.coffee.step === "ground" &&
  portable.settled.coffee.rounds === 3,
  "portable import retains its compatibility coffee fields", portable && portable.settled);
check(portable && !portable.settled.smoking && !portable.settled.open,
  "portable bbq:false also shuts down an existing BBQ", portable && portable.settled);
check(portable && portable.settled.lamp && portable.settled.pendant && portable.settled.scrim === "0.6",
  "portable lamp restore settles the matching room scrim", portable && portable.settled);
check(portable && portable.settled.migrated && portable.settled.migrated.step === "ground" &&
  portable.settled.migrated.rounds === 3,
  "portable import is migrated on its immediate checkpoint save", portable && portable.settled.migrated);
check(portable && portable.partyImported && portable.party &&
  !portable.partyLamp && !portable.partyPendant && portable.partyScrim === "0",
  "an active party intentionally overrides restored office darkness through the same owner", portable);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

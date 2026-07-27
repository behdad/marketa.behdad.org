#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-1000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},systems:{environment:{weather:{rain:true,storm:true,overcast:false},aurora:{mode:"on",kp:7},smoke:true,outdoorC:-25,units:{indoor:"F",outdoor:"F"}}}};',
  'if(!sessionStorage.getItem("checkpoint-environment-seeded")){sessionStorage.setItem("checkpoint-environment-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  'var restored={room:window.currentStageName,weather:window.__weatherCheckpointState(),aurora:window.__auroraCheckpointState(),season:window.__seasonPreviewName(),temp:window.__outdoorTempOverride(),units:window.__tempDisplayUnits(),particles:{rain:document.querySelectorAll(".balc-drop").length,meteors:document.querySelectorAll(".sky-meteor").length}};',
  'window.__saveLoftCheckpoint();var recaptured=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.environment;',
  'window.__restoreCheckpointSystems({environment:{weather:{rain:"yes"},aurora:{mode:"on",kp:12},smoke:"yes",outdoorC:200,units:{indoor:"K",outdoor:"F"}}},"beforeStage");',
  'window.__restoreCheckpointSystems({environment:{weather:{rain:"yes"},aurora:{mode:"on",kp:12},smoke:"yes",outdoorC:200,units:{indoor:"K",outdoor:"F"}}},"afterStage");',
  'var malformed={weather:window.__weatherCheckpointState(),aurora:window.__auroraCheckpointState(),season:window.__seasonPreviewName(),temp:window.__outdoorTempOverride(),units:window.__tempDisplayUnits()};',
  'window.__wxOvercast=true;window.__applyBalconyWeather();var derived=window.__captureCheckpointSystems().environment||null;',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,restored:restored,recaptured:recaptured,malformed:malformed,derived:derived});',
  '}catch(e){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs.concat([String(e&&e.stack||e)])});}},450);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html environment checkpoint:");
var result = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true, urlSuffix: "#play" });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}

check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.restored && result.restored.room === "office" &&
  result.restored.weather && result.restored.weather.rain && result.restored.weather.storm &&
  result.restored.weather.overcast === false,
  "Continue restores authored weather layers after the saved room", result.restored);
check(result.restored && result.restored.aurora && result.restored.aurora.mode === "on" &&
  result.restored.aurora.kp === 7 && result.restored.season === "smoky",
  "Continue restores deliberate sky and smoke overrides", result.restored);
check(result.restored && result.restored.temp === -25 &&
  result.restored.units.indoor === "F" && result.restored.units.outdoor === "F",
  "Continue restores the pinned temperature and display units", result.restored);
check(result.recaptured && result.recaptured.weather && result.recaptured.aurora &&
  result.recaptured.smoke === true && result.recaptured.outdoorC === -25 &&
  result.recaptured.units.indoor === "F" && result.recaptured.units.outdoor === "F" &&
  !Object.prototype.hasOwnProperty.call(result.recaptured, "particles") &&
  !Object.prototype.hasOwnProperty.call(result.recaptured, "audio") &&
  !Object.prototype.hasOwnProperty.call(result.recaptured, "timers"),
  "recapture contains stable selections, not runtime effects", result.recaptured);
check(result.malformed && result.malformed.weather === null && result.malformed.aurora === null &&
  result.malformed.season === null && result.malformed.temp === null &&
  result.malformed.units.indoor === "C" && result.malformed.units.outdoor === "C",
  "malformed rows fall back to fresh environment defaults", result.malformed);
check(result.derived === null,
  "live-derived weather without a player selection is not checkpointed", result.derived);

console.log("");
if (failures) {
  console.log(failures + " environment checkpoint assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Environment checkpoint assertions passed.");

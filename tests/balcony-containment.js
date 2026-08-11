#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(id){var el=document.getElementById(id);if(el)el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var focused=true;Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});',
  'function allowed(room){return window.__roomAutonomyAllowed(room);}',
  'async function probe(stage,open,close){window.__goToStage(stage);var opened=window[open]&&window[open]();await sleep(30);var row={opened:opened,covered:window.__roomAmbienceCovered(),allowed:allowed(stage)};if(window[close])window[close]();await sleep(850);row.restored=allowed(stage);return row;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'window.__unlockAllRooms();window.__markLowerRoomDiscovered();window.__setDayNight(false);window.__goToStage("balcony");await sleep(50);',
  'report.steps.upstairs={covered:window.__roomAmbienceCovered(),allowed:allowed("balcony")};',
  'var refresh={},originals={};["__updateCityHum","__updateWind","__updateRainSound"].forEach(function(name){originals[name]=window[name];window[name]=function(){refresh[name]=(refresh[name]||0)+1;return originals[name].apply(this,arguments);};});',
  'window.__openEntranceRoom();await sleep(30);var before=window.__entranceRoomState().intercomResponses;click("entrance-intercom");await sleep(780);',
  'report.steps.entrance={covered:window.__roomAmbienceCovered(),allowed:allowed("balcony"),refresh:refresh,localBefore:before,localAfter:window.__entranceRoomState().intercomResponses};',
  'window.__closeEntranceRoom();window.__clearBalconyEclipse();var host=document.getElementById("balcony-heartfx");while(host.firstChild)host.firstChild.remove();',
  'window.__runSolarEclipse();var beganUpstairs=document.getElementById("stage-balcony").classList.contains("solar-eclipse");window.__openEntranceRoom();',
  'var event=new Event("animationend",{bubbles:true});Object.defineProperty(event,"animationName",{value:"solar-transit-in"});document.getElementById("balcony-solar-moon").dispatchEvent(event);',
  'report.steps.totality={beganUpstairs:beganUpstairs,allowed:allowed("balcony"),effects:host.childElementCount};',
  'window.__clearBalconyEclipse();var explicitResult=window.__loftControllers.eclipse();report.steps.explicit={result:explicitResult,entrance:window.__entranceRoomOpen,solar:document.getElementById("stage-balcony").classList.contains("solar-eclipse")};window.__clearBalconyEclipse();',
  'report.steps.lower={bathroom:await probe("kitchen","__openBathroomRoom","__closeBathroomRoom"),prince:await probe("garden","__openGardenPrince","__closeMonitorPrince"),cinema:await probe("cuddly","__openCinemaRoom","__closeCinemaRoom"),bedroom:await probe("office","__openBedroomRoom","__closeBedroomRoom"),entrance:await probe("balcony","__openEntranceRoom","__closeEntranceRoom")};',
  'window.__goToStage("balcony");focused=false;report.steps.unfocused=allowed("balcony");focused=true;report.steps.refocused=allowed("balcony");var hidden=false;Object.defineProperty(document,"hidden",{configurable:true,get:function(){return hidden;}});Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return hidden?"hidden":"visible";}});hidden=true;report.steps.hidden=allowed("balcony");hidden=false;',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html Balcony autonomy containment:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10000, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.upstairs && !s.upstairs.covered && s.upstairs.allowed,
  "an attended uncovered Balcony permits autonomous ambience", s.upstairs);
check(s.entrance && s.entrance.covered && !s.entrance.allowed &&
  s.entrance.refresh.__updateCityHum > 0 && s.entrance.refresh.__updateWind > 0 &&
  s.entrance.refresh.__updateRainSound > 0,
  "opening Entrance synchronously rechecks all three Balcony-derived beds", s.entrance);
check(s.entrance && s.entrance.localAfter === s.entrance.localBefore + 1,
  "the active lower room keeps its user-initiated prop reaction", s.entrance);
check(s.totality && s.totality.beganUpstairs && !s.totality.allowed && s.totality.effects === 0,
  "an eclipse already in flight cannot begin its totality visual or chime below", s.totality);
check(s.explicit && !s.explicit.entrance && s.explicit.solar && /moon slides/.test(s.explicit.result),
  "the explicit console eclipse closes the lower room and starts immediately", s.explicit);

var lower = s.lower || {};
Object.keys(lower).forEach(function (name) {
  var row = lower[name];
  check(row && row.opened !== false && row.covered && !row.allowed && row.restored,
    name + " blocks parent-room autonomy only while it owns the viewport", row);
});
check(s.unfocused === false && s.refocused === true && s.hidden === false,
  "hidden or visible-but-unfocused Balcony autonomy stays gated",
  { unfocused: s.unfocused, refocused: s.refocused, hidden: s.hidden });

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/function cityHumWant\(\) \{[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?__roomAutonomyAllowed\("cuddly"\)/.test(source) &&
  /function windWant\(\) \{[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?__roomAutonomyAllowed\("cuddly"\)/.test(source) &&
  /function rainSoundWant\(\) \{[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?__roomAutonomyAllowed\("cuddly"\)/.test(source),
  "city, wind, and rain beds share the same room-autonomy gate");
check(/scheduleDoorCreak\(\)[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?playCreakSound/.test(source) &&
  /__roomAutonomyAllowed\("balcony"\)\) playFinishMelody/.test(source) &&
  /function autoSky\(\)[\s\S]*?__roomAutonomyAllowed\("balcony"\)/.test(source),
  "the delayed door, arrival, and party-sky one-shots use the containment gate");
check(/setInterval\(function \(\) \{[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?phoneNotify\(\);[\s\S]*?\}, 19000\)/.test(source),
  "the unopened-phone nudge cannot leak through a foreground lower room");

console.log("");
if (failures) {
  console.log(failures + " Balcony containment assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Balcony containment assertions passed.");

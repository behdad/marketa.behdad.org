#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  'var song=document.getElementById("guitar-song-audio");window.__setSongLevel(song,.4);report.steps.upstairs={acoustics:window.__lowerFloorAcousticsState(),volume:song.volume};',
  'window.__openBathroomRoom();await sleep(30);window.__setSongLevel(song,.4);report.steps.bathroom={acoustics:window.__lowerFloorAcousticsState(),volume:song.volume};window.__closeBathroomRoom();',
  'window.__goToStage("garden");window.__openGardenPrince();await sleep(30);report.steps.dungeon=window.__lowerFloorAcousticsState();window.__closeMonitorPrince();await sleep(760);',
  'window.__goToStage("cuddly");window.__openCinemaRoom();await sleep(30);report.steps.cinema=window.__lowerFloorAcousticsState();window.__closeCinemaRoom();',
  'window.__goToStage("office");window.__openBedroomRoom();await sleep(30);report.steps.bedroom=window.__lowerFloorAcousticsState();window.__closeBedroomRoom();',
  'window.__goToStage("balcony");window.__playSongAt(1);await sleep(100);window.__openEntranceRoom();await sleep(40);window.__setSongLevel(song,.4);report.steps.entrance={acoustics:window.__lowerFloorAcousticsState(),volume:song.volume,grooving:document.getElementById("entrance-room-art").classList.contains("grooving")};',
  'window.__navigateLowerRoom("office");await sleep(40);report.steps.lateral={acoustics:window.__lowerFloorAcousticsState(),entranceGrooving:document.getElementById("entrance-room-art").classList.contains("grooving")};await sleep(760);',
  'window.__closeBedroomRoom();await sleep(40);window.__setSongLevel(song,.4);report.steps.restored={acoustics:window.__lowerFloorAcousticsState(),volume:song.volume,logical:window.__songLevel(song),captured:!!song._eqGain};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},260);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html lower-floor acoustics:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7600, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.upstairs && s.upstairs.acoustics.room === "upstairs" &&
  s.upstairs.acoustics.gain === 1 && s.upstairs.acoustics.cutoff === 20000,
  "the main floor keeps the continuous loft bus at unity and full bandwidth", s.upstairs);
check(s.dungeon && s.dungeon.room === "dungeon" && s.dungeon.gain === 0.48 &&
  s.dungeon.cutoff === 2400 && s.dungeon.reverb === 1.9,
  "Dungeon adds its long stone-tail reverb to the quieter, muffled profile", s.dungeon);
check(s.cinema && s.cinema.room === "cinema" && s.cinema.gain === 0.48 &&
  s.cinema.cutoff === 2400 && s.cinema.reverb === 0,
  "Cinema keeps the dry quieter, muffled lower-floor profile", s.cinema);
check(s.bedroom && s.bedroom.room === "bedroom" &&
  s.bedroom.gain === 0.40 && s.bedroom.cutoff === 2400,
  "Bedroom retains the moderate filter with a modestly quieter gain", s.bedroom);
check(s.bathroom && s.bathroom.acoustics.room === "bathroom" &&
  s.bathroom.acoustics.gain === 0.30 && s.bathroom.acoustics.cutoff === 1450 &&
  Math.abs(s.bathroom.volume - .12) < .01,
  "Bathroom gets the strongly enclosed treatment and matching native fallback attenuation", s.bathroom);
check(s.entrance && s.entrance.acoustics.room === "entrance" &&
  s.entrance.acoustics.gain === 0.25 && s.entrance.acoustics.cutoff === 1200 &&
  Math.abs(s.entrance.volume - .1) < .01,
  "the outside Entrance is quieter and more muffled than the other lower rooms", s.entrance);
check(s.entrance && s.entrance.grooving,
  "visible Entrance glass picks up the existing music groove", s.entrance);
check(s.lateral && s.lateral.acoustics.room === "bedroom" &&
  s.lateral.acoustics.gain === 0.40 && !s.lateral.entranceGrooving,
  "a lateral lower-room pan retargets acoustics without leaving the Entrance groove behind", s.lateral);
check(s.restored && s.restored.acoustics.room === "upstairs" &&
  s.restored.acoustics.gain === 1 && Math.abs(s.restored.logical - .4) < .01 &&
  (s.restored.captured || Math.abs(s.restored.volume - .4) < .01),
  "returning upstairs restores the exact unfiltered level", s.restored);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/out\.connect\(lowerFloorAudioOutput\(ac\)\)/.test(source) &&
  /eqAnalyser\.connect\(lowerFloorAudioOutput\(eqAudioCtx\)\)/.test(source),
  "continuous synth beds and captured songs share one lower-floor boundary stage");
check(/__lowerFloorFilter\.connect\(__lowerFloorReverb\)/.test(source) &&
  /__lowerFloorReverb\.connect\(__lowerFloorReverbWet\)/.test(source),
  "the dungeon reverb is a wet branch on the existing shared boundary");
check((source.match(/new Ctx\(\)/g) || []).length === 1,
  "lower-floor modeling creates no additional AudioContext");
check(/function want\(\) \{[\s\S]*?__roomAutonomyAllowed\("balcony"\)[\s\S]*?__roomAutonomyAllowed\("cuddly"\)/.test(source),
  "the Balcony's autonomous wind chime uses the shared lower-room containment gate");

console.log("");
if (failures) {
  console.log(failures + " lower-audio assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-floor audio assertions passed.");

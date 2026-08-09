#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var failed = false;

function check(ok, label) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) failed = true;
}
function functionBody(name) {
  var start = source.indexOf("function " + name + "(");
  if (start < 0) return "";
  var open = source.indexOf("{", start), depth = 0;
  for (var i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  return "";
}

var melody = functionBody("playCampFinMelody");
var allowed = functionBody("campFinLoveVoiceAllowed");
var schedule = functionBody("scheduleCampFinLoveVoices");
var coda = functionBody("playCampBearCodaSound");

check(/getSfxCtx\(\)/.test(melody) && !/new\s+(?:AudioContext|webkitAudioContext)/.test(melody),
  "the fin motif stays on the shared SFX context");
check(/entrance-roadtrip-camp-marketa/.test(melody) &&
  /entrance-roadtrip-camp-behdad/.test(melody) &&
  /440[\s\S]*196[\s\S]*587\.33[\s\S]*146\.83[\s\S]*493\.88[\s\S]*185/.test(melody),
  "two spatially distinct voices trade the original fin phrase");
check(/146\.83[\s\S]*220[\s\S]*440[\s\S]*659\.25/.test(melody),
  "the two motif voices resolve together on the final glow");
check((schedule.match(/playILoveYouSound/g) || []).length === 2 &&
  /camp-marketa",\s*1\.08/.test(schedule) && /camp-behdad",\s*\.82/.test(schedule),
  "the completed motif hands off to two contrasting synthesized love lines");
check(/document\.hidden[\s\S]*document\.hasFocus[\s\S]*loft-recovery-gate[\s\S]*__foregroundAmbienceCovered[\s\S]*camp-sleep-congrats[\s\S]*trip\.active[\s\S]*trip\.route\s*===\s*"camp"/.test(allowed) &&
  !/window\.__roomAmbienceCovered\s*\(/.test(allowed) &&
  (schedule.match(/campFinLoveVoiceAllowed\(\)/g) || []).length === 2,
  "both delayed voices re-check attention and terminal Camping ownership");
check(/kind\s*===\s*"finale"[\s\S]*playCampFinMelody\(\)[\s\S]*scheduleCampFinLoveVoices\(\)/.test(coda) &&
  !/playFinishMelody/.test(coda),
  "the campsite finale owns its new cue instead of reusing the Balcony melody");

var runtime = lib.runPageSync("loft-day.html", String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    var report = { errors: {} };
    try {
      window.__unlockAllRooms();
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__setSecondRound(true, { releaseHeld: false });
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__entranceRoadtripDevStart();
      if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
      var trip = window.__entranceRoomState().drive.roadtrip;
      window.__entranceRoadtripSetRouteDistance("abraham",
        trip.abrahamDistanceRequired - trip.routePaceKmh / 3.6);
      window.__entranceRoadtripSetLane(1);
      window.__entranceDriveSetMotion(0, 0);
      window.__entranceDriveStep(100);
      var camp = document.getElementById("entrance-roadtrip-camp");
      camp.classList.add("camp-sleep-congrats");
      report.trip = window.__entranceRoomState().drive.roadtrip;
      report.roomCovered = window.__roomAmbienceCovered();
      report.foregroundCovered = window.__foregroundAmbienceCovered();
      report.allowed = window.campFinLoveVoiceAllowed();
      report.voices = [];
      window.playILoveYouSound = function (pan, pitch, gain) {
        report.voices.push({ pan: pan, pitch: pitch, gain: gain });
      };
      var congratsHold = setInterval(function () { camp.classList.add("camp-sleep-congrats"); }, 1);
      window.CAMP_FIN_MELODY_SECONDS = -1.45;
      setTimeout(function () { window.scheduleCampFinLoveVoices(); }, 20);
      setTimeout(function () {
        clearInterval(congratsHold);
        report.finalAllowed = window.campFinLoveVoiceAllowed();
        report.finalClass = camp.classList.contains("camp-sleep-congrats");
        report.errors.console = window.__errs || [];
        document.getElementById("__report").textContent = JSON.stringify(report);
      }, 300);
      return;
    } catch (error) {
      report.errors.runtime = String(error && error.stack || error);
    }
    report.errors.console = window.__errs || [];
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300);
});
</script>`, 1100, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
var runtimeOk = runtime && !runtime.errors.runtime && runtime.errors.console && !runtime.errors.console.length &&
  runtime.roomCovered && !runtime.foregroundCovered && runtime.allowed &&
  runtime.trip && runtime.trip.active && runtime.trip.route === "camp" &&
  runtime.voices && runtime.voices.length === 2 &&
  runtime.voices[0].pan === "entrance-roadtrip-camp-marketa" &&
  runtime.voices[1].pan === "entrance-roadtrip-camp-behdad";
check(runtimeOk,
  "the live Camping foreground admits both delayed love lines");
if (!runtimeOk) console.log("    " + JSON.stringify(runtime));

if (failed) process.exit(1);
console.log("Campsite fin audio checks passed.");

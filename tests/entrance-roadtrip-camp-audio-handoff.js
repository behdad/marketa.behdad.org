#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() {
    return {
      drive: window.__entranceRoomState().drive,
      camp: window.__entranceRoadtripCampAudioState(),
      beds: window.__activeAudioBedCount()
    };
  }
  window.addEventListener("load", function () { setTimeout(async function () { try {
    Object.defineProperty(document, "hasFocus", {
      configurable: true, value: function () { return true; }
    });
    window.__setOutdoorTemp(30);
    window.__unlockAllRooms(); window.__goToStage("balcony"); window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart(); window.__entranceRoadtripSetRoute("abraham", 2);
    window.__entranceDriveSetMotion(120, 4); window.__entranceDriveStep(80);
    await sleep(360); report.steps.driving = snap();

    window.__entranceRoadtripSetRoute("camp", 0);
    window.__updateRoadtripCampAudio(); report.steps.arrival = snap();
    await sleep(380); report.steps.crossfade = snap();
    await sleep(1050); report.steps.settled = snap();
    window.__setOutdoorTemp(null);
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
  }, 260); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html Abraham Lake audio handoff:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }

var s = result.steps || {};
var driving = s.driving || {}, arrival = s.arrival || {};
var crossfade = s.crossfade || {}, settled = s.settled || {};
var arrivalTail = arrival.drive && arrival.drive.audioMix && arrival.drive.audioMix.retiring[0];
var middleTail = crossfade.drive && crossfade.drive.audioMix && crossfade.drive.audioMix.retiring[0];
check(result.errors.length === 0, "the arrival handoff has no uncaught errors", result.errors);
check(driving.drive && driving.drive.audioActive && driving.drive.musicActive &&
  driving.drive.acAudioActive && driving.drive.audioMix.gain > .98 && driving.beds >= 3,
  "the moving hot-weather car establishes drivetrain, score, and AC beds", driving);
check(arrival.drive && !arrival.drive.audioActive && !arrival.drive.musicActive &&
  !arrival.drive.acAudioActive && arrivalTail && arrivalTail.gain > .85 &&
  arrivalTail.remaining > 1 && arrival.camp && arrival.camp.active &&
  arrival.camp.levels.wind < arrival.camp.mix.wind * .2 && arrival.beds === driving.beds + 1,
  "arrival starts campsite air before retiring any of the three moving-car beds", arrival);
check(middleTail && arrivalTail && middleTail.gain < arrivalTail.gain && middleTail.gain > .35 &&
  middleTail.remaining < arrivalTail.remaining && crossfade.camp.levels.wind > arrival.camp.levels.wind &&
  crossfade.camp.levels.wind < crossfade.camp.mix.wind,
  "the vehicle master recedes while the existing lake-and-wind bed rises", crossfade);
check(settled.drive && settled.drive.audioMix.retiring.length === 0 && settled.camp.active &&
  settled.camp.levels.wind > arrival.camp.levels.wind && settled.beds === 1,
  "the handoff closes every retired vehicle bed and leaves one outdoor bed", settled);

var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check((source.match(/new Ctx\(\)/g) || []).length === 1 &&
  /stopPorscheDriveAudio\(PORSCHE_CAMP_AUDIO_CROSSFADE_SECONDS\)/.test(source) &&
  /stopPorscheDriveMusic\(PORSCHE_CAMP_AUDIO_CROSSFADE_SECONDS\)/.test(source) &&
  /stopPorscheDriveAc\(PORSCHE_CAMP_AUDIO_CROSSFADE_SECONDS \* \.68\)/.test(source),
  "one arrival owner synchronizes existing car layers on the sole AudioContext");

if (failures) process.exit(1);
console.log("Abraham Lake audio-handoff assertions passed.");

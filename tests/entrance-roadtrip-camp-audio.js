#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function () {
  var report = { errors: [], steps: {} }, focused = true, visibility = "visible";
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snap() {
    return {
      audio: window.__entranceRoadtripCampAudioState(),
      beds: window.__activeAudioBedCount(),
      partyForeground: window.__partyForegroundState(),
      partyRuntime: window.__partyForegroundRuntimeState()
    };
  }
  try {
    Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return visibility === "hidden"; } });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return visibility; } });
  } catch (_error) {}
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__goToStage("balcony"); window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud(); window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("camp", 0); window.__updateRoadtripCampAudio();
    report.steps.arrival = snap(); await sleep(120); report.steps.fadeIn = snap(); await sleep(580);
    report.steps.calm = snap(); report.steps.calm.before = report.steps.calm.beds - 1;

    window.__exitEntranceRoadtrip();
    window.__entranceRoadtripSetRoute("camp", 0); window.__updateRoadtripCampAudio();
    report.steps.rapidReentry = snap();

    window.__entranceRoadtripCampFireStart();
    window.__entranceRoadtripCampFirePlace("tinder");
    window.__entranceRoadtripCampFirePlace("twigs");
    window.__entranceRoadtripCampFirePlace("teepee");
    window.__entranceRoadtripCampFireLight(); await sleep(1580);
    window.__updateRoadtripCampAudio(); report.steps.lit = snap();

    window.__setBalconyRain(true, "test"); window.__setBalconyStormLayer(false, "test");
    window.__updateRoadtripCampAudio(); report.steps.rain = snap();
    window.__setBalconyStormLayer(true, "test"); window.__updateRoadtripCampAudio();
    report.steps.storm = snap();

    var dinnerCheckpoint = window.__captureCheckpointSystems().entrance;
    dinnerCheckpoint.drive.roadtrip.campFireBuilt = true;
    dinnerCheckpoint.drive.roadtrip.campFireLit = true;
    dinnerCheckpoint.drive.roadtrip.campActive = true;
    dinnerCheckpoint.drive.roadtrip.stew = {
      protein: "beef", starch: "barley", status: "served", elapsed: 11600
    };
    window.__restoreCheckpointSystems({ entrance: dinnerCheckpoint }, "afterStage");
    await sleep(80); window.__setDayNight(true);
    window.__setBalconyRain(true, "test"); window.__setBalconyStormLayer(true, "test");
    window.__entranceRoadtripCampStargazingOpen();
    report.steps.clearNight = snap();

    var wisdomCheckpoint = window.__captureCheckpointSystems().entrance;
    wisdomCheckpoint.drive.roadtrip.campFireLit = true;
    wisdomCheckpoint.drive.roadtrip.stargazing = {
      progress: { cassiopeia: 5, "ursa-major": 7, "ursa-minor": 7 },
      completed: ["cassiopeia", "ursa-major", "ursa-minor"],
      complete: true, wisdomDismissed: false, wisdomHandoffReady: false, sleepPhase: "idle"
    };
    window.__restoreCheckpointSystems({ entrance: wisdomCheckpoint }, "afterStage");
    var attendedWisdomMurmurs = [0, 1, 2, 3].map(window.__playCampWisdomMurmurSound);
    focused = false;
    var unfocusedWisdomMurmur = window.__playCampWisdomMurmurSound(0);
    focused = true;
    report.steps.wisdomMurmur = {
      attended: attendedWisdomMurmurs,
      unfocused: unfocusedWisdomMurmur
    };

    var finaleCheckpoint = window.__captureCheckpointSystems().entrance;
    finaleCheckpoint.drive.roadtrip.campFireLit = false;
    finaleCheckpoint.drive.roadtrip.stargazing = {
      progress: { cassiopeia: 5, "ursa-major": 7, "ursa-minor": 7 },
      completed: ["cassiopeia", "ursa-major", "ursa-minor"],
      complete: true, wisdomDismissed: true, wisdomHandoffReady: false, sleepPhase: "complete"
    };
    window.__restoreCheckpointSystems({ entrance: finaleCheckpoint }, "afterStage");
    window.__updateRoadtripCampAudio(); await sleep(940); report.steps.finale = snap();

    window.__entranceRoadtripCampFireReplay(); window.__updateRoadtripCampAudio();
    report.steps.out = snap();

    focused = false; window.dispatchEvent(new Event("blur")); await sleep(620);
    report.steps.blur = snap();
    focused = true; window.dispatchEvent(new Event("focus")); await sleep(40);
    report.steps.refocus = snap();

    visibility = "hidden"; document.dispatchEvent(new Event("visibilitychange")); await sleep(620);
    report.steps.hidden = snap();
    visibility = "visible"; document.dispatchEvent(new Event("visibilitychange")); await sleep(40);
    report.steps.visible = snap();

    window.__exitEntranceRoadtrip(); await sleep(620); report.steps.dismissed = snap();
    window.__setBalconyRain(false, "test"); window.__setBalconyStormLayer(false, "test");
  } catch (error) { report.errors.push("harness: " + String(error && error.stack || error)); }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
  }, 350); });
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : "")); }
}

console.log("rsvp.html campsite ambience:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7600, {
  patchRaf: true, forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "the campsite mix has no uncaught errors", result.errors);
check(s.arrival && s.fadeIn && s.arrival.audio.levels.wind < s.arrival.audio.mix.wind * .2 &&
  s.fadeIn.audio.levels.wind > s.arrival.audio.levels.wind &&
  s.fadeIn.audio.levels.wind < s.fadeIn.audio.mix.wind,
  "repeated arrival paints preserve the campsite wind fade-in", { arrival: s.arrival, fadeIn: s.fadeIn });
check(s.calm && s.calm.audio.active && s.calm.audio.attended && s.calm.audio.outdoor &&
  !s.calm.audio.fireLit && s.calm.audio.mix.fire === 0 && s.calm.audio.mix.wind > 0 &&
  s.calm.audio.mix.lake > 0 && !s.calm.audio.fireSource && s.calm.audio.sources === 4 &&
  s.calm.beds === s.calm.before + 1,
  "Camping owns one shared-context outdoor lake-and-wind bed before the fire is built", s.calm);
check(s.rapidReentry && s.rapidReentry.audio.active && s.rapidReentry.audio.retiring === 0 &&
  s.rapidReentry.beds === s.calm.beds,
  "rapid campsite re-entry retires the fading bed before starting its replacement", s.rapidReentry);
check(s.lit && s.lit.audio.fireLit && s.lit.audio.mix.fire > 0 && s.lit.audio.fireSource &&
  s.lit.audio.sources === 5 && s.lit.beds === s.calm.beds,
  "the completed lit fire fades its crackle into the existing campsite bed", s.lit);
check(s.rain && s.storm && s.rain.audio.rain && !s.rain.audio.storm &&
  s.rain.audio.mix.rain > 0 && s.rain.audio.mix.rain <= 0.01 && s.storm.audio.storm &&
  s.storm.audio.mix.rain > s.rain.audio.mix.rain &&
  s.storm.audio.mix.rain <= 0.018 &&
  s.storm.audio.mix.wind > s.rain.audio.mix.wind && s.storm.audio.mix.storm > 0,
  "rain stays soft outdoors while a storm modestly raises precipitation and wind", { rain: s.rain, storm: s.storm });
check(s.clearNight && s.clearNight.audio.rain && s.clearNight.audio.storm &&
  s.clearNight.audio.mix.rain === 0 && s.clearNight.audio.mix.storm === 0 &&
  s.clearNight.audio.mix.wind < s.storm.audio.mix.wind,
  "the locally clear stargazing sky suppresses hidden rain and storm hiss", s.clearNight);
check(s.wisdomMurmur && s.wisdomMurmur.attended.every(function (played) { return played === true; }) &&
  s.wisdomMurmur.unfocused === false,
  "all four speaker murmurs play only for an attended wisdom exchange", s.wisdomMurmur);
check(s.finale && s.finale.audio.active && !s.finale.audio.fireLit &&
  s.finale.audio.mix.lake > 0 && s.finale.audio.mix.wind > 0 &&
  s.finale.audio.mix.wind < s.clearNight.audio.mix.wind &&
  s.finale.audio.levels.lake > 0 && s.finale.audio.levels.wind > 0 &&
  s.finale.audio.mix.rain === 0 && s.finale.audio.mix.storm === 0,
  "the sleep finale keeps a quiet lake wash and lower wind without weather hiss", s.finale);
check(s.out && !s.out.audio.fireLit && s.out.audio.mix.fire === 0 && !s.out.audio.fireSource && s.out.audio.active,
  "extinguishing the fire removes crackle without stopping the outdoor bed", s.out);
check(s.blur && !s.blur.audio.active && !s.blur.audio.attended && s.blur.beds === s.calm.before,
  "blur fades and closes the campsite-owned bed", s.blur);
check(s.refocus && s.refocus.audio.active && s.refocus.audio.attended && s.refocus.beds === s.calm.beds,
  "focus starts one fresh campsite bed without accumulating sources", s.refocus);
check(s.hidden && !s.hidden.audio.active && !s.hidden.audio.attended && s.hidden.beds === s.calm.before &&
  s.visible && s.visible.audio.active && s.visible.beds === s.calm.beds,
  "visibility teardown and recovery preserve one-bed ownership", { hidden: s.hidden, visible: s.visible });
check(s.dismissed && !s.dismissed.audio.active && !s.dismissed.audio.attended &&
  !s.dismissed.audio.outdoor && !s.dismissed.audio.sources && !s.dismissed.audio.retiring &&
  s.dismissed.partyForeground && !s.dismissed.partyForeground.suspended &&
  s.dismissed.partyRuntime && !s.dismissed.partyRuntime.suspended,
  "Road Trip dismissal closes every campsite-owned source before restoring shared ambience", s.dismissed);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/new Ctx\(\)/g) || []).length === 1 &&
  /bed = audioBed\("outdoor"\)/.test(source) &&
  /else if \(kind === "outdoor"\) \{\s*out\.connect\(loftAudioDestination\(ac\)\)/.test(source),
  "the campsite route reuses the sole AudioContext through the authored outdoor bed bus");
check((source.match(/campFinaleOwnsQuiet\(\)/g) || []).length === 3 &&
  /function autonomousThunderPlayback\(\) \{[\s\S]{0,180}campFinaleOwnsQuiet\(\)/.test(source) &&
  /var current = autonomousThunderPlayback\(\);\s*if \(!current\) return;/.test(source),
  "the terminal campsite blocks both new and already-queued loft thunder");

console.log("");
if (failures) { console.log(failures + " campsite audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Campsite ambience assertions passed.");

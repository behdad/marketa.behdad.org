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
    return { audio: window.__entranceRoadtripCampAudioState(), beds: window.__activeAudioBedCount() };
  }
  try {
    Object.defineProperty(document, "hasFocus", { configurable: true, value: function () { return focused; } });
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return visibility === "hidden"; } });
    Object.defineProperty(document, "visibilityState", { configurable: true, get: function () { return visibility; } });
  } catch (_error) {}
  window.addEventListener("load", function () { setTimeout(async function () { try {
    window.__unlockAllRooms(); window.goToStage("balcony"); window.__openEntranceRoom();
    document.querySelector(".hunt-viewport").classList.add("entrance-room-open");
    window.__openEntrancePorscheDriveHud(); window.__entranceRoadtripStart();
    window.__entranceRoadtripSetRoute("camp", 0); window.__updateRoadtripCampAudio();
    report.steps.arrival = snap(); await sleep(120); report.steps.fadeIn = snap(); await sleep(580);
    report.steps.calm = snap(); report.steps.calm.before = report.steps.calm.beds - 1;

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
  !s.calm.audio.fireSource && s.calm.audio.sources === 3 &&
  s.calm.beds === s.calm.before + 1,
  "Camping owns one shared-context outdoor wind bed before the fire is built", s.calm);
check(s.lit && s.lit.audio.fireLit && s.lit.audio.mix.fire > 0 && s.lit.audio.fireSource &&
  s.lit.audio.sources === 4 && s.lit.beds === s.calm.beds,
  "the completed lit fire fades its crackle into the existing campsite bed", s.lit);
check(s.rain && s.storm && s.rain.audio.rain && !s.rain.audio.storm &&
  s.rain.audio.mix.rain > 0 && s.storm.audio.storm &&
  s.storm.audio.mix.rain > s.rain.audio.mix.rain &&
  s.storm.audio.mix.wind > s.rain.audio.mix.wind && s.storm.audio.mix.storm > 0,
  "rain is prominent outdoors and a storm raises both precipitation and wind", { rain: s.rain, storm: s.storm });
check(s.clearNight && s.clearNight.audio.rain && s.clearNight.audio.storm &&
  s.clearNight.audio.mix.rain === 0 && s.clearNight.audio.mix.storm === 0 &&
  s.clearNight.audio.mix.wind < s.storm.audio.mix.wind,
  "the locally clear stargazing sky suppresses hidden rain and storm hiss", s.clearNight);
check(s.out && !s.out.audio.fireLit && s.out.audio.mix.fire === 0 && !s.out.audio.fireSource && s.out.audio.active,
  "extinguishing the fire removes crackle without stopping the outdoor bed", s.out);
check(s.blur && !s.blur.audio.active && !s.blur.audio.attended && s.blur.beds === s.calm.before,
  "blur fades and closes the campsite-owned bed", s.blur);
check(s.refocus && s.refocus.audio.active && s.refocus.audio.attended && s.refocus.beds === s.calm.beds,
  "focus starts one fresh campsite bed without accumulating sources", s.refocus);
check(s.hidden && !s.hidden.audio.active && !s.hidden.audio.attended && s.hidden.beds === s.calm.before &&
  s.visible && s.visible.audio.active && s.visible.beds === s.calm.beds,
  "visibility teardown and recovery preserve one-bed ownership", { hidden: s.hidden, visible: s.visible });
check(s.dismissed && !s.dismissed.audio.active && !s.dismissed.audio.attended && s.dismissed.beds === s.calm.before,
  "Road Trip dismissal closes the campsite mix", s.dismissed);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/new Ctx\(\)/g) || []).length === 1 &&
  /bed = audioBed\("outdoor"\)/.test(source) &&
  /else if \(kind === "outdoor"\) \{\s*out\.connect\(loftAudioDestination\(ac\)\)/.test(source),
  "the campsite route reuses the sole AudioContext through the authored outdoor bed bus");

console.log("");
if (failures) { console.log(failures + " campsite audio assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Campsite ambience assertions passed.");

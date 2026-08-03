#!/usr/bin/env node
// Highway speed-limit and police event: warning, tolerance, pursuit, pull-over, and run-ending cases.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function trip() { return state().drive.roadtrip; }
  function step(ms, count) {
    for (var i = 0; i < (count || 1); i++) window.__entranceDriveStep(ms);
  }
  function setMotion(speed, gear) {
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveControl("brake", false);
    return window.__entranceDriveSetMotion(speed, gear);
  }
  function meetPolice(speed) {
    setMotion(speed, speed >= 200 ? 4 : 3);
    window.__entranceRoadtripPolice(150);
    var stationAt = trip().police.stationAt;
    window.__entranceRoadtripSetDistance(stationAt - 6);
    window.__entranceRoadtripPoliceDetect(speed);
    return copy(trip());
  }
  function prepareEncounter() {
    window.__entranceRoadtripStart();
    window.__entranceRoadtripSetLane(.5);
    setMotion(0, 0);
  }
  async function run() {
    try {
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(40);
      window.__openEntrancePorscheDriveHud();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripStart();
      report.steps.contract = {
        hook: typeof window.__entranceRoadtripPolice,
        detectHook: typeof window.__entranceRoadtripPoliceDetect,
        pursuitStepHook: typeof window.__entranceRoadtripPoliceStep,
        speedLimit: trip().speedLimit,
        enforcementSpeed: trip().enforcementSpeed,
        runEndSpeed: trip().runEndSpeed,
        escapeSpeed: trip().policeEscapeSpeed,
        escapeDistance: trip().policeEscapeDistance,
        speedSign: !!document.getElementById("entrance-roadtrip-speed-90"),
        speedFurniture: Array.prototype.some.call(document.querySelectorAll("#entrance-roadtrip-furniture use"), function (node) {
          return (node.getAttribute("href") || node.getAttribute("xlink:href")) === "#entrance-roadtrip-speed-90";
        })
      };

      setMotion(110, 3);
      window.__entranceRoadtripPolice(150);
      step(200, 7);
      report.steps.warning = {
        police: copy(trip().police),
        warningVisible: document.querySelector(".entrance-roadtrip-police-warning").getAttribute("visibility"),
        roadsideVisible: trip().police.roadsideVisible
      };
      window.__entranceRoadtripSetDistance(trip().police.stationAt - 6);
      step(20);
      report.steps.tolerated = copy(trip());

      prepareEncounter();
      var pursuit = meetPolice(130);
      report.steps.pursuit = {
        trip: pursuit,
        mirror: document.querySelector(".entrance-roadtrip-police-mirror").getAttribute("visibility"),
        instruction: document.getElementById("hunt-caption").textContent.trim()
      };
      document.hasFocus = function () { return false; };
      window.dispatchEvent(new Event("blur"));
      await sleep(60);
      report.steps.unfocused = copy(trip().police);
      document.hasFocus = function () { return true; };
      window.dispatchEvent(new Event("focus"));
      await sleep(80);
      report.steps.refocused = copy(trip().police);
      window.__entranceRoadtripSetLane(2);
      setMotion(0, 0);
      step(1000);
      report.steps.stopped = copy(trip());

      prepareEncounter();
      var fastPursuit = meetPolice(205);
      var fastInitialScale = fastPursuit.police.mirrorScale;
      var fastInitialSiren = fastPursuit.police.sirenLevel;
      window.__entranceRoadtripPoliceStep(205, 1);
      var firstFastStep = copy(trip());
      window.__entranceRoadtripPoliceStep(205, 1);
      var brieflyFast = copy(trip());
      window.__entranceRoadtripPoliceStep(190, 2);
      var recovered = copy(trip());
      window.__entranceRoadtripPoliceStep(205, 8);
      report.steps.escaped = {
        detected: fastPursuit,
        initialScale: fastInitialScale,
        initialSiren: fastInitialSiren,
        firstFastStep: firstFastStep,
        brieflyFast: brieflyFast,
        recovered: recovered,
        cleared: copy(trip())
      };

      prepareEncounter();
      report.steps.severe = meetPolice(150);

      prepareEncounter();
      meetPolice(130);
      window.__exitEntranceRoadtrip();
      report.steps.refused = copy(trip());

      window.setLang("cs");
      prepareEncounter();
      meetPolice(130);
      report.steps.czech = document.getElementById("hunt-caption").textContent.trim();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () { setTimeout(run, 180); });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html highway police:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7000, {
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.contract && s.contract.hook === "function" && s.contract.detectHook === "function" &&
  s.contract.pursuitStepHook === "function" &&
  s.contract.speedLimit === 90 &&
  s.contract.enforcementSpeed === 110 && s.contract.runEndSpeed === 150 &&
  s.contract.escapeSpeed === 200 && s.contract.escapeDistance === 55 &&
  s.contract.speedSign && s.contract.speedFurniture,
  "the highway posts a 90 km/h limit and exposes the 110/150 enforcement thresholds", s.contract);
check(s.warning && s.warning.police.warningFlashCount === 3 &&
  s.warning.warningVisible === "visible" && s.warning.roadsideVisible,
  "one oncoming vehicle gives exactly three high-beam flashes before the roadside car", s.warning);
check(s.tolerated && s.tolerated.active && s.tolerated.police.phase === "cooldown" &&
  s.tolerated.police.detectedSpeed <= 110 && s.tolerated.police.pursuits === 0 &&
  s.tolerated.police.tickets === 0 && s.tolerated.police.fines === 0,
  "110 km/h is tolerated without a pursuit or ticket", s.tolerated);
check(s.pursuit && s.pursuit.trip.police.phase === "pursuit" &&
  s.pursuit.trip.police.detectedSpeed === 130 && s.pursuit.trip.police.fine === 750 &&
  s.pursuit.trip.police.sirenActive && s.pursuit.trip.police.mirrorVisible &&
  s.pursuit.mirror === "visible",
  "speed above tolerance starts a scaled-fine pursuit with siren and a rearview police car", s.pursuit);
check(s.unfocused && !s.unfocused.sirenActive && s.refocused && s.refocused.sirenActive,
  "the pursuit siren tears down while unfocused and returns only when attended", {
    unfocused: s.unfocused, refocused: s.refocused
  });
check(s.stopped && s.stopped.active && s.stopped.police.phase === "cooldown" &&
  s.stopped.police.stops === 1 && s.stopped.police.tickets === 1 &&
  s.stopped.police.fines === 750 && !s.stopped.police.sirenActive &&
  !s.stopped.police.mirrorVisible,
  "stopping on the right shoulder settles the speed-scaled fine and ends the siren", s.stopped);
check(s.escaped && s.escaped.detected.active && s.escaped.detected.police.phase === "pursuit" &&
  s.escaped.detected.police.detectedSpeed === 205 &&
  s.escaped.firstFastStep.police.phase === "pursuit" &&
  s.escaped.firstFastStep.police.mirrorScale < s.escaped.initialScale &&
  s.escaped.brieflyFast.police.phase === "pursuit" &&
  s.escaped.brieflyFast.police.escapeGap > 0 &&
  s.escaped.brieflyFast.police.mirrorScale < s.escaped.firstFastStep.police.mirrorScale &&
  s.escaped.brieflyFast.police.sirenLevel < s.escaped.initialSiren &&
  s.escaped.recovered.police.phase === "pursuit" && s.escaped.recovered.police.escapeGap === 0 &&
  s.escaped.recovered.police.refusalElapsed === 2 &&
  s.escaped.cleared.active && s.escaped.cleared.police.phase === "cooldown" &&
  s.escaped.cleared.police.escapes === 1 && !s.escaped.cleared.police.sirenActive &&
  !s.escaped.cleared.police.mirrorVisible && s.escaped.cleared.police.tickets === 0,
  "sustained 200+ opens a visible/audible gap, while an early speed drop lets pursuit recover",
  s.escaped);
check(s.severe && !s.severe.active && s.severe.police.runEnded &&
  s.severe.police.endReason === "speed" && s.severe.police.detectedSpeed >= 150 &&
  s.severe.police.tickets === 1 && s.severe.police.fines >= 1250,
  "60 km/h over the limit ends only the highway run", s.severe);
check(s.refused && !s.refused.active && s.refused.police.runEnded &&
  s.refused.police.endReason === "refused" && s.refused.police.fines === 1750,
  "exiting instead of pulling over ends the run with the refusal surcharge", s.refused);
check(s.czech && /pravou krajnici/.test(s.czech),
  "the pursuit instruction is mirrored in Czech", s.czech);

if (failures) {
  console.log("\n" + failures + " highway-police assertion(s) failed.");
  process.exit(1);
}
console.log("\nHighway-police assertions passed.");

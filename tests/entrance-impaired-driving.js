#!/usr/bin/env node
// Balcony drinks carry into the highway as restrained steering drift and observable erratic driving.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function trip() { return window.__entranceRoomState().drive.roadtrip; }
  function setDrinks(count) {
    window.__resetWineSips();
    for (var i = 0; i < count; i++) window.__registerDrink();
  }
  function prepare(count, lane, speed) {
    setDrinks(count);
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRoute("banff", 0);
    window.__entranceRoadtripSetLane(lane == null ? .5 : lane);
    window.__entranceDriveControl("throttle", false);
    window.__entranceDriveControl("brake", false);
    window.__entranceDriveControl("steerLeft", false);
    window.__entranceDriveControl("steerRight", false);
    window.__entranceDriveSetMotion(speed || 50, 2);
  }
  function sampleDrift(count) {
    prepare(count, .5, 50);
    var samples = [];
    for (var i = 0; i < 20; i++) {
      window.__entranceDriveStep(100);
      var state = window.__entranceRoomState().drive;
      samples.push({ bias: state.roadtrip.impairedSteeringBias,
        angle: state.steeringAngle, lane: state.roadtrip.playerLane });
    }
    return {
      state: copy(trip()),
      maxBias: Math.max.apply(Math, samples.map(function (row) { return Math.abs(row.bias); })),
      maxAngle: Math.max.apply(Math, samples.map(function (row) { return Math.abs(row.angle); })),
      laneSpread: Math.max.apply(Math, samples.map(function (row) { return row.lane; })) -
        Math.min.apply(Math, samples.map(function (row) { return row.lane; }))
    };
  }
  function policeSample(count, lane, speed, steps) {
    window.__entranceRoadtripSetDemerits(0, 0);
    prepare(count, lane, speed || 70);
    for (var i = 0; i < (steps || 6); i++) {
      if (steps) window.__entranceDriveSetMotion(speed || 70, 2);
      window.__entranceDriveStep(400);
    }
    var approach = copy(trip());
    window.__entranceRoadtripPolice(150);
    window.__entranceRoadtripPoliceDetect(90);
    return { approach: approach, detected: copy(trip()) };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        report.sober = sampleDrift(0);
        report.third = sampleDrift(3);
        report.sixth = sampleDrift(6);
        report.impairedSteady = policeSample(4, .5);
        report.soberErratic = policeSample(0, 2);
        report.impairedErratic = policeSample(4, 2, 100);
        window.__entranceRoadtripSetLane(2);
        window.__entranceRoadtripPoliceStep(0, .5);
        window.__entranceRoadtripPoliceStep(0, 3);
        report.impairedCard = {
          title: document.getElementById("entrance-roadtrip-arrest-title").textContent.trim(),
          line: document.getElementById("entrance-roadtrip-arrest-line").textContent.trim()
        };
        window.__entranceRoadtripPoliceStep(0, 6);
        report.impairedOutcome = copy(trip());
        report.outcomeCaption = document.getElementById("hunt-caption").textContent.trim();
        report.impairedCenterline = policeSample(4, -.5, 70, 25);
        window.__entranceRoadtripSetLane(2);
        window.__entranceRoadtripPoliceStep(0, .5);
        window.__entranceRoadtripPoliceStep(0, 3);
        report.combinedCard = {
          title: document.getElementById("entrance-roadtrip-arrest-title").textContent.trim(),
          line: document.getElementById("entrance-roadtrip-arrest-line").textContent.trim()
        };
        window.__entranceRoadtripPoliceStep(0, 6);
        report.combinedOutcome = copy(trip());
        report.combinedCaption = document.getElementById("hunt-caption").textContent.trim();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 180);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 3000, {
  patchRaf: true,
  seedRandom: true,
  chromeFlags: "--no-default-browser-check --noerrdialogs --window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft-day.html impaired highway driving:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.sober.state.impairmentLevel === 0 && result.sober.maxBias === 0,
  "sober highway steering remains unchanged", result && result.sober);
check(result && result.third.state.impairmentLevel === .25 && result.third.maxBias > .002 &&
  result.sixth.state.impairmentLevel === 1 && result.sixth.maxBias > result.third.maxBias * 3 &&
  result.sixth.maxBias < .18 && result.sixth.maxAngle < 3.5 && result.sixth.laneSpread < .35,
  "steering drift begins subtly at drink three, grows progressively, and stays correctable", result && {
    third: result.third, sixth: result.sixth
  });
check(result && !result.impairedSteady.approach.erraticDriving &&
  result.impairedSteady.detected.police.phase === "cooldown" &&
  !result.impairedSteady.detected.police.impairedDriving &&
  !result.soberErratic.approach.erraticDriving && result.soberErratic.detected.police.phase === "cooldown",
  "drinks alone and sober lane mistakes do not trigger impaired enforcement", result && {
    steady: result.impairedSteady, sober: result.soberErratic
  });
check(result && result.impairedErratic.approach.erraticDriving &&
  result.impairedErratic.approach.erraticDrivingSeconds >= 2 &&
  result.impairedErratic.detected.police.phase === "pursuit" &&
  result.impairedErratic.detected.police.impairedDriving &&
  result.impairedErratic.detected.police.courtRequired &&
  result.impairedErratic.detected.police.fine === null,
  "sustained impaired wrong-lane driving is detected even at the speed limit and requires court",
  result && result.impairedErratic);
check(result && result.impairedOutcome.police.runEnded &&
  result.impairedOutcome.police.endReason === "court" &&
  result.impairedOutcome.police.lastDemerits === 6 &&
  result.impairedOutcome.police.scorePenalties === 250 &&
  result.impairedCard.title === "IMPAIRED DRIVING" && /6 pts/.test(result.impairedCard.line) &&
  result.impairedCard.line.indexOf("0 over") < 0 && /250-point penalty/.test(result.outcomeCaption),
  "an impaired stop uses the existing arrest path with a six-point and 250-score consequence",
  result && { card: result.impairedCard, outcome: result.impairedOutcome, caption: result.outcomeCaption });
check(result && result.impairedCenterline.approach.erraticDriving &&
  result.impairedCenterline.detected.police.phase === "pursuit" &&
  result.impairedCenterline.detected.police.offence === "solid-line" &&
  result.impairedCenterline.detected.police.impairedDriving &&
  result.impairedCenterline.detected.police.courtRequired &&
  result.combinedOutcome.police.runEnded &&
  result.combinedOutcome.police.lastDemerits === 8 &&
  result.combinedOutcome.police.scorePenalties === 250 &&
  result.combinedCard.title === "IMPAIRED DRIVING" && /8 pts/.test(result.combinedCard.line) &&
  /250-point penalty/.test(result.combinedCaption),
  "impaired driving across the double solid line stacks both demerit offences while retaining the impaired court path",
  result && { detected: result.impairedCenterline, card: result.combinedCard,
    outcome: result.combinedOutcome, caption: result.combinedCaption });
if (failures) process.exit(1);
console.log("impaired highway driving assertions passed.");

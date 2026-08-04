#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  var attended = true;
  function state() { return window.__entranceRoomState().drive; }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function step(milliseconds, count) {
    for (var index = 0; index < count; index++) window.__entranceDriveStep(milliseconds);
  }
  function setMotion(speed, gear) {
    ["throttle", "brake", "clutch", "steerLeft", "steerRight"].forEach(function (control) {
      window.__entranceDriveControl(control, false);
    });
    return window.__entranceDriveSetMotion(speed, gear);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", {
          value: function () { return attended; }, configurable: true
        });
        window.getSfxCtx = function () { return null; };
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__toggleEntrancePorscheEngine();

        report.steps.ratioSpeedsAt3000 = [1, 2, 3, 4, 5, 6].map(function (gear) {
          var ratios = [3.667, 2.05, 1.407, 1.133, .972, .841];
          var speed = 3000 * 60 * 2.0948 / (ratios[gear - 1] * 3.875 * 1000);
          return { gear: gear, speed: speed, rpm: window.__entranceDriveRpmForSpeed(speed, gear) };
        });

        setMotion(80, 3);
        step(20, 1);
        var coupled = copy(state());
        coupled.expectedRpm = window.__entranceDriveRpmForSpeed(coupled.speed, coupled.gear);
        report.steps.coupled = coupled;

        setMotion(8, 1);
        var firstBefore = copy(state());
        window.__entranceDriveControl("throttle", true);
        step(20, 40);
        window.__entranceDriveControl("throttle", false);
        report.steps.firstLow = { before: firstBefore, after: copy(state()) };

        setMotion(12, 2);
        var secondBefore = copy(state());
        window.__entranceDriveControl("throttle", true);
        step(20, 60);
        window.__entranceDriveControl("throttle", false);
        report.steps.secondLow = { before: secondBefore, after: copy(state()) };

        setMotion(0, 1);
        window.__entranceDriveControl("clutch", true);
        window.__entranceDriveControl("throttle", true);
        step(20, 40);
        var held = copy(state());
        window.__entranceDriveControl("clutch", false);
        var released = copy(state());
        step(20, 9);
        var early = copy(state());
        step(20, 16);
        var launched = copy(state());
        window.__entranceDriveControl("throttle", false);
        step(20, 60);
        var settled = copy(state());
        report.steps.clutchDump = {
          held: held, released: released, early: early, launched: launched, settled: settled
        };

        setMotion(50, 2);
        window.__entranceDriveControl("clutch", true);
        window.__entranceDriveControl("throttle", true);
        step(20, 40);
        window.__entranceDriveControl("clutch", false);
        report.steps.rollingRelease = copy(state());

        setMotion(120, 3);
        window.__entranceDriveControl("brake", true);
        step(20, 1);
        var hardBrakeStep = copy(state());
        setMotion(.5, 1);
        window.__entranceDriveControl("brake", true);
        step(20, 1);
        var shortBrakeStep = copy(state());

        setMotion(120, 3);
        window.__entranceDriveControl("brake", true);
        step(20, 8);
        var braking = copy(state());
        window.__entranceDriveControl("brake", false);
        step(20, 4);
        var easing = copy(state());
        step(20, 80);
        var brakeSettled = copy(state());
        setMotion(0, 0);
        step(20, 20);
        var stopped = copy(state());
        step(20, 20);
        var idleStable = copy(state());
        report.steps.brakePitch = {
          hardStep: hardBrakeStep, shortStep: shortBrakeStep, braking: braking,
          easing: easing, settled: brakeSettled, stopped: stopped, idleStable: idleStable
        };

        setMotion(100, 3);
        window.__entranceRoadtripStart();
        window.__entranceDriveControl("brake", true);
        step(20, 6);
        var attendedPitch = copy(state());
        attended = false;
        window.dispatchEvent(new Event("blur"));
        var pausedBefore = copy(state());
        window.__entranceDriveStep(600);
        var pausedAfter = copy(state());
        report.steps.pausedPitch = {
          attended: attendedPitch, before: pausedBefore, after: pausedAfter
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 220);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html Porsche manual drivetrain:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.ratioSpeedsAt3000 && s.ratioSpeedsAt3000.length === 6 &&
  s.ratioSpeedsAt3000.every(function (row) { return Math.abs(row.rpm - 3000) < .01; }),
  "all six published manual ratios map 3,000 rpm to wheel speed coherently", s.ratioSpeedsAt3000);
check(s.coupled && Math.abs(s.coupled.rpm - s.coupled.expectedRpm) < .5,
  "an engaged clutch keeps engine RPM locked to wheel speed after road load", s.coupled);
check(s.firstLow && s.firstLow.after.speed >= s.firstLow.before.speed + 12 && s.firstLow.after.rpm >= 2250,
  "first gear pulls promptly through the low-RPM launch range", s.firstLow);
check(s.secondLow && s.secondLow.after.speed >= s.secondLow.before.speed + 9 &&
  s.secondLow.after.rpm >= s.secondLow.before.rpm + 550,
  "second gear builds wheel speed and RPM without the old low-rev wait", s.secondLow);
var launch = s.clutchDump;
check(launch && launch.held.rpm >= 7000 && launch.released.clutchEngagement.remainingMs >= 650 &&
  launch.released.clutchEngagement.strength >= .9,
  "a held clutch can bank high engine RPM for a strong first-gear engagement", launch && {
    held: launch.held, released: launch.released
  });
check(launch && launch.early.rpm >= 3500 && launch.early.speed >= 4 &&
  launch.launched.speed >= 11 && launch.launched.rpm >= 2300,
  "clutch release transfers revs into a forceful launch instead of collapsing below 2,000 rpm", launch);
check(launch && launch.released.noseLift > .35 && launch.early.noseLift > launch.released.noseLift &&
  /^rotate\([1-9]/.test(launch.early.pitchTransform) && launch.settled.noseLift < .05 &&
  launch.settled.pitchTransform === "rotate(0.00 296 316)",
  "hard engagement briefly lifts the nose, then settles it naturally", launch);
check(launch && s.rollingRelease && s.rollingRelease.noseLift < launch.released.noseLift,
  "the same clutch load produces less pitch once the car is already rolling", {
    standing: launch && launch.released, rolling: s.rollingRelease
  });
var brakePitch = s.brakePitch;
check(brakePitch && brakePitch.hardStep.longitudinalDeceleration > brakePitch.shortStep.longitudinalDeceleration &&
  brakePitch.hardStep.noseDive > brakePitch.shortStep.noseDive &&
  /^rotate\(-/.test(brakePitch.hardStep.pitchTransform),
  "nose-down pitch scales with measured longitudinal deceleration", brakePitch && {
    hard: brakePitch.hardStep, short: brakePitch.shortStep
  });
check(brakePitch && brakePitch.braking.noseDive > 1.5 &&
  brakePitch.easing.noseDive > 0 && brakePitch.easing.noseDive < brakePitch.braking.noseDive &&
  brakePitch.settled.noseDive === 0 && brakePitch.settled.pitchTransform === "rotate(0.00 296 316)",
  "hard braking dives promptly, then settles smoothly as the pedal eases", brakePitch);
check(brakePitch && brakePitch.stopped.speed === 0 && brakePitch.stopped.noseDive === 0 &&
  brakePitch.idleStable.speed === 0 && brakePitch.idleStable.noseDive === 0 &&
  brakePitch.idleStable.pitchTransform === brakePitch.stopped.pitchTransform,
  "a stopped idling car gains no pitch wobble", brakePitch && {
    stopped: brakePitch.stopped, stable: brakePitch.idleStable
  });
var pausedPitch = s.pausedPitch;
check(pausedPitch && pausedPitch.before.noseDive > 0 &&
  pausedPitch.after.noseDive === pausedPitch.before.noseDive &&
  pausedPitch.after.pitchTransform === pausedPitch.before.pitchTransform,
  "an unfocused Road Trip freezes brake pitch with the rest of the simulation", pausedPitch);

console.log("");
if (failures) {
  console.log(failures + " drivetrain assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Porsche manual drivetrain assertions passed.");

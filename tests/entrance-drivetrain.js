#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  var attended = true;
  function roomState() { return window.__entranceRoomState(); }
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
  function benchmark100() {
    setMotion(0, 1);
    window.__entranceDriveControl("throttle", true);
    var elapsed = 0;
    var shifts = [];
    while (elapsed < 9000 && Math.abs(state().speed) < 100) {
      window.__entranceDriveStep(20);
      elapsed += 20;
      var drive = state();
      if (drive.rpm >= 7000 && drive.gear < 3) {
        shifts.push({ at: elapsed, speed: drive.speed, rpm: drive.rpm, from: drive.gear });
        window.__entranceDriveShift(drive.gear + 1, true);
      }
    }
    window.__entranceDriveControl("throttle", false);
    return { elapsed: elapsed, shifts: shifts, state: copy(state()) };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", {
          value: function () { return attended; }, configurable: true
        });
        window.__getSfxCtx = function () { return null; };
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        window.__entranceDriveTransmissionMode("manual", false);

        var offRestBefore = copy(roomState());
        for (var offPress = 0; offPress < 4; offPress++) {
          window.__entranceDriveControl("throttle", true);
          step(250, 2);
          window.__entranceDriveControl("throttle", false);
        }
        var offRestAfter = copy(roomState());
        var offCheckpoint = window.__captureCheckpointSystems().entrance;
        window.__entranceDriveSetMotion(18, 0);
        window.__restoreCheckpointSystems({ entrance: offCheckpoint }, "afterStage");
        var offRestoredBefore = copy(roomState());
        window.__entranceDriveControl("throttle", true);
        step(250, 4);
        window.__entranceDriveControl("throttle", false);
        report.steps.offEngineRest = {
          before: offRestBefore,
          repeated: offRestAfter,
          restoredBefore: offRestoredBefore,
          restoredAfter: copy(roomState())
        };
        window.__toggleEntrancePorscheEngine();

        setMotion(60, 3);
        window.__entranceDriveKey(new KeyboardEvent("keydown", {
          key: "Shift", code: "ShiftLeft", shiftKey: true
        }), true);
        window.__entranceDriveKey(new KeyboardEvent("keydown", {
          key: "ArrowDown", code: "ArrowDown", shiftKey: true
        }), true);
        var downshiftHeld = copy(state());
        window.__entranceDriveKey(new KeyboardEvent("keyup", {
          key: "Shift", code: "ShiftLeft"
        }), false);
        var downshiftClutchReleased = copy(state());
        window.__entranceDriveKey(new KeyboardEvent("keyup", {
          key: "ArrowDown", code: "ArrowDown"
        }), false);
        var downshiftReleased = copy(state());
        setMotion(40, 1);
        window.__entranceDriveKey(new KeyboardEvent("keydown", {
          key: "Shift", code: "ShiftLeft", shiftKey: true
        }), true);
        window.__entranceDriveKey(new KeyboardEvent("keydown", {
          key: "ArrowUp", code: "ArrowUp", shiftKey: true
        }), true);
        var upshiftHeld = copy(state());
        window.__entranceDriveKey(new KeyboardEvent("keyup", {
          key: "Shift", code: "ShiftLeft"
        }), false);
        var upshiftClutchReleased = copy(state());
        window.__entranceDriveKey(new KeyboardEvent("keyup", {
          key: "ArrowUp", code: "ArrowUp"
        }), false);
        report.steps.shiftPedalHandoff = {
          downHeld: downshiftHeld,
          downClutchReleased: downshiftClutchReleased,
          downReleased: downshiftReleased,
          upHeld: upshiftHeld,
          upClutchReleased: upshiftClutchReleased,
          upReleased: copy(state())
        };

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
        report.steps.benchmark100 = benchmark100();

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

        setMotion(24, 1);
        window.__entranceDriveControl("throttle", true);
        step(20, 8);
        var shutdownBefore = copy(roomState());
        window.__toggleEntrancePorscheEngine();
        var shutdownImmediate = copy(roomState());
        step(100, 6);
        report.steps.engineShutdown = {
          before: shutdownBefore,
          immediate: shutdownImmediate,
          after: copy(roomState())
        };
        window.__toggleEntrancePorscheEngine();

        setMotion(.24, 0);
        step(10, 1);
        var forwardStatic = copy(state());
        setMotion(-.24, 0);
        step(10, 1);
        var reverseStatic = copy(state());
        setMotion(8, 0);
        step(1000, 1);
        var engineOnLowCoast = copy(state());
        setMotion(-8, 0);
        step(1000, 1);
        var engineOnReverseCoast = copy(state());
        setMotion(8, 0);
        window.__entranceDriveControl("throttle", true);
        step(1000, 1);
        var revvingNeutralCoast = copy(state());
        window.__entranceDriveControl("throttle", false);
        setMotion(60, 0);
        step(1000, 1);
        var normalCoast = copy(state());
        window.__toggleEntrancePorscheEngine();
        setMotion(8, 0);
        step(1000, 1);
        var engineOffLowCoast = copy(state());
        window.__toggleEntrancePorscheEngine();
        report.steps.friction = {
          forwardStatic: forwardStatic,
          reverseStatic: reverseStatic,
          engineOnLow: engineOnLowCoast,
          engineOnReverse: engineOnReverseCoast,
          revvingNeutral: revvingNeutralCoast,
          normal: normalCoast,
          engineOffLow: engineOffLowCoast
        };

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
        window.__entranceRoadtripDevStart();
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
        attended = true;
        window.dispatchEvent(new Event("focus"));
        window.__toggleEntrancePorscheEngine();
        var offResumeBefore = copy(roomState());
        for (var resumePress = 0; resumePress < 3; resumePress++) {
          window.__entranceDriveControl("throttle", true);
          window.__entranceDriveControl("throttle", false);
        }
        report.steps.offEngineRoadtripResume = {
          before: offResumeBefore,
          after: copy(roomState())
        };

        window.__exitEntranceRoadtrip();
        window.__entranceDriveSetMotion(12, 0);
        var forwardCoastBefore = copy(state());
        step(100, 4);
        var forwardCoastAfter = copy(state());
        window.__entranceDriveSetMotion(-12, 0);
        var reverseCoastBefore = copy(state());
        step(100, 4);
        report.steps.offEngineCoast = {
          forwardBefore: forwardCoastBefore,
          forwardAfter: forwardCoastAfter,
          reverseBefore: reverseCoastBefore,
          reverseAfter: copy(state())
        };

        window.__toggleEntrancePorscheEngine();
        setMotion(139, 3);
        window.__entranceDriveControl("steerLeft", true);
        window.__entranceDriveControl("brake", true);
        step(20, 1);
        var belowSpin = copy(state());
        window.__entranceDriveControl("brake", false);
        window.__entranceDriveControl("steerLeft", false);
        setMotion(141, 3);
        window.__entranceDriveControl("steerLeft", true);
        window.__entranceDriveControl("brake", true);
        step(20, 1);
        report.steps.brakeSpinBoundary = { below: belowSpin, above: copy(state()) };
        window.__entranceDriveControl("brake", false);
        window.__entranceDriveControl("steerLeft", false);
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
var shiftHandoff = s.shiftPedalHandoff;
check(shiftHandoff && shiftHandoff.downHeld.gear === 2 && shiftHandoff.downHeld.holds.clutch &&
  !shiftHandoff.downHeld.holds.brake && !shiftHandoff.downClutchReleased.holds.clutch &&
  shiftHandoff.downClutchReleased.holds.brake && !shiftHandoff.downReleased.holds.brake &&
  shiftHandoff.upHeld.gear === 2 && shiftHandoff.upHeld.holds.clutch &&
  shiftHandoff.upHeld.holds.throttle && !shiftHandoff.upClutchReleased.holds.clutch &&
  shiftHandoff.upClutchReleased.holds.throttle && !shiftHandoff.upReleased.holds.throttle,
  "shift arrows hand throttle/brake to the held arrow only after the clutch gesture", shiftHandoff);
var offRest = s.offEngineRest;
check(offRest && !offRest.before.car.engineOn && !offRest.repeated.car.engineOn &&
  offRest.before.drive.speed === 0 && offRest.repeated.drive.speed === 0 &&
  offRest.before.drive.position === offRest.repeated.drive.position &&
  offRest.before.drive.odometerKm === offRest.repeated.drive.odometerKm &&
  !offRest.restoredBefore.car.engineOn && !offRest.restoredAfter.car.engineOn &&
  offRest.restoredBefore.drive.speed === 0 && offRest.restoredAfter.drive.speed === 0 &&
  offRest.restoredBefore.drive.position === offRest.restoredAfter.drive.position &&
  offRest.restoredBefore.drive.odometerKm === offRest.restoredAfter.drive.odometerKm,
  "repeated engine-off throttle stays exactly stopped before and after checkpoint restore", offRest);
check(s.firstLow && s.firstLow.after.speed >= s.firstLow.before.speed + 12 && s.firstLow.after.rpm >= 2250,
  "first gear pulls promptly through the low-RPM launch range", s.firstLow);
check(s.secondLow && s.secondLow.after.speed >= s.secondLow.before.speed + 9 &&
  s.secondLow.after.rpm >= s.secondLow.before.rpm + 550,
  "second gear builds wheel speed and RPM without the old low-rev wait", s.secondLow);
check(s.benchmark100 && s.benchmark100.elapsed >= 5600 && s.benchmark100.elapsed <= 6300 &&
  s.benchmark100.state.speed >= 100 && s.benchmark100.shifts.length === 1 &&
  s.benchmark100.shifts[0].from === 1 && s.benchmark100.state.gear === 2,
  "rolling-friction changes preserve the published 5.9-second 0–100 launch", s.benchmark100);
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
var shutdown = s.engineShutdown;
check(shutdown && shutdown.before.car.engineOn && shutdown.before.drive.holds.throttle &&
  !shutdown.immediate.car.engineOn && shutdown.immediate.drive.speed === 0 &&
  shutdown.immediate.drive.rpm === 0 && shutdown.immediate.drive.gear === 0 &&
  !shutdown.immediate.drive.holds.throttle && shutdown.after.drive.speed === 0,
  "switching off with throttle held clears every powered launch state and remains stopped", shutdown);
var friction = s.friction;
check(friction && friction.forwardStatic.speed === 0 && friction.reverseStatic.speed === 0,
  "static resistance snaps symmetric sub-quarter-km/h residuals exactly to rest", friction);
check(friction && friction.engineOnLow.speed === 0 && friction.engineOnReverse.speed === 0,
  "strong low-speed rolling resistance settles neutral coasting symmetrically", friction);
check(friction && Math.abs(friction.revvingNeutral.speed - friction.engineOnLow.speed) < .0001 &&
  Math.abs(friction.engineOffLow.speed - friction.engineOnLow.speed) < .0001 &&
  friction.revvingNeutral.rpm >= 7400 && friction.engineOffLow.rpm === 0,
  "neutral coasting uses the same wheel resistance whether revving, idling, or engine-off", friction);
check(friction && Math.abs(friction.normal.speed - 55.64) < .001,
  "normal-speed neutral coasting retains the prior resistance curve above the low-speed taper", friction);
var brakePitch = s.brakePitch;
check(brakePitch && brakePitch.hardStep.longitudinalDeceleration > brakePitch.shortStep.longitudinalDeceleration &&
  brakePitch.hardStep.noseDive > brakePitch.shortStep.noseDive * 10 &&
  brakePitch.shortStep.noseDive < .02 &&
  /^rotate\(-/.test(brakePitch.hardStep.pitchTransform),
  "nose-down pitch scales with measured deceleration and nearly disappears at crawling speed", brakePitch && {
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
var offResume = s.offEngineRoadtripResume;
check(offResume && !offResume.before.car.engineOn && offResume.before.drive.speed === 0 &&
  offResume.before.drive.roadtrip.active && offResume.before.drive.roadtrip.resumePending &&
  !offResume.after.car.engineOn && offResume.after.drive.speed === 0 &&
  offResume.after.drive.position === offResume.before.drive.position &&
  offResume.after.drive.odometerKm === offResume.before.drive.odometerKm &&
  offResume.after.drive.roadtrip.resumePending,
  "engine-off throttle cannot wake an attention-paused Road Trip", offResume);
var coast = s.offEngineCoast;
check(coast && coast.forwardBefore.speed === 12 && coast.forwardAfter.speed > 0 &&
  coast.forwardAfter.speed < coast.forwardBefore.speed &&
  coast.reverseBefore.speed === -12 && coast.reverseAfter.speed < 0 &&
  coast.reverseAfter.speed > coast.reverseBefore.speed,
  "engine-off forward and reverse motion retain passive coasting resistance", coast);
check(s.brakeSpinBoundary && s.brakeSpinBoundary.below.spins === 0 &&
  s.brakeSpinBoundary.below.facing === 1 && s.brakeSpinBoundary.above.spins === 1 &&
  s.brakeSpinBoundary.above.facing === -1 && s.brakeSpinBoundary.above.yaw === -180,
  "braking with steering stays stable at 139 km/h and flips at 141 km/h",
  s.brakeSpinBoundary);

console.log("");
if (failures) {
  console.log(failures + " drivetrain assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Porsche manual drivetrain assertions passed.");

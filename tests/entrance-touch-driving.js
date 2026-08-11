#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: window.__errs || [], steps: {} };
  function pointer(target, type, id, primary, x, y) {
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: "touch",
      button: 0, isPrimary: primary, clientX: x, clientY: y == null ? 100 : y
    }));
  }
  function hitSize(id) {
    var node = document.querySelector("#" + id + " .entrance-drive-hit");
    return { width: Number(node.getAttribute("width")), height: Number(node.getAttribute("height")) };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      report.steps.controlsBeforeIgnition = getComputedStyle(
        document.getElementById("entrance-drive-touch-controls")).display;
      window.__toggleEntrancePorscheEngine();
      report.steps.controlsAfterIgnition = getComputedStyle(
        document.getElementById("entrance-drive-touch-controls")).display;
      window.__entranceDriveTransmissionMode("auto", true);
      window.__entranceDriveRange("D");
      var throttle = document.getElementById("entrance-drive-throttle");
      var horn = document.getElementById("entrance-drive-horn");
      var steering = document.getElementById("entrance-drive-steering-touch");
      var steerPad = document.getElementById("entrance-drive-touch-steer");
      var pedalPad = document.getElementById("entrance-drive-touch-pedals");
      document.getElementById("entrance-drive-touch-controls").style.display = "block";
      document.body.appendChild(steerPad);
      document.body.appendChild(pedalPad);
      steerPad.style.cssText += ";display:block;position:fixed;left:10px;top:100px;width:160px";
      pedalPad.style.cssText += ";display:block;position:fixed;left:300px;top:80px;width:70px";
      var nativeSteerRect = steerPad.getBoundingClientRect();
      var nativePedalRect = pedalPad.getBoundingClientRect();
      report.steps.nativePadLayout = {
        steerHeight: nativeSteerRect.height,
        pedalHeight: nativePedalRect.height
      };
      steerPad.style.height = "60px";
      pedalPad.style.height = "140px";
      var hornHit = horn.querySelector(".entrance-drive-hit");
      report.steps.targets = {
        ignition: hitSize("entrance-drive-ignition"),
        clutch: hitSize("entrance-drive-clutch"),
        brake: hitSize("entrance-drive-brake"),
        throttle: hitSize("entrance-drive-throttle"),
        horn: {
          shape: hornHit.tagName.toLowerCase(),
          rx: Number(hornHit.getAttribute("rx")),
          ry: Number(hornHit.getAttribute("ry"))
        }
      };

      pointer(throttle, "pointerdown", 41, true, 100);
      pointer(horn, "pointerdown", 42, false, 200);
      pointer(horn, "pointermove", 42, false, 270);
      report.steps.throttleFirst = window.__entranceRoomState().drive;
      pointer(horn, "pointerup", 42, false, 270);
      pointer(throttle, "pointerup", 41, true, 100);

      pointer(horn, "pointerdown", 43, true, 200);
      pointer(horn, "pointermove", 43, true, 130);
      pointer(throttle, "pointerdown", 44, false, 100);
      report.steps.steeringFirst = window.__entranceRoomState().drive;
      pointer(throttle, "pointerup", 44, false, 100);
      pointer(horn, "pointerup", 43, true, 130);

      pointer(steering, "pointerdown", 45, true, 200);
      pointer(steering, "pointermove", 45, true, 270);
      report.steps.rimSteering = window.__entranceRoomState().drive;
      pointer(steering, "pointerup", 45, true, 270);
      var sr = steerPad.getBoundingClientRect(), pr = pedalPad.getBoundingClientRect();
      report.steps.padLayout = {
        shown: getComputedStyle(steerPad).pointerEvents === "auto" && getComputedStyle(pedalPad).pointerEvents === "auto",
        steer: { width: sr.width, height: sr.height },
        pedals: { width: pr.width, height: pr.height },
        holdBand: {
          top: parseFloat(getComputedStyle(pedalPad, "::after").top),
          bottom: parseFloat(getComputedStyle(pedalPad, "::after").bottom)
        }
      };
      pointer(pedalPad, "pointerdown", 51, true, pr.left + pr.width / 2, pr.top);
      pointer(steerPad, "pointerdown", 52, false, sr.right - 12, sr.top + sr.height / 2);
      report.steps.padCombo = window.__entranceRoomState().drive;
      pointer(pedalPad, "pointermove", 51, true, pr.left + pr.width / 2, pr.top + pr.height * .15);
      report.steps.padThrottleSmooth = window.__entranceRoomState().drive;
      window.__entranceDriveSetMotion(72, 3);
      pointer(pedalPad, "pointermove", 51, true, pr.left + pr.width / 2, pr.top + pr.height * .5);
      report.steps.padNeutral = window.__entranceRoomState().drive;
      window.__entranceDriveStep(1000);
      report.steps.padNeutralHeld = window.__entranceRoomState().drive;
      pointer(pedalPad, "pointermove", 51, true, pr.left + pr.width / 2, pr.top + pr.height * .85);
      report.steps.padBrakeSmooth = window.__entranceRoomState().drive;
      pointer(steerPad, "pointermove", 52, false, sr.left + sr.width * .75, sr.top + sr.height / 2);
      report.steps.padSmooth = window.__entranceRoomState().drive;
      pointer(pedalPad, "pointermove", 51, true, pr.left + pr.width / 2, pr.bottom);
      report.steps.padBrake = window.__entranceRoomState().drive;
      pointer(steerPad, "pointerup", 52, false, sr.left + sr.width * .75, sr.top + sr.height / 2);
      pointer(pedalPad, "pointerup", 51, true, pr.left + pr.width / 2, pr.bottom - 12);
      report.steps.padReleased = window.__entranceRoomState().drive;
      window.__entranceDriveStep(1000);
      report.steps.padReleaseHeld = window.__entranceRoomState().drive;

      pointer(pedalPad, "pointerdown", 61, true, pr.left + pr.width / 2, pr.bottom);
      pointer(pedalPad, "pointercancel", 61, true, pr.left + pr.width / 2, pr.bottom);
      report.steps.padCancelled = window.__entranceRoomState().drive;

      window.__entranceDriveSetMotion(84, 3);
      pointer(pedalPad, "pointerdown", 62, true, pr.left + pr.width / 2, pr.top);
      pointer(pedalPad, "pointerup", 62, true, pr.left + pr.width / 2, pr.top);
      report.steps.padThrottleReleased = window.__entranceRoomState().drive;
      window.__entranceDriveStep(1000);
      report.steps.padThrottleReleaseHeld = window.__entranceRoomState().drive;
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2400, {
  patchRaf: true,
  forceCoarsePointer: true,
  chromeFlags: "--window-size=390,844"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html Entrance two-finger touch driving:");
check(result && result.errors.length === 0, "touch harness has no uncaught page errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.controlsBeforeIgnition === "none" && steps.controlsAfterIgnition === "block",
  "touch steering and pedals stay hidden until ignition", {
    before: steps.controlsBeforeIgnition, after: steps.controlsAfterIgnition
  });
check(steps.targets && steps.targets.ignition.width >= 54 && steps.targets.ignition.height >= 57 &&
  steps.targets.clutch.width >= 48 && steps.targets.clutch.height >= 63 &&
  steps.targets.brake.width >= 54 && steps.targets.brake.height >= 63 &&
  steps.targets.throttle.width >= 58 && steps.targets.throttle.height >= 67,
  "ignition and pedal artwork carries enlarged invisible touch targets", steps.targets);
check(steps.targets && steps.targets.horn.shape === "ellipse" &&
  steps.targets.horn.rx === 31 && steps.targets.horn.ry === 27,
  "only the steering-wheel center circle is a horn target", steps.targets && steps.targets.horn);
check(steps.nativePadLayout && steps.nativePadLayout.pedalHeight >= 168 &&
  steps.nativePadLayout.pedalHeight >= steps.nativePadLayout.steerHeight * 2.5,
  "the live pedal pad has extended analog travel", steps.nativePadLayout);
check(steps.throttleFirst && steps.throttleFirst.holds.throttle && steps.throttleFirst.steeringAngle > 0,
  "a secondary steering finger works while the primary finger holds the accelerator", steps.throttleFirst);
check(steps.steeringFirst && steps.steeringFirst.holds.throttle && steps.steeringFirst.steeringAngle < 0,
  "a secondary accelerator finger works while the primary finger steers", steps.steeringFirst);
check(steps.rimSteering && steps.rimSteering.steeringAngle > 0,
  "the broader wheel remains draggable without making its rim a horn target", steps.rimSteering);
check(steps.padLayout && steps.padLayout.shown && steps.padLayout.steer.width >= 132 &&
  steps.padLayout.pedals.height >= 112 &&
  Math.abs(steps.padLayout.holdBand.top / steps.padLayout.pedals.height - .3) < .01 &&
  Math.abs(steps.padLayout.holdBand.bottom / steps.padLayout.pedals.height - .3) < .01,
  "coarse pointers get visible horizontal and vertical driving pads", steps.padLayout);
check(steps.padCombo && steps.padCombo.holds.throttle && steps.padCombo.steeringAngle > 0 &&
  steps.padCombo.touchControls.throttle === 1 && steps.padCombo.touchControls.steering > .7,
  "two fingers can steer and accelerate through the new pads simultaneously", steps.padCombo);
check(steps.padThrottleSmooth && steps.padThrottleSmooth.holds.throttle &&
  steps.padThrottleSmooth.touchControls.throttle > .2 &&
  steps.padThrottleSmooth.touchControls.throttle < .5 &&
  steps.padThrottleSmooth.touchControls.brake === 0,
  "the upper pedal travel provides progressive partial throttle", steps.padThrottleSmooth);
check(steps.padNeutral && !steps.padNeutral.holds.throttle && !steps.padNeutral.holds.brake &&
  steps.padNeutral.touchControls.throttle === 0 && steps.padNeutral.touchControls.brake === 0 &&
  Math.abs(steps.padNeutral.touchControls.holdSpeed - 72) < .01 &&
  steps.padNeutralHeld && Math.abs(steps.padNeutralHeld.speed - 72) < .01,
  "the middle 40% holds its entry speed instead of coasting", {
    neutral: steps.padNeutral, held: steps.padNeutralHeld
  });
check(steps.padBrakeSmooth && steps.padBrakeSmooth.holds.brake &&
  !steps.padBrakeSmooth.holds.throttle && steps.padBrakeSmooth.touchControls.brake > .45 &&
  steps.padBrakeSmooth.touchControls.brake < .55,
  "the lower pedal travel provides progressive partial braking", steps.padBrakeSmooth);
check(steps.padSmooth && steps.padSmooth.touchControls.steering > .25 &&
  steps.padSmooth.touchControls.steering < .75,
  "steering strength follows smooth horizontal finger position", steps.padSmooth);
check(steps.padBrake && steps.padBrake.holds.brake && !steps.padBrake.holds.throttle &&
  steps.padBrake.touchControls.brake > .7,
  "sliding through the pink control switches smoothly from throttle to brake", steps.padBrake);
check(steps.padReleased && !steps.padReleased.holds.throttle && !steps.padReleased.holds.brake &&
  !steps.padReleased.touchControls.steeringActive && !steps.padReleased.touchControls.pedalsActive &&
  steps.padReleased.cruise.active &&
  Math.abs(steps.padReleased.cruise.target - steps.padReleased.speed) < .01 &&
  steps.padReleaseHeld && steps.padReleaseHeld.speed >= steps.padReleased.cruise.target,
  "lifting from the brake side latches release speed into cruise", {
    released: steps.padReleased, held: steps.padReleaseHeld
  });
check(steps.padCancelled && !steps.padCancelled.cruise.active &&
  !steps.padCancelled.touchControls.pedalsActive,
  "a cancelled or lost pedal touch cleans up without engaging cruise", steps.padCancelled);
check(steps.padThrottleReleased && steps.padThrottleReleased.cruise.active &&
  Math.abs(steps.padThrottleReleased.cruise.target - 84) < .01 &&
  steps.padThrottleReleaseHeld && steps.padThrottleReleaseHeld.speed >= 84,
  "lifting from the accelerator side also latches and holds release speed", {
    released: steps.padThrottleReleased, held: steps.padThrottleReleaseHeld
  });

if (failures) {
  console.log("\n" + failures + " Entrance touch-driving assertion(s) failed.");
  process.exit(1);
}
console.log("\nEntrance two-finger touch-driving assertions passed.");

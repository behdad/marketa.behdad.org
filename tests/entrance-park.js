#!/usr/bin/env node
// Automatic Park positively locks the car instead of preserving a sub-interlock roll.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: window.__errs || [] };
  function pointer(target, type, id, x, y) {
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: "touch",
      button: 0, isPrimary: true, clientX: x, clientY: y
    }));
  }
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__toggleEntrancePorscheEngine();
    window.__entranceDriveTransmissionMode("auto", true);
    window.__entranceDriveSetMotion(.49, 0);
    var parked = window.__entranceDriveRange("P");
    var before = window.__entranceRoomState().drive;
    window.__entranceDriveControl("throttle", true);
    window.__entranceDriveStep(1000);
    window.__entranceDriveControl("throttle", false);
    var after = window.__entranceRoomState().drive;
    report.park = {
      accepted: parked,
      beforeSpeed: before.speed,
      afterSpeed: after.speed,
      beforePosition: before.position,
      afterPosition: after.position,
      range: after.transmission.range,
      gear: after.gear
    };

    window.__toggleEntrancePorscheEngine();
    window.__entranceDriveSetMotion(9, 0);
    var pedalPad = document.getElementById("entrance-drive-touch-pedals");
    document.body.appendChild(pedalPad);
    pedalPad.style.cssText += ";display:block;position:fixed;left:300px;top:80px;width:70px;height:140px";
    var pedalRect = pedalPad.getBoundingClientRect();
    pointer(pedalPad, "pointerdown", 71, pedalRect.left + pedalRect.width / 2,
      pedalRect.top + pedalRect.height / 2);
    var heldBeforeIgnition = window.__entranceRoomState().drive;
    var positionBeforeIgnition = heldBeforeIgnition.position;
    window.__toggleEntrancePorscheEngine();
    window.__entranceDriveStep(1000);
    var restarted = window.__entranceRoomState().drive;
    var reverseAccepted = window.__entranceDriveRange("R");
    window.__entranceDriveStep(1000);
    var reversed = window.__entranceRoomState().drive;
    pointer(pedalPad, "pointerup", 71, pedalRect.left + pedalRect.width / 2,
      pedalRect.top + pedalRect.height / 2);
    report.restart = {
      heldSpeed: heldBeforeIgnition.touchControls.holdSpeed,
      speed: restarted.speed,
      positionBefore: positionBeforeIgnition,
      positionAfter: restarted.position,
      range: restarted.transmission.range,
      gear: restarted.gear
    };
    report.reverse = {
      accepted: reverseAccepted,
      speed: reversed.speed,
      positionBefore: restarted.position,
      positionAfter: reversed.position,
      range: reversed.transmission.range,
      gear: reversed.gear,
      heldSpeed: reversed.touchControls.holdSpeed
    };
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 180); });
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || !detail ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("rsvp.html automatic Park lock:");
check(result && result.errors.length === 0, "Park harness has no uncaught errors", result && result.errors);
var park = result && result.park;
check(park && park.accepted && park.range === "P" && park.gear === 0 &&
  park.beforeSpeed === 0 && park.afterSpeed === 0 && park.beforePosition === park.afterPosition,
  "Park cancels sub-interlock roll and throttle cannot move the car", park);
var restart = result && result.restart;
check(restart && restart.heldSpeed === 9 && restart.range === "P" && restart.gear === 0 &&
  restart.speed === 0 && restart.positionBefore === restart.positionAfter,
  "ignition in Park cannot restore a stale center-band held speed", restart);
var reverse = result && result.reverse;
check(reverse && reverse.accepted && reverse.range === "R" && reverse.gear === -1 &&
  reverse.heldSpeed === null && reverse.speed === 0 && reverse.positionBefore === reverse.positionAfter,
  "shifting Park to Reverse cannot restore stale forward momentum", reverse);

if (failed) process.exit(1);
console.log("Park-lock assertions passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__entranceRoomState().drive; }
  function localPoint(node, x, y) {
    var point = node.ownerSVGElement.createSVGPoint();
    point.x = x;
    point.y = y;
    point = point.matrixTransform(node.getScreenCTM());
    return { x: point.x, y: point.y };
  }
  function pointer(target, type, id, pointerType, point) {
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: id, pointerType: pointerType,
      button: 0, buttons: type === "pointerup" ? 0 : 1, isPrimary: true,
      clientX: point.x, clientY: point.y
    }));
  }
  function drag(shifter, lever, fromRange, toRange, id, pointerType) {
    var positions = { P: 69, R: 92, N: 116, D: 139 };
    var from = localPoint(shifter, 480, positions[fromRange]);
    var to = localPoint(shifter, 480, positions[toRange]);
    pointer(lever, "pointerdown", id, pointerType, from);
    pointer(shifter, "pointermove", id, pointerType, to);
    pointer(shifter, "pointerup", id, pointerType, to);
  }
  window.addEventListener("load", function () { setTimeout(async function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      document.getElementById("entrance-drive-coach-dismiss").dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }));
      window.__toggleEntrancePorscheEngine();
      window.__entranceDriveTransmissionMode("auto", true);
      var shifter = document.getElementById("entrance-drive-shifter");
      var lever = document.getElementById("entrance-drive-shifter-lever");
      window.__entranceDriveRange("P");
      lever.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 }));
      report.steps.clickForward = state();

      window.__entranceDriveRange("R");
      shifter.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 }));
      report.steps.rightBack = state();

      window.__entranceDriveRange("P");
      drag(shifter, lever, "P", "D", 32, "touch");
      report.steps.touchDrag = state();
      drag(shifter, lever, "D", "P", 33, "mouse");
      report.steps.mouseDrag = state();

    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 3000, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("rsvp.html automatic shifter gestures:");
check(result && result.errors.length === 0, "automatic shifter harness has no uncaught errors", result && result.errors);
var steps = result && result.steps || {};
check(steps.clickForward && steps.clickForward.transmission.range === "R",
  "clicking the automatic shifter advances one range toward D", steps.clickForward);
check(steps.rightBack && steps.rightBack.transmission.range === "P",
  "right-clicking moves one range toward P", steps.rightBack);
check(steps.touchDrag && steps.touchDrag.transmission.range === "D",
  "one touch drag can cross P, R, and N to select D", steps.touchDrag);
check(steps.mouseDrag && steps.mouseDrag.transmission.range === "P",
  "one desktop drag can cross N and R to select P", steps.mouseDrag);

if (failures) process.exit(1);
console.log("\nAutomatic shifter gesture assertions passed.");

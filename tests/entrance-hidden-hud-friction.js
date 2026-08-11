#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function state() { return window.__entranceRoomState(); }
  function step(seconds) {
    for (var index = 0; index < seconds; index++) window.__entranceDriveStep(1000);
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        Object.defineProperty(document, "hasFocus", {
          value: function () { return true; }, configurable: true
        });
        window.__getSfxCtx = function () { return null; };
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        await sleep(40);
        window.__openEntrancePorscheDriveHud();
        if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceDriveTransmissionMode("manual", true);

        window.__entranceDriveSetMotion(120, 4);
        step(5);
        report.steps.visible = state();

        window.__entranceDriveSetMotion(120, 4);
        window.__hideEntrancePorscheDriveHud();
        step(5);
        report.steps.hidden = state();
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 180);
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

console.log("rsvp.html hidden drive-HUD friction:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var visible = result.steps && result.steps.visible;
var hidden = result.steps && result.steps.hidden;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(visible && visible.drive.hud && visible.drive.speed > 50,
  "ordinary visible-HUD coasting keeps its gradual resistance", visible && visible.drive);
check(hidden && !hidden.drive.hud && Math.abs(hidden.drive.speed) <= .25,
  "hiding the HUD settles the unattended car rapidly", hidden && hidden.drive);
check(hidden && visible && Math.abs(hidden.drive.speed) < Math.abs(visible.drive.speed) * .01,
  "hidden-HUD friction is materially stronger than attended driving", {
    visible: visible && visible.drive.speed,
    hidden: hidden && hidden.drive.speed
  });
if (failures) process.exit(1);

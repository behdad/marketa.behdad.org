#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report">pending</pre>
<script>
window.addEventListener("load", function () {
  setTimeout(async function () {
    function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
    var low = window.__entranceDriveBrakeAudio(40, false);
    var street = window.__entranceDriveBrakeAudio(180, false);
    var highway = window.__entranceDriveBrakeAudio(180, true);
    Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
    window.__unlockAllRooms(); window.__goToStage("balcony"); window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__entranceRoadtripDevStart(); window.__entranceRoadtripSetRoute("banff", 0);
    var setupTrip = window.__entranceRoomState().drive.roadtrip;
    var beforeCount = window.__entranceRoomState().drive.brakeScreeches;
    window.__entranceDriveSetMotion(180, 4); window.__entranceDriveControl("brake", true);
    window.__entranceDriveStep(50); await sleep(760);
    var heldCount = window.__entranceRoomState().drive.brakeScreeches;
    window.__entranceDriveControl("brake", false); await sleep(330);
    window.__entranceDriveSetMotion(180, 4); window.__entranceDriveControl("brake", true);
    window.__entranceDriveStep(50); await sleep(40);
    var pressedAgainCount = window.__entranceRoomState().drive.brakeScreeches;
    window.__entranceDriveControl("brake", false);
    document.getElementById("__report").textContent = JSON.stringify({
      errors: window.__errs || [], low: low, street: street, highway: highway,
      setupTrip: setupTrip, beforeCount: beforeCount, heldCount: heldCount,
      pressedAgainCount: pressedAgainCount
    });
  }, 200);
});
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2600, { patchRaf: true });
if (!result) { console.error("highway ABS: no report"); process.exit(1); }
var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}
check(!result.errors.length, "no uncaught page errors", result.errors);
check(!result.low.active && result.low.absGain === 0 && result.low.screechGain === 0,
  "braking below 65 km/h schedules no brake layer", result.low);
check(result.street.active && result.street.absGain > 0 &&
  result.street.screechGain >= result.street.absGain * 25 &&
  result.street.repeatWhileHeld,
  "hard street braking retains subordinate ABS feedback", result.street);
check(result.highway.active && result.highway.absGain === 0 &&
  result.highway.screechGain < result.street.screechGain * .25 &&
  result.highway.screechToneGain < result.street.screechToneGain * .15 &&
  result.highway.duration < result.street.duration * .35 &&
  !result.highway.repeatWhileHeld,
  "Road Trip uses one brief quiet tire chirp instead of held-brake chatter", result.highway);
check(result.setupTrip && result.setupTrip.active &&
  result.heldCount === result.beforeCount + 1 && result.pressedAgainCount === result.heldCount + 1,
  "a held highway brake sounds once and a fresh press re-arms the cue", result);

if (failures) process.exit(1);
console.log("highway ABS: all checks passed");

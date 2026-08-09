#!/usr/bin/env node
// AUTO holds the selected lane on the final Banff approach until the Abraham turnoff begins.
"use strict";

var lib = require("./lib");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

var harness = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function drive() { return window.__entranceRoomState().drive; }
  function step(count, milliseconds) {
    for (var i = 0; i < count; i++) window.__entranceDriveStep(milliseconds);
  }
  function setup(mode, remaining, speed) {
    var trip = drive().roadtrip;
    window.__entranceRoadtripSetRouteDistance("banff", trip.banffDistanceRequired - remaining);
    // This negative-curvature phase reproduced AUTO's former rightward shoulder pull.
    window.__entranceRoadtripSetDistance(401);
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveTransmissionMode(mode, false);
    window.__entranceDriveSetMotion(speed, speed >= 70 ? 3 : 1);
    return copy(drive());
  }
  try {
    Object.defineProperty(document, "hasFocus", {
      value: function () { return true; }, configurable: true
    });
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
    window.__entranceRoadtripDevStart();

    var turnoffLength = drive().roadtrip.lakeTurnoffDistanceRequired;

    setup("auto", turnoffLength, 0);
    step(5, 100);
    report.stopped = copy(drive());

    setup("auto", turnoffLength, 100);
    step(5, 100);
    report.approach = copy(drive());

    setup("auto", 10, 100);
    step(1, 100);
    report.nearSign = copy(drive());

    setup("auto", turnoffLength, 100);
    window.__entranceDriveControl("steerLeft", true);
    step(5, 100);
    window.__entranceDriveControl("steerLeft", false);
    report.deliberateSteer = copy(drive());

    setup("auto", turnoffLength + 40, 100);
    step(5, 100);
    report.beforeApproach = copy(drive());

    setup("manual", turnoffLength, 100);
    step(5, 100);
    report.manual = copy(drive());
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  report.errors = (window.__errs || []).concat(report.errors);
  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 5000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-09-22&time=14:00#play",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});

console.log("rsvp.html Abraham turnoff AUTO assist:");
check(result && result.errors.length === 0,
  "turnoff-assist probe has no page errors", result && result.errors);
check(result && result.stopped && result.stopped.roadtrip.route === "banff" &&
  Math.abs(result.stopped.roadtrip.playerLane - .5) < .001,
  "a stopped AUTO car stays centred at the start of the final approach", result && result.stopped);
check(result && result.approach && result.approach.roadtrip.route === "banff" &&
  Math.abs(result.approach.roadtrip.playerLane - .5) < .001,
  "AUTO holds the selected lane at speed through the final Banff bend", result && result.approach);
check(result && result.nearSign && result.nearSign.roadtrip.route === "banff" &&
  Math.abs(result.nearSign.roadtrip.playerLane - .5) < .001,
  "AUTO still holds the lane immediately before the Abraham turnoff", result && result.nearSign);
check(result && result.deliberateSteer && result.deliberateSteer.roadtrip.playerLane < .48,
  "deliberate steering remains authoritative during the protected approach",
  result && result.deliberateSteer);
check(result && result.beforeApproach && result.beforeApproach.roadtrip.playerLane > .52,
  "ordinary AUTO curve assistance remains active before the final approach",
  result && result.beforeApproach);
check(result && result.manual && result.manual.roadtrip.playerLane > .56,
  "MANUAL retains the full bend load through the same approach", result && result.manual);

if (failures) process.exit(1);
console.log("Abraham turnoff AUTO-assist assertions passed.");

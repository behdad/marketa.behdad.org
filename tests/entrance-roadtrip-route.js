#!/usr/bin/env node
// Calgary-to-Banff route phases: flat six-lane approach, turnoff, mountain road.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<style>
#entrance-roadtrip-calgary-flat,
.entrance-roadtrip-season-art,
.entrance-roadtrip-mirror-season-art { transition: none !important; }
</style>
<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function opacity(id) { return Number(getComputedStyle(document.getElementById(id)).opacity); }
  function visible(selector) {
    return Array.prototype.filter.call(document.querySelectorAll(selector), function (node) {
      return node.getAttribute("visibility") !== "hidden";
    });
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();
        var room = document.getElementById("entrance-room");
        report.calgary = {
          state: state(),
          classes: room.getAttribute("class"),
          flat: opacity("entrance-roadtrip-calgary-flat"),
          mountains: opacity("entrance-roadtrip-day-far"),
          season: opacity("entrance-roadtrip-season-summer"),
          mirrorTerrain: opacity("entrance-roadtrip-mirror-terrain"),
          median: document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-median").getAttribute("d"),
          laneMarks: visible("#entrance-roadtrip-lane-marks path").length,
          speed110: visible('[data-roadtrip-furniture="speed-110"]').length
        };
        window.__entranceDriveSetMotion(100, 3);
        window.__entranceRoadtripSetLane(.05);
        report.medianBarrier = { state: state(), speed: window.__entranceRoomState().drive.speed };
        window.__entranceRoadtripSetLane(.5);

        window.__entranceRoadtripSetRoute("turnoff", 0);
        report.turnoff = {
          state: state(),
          classes: room.getAttribute("class"),
          sign: document.getElementById("entrance-roadtrip-banff-exit").getAttribute("visibility"),
          mountains: opacity("entrance-roadtrip-day-far"),
          season: opacity("entrance-roadtrip-season-summer")
        };
        window.__entranceRoadtripStepRouteDistance(state().turnoffDistanceRequired);
        window.__entranceRoadtripSetLane(.05);
        report.banff = {
          state: state(),
          classes: room.getAttribute("class"),
          flat: opacity("entrance-roadtrip-calgary-flat"),
          mountains: opacity("entrance-roadtrip-day-far"),
          season: opacity("entrance-roadtrip-season-summer"),
          sign: document.getElementById("entrance-roadtrip-banff-exit").getAttribute("visibility"),
          laneMarks: visible("#entrance-roadtrip-lane-marks path").length,
          speed90: visible('[data-roadtrip-furniture="speed-90"]').length
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
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

console.log("rsvp.html Calgary-to-Banff route:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
check(/ROADTRIP_CALGARY_DISTANCE = roadtripDistanceForSeconds\(ROADTRIP_CALGARY_SECONDS\)/.test(source) &&
  /ROADTRIP_TURNOFF_DISTANCE = roadtripDistanceForSeconds\(ROADTRIP_TURNOFF_SECONDS\)/.test(source),
  "the attended Calgary leg and right-turn approach own explicit travel distances");
check(/ROADTRIP_CALGARY_SPEED_LIMIT = 110/.test(source) &&
  /ROADTRIP_BANFF_SPEED_LIMIT = 90/.test(source) &&
  /ROADTRIP_POLICE_FIRST_DISTANCE = 1800/.test(source) &&
  /ROADTRIP_POLICE_REPEAT_DISTANCE = 2400/.test(source),
  "the route owns its posted limits and sparser police cadence");
check(/if \(roadtripState\.route === "calgary" \|\| roadtripState\.route === "camp"\) return 0;[\s\S]*?if \(roadtripState\.route === "turnoff"\)[\s\S]*?return scenic \* banffProgress \+ \.021 \* Math\.sin\(Math\.PI \* banffProgress\);/.test(source),
  "Calgary stays straight before smoothly entering the explicit exit turn");
check(/ROADTRIP_CALGARY_MEDIAN_FRACTION = \.14/.test(source) &&
  /ROADTRIP_CALGARY_ROAD_FRACTION = 1\.2/.test(source) &&
  /var calgaryFirstBoundary = ROADTRIP_CALGARY_MEDIAN_FRACTION \+ ROADTRIP_CALGARY_LANE_FRACTION/.test(source),
  "the wide median expands both carriageways instead of narrowing their three equal lanes");

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the route phases render without uncaught errors",
  result && result.errors);
var calgary = result && result.calgary || {};
var calgaryState = calgary.state || {};
check(calgaryState.route === "calgary" && calgaryState.routeElapsed < calgaryState.calgarySeconds &&
  calgaryState.playerLane === 3.32 && calgaryState.maxLane === 3.32 &&
  Math.abs(calgaryState.laneFraction - (1.2 - .14) / 3) < .0001,
  "a fresh run starts on Calgary's outer shoulder with six-lane geometry", calgaryState);
check(calgaryState.speedLimit === 110 && calgaryState.enforcementSpeed === 130 &&
  calgaryState.policeFirstDistance === 1800 && calgaryState.policeRepeatDistance === 2400,
  "Calgary reports 110 km/h with a 20 km/h tolerance and fewer patrols", calgaryState);
check(/roadtrip-route-calgary/.test(calgary.classes || "") && calgary.flat === 1 &&
  calgary.mountains === 0 && calgary.season === 0 && calgary.mirrorTerrain === 0,
  "Calgary shows flat prairie while suppressing mountains in both views", calgary);
check(calgary.median && calgary.laneMarks >= 24 && calgary.laneMarks % 4 === 0 && calgary.speed110 > 0,
  "Calgary paints a divided road, four lane boundaries, and 110 signs", calgary);
var medianBarrier = result && result.medianBarrier || {};
check(medianBarrier.state && medianBarrier.state.playerLane === .28 &&
  medianBarrier.state.medianBarrier && medianBarrier.speed < 100,
  "the dirt median physically blocks and slows a crossing Porsche", medianBarrier);

var turnoff = result && result.turnoff || {};
check(turnoff.state && turnoff.state.route === "turnoff" && /roadtrip-route-turnoff/.test(turnoff.classes || "") &&
  turnoff.sign === "visible" && turnoff.mountains === 0 && turnoff.season === 0,
  "the right-turn approach advertises Banff without revealing mountains early", turnoff);

var banff = result && result.banff || {};
var banffState = banff.state || {};
check(banffState.route === "banff" &&
  Math.abs(banffState.turnoffDistance - banffState.turnoffDistanceRequired) < .001 &&
  banffState.maxLane === 2.32 && banffState.laneFraction === .5 &&
  banffState.playerLane === .05 && !banffState.medianBarrier,
  "the completed turn switches to the narrower Banff road", banffState);
check(banffState.speedLimit === 90 && banffState.enforcementSpeed === 110 &&
  /roadtrip-route-banff/.test(banff.classes || "") && banff.flat === 0 &&
  banff.mountains === 1 && banff.season === 1 && banff.sign === "hidden" && banff.speed90 > 0 &&
  banff.laneMarks > 0 && banff.laneMarks % 2 === 0,
  "Banff restores mountain scenery, four lanes, curves, and 90 signs", banff);

if (failures) process.exit(1);
console.log("Calgary-to-Banff route checks passed.");

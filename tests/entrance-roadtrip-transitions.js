#!/usr/bin/env node
// Attended route changes keep scenery, parallax, and live traffic continuous.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function blend() { return state().routeBlend; }
  function geometry() {
    var world = document.getElementById("entrance-roadtrip-world");
    return {
      median: Number(world.getAttribute("data-roadtrip-median-fraction")),
      road: Number(world.getAttribute("data-roadtrip-road-fraction")),
      outer: Number(world.getAttribute("data-roadtrip-outer-fraction")),
      lane: Number(world.getAttribute("data-roadtrip-lane-opacity")),
      extraLane: Number(world.getAttribute("data-roadtrip-extra-lane-opacity")),
      innerLane: Number(world.getAttribute("data-roadtrip-inner-lane-fraction"))
    };
  }
  function sampleRoute(route, fraction, required) {
    window.__entranceRoadtripSetRouteDistance(route, required * fraction);
    return { state: state(), blend: blend(), geometry: geometry() };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart();

      window.__entranceRoadtripSetRoute("camp", 0);
      var finishedCheckpoint = window.__captureCheckpointSystems().entrance;
      finishedCheckpoint.drive.roadtrip.campActive = true;
      finishedCheckpoint.drive.roadtrip.campFireBuilt = true;
      finishedCheckpoint.drive.roadtrip.campFireLit = false;
      finishedCheckpoint.drive.roadtrip.stargazing = {
        progress: { cassiopeia: 5, "ursa-major": 7, "ursa-minor": 7 },
        completed: ["cassiopeia", "ursa-major", "ursa-minor"],
        complete: true,
        wisdomDismissed: true,
        wisdomHandoffReady: false,
        sleepPhase: "congrats",
        sleepElapsed: 0
      };
      window.__restoreCheckpointSystems({ entrance: finishedCheckpoint }, "afterStage");
      report.previousFinale = {
        phase: window.__entranceRoadtripCampSleepState().phase,
        visible: document.getElementById("entrance-roadtrip-camp").classList.contains("camp-sleep-congrats"),
        transform: getComputedStyle(document.getElementById("entrance-roadtrip-camp")).transform
      };
      window.__entranceRoadtripDevStart();
      report.highwayCamp = {
        phase: window.__entranceRoadtripCampSleepState().phase,
        visible: document.getElementById("entrance-roadtrip-camp").classList.contains("camp-sleep-congrats"),
        transform: getComputedStyle(document.getElementById("entrance-roadtrip-camp")).transform,
        campRoute: document.getElementById("entrance-room").classList.contains("roadtrip-route-camp"),
        finOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-fin")).opacity,
        nightOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-night-sky")).opacity,
        darknessOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-darkness")).opacity
      };

      var initial = state();
      report.calgaryBanff = [.25, .5, .75].map(function (fraction) {
        return sampleRoute("turnoff", fraction, initial.turnoffDistanceRequired);
      });
      report.banffAbraham = [.25, .5, .75].map(function (fraction) {
        return sampleRoute("lake-turnoff", fraction, initial.lakeTurnoffDistanceRequired);
      });

      window.__entranceRoadtripSetRouteDistance("banff", 200);
      window.__entranceRoadtripSetDistance(120);
      var firstParallax = window.__entranceRoomState().drive.scenery.roadtrip;
      window.__entranceRoadtripSetDistance(360);
      var secondParallax = window.__entranceRoomState().drive.scenery.roadtrip;
      report.parallax = { first: firstParallax, second: secondParallax };

      window.__entranceRoadtripSetDistance(0);
      window.__entranceRoadtripSetRouteDistance("turnoff", initial.turnoffDistanceRequired * .72);
      window.__entranceRoadtripSpawn("car", 2.5, 92, { speedKmh: 118 });
      window.__entranceRoadtripSpawn("truck", -2.5, 78, { speedKmh: 88 });
      window.__entranceRoadtripSpawn("heart", 1.5, 62);
      var calgaryTrafficBefore = state();
      window.__entranceRoadtripStepRouteDistance(initial.turnoffDistanceRequired);
      report.calgaryTraffic = { before: calgaryTrafficBefore, after: state() };

      window.__entranceRoadtripSetDistance(0);
      window.__entranceRoadtripSetRouteDistance("lake-turnoff", initial.lakeTurnoffDistanceRequired * .72);
      window.__entranceRoadtripSpawn("car", 1.5, 92, { speedKmh: 103 });
      window.__entranceRoadtripSpawn("truck", -1.5, 78, { speedKmh: 82 });
      window.__entranceRoadtripSpawn("mushroom", .5, 62);
      var abrahamTrafficBefore = state();
      window.__entranceRoadtripStepRouteDistance(initial.lakeTurnoffDistanceRequired);
      report.abrahamTraffic = { before: abrahamTrafficBefore, after: state() };

      window.__entranceRoadtripSetRouteDistance("abraham", initial.abrahamDistanceRequired - 20);
      window.__entranceRoadtripSetLane(1);
      window.__entranceDriveSetMotion(80, 3);
      var campFrames = [];
      for (var index = 0; index < 24 && state().route !== "camp"; index++) {
        window.__entranceDriveStep(100);
        var frame = state();
        if (frame.campExitLatched && frame.route !== "camp") {
          campFrames.push({ speed: window.__entranceRoomState().drive.speed, blend: frame.routeBlend });
        }
      }
      report.camp = { frames: campFrames, final: state() };
      report.arrivedCamp = {
        phase: window.__entranceRoadtripCampSleepState().phase,
        visible: document.getElementById("entrance-roadtrip-camp").classList.contains("camp-sleep-congrats"),
        transform: getComputedStyle(document.getElementById("entrance-roadtrip-camp")).transform,
        finOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-fin")).opacity,
        nightOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-night-sky")).opacity,
        darknessOpacity: getComputedStyle(document.getElementById("entrance-roadtrip-camp-finale-darkness")).opacity
      };

      function campPresentation() {
        return {
          route: state().route,
          campOpacity: document.getElementById("entrance-roadtrip-camp").style.opacity,
          roadOpacity: document.getElementById("entrance-roadtrip-road").style.opacity,
          campClass: document.getElementById("entrance-room").classList.contains("roadtrip-route-camp")
        };
      }
      var campChoice = document.querySelector('[data-roadtrip-reentry-choice="camp"]');
      window.__exitEntranceRoadtrip();
      campChoice.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.firstCampReentry = campPresentation();
      window.__exitEntranceRoadtrip();
      campChoice.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.secondCampReentry = campPresentation();
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 220); });
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
function laneBounded(rows, limit) {
  return rows.every(function (row) { return Math.abs(row.lane) <= limit; });
}

console.log("loft-day.html attended route-transition continuity:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(/function roadtripRouteBlend\(\)/.test(source) &&
  /travel \* \.018/.test(source) && /travel \* \.055/.test(source) && /travel \* \.12/.test(source),
  "one route blend owns the three distance-parallax rates");
check(/function transitionRoadtripTraffic\(previousRoute\)/.test(source) &&
  /transitionRoadtripTraffic\(previousTurnoffRoute\)/.test(source) &&
  /transitionRoadtripTraffic\(previousLakeTurnoffRoute\)/.test(source),
  "attended road-width changes preserve and retarget the bounded traffic pool");
check(/function roadtripGeometryProfile\(\)/.test(source) &&
  /var geometry = roadtripGeometryProfile\(\);/.test(source),
  "one route profile owns the visible road-width interpolation");
var startRoadtripSource = source.slice(source.indexOf("function startRoadtrip("),
  source.indexOf("function restoreRoadtripRun(", source.indexOf("function startRoadtrip(")));
var arriveRoadtripCampSource = source.slice(source.indexOf("function arriveRoadtripCamp("),
  source.indexOf("function backFromRoadtrip(", source.indexOf("function arriveRoadtripCamp(")));
check(!/resetRoadtripCampSessionBeforeReveal/.test(startRoadtripSource) &&
  arriveRoadtripCampSource.indexOf("resetRoadtripCampSessionBeforeReveal();") <
    arriveRoadtripCampSource.indexOf('roadtripState.route = "camp";'),
  "fresh Road Trips preserve hidden Camping until arrival resets it before reveal");

var result = lib.runPageSync("loft-day.html", HARNESS, 5200, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the transition sweep has no uncaught errors",
  result && result.errors);
check(result && result.previousFinale && result.previousFinale.phase === "congrats" &&
  result.previousFinale.visible === true && result.previousFinale.transform !== "none" &&
  result.highwayCamp && result.highwayCamp.phase === "congrats" && result.highwayCamp.visible === true &&
  result.highwayCamp.transform !== "none" && result.highwayCamp.campRoute === false &&
  Number(result.highwayCamp.finOpacity) > 0 && Number(result.highwayCamp.nightOpacity) > 0 &&
  Number(result.highwayCamp.darknessOpacity) > 0 &&
  result.arrivedCamp && result.arrivedCamp.phase === "idle" && result.arrivedCamp.visible === false &&
  result.arrivedCamp.transform === "none" && Number(result.arrivedCamp.finOpacity) === 0 &&
  Number(result.arrivedCamp.nightOpacity) === 0 && Number(result.arrivedCamp.darknessOpacity) === 0,
  "the previous ~fin~ pan stays hidden through the drive and clears at Camping arrival",
  result && { previousFinale: result.previousFinale, highwayCamp: result.highwayCamp,
    arrivedCamp: result.arrivedCamp });

var cb = result && result.calgaryBanff || [];
check(cb.length === 3 && cb[0].blend.calgary > cb[1].blend.calgary &&
  cb[1].blend.calgary > cb[2].blend.calgary && cb[0].blend.banff < cb[1].blend.banff &&
  cb[1].blend.banff < cb[2].blend.banff && cb.every(function (row) {
    return Math.abs(row.blend.calgary + row.blend.banff - 1) < .001;
  }), "Calgary dissolves monotonically into Banff throughout the physical turnoff", cb);
check(cb.length === 3 && cb[0].geometry.median > cb[1].geometry.median &&
  cb[1].geometry.median > cb[2].geometry.median &&
  cb[0].geometry.road > cb[1].geometry.road && cb[1].geometry.road > cb[2].geometry.road &&
  cb[0].geometry.outer > cb[1].geometry.outer && cb[1].geometry.outer > cb[2].geometry.outer &&
  cb[0].geometry.extraLane > cb[1].geometry.extraLane &&
  cb[1].geometry.extraLane > cb[2].geometry.extraLane &&
  cb[0].geometry.innerLane < cb[1].geometry.innerLane &&
  cb[1].geometry.innerLane < cb[2].geometry.innerLane,
  "Calgary's median, shoulders, and surplus lanes narrow continuously into Banff", cb);
var ba = result && result.banffAbraham || [];
check(ba.length === 3 && ba[0].blend.banff > ba[1].blend.banff &&
  ba[1].blend.banff > ba[2].blend.banff && ba[0].blend.abraham < ba[1].blend.abraham &&
  ba[1].blend.abraham < ba[2].blend.abraham && ba.every(function (row) {
    return Math.abs(row.blend.banff + row.blend.abraham - 1) < .001;
  }), "Banff's light and mountains dissolve monotonically into Abraham Lake", ba);
check(ba.length === 3 && ba.every(function (row) {
    return row.geometry.median === 0 && row.geometry.road === 1 && row.geometry.outer === 1.15;
  }) && ba[0].geometry.lane > ba[1].geometry.lane &&
  ba[1].geometry.lane > ba[2].geometry.lane,
  "Banff's lane divider fades continuously into Abraham's single-lane road", ba);

var parallax = result && result.parallax || {};
var first = parallax.first || {};
var second = parallax.second || {};
var farShift = first.far && second.far ? second.far[0] - first.far[0] : 0;
var midShift = first.mid && second.mid ? second.mid[0] - first.mid[0] : 0;
var nearShift = first.near && second.near ? second.near[0] - first.near[0] : 0;
check(Math.abs(farShift) > 1 && Math.abs(midShift) > Math.abs(farShift) &&
  Math.abs(nearShift) > Math.abs(midShift),
  "far, middle, and near scenery retain distinct metre-driven depth", { farShift: farShift, midShift: midShift, nearShift: nearShift });

var calgaryTraffic = result && result.calgaryTraffic || {};
check(calgaryTraffic.before && calgaryTraffic.after &&
  calgaryTraffic.after.route === "banff" &&
  calgaryTraffic.after.entityCount === calgaryTraffic.before.entityCount &&
  laneBounded(calgaryTraffic.after.entities, 1.5) &&
  Math.abs((calgaryTraffic.after.nextSpawnDistance - calgaryTraffic.after.distance) -
    (calgaryTraffic.before.nextSpawnDistance - calgaryTraffic.before.distance)) < .001,
  "Calgary traffic flows into Banff without a pool or cadence reset", calgaryTraffic);
var abrahamTraffic = result && result.abrahamTraffic || {};
var beforeGap = abrahamTraffic.before ?
  abrahamTraffic.before.nextSpawnDistance - abrahamTraffic.before.distance : 0;
var afterGap = abrahamTraffic.after ?
  abrahamTraffic.after.nextSpawnDistance - abrahamTraffic.after.distance : 0;
check(abrahamTraffic.before && abrahamTraffic.after &&
  abrahamTraffic.after.route === "abraham" &&
  abrahamTraffic.after.entityCount === abrahamTraffic.before.entityCount &&
  laneBounded(abrahamTraffic.after.entities, .5) &&
  Math.abs(afterGap - Math.max(8, beforeGap * 1.8)) < .001,
  "Banff traffic rebases safely and thins into Abraham's quieter cadence", {
    beforeGap: beforeGap, afterGap: afterGap, traffic: abrahamTraffic
  });

var camp = result && result.camp || {};
check(camp.frames && camp.frames.length >= 2 && camp.frames.every(function (frame) {
  return frame.blend.camp === 0 && frame.blend.road === 1 && frame.blend.abraham === 1;
  }) && camp.final && camp.final.route === "camp" && camp.final.routeBlend.camp === 1 &&
  camp.final.routeBlend.road === 0,
  "the automatic slowdown keeps the complete road frame until the stopped Camping handoff", camp);
function cleanCampReentry(row) {
  return row && row.route === "camp" && row.campClass === true && Number(row.campOpacity) === 1 &&
    Number(row.roadOpacity) === 0;
}
check(cleanCampReentry(result && result.firstCampReentry) &&
  cleanCampReentry(result && result.secondCampReentry),
  "consecutive Camping re-entries both repaint the campsite instead of alternating with the road",
  result && { first: result.firstCampReentry, second: result.secondCampReentry });

if (failures) process.exit(1);
console.log("Attended route-transition continuity checks passed.");

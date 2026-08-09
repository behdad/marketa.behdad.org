#!/usr/bin/env node
// Abraham Lake's Camping exit is optional, recurring, and durable.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: {} };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function begin() {
    window.__entranceRoadtripDevStart();
    if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
  }
  function setAbraham(distance, lane, speed) {
    window.__entranceRoadtripSetRouteDistance("abraham", distance);
    window.__entranceRoadtripSetLane(lane);
    window.__entranceDriveSetMotion(speed, speed ? 2 : 0);
  }
  function visual() {
    var sign = document.getElementById("entrance-roadtrip-camp-exit");
    var spur = document.getElementById("entrance-roadtrip-camp-spur");
    var road = document.getElementById("entrance-roadtrip-road");
    return {
      sign: sign.getAttribute("visibility"),
      takeable: sign.getAttribute("data-roadtrip-takeable"),
      roadRight: Number(sign.getAttribute("data-roadtrip-road-right")),
      signLeft: Number(sign.getAttribute("data-roadtrip-sign-left")),
      signPostX: Number(sign.getAttribute("data-roadtrip-sign-post-x")),
      transform: sign.getAttribute("transform"),
      spur: spur.getAttribute("visibility"),
      shoulder: spur.querySelector(".entrance-roadtrip-camp-spur-shoulder").getAttribute("d"),
      asphalt: spur.querySelector(".entrance-roadtrip-camp-spur-asphalt").getAttribute("d"),
      innerEdge: spur.querySelector(".entrance-roadtrip-camp-spur-inner-edge").getAttribute("d"),
      outerEdge: spur.querySelector(".entrance-roadtrip-camp-spur-outer-edge").getAttribute("d"),
      junctionX: Number(spur.getAttribute("data-roadtrip-junction-x")),
      junctionY: Number(spur.getAttribute("data-roadtrip-junction-y")),
      destinationX: Number(spur.getAttribute("data-roadtrip-destination-x")),
      destinationY: Number(spur.getAttribute("data-roadtrip-destination-y")),
      junctionInnerX: Number(spur.getAttribute("data-roadtrip-junction-inner-x")),
      junctionRoadRightX: Number(spur.getAttribute("data-roadtrip-junction-road-right-x")),
      junctionOuterX: Number(spur.getAttribute("data-roadtrip-junction-outer-x")),
      bendInnerX: Number(spur.getAttribute("data-roadtrip-bend-inner-x")),
      bendOuterX: Number(spur.getAttribute("data-roadtrip-bend-outer-x")),
      bendY: Number(spur.getAttribute("data-roadtrip-bend-y")),
      innerEdgeStartX: Number(spur.getAttribute("data-roadtrip-inner-edge-start-x")),
      innerEdgeStartY: Number(spur.getAttribute("data-roadtrip-inner-edge-start-y")),
      outerEdgeStartX: Number(spur.getAttribute("data-roadtrip-outer-edge-start-x")),
      outerEdgeStartY: Number(spur.getAttribute("data-roadtrip-outer-edge-start-y")),
      shoulderMouthInnerX: Number(spur.getAttribute("data-roadtrip-shoulder-mouth-inner-x")),
      destinationInnerX: Number(spur.getAttribute("data-roadtrip-destination-inner-x")),
      destinationOuterX: Number(spur.getAttribute("data-roadtrip-destination-outer-x")),
      nearWidth: Number(spur.getAttribute("data-roadtrip-near-width")),
      farWidth: Number(spur.getAttribute("data-roadtrip-far-width")),
      speedClearances: Array.prototype.filter.call(
        document.querySelectorAll("[data-roadtrip-furniture^='speed-']"),
        function (node) { return node.getAttribute("visibility") === "visible"; }
      ).map(function (node) {
        return Number(node.getAttribute("data-roadtrip-turn-sign-clearance"));
      }),
      afterRoad: !!(road.compareDocumentPosition(spur) & Node.DOCUMENT_POSITION_FOLLOWING)
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        var flashed = [];
        var originalCaptionOverlay = window.__captionOverlay;
        window.__captionOverlay = function (key) {
          flashed.push(key);
          return originalCaptionOverlay.apply(this, arguments);
        };
        window.__unlockAllRooms();
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
        window.__setSecondRound(true, { releaseHeld: false });
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        begin();

        var initial = roadtrip();
        var first = initial.abrahamDistanceRequired;
        var repeat = initial.campExitRepeatDistance;
        var nominalSecond = initial.routePaceKmh / 3.6;

        setAbraham(first - 8.2 * nominalSecond, .5, 50);
        flashed.length = 0;
        window.__entranceDriveStep(500);
        report.firstApproachFeedback = flashed.slice();
        setAbraham(first - 14 * nominalSecond, .5, 50);
        report.farExit = { state: roadtrip(), visual: visual() };
        setAbraham(first - 7 * nominalSecond, .5, 50);
        report.midExit = { state: roadtrip(), visual: visual() };
        setAbraham(first - nominalSecond, .5, 50);
        report.firstExit = { state: roadtrip(), visual: visual() };
        window.__entranceRoadtripSetDistance(158);
        setAbraham(first - nominalSecond, .5, 50);
        report.curvedExitRight = visual();
        window.__entranceRoadtripSetDistance(260);
        setAbraham(first - nominalSecond, .5, 50);
        report.curvedExitLeft = visual();
        window.__entranceRoadtripSetDistance(0);
        setAbraham(first + 3 * nominalSecond, .5, 50);
        report.missed = { state: roadtrip(), visual: visual() };

        window.__entranceRoadtripSetRouteDistance("calgary", 30);
        report.calgary = visual();
        window.__entranceRoadtripSetRouteDistance("banff", 30);
        report.banff = visual();

        setAbraham(first + repeat - nominalSecond, .5, 50);
        report.repeatExit = { state: roadtrip(), visual: visual() };
        setAbraham(first + repeat - 8.2 * nominalSecond, .5, 50);
        flashed.length = 0;
        window.__entranceDriveStep(500);
        report.repeatApproachFeedback = flashed.slice();

        window.__entranceRoadtripSetDistance(0);
        report.laneViews = {};
        [["left", -.5], ["centre", .5], ["right", 1], ["shoulder", 1.32]].forEach(function (row) {
          setAbraham(first - nominalSecond, row[1], 50);
          report.laneViews[row[0]] = visual();
        });

        setAbraham(first + 13 * nominalSecond, .5, 42);
        window.__exitEntranceRoadtrip();
        var checkpoint = window.__captureCheckpointSystems().entrance;
        report.saved = checkpoint.drive.roadtrip.pausedRun && checkpoint.drive.roadtrip.pausedRun.state;
        window.__restoreCheckpointSystems({ entrance: checkpoint }, "afterStage");
        report.restored = roadtrip();

        begin();
        setAbraham(first - .5 * nominalSecond, 1, 80);
        window.__entranceDriveStep(100);
        report.slowing = window.__entranceRoomState();
        window.__entranceDriveStep(1000);
        report.arrived = window.__entranceRoomState();
        report.campResume = window.__captureCheckpointSystems().entrance.drive.roadtrip.pausedRun;

        begin();
        setAbraham(first - nominalSecond, 1, 0);
        window.__entranceDriveStep(100);
        report.noMomentum = window.__entranceRoomState();
      } catch (error) {
        report.errors.runtime = String(error && error.stack || error);
      }
      report.errors.console = window.__errs || [];
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

function run(coarse) {
  return lib.runPageSync("rsvp.html", HARNESS, 1200, {
    forceMotion: true,
    seedRandom: true,
    forceCoarsePointer: coarse,
    urlSuffix: "?date=2026-07-15&time=12:00#play",
    chromeFlags: "--window-size=1100,900"
  });
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}
function clean(result) {
  return result && !result.errors.runtime && result.errors.console && result.errors.console.length === 0;
}
function camp(state) {
  return state && state.drive && state.drive.roadtrip.route === "camp" &&
    state.drive.roadtrip.active && !state.car.engineOn && state.drive.speed === 0;
}
function connectedSpur(visual) {
  var asphalt = visual && visual.asphalt || "";
  var shoulder = visual && visual.shoulder || "";
  return /^M/.test(asphalt) && /Z$/.test(asphalt) && /^M/.test(shoulder) && /Z$/.test(shoulder) &&
    (asphalt.match(/C/g) || []).length === 2 &&
    (asphalt.match(/L/g) || []).length === 1 &&
    (visual.innerEdge.match(/C/g) || []).length === 2 &&
    (visual.outerEdge.match(/C/g) || []).length === 2 &&
    visual.junctionInnerX < visual.junctionOuterX &&
    Number.isFinite(visual.junctionRoadRightX) &&
    visual.junctionInnerX <= visual.junctionRoadRightX - 9 &&
    visual.junctionRoadRightX < visual.junctionOuterX &&
    visual.shoulderMouthInnerX >= visual.junctionRoadRightX - .3 &&
    visual.innerEdgeStartX > visual.shoulderMouthInnerX + 3 &&
    visual.innerEdgeStartX < visual.bendInnerX && visual.bendInnerX < visual.destinationInnerX &&
    Math.abs(visual.outerEdgeStartX - visual.junctionOuterX) <= .02 &&
    visual.outerEdgeStartX < visual.bendOuterX && visual.bendOuterX < visual.destinationOuterX &&
    visual.destinationY < visual.bendY && visual.bendY < visual.innerEdgeStartY &&
    visual.innerEdgeStartY < visual.junctionY - 1 &&
    Math.abs(visual.outerEdgeStartY - visual.junctionY) <= .02 &&
    visual.destinationInnerX < visual.destinationOuterX &&
    visual.destinationY < visual.junctionY &&
    visual.destinationX >= visual.junctionOuterX + 14 &&
    visual.destinationInnerX > visual.junctionInnerX &&
    visual.nearWidth > visual.farWidth;
}
function signsClear(visual) {
  return visual && visual.speedClearances.every(function (gap) {
    return Number.isFinite(gap) && gap >= 8;
  });
}

console.log("rsvp.html optional recurring Camping exit:");
var desktop = run(false);
var mobile = run(true);
[desktop, mobile].forEach(function (result, index) {
  var device = index ? "touch" : "desktop";
  var expectedRepeat = index ? 45 : 60;
  check(clean(result), device + " scenario has no uncaught errors", result && result.errors);
  var far = result && result.farExit || {};
  var farState = far.state || {};
  var farVisual = far.visual || {};
  check(farState.route === "abraham" && !farState.campExitVisible && !farState.campExitTakeable &&
    farVisual.sign === "hidden" && farVisual.spur === "hidden" && signsClear(farVisual),
    device + " withholds the turnoff at the fourteen-second-equivalent travel distance", far);
  var mid = result && result.midExit || {};
  check(mid.state && mid.state.campExitVisible && !mid.state.campExitTakeable &&
    mid.visual && mid.visual.sign === "visible" && mid.visual.spur === "hidden" &&
    signsClear(mid.visual),
    device + " shows the sign before revealing the nearby paved branch", mid);
  check(result && result.firstApproachFeedback &&
    result.firstApproachFeedback.indexOf("entrance_roadtrip_abraham_arrival") >= 0 &&
    result.repeatApproachFeedback &&
    result.repeatApproachFeedback.indexOf("entrance_roadtrip_abraham_arrival") >= 0,
    device + " announces camping at both the first and recurring exit approaches", result && {
      first: result.firstApproachFeedback, repeat: result.repeatApproachFeedback
    });
  var first = result && result.firstExit || {};
  var firstState = first.state || {};
  var firstVisual = first.visual || {};
  check(firstState.route === "abraham" && firstState.campExitRepeatSeconds === expectedRepeat &&
    firstState.campExitVisible && firstState.campExitTakeable && firstState.playerLane === .5,
    device + " reaches a takeable exit without forcing the through lane", firstState);
  check(firstVisual.sign === "visible" && firstVisual.takeable === "true" &&
    firstVisual.spur === "visible" && firstVisual.afterRoad &&
    Number.isFinite(firstVisual.roadRight) && firstVisual.signLeft - firstVisual.roadRight >= 5.9 &&
    Number.isFinite(firstVisual.junctionX) && Number.isFinite(firstVisual.junctionY) &&
    firstVisual.destinationX > firstVisual.junctionX + 20 &&
    firstVisual.destinationY < firstVisual.junctionY - 15 &&
    firstVisual.nearWidth > firstVisual.farWidth * 2 && firstVisual.nearWidth < 80 &&
    firstVisual.signPostX > firstVisual.destinationX && firstVisual.signPostX - firstVisual.destinationX < 30 &&
    connectedSpur(firstVisual) && signsClear(firstVisual) && /^M/.test(firstVisual.innerEdge || ""),
    device + " paints a receding upper-right spur with its larger sign beside it", firstVisual);
  check(connectedSpur(result && result.curvedExitRight) && signsClear(result.curvedExitRight) &&
    connectedSpur(result && result.curvedExitLeft) && signsClear(result.curvedExitLeft),
    device + " keeps the exit lane continuous through both highway bends", result && {
      right: result.curvedExitRight, left: result.curvedExitLeft
    });
  var laneViews = result && result.laneViews || {};
  var laneShapes = [laneViews.left, laneViews.centre, laneViews.right, laneViews.shoulder];
  var laneDivergences = laneShapes.map(function (view) {
    return view && view.destinationX - view.junctionOuterX;
  });
  check(laneShapes.every(function (view) {
    return view && view.sign === "visible" && view.spur === "visible" && connectedSpur(view);
  }) && laneDivergences.every(Number.isFinite) &&
    Math.max.apply(Math, laneDivergences) - Math.min.apply(Math, laneDivergences) <= .05,
    device + " preserves the shoulder-composed exit divergence in every player lane", {
      divergences: laneDivergences, views: laneViews
    });

  var missed = result && result.missed || {};
  check(missed.state && missed.state.route === "abraham" && missed.state.active &&
    missed.state.abrahamDistance > missed.state.abrahamDistanceRequired &&
    Math.abs(missed.state.campExitDistance -
      (missed.state.campExitRepeatDistance - 3 * missed.state.routePaceKmh / 3.6)) < .001 &&
    missed.visual && missed.visual.sign === "hidden" && missed.visual.spur === "hidden",
    device + " keeps driving after a missed exit and starts the next distance interval", missed);
  check(result && result.calgary && result.calgary.sign === "hidden" && result.calgary.spur === "hidden" &&
    result.banff && result.banff.sign === "hidden" && result.banff.spur === "hidden",
    device + " does not add the Camping turnoff to Calgary or Banff", result && {
      calgary: result.calgary, banff: result.banff
    });
  var repeated = result && result.repeatExit || {};
  check(repeated.state && repeated.state.route === "abraham" &&
    Math.abs(repeated.state.campExitDistance - repeated.state.routePaceKmh / 3.6) < .001 &&
    repeated.state.campExitVisible && repeated.visual && repeated.visual.sign === "visible" &&
    repeated.visual.spur === "visible",
    device + " repeats the exit after the " + expectedRepeat + "-second-equivalent travel distance", repeated);

  var saved = result && result.saved || {};
  var restored = result && result.restored || {};
  check(saved.route === "abraham" && Math.abs(saved.campExitDistance -
      (restored.campExitRepeatDistance - 13 * restored.routePaceKmh / 3.6)) < .001 &&
    restored.route === "abraham" && restored.paused &&
    Math.abs(restored.campExitDistance - saved.campExitDistance) < .001,
    device + " checkpoints and restores the recurring-exit phase", { saved: saved, restored: restored });

  var slowing = result && result.slowing;
  check(slowing && slowing.drive.roadtrip.route === "abraham" && slowing.drive.roadtrip.campExitLatched &&
    slowing.drive.speed > 10 && slowing.drive.speed < 80,
    device + " latches the shoulder exit and slows autonomously", slowing && slowing.drive);
  check(camp(result && result.arrived), device + " enters Camping below 10 km/h", result && result.arrived);
  check(result && result.campResume && result.campResume.state &&
    result.campResume.state.route === "abraham" &&
    Math.abs(result.campResume.state.campExitDistance -
      expectedRepeat * restored.routePaceKmh / 3.6) < .001 &&
    result.campResume.state.campExitLatched === false,
    device + " retains the Abraham run while Camping is overlaid", result && result.campResume);
  check(camp(result && result.noMomentum),
    device + " takes a latched exit without borrowing forward momentum", result && result.noMomentum);
});

if (failures) process.exit(1);
console.log("Optional recurring Camping exit assertions passed.");

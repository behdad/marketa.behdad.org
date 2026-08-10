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
      junctionLaneCenterX: Number(spur.getAttribute("data-roadtrip-junction-lane-center-x")),
      destinationLaneCenterX: Number(spur.getAttribute("data-roadtrip-destination-lane-center-x")),
      joinTangentDx: Number(spur.getAttribute("data-roadtrip-join-tangent-dx")),
      joinTangentDy: Number(spur.getAttribute("data-roadtrip-join-tangent-dy")),
      outerJoinTangentDx: Number(spur.getAttribute("data-roadtrip-outer-join-tangent-dx")),
      outerJoinTangentDy: Number(spur.getAttribute("data-roadtrip-outer-join-tangent-dy")),
      junctionInnerX: Number(spur.getAttribute("data-roadtrip-junction-inner-x")),
      junctionRoadRightX: Number(spur.getAttribute("data-roadtrip-junction-road-right-x")),
      junctionOuterX: Number(spur.getAttribute("data-roadtrip-junction-outer-x")),
      junctionOuterY: Number(spur.getAttribute("data-roadtrip-junction-outer-y")),
      bendInnerX: Number(spur.getAttribute("data-roadtrip-bend-inner-x")),
      bendOuterX: Number(spur.getAttribute("data-roadtrip-bend-outer-x")),
      bendY: Number(spur.getAttribute("data-roadtrip-bend-y")),
      innerEdgeStartX: Number(spur.getAttribute("data-roadtrip-inner-edge-start-x")),
      innerEdgeStartY: Number(spur.getAttribute("data-roadtrip-inner-edge-start-y")),
      outerEdgeStartX: Number(spur.getAttribute("data-roadtrip-outer-edge-start-x")),
      outerEdgeStartY: Number(spur.getAttribute("data-roadtrip-outer-edge-start-y")),
      shoulderMouthInnerX: Number(spur.getAttribute("data-roadtrip-shoulder-mouth-inner-x")),
      junctionOverlap: Number(spur.getAttribute("data-roadtrip-junction-overlap")),
      innerEdgeStartT: Number(spur.getAttribute("data-roadtrip-inner-edge-start-t")),
      destinationInnerX: Number(spur.getAttribute("data-roadtrip-destination-inner-x")),
      destinationOuterX: Number(spur.getAttribute("data-roadtrip-destination-outer-x")),
      nearWidth: Number(spur.getAttribute("data-roadtrip-near-width")),
      farWidth: Number(spur.getAttribute("data-roadtrip-far-width")),
      widthScale: Number(spur.getAttribute("data-roadtrip-width-scale")),
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

        report.geometrySweep = [];
        [0, 158, 260].forEach(function (roadDistance) {
          window.__entranceRoadtripSetDistance(roadDistance);
          [5.4, 5, 4, 3, 2.4, 1.2, .4, 0].forEach(function (countdown) {
            [-1.32, -.5, 0, .5, 1, 1.32].forEach(function (lane) {
              setAbraham(first - countdown * nominalSecond, lane, 0);
              report.geometrySweep.push({
                roadDistance: roadDistance,
                countdown: countdown,
                lane: lane,
                visual: visual()
              });
            });
          });
        });
        window.__entranceRoadtripSetDistance(0);

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
  return lib.runPageSync("loft-day.html", HARNESS, 1200, {
    forceMotion: true,
    seedRandom: true,
    forceCoarsePointer: coarse,
    urlSuffix: "?date=2026-07-15&time=12:00",
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
    Math.abs(visual.junctionInnerX - visual.shoulderMouthInnerX) <= .02 &&
    visual.junctionRoadRightX < visual.junctionOuterX &&
    Number.isFinite(visual.junctionOverlap) && visual.junctionOverlap >= 6.9 &&
    visual.junctionOverlap <= 18.1 &&
    Math.abs(visual.junctionRoadRightX - visual.shoulderMouthInnerX -
      visual.junctionOverlap) <= .03 &&
    visual.junctionOuterX - visual.junctionRoadRightX > 12 &&
    visual.junctionOuterX - visual.junctionRoadRightX < 30 &&
    visual.junctionOuterY > visual.junctionY + .2 &&
    visual.innerEdgeStartT >= .35 && visual.innerEdgeStartT <= .42 &&
    visual.bendInnerX < visual.bendOuterX &&
    Math.abs(visual.outerEdgeStartX - visual.junctionOuterX) <= .02 &&
    visual.destinationY < visual.bendY && visual.bendY < visual.junctionY &&
    visual.destinationY < visual.innerEdgeStartY &&
    visual.innerEdgeStartY < visual.junctionY - .2 &&
    Math.abs(visual.outerEdgeStartY - visual.junctionOuterY) <= .02 &&
    visual.destinationInnerX < visual.destinationOuterX &&
    visual.destinationY < visual.junctionY &&
    Number.isFinite(visual.junctionLaneCenterX) && Number.isFinite(visual.destinationLaneCenterX) &&
    visual.nearWidth > visual.farWidth && visual.widthScale === 2;
}
function cubicBand(path) {
  var values = String(path || "").match(/-?(?:\d+\.?\d*|\.\d+)/g);
  if (!values || values.length !== 16) return null;
  values = values.map(Number);
  function point(index) { return { x: values[index], y: values[index + 1] }; }
  return {
    inner: [point(0), point(2), point(4), point(6)],
    outer: [point(14), point(12), point(10), point(8)]
  };
}
function cubicValue(points, amount, axis) {
  var reverse = 1 - amount;
  return reverse * reverse * reverse * points[0][axis] +
    3 * reverse * reverse * amount * points[1][axis] +
    3 * reverse * amount * amount * points[2][axis] +
    amount * amount * amount * points[3][axis];
}
function forwardCurve(points) {
  return points.every(function (point, index) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    if (!index) return true;
    return point.y <= points[index - 1].y + .02;
  });
}
function laneCentredApproach(visual) {
  var nearGap = visual.junctionX - visual.junctionLaneCenterX;
  var farGap = visual.destinationX - visual.destinationLaneCenterX;
  return Number.isFinite(nearGap) && Number.isFinite(farGap) && nearGap > 12 && farGap > 5 &&
    farGap < nearGap * .62;
}
function smoothJoin(visual) {
  if (!Number.isFinite(visual.joinTangentDx) || !Number.isFinite(visual.joinTangentDy) ||
      visual.joinTangentDy >= -.1 || !Number.isFinite(visual.outerJoinTangentDx) ||
      !Number.isFinite(visual.outerJoinTangentDy) || visual.outerJoinTangentDy >= -.1) return false;
  return [visual.asphalt, visual.shoulder].every(function (path) {
    var band = cubicBand(path);
    if (!band) return false;
    return band.inner.concat(band.outer).every(function (point) {
      return Number.isFinite(point.x) && Number.isFinite(point.y);
    }) && Math.abs(band.inner[1].x - band.inner[0].x - visual.joinTangentDx) <= .03 &&
      Math.abs(band.inner[1].y - band.inner[0].y - visual.joinTangentDy) <= .03 &&
      Math.abs(band.outer[1].x - band.outer[0].x - visual.outerJoinTangentDx) <= .03 &&
      Math.abs(band.outer[1].y - band.outer[0].y - visual.outerJoinTangentDy) <= .03;
  }) && (function () {
    var band = cubicBand(visual.outerEdge);
    return band && [band.inner, band.outer].every(function (edge) {
      return Math.abs(edge[1].x - edge[0].x - visual.outerJoinTangentDx) <= .03 &&
        Math.abs(edge[1].y - edge[0].y - visual.outerJoinTangentDy) <= .03;
    });
  })();
}
function smoothArrivalWidths(visual) {
  return [visual.asphalt, visual.shoulder, visual.innerEdge, visual.outerEdge].every(function (path) {
    var band = cubicBand(path);
    if (!band) return false;
    var controlWidth = band.outer[2].x - band.inner[2].x;
    var endWidth = band.outer[3].x - band.inner[3].x;
    return endWidth > 0 && Math.abs(controlWidth - endWidth) <= .03;
  });
}
function edgePaintFollowsAsphalt(visual) {
  var asphalt = cubicBand(visual && visual.asphalt);
  var innerEdge = cubicBand(visual && visual.innerEdge);
  var outerEdge = cubicBand(visual && visual.outerEdge);
  var amount = visual && visual.innerEdgeStartT;
  if (!asphalt || !innerEdge || !outerEdge || !Number.isFinite(amount)) return false;
  return Math.abs(innerEdge.inner[0].x - cubicValue(asphalt.inner, amount, "x")) <= .04 &&
    Math.abs(innerEdge.inner[0].y - cubicValue(asphalt.inner, amount, "y")) <= .04 &&
    Math.abs(innerEdge.outer[0].x - innerEdge.inner[0].x) <= .04 &&
    Math.abs(innerEdge.outer[0].y - innerEdge.inner[0].y) <= .04 &&
    Math.abs(outerEdge.outer[0].x - asphalt.outer[0].x) <= .04 &&
    Math.abs(outerEdge.outer[0].y - asphalt.outer[0].y) <= .04;
}
function coherentSpurTopology(visual) {
  if (!connectedSpur(visual) || !laneCentredApproach(visual) || !smoothJoin(visual) ||
      !smoothArrivalWidths(visual) || !edgePaintFollowsAsphalt(visual)) return false;
  var asphalt = cubicBand(visual.asphalt);
  var shoulder = cubicBand(visual.shoulder);
  var innerEdge = cubicBand(visual.innerEdge);
  var outerEdge = cubicBand(visual.outerEdge);
  if (!asphalt || !shoulder || !innerEdge || !outerEdge) return false;
  var curves = [asphalt.inner, asphalt.outer, shoulder.inner, shoulder.outer,
    innerEdge.inner, innerEdge.outer, outerEdge.inner, outerEdge.outer];
  if (!curves.every(forwardCurve)) return false;
  for (var step = 0; step <= 40; step++) {
    var amount = step / 40;
    var asphaltInner = cubicValue(asphalt.inner, amount, "x");
    var asphaltOuter = cubicValue(asphalt.outer, amount, "x");
    var shoulderInner = cubicValue(shoulder.inner, amount, "x");
    var shoulderOuter = cubicValue(shoulder.outer, amount, "x");
    var innerEdgeInner = cubicValue(innerEdge.inner, amount, "x");
    var innerEdgeOuter = cubicValue(innerEdge.outer, amount, "x");
    var outerEdgeInner = cubicValue(outerEdge.inner, amount, "x");
    var outerEdgeOuter = cubicValue(outerEdge.outer, amount, "x");
    var innerPaintOrdered = amount === 0 ?
      Math.abs(innerEdgeInner - innerEdgeOuter) <= .04 : innerEdgeInner < innerEdgeOuter;
    if (!(asphaltInner < asphaltOuter && shoulderInner <= asphaltInner + .02 &&
        shoulderOuter >= asphaltOuter - .02 && innerPaintOrdered &&
        outerEdgeInner < outerEdgeOuter)) return false;
  }
  return visual.innerEdgeStartT >= .35 && visual.innerEdgeStartT <= .42 &&
    visual.innerEdgeStartY < visual.junctionY - .2 &&
    Math.abs(visual.outerEdgeStartX - visual.junctionOuterX) <= .02 &&
    Math.abs(visual.outerEdgeStartY - visual.junctionOuterY) <= .02;
}
function signsClear(visual) {
  return visual && visual.speedClearances.every(function (gap) {
    return Number.isFinite(gap) && gap >= 8;
  });
}

console.log("loft-day.html optional recurring Camping exit:");
var desktop = run(false);
var mobile = run(true);
[desktop, mobile].forEach(function (result, index) {
  var device = index ? "touch" : "desktop";
  var expectedRepeat = index ? 20 : 30;
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
    laneCentredApproach(firstVisual) &&
    firstVisual.destinationY < firstVisual.junctionY - 15 &&
    firstVisual.nearWidth > firstVisual.farWidth && firstVisual.farWidth >= 12 &&
    firstVisual.nearWidth < 80 &&
    firstVisual.signPostX > firstVisual.destinationX &&
    connectedSpur(firstVisual) && signsClear(firstVisual) && /^M/.test(firstVisual.innerEdge || ""),
    device + " paints a receding right-hand spur with its larger sign beside it", firstVisual);
  check(connectedSpur(result && result.curvedExitRight) && signsClear(result.curvedExitRight) &&
    connectedSpur(result && result.curvedExitLeft) && signsClear(result.curvedExitLeft),
    device + " keeps the exit lane continuous through both highway bends", result && {
      right: result.curvedExitRight, left: result.curvedExitLeft
    });
  var laneViews = result && result.laneViews || {};
  var laneShapes = [laneViews.left, laneViews.centre, laneViews.right, laneViews.shoulder];
  var laneNearGaps = laneShapes.map(function (view) {
    return view && view.junctionX - view.junctionLaneCenterX;
  });
  var laneFarGaps = laneShapes.map(function (view) {
    return view && view.destinationX - view.destinationLaneCenterX;
  });
  check(laneShapes.every(function (view) {
    return view && view.sign === "visible" && view.spur === "visible" && coherentSpurTopology(view);
  }) && laneNearGaps.every(Number.isFinite) && laneFarGaps.every(Number.isFinite) &&
    Math.max.apply(Math, laneNearGaps) - Math.min.apply(Math, laneNearGaps) <= .05 &&
    Math.max.apply(Math, laneFarGaps) - Math.min.apply(Math, laneFarGaps) <= .05,
    device + " preserves the shoulder composition with depth-correct lane parallax", {
      nearGaps: laneNearGaps, farGaps: laneFarGaps, views: laneViews
    });
  var brokenGeometry = (result && result.geometrySweep || []).filter(function (sample) {
    return !sample.visual || sample.visual.sign !== "visible" || sample.visual.spur !== "visible" ||
      !coherentSpurTopology(sample.visual);
  });
  check(result && result.geometrySweep && result.geometrySweep.length === 144 && !brokenGeometry.length,
    device + " keeps every spur boundary nested and lane-centred across lane, approach, curve, and grade",
    brokenGeometry.slice(0, 4));
  var brokenJoins = (result && result.geometrySweep || []).filter(function (sample) {
    return !sample.visual || !smoothJoin(sample.visual);
  });
  check(result && result.geometrySweep && result.geometrySweep.length === 144 && !brokenJoins.length,
    device + " opens each merge throat while its outer bands follow the live road tangent",
    brokenJoins.slice(0, 4));

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

#!/usr/bin/env node
// Road Trip rolling terrain: one vertical projection owns road, objects, mirror, and grade load.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function drive() { return state().drive; }
  function terrain(distance, remaining, bodyPitch) {
    return window.__entranceRoadtripTerrain(distance, remaining, bodyPitch);
  }
  function clearHolds() {
    ["throttle", "brake", "clutch", "steerLeft", "steerRight"].forEach(function (name) {
      window.__entranceDriveControl(name, false);
    });
  }
  function startBanff() {
    var started = window.__entranceRoadtripDevStart();
    if (started) window.__entranceRoadtripSetRoute("banff", 0);
    return started;
  }
  function translateY(node) {
    var match = String(node && node.getAttribute("transform") || "").match(/translate\([-+.\d]+ ([-+.\d]+)/);
    return match ? Number(match[1]) : null;
  }
  function visible(selector) {
    return Array.prototype.find.call(document.querySelectorAll(selector), function (node) {
      return node.getAttribute("visibility") !== "hidden";
    }) || null;
  }
  function scanTerrain(cycle) {
    var result = { maxGrade: null, minGrade: null, maxRise: null, maxFall: null };
    for (var distance = 0; distance < cycle; distance += 2) {
      var row = terrain(distance, 112, 0);
      if (!result.maxGrade || row.grade > result.maxGrade.grade) result.maxGrade = row;
      if (!result.minGrade || row.grade < result.minGrade.grade) result.minGrade = row;
      if (!result.maxRise || row.projection.elevationDelta > result.maxRise.projection.elevationDelta) result.maxRise = row;
      if (!result.maxFall || row.projection.elevationDelta < result.maxFall.projection.elevationDelta) result.maxFall = row;
    }
    return result;
  }
  function setDistance(distance) {
    window.__entranceRoadtripSetDistance(distance);
    return copy(drive().roadtrip);
  }
  function coastAt(distance) {
    clearHolds();
    setDistance(distance);
    window.__entranceDriveSetMotion(90, 0);
    var before = copy(drive());
    window.__entranceDriveStep(500);
    return { before: before, after: copy(drive()) };
  }
  function policePlacement() {
    var node = document.querySelector("#entrance-roadtrip-mirror-entities .entrance-roadtrip-police-mirror");
    return {
      visible: !!(node && node.getAttribute("visibility") !== "hidden"),
      mode: node && node.getAttribute("data-roadtrip-police"),
      behind: Number(node && node.getAttribute("data-roadtrip-behind")),
      roadFraction: Number(node && node.getAttribute("data-roadtrip-road-fraction")),
      perspective: Number(node && node.getAttribute("data-roadtrip-perspective")),
      x: Number(node && node.getAttribute("data-roadtrip-project-x")),
      y: Number(node && node.getAttribute("data-roadtrip-project-y")),
      rotation: Number(node && node.getAttribute("data-roadtrip-rotation")),
      transform: node && node.getAttribute("transform")
    };
  }
  function sampleRoadsidePolice(distance) {
    startBanff();
    clearHolds();
    setDistance(distance - 150);
    window.__entranceRoadtripPolice(140);
    setDistance(distance);
    var placement = policePlacement();
    return {
      distance: drive().roadtrip.distance,
      terrain: terrain(drive().roadtrip.distance, 62, 0),
      placement: placement,
      expected: window.__entranceRoadtripMirrorPose(drive().roadtrip.distance,
        placement.behind, placement.roadFraction)
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
        window.__getSfxCtx = function () { return null; };
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
        startBanff();
        clearHolds();

        var zero = terrain(0, 112, 0);
        var cycle = zero.cycle;
        var scan = scanTerrain(cycle);
        report.steps.profile = { zero: zero, scan: scan };

        var periodicDistances = [0, 37.5, 211, 448.25, cycle - .25];
        report.steps.periodic = periodicDistances.map(function (distance) {
          return { first: terrain(distance, 73, 0), next: terrain(distance + cycle, 73, 0) };
        });
        report.steps.wrap = {
          before: terrain(cycle - .01, 112, 0),
          after: terrain(.01, 112, 0)
        };

        var riseDistance = scan.maxRise.distance;
        var fallDistance = scan.maxFall.distance;
        var rise = setDistance(riseDistance);
        var riseRoad = document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt").getAttribute("d");
        var riseWinter = document.getElementById("entrance-roadtrip-winter-ground").getAttribute("d");
        var riseWinterEdge = document.getElementById("entrance-roadtrip-winter-edges").getAttribute("d");
        var riseMirror = document.getElementById("entrance-roadtrip-mirror-road").getAttribute("d");
        var riseMirrorWinter = document.getElementById("entrance-roadtrip-mirror-winter").getAttribute("d");
        var riseWorld = document.getElementById("entrance-roadtrip-world");
        var riseGeometry = {
          state: rise,
          road: riseRoad,
          winter: riseWinter,
          winterEdge: riseWinterEdge,
          mirror: riseMirror,
          mirrorWinter: riseMirrorWinter,
          worldGrade: Number(riseWorld.getAttribute("data-roadtrip-grade")),
          worldElevation: Number(riseWorld.getAttribute("data-roadtrip-elevation")),
          horizonY: Number(riseWorld.getAttribute("data-roadtrip-horizon-y")),
          sceneryY: Number(document.getElementById("entrance-roadtrip-day-near").getAttribute("data-scenery-y"))
        };
        var fall = setDistance(fallDistance);
        var fallGeometry = {
          state: fall,
          road: document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt").getAttribute("d"),
          winter: document.getElementById("entrance-roadtrip-winter-ground").getAttribute("d"),
          winterEdge: document.getElementById("entrance-roadtrip-winter-edges").getAttribute("d"),
          mirror: document.getElementById("entrance-roadtrip-mirror-road").getAttribute("d"),
          mirrorWinter: document.getElementById("entrance-roadtrip-mirror-winter").getAttribute("d")
        };
        report.steps.geometry = { rise: riseGeometry, fall: fallGeometry };

        setDistance(riseDistance);
        window.__entranceRoadtripSetLane(.5);
        var entity = window.__entranceRoadtripSpawn("car", 1.5, 64);
        window.__entranceRoadtripPolice(140);
        setDistance(riseDistance + 28);
        var furniture = visible("#entrance-roadtrip-furniture .entrance-roadtrip-furniture-engine");
        var speedSign = visible('#entrance-roadtrip-furniture [data-roadtrip-furniture="speed-90"]');
        var sheriff = visible("#entrance-roadtrip-entities .entrance-roadtrip-police-roadside");
        function projectedNode(node) {
          var ahead = Number(node && node.getAttribute("data-roadtrip-ahead"));
          return {
            ahead: ahead,
            y: translateY(node),
            dataY: Number(node && node.getAttribute("data-roadtrip-project-y")),
            expectedY: Number.isFinite(ahead) ? terrain(drive().roadtrip.distance, ahead, 0).projection.y : null,
            type: node && (node.getAttribute("data-roadtrip-furniture") ||
              node.getAttribute("data-roadtrip-type") || node.getAttribute("data-roadtrip-curve"))
          };
        }
        var alignment = {
          distance: drive().roadtrip.distance,
          entity: projectedNode(entity),
          furniture: projectedNode(furniture),
          speedSign: projectedNode(speedSign),
          sheriff: projectedNode(sheriff)
        };
        for (var curveDistance = 0; curveDistance < 294 && !alignment.curveSign; curveDistance += 3) {
          setDistance(curveDistance);
          var curveSign = visible("#entrance-roadtrip-curve-signs .entrance-roadtrip-curve-sign");
          if (curveSign) {
            alignment.curveDistance = drive().roadtrip.distance;
            alignment.curveSign = projectedNode(curveSign);
          }
        }
        report.steps.alignment = alignment;

        clearHolds();
        setDistance(riseDistance);
        window.__entranceRoadtripSetLane(.5);
        window.__entranceDriveSetMotion(200, 4);
        var reflectedSource = window.__entranceRoadtripSpawn("car", 1.5, 10);
        window.__entranceDriveStep(1000);
        var reflected = visible("#entrance-roadtrip-mirror-entities .entrance-roadtrip-mirror-entity");
        var reflectedBehind = Number(reflected && reflected.getAttribute("data-roadtrip-behind"));
        report.steps.mirrorEntity = {
          sourcePassed: reflectedSource && reflectedSource.getAttribute("data-roadtrip-passing"),
          behind: reflectedBehind,
          y: translateY(reflected),
          dataY: Number(reflected && reflected.getAttribute("data-roadtrip-project-y")),
          expectedY: Number.isFinite(reflectedBehind) ?
            terrain(drive().roadtrip.distance, reflectedBehind, 0).mirror.y : null,
          visible: !!reflected
        };

        var uphillCoast = coastAt(scan.maxGrade.distance);
        var downhillCoast = coastAt(scan.minGrade.distance);
        clearHolds();
        setDistance(scan.minGrade.distance);
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceDriveStep(1000);
        var stoppedEngineOn = copy(drive());
        window.__toggleEntrancePorscheEngine();
        window.__entranceDriveStep(1000);
        var stoppedEngineOff = copy(drive());
        report.steps.gravity = {
          uphill: uphillCoast,
          downhill: downhillCoast,
          stoppedEngineOn: stoppedEngineOn,
          stoppedEngineOff: stoppedEngineOff
        };

        if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
        setDistance(scan.maxGrade.distance);
        var neutralPitch = terrain(scan.maxGrade.distance, 112, 0);
        var liftPitch = terrain(scan.maxGrade.distance, 112, 2);
        var divePitch = terrain(scan.maxGrade.distance, 112, -2);
        window.__entranceDriveSetMotion(120, 3);
        window.__entranceDriveControl("brake", true);
        window.__entranceDriveStep(120);
        window.__entranceDriveControl("brake", false);
        var braked = copy(drive());
        report.steps.camera = {
          neutral: neutralPitch,
          lift: liftPitch,
          dive: divePitch,
          braked: braked,
          worldPitchY: Number(document.getElementById("entrance-roadtrip-world").getAttribute("data-roadtrip-camera-pitch-y"))
        };

        var curvePoses = [];
        for (var curveDistance = 0; curveDistance < 1200; curveDistance += 4) {
          curvePoses.push(window.__entranceRoadtripMirrorPose(curveDistance, 18, 0));
        }
        curvePoses.sort(function (left, right) { return left.rotation - right.rotation; });
        var oppositeCurveDistances = [curvePoses[0].distance, curvePoses[curvePoses.length - 1].distance];
        report.steps.policeRoadPose = oppositeCurveDistances.concat([
          scan.maxGrade.distance, scan.minGrade.distance
        ]).map(sampleRoadsidePolice);

        startBanff();
        clearHolds();
        setDistance(260);
        window.__entranceRoadtripSetLane(.5);
        window.__entranceRoadtripPolice(140);
        setDistance(410);
        window.__entranceRoadtripPoliceDetect(140);
        window.__entranceDriveSetMotion(120, 3);
        window.__entranceRoadtripPoliceStep(120, 30);
        var captureStart = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(120, .8);
        var captureMid = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(0, 3);
        var arrestStart = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(0, 1.5);
        var arrestShouted = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        report.steps.policeCapturePark = {
          start: captureStart,
          mid: captureMid,
          arrest: arrestStart,
          shouted: arrestShouted,
          expectedPark: window.__entranceRoadtripMirrorPose(drive().roadtrip.distance, 4, 0)
        };

        startBanff();
        clearHolds();
        setDistance(600);
        window.__entranceRoadtripSetLane(1.9);
        window.__entranceRoadtripPolice(140);
        setDistance(750);
        window.__entranceRoadtripPoliceDetect(120);
        window.__entranceDriveSetMotion(0, 0);
        window.__entranceRoadtripPoliceStep(0, .1);
        var calmStart = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(0, .9);
        var calmLater = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(0, .4);
        var calmParked = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        window.__entranceRoadtripPoliceStep(0, .5);
        var calmHeld = { state: copy(drive().roadtrip.police), placement: policePlacement() };
        report.steps.policeCalmPark = {
          start: calmStart,
          later: calmLater,
          parked: calmParked,
          held: calmHeld,
          expectedPark: window.__entranceRoadtripMirrorPose(drive().roadtrip.distance, 4, 0)
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
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
function close(left, right, tolerance) {
  return Number.isFinite(left) && Number.isFinite(right) && Math.abs(left - right) <= tolerance;
}
function aligned(row) {
  return row && close(row.y, row.expectedY, .011) && close(row.dataY, row.expectedY, .011);
}

console.log("rsvp.html Road Trip rolling terrain:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6500, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--window-size=1100,900"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.profile && s.profile.zero.cycle === 900 &&
  s.profile.scan.maxGrade.grade > .04 && s.profile.scan.minGrade.grade < -.04 &&
  s.profile.scan.maxRise.projection.elevationDelta > 5 &&
  s.profile.scan.maxFall.projection.elevationDelta < -4.5,
  "the deterministic profile contains restrained sustained climbs, descents, crests, and dips", s.profile);
check(s.periodic && s.periodic.every(function (row) {
  return close(row.first.elevation, row.next.elevation, 1e-9) &&
    close(row.first.grade, row.next.grade, 1e-9) &&
    close(row.first.projection.y, row.next.projection.y, 1e-9) &&
    close(row.first.mirror.y, row.next.mirror.y, 1e-9);
}), "elevation, grade, forward projection, and mirror repeat exactly at the terrain cycle", s.periodic);
check(s.wrap && Math.abs(s.wrap.before.elevation - s.wrap.after.elevation) < .003 &&
  Math.abs(s.wrap.before.grade - s.wrap.after.grade) < .0001 &&
  Math.abs(s.wrap.before.projection.y - s.wrap.after.projection.y) < .01,
  "the terrain cycle crosses its wrap without an elevation, slope, or projection jump", s.wrap);

var geometry = s.geometry;
check(geometry && geometry.rise.road !== geometry.fall.road &&
  geometry.rise.winter !== geometry.fall.winter &&
  geometry.rise.winterEdge !== geometry.fall.winterEdge,
  "asphalt, verges, markings, and both winter overlays follow the rolling forward projection", geometry);
check(geometry && geometry.rise.mirror !== geometry.fall.mirror &&
  geometry.rise.mirrorWinter !== geometry.fall.mirrorWinter,
  "rear-view road lines and its winter verge reconstruct the recent grade", geometry);
check(geometry && close(geometry.rise.worldGrade, geometry.rise.state.terrain.grade, 1e-5) &&
  close(geometry.rise.worldElevation, geometry.rise.state.terrain.elevation, .001) &&
  close(geometry.rise.horizonY, geometry.rise.state.terrain.projection.y, .011) &&
  Math.abs(geometry.rise.sceneryY) > 1,
  "the exposed horizon and scenery pitch report the same projected terrain state", geometry && geometry.rise);

var alignment = s.alignment;
check(alignment && aligned(alignment.entity) && aligned(alignment.furniture) &&
  aligned(alignment.speedSign) && aligned(alignment.curveSign) && aligned(alignment.sheriff),
  "traffic, furniture, curve/90 signs, and the roadside Sheriff share one vertical road projection", alignment);
check(s.mirrorEntity && s.mirrorEntity.visible && close(s.mirrorEntity.y, s.mirrorEntity.expectedY, .011) &&
  close(s.mirrorEntity.dataY, s.mirrorEntity.expectedY, .011),
  "passed traffic remains planted on the grade-aware rear-view road", s.mirrorEntity);

var gravity = s.gravity;
check(gravity && gravity.downhill.after.speed > gravity.uphill.after.speed + .5,
  "the restrained grade load slows an uphill coast more than an equal downhill coast", gravity);
check(gravity && Math.abs(gravity.stoppedEngineOn.speed) < .001 &&
  Math.abs(gravity.stoppedEngineOff.speed) < .001,
  "terrain gravity never creates engine-on or engine-off creep from rest", gravity);
check(s.profile && Math.abs(s.profile.scan.maxGrade.gravityAcceleration) < .35 &&
  Math.abs(s.profile.scan.minGrade.gravityAcceleration) < .35,
  "the gravitational drivetrain contribution stays subordinate to pedals and braking", s.profile && s.profile.scan);

var camera = s.camera;
check(camera && close(camera.lift.projection.elevationY, camera.neutral.projection.elevationY, 1e-9) &&
  close(camera.dive.projection.elevationY, camera.neutral.projection.elevationY, 1e-9) &&
  camera.lift.projection.cameraWeightY > 0 && camera.dive.projection.cameraWeightY < 0 &&
  camera.lift.projection.y > camera.neutral.projection.y &&
  camera.dive.projection.y < camera.neutral.projection.y,
  "acceleration lift and brake dive compose with grade without altering terrain geometry", camera);
check(camera && camera.braked.noseDive > 0 && camera.braked.roadtrip.terrain.projection.cameraWeightY < 0 &&
  close(camera.worldPitchY, camera.braked.roadtrip.terrain.projection.cameraPitchY, .011),
  "the live first-person horizon picks up measured brake weight transfer on top of grade", camera);

function poseMatches(sample) {
  var placement = sample && sample.placement;
  var expected = sample && sample.expected;
  return placement && placement.visible && expected &&
    close(placement.x, expected.x, .011) && close(placement.y, expected.y, .011) &&
    close(placement.rotation, expected.rotation, .011) &&
    close(placement.perspective, expected.perspective, .00011);
}
var policeRoadPose = s.policeRoadPose;
check(policeRoadPose && policeRoadPose.length === 4 && policeRoadPose.every(poseMatches) &&
  policeRoadPose[0].expected.rotation < policeRoadPose[1].expected.rotation &&
  policeRoadPose[2].terrain.grade > 0 && policeRoadPose[3].terrain.grade < 0,
  "the reflected Sheriff derives x, y, rotation, and scale depth from opposite bends and grade phases", policeRoadPose);

var capturePark = s.policeCapturePark;
check(capturePark && capturePark.start.state.phase === "capture" && capturePark.mid.state.phase === "capture" &&
  capturePark.start.placement.visible && capturePark.mid.placement.visible &&
  Math.abs(capturePark.mid.placement.roadFraction - 1.08) <
    Math.abs(capturePark.start.placement.roadFraction - 1.08) &&
  Math.abs(capturePark.mid.placement.behind - 4) <
    Math.abs(capturePark.start.placement.behind - 4),
  "capture visibly brings the Sheriff close behind while it leaves the roadside", capturePark);
check(capturePark && capturePark.arrest.state.phase === "arrest" &&
  capturePark.shouted.state.phase === "arrest" && capturePark.shouted.state.arrestShoutPlayed &&
  capturePark.arrest.placement.visible && capturePark.arrest.placement.mode === "shoulder-arrest" &&
  close(capturePark.arrest.placement.behind, 4, .001) &&
  close(capturePark.arrest.placement.roadFraction, 0, .001) &&
  capturePark.arrest.placement.transform === capturePark.shouted.placement.transform &&
  close(capturePark.arrest.placement.x, capturePark.expectedPark.x, .011) &&
  close(capturePark.arrest.placement.y, capturePark.expectedPark.y, .011) &&
  close(capturePark.arrest.placement.rotation, capturePark.expectedPark.rotation, .011),
  "the Sheriff remains parked directly behind throughout the shouted arrest approach", capturePark);

var calmPark = s.policeCalmPark;
check(calmPark && calmPark.start.state.phase === "stopped" && calmPark.later.state.phase === "stopped" &&
  calmPark.start.placement.visible && calmPark.start.placement.mode === "shoulder-arrival" &&
  Math.abs(calmPark.later.placement.behind - 4) < Math.abs(calmPark.start.placement.behind - 4) &&
  Math.abs(calmPark.later.placement.roadFraction) < Math.abs(calmPark.start.placement.roadFraction) &&
  calmPark.parked.state.phase === "arrest" && calmPark.held.state.phase === "arrest" &&
  !calmPark.held.state.arrestShoutPlayed && calmPark.parked.placement.mode === "shoulder-arrest" &&
  calmPark.parked.placement.transform === calmPark.held.placement.transform &&
  close(calmPark.parked.placement.behind, 4, .001) &&
  close(calmPark.parked.placement.roadFraction, 0, .001) &&
  close(calmPark.parked.placement.x, calmPark.expectedPark.x, .011) &&
  close(calmPark.parked.placement.y, calmPark.expectedPark.y, .011) &&
  close(calmPark.parked.placement.rotation, calmPark.expectedPark.rotation, .011),
  "a calm pulled-over citation brings the Sheriff directly behind and holds it there", calmPark);

if (failures) {
  console.log("\n" + failures + " Road Trip terrain assertion(s) failed.");
  process.exit(1);
}
console.log("\nRoad Trip rolling-terrain assertions passed.");

#!/usr/bin/env node
// The authored Banff → Abraham drive keeps AUTO centred on the painted through lane.
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
  var report = { errors: [], samples: [] };
  function drive() { return window.__entranceRoomState().drive; }
  function numbers(value) {
    return (String(value || "").match(/-?(?:\d+\.?\d*|\.\d+)/g) || []).map(Number);
  }
  function paintedOffset(label) {
    var world = document.getElementById("entrance-roadtrip-world");
    var asphalt = document.querySelector("#entrance-roadtrip-road .entrance-roadtrip-asphalt");
    var values = numbers(asphalt.getAttribute("d"));
    var points = [];
    for (var valueIndex = 0; valueIndex < values.length; valueIndex += 2) {
      points.push({ x: values[valueIndex], y: values[valueIndex + 1] });
    }
    var foregroundY = Math.max.apply(Math, points.map(function (point) { return point.y; }));
    var foreground = points.filter(function (point) {
      return Math.abs(point.y - foregroundY) < .02;
    });
    var left = Math.min.apply(Math, foreground.map(function (point) { return point.x; }));
    var right = Math.max.apply(Math, foreground.map(function (point) { return point.x; }));
    var outerFraction = Number(world.getAttribute("data-roadtrip-outer-fraction"));
    var roadFraction = Number(world.getAttribute("data-roadtrip-road-fraction"));
    var innerBoundary = Number(world.getAttribute("data-roadtrip-inner-lane-fraction"));
    var laneOpacity = Number(world.getAttribute("data-roadtrip-lane-opacity"));
    var centerFraction = Number(world.getAttribute("data-roadtrip-center-fraction"));
    var centerWidth = Number(world.getAttribute("data-roadtrip-center-width"));
    var playerFraction = Number(world.getAttribute("data-roadtrip-player-fraction"));
    var halfWidth = (right - left) / (2 * outerFraction);
    var roadCenter = (left + right) / 2;
    var throughBoundary = laneOpacity > .001 ? innerBoundary : roadFraction;
    var throughCenterFraction = (centerFraction + centerWidth / 2 + throughBoundary) / 2;
    var laneCenterX = roadCenter + throughCenterFraction * halfWidth;
    var playerX = roadCenter + playerFraction * halfWidth;
    var screenScale = Math.abs(world.getScreenCTM().a);
    var trip = drive().roadtrip;
    report.samples.push({
      label: label,
      route: trip.route,
      banffRemaining: trip.banffDistanceRequired - trip.banffDistance,
      lakeProgress: trip.lakeTurnoffDistance / trip.lakeTurnoffDistanceRequired,
      lane: trip.playerLane,
      signVisible: document.getElementById("entrance-roadtrip-abraham-exit")
        .getAttribute("visibility") === "visible",
      innerBoundary: innerBoundary,
      laneOpacity: laneOpacity,
      playerFraction: playerFraction,
      throughCenterFraction: throughCenterFraction,
      offsetSvg: laneCenterX - playerX,
      offsetScreen: (laneCenterX - playerX) * screenScale
    });
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart("banff", 0);
      var initial = drive().roadtrip;
      window.__entranceRoadtripDevStart("banff", Math.max(0,
        initial.banffDistanceRequired - initial.lakeTurnoffDistanceRequired - 140));
      window.__entranceRoadtripSetLane(.5);
      window.__entranceDriveTransmissionMode("auto", false);

      var seen = {};
      var centredAtApproach = false;
      var thresholds = [
        ["sign-start", 0], ["sign-quarter", .25], ["sign-half", .5],
        ["sign-three-quarter", .75], ["sign-near", .95]
      ];
      for (var frame = 0; frame < 320 && drive().roadtrip.route !== "abraham"; frame++) {
        window.__entranceDriveSetMotion(90, 3);
        window.__entranceDriveStep(100);
        var trip = drive().roadtrip;
        var banffRemaining = trip.banffDistanceRequired - trip.banffDistance;
        if (!centredAtApproach && trip.route === "banff" &&
            banffRemaining <= trip.lakeTurnoffDistanceRequired) {
          centredAtApproach = true;
          window.__entranceRoadtripSetLane(.5);
          paintedOffset("approach-start");
        }
        if (!seen.preSign && trip.route === "banff" && banffRemaining <= 20) {
          seen.preSign = true;
          paintedOffset("pre-sign");
        }
        if (trip.route === "lake-turnoff") {
          var progress = trip.lakeTurnoffDistance / trip.lakeTurnoffDistanceRequired;
          thresholds.forEach(function (entry) {
            if (!seen[entry[0]] && progress >= entry[1]) {
              seen[entry[0]] = true;
              paintedOffset(entry[0]);
            }
          });
        }
      }
      paintedOffset("abraham-arrival");
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
})();
</script>`;

function run(label, options) {
  console.log(label + ":");
  var result = lib.runPageSync("loft-day.html", harness, 6500, options);
  check(result && result.errors.length === 0,
    "continuous approach has no page errors", result && result.errors);
  var samples = result && result.samples || [];
  var expected = ["approach-start", "pre-sign", "sign-start", "sign-quarter", "sign-half",
    "sign-three-quarter", "sign-near", "abraham-arrival"];
  check(expected.every(function (name) {
    return samples.some(function (sample) { return sample.label === name; });
  }), "continuous drive crosses every pre-sign, sign and arrival sample", samples);
  check(samples.length === expected.length && samples.every(function (sample) {
    return Math.abs(sample.offsetScreen) <= 9;
  }), "painted through-lane centre stays within 9 screen px of the AUTO camera", samples);
  check(samples.filter(function (sample) { return /^sign-/.test(sample.label); }).every(function (sample) {
    return sample.signVisible && sample.innerBoundary >= .5 && sample.innerBoundary <= 1 &&
      Math.abs(sample.lane - .5) < .002;
  }), "the live divider narrows outward while the sign is visible and AUTO remains in-lane", samples);
  check(samples[0] && samples[samples.length - 1] &&
    Math.abs(samples[samples.length - 1].offsetScreen - samples[0].offsetScreen) <= 1.5,
  "arrival preserves the same painted lane-centre alignment as the approach", samples);
}

console.log("loft-day.html continuous Abraham turnoff screen centring:");
run("desktop landscape", {
  patchRaf: true, seedRandom: true, forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,700"
});
run("mobile landscape", {
  patchRaf: true, seedRandom: true, forceMotion: true, forceCoarsePointer: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=844,390"
});

if (failures) process.exit(1);
console.log("Continuous Abraham screen-centring assertions passed.");

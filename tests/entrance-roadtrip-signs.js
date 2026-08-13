#!/usr/bin/env node
// Route signs stay wholly beyond the right road edge, with Abraham Lake copy clear of its arrow.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], signs: {} };
  function capture(name, id) {
    var node = document.getElementById(id);
    report.signs[name] = {
      visibility: node.getAttribute("visibility"),
      roadRight: Number(node.getAttribute("data-roadtrip-road-right")),
      signLeft: Number(node.getAttribute("data-roadtrip-sign-left")),
      transform: node.getAttribute("transform"),
      speedClearances: Array.prototype.filter.call(
        document.querySelectorAll("[data-roadtrip-furniture^='speed-']"),
        function (speed) { return speed.getAttribute("visibility") === "visible"; }
      ).map(function (speed) {
        return Number(speed.getAttribute("data-roadtrip-turn-sign-clearance"));
      })
    };
  }
  function sweep(name) {
    var summary = { visibleViolations: 0, hiddenConflicts: 0, minimumVisible: 999,
      curveVisibleViolations: 0, curveMinimumVisible: 999, curveSuppressed: 0 };
    for (var distance = 0; distance < 294; distance += 3) {
      window.__entranceRoadtripSetDistance(distance);
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-roadtrip-furniture^='speed-']"),
        function (speed) {
          var clearance = Number(speed.getAttribute("data-roadtrip-turn-sign-clearance"));
          var visible = speed.getAttribute("visibility") === "visible";
          if (visible) summary.minimumVisible = Math.min(summary.minimumVisible, clearance);
          if (visible && clearance < 8) summary.visibleViolations++;
          if (!visible && clearance < 8) summary.hiddenConflicts++;
        }
      );
      Array.prototype.forEach.call(
        document.querySelectorAll("[data-roadtrip-curve]"),
        function (curve) {
          if (curve.getAttribute("visibility") !== "visible") return;
          var clearance = Number(curve.getAttribute("data-roadtrip-sign-clearance"));
          summary.curveMinimumVisible = Math.min(summary.curveMinimumVisible, clearance);
          if (clearance < 8) summary.curveVisibleViolations++;
        }
      );
      summary.curveSuppressed += Number(document.getElementById(
        "entrance-roadtrip-curve-signs").getAttribute("data-roadtrip-suppressed-overlaps")) || 0;
    }
    report.signs[name].sweep = summary;
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripDevStart();

        window.__entranceRoadtripSetRoute("turnoff", 3);
        capture("banff", "entrance-roadtrip-banff-exit");
        sweep("banff");
        window.__entranceRoadtripSetRoute("lake-turnoff", 3);
        capture("abraham", "entrance-roadtrip-abraham-exit");
        sweep("abraham");
        window.__entranceRoadtripSetRoute("abraham", 57);
        capture("camp", "entrance-roadtrip-camp-exit");
        sweep("camp");

        var template = document.getElementById("entrance-roadtrip-abraham-sign");
        var labels = template.querySelectorAll("text");
        var arrow = template.querySelector("path:last-child").getBBox();
        report.abrahamLayout = {
          lines: Array.prototype.map.call(labels, function (label) { return label.textContent; }),
          textRight: Math.max(labels[0].getBBox().x + labels[0].getBBox().width,
            labels[1].getBBox().x + labels[1].getBBox().width),
          arrowLeft: arrow.x
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 260);
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

console.log("loft-day.html Road Trip exit-sign layout:");
var result = lib.runPageSync("loft-day.html", HARNESS, 2200, {
  forceMotion: true,
  urlSuffix: "?date=2026-02-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the three signs render without uncaught errors",
  result && result.errors);

var signs = result && result.signs || {};
["banff", "abraham", "camp"].forEach(function (name) {
  var sign = signs[name] || {};
  check(sign.visibility === "visible" && Number.isFinite(sign.roadRight) &&
    Number.isFinite(sign.signLeft) && sign.signLeft - sign.roadRight >= 5.9,
    name + " sign stays wholly beyond the right road edge", sign);
  check(sign.speedClearances &&
    sign.speedClearances.every(function (gap) { return Number.isFinite(gap) && gap >= 8; }) &&
    sign.sweep && sign.sweep.visibleViolations === 0 && sign.sweep.hiddenConflicts > 0 &&
    sign.sweep.minimumVisible >= 8,
    name + " sign keeps an eight-pixel longitudinal gap from speed signs", sign.sweep);
  check(sign.sweep && sign.sweep.curveVisibleViolations === 0 &&
    sign.sweep.curveMinimumVisible >= 8,
    name + " route keeps curve warnings clear of every other roadside sign", sign.sweep);
});
check(["banff", "abraham", "camp"].some(function (name) {
  return signs[name] && signs[name].sweep && signs[name].sweep.curveSuppressed > 0;
}), "the route sweep exercises and suppresses a real sign-overlap case", signs);

var layout = result && result.abrahamLayout || {};
check(JSON.stringify(layout.lines) === JSON.stringify(["ABRAHAM", "LAKE"]),
  "Abraham Lake is stacked on two lines", layout);
check(Number.isFinite(layout.textRight) && Number.isFinite(layout.arrowLeft) &&
  layout.textRight < layout.arrowLeft,
  "the stacked label clears the right arrow", layout);

if (failures) process.exit(1);
console.log("Road Trip exit-sign layout checks passed.");

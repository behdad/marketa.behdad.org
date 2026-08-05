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
      transform: node.getAttribute("transform")
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.goToStage("balcony");
        window.__openEntranceRoom();
        window.__openEntrancePorscheDriveHud();
        if (!window.__entranceRoomState().car.engineOn) window.__toggleEntrancePorscheEngine();
        window.__entranceRoadtripStart();

        window.__entranceRoadtripSetRoute("turnoff", 3);
        capture("banff", "entrance-roadtrip-banff-exit");
        window.__entranceRoadtripSetRoute("lake-turnoff", 3);
        capture("abraham", "entrance-roadtrip-abraham-exit");
        window.__entranceRoadtripSetRoute("abraham", 72);
        capture("camp", "entrance-roadtrip-camp-exit");

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

console.log("rsvp.html Road Trip exit-sign layout:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2200, {
  forceMotion: true,
  urlSuffix: "?date=2026-02-15&time=12:00#play",
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
});

var layout = result && result.abrahamLayout || {};
check(JSON.stringify(layout.lines) === JSON.stringify(["ABRAHAM", "LAKE"]),
  "Abraham Lake is stacked on two lines", layout);
check(Number.isFinite(layout.textRight) && Number.isFinite(layout.arrowLeft) &&
  layout.textRight < layout.arrowLeft,
  "the stacked label clears the right arrow", layout);

if (failures) process.exit(1);
console.log("Road Trip exit-sign layout checks passed.");

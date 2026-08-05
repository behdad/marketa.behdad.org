#!/usr/bin/env node
// Shift-clicking a route card is a private test shortcut to the chosen segment's exit.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], shifted: {} };
  function roadtrip() { return window.__entranceRoomState().drive.roadtrip; }
  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape", code: "Escape", bubbles: true, cancelable: true
    }));
  }
  function openChooser() {
    if (roadtrip().active) pressEscape();
    document.getElementById("entrance-roadtrip-reenter").dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
  }
  function choose(route, shiftKey) {
    openChooser();
    document.getElementById("entrance-roadtrip-route-" + route).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, shiftKey: shiftKey })
    );
    return roadtrip();
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

        report.shifted.calgary = choose("calgary", true);
        report.shifted.banff = choose("banff", true);
        report.shifted.abraham = choose("abraham", true);
        report.normalAbraham = choose("abraham", false);
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

console.log("rsvp.html Road Trip Shift-click shortcut:");
var source = fs.readFileSync(path.join(lib.ROOT, "rsvp.html"), "utf8");
check(/ROADTRIP_SHORTCUT_REMAINING_SECONDS = 3/.test(source),
  "the private shortcut leaves three attended seconds in the selected segment");

var result = lib.runPageSync("rsvp.html", HARNESS, 5000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2026-07-15&time=12:00#play",
  chromeFlags: "--window-size=1100,900"
});
check(result && result.errors.length === 0, "the shortcut runs without uncaught errors",
  result && result.errors);

var shifted = result && result.shifted || {};
check(shifted.calgary && shifted.calgary.route === "calgary" &&
  shifted.calgary.routeElapsed === shifted.calgary.calgarySeconds - 3,
  "Shift-click Calgary starts three seconds before its exit", shifted.calgary);
check(shifted.banff && shifted.banff.route === "banff" &&
  shifted.banff.banffElapsed === shifted.banff.banffSeconds - 3,
  "Shift-click Banff starts three seconds before its exit", shifted.banff);
check(shifted.abraham && shifted.abraham.route === "abraham" &&
  shifted.abraham.abrahamElapsed === shifted.abraham.abrahamSeconds - 3,
  "Shift-click Abraham Lake starts three seconds before Camping", shifted.abraham);

var normal = result && result.normalAbraham || {};
check(normal.route === "abraham" && normal.abrahamElapsed === 0,
  "an ordinary Abraham Lake click still starts the segment at its beginning", normal);

if (failures) process.exit(1);
console.log("Road Trip Shift-click shortcut checks passed.");

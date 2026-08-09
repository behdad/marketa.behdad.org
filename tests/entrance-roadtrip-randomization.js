#!/usr/bin/env node
// Road Trip run seeds vary the highway plan while making Continue deterministic.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState().drive.roadtrip; }
  function plan(seed) {
    window.__entranceRoadtripSetSeed(seed);
    return {
      seed: state().runSeed,
      natural: Array.from({ length: 44 }, function (_, serial) {
        var row = copy(window.__entranceRoadtripSpawnPlan(false, serial));
        row.interval = window.__entranceRoadtripSpawnInterval(false, serial);
        return row;
      }),
      pursuit: Array.from({ length: 36 }, function (_, serial) {
        var row = copy(window.__entranceRoadtripSpawnPlan(true, serial));
        row.interval = window.__entranceRoadtripSpawnInterval(true, serial);
        return row;
      }),
      furniture: Array.prototype.map.call(document.querySelectorAll(
        "#entrance-roadtrip-furniture [data-roadtrip-furniture]"), function (node) {
          return [node.getAttribute("data-roadtrip-furniture"), node.getAttribute("data-roadtrip-side")];
        })
    };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripSetRoute("banff", 0);
      var firstFreshSeed = state().runSeed;
      window.__entranceRoadtripDevStart();
      window.__entranceRoadtripSetRoute("banff", 0);
      var secondFreshSeed = state().runSeed;
      report.steps.freshSeeds = [firstFreshSeed, secondFreshSeed];
      report.steps.seedA = plan(0x12345678);
      report.steps.seedARepeat = plan(0x12345678);
      report.steps.seedB = plan(0x87654321);
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 3500, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=12:00",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function animal(type) { return type === "deer" || type === "rabbit" || type === "hedgehog"; }
function safeDeck(rows, length) {
  return rows.every(function (row, index) {
    var position = index % length;
    var previous = position ? rows[index - 1] : null;
    return ["car", "pickup", "truck", "rv", "deer", "rabbit", "hedgehog",
      "heart", "mushroom", "kiss", "frog", "inf"].indexOf(row.type) >= 0 &&
      [.5, 1.5, -.5, -1.5].indexOf(row.lane) >= 0 &&
      row.ahead >= 97 && row.ahead <= 128 && row.interval >= 21 && row.interval <= 47 &&
      !animal(rows[index - position].type) && !(previous && animal(previous.type) && animal(row.type));
  });
}

console.log("loft-day.html Road Trip seeded randomization:");
var a = result && result.steps && result.steps.seedA;
var repeat = result && result.steps && result.steps.seedARepeat;
var b = result && result.steps && result.steps.seedB;
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.steps.freshSeeds[0] > 0 && result.steps.freshSeeds[1] > 0 &&
  result.steps.freshSeeds[0] !== result.steps.freshSeeds[1],
  "each truly fresh highway run receives a new non-zero seed", result && result.steps.freshSeeds);
check(a && repeat && same(a, repeat),
  "the same seed reproduces traffic order, lanes, spacing, and roadside sides exactly");
check(a && b && !same(a.natural, b.natural) && !same(a.pursuit, b.pursuit) &&
  !same(a.furniture, b.furniture),
  "different seeds visibly change natural traffic, pursuit traffic, and roadside placement");
check(a && safeDeck(a.natural, 22) && safeDeck(a.pursuit, 18),
  "seeded decks preserve legal placements and avoid opening or consecutive wildlife hazards");

console.log("");
if (failures) {
  console.log(failures + " Road Trip randomization assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Road Trip seeded-randomization assertions passed.");

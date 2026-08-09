#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function state() { return window.__entranceRoomState(); }
  function scale(node) {
    var match = String(node && node.getAttribute("transform") || "").match(/scale\(([-.\d]+)/);
    return match ? Number(match[1]) : 0;
  }
  function collect(type) {
    window.__entranceRoadtripSetLane(.5);
    window.__entranceDriveSetMotion(120, 3);
    var before = state().drive.roadtrip;
    var node = window.__entranceRoadtripSpawn(type, .5, 10);
    var visual = {
      href: node && (node.getAttribute("href") || node.getAttribute("xlink:href")),
      kind: node && node.getAttribute("data-roadtrip-kind"),
      value: node && Number(node.getAttribute("data-roadtrip-value")),
      scale: scale(node)
    };
    window.__entranceDriveStep(100);
    var after = state().drive.roadtrip;
    return {
      before: { score: before.score, multiplier: before.multiplier, tokens: before.tokens, sounds: before.rewardSounds },
      after: { score: after.score, multiplier: after.multiplier, tokens: after.tokens, sounds: after.rewardSounds },
      visual: visual,
      released: node && node.getAttribute("visibility") === "hidden"
    };
  }
  window.addEventListener("load", function () { setTimeout(function () {
    try {
      Object.defineProperty(document, "hasFocus", { value: function () { return true; }, configurable: true });
      window.__unlockAllRooms();
      window.goToStage("balcony");
      window.__openEntranceRoom();
      window.__openEntrancePorscheDriveHud();
      if (!state().car.engineOn) window.__toggleEntrancePorscheEngine();
      window.__entranceRoadtripDevStart();
      report.plan = Array.from({ length: 22 }, function (_, serial) {
        return window.__entranceRoadtripSpawnPlan(false, serial);
      });
      report.pickups = ["heart", "mushroom", "kiss", "frog", "inf"].map(collect);
      window.__entranceRoadtripSetLane(.5);
      window.__entranceDriveSetMotion(145, 3);
      var beforeHedgehog = state().drive.roadtrip;
      var hedgehog = window.__entranceRoadtripSpawn("hedgehog", .5, 16);
      var hedgehogVisual = {
        href: hedgehog && (hedgehog.getAttribute("href") || hedgehog.getAttribute("xlink:href")),
        kind: hedgehog && hedgehog.getAttribute("data-roadtrip-kind"),
        belly: document.querySelector("#entrance-roadtrip-hedgehog .entrance-roadtrip-hedgehog-belly").getAttribute("fill"),
        scale: scale(hedgehog)
      };
      for (var tick = 0; tick < 10 && state().drive.roadtrip.wildlifeHits === beforeHedgehog.wildlifeHits; tick++) {
        window.__entranceDriveStep(80);
      }
      var afterHedgehog = state().drive.roadtrip;
      report.hedgehog = {
        visual: hedgehogVisual,
        hits: afterHedgehog.wildlifeHits - beforeHedgehog.wildlifeHits,
        collisions: afterHedgehog.collisions - beforeHedgehog.collisions,
        penalty: beforeHedgehog.score - afterHedgehog.score,
        released: hedgehog && hedgehog.getAttribute("visibility") === "hidden"
      };
      window.__entranceRoadtripDevStart();
      window.__entranceDriveSetMotion(120, 3);
      var car = window.__entranceRoadtripSpawn("car", 1.5, 40);
      report.car = { href: car && car.getAttribute("href"), scale: scale(car) };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 180); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", harness, 3000, {
  patchRaf: true,
  seedRandom: true,
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft-day.html highway objects:");
check(result && result.errors.length === 0, "object harness has no uncaught errors", result && result.errors);
var planPickups = result && result.plan && result.plan.filter(function (item) {
  return ["heart", "mushroom", "kiss", "frog", "inf"].indexOf(item.type) >= 0;
});
check(planPickups && planPickups.length === 7 &&
  ["heart", "mushroom", "kiss", "frog", "inf"].every(function (type) {
    return planPickups.some(function (item) { return item.type === type; });
  }), "the natural cycle mixes seven varied pickups among traffic and wildlife", planPickups);
var names = ["heart", "mushroom", "kiss", "frog", "inf"];
var values = [5, 7, 10, 12, 25];
check(result && result.pickups && result.pickups.every(function (item, index) {
  return item.visual.kind === "collectible" && item.visual.value === values[index] &&
    item.visual.href === "#entrance-roadtrip-" + names[index] && item.visual.scale > 0 && item.released &&
    item.after.tokens === item.before.tokens + 1 && item.after.sounds === item.before.sounds + 1 &&
    item.after.score - item.before.score === values[index] * item.before.multiplier;
}), "all five larger pickups render, sound, collect, and award their point values", result && result.pickups);
check(result && result.hedgehog && result.hedgehog.visual.kind === "animal" &&
  result.hedgehog.visual.href === "#entrance-roadtrip-hedgehog" && result.hedgehog.visual.belly === "#7f9ec0" &&
  result.hedgehog.visual.scale > 0 &&
  result.hedgehog.hits === 1 && result.hedgehog.collisions === 1 &&
  result.hedgehog.penalty >= 2 && result.hedgehog.penalty <= 8 && result.hedgehog.released,
  "the rare blue-bellied hedgehog renders as a small wildlife hazard with a light collision", result && result.hedgehog);
check(result && result.car && result.car.href === "#entrance-roadtrip-car" && result.car.scale > 0,
  "the enlarged traffic art still projects into the windshield", result && result.car);

if (failures) process.exit(1);
console.log("\nHighway object assertions passed.");

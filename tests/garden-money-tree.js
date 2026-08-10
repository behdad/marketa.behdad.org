#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  addEventListener("load", function () { setTimeout(async function () {
    try {
      goToStage("garden");
      var plant = document.getElementById("garden-money-tree");
      var hit = plant && plant.querySelector(':scope > rect[fill="transparent"]');
      var foliage = plant && Array.from(plant.querySelectorAll('g[transform^="rotate("]'));
      var before = __plantWaterState();
      var bottlesBefore = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
      plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      var afterClick = __plantWaterState();
      var bottlesAfter = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
      var second = waterSpecificPlant("garden-money-tree", function () { return true; }, "reusable");
      var third = waterSpecificPlant("garden-money-tree", function () { return true; }, "reusable");
      await new Promise(function (resolve) { setTimeout(resolve, 50); });
      var saturated = __plantWaterState();
      report.structure = {
        hit: hit && [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")],
        huntHit: plant && plant.classList.contains("hunt-hit"),
        foliageBox: foliage && foliage.reduce(function (box, leaf) {
          var b = leaf.getBBox();
          return [Math.min(box[0], b.x), Math.min(box[1], b.y), Math.max(box[2], b.x + b.width), Math.max(box[3], b.y + b.height)];
        }, [Infinity, Infinity, -Infinity, -Infinity]),
        leaflets: foliage && foliage.length,
        detailedLeaflets: foliage && foliage.filter(function (leaf) { return leaf.querySelectorAll("path").length === 3; }).length,
        junctions: plant && plant.querySelectorAll('circle[r="1.45"]').length,
        spot: gardenPlantSpots["garden-money-tree"]
      };
      report.water = {
        before: before.counts["garden-money-tree"],
        clicked: afterClick.counts["garden-money-tree"],
        neighbor: saturated.counts["garden-monstera"],
        bottleUses: bottlesBefore - bottlesAfter,
        second: second,
        third: third,
        saturated: saturated.counts["garden-money-tree"],
        overwateredAt: saturated.overwateredAt["garden-money-tree"],
        done: plant.classList.contains("done"),
        watered: plant.classList.contains("watered"),
        overwatered: plant.classList.contains("overwatered"),
        filter: getComputedStyle(plant).filter
      };
      __recoverGardenPlant("garden-money-tree");
      var recovered = __plantWaterState();
      report.recovered = {
        count: recovered.counts["garden-money-tree"],
        overwateredAt: recovered.overwateredAt["garden-money-tree"],
        overwatered: plant.classList.contains("overwatered")
      };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 300); });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.error("garden money tree: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(r.structure && r.structure.hit && r.structure.hit.join(",") === "101,184,32,64" &&
  r.structure.huntHit && r.structure.spot.x === 788 && r.structure.spot.y === 205,
  "the refined drawing preserves its interaction owner, hit area, and watering spot", r.structure);
check(r.structure && r.structure.leaflets === 10 && r.structure.detailedLeaflets === 10 && r.structure.junctions === 2,
  "two sparse five-leaf fans retain pointed blades, midribs, and quiet lateral veins", r.structure);
check(r.structure && r.structure.foliageBox && r.structure.foliageBox[0] >= 97 &&
  r.structure.foliageBox[1] >= 184 && r.structure.foliageBox[2] <= 138 && r.structure.foliageBox[3] <= 205,
  "the detailed foliage stays inside the established compact silhouette", r.structure && r.structure.foliageBox);
check(r.water && r.water.before === 0 && r.water.clicked === 1 && r.water.bottleUses === 1 &&
  r.water.neighbor === 0,
  "the existing click owner waters only the money tree and consumes one bottle use", r.water);
check(r.water && r.water.second && r.water.third && r.water.saturated === 3 && r.water.overwateredAt > 0 &&
  r.water.done && r.water.watered && r.water.overwatered && /sepia/.test(r.water.filter),
  "three waterings retain the perk and visible overwatering state", r.water);
check(r.recovered && r.recovered.count === 0 && r.recovered.overwateredAt === 0 && !r.recovered.overwatered,
  "the established recovery owner clears the money tree's saturation", r.recovered);
if (failed) process.exit(1);
console.log("garden money tree: all checks passed");

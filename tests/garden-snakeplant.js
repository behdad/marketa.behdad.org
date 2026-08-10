#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  addEventListener("load", function () { setTimeout(async function () {
    goToStage("garden");
    var plant = document.getElementById("garden-snakeplant");
    var hit = plant && plant.querySelector('rect[fill="transparent"]');
    var before = __plantWaterState();
    var bottlesBefore = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
    plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    var afterClick = __plantWaterState();
    var bottlesAfter = __gardenWaterInventoryState().levels.reduce(function (sum, n) { return sum + n; }, 0);
    var second = waterSpecificPlant("garden-snakeplant", function () { return true; }, "reusable");
    var third = waterSpecificPlant("garden-snakeplant", function () { return true; }, "reusable");
    await new Promise(function (resolve) { setTimeout(resolve, 50); });
    var saturated = __plantWaterState();
    report.structure = {
      parent: plant && plant.parentElement && plant.parentElement.id,
      hit: hit && [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")],
      huntHit: plant && plant.classList.contains("hunt-hit"),
      bloom: !!(plant && plant.querySelector(".trip-bloom-img")),
      acidTrails: document.querySelectorAll('use[href="#garden-snakeplant"]').length,
      spot: gardenPlantSpots["garden-snakeplant"]
    };
    report.water = {
      before: before.counts["garden-snakeplant"],
      clicked: afterClick.counts["garden-snakeplant"],
      neighbor: saturated.counts["garden-peacelily"],
      bottleUses: bottlesBefore - bottlesAfter,
      second: second,
      third: third,
      saturated: saturated.counts["garden-snakeplant"],
      overwateredAt: saturated.overwateredAt["garden-snakeplant"],
      done: plant.classList.contains("done"),
      watered: plant.classList.contains("watered"),
      overwatered: plant.classList.contains("overwatered"),
      filter: getComputedStyle(plant).filter
    };
    __recoverGardenPlant("garden-snakeplant");
    var recovered = __plantWaterState();
    report.recovered = {
      count: recovered.counts["garden-snakeplant"],
      overwateredAt: recovered.overwateredAt["garden-snakeplant"],
      overwatered: plant.classList.contains("overwatered")
    };
    report.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 300); });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.error("garden snake plant: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(r.structure && r.structure.parent === "garden-snakeplant-lift" && r.structure.hit &&
  r.structure.hit.join(",") === "310,140,55,95" && r.structure.huntHit && r.structure.bloom &&
  r.structure.acidTrails === 2 &&
  r.structure.spot.x === 1015 && r.structure.spot.y === 155,
  "the refined drawing preserves its lift, hit area, bloom layer, and watering spot", r.structure);
check(r.water && r.water.before === 0 && r.water.clicked === 1 && r.water.bottleUses === 1 &&
  r.water.neighbor === 0,
  "the plant's existing click owner waters only the snake plant and consumes one bottle use", r.water);
check(r.water && r.water.second && r.water.third && r.water.saturated === 3 && r.water.overwateredAt > 0 &&
  r.water.done && r.water.watered && r.water.overwatered && /sepia/.test(r.water.filter),
  "three waterings retain the perk and overwatering state with visible treatment", r.water);
check(r.recovered && r.recovered.count === 0 && r.recovered.overwateredAt === 0 && !r.recovered.overwatered,
  "the established recovery owner clears the snake plant's saturation", r.recovered);
if (failed) process.exit(1);
console.log("garden snake plant: all checks passed");

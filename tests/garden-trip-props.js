#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var report = { errors: [] };
  addEventListener("load", function () { setTimeout(function () {
    try {
      goToStage("garden");
      for (var i = 0; i < 4; i++) window.waterSpecificPlant("garden-mushroom", function () { return true; }, "reusable");
      for (var j = 0; j < 2; j++) window.waterSpecificPlant("garden-frog", function () { return true; }, "reusable");
      report.grown = __gardenTripPropWaterState();

      var mushroom = document.getElementById("garden-mushroom");
      mushroom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      mushroom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.mushroomTrip = {
        trip: __tripState(),
        water: __gardenTripPropWaterState()["garden-mushroom"]
      };
      __stopTrip();

      for (var k = 0; k < 5; k++) window.waterSpecificPlant("garden-mushroom", function () { return true; }, "reusable");
      mushroom.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      window.waterSpecificPlant("garden-frog", function () { return true; }, "bottle");
      var frog = document.getElementById("garden-frog");
      frog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      frog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      report.rotted = {
        trip: __tripState(),
        water: __gardenTripPropWaterState()["garden-mushroom"],
        frogWater: __gardenTripPropWaterState()["garden-frog"],
        classed: mushroom.classList.contains("rotted"),
        visible: mushroom.getBoundingClientRect().width > 0 && frog.getBoundingClientRect().width > 0
      };
      __recoverGardenTripProp("garden-mushroom");
      __recoverGardenTripProp("garden-frog");
      report.recovered = {
        water: __gardenTripPropWaterState()["garden-mushroom"],
        frogWater: __gardenTripPropWaterState()["garden-frog"],
        classed: mushroom.classList.contains("rotted")
      };
    } catch (err) {
      report.thrown = String(err && err.stack || err);
    }
    report.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 350); });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", harness, 2400, { patchRaf: true });
if (!r) { console.error("garden trip props: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(!r.thrown, "the probe completes", r.thrown);
check(r.grown && r.grown["garden-mushroom"].growth === 4 && !r.grown["garden-mushroom"].rotted,
  "four reusable waterings grow the mushroom by twenty percent", r.grown);
check(r.grown && r.grown["garden-frog"].growth === 2, "the frog grows in five-percent reusable-tool steps", r.grown);
check(r.mushroomTrip && r.mushroomTrip.trip.variant === "shrooms" && r.mushroomTrip.water.growth === 0,
  "starting the mushroom's trip restores its default size", r.mushroomTrip);
check(r.rotted && r.rotted.water.rotted && r.rotted.water.growth === 4 && r.rotted.classed && !r.rotted.trip.active,
  "a fifth reusable watering rots the mushroom at its grown size and disables its trip", r.rotted);
check(r.rotted && r.rotted.frogWater.rotted && r.rotted.frogWater.growth === 2 && !r.rotted.trip.active,
  "bottle water rots the frog at its current size and disables its trip", r.rotted);
check(r.rotted && r.rotted.visible, "the frog and mushroom remain rendered after watering", r.rotted);
check(r.recovered && !r.recovered.water.rotted && r.recovered.water.growth === 0 &&
  !r.recovered.frogWater.rotted && r.recovered.frogWater.growth === 0 && !r.recovered.classed,
  "rotted garden props recover at their default size after the recovery timer", r.recovered);
if (failed) process.exit(1);
console.log("garden trip props: all checks passed");

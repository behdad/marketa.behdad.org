#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], structure: null, water: null, drains: 0 };
  function boxArray(box) { return [box.x, box.y, box.width, box.height]; }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.goToStage("garden");
        var plant = document.getElementById("garden-potstand");
        var lift = document.getElementById("garden-potstand-lift");
        var offset = lift.parentNode;
        var hit = plant.querySelector(":scope > rect");
        var planter = document.getElementById("garden-potstand-planter");
        var pot = planter.querySelector(":scope > rect");
        var foliage = plant.querySelector(".garden-potstand-foliage");
        report.structure = {
          parent: plant.parentNode && plant.parentNode.id,
          liftClass: lift && lift.getAttribute("class"),
          offsetClass: offset && offset.getAttribute("class"),
          offsetTransform: offset && offset.getAttribute("transform"),
          transform: plant.getAttribute("transform"),
          waterSpot: window.gardenPlantSpots && window.gardenPlantSpots["garden-potstand"],
          hit: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")],
          pot: [pot.getAttribute("x"), pot.getAttribute("y"), pot.getAttribute("width"), pot.getAttribute("height"), pot.getAttribute("rx")],
          legs: Array.from(document.querySelectorAll("#garden-potstand-legs line")).map(function (line) {
            return ["x1", "y1", "x2", "y2"].map(function (name) { return line.getAttribute(name); }).join(",");
          }),
          foliageBox: boxArray(foliage.getBBox()),
          vines: foliage.querySelectorAll(".garden-potstand-vines > path").length,
          leaves: foliage.querySelectorAll(".garden-potstand-leaf").length,
          roundLeaves: foliage.querySelectorAll("circle").length,
          mottles: foliage.querySelectorAll(".garden-potstand-variegation > path").length,
          midribs: foliage.querySelectorAll(".garden-potstand-midribs > path").length
        };

        var baseFilter = getComputedStyle(plant).filter;
        window.drainRandomBottle = function () { report.drains++; return true; };
        plant.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise(function (resolve) { setTimeout(resolve, 40); });
        var afterClick = window.__plantWaterState().counts["garden-potstand"];
        window.waterSpecificPlant("garden-potstand", function () { return true; }, "reusable");
        window.waterSpecificPlant("garden-potstand", function () { return true; }, "reusable");
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        var wet = window.__plantWaterState();
        var overFilter = getComputedStyle(plant).filter;
        window.__recoverGardenPlant("garden-potstand");
        report.water = {
          drains: report.drains,
          afterClick: afterClick,
          count: wet.counts["garden-potstand"],
          timestamp: wet.overwateredAt["garden-potstand"],
          done: plant.classList.contains("done"),
          overwatered: /sepia/.test(overFilter),
          filterChanged: baseFilter !== overFilter,
          recoveredCount: window.__plantWaterState().counts["garden-potstand"],
          recovered: !plant.classList.contains("overwatered")
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
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html Garden tripod pothos:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true });
var s = (result && result.structure) || {};
var w = (result && result.water) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(s.parent === "garden-potstand-lift" && /\btrip-plant-lift\b/.test(s.liftClass || "") &&
  s.offsetClass === "garden-potstand-offset" && s.offsetTransform === "translate(10,0)" &&
  s.transform === "translate(3,0)" && JSON.stringify(s.hit) === JSON.stringify(["106", "196", "68", "98"]) &&
  s.waterSpot && s.waterSpot.x === 830 && s.waterSpot.y === 180,
  "the outer offset moves the complete plant and water effect ten units without changing internals", s);
check(JSON.stringify(s.pot) === JSON.stringify(["126", "204", "28", "24", "4"]) &&
  JSON.stringify(s.legs) === JSON.stringify(["140,228,128,290", "140,228,152,290", "140,228,140,290"]),
  "the white pot and three-leg stand keep their authored size and height", s);
check(s.vines === 5 && s.leaves === 20 && s.roundLeaves === 0 && s.mottles === 12 && s.midribs === 3,
  "curved vines carry varied path leaves, restrained mottling, and fine midribs", s);
check(s.foliageBox && s.foliageBox[0] >= 106.5 && s.foliageBox[1] >= 188.5 &&
  s.foliageBox[0] + s.foliageBox[2] <= 174.5 && s.foliageBox[1] + s.foliageBox[3] <= 279.5 &&
  s.foliageBox[2] >= 66 && s.foliageBox[3] >= 90,
  "the dense crown and side cascades stay inside the established plant footprint", s.foliageBox);
check(w.drains === 1 && w.afterClick === 1 && w.count === 3 && w.timestamp > 0 && w.done &&
  w.overwatered && w.filterChanged && w.recoveredCount === 0 && w.recovered,
  "a real plant click and two more waterings still trigger and recover owned overwater state", w);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/class="garden-potstand-offset" transform="translate\(10,0\)">\s*<g class="trip-plant-lift" id="garden-potstand-lift"><g id="garden-potstand" class="hunt-hit" transform="translate\(3,0\)">\s*<rect x="106" y="196" width="68" height="98" fill="transparent"\/>/.test(source) &&
  /class="garden-potstand-variegation"/.test(source) && /class="garden-potstand-midribs"/.test(source),
  "the code-native SVG keeps the established interaction owner and pothos anatomy");

console.log("");
if (failures) {
  console.log(failures + " Garden tripod-pothos assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Garden tripod-pothos assertions passed.");

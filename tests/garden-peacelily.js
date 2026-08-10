#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], structure: null, water: null };
  function boxArray(box) { return [box.x, box.y, box.width, box.height]; }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.goToStage("garden");
        var plant = document.getElementById("garden-peacelily");
        var lift = document.getElementById("garden-peacelily-lift");
        var hit = plant.querySelector(":scope > rect");
        var foliage = plant.querySelector(".garden-peacelily-foliage");
        report.structure = {
          parent: plant.parentNode && plant.parentNode.id,
          liftClass: lift && lift.getAttribute("class"),
          hit: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")],
          foliageBox: boxArray(foliage.getBBox()),
          leaves: foliage.querySelectorAll(".garden-peacelily-leaf").length,
          sheens: foliage.querySelectorAll(".garden-peacelily-sheen").length,
          ribs: foliage.querySelectorAll(".garden-peacelily-ribs > path").length,
          spathes: foliage.querySelectorAll(".garden-peacelily-spathe").length,
          spadices: foliage.querySelectorAll(".garden-peacelily-spadix").length
        };

        var before = window.__plantWaterState().counts["garden-peacelily"];
        var baseFilter = getComputedStyle(plant).filter;
        for (var i = 0; i < 3; i++) {
          window.waterSpecificPlant("garden-peacelily", function () { return true; }, "reusable");
        }
        await new Promise(function (resolve) { setTimeout(resolve, 80); });
        var wet = window.__plantWaterState();
        var overFilter = getComputedStyle(plant).filter;
        window.__recoverGardenPlant("garden-peacelily");
        report.water = {
          before: before,
          count: wet.counts["garden-peacelily"],
          timestamp: wet.overwateredAt["garden-peacelily"],
          done: plant.classList.contains("done"),
          overwatered: /sepia/.test(overFilter),
          filterChanged: baseFilter !== overFilter,
          recoveredCount: window.__plantWaterState().counts["garden-peacelily"],
          recovered: !plant.classList.contains("overwatered"),
          hitStillExact: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")].join("|") === "378|198|64|130"
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

console.log("loft-day.html Garden peace lily:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true });
var s = (result && result.structure) || {};
var w = (result && result.water) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(s.parent === "garden-peacelily-lift" && /\btrip-plant-lift\b/.test(s.liftClass || "") &&
  JSON.stringify(s.hit) === JSON.stringify(["378", "198", "64", "130"]),
  "the established lift wrapper, id owner, and hit rectangle remain exact", s);
check(s.leaves === 9 && s.sheens === 3 && s.ribs === 9 && s.spathes === 1 && s.spadices === 1,
  "the plant has nine layered leaves, proportional sheen and ribs, and one prominent bloom", s);
check(s.foliageBox && s.foliageBox[0] >= 377.5 && s.foliageBox[1] >= 197.5 &&
  s.foliageBox[0] + s.foliageBox[2] <= 442.5 && s.foliageBox[1] + s.foliageBox[3] < 292.5 &&
  s.foliageBox[2] > 60 && s.foliageBox[3] > 90,
  "the taller dense silhouette fills its existing target without crowding either neighbor", s.foliageBox);
check(w.before === 0 && w.count === 3 && w.timestamp > 0 && w.done && w.overwatered &&
  w.filterChanged && w.recoveredCount === 0 && w.recovered && w.hitStillExact,
  "three accepted waterings still trigger and recover the owned overwater state", w);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/id="garden-peacelily" class="hunt-hit">\s*<rect x="378" y="198" width="64" height="130" fill="transparent"\/>/.test(source) &&
  /class="garden-peacelily-spathe"/.test(source) && /class="garden-peacelily-spadix"/.test(source),
  "the code-native SVG keeps the established interaction owner and authored flower anatomy");

console.log("");
if (failures) {
  console.log(failures + " Garden peace-lily assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Garden peace-lily assertions passed.");

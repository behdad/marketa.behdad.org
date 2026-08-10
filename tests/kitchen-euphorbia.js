#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], structure: null, interaction: null };
  addEventListener("load", function () {
    setTimeout(async function () {
      try {
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        window.goToStage("kitchen");
        var plant = document.getElementById("kitchen-plant");
        var hit = plant.querySelector(":scope > rect");
        var stems = document.getElementById("kitchen-euphorbia-stems");
        var pot = document.getElementById("kitchen-euphorbia-pot");
        var soil = document.getElementById("kitchen-euphorbia-soil");
        var pattern = document.getElementById("kitchen-euphorbia-pot-pattern");
        var box = plant.getBBox();
        report.structure = {
          id: plant.id,
          className: plant.getAttribute("class"),
          transform: plant.getAttribute("transform"),
          hit: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height"), hit.getAttribute("fill")],
          box: [box.x, box.y, box.width, box.height],
          stemsTransform: stems.getAttribute("transform"),
          stems: stems.querySelectorAll(".kitchen-euphorbia-stem").length,
          ridgePaths: stems.querySelectorAll(".kitchen-euphorbia-ridges > path").length,
          spinePaths: stems.querySelectorAll(".kitchen-euphorbia-spines > path").length,
          leaves: stems.querySelectorAll(".kitchen-euphorbia-leaf").length,
          pot: pot && pot.getAttribute("d"),
          potFill: pot && pot.getAttribute("fill"),
          soil: soil && [soil.getAttribute("cx"), soil.getAttribute("cy"), soil.getAttribute("rx"), soil.getAttribute("ry")],
          patternPaths: pattern && pattern.querySelectorAll(":scope > path").length,
          patternStroke: pattern && pattern.getAttribute("stroke"),
          baseFilter: getComputedStyle(plant).filter
        };

        var sounds = [], droplets = [];
        window.playWaterSound = function (id) { sounds.push(id); };
        window.spawnWaterDroplets = function (owner, x, y) { droplets.push([owner && owner.id, x, y]); };
        plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await new Promise(function (resolve) { setTimeout(resolve, 70); });
        var clickState = { watered: plant.classList.contains("watered"), animation: getComputedStyle(plant).animationName };
        plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await new Promise(function (resolve) { setTimeout(resolve, 70); });
        document.getElementById("loft-game-strip").classList.add("uv-mode");
        report.interaction = {
          click: clickState,
          replay: { watered: plant.classList.contains("watered"), animation: getComputedStyle(plant).animationName },
          sounds: sounds,
          droplets: droplets,
          uvFilter: getComputedStyle(plant).filter,
          owner: plant.id,
          hitStillExact: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")]
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
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

console.log("loft-day.html Kitchen Euphorbia:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2800, { patchRaf: true, forceMotion: true });
var s = (result && result.structure) || {};
var i = (result && result.interaction) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(s.id === "kitchen-plant" && s.className === "hunt-hit" && s.transform === null &&
  JSON.stringify(s.hit) === JSON.stringify(["640", "250", "46", "72", "transparent"]),
  "the existing Kitchen plant remains the unchanged interaction and hit owner", s);
check(s.stems === 5 && s.ridgePaths === 2 && s.spinePaths === 4 && s.leaves === 9 &&
  s.stemsTransform === "translate(0,4)",
  "five varied ridged columns carry serrated spines and sparse oval edge leaves", s);
check(s.pot === "M650 299 L653 317 Q664 321 675 317 L678 299 Z" &&
  s.potFill === "url(#kitchen-euphorbia-pot-grad)" &&
  JSON.stringify(s.soil) === JSON.stringify(["664", "298.7", "12.5", "2.35"]) &&
  s.patternPaths === 3 && s.patternStroke === "#294f3d",
  "the cream dimensional planter keeps a soil rim and dark-green repeating geometry", s);
check(s.box && s.box[0] === 640 && s.box[2] === 46 && s.box[3] <= 80 && s.box[3] >= 74 && s.box[1] >= 242 && s.box[1] <= 246,
  "the taller authored silhouette stays within the existing right-side footprint", s.box);
check(/saturate/.test(s.baseFilter || "") && /brightness/.test(s.baseFilter || ""),
  "the established plant color-filter owner still applies", s.baseFilter);
check(i.click && i.click.watered && i.click.animation === "plant-perk" &&
  i.replay && i.replay.watered && i.replay.animation === "plant-perk" &&
  JSON.stringify(i.sounds) === JSON.stringify(["kitchen-plant", "kitchen-plant"]) &&
  JSON.stringify(i.droplets) === JSON.stringify([["loft-game-strip", 664, 250], ["loft-game-strip", 664, 250]]),
  "real click and replay watering retain their reaction, sound owner, and droplet origin", i);
check(/drop-shadow/.test(i.uvFilter || "") && i.owner === "kitchen-plant" &&
  JSON.stringify(i.hitStillExact) === JSON.stringify(["640", "250", "46", "72"]),
  "UV state and interaction geometry remain owned by the same group", i);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/var kitchenPlant = document\.getElementById\("kitchen-plant"\);[\s\S]*?kitchenPlant\.addEventListener\("click", waterKitchenPlant\);[\s\S]*?kitchenPlant\.addEventListener\("keydown"/.test(source) &&
  /spawnWaterDroplets\(stripEl, 664, 250\)/.test(source),
  "the existing Kitchen watering listeners and effect coordinates are unchanged");

console.log("");
if (failures) {
  console.log(failures + " Kitchen Euphorbia assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Kitchen Euphorbia assertions passed.");

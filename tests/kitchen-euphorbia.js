#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], structure: null, layering: null, interaction: null };
  addEventListener("load", function () {
    setTimeout(async function () {
      try {
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        window.__goToStage("kitchen");
        var plant = document.getElementById("kitchen-plant");
        var hit = plant.querySelector(":scope > rect");
        var stems = document.getElementById("kitchen-euphorbia-stems");
        var pot = document.getElementById("kitchen-euphorbia-pot");
        var soil = document.getElementById("kitchen-euphorbia-soil");
        var pattern = document.getElementById("kitchen-euphorbia-pot-pattern");
        var rimBack = document.getElementById("kitchen-euphorbia-rim-back");
        var rimFront = document.getElementById("kitchen-euphorbia-rim-front");
        function before(a, b) { return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING); }
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
        var dieff = document.getElementById("garden-dieffenbachia");
        var dieffHit = dieff.querySelector(":scope > rect");
        var dieffBody = Array.from(dieff.querySelectorAll(":scope > path")).find(function (path) {
          return path.getAttribute("d") === "M463 286 Q488 282 513 286 L509 316 Q488 324 467 316 Z";
        });
        var dieffBack = document.getElementById("garden-dieffenbachia-rim-back");
        var dieffGreen = document.getElementById("garden-dieffenbachia-green");
        var dieffFront = document.getElementById("garden-dieffenbachia-rim-front");
        var ladybug = document.getElementById("garden-ladybug");
        report.layering = {
          kitchen: {
            rearEllipses: rimBack.querySelectorAll(":scope > ellipse").length,
            rearBeforeGreen: before(rimBack, stems),
            greenBeforeBody: before(stems, pot),
            bodyBeforeFront: before(pot, rimFront),
            front: [rimFront.getAttribute("d"), rimFront.getAttribute("fill"), rimFront.getAttribute("stroke"), rimFront.getAttribute("stroke-width")]
          },
          dieffenbachia: {
            owner: [dieff.id, dieff.getAttribute("class"), dieff.parentNode && dieff.parentNode.id],
            hit: [dieffHit.getAttribute("x"), dieffHit.getAttribute("y"), dieffHit.getAttribute("width"), dieffHit.getAttribute("height")],
            rearEllipses: dieffBack.querySelectorAll(":scope > ellipse").length,
            bodyBeforeRear: before(dieffBody, dieffBack),
            rearBeforeGreen: before(dieffBack, dieffGreen),
            greenBeforeFront: before(dieffGreen, dieffFront),
            front: [dieffFront.getAttribute("d"), dieffFront.getAttribute("fill")],
            ladybug: [ladybug.getAttribute("transform"), ladybug.parentNode && ladybug.parentNode.id]
          }
        };

        var sounds = [], droplets = [];
        window.__playWaterSound = function (id) { sounds.push(id); };
        window.__spawnWaterDroplets = function (owner, x, y) { droplets.push([owner && owner.id, x, y]); };
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
var l = (result && result.layering) || {};
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
check(l.kitchen && l.kitchen.rearEllipses === 2 && l.kitchen.rearBeforeGreen &&
  l.kitchen.greenBeforeBody && l.kitchen.bodyBeforeFront &&
  JSON.stringify(l.kitchen.front) === JSON.stringify(["M648.8 299 A15.2 3.6 0 0 0 679.2 299", "none", "#eee5d5", "1.15"]),
  "the Kitchen stalks paint over the rear rim while its restrained front lip stays in front", l.kitchen);
check(l.dieffenbachia &&
  JSON.stringify(l.dieffenbachia.owner) === JSON.stringify(["garden-dieffenbachia", "hunt-hit", "garden-dieffenbachia-lift"]) &&
  JSON.stringify(l.dieffenbachia.hit) === JSON.stringify(["435", "155", "116", "175"]) &&
  l.dieffenbachia.rearEllipses === 2 && l.dieffenbachia.bodyBeforeRear &&
  l.dieffenbachia.rearBeforeGreen && l.dieffenbachia.greenBeforeFront &&
  JSON.stringify(l.dieffenbachia.front) === JSON.stringify(["M463 286 A25 5 0 0 0 513 286 L508.5 286 A20.5 3.1 0 0 1 467.5 286 Z", "#e9e3d5"]) &&
  JSON.stringify(l.dieffenbachia.ladybug) === JSON.stringify(["translate(488,212) scale(0.8) translate(-200,-224)", "garden-dieffenbachia"]),
  "the Dieffenbachia greens likewise sit over the rear rim and under only the original-color front lip", l.dieffenbachia);
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

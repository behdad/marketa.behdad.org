#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [], samples: {}, sawSway: false };
  var finished = false;
  function later(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function finish(error) {
    if (finished) return;
    finished = true;
    if (error) report.errors.push(String(error && error.stack || error));
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }
  addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__goToStage("garden");
        var plant = document.getElementById("garden-potstand");
        var home = plant.parentNode;
        var lift = document.getElementById("garden-potstand-lift");
        var offset = lift.parentNode;
        var stage = document.getElementById("stage-garden");
        // The first ambient delay was chosen at startup and is at most 14 seconds.
        // Every later random choice picks candidate 5/7: the real potstand owner.
        Math.random = function () { return 0.75; };
        function sample(name) {
          var relative = lift.getCTM().inverse().multiply(home.getCTM());
          var stageRelative = stage.getCTM().inverse().multiply(home.getCTM());
          report.samples[name] = {
            offset: offset.getAttribute("transform"),
            home: home.getAttribute("transform"),
            plant: plant.getAttribute("transform"),
            relative: [relative.a, relative.b, relative.c, relative.d, relative.e, relative.f],
            stageOrigin: [stageRelative.e, stageRelative.f],
            animation: getComputedStyle(plant).animationName,
            sway: plant.classList.contains("plant-sway"),
            watered: plant.classList.contains("watered"),
            lift: lift.getAttribute("transform")
          };
        }
        sample("idle");
        new MutationObserver(function () {
          if (report.sawSway || !plant.classList.contains("plant-sway")) return;
          report.sawSway = true;
          (async function () {
            sample("swayStart");
            await later(700);
            sample("swayMid");
            await later(1000);
            sample("swayEnd");

            window.__startTrip("shrooms", true, false, false);
            await later(220);
            sample("tripLift");
            window.__stopTrip(true);
            await later(80);
            sample("tripReset");

            window.__waterSpecificPlant("garden-potstand", function () { return true; }, "reusable");
            await later(70);
            sample("waterStart");
            await later(180);
            sample("waterMid");
            await later(360);
            sample("waterEnd");

            window.__waterSpecificPlant("garden-potstand", function () { return true; }, "reusable");
            await later(70);
            sample("replay");
            await window.__resetLoftGame("instant");
            await later(80);
            sample("reset");
            finish();
          })().catch(finish);
        }).observe(plant, { attributes: true, attributeFilter: ["class"] });
        setTimeout(function () { if (!report.sawSway) finish(new Error("ambient potstand sway did not fire")); }, 15000);
      } catch (error) {
        finish(error);
      }
    }, 250);
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
function placed(sample) {
  var relative = sample && sample.relative;
  return sample && sample.offset === "translate(10,0)" && sample.home === "translate(3,0)" &&
    sample.plant === null && relative && Math.abs(relative[0] - 1) < 0.000001 &&
    Math.abs(relative[1]) < 0.000001 && Math.abs(relative[2]) < 0.000001 &&
    Math.abs(relative[3] - 1) < 0.000001 && Math.abs(relative[4] - 3) < 0.000001 &&
    Math.abs(relative[5]) < 0.000001;
}

console.log("loft-day.html Garden tripod-pothos transform ownership:");
var result = lib.runPageSync("rsvp.html", HARNESS, 20000, { patchRaf: true, forceMotion: true });
var samples = (result && result.samples) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && result.sawSway && samples.swayStart && samples.swayStart.sway && samples.swayStart.animation === "plant-sway" &&
  samples.swayMid && samples.swayMid.sway && samples.swayMid.animation === "plant-sway" &&
  samples.swayEnd && !samples.swayEnd.sway,
  "the real autonomous scheduler starts, runs, and clears the potstand sway", samples);
check(["idle", "swayStart", "swayMid", "swayEnd"].every(function (name) { return placed(samples[name]); }) &&
  ["idle", "swayStart", "swayMid", "swayEnd"].every(function (name) {
    return JSON.stringify(samples[name].stageOrigin) === JSON.stringify(samples.idle.stageOrigin);
  }), "the approved +10 outer and +3 inner placement never jump during autonomous sway", samples);
check(placed(samples.tripLift) && samples.tripLift.lift && samples.tripLift.lift !== "translate(0.00,0.00) rotate(0.00 140 290)" &&
  placed(samples.tripReset) && samples.tripReset.lift === null,
  "the independent trip-lift wrapper moves and resets without consuming static placement", samples);
check(placed(samples.waterStart) && placed(samples.waterMid) && placed(samples.waterEnd) &&
  samples.waterStart.watered && samples.waterStart.animation === "plant-perk" &&
  samples.waterMid.watered && samples.waterMid.animation === "plant-perk",
  "the real watering reaction keeps the same authored x placement from start through completion", samples);
check(placed(samples.replay) && samples.replay.watered && samples.replay.animation === "plant-perk",
  "a replayed reaction restarts on the animated child without resurrecting the old position", samples.replay);
check(placed(samples.reset) && !samples.reset.sway && !samples.reset.watered && samples.reset.lift === null,
  "a real loft reset clears reaction and lift state while retaining the static +10/+3 home", samples.reset);

console.log("");
if (failures) {
  console.log(failures + " Garden potstand transform assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Garden potstand transform assertions passed.");

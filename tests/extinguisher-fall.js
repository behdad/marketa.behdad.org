#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var INTERACTION_HARNESS = String.raw`<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function run() {
    var extinguisher = document.getElementById("kitchen-extinguisher");
    var stage = document.getElementById("stage-kitchen");
    var impact = document.getElementById("kitchen-extinguisher-impact");
    impact.style.setProperty("transition", "none", "important");
    var initialTransform = getComputedStyle(extinguisher).transform;
    var hissCalls = 0, dropCalls = 0;
    window.__playExtinguisherHissSound = function () { hissCalls++; };
    window.__playExtinguisherDropSound = function () { dropCalls++; };

    extinguisher.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await sleep(580);
    report.steps.firstClick = {
      fallen: extinguisher.classList.contains("fallen"),
      dropping: extinguisher.classList.contains("dropping"),
      moved: getComputedStyle(extinguisher).transform !== initialTransform,
      marked: stage.classList.contains("extinguisher-fallen") && parseFloat(getComputedStyle(impact).opacity) > 0.9,
      floorLayer: extinguisher.nextElementSibling && extinguisher.nextElementSibling.id === "kitchen-sunrays",
      hit: extinguisher.classList.contains("hunt-hit"),
      hissCalls: hissCalls,
      dropCalls: dropCalls,
      saved: window.__captureCheckpointSystems()["kitchen-extinguisher"]
    };

    window.__restoreCheckpointSystems({}, "beforeStage");
    report.steps.missingSave = {
      wall: !extinguisher.classList.contains("fallen") && !stage.classList.contains("extinguisher-fallen")
    };
    window.__restoreCheckpointSystems({ "kitchen-extinguisher": { fallen: true } }, "beforeStage");
    report.steps.restored = {
      fallen: extinguisher.classList.contains("fallen"),
      marked: stage.classList.contains("extinguisher-fallen"),
      silent: hissCalls === 0 && dropCalls === 1
    };

    var powder = null;
    window.__spawnPowderBurst = function (_svg, x, y, _color, _count, angle) {
      powder = { x: x, y: y, angle: angle };
    };
    extinguisher.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await sleep(850);
    report.steps.secondClick = {
      wall: !extinguisher.classList.contains("fallen") && !stage.classList.contains("extinguisher-fallen"),
      wallLayer: extinguisher.nextElementSibling && extinguisher.nextElementSibling.id === "kitchen-scoops",
      hit: extinguisher.classList.contains("hunt-hit"),
      hissCalls: hissCalls,
      dropCalls: dropCalls,
      powder: powder,
      saved: window.__captureCheckpointSystems()["kitchen-extinguisher"] || null
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { report.errors.push(String(error && error.stack || error)); })
        .then(function () {
          report.errors = report.errors.concat(window.__errs || []);
          var pre = document.createElement("pre");
          pre.id = "__report";
          pre.textContent = JSON.stringify(report);
          document.body.appendChild(pre);
        });
    }, 300);
  });
})();
</script>`;

var CONTINUE_HARNESS = String.raw`<script>
(function () {
  var saved = {
    version: 1,
    savedAt: Date.now() - 120000,
    progress: { room: "office", maxUnlocked: 4, phase2: true, party: false, daylight: true, bbq: false },
    puzzle: {}, phone: null, album: null,
    systems: { "kitchen-extinguisher": { fallen: true } }
  };
  if (!sessionStorage.getItem("extinguisher-continue-seeded")) {
    sessionStorage.setItem("extinguisher-continue-seeded", "1");
    localStorage.setItem("loftCheckpoint:v1", JSON.stringify(saved));
    location.reload();
    return;
  }
  var report = { errors: [], steps: {} };
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        var gate = document.getElementById("loft-recovery-gate");
        var button = gate && gate.querySelector(".loft-recovery-btn");
        if (button) button.click();
        var extinguisher = document.getElementById("kitchen-extinguisher");
        var stage = document.getElementById("stage-kitchen");
        report.steps.continued = {
          gateClosed: !document.getElementById("loft-recovery-gate"),
          fallen: extinguisher.classList.contains("fallen"),
          marked: stage.classList.contains("extinguisher-fallen"),
          saved: window.__captureCheckpointSystems()["kitchen-extinguisher"]
        };
      } catch (error) { report.errors.push(String(error && error.stack || error)); }
      report.errors = report.errors.concat(window.__errs || []);
      var pre = document.createElement("pre");
      pre.id = "__report";
      pre.textContent = JSON.stringify(report);
      document.body.appendChild(pre);
    }, 350);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : ""));
  }
}

function runInteraction(label, options) {
  console.log(label + ":");
  var result = lib.runPageSync("rsvp.html", INTERACTION_HARNESS, 3500,
    Object.assign({ patchRaf: true }, options));
  if (!result) {
    check(false, "harness produced a report");
    return;
  }
  var steps = result.steps;
  check(result.errors.length === 0, "interaction produces no runtime errors", result.errors);
  check(steps.firstClick && steps.firstClick.fallen && !steps.firstClick.dropping &&
    steps.firstClick.moved && steps.firstClick.marked && steps.firstClick.floorLayer && steps.firstClick.hit,
    "first click settles the usable extinguisher sideways over its floor mark", steps.firstClick);
  check(steps.firstClick && steps.firstClick.hissCalls === 0 && steps.firstClick.dropCalls === 1,
    "first click plays only the landing sound", steps.firstClick);
  check(steps.firstClick && steps.firstClick.saved && steps.firstClick.saved.fallen === true,
    "the settled fall is captured for recovery", steps.firstClick);
  check(steps.missingSave && steps.missingSave.wall,
    "a missing checkpoint row restores the wall position", steps.missingSave);
  check(steps.restored && steps.restored.fallen && steps.restored.marked && steps.restored.silent,
    "checkpoint restore settles the fallen state without replaying sound", steps.restored);
  check(steps.secondClick && steps.secondClick.wall && steps.secondClick.wallLayer && steps.secondClick.hit &&
    steps.secondClick.hissCalls === 1 && steps.secondClick.dropCalls === 1 && steps.secondClick.powder &&
    steps.secondClick.powder.x > 580 && steps.secondClick.powder.x < 630 &&
    steps.secondClick.powder.y > 310 && steps.secondClick.powder.y < 340 &&
    steps.secondClick.powder.angle === 88 && steps.secondClick.saved === null,
    "second click resets the game, floor mark, and wall position", steps.secondClick);
  console.log("");
}

runInteraction("Extinguisher fall (full motion)", { forceMotion: true });
runInteraction("Extinguisher fall (reduced motion)", { forceReduce: true });

console.log("Extinguisher Continue recovery:");
var continued = lib.runPageSync("loft-day.html", CONTINUE_HARNESS, 2200, { patchRaf: true });
check(continued && continued.errors.length === 0, "Continue produces no runtime errors", continued && continued.errors);
check(continued && continued.steps.continued && continued.steps.continued.gateClosed &&
  continued.steps.continued.fallen && continued.steps.continued.marked &&
  continued.steps.continued.saved && continued.steps.continued.saved.fallen === true,
  "Continue restores and recaptures the fallen extinguisher with its impact mark",
  continued && continued.steps.continued);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

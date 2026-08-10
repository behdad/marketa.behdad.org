#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function levels() { return __gardenWaterInventoryState().levels.slice(); }
  function box(el) {
    var r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height];
  }
  function sameBox(a, b) {
    return a.every(function (value, index) { return Math.abs(value - b[index]) < 0.2; });
  }
  function tapBottles(el) {
    var r = el.getBoundingClientRect(), x = r.left + r.width * 0.2, y = r.top + r.height * 0.6;
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 71, button: 0, buttons: 1, clientX: x, clientY: y }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 71, button: 0, clientX: x, clientY: y }));
  }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      goToStage("garden");
      await sleep(850);
      var bottles = document.getElementById("garden-bottles");
      var wiggle = document.getElementById("garden-empty-bottles-wiggle");
      var moneyTree = document.getElementById("garden-money-tree");
      var peaceLily = document.getElementById("garden-peacelily");
      var homeBox = box(bottles);
      var additions = 0;
      new MutationObserver(function (rows) {
        rows.forEach(function (row) {
          if (row.attributeName === "class" && bottles.classList.contains("empty-wiggle")) additions++;
        });
      }).observe(bottles, { attributes: true, attributeFilter: ["class"] });

      for (var a = 0; a < 4; a++) drainBottleByIndex(0);
      for (var b = 0; b < 4; b++) drainBottleByIndex(1);
      for (var c = 0; c < 3; c++) drainBottleByIndex(2);
      var usableBefore = levels();
      moneyTree.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      report.usable = {
        before: usableBefore,
        after: levels(),
        moneyTree: __plantWaterState().counts["garden-money-tree"],
        wiggle: bottles.classList.contains("empty-wiggle"),
        additions: additions
      };

      var stateBefore = JSON.stringify(__plantWaterState());
      var levelsBefore = levels();
      var captionBefore = document.getElementById("hunt-caption").innerHTML;
      var stateChanges = 0;
      function changed() { stateChanges++; }
      addEventListener("loft:statechange", changed);
      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      report.failed = {
        active: bottles.classList.contains("empty-wiggle"),
        animation: getComputedStyle(wiggle).animationName,
        bottleChildren: wiggle.querySelectorAll(":scope > .hunt-hit").length,
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore),
        plantsSame: JSON.stringify(__plantWaterState()) === stateBefore,
        captionSame: document.getElementById("hunt-caption").innerHTML === captionBefore,
        stateChanges: stateChanges,
        outerTransform: bottles.getAttribute("transform"),
        hitOwners: Array.from(wiggle.querySelectorAll(":scope > g")).every(function (el) { return el.classList.contains("hunt-hit"); })
      };

      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      var replayCleared = !bottles.classList.contains("empty-wiggle");
      await sleep(70);
      var replayActive = bottles.classList.contains("empty-wiggle");
      await sleep(680);
      report.replay = {
        cleared: replayCleared,
        active: replayActive,
        additions: additions,
        cleaned: !bottles.classList.contains("empty-wiggle") && getComputedStyle(wiggle).transform === "none",
        stateSame: JSON.stringify(__plantWaterState()) === stateBefore && JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      tapBottles(bottles);
      document.getElementById("garden-crate").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      report.nonwatering = {
        wiggle: bottles.classList.contains("empty-wiggle"),
        additions: additions,
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      for (var d = 0; d < 5; d++) waterSpecificPlant("garden-mushroom", function () { return true; }, "reusable");
      var rottedBefore = JSON.stringify(__gardenTripPropWaterState());
      waterSpecificPlant("garden-mushroom", function () { return false; }, "bottle");
      await sleep(70);
      report.unrelatedGate = {
        wiggle: bottles.classList.contains("empty-wiggle"),
        additions: additions,
        tripSame: JSON.stringify(__gardenTripPropWaterState()) === rottedBefore,
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      var activeBeforeReset = bottles.classList.contains("empty-wiggle");
      var plantsBeforeReset = JSON.stringify(__plantWaterState());
      resetBottles();
      report.reset = {
        activeBefore: activeBeforeReset,
        cleaned: !bottles.classList.contains("empty-wiggle"),
        levels: levels(),
        plantsSame: JSON.stringify(__plantWaterState()) === plantsBeforeReset,
        home: sameBox(homeBox, box(bottles)),
        childTranslate: Array.from(wiggle.querySelectorAll(":scope > g")).map(function (el) { return el.style.translate || ""; })
      };
      removeEventListener("loft:statechange", changed);
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

var result = lib.runPageSync("rsvp.html", HARNESS, 4800, { patchRaf: true, forceMotion: true });
if (!result) { console.error("garden empty bottles: no report"); process.exit(1); }
var REDUCED_HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      goToStage("garden");
      await sleep(850);
      var bottles = document.getElementById("garden-bottles");
      var wiggle = document.getElementById("garden-empty-bottles-wiggle");
      var before = wiggle.getBoundingClientRect();
      for (var i = 0; i < 3; i++) while (drainBottleByIndex(i)) {}
      document.getElementById("garden-money-tree").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      var during = wiggle.getBoundingClientRect();
      report.active = bottles.classList.contains("empty-wiggle");
      report.animation = getComputedStyle(wiggle).animationName;
      report.stationary = Math.abs(before.left - during.left) < 0.2 && Math.abs(before.top - during.top) < 0.2;
      await sleep(680);
      report.cleaned = !bottles.classList.contains("empty-wiggle");
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }, 300); });
})();
</script>`;
var reduced = lib.runPageSync("rsvp.html", REDUCED_HARNESS, 3000, {
  patchRaf: true, forceReduce: true, chromeFlags: "--force-prefers-reduced-motion=reduce"
});
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!result.errors.length, "no uncaught page errors", result.errors);
check(result.usable && result.usable.before.join(",") === "0,0,1" && result.usable.after.join(",") === "0,0,0" &&
  result.usable.moneyTree === 1 && !result.usable.wiggle && result.usable.additions === 0,
  "a real plant click consumes the last usable bottle without an empty-inventory reaction", result.usable);
check(result.failed && result.failed.active && result.failed.animation === "garden-empty-bottles-wiggle" &&
  result.failed.bottleChildren === 3 && result.failed.levelsSame && result.failed.plantsSame && result.failed.captionSame &&
  result.failed.stateChanges === 0 && result.failed.outerTransform === "translate(-9,0)" && result.failed.hitOwners,
  "the next real plant click wiggles all three empty bottles without changing state, copy, hits, or positioning ownership", result.failed);
check(result.replay && result.replay.cleared && result.replay.active && result.replay.additions === 2 &&
  result.replay.cleaned && result.replay.stateSame,
  "repeated failed plant clicks restart and clean up the one-shot without mutating water state", result.replay);
check(result.nonwatering && !result.nonwatering.wiggle && result.nonwatering.additions === 2 && result.nonwatering.levelsSame,
  "an ordinary empty-bottle selection and an unrelated Garden click do not trigger the reaction", result.nonwatering);
check(result.unrelatedGate && !result.unrelatedGate.wiggle && result.unrelatedGate.additions === 2 &&
  result.unrelatedGate.tripSame && result.unrelatedGate.levelsSame,
  "a rotted trip prop remains owned by its independent gate even when every bottle is empty", result.unrelatedGate);
check(result.reset && result.reset.activeBefore && result.reset.cleaned && result.reset.levels.join(",") === "4,4,4" &&
  result.reset.plantsSame && result.reset.home && result.reset.childTranslate.every(function (value) { return !value || value === "0px" || value === "0px 0px"; }),
  "Reset clears the transient while restoring only the established bottle inventory and home positions", result.reset);
check(reduced && !reduced.errors.length && reduced.active && reduced.animation === "none" && reduced.stationary && reduced.cleaned,
  "reduced motion keeps the bottles still and retires the transient on the same bounded timer", reduced);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?#garden-bottles\.empty-wiggle #garden-empty-bottles-wiggle\{animation:none\}/.test(source),
  "reduced motion suppresses the bottle movement while timer cleanup still retires its class");
if (failed) process.exit(1);
console.log("garden empty bottles: all checks passed");

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
  function sampleAnimations(wiggles) {
    var running = wiggles.map(function (wiggle) {
      var animation = wiggle.getAnimations()[0];
      if (!animation) return false;
      animation.pause();
      animation.currentTime = 180;
      return true;
    });
    return {
      running: running,
      transforms: wiggles.map(function (wiggle) { return getComputedStyle(wiggle).transform; })
    };
  }
  function tapBottle(el, index) {
    var r = el.getBoundingClientRect();
    var x = r.left + r.width * ([.174, .522, .848][index]);
    var y = r.top + r.height * 0.6;
    el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 71, button: 0, buttons: 1, clientX: x, clientY: y }));
    el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 71, button: 0, clientX: x, clientY: y }));
  }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      window.__goToStage("garden");
      await sleep(850);
      var bottles = document.getElementById("garden-bottles");
      var wiggles = [1, 2, 3].map(function (n) { return document.getElementById("garden-empty-bottle-wiggle-" + n); });
      var bottleEls = [1, 2, 3].map(function (n) { return document.getElementById("garden-bottle-" + n); });
      var moneyTree = document.getElementById("garden-money-tree");
      var peaceLily = document.getElementById("garden-peacelily");
      var homeBox = box(bottles);
      var homeBottleBoxes = bottleEls.map(box);
      var additions = [0, 0, 0];
      wiggles.forEach(function (wiggle, index) {
        new MutationObserver(function (rows) {
          rows.forEach(function (row) {
            if (row.attributeName === "class" && wiggle.classList.contains("empty-wiggle")) additions[index]++;
          });
        }).observe(wiggle, { attributes: true, attributeFilter: ["class"] });
      });
      var clinks = [];
      var originalClink = window.__playGlassClinkSound;
      window.__playGlassClinkSound = function (pitch, panId) {
        clinks.push({ pitch: pitch, panId: panId });
        return originalClink.apply(this, arguments);
      };

      tapBottle(bottles, 1);
      await sleep(150);
      report.nonemptyBottle = {
        levels: levels(),
        active: wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        clinks: clinks.slice(),
        additions: additions.slice()
      };

      for (var empty = 0; empty < 3; empty++) window.__drainBottleByIndex(1);
      var partialLevelsBefore = levels();
      var partialClinksBefore = clinks.length;
      tapBottle(bottles, 1);
      await sleep(150);
      report.partiallyEmptyBottle = {
        active: wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        animations: wiggles.map(function (wiggle) { return getComputedStyle(wiggle).animationName; }),
        clinks: clinks.slice(partialClinksBefore),
        levelsSame: JSON.stringify(levels()) === JSON.stringify(partialLevelsBefore),
        additions: additions.slice()
      };
      await sleep(760);
      report.partiallyEmptyBottle.cleaned = wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle"); });
      window.__resetBottles();
      additions = [0, 0, 0];

      for (var a = 0; a < 4; a++) window.__drainBottleByIndex(0);
      for (var b = 0; b < 4; b++) window.__drainBottleByIndex(1);
      for (var c = 0; c < 3; c++) window.__drainBottleByIndex(2);
      var usableBefore = levels();
      moneyTree.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(150);
      report.usable = {
        before: usableBefore,
        after: levels(),
        moneyTree: __plantWaterState().counts["garden-money-tree"],
        active: wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        additions: additions.slice()
      };

      var stateBefore = JSON.stringify(__plantWaterState());
      var levelsBefore = levels();
      var captionBefore = document.getElementById("hunt-caption").innerHTML;
      var stateChanges = 0, changeDetails = [];
      function changed(event) { stateChanges++; changeDetails.push(event.detail); }
      addEventListener("loft:statechange", changed);
      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(150);
      var failedLive = sampleAnimations(wiggles);
      report.failed = {
        active: wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        animations: wiggles.map(function (wiggle) { return getComputedStyle(wiggle).animationName; }),
        transforms: failedLive.transforms,
        running: failedLive.running,
        bottleChildren: bottles.querySelectorAll(":scope > .hunt-hit").length,
        wrapperParents: wiggles.map(function (wiggle) { return wiggle.parentElement.id; }),
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore),
        plantsSame: JSON.stringify(__plantWaterState()) === stateBefore,
        captionSame: document.getElementById("hunt-caption").innerHTML === captionBefore,
        stateChanges: stateChanges,
        outerTransform: bottles.getAttribute("transform"),
        hitOwners: bottleEls.every(function (el) { return el.classList.contains("hunt-hit"); }),
        additions: additions.slice()
      };

      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      var replayCleared = wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle"); });
      await sleep(150);
      var replayActive = wiggles.every(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); });
      await sleep(760);
      report.replay = {
        cleared: replayCleared,
        active: replayActive,
        additions: additions.slice(),
        cleaned: wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle") && getComputedStyle(wiggle).transform === "none"; }),
        stateSame: JSON.stringify(__plantWaterState()) === stateBefore && JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      var emptyClinksBefore = clinks.length;
      var stateChangesBeforeEmpty = stateChanges;
      var changeDetailsBeforeEmpty = changeDetails.length;
      tapBottle(bottles, 1);
      await sleep(150);
      var singleFirst = wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); });
      var singleAnimation = wiggles.map(function (wiggle) { return getComputedStyle(wiggle).animationName; });
      var singleLive = sampleAnimations(wiggles);
      tapBottle(bottles, 1);
      var singleReplayCleared = wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle"); });
      await sleep(150);
      var singleSecond = wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); });
      await sleep(760);
      var emptyClickChanges = changeDetails.slice(changeDetailsBeforeEmpty);
      report.emptyBottle = {
        first: singleFirst,
        animation: singleAnimation,
        transforms: singleLive.transforms,
        running: singleLive.running,
        replayCleared: singleReplayCleared,
        second: singleSecond,
        cleaned: wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle") && getComputedStyle(wiggle).transform === "none"; }),
        clinks: clinks.slice(emptyClinksBefore),
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore),
        plantsSame: JSON.stringify(__plantWaterState()) === stateBefore,
        stateChanges: stateChanges - stateChangesBeforeEmpty,
        unexpectedStateChanges: emptyClickChanges.filter(function (detail) {
          return !detail || detail.id !== "weather.forecast" || detail.source !== "autonomous";
        }),
        additions: additions.slice()
      };

      document.getElementById("garden-crate").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(150);
      report.nonwatering = {
        active: wiggles.some(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        additions: additions.slice(),
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      for (var d = 0; d < 5; d++) window.__waterSpecificPlant("garden-mushroom", function () { return true; }, "reusable");
      var rottedBefore = JSON.stringify(__gardenTripPropWaterState());
      window.__waterSpecificPlant("garden-mushroom", function () { return false; }, "bottle");
      await sleep(150);
      report.unrelatedGate = {
        active: wiggles.some(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); }),
        additions: additions.slice(),
        tripSame: JSON.stringify(__gardenTripPropWaterState()) === rottedBefore,
        levelsSame: JSON.stringify(levels()) === JSON.stringify(levelsBefore)
      };

      peaceLily.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(150);
      var activeBeforeReset = wiggles.every(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); });
      var plantsBeforeReset = JSON.stringify(__plantWaterState());
      window.__resetBottles();
      report.reset = {
        activeBefore: activeBeforeReset,
        cleaned: wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle"); }),
        levels: levels(),
        plantsSame: JSON.stringify(__plantWaterState()) === plantsBeforeReset,
        home: sameBox(homeBox, box(bottles)),
        bottleHomes: bottleEls.every(function (el, index) { return sameBox(homeBottleBoxes[index], box(el)); }),
        childTranslate: bottleEls.map(function (el) { return el.style.translate || ""; })
      };
      window.__playGlassClinkSound = originalClink;
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

var result = lib.runPageSync("rsvp.html", HARNESS, 6000, { patchRaf: true, forceMotion: true });
if (!result) { console.error("garden empty bottles: no report"); process.exit(1); }
var REDUCED_HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      window.__goToStage("garden");
      await sleep(850);
      var wiggles = [1, 2, 3].map(function (n) { return document.getElementById("garden-empty-bottle-wiggle-" + n); });
      var before = wiggles.map(function (wiggle) { return wiggle.getBoundingClientRect(); });
      for (var i = 0; i < 3; i++) while (window.__drainBottleByIndex(i)) {}
      document.getElementById("garden-money-tree").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(150);
      var during = wiggles.map(function (wiggle) { return wiggle.getBoundingClientRect(); });
      report.active = wiggles.map(function (wiggle) { return wiggle.classList.contains("empty-wiggle"); });
      report.animations = wiggles.map(function (wiggle) { return getComputedStyle(wiggle).animationName; });
      report.stationary = before.every(function (rect, index) {
        return Math.abs(rect.left - during[index].left) < 0.2 && Math.abs(rect.top - during[index].top) < 0.2 &&
          Math.abs(rect.width - during[index].width) < 0.2 && Math.abs(rect.height - during[index].height) < 0.2;
      });
      await sleep(760);
      report.cleaned = wiggles.every(function (wiggle) { return !wiggle.classList.contains("empty-wiggle"); });
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }, 300); });
})();
</script>`;
var reduced = lib.runPageSync("rsvp.html", REDUCED_HARNESS, 3300, {
  patchRaf: true, forceReduce: true, chromeFlags: "--force-prefers-reduced-motion=reduce"
});
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!result.errors.length, "no uncaught page errors", result.errors);
check(result.nonemptyBottle && result.nonemptyBottle.levels.join(",") === "4,3,4" &&
  result.nonemptyBottle.active.every(function (active) { return !active; }) &&
  result.nonemptyBottle.additions.join(",") === "0,0,0" && result.nonemptyBottle.clinks.length === 1 &&
  result.nonemptyBottle.clinks[0].pitch === 1 && result.nonemptyBottle.clinks[0].panId === "garden-bottles",
  "a direct non-empty bottle click keeps its clink and watering behavior without a wiggle", result.nonemptyBottle);
check(result.partiallyEmptyBottle && result.partiallyEmptyBottle.active.join(",") === "false,true,false" &&
  result.partiallyEmptyBottle.animations.join(",") === "none,garden-empty-bottle-wiggle-right,none" &&
  result.partiallyEmptyBottle.clinks.length === 1 && result.partiallyEmptyBottle.clinks[0].pitch === 1.4 &&
  result.partiallyEmptyBottle.clinks[0].panId === "garden-bottles" && result.partiallyEmptyBottle.levelsSame &&
  result.partiallyEmptyBottle.additions.join(",") === "0,1,0" && result.partiallyEmptyBottle.cleaned,
  "a direct click wiggles its empty bottle alone even while another bottle remains usable", result.partiallyEmptyBottle);
check(result.usable && result.usable.before.join(",") === "0,0,1" && result.usable.after.join(",") === "0,0,0" &&
  result.usable.moneyTree === 1 && result.usable.active.every(function (active) { return !active; }) && result.usable.additions.join(",") === "0,0,0",
  "a real plant click consumes the last usable bottle without an empty-inventory reaction", result.usable);
check(result.failed && result.failed.active.every(Boolean) && result.failed.animations.join(",") ===
  "garden-empty-bottle-wiggle-left,garden-empty-bottle-wiggle-right,garden-empty-bottle-wiggle-left" &&
  result.failed.running.every(Boolean) &&
  result.failed.transforms.every(function (value) { return value !== "none" && value !== "matrix(1, 0, 0, 1, 0, 0)"; }) &&
  new Set(result.failed.transforms).size === 3 && result.failed.additions.join(",") === "1,1,1" &&
  result.failed.bottleChildren === 3 && result.failed.levelsSame && result.failed.plantsSame && result.failed.captionSame &&
  result.failed.stateChanges === 0 && result.failed.outerTransform === "translate(-9,0)" && result.failed.hitOwners &&
  result.failed.wrapperParents.join(",") === "garden-bottle-1,garden-bottle-2,garden-bottle-3",
  "the next failed plant click animates all three empty bottles independently without changing state, copy, hits, or positioning ownership", result.failed);
check(result.replay && result.replay.cleared && result.replay.active && result.replay.additions.join(",") === "2,2,2" &&
  result.replay.cleaned && result.replay.stateSame,
  "repeated failed plant clicks restart and clean up the one-shot without mutating water state", result.replay);
// Virtual time may finish the first WAAPI sample before the 150ms probe; the mutation count
// proves both one-shots targeted only bottle two, while the replay probe catches one live run.
check(result.emptyBottle && result.emptyBottle.replayCleared &&
  result.emptyBottle.second.join(",") === "false,true,false" && result.emptyBottle.cleaned &&
  result.emptyBottle.clinks.length === 2 && result.emptyBottle.clinks.every(function (call) { return call.pitch === 1.4 && call.panId === "garden-bottles"; }) &&
  result.emptyBottle.levelsSame && result.emptyBottle.plantsSame && result.emptyBottle.unexpectedStateChanges.length === 0 &&
  result.emptyBottle.additions.join(",") === "2,4,2",
  "a direct empty-bottle click keeps its clink, wiggles only that bottle, replays, and cleans without state changes", result.emptyBottle);
check(result.nonwatering && !result.nonwatering.active && result.nonwatering.additions.join(",") === "2,4,2" && result.nonwatering.levelsSame,
  "an unrelated Garden click does not trigger the empty-bottle reaction", result.nonwatering);
check(result.unrelatedGate && !result.unrelatedGate.active && result.unrelatedGate.additions.join(",") === "2,4,2" &&
  result.unrelatedGate.tripSame && result.unrelatedGate.levelsSame,
  "a rotted trip prop remains owned by its independent gate even when every bottle is empty", result.unrelatedGate);
check(result.reset && result.reset.activeBefore && result.reset.cleaned && result.reset.levels.join(",") === "4,4,4" &&
  result.reset.plantsSame && result.reset.home && result.reset.bottleHomes &&
  result.reset.childTranslate.every(function (value) { return !value || value === "0px" || value === "0px 0px"; }),
  "Reset clears the transient while restoring only the established bottle inventory and home positions", result.reset);
check(reduced && !reduced.errors.length && reduced.active.every(Boolean) &&
  reduced.animations.every(function (name) { return name === "none"; }) && reduced.stationary && reduced.cleaned,
  "reduced motion keeps the bottles still and retires the transient on the same bounded timer", reduced);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/@media \(prefers-reduced-motion: reduce\)\{[\s\S]*?#garden-empty-bottle-wiggle-1\.empty-wiggle,[\s\S]*?#garden-empty-bottle-wiggle-2\.empty-wiggle,[\s\S]*?#garden-empty-bottle-wiggle-3\.empty-wiggle\{animation:none\}/.test(source),
  "reduced motion suppresses the bottle movement while timer cleanup still retires its class");
if (failed) process.exit(1);
console.log("garden empty bottles: all checks passed");

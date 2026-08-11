#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function levels() { return window.__gardenWaterInventoryState().levels.slice(); }
  function box(el) {
    var rect = el.getBoundingClientRect();
    return [rect.left, rect.top, rect.width, rect.height];
  }
  function sameBox(a, b) {
    return a.every(function (value, index) { return Math.abs(value - b[index]) < 0.2; });
  }
  function activePerks(ids) {
    return ids.filter(function (id) { return document.getElementById(id).classList.contains("watered"); });
  }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      if (window.__endAttract) window.__endAttract();
      if (window.__removeClickMe) window.__removeClickMe();
      if (window.__stopHintBlink) window.__stopHintBlink();
      window.__goToStage("garden");
      await sleep(850);
      var spots = window.__gardenPlantSpots;
      var ids = Object.keys(spots).filter(function (id) { return !spots[id].tripProp; });
      var plants = ids.map(function (id) { return document.getElementById(id); });
      var bottles = [1, 2, 3].map(function (n) { return document.getElementById("garden-empty-bottle-wiggle-" + n); });
      var home = plants.map(box);
      var homeTransforms = plants.map(function (plant) { return plant.getAttribute("transform"); });
      var additions = {};
      var perkStates = {};
      var bottleAdditions = [0, 0, 0], bottleStates = [false, false, false];
      ids.forEach(function (id, index) {
        additions[id] = 0;
        perkStates[id] = false;
        new MutationObserver(function (rows) {
          if (!rows.some(function (row) { return row.attributeName === "class"; })) return;
          var active = plants[index].classList.contains("watered");
          if (active && !perkStates[id]) additions[id]++;
          perkStates[id] = active;
        }).observe(plants[index], { attributes: true, attributeFilter: ["class"] });
      });
      bottles.forEach(function (bottle, index) {
        new MutationObserver(function (rows) {
          if (!rows.some(function (row) { return row.attributeName === "class"; })) return;
          var active = bottle.classList.contains("empty-wiggle");
          if (active && !bottleStates[index]) bottleAdditions[index]++;
          bottleStates[index] = active;
        }).observe(bottle, { attributes: true, attributeFilter: ["class"] });
      });

      var roster = [];
      for (var i = 0; i < ids.length; i++) {
        var id = ids[i], plant = plants[i];
        plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await sleep(70);
        roster.push({
          id: id,
          perk: plant.classList.contains("watered"),
          sway: plant.classList.contains("plant-sway"),
          animation: getComputedStyle(plant).animationName,
          count: window.__plantWaterState().counts[id]
        });
      }
      report.roster = {
        ids: ids,
        rows: roster,
        levels: levels(),
        tripProps: ["garden-frog", "garden-mushroom"].map(function (id) {
          var el = document.getElementById(id);
          return { id: id, perk: el.classList.contains("watered"), additions: additions[id] || 0 };
        })
      };
      await sleep(650);
      report.cleanup = { active: activePerks(ids), additions: Object.assign({}, additions) };

      var toolPlant = document.getElementById("garden-potstand");
      var toolAccepted = window.__waterSpecificPlant("garden-potstand", function () { return true; }, "reusable");
      await sleep(70);
      report.tool = {
        accepted: toolAccepted,
        perk: toolPlant.classList.contains("watered"),
        animation: getComputedStyle(toolPlant).animationName,
        count: window.__plantWaterState().counts["garden-potstand"]
      };
      await sleep(600);

      for (var d = 0; d < 3; d++) while (window.__drainBottleByIndex(d)) {}
      var failedPlant = document.getElementById("garden-peacelily");
      var failedState = JSON.stringify(window.__plantWaterState());
      var failedLevels = JSON.stringify(levels());
      failedPlant.classList.add("plant-sway");
      failedPlant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      var swayClearedImmediately = !failedPlant.classList.contains("plant-sway");
      await sleep(120);
      report.failed = {
        perk: failedPlant.classList.contains("watered"),
        swayClearedImmediately: swayClearedImmediately,
        sway: failedPlant.classList.contains("plant-sway"),
        animation: getComputedStyle(failedPlant).animationName,
        bottles: bottles.map(function (el) { return el.classList.contains("empty-wiggle"); }),
        bottleAdditions: bottleAdditions.slice(),
        stateSame: JSON.stringify(window.__plantWaterState()) === failedState,
        levelsSame: JSON.stringify(levels()) === failedLevels,
        additions: additions["garden-peacelily"]
      };

      failedPlant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      var replayCleared = !failedPlant.classList.contains("watered") &&
        bottles.every(function (el) { return !el.classList.contains("empty-wiggle"); });
      await sleep(120);
      var replayActive = failedPlant.classList.contains("watered") &&
        bottles.every(function (el) { return el.classList.contains("empty-wiggle"); });
      await sleep(800);
      report.replay = {
        cleared: replayCleared,
        active: replayActive,
        cleaned: !failedPlant.classList.contains("watered") &&
          bottles.every(function (el) { return !el.classList.contains("empty-wiggle"); }),
        bottleAdditions: bottleAdditions.slice(),
        stateSame: JSON.stringify(window.__plantWaterState()) === failedState,
        levelsSame: JSON.stringify(levels()) === failedLevels,
        additions: additions["garden-peacelily"]
      };

      var additionsBeforeDecor = JSON.stringify(additions);
      document.getElementById("garden-crate").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      report.decor = {
        perks: activePerks(ids),
        additionsSame: JSON.stringify(additions) === additionsBeforeDecor,
        levelsSame: JSON.stringify(levels()) === failedLevels
      };

      window.__resetBottles();
      document.getElementById("garden-money-tree").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await window.__resetLoftGame("instant");
      await sleep(100);
      window.__goToStage("garden");
      await sleep(850);
      report.reset = {
        perks: activePerks(ids),
        sways: ids.filter(function (id) { return document.getElementById(id).classList.contains("plant-sway"); }),
        counts: window.__plantWaterState().counts,
        levels: levels(),
        geometry: plants.every(function (plant, index) {
          return plant.getAttribute("transform") === homeTransforms[index] && sameBox(home[index], box(plant));
        })
      };
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

var result = lib.runPageSync("rsvp.html", HARNESS, 7600, { patchRaf: true, forceMotion: true });
if (!result) { console.error("garden direct plant perk: no report"); process.exit(1); }

var REDUCED_HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function rect(el) { var r = el.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      window.__goToStage("garden");
      await sleep(850);
      for (var i = 0; i < 3; i++) while (window.__drainBottleByIndex(i)) {}
      var plant = document.getElementById("garden-potstand");
      var before = rect(plant);
      plant.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      await sleep(70);
      report.active = plant.classList.contains("watered");
      report.animation = getComputedStyle(plant).animationName;
      report.stationary = JSON.stringify(rect(plant)) === JSON.stringify(before);
      report.state = window.__plantWaterState().counts["garden-potstand"];
      report.levels = window.__gardenWaterInventoryState().levels.slice();
      await sleep(800);
      report.cleaned = !plant.classList.contains("watered") &&
        [1, 2, 3].every(function (n) { return !document.getElementById("garden-empty-bottle-wiggle-" + n).classList.contains("empty-wiggle"); });
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
var expected = ["garden-dieffenbachia", "garden-money-tree", "garden-monstera", "garden-peacelily", "garden-potstand", "garden-smallpots", "garden-snakeplant"];
check(!result.errors.length, "no uncaught page errors", result.errors);
check(result.roster && result.roster.ids.slice().sort().join(",") === expected.join(",") &&
  result.roster.rows.length === expected.length && result.roster.rows.every(function (row) {
    return row.perk && !row.sway && row.animation === "plant-perk" && row.count === 1;
  }) && result.roster.tripProps.every(function (row) { return !row.perk && row.additions === 0; }),
  "every direct waterable plant owner gets the established perk, excluding the two trip props", result.roster);
check(result.cleanup && !result.cleanup.active.length && expected.every(function (id) { return result.cleanup.additions[id] === 1; }),
  "all seven direct one-shots clean up after their bounded animation", result.cleanup);
check(result.tool && result.tool.accepted && result.tool.perk && result.tool.animation === "plant-perk" && result.tool.count === 2,
  "successful reusable-tool watering retains the established perk", result.tool);
check(result.failed && result.failed.perk && result.failed.swayClearedImmediately && !result.failed.sway &&
  result.failed.animation === "plant-perk" && result.failed.bottles.every(Boolean) && result.failed.stateSame &&
  result.failed.levelsSame && result.failed.additions === 2 && result.failed.bottleAdditions.join(",") === "1,1,1",
  "an all-empty direct click perks its plant and independently wiggles all bottles without state mutation", result.failed);
check(result.replay && result.replay.cleared && result.replay.cleaned && result.replay.stateSame &&
  result.replay.levelsSame && result.replay.additions === 3 && result.replay.bottleAdditions.join(",") === "2,2,2",
  "a repeated failed click restarts and cleans both independent reactions", result.replay);
check(result.decor && !result.decor.perks.length && result.decor.additionsSame && result.decor.levelsSame,
  "an unrelated Garden decoration triggers no plant or bottle reaction", result.decor);
check(result.reset && !result.reset.perks.length && !result.reset.sways.length &&
  expected.every(function (id) { return result.reset.counts[id] === 0; }) && result.reset.levels.join(",") === "4,4,4" && result.reset.geometry,
  "Reset cancels queued perks and restores state without moving any plant owner", result.reset);
check(reduced && !reduced.errors.length && reduced.active && reduced.animation === "none" && reduced.stationary &&
  reduced.state === 0 && reduced.levels.join(",") === "0,0,0" && reduced.cleaned,
  "reduced motion suppresses movement while retaining bounded feedback and cleanup", reduced);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/if \(el && !el\.classList\.contains\("watered"\)\)[\s\S]*?if \(!el\.classList\.contains\("watered"\)\) el\.classList\.add\("plant-sway"\)/.test(source),
  "the ambient scheduler remains random but cannot overtake an active direct perk");
if (failed) process.exit(1);
console.log("garden direct plant perk: all checks passed");

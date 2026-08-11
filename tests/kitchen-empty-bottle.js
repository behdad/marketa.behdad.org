#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  function box(el) {
    var r = el.getBoundingClientRect();
    return [r.left, r.top, r.width, r.height];
  }
  function sameBox(a, b) { return a.every(function (value, index) { return Math.abs(value - b[index]) < 0.2; }); }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      window.__goToStage("kitchen");
      await sleep(850);
      var bottle = document.getElementById("kitchen-waterbottle");
      var inner = document.getElementById("kitchen-waterbottle-inner");
      var wiggle = document.getElementById("kitchen-empty-waterbottle-wiggle");
      var caption = document.getElementById("hunt-caption");
      var homeBox = box(bottle), homeTransform = bottle.getAttribute("transform");
      var hit = bottle.querySelector(":scope > rect");
      var hitGeometry = [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")];
      var additions = 0;
      new MutationObserver(function (rows) {
        rows.forEach(function (row) {
          if (row.attributeName === "class" && wiggle.classList.contains("empty-wiggle")) additions++;
        });
      }).observe(wiggle, { attributes: true, attributeFilter: ["class"] });
      var clinks = [];
      var originalClink = window.__playGlassClinkSound;
      window.__playGlassClinkSound = function (pitch, panId) {
        clinks.push({ pitch: pitch, panId: panId, levelAtSound: __kitchenWaterState().level,
          activeAtSound: wiggle.classList.contains("empty-wiggle") });
        return originalClink.apply(this, arguments);
      };

      click(bottle);
      await sleep(120);
      report.nonempty = {
        state: __kitchenWaterState(), active: wiggle.classList.contains("empty-wiggle"),
        animation: getComputedStyle(wiggle).animationName, clinks: clinks.slice(), additions: additions,
        home: sameBox(homeBox, box(bottle)), transform: bottle.getAttribute("transform")
      };

      click(bottle); click(bottle); click(bottle);
      await sleep(80);
      var emptyState = JSON.stringify(__kitchenWaterState());
      var emptyCaption = caption.innerHTML;
      var emptyBox = box(bottle);
      var stateChanges = 0, changeDetails = [];
      function changed(event) { stateChanges++; changeDetails.push(event.detail); }
      addEventListener("loft:statechange", changed);
      var emptyClinksBefore = clinks.length;
      click(bottle);
      await sleep(150);
      var animation = wiggle.getAnimations()[0];
      if (animation) { animation.pause(); animation.currentTime = 180; }
      report.empty = {
        active: wiggle.classList.contains("empty-wiggle"), animation: getComputedStyle(wiggle).animationName,
        transformed: getComputedStyle(wiggle).transform, running: !!animation,
        clinks: clinks.slice(emptyClinksBefore), stateSame: JSON.stringify(__kitchenWaterState()) === emptyState,
        captionSame: caption.innerHTML === emptyCaption, stateChanges: stateChanges,
        unexpectedStateChanges: changeDetails.filter(function (detail) {
          return !detail || detail.id !== "weather.forecast" || detail.source !== "autonomous";
        }),
        outerHome: sameBox(emptyBox, box(bottle)), outerTransform: bottle.getAttribute("transform"),
        hitGeometry: [hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")],
        wrapperParent: wiggle.parentElement.id, innerParent: inner.parentElement.id, additions: additions
      };

      click(bottle);
      var replayCleared = !wiggle.classList.contains("empty-wiggle");
      await sleep(150);
      var replayActive = wiggle.classList.contains("empty-wiggle");
      await sleep(700);
      report.replay = {
        cleared: replayCleared, active: replayActive, additions: additions,
        cleaned: !wiggle.classList.contains("empty-wiggle") && getComputedStyle(wiggle).transform === "none",
        stateSame: JSON.stringify(__kitchenWaterState()) === emptyState,
        home: sameBox(emptyBox, box(bottle)), transform: bottle.getAttribute("transform")
      };

      click(document.getElementById("kitchen-canister"));
      await sleep(120);
      report.unrelated = { active: wiggle.classList.contains("empty-wiggle"), additions: additions,
        stateSame: JSON.stringify(__kitchenWaterState()) === emptyState };

      click(bottle);
      await sleep(150);
      var activeBeforeReset = wiggle.classList.contains("empty-wiggle");
      window.__resetWaterBottle();
      report.reset = {
        activeBefore: activeBeforeReset, cleaned: !wiggle.classList.contains("empty-wiggle"),
        level: __kitchenWaterState().level, home: sameBox(homeBox, box(bottle)),
        transform: bottle.getAttribute("transform"), hitGeometry: hitGeometry
      };
      removeEventListener("loft:statechange", changed);
      window.__playGlassClinkSound = originalClink;
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(report); document.body.appendChild(pre);
  }, 300); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 5200, { patchRaf: true, forceMotion: true });
if (!result) { console.error("kitchen empty bottle: no report"); process.exit(1); }

var REDUCED_HARNESS = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function click(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  addEventListener("load", function () { setTimeout(async function () {
    try {
      window.__goToStage("kitchen");
      await sleep(850);
      var bottle = document.getElementById("kitchen-waterbottle");
      var wiggle = document.getElementById("kitchen-empty-waterbottle-wiggle");
      for (var i = 0; i < 4; i++) click(bottle);
      var before = bottle.getBoundingClientRect();
      click(bottle);
      await sleep(150);
      var during = bottle.getBoundingClientRect();
      report.active = wiggle.classList.contains("empty-wiggle");
      report.animation = getComputedStyle(wiggle).animationName;
      report.stationary = Math.abs(before.left - during.left) < 0.2 && Math.abs(before.top - during.top) < 0.2 &&
        Math.abs(before.width - during.width) < 0.2 && Math.abs(before.height - during.height) < 0.2;
      report.level = __kitchenWaterState().level;
      await sleep(700);
      report.cleaned = !wiggle.classList.contains("empty-wiggle");
    } catch (error) { report.errors.push(String(error && error.stack || error)); }
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
check(result.nonempty && result.nonempty.state.level === 3 && !result.nonempty.active && result.nonempty.animation === "none" &&
  result.nonempty.clinks.length === 1 && result.nonempty.clinks[0].pitch === 1 && result.nonempty.clinks[0].panId === "kitchen-waterbottle" &&
  result.nonempty.clinks[0].levelAtSound === 4 && !result.nonempty.clinks[0].activeAtSound && result.nonempty.additions === 0 &&
  result.nonempty.home && result.nonempty.transform === "translate(25,0)",
  "a direct non-empty click keeps its sound and drain behavior without a wiggle", result.nonempty);
check(result.empty && result.empty.active && result.empty.animation === "kitchen-empty-waterbottle-wiggle" &&
  result.empty.running && result.empty.transformed !== "none" && result.empty.clinks.length === 1 &&
  result.empty.clinks[0].pitch === 1.4 && result.empty.clinks[0].panId === "kitchen-waterbottle" &&
  result.empty.clinks[0].levelAtSound === 0 && !result.empty.clinks[0].activeAtSound && result.empty.stateSame &&
  result.empty.captionSame && result.empty.unexpectedStateChanges.length === 0 && result.empty.outerHome &&
  result.empty.outerTransform === "translate(25,0)" && result.empty.hitGeometry.join(",") === "120,164,26,70" &&
  result.empty.wrapperParent === "kitchen-waterbottle-inner" && result.empty.innerParent === "kitchen-waterbottle" &&
  result.empty.additions === 1,
  "a real direct empty click sounds first, then wiggles only the nested bottle art without state, copy, or hit-geometry mutation", result.empty);
check(result.replay && result.replay.cleared && result.replay.active && result.replay.additions === 2 && result.replay.cleaned &&
  result.replay.stateSame && result.replay.home && result.replay.transform === "translate(25,0)",
  "a repeated empty click restarts and cleans up the bounded one-shot at the same home position", result.replay);
check(result.unrelated && !result.unrelated.active && result.unrelated.additions === 2 && result.unrelated.stateSame,
  "an unrelated Kitchen click does not trigger the bottle reaction", result.unrelated);
check(result.reset && result.reset.activeBefore && result.reset.cleaned && result.reset.level === 4 && result.reset.home &&
  result.reset.transform === "translate(25,0)" && result.reset.hitGeometry.join(",") === "120,164,26,70",
  "Reset clears the transient while restoring the established water level and geometry", result.reset);
check(reduced && !reduced.errors.length && reduced.active && reduced.animation === "none" && reduced.stationary &&
  reduced.level === 0 && reduced.cleaned,
  "reduced motion keeps the bottle still and retires the transient on the same bounded timer", reduced);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var clickBody = source.match(/function clinkWaterBottle\(\)\s*\{[\s\S]*?\n    \}/);
check(clickBody && clickBody[0].indexOf("playGlassClinkSound") < clickBody[0].indexOf("triggerEmptyWaterBottleWiggle"),
  "the established glass clink remains ordered before the empty reaction");
check(/@media \(prefers-reduced-motion: reduce\)\{#kitchen-empty-waterbottle-wiggle\.empty-wiggle\{animation:none\}\}/.test(source),
  "reduced motion explicitly suppresses the wiggle while timer cleanup remains active");
if (failed) process.exit(1);
console.log("kitchen empty bottle: all checks passed");

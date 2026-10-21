#!/usr/bin/env node
"use strict";
var assert = require("assert/strict");
var lib = require("./lib");

var harness = String.raw`<pre id="__report">pending</pre>
<script>
addEventListener("load", function () { setTimeout(async function () {
  var report = {};
  try {
    var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
    var stage = document.getElementById("stage-garden");
    var polish = Array.from(stage.querySelectorAll(".garden-object-polish"));
    var glints = Array.from(stage.querySelectorAll(".garden-object-glint"));
    report.layers = polish.length;
    report.pointerTransparent = polish.every(function (el) { return getComputedStyle(el).pointerEvents === "none"; });
    report.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    report.animations = glints.map(function (el) { return getComputedStyle(el).animationName; });
    report.opacityOnly = glints.every(function (el) {
      return el.getAnimations().every(function (animation) {
        return animation.effect.getKeyframes().every(function (frame) {
          return !Object.keys(frame).some(function (key) { return /transform|translate|rotate|scale/i.test(key); });
        });
      });
    });
    window.__goToStage("office");
    await sleep(1000);
    report.parked = stage.classList.contains("stage-far");
    report.paused = glints.every(function (el) { return getComputedStyle(el).animationPlayState === "paused"; });
    window.__goToStage("garden");
    await sleep(1000);
    report.resumed = glints.every(function (el) { return getComputedStyle(el).animationPlayState === "running"; });
    var panes = Array.from(stage.querySelectorAll(".garden-mirror-glass"));
    function mirrorFills() { return panes.map(function (el) { return getComputedStyle(el).fill; }); }
    window.__setUvMode(false);
    report.mirrorNormal = mirrorFills();
    window.__setUvMode(true);
    report.mirrorUv = mirrorFills();
    window.__setUvMode(false);
    report.mirrorRestored = mirrorFills();
    var owners = new Set();
    polish.forEach(function (el) {
      for (var p = el.parentElement; p && p !== stage; p = p.parentElement) if (p.id) owners.add(p);
    });
    function geometry(el) {
      var box = el.getBBox();
      return [box.x, box.y, box.width, box.height, getComputedStyle(el).transformOrigin];
    }
    var before = Array.from(owners).map(function (el) { return { el: el, box: geometry(el) }; });
    polish.forEach(function (el) { el.remove(); });
    report.changedBounds = before.filter(function (entry) {
      var after = geometry(entry.el);
      return entry.box.some(function (value, i) {
        return i === 4 ? value !== after[i] : Math.abs(value - after[i]) > .01;
      });
    }).map(function (entry) { return { id: entry.el.id, withPolish: entry.box, original: geometry(entry.el) }; });
    report.owners = owners.size;
  } catch (error) { report.fatal = String(error && error.stack || error); }
  report.errors = window.__errs;
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 200); });
</script>`;

for (var reduced of [false, true]) {
  var result = lib.runPageSync("loft-day.html", harness, 3500,
    { patchRaf: true, forceMotion: !reduced, forceReduce: reduced,
      chromeFlags: reduced ? "--force-prefers-reduced-motion" : "" });
  assert(result && !result.fatal, JSON.stringify(result));
  assert(result.layers > 0 && result.owners > 0, "polish belongs to existing objects");
  assert(result.pointerTransparent, "polish cannot intercept input");
  assert(result.opacityOnly, "glints never animate transforms");
  assert.deepEqual(result.changedBounds, [], "polish preserves every owner's bounds and pivot");
  assert.equal(result.reduced, reduced);
  assert(result.animations.every(function (name) { return name === (reduced ? "none" : "garden-object-glint"); }));
  assert(result.parked && result.paused, "glints pause when navigation parks the garden");
  assert(result.resumed, "returning to the garden releases the room pause");
  assert.deepEqual(result.mirrorNormal, ["rgb(220, 232, 238)", "rgb(220, 232, 238)", "rgb(230, 239, 244)"],
    "normal light preserves the mirror's authored blue-grey glass");
  assert.deepEqual(result.mirrorUv, ["rgb(245, 0, 245)", "rgb(245, 0, 245)", "rgb(245, 0, 245)"],
    "the fluorescent source color is confined to blacklight");
  assert.deepEqual(result.mirrorRestored, result.mirrorNormal, "ending blacklight restores the mirror's normal glass");
  assert.deepEqual(result.errors, []);
  console.log("Garden sparkle: input, bounds, pivots and room parking pass; reduced motion " + reduced + ".");
}

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
    window.__goToStage("kitchen");
    window.__openBathroomRoom();
    await sleep(500);
    var stage = document.getElementById("bathroom-room");
    var polish = Array.from(stage.querySelectorAll(".bathroom-object-polish"));
    var glints = Array.from(stage.querySelectorAll(".bathroom-object-glint"));
    report.layers = polish.length;
    report.pointerTransparent = Array.from(stage.querySelectorAll(".bathroom-object-polish, .bathroom-object-polish *")).every(function (el) { return getComputedStyle(el).pointerEvents === "none"; });
    report.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    report.animations = glints.map(function (el) { return getComputedStyle(el).animationName; });
    report.opacityOnly = glints.every(function (el) {
      return el.getAnimations().every(function (animation) {
        return animation.effect.getKeyframes().every(function (frame) {
          return !Object.keys(frame).some(function (key) { return /transform|translate|rotate|scale/i.test(key); });
        });
      });
    });
    window.__closeBathroomRoom();
    await sleep(500);
    report.parked = !document.querySelector(".hunt-viewport").classList.contains("bathroom-room-open");
    report.paused = glints.every(function (el) { return getComputedStyle(el).animationPlayState === "paused"; });
    window.__openBathroomRoom();
    await sleep(500);
    report.resumed = glints.every(function (el) { return getComputedStyle(el).animationPlayState === "running"; });
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
  var result = lib.runPageSync("loft-day.html", harness, 3000,
    { patchRaf: true, forceMotion: !reduced, forceReduce: reduced,
      chromeFlags: reduced ? "--force-prefers-reduced-motion" : "" });
  assert(result && !result.fatal, JSON.stringify(result));
  assert(result.layers > 0 && result.owners > 0, "polish belongs to existing objects");
  assert(result.animations.length > 0, "authored glints are present in the loaded page");
  assert(result.pointerTransparent, "polish cannot intercept input");
  assert(result.opacityOnly, "glints never animate transforms");
  assert.deepEqual(result.changedBounds, [], "polish preserves every owner's bounds and pivot");
  assert.equal(result.reduced, reduced);
  assert(result.animations.every(function (name) { return name === (reduced ? "none" : "bathroom-object-glint"); }));
  assert(result.parked && result.paused, "glints pause when leaving hides the bathroom");
  assert(result.resumed, "returning to the bathroom releases the room pause");
  assert.deepEqual(result.errors, []);
  console.log("Bathroom sparkle: input, bounds, pivots and room hiding pass; reduced motion " + reduced + ".");
}

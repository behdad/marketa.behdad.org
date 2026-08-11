#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [], phases: {} };
  var records = [], mode = "real";
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function finish(error) {
    if (error) report.errors.push(String(error && error.stack || error));
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }
  addEventListener("load", function () {
    setTimeout(function () {
      (async function () {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "240");
        svg.setAttribute("height", "180");
        document.body.appendChild(svg);

        var nativeAnimate = Element.prototype.animate;
        Element.prototype.animate = function (frames, options) {
          var animation = nativeAnimate.call(this, frames, options);
          if (!this.classList.contains("garden-water-droplet")) return animation;
          var node = this;
          var timing = animation.effect.getTiming();
          var record = {
            node: node,
            mode: mode,
            createdAt: performance.now(),
            attrs: [node.getAttribute("cx"), node.getAttribute("cy"), node.getAttribute("rx"),
              node.getAttribute("ry"), node.getAttribute("fill"), node.getAttribute("opacity")],
            duration: timing.duration,
            easing: timing.easing,
            fill: timing.fill,
            frames: animation.effect.getKeyframes().map(function (frame) {
              return [frame.transform, frame.opacity];
            }),
            finishedAt: null,
            removedAt: null,
            finishOpacity: null,
            finishTransform: null,
            midOpacity: null,
            midY: null,
            connectedAfterFinish: null,
            paused: false
          };
          records.push(record);
          if (mode === "fallback") {
            animation.pause();
            record.paused = true;
          } else {
            setTimeout(function () {
              if (!node.isConnected) return;
              animation.currentTime = timing.duration / 2;
              record.midOpacity = Number(getComputedStyle(node).opacity);
              record.midY = new DOMMatrix(getComputedStyle(node).transform).m42;
              // Headless virtual time does not dispatch WAAPI finish events reliably.
              // Drive the same native final effect, then invoke the installed finish
              // callback exactly as that event does in an ordinary rendered tab.
              animation.currentTime = timing.duration;
              record.finishedAt = performance.now();
              record.finishOpacity = getComputedStyle(node).opacity;
              record.finishTransform = getComputedStyle(node).transform;
              animation.onfinish();
              Promise.resolve().then(function () { record.connectedAfterFinish = node.isConnected; });
            }, 12);
          }
          return animation;
        };

        new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            Array.from(mutation.removedNodes).forEach(function (node) {
              var record = records.find(function (item) { return item.node === node; });
              if (record) record.removedAt = performance.now();
            });
          });
        }).observe(svg, { childList: true });

        Math.random = function () { return 0.75; };
        function snapshot(phase) {
          var items = records.filter(function (record) { return record.mode === phase; });
          return {
            count: items.length,
            live: svg.querySelectorAll(".garden-water-droplet").length,
            attrs: items.map(function (record) { return record.attrs; }),
            created: items.map(function (record) { return Math.round(record.createdAt - items[0].createdAt); }),
            durations: items.map(function (record) { return record.duration; }),
            easings: items.map(function (record) { return record.easing; }),
            fills: items.map(function (record) { return record.fill; }),
            frames: items.map(function (record) { return record.frames; }),
            finished: items.map(function (record) { return record.finishedAt != null; }),
            finishOpacity: items.map(function (record) { return record.finishOpacity; }),
            finishTransform: items.map(function (record) { return record.finishTransform; }),
            midOpacity: items.map(function (record) { return record.midOpacity; }),
            midY: items.map(function (record) { return record.midY; }),
            connectedAfterFinish: items.map(function (record) { return record.connectedAfterFinish; }),
            removed: items.map(function (record) { return record.removedAt != null; }),
            removalAfterFinish: items.map(function (record) {
              return record.finishedAt == null || record.removedAt == null ? null : record.removedAt - record.finishedAt;
            }),
            removalAfterCreate: items.map(function (record) {
              return record.removedAt == null ? null : record.removedAt - record.createdAt;
            }),
            paused: items.map(function (record) { return record.paused; })
          };
        }

        spawnWaterDroplets(svg, 100, 100);
        await sleep(950);
        report.phases.real = snapshot("real");

        mode = "repeat";
        spawnWaterDroplets(svg, 100, 100);
        await sleep(40);
        spawnWaterDroplets(svg, 100, 100);
        await sleep(950);
        report.phases.repeat = snapshot("repeat");

        mode = "fallback";
        spawnWaterDroplets(svg, 100, 100);
        await sleep(950);
        report.phases.fallback = snapshot("fallback");
        Element.prototype.animate = nativeAnimate;
        finish();
      })().catch(finish);
    }, 180);
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
function all(values, predicate) { return values.every(predicate || function (value) { return !!value; }); }

console.log("loft-day.html water-droplet animation lifecycle:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4200, { forceMotion: true });
var real = result && result.phases && result.phases.real;
var repeat = result && result.phases && result.phases.repeat;
var fallback = result && result.phases && result.phases.fallback;
var expectedAttrs = [
  ["89", "78", "2", "3.2", "#7fb0d6", "0.85"],
  ["95", "78", "2", "3.2", "#7fb0d6", "0.85"],
  ["101", "78", "2", "3.2", "#7fb0d6", "0.85"],
  ["107", "78", "2", "3.2", "#7fb0d6", "0.85"],
  ["113", "78", "2", "3.2", "#7fb0d6", "0.85"]
];

check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(real && real.count === 5 && JSON.stringify(real.attrs) === JSON.stringify(expectedAttrs) &&
  JSON.stringify(real.created) === JSON.stringify([0, 90, 180, 270, 360]) &&
  all(real.durations, function (duration) { return duration === 510; }) &&
  all(real.easings, function (easing) { return easing === "ease-in"; }),
  "one watering keeps the five authored staggered drops, geometry, color, origins, duration and easing", real);
check(real && all(real.fills, function (fill) { return fill === "forwards"; }) &&
  all(real.frames, function (frames) {
    return frames.length === 2 && frames[0][0] === "translate(0px, 0px)" && frames[0][1] === "0.85" &&
      frames[1][0] === "translate(0px, 28px)" && frames[1][1] === "0";
  }), "each real fall retains its invisible final frame", real);
check(real && all(real.finished) && all(real.finishOpacity, function (opacity) { return opacity === "0"; }) &&
  all(real.finishTransform, function (transform) { return /28\)?$/.test(transform); }) &&
  all(real.midOpacity, function (opacity) { return opacity > 0 && opacity < 0.85; }) &&
  all(real.midY, function (y) { return y > 0 && y < 28; }) &&
  all(real.connectedAfterFinish, function (connected) { return connected === false; }),
  "finished drops are invisible at the fallen position and never repaint on their base row", real);
check(real && real.live === 0 && all(real.removed) &&
  all(real.removalAfterFinish, function (delay) { return delay >= 0 && delay < 8; }),
  "the finish callback removes every real drop immediately", real);
check(repeat && repeat.count === 10 && repeat.live === 0 && all(repeat.finished) && all(repeat.removed),
  "repeated watering leaves no finished droplets behind", repeat);
check(fallback && fallback.count === 5 && fallback.live === 0 && all(fallback.paused) &&
  all(fallback.finished, function (finished) { return finished === false; }) && all(fallback.removed) &&
  all(fallback.removalAfterCreate, function (delay) { return delay >= 545 && delay <= 565; }),
  "the bounded timeout removes paused drops when no finish event arrives", fallback);

console.log("");
if (failures) {
  console.log(failures + " water-droplet lifecycle assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Water-droplet lifecycle assertions passed.");

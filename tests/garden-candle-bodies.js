#!/usr/bin/env node
"use strict";

var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], structure: null, lit: null };
  function attrs(el, names) { return names.map(function (name) { return el.getAttribute(name); }); }
  function inspect(candle) {
    var holder = candle.querySelector(".garden-candle-holder");
    return {
      id: candle.id,
      classes: candle.getAttribute("class"),
      hit: attrs(candle.querySelector(":scope > rect"), ["x", "y", "width", "height"]),
      anatomy: ["holder", "holder-shade", "holder-rim", "wax", "wax-drip"].map(function (part) {
        return candle.querySelectorAll(".garden-candle-" + part).length;
      }),
      holderBox: attrs(holder, ["d", "fill", "stroke"]),
      wick: attrs(candle.querySelector(":scope > line"), ["x1", "y1", "x2", "y2", "stroke", "stroke-width"]),
      lightGeometry: Array.from(candle.querySelectorAll(".candle-glow, .candle-halo, .candle-flame")).map(function (el) {
        return [el.getAttribute("class")].concat(attrs(el, ["cx", "cy", "rx", "ry", "fill"]));
      })
    };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.goToStage("garden");
        var stage = document.getElementById("stage-garden");
        var c1 = document.getElementById("garden-candle-1");
        var c2 = document.getElementById("garden-candle-2");
        report.structure = [inspect(c1), inspect(c2)];
        c1.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        c2.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await new Promise(function (resolve) { setTimeout(resolve, 60); });
        report.lit = {
          classes: [c1.classList.contains("lit"), c2.classList.contains("lit"), c1.classList.contains("done"), c2.classList.contains("done")],
          stageGlow: [stage.classList.contains("g-c1-lit"), stage.classList.contains("g-c2-lit")],
          animations: [c1, c2].map(function (candle) { return getComputedStyle(candle.querySelector(".candle-flame")).animationName; }),
          geometry: [inspect(c1).lightGeometry, inspect(c2).lightGeometry]
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 280);
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
function hash(bytes) { return crypto.createHash("sha256").update(bytes).digest("hex"); }

console.log("loft-day.html Garden candle bodies:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3400, { patchRaf: true, forceMotion: true });
var structure = (result && result.structure) || [];
var expectedLights = [
  [["candle-glow", "68", "289", "19", "21", "url(#candle-glow-grad)"], ["candle-halo", "68", "286", "6.5", "8.5", "url(#candle-halo-grad)"], ["candle-flame", "68", "286.4", "3.1", "4.8", "#ef6626"], ["candle-flame", "68", "286", "2", "3.5", "#f8d874"]],
  [["candle-glow", "100", "295", "14", "16", "url(#candle-glow-grad)"], ["candle-halo", "100", "292", "6", "8", "url(#candle-halo-grad)"], ["candle-flame", "100", "292.4", "3", "4.6", "#ef6626"], ["candle-flame", "100", "292", "2", "3.5", "#f8d874"]]
];
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(structure.length === 2 && structure[0].id === "garden-candle-1" && structure[1].id === "garden-candle-2" &&
  structure.every(function (candle) { return /\bhunt-hit\b/.test(candle.classes || "") && candle.anatomy.every(function (count) { return count === 1; }); }),
  "both established interaction owners contain one layered holder, rim, wax pool, and drip", structure);
check(JSON.stringify(structure[0] && structure[0].hit) === JSON.stringify(["50", "286", "36", "42"]) &&
  JSON.stringify(structure[1] && structure[1].hit) === JSON.stringify(["84", "292", "28", "30"]),
  "both authored hit targets remain exact", structure);
check(JSON.stringify(structure.map(function (candle) { return candle.wick; })) === JSON.stringify([
  ["68", "294", "68", "289", "#8a7a58", "1.5"], ["100", "300", "100", "295", "#8a7a58", "1.5"]
]), "both wick geometries remain exact", structure);
check(JSON.stringify(structure.map(function (candle) { return candle.lightGeometry; })) === JSON.stringify(expectedLights),
  "glow, halo, and flame geometry remains exact", structure);
check(result && result.lit && result.lit.classes.every(Boolean) && result.lit.stageGlow.every(Boolean) &&
  result.lit.animations.every(function (name) { return name === "candle-flicker"; }) &&
  JSON.stringify(result.lit.geometry) === JSON.stringify(expectedLights),
  "real clicks still light both owners without moving their flame geometry", result && result.lit);
var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var flameHashes = ["garden-candle-1", "garden-candle-2"].map(function (id) {
  var start = source.indexOf('<g id="' + id + '"');
  var group = source.slice(start, source.indexOf("</g>", start));
  return hash((group.match(/<ellipse class="candle-(?:glow|halo|flame)"[^>]*\/>/g) || []).join("\n"));
});
var cssStart = source.indexOf(".candle-flame{");
var flameCss = source.slice(cssStart, source.indexOf("/* our kitchen candle", cssStart));
check(JSON.stringify(flameHashes) === JSON.stringify([
  "7e2aad750ec0cd1581fbd0d4cb15443366455edb399313acd1061237298d670b",
  "04da64acfa907073008943c008b88b6a6cf09d637fde7a91c05868c5fd2e4f41"
]) && hash(flameCss) === "92e4956349c99d1b6f54b7e873f8c93ba243b1e7b0d112206214ca0a7bd9e20e",
  "authored flame/glow markup and its complete Garden animation CSS remain byte-identical", { flameHashes: flameHashes, css: hash(flameCss) });

console.log("");
if (failures) {
  console.log(failures + " Garden candle-body assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Garden candle-body assertions passed.");

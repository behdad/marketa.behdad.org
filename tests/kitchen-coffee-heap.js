#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var report = { errors: [], states: {} };
  function attrs(el, names) {
    var out = {};
    names.forEach(function (name) { out[name] = el.getAttribute(name); });
    return out;
  }
  function box(el) {
    var b = el.getBBox();
    return [b.x, b.y, b.width, b.height];
  }
  function inside(inner, outer) {
    var epsilon = 0.001;
    return inner[0] >= outer[0] - epsilon && inner[1] >= outer[1] - epsilon &&
      inner[0] + inner[2] <= outer[0] + outer[2] + epsilon &&
      inner[1] + inner[3] <= outer[1] + outer[3] + epsilon;
  }
  addEventListener("load", function () { setTimeout(function () {
    try {
      var portafilter = document.getElementById("kitchen-portafilter");
      var fly = document.getElementById("kitchen-portafilter-fly");
      var grounds = document.getElementById("kitchen-portafilter-grounds");
      var silhouette = document.getElementById("kitchen-portafilter-grounds-silhouette");
      var clip = document.querySelector("#kitchen-portafilter-grounds-clip ellipse");
      var detail = Array.prototype.slice.call(grounds.querySelectorAll("path, circle"));
      grounds.style.transition = "none";
      report.owner = {
        tag: grounds.tagName.toLowerCase(),
        clipPath: grounds.getAttribute("clip-path"),
        silhouette: attrs(silhouette, ["cx", "cy", "rx", "ry"]),
        clip: attrs(clip, ["cx", "cy", "rx", "ry"]),
        box: box(grounds), silhouetteBox: box(silhouette),
        details: detail.length,
        contained: detail.every(function (el) { return inside(box(el), box(silhouette)); }),
        inlineOnly: !grounds.querySelector("image, filter"),
        side: grounds.querySelectorAll(".kitchen-grounds-side").length,
        highlight: grounds.querySelectorAll(".kitchen-grounds-highlight").length,
        flecks: grounds.querySelectorAll("circle").length
      };
      var rim = portafilter.querySelector(":scope > ellipse");
      var body = portafilter.querySelector(':scope > rect[fill="url(#kitchen-portafilter-body-grad)"]');
      report.metal = {
        rim: attrs(rim, ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"]),
        body: attrs(body, ["x", "y", "width", "height", "rx", "fill", "stroke", "stroke-width"])
      };
      ["off", "ground", "tamped", "spent"].forEach(function (step) {
        window.__setKitchenCoffeeState({ step: step, rounds: 0 });
        var style = getComputedStyle(grounds);
        report.states[step] = {
          captured: window.__captureKitchenCoffeeState().step,
          opacity: style.opacity,
          transform: style.transform,
          fill: style.fill,
          grounds: portafilter.classList.contains("has-grounds"),
          flat: portafilter.classList.contains("grounds-flat"),
          spent: portafilter.classList.contains("spent"),
          atGrinder: fly.classList.contains("at-grinder"),
          box: box(grounds)
        };
      });
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 250); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 1800, { patchRaf: true });
if (!result) { console.error("kitchen coffee heap: no report"); process.exit(1); }

var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
var ellipse = { cx: "465", cy: "181.5", rx: "13", ry: "3.3" };
var exactBox = [452, 178.2, 26, 6.6];
function sameBox(a, b) { return a && b && a.every(function (value, i) { return Math.abs(value - b[i]) < 0.001; }); }

check(!result.errors.length, "no uncaught page errors", result.errors);
check(result.owner && result.owner.tag === "g" && result.owner.clipPath === "url(#kitchen-portafilter-grounds-clip)",
  "the canonical grounds owner clips all authored detail", result.owner);
check(result.owner && JSON.stringify(result.owner.silhouette) === JSON.stringify(ellipse) &&
  JSON.stringify(result.owner.clip) === JSON.stringify(ellipse) && sameBox(result.owner.box, exactBox) &&
  sameBox(result.owner.silhouetteBox, exactBox),
  "the original outer ellipse and position remain exact", result.owner);
check(result.owner && result.owner.side === 1 && result.owner.highlight === 1 && result.owner.flecks === 7 &&
  result.owner.details === 9 && result.owner.contained && result.owner.inlineOnly,
  "the restrained side plane, highlight and flecks stay inside the mound", result.owner);
check(result.metal && JSON.stringify(result.metal.rim) === JSON.stringify({
  cx: "465", cy: "181", rx: "17", ry: "5", fill: "#d4d4d4", stroke: "#9a9a9a", "stroke-width": "1"
}) && JSON.stringify(result.metal.body) === JSON.stringify({
  x: "450", y: "181", width: "30", height: "16", rx: "4", fill: "url(#kitchen-portafilter-body-grad)", stroke: "#8f8f8f", "stroke-width": "1"
}), "the surrounding portafilter metal remains exact", result.metal);
check(result.states.off && result.states.off.captured === "off" && result.states.off.opacity === "0" &&
  !result.states.off.grounds && !result.states.off.spent,
  "grounds remain hidden before coffee is ground", result.states.off);
check(result.states.ground && result.states.ground.captured === "ground" && result.states.ground.opacity === "1" &&
  result.states.ground.transform.indexOf("matrix(1, 0, 0, 2") === 0 && result.states.ground.grounds &&
  !result.states.ground.flat && result.states.ground.atGrinder && sameBox(result.states.ground.box, exactBox),
  "fresh grounds retain the established two-times mound state at the grinder", result.states.ground);
check(result.states.tamped && result.states.tamped.captured === "tamped" && result.states.tamped.opacity === "1" &&
  result.states.tamped.transform === "none" && result.states.tamped.grounds && result.states.tamped.flat &&
  !result.states.tamped.atGrinder && sameBox(result.states.tamped.box, exactBox),
  "tamping retains the established flat basket state", result.states.tamped);
check(result.states.spent && result.states.spent.captured === "spent" && result.states.spent.opacity === "1" &&
  result.states.spent.fill === "rgb(61, 40, 24)" && !result.states.spent.grounds && result.states.spent.spent &&
  sameBox(result.states.spent.box, exactBox),
  "spent grounds retain their darker stable state", result.states.spent);

if (failed) process.exit(1);
console.log("kitchen coffee heap: all checks passed");

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
      var cup = document.getElementById("kitchen-shotcup");
      var hit = cup.querySelector(":scope > rect");
      var vessel = document.getElementById("kitchen-shotcup-vessel");
      var vesselParts = Array.from(vessel.children);
      var coffee = document.getElementById("kitchen-shotcup-coffee");
      var coffeeParts = Array.from(coffee.children);
      var surface = document.getElementById("kitchen-shotcup-coffee-surface");
      var rim = document.getElementById("kitchen-shotcup-inner-rim");
      var arrow = document.querySelector("#kitchen-shotcup-arrow > path");
      coffee.style.transition = "none";
      report.owner = {
        tag: cup.tagName.toLowerCase(),
        className: cup.getAttribute("class"),
        hit: attrs(hit, ["x", "y", "width", "height", "fill"]),
        box: box(cup), vesselBox: box(vessel), coffeeBox: box(coffee),
        vesselContained: vesselParts.every(function (part) { return inside(box(part), box(vessel)); }),
        coffeeContained: coffeeParts.every(function (part) { return inside(box(part), box(vessel)); }),
        inlineOnly: !cup.querySelector("image, filter"),
        arrow: attrs(arrow, ["d", "fill", "stroke", "stroke-width"])
      };
      report.vessel = {
        base: attrs(vesselParts[0], ["x", "y", "width", "height", "rx", "fill", "stroke", "stroke-width"]),
        bottom: vesselParts[1].getAttribute("fill"),
        side: vesselParts[2].getAttribute("fill"),
        rim: attrs(rim, ["d", "stroke", "stroke-width"]),
        highlight: vesselParts[4].getAttribute("stroke"),
        parts: vesselParts.length
      };
      report.coffee = {
        side: coffeeParts[0].getAttribute("fill"),
        surface: attrs(surface, ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"]),
        crema: attrs(coffeeParts[2], ["d", "stroke", "stroke-width"]),
        highlight: coffeeParts[3].getAttribute("fill"),
        parts: coffeeParts.length
      };
      ["off", "brewed", "spent"].forEach(function (step) {
        window.__setKitchenCoffeeState({ step: step, rounds: 0 });
        report.states[step] = {
          captured: window.__captureKitchenCoffeeState().step,
          filled: cup.classList.contains("filled"),
          next: window.__kitchenCoffeeNext(),
          transform: getComputedStyle(coffee).transform,
          box: box(cup)
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
if (!result) { console.error("kitchen shot cup: no report"); process.exit(1); }

var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
function sameBox(a, b) {
  return a && b && a.every(function (value, i) { return Math.abs(value - b[i]) < 0.001; });
}
var exactHit = { x: "455", y: "209", width: "21", height: "17", fill: "transparent" };
var exactBox = [455, 209, 21, 17];

check(!result.errors.length, "no uncaught page errors", result.errors);
check(result.owner && result.owner.tag === "g" && result.owner.className === "hunt-hit" &&
  JSON.stringify(result.owner.hit) === JSON.stringify(exactHit) && sameBox(result.owner.box, exactBox),
  "the canonical shot-cup owner, hit region, footprint and position remain exact", result.owner);
check(result.owner && sameBox(result.owner.vesselBox, [459, 213, 13, 9]) &&
  result.owner.vesselContained && result.owner.coffeeContained && result.owner.inlineOnly,
  "all added vessel and coffee depth stays inside the original visible footprint", result.owner);
check(result.vessel && result.vessel.parts === 5 && JSON.stringify(result.vessel.base) === JSON.stringify({
  x: "459", y: "213", width: "13", height: "9", rx: "1.5", fill: "#fdfbf6", stroke: "#d8cfbc", "stroke-width": "1"
}) && result.vessel.bottom === "#ddd4c4" && result.vessel.side === "#c9bfad" &&
  result.vessel.rim.stroke === "#c7baa4" && result.vessel.rim["stroke-width"] === "0.65" &&
  result.vessel.highlight === "#ffffff",
  "the original white vessel gains only restrained rim, bottom, side and highlight planes", result.vessel);
check(result.coffee && result.coffee.parts === 4 && result.coffee.side === "#4b2d1e" &&
  JSON.stringify(result.coffee.surface) === JSON.stringify({
    cx: "465.5", cy: "217.4", rx: "5.3", ry: "1.25", fill: "#70482e", stroke: "#42291c", "stroke-width": "0.35"
  }) && result.coffee.crema.stroke === "#bd8250" && result.coffee.crema["stroke-width"] === "0.55" &&
  result.coffee.highlight === "#d6a26b",
  "the shot gains a darker body, dimensional surface, warm crema and restrained highlight", result.coffee);
check(result.owner && JSON.stringify(result.owner.arrow) === JSON.stringify({
  d: "M480.9,195.2 L484.7,198.4 L479.5,204.6 L483.8,208.2 L470,212 L471.4,197.8 L475.7,201.4 Z",
  fill: "#c0392b", stroke: "#1f1f1f", "stroke-width": "1.3"
}), "the existing sip arrow geometry and palette remain exact", result.owner && result.owner.arrow);
check(result.states.off && result.states.off.captured === "off" && !result.states.off.filled &&
  result.states.off.next === "kitchen-lamarzocco" && sameBox(result.states.off.box, exactBox) &&
  result.states.brewed && result.states.brewed.captured === "brewed" && result.states.brewed.filled &&
  result.states.brewed.next === "kitchen-shotcup" && result.states.brewed.transform === "matrix(1, 0, 0, 1, 0, 0)" &&
  sameBox(result.states.brewed.box, exactBox) && result.states.spent && result.states.spent.captured === "spent" &&
  !result.states.spent.filled && result.states.spent.next === "kitchen-knockbox" && sameBox(result.states.spent.box, exactBox),
  "off, brewed and spent states retain the canonical solve owner and stable footprint", result.states);

if (failed) process.exit(1);
console.log("kitchen shot cup: all checks passed");

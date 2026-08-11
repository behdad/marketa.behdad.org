#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], plants: {}, water: null, mushroom: null };
  function attrs(el, names) {
    var out = {};
    names.forEach(function (name) { out[name] = el && el.getAttribute(name); });
    return out;
  }
  function before(a, b) { return !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)); }
  function bodyByPath(owner, d) {
    return Array.prototype.slice.call(owner.querySelectorAll(":scope > path")).find(function (path) {
      return path.getAttribute("d") === d;
    });
  }
  addEventListener("load", function () { setTimeout(function () {
    try {
      goToStage("garden");
      var definitions = {
        "garden-monstera": {
          lift: "garden-monstera-lift", hit: ["215", "185", "105", "145"],
          body: "M238 318 Q234 288 244 284 L292 284 Q302 288 298 318 Q268 328 238 318 Z",
          clip: "garden-monstera-basket-clip", back: "garden-monstera-rim-back",
          soil: "garden-monstera-soil", front: "garden-monstera-rim-front",
          rim: { cx: "268", cy: "284", rx: "25", ry: "5" },
          soilShape: { cx: "268", cy: "284", rx: "20.5", ry: "3" },
          frontPath: "M243 284 A25 5 0 0 0 293 284 L288.5 284 A20.5 3 0 0 1 247.5 284 Z",
          green: ".monstera-blade", greenCount: 7
        },
        "garden-peacelily": {
          lift: "garden-peacelily-lift", hit: ["378", "198", "64", "130"],
          body: "M388 316 Q384 290 392 286 L428 286 Q436 290 432 316 Q410 324 388 316 Z",
          clip: "garden-peacelily-basket-clip", back: "garden-peacelily-rim-back",
          soil: "garden-peacelily-soil", front: "garden-peacelily-rim-front",
          rim: { cx: "410", cy: "286", rx: "19", ry: "4.3" },
          soilShape: { cx: "410", cy: "286", rx: "15.5", ry: "2.7" },
          frontPath: "M391 286 A19 4.3 0 0 0 429 286 L425.5 286 A15.5 2.7 0 0 1 394.5 286 Z",
          green: ".garden-peacelily-foliage", greenCount: 1
        }
      };
      Object.keys(definitions).forEach(function (id) {
        var d = definitions[id], owner = document.getElementById(id);
        var hit = owner.querySelector(":scope > rect"), body = bodyByPath(owner, d.body);
        var clip = document.querySelector("#" + d.clip + " path");
        var back = document.getElementById(d.back), rearEllipses = back.querySelectorAll(":scope > ellipse");
        var soil = document.getElementById(d.soil), front = document.getElementById(d.front);
        var green = owner.querySelector(d.green), greens = owner.querySelectorAll(d.green);
        var trip = owner.querySelector(":scope > .trip-bloom-img");
        report.plants[id] = {
          owner: [owner.id, owner.getAttribute("class"), owner.parentNode && owner.parentNode.id],
          hit: attrs(hit, ["x", "y", "width", "height"]),
          body: body && body.getAttribute("d"), clip: clip && clip.getAttribute("d"),
          basketPattern: owner.querySelectorAll('g[clip-path="url(#' + d.clip + ')"] > *').length,
          rearEllipses: rearEllipses.length,
          rim: attrs(rearEllipses[0], ["cx", "cy", "rx", "ry"]),
          soil: attrs(soil, ["cx", "cy", "rx", "ry"]),
          front: attrs(front, ["d", "fill", "pointer-events"]),
          greenCount: greens.length,
          rearBeforeGreen: before(back, green),
          greenBeforeBody: before(green, body),
          bodyBeforeFront: before(body, front),
          frontBeforeTrip: before(front, trip),
          trip: attrs(trip, ["x", "y", "width", "height", "preserveAspectRatio"])
        };
      });
      var mushroom = document.getElementById("garden-mushroom");
      var peace = document.getElementById("garden-peacelily");
      report.mushroom = {
        transform: mushroom.getAttribute("transform"),
        outsideOwner: !peace.contains(mushroom),
        afterOwner: before(peace, mushroom),
        lift: mushroom.closest(".trip-plant-lift") && mushroom.closest(".trip-plant-lift").id
      };
      var beforeState = window.__plantWaterState();
      var accepted = ["garden-monstera", "garden-peacelily"].map(function (id) {
        return window.waterSpecificPlant(id, function () { return true; }, "reusable");
      });
      var afterState = window.__plantWaterState();
      report.water = {
        accepted: accepted,
        before: [beforeState.counts["garden-monstera"], beforeState.counts["garden-peacelily"]],
        after: [afterState.counts["garden-monstera"], afterState.counts["garden-peacelily"]],
        owners: ["garden-monstera", "garden-peacelily"].map(function (id) {
          var owner = document.getElementById(id), hit = owner.querySelector(":scope > rect");
          return [owner.id, hit.getAttribute("x"), hit.getAttribute("y"), hit.getAttribute("width"), hit.getAttribute("height")];
        })
      };
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }, 300); });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true, forceMotion: true });
if (!result) { console.error("garden woven planter rims: no report"); process.exit(1); }

var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
var expected = {
  "garden-monstera": {
    lift: "garden-monstera-lift", hit: { x: "215", y: "185", width: "105", height: "145" },
    body: "M238 318 Q234 288 244 284 L292 284 Q302 288 298 318 Q268 328 238 318 Z",
    rim: { cx: "268", cy: "284", rx: "25", ry: "5" }, soil: { cx: "268", cy: "284", rx: "20.5", ry: "3" },
    front: "M243 284 A25 5 0 0 0 293 284 L288.5 284 A20.5 3 0 0 1 247.5 284 Z",
    pattern: 3, greenCount: 7, trip: { x: "212", y: "164", width: "104", height: "104", preserveAspectRatio: "none" }
  },
  "garden-peacelily": {
    lift: "garden-peacelily-lift", hit: { x: "378", y: "198", width: "64", height: "130" },
    body: "M388 316 Q384 290 392 286 L428 286 Q436 290 432 316 Q410 324 388 316 Z",
    rim: { cx: "410", cy: "286", rx: "19", ry: "4.3" }, soil: { cx: "410", cy: "286", rx: "15.5", ry: "2.7" },
    front: "M391 286 A19 4.3 0 0 0 429 286 L425.5 286 A15.5 2.7 0 0 1 394.5 286 Z",
    pattern: 3, greenCount: 1, trip: { x: "369", y: "204", width: "84", height: "84", preserveAspectRatio: "none" }
  }
};
check(!result.errors.length, "no uncaught page errors", result.errors);
Object.keys(expected).forEach(function (id) {
  var row = result.plants[id], exp = expected[id];
  check(row && JSON.stringify(row.owner) === JSON.stringify([id, "hunt-hit", exp.lift]) &&
    JSON.stringify(row.hit) === JSON.stringify(exp.hit), id + " keeps its exact owner, lift and hit rectangle", row);
  check(row && row.body === exp.body && row.clip === exp.body && row.basketPattern === exp.pattern,
    id + " keeps its exact basket footprint, clip and woven body detail", row);
  check(row && row.rearEllipses === 2 && JSON.stringify(row.rim) === JSON.stringify(exp.rim) &&
    JSON.stringify(row.soil) === JSON.stringify(exp.soil) && row.front.d === exp.front &&
    row.front["pointer-events"] === "none" && row.front.fill.indexOf("basket-grad") !== -1,
    id + " gains the restrained basket-material rim and dark soil", row);
  check(row && row.greenCount === exp.greenCount && row.rearBeforeGreen && row.greenBeforeBody &&
    row.bodyBeforeFront && row.frontBeforeTrip && JSON.stringify(row.trip) === JSON.stringify(exp.trip),
    id + " layers rear rim → greens → body/front lip → trip overlay", row);
});
check(result.mushroom && result.mushroom.transform === "translate(399,288)" && result.mushroom.outsideOwner &&
  result.mushroom.afterOwner && result.mushroom.lift === "garden-peacelily-lift",
  "the Peace Lily's gold mushroom stays in its established later trip-lift layer", result.mushroom);
check(result.water && result.water.accepted.every(Boolean) && JSON.stringify(result.water.before) === "[0,0]" &&
  JSON.stringify(result.water.after) === "[1,1]" &&
  JSON.stringify(result.water.owners) === JSON.stringify([
    ["garden-monstera", "215", "185", "105", "145"], ["garden-peacelily", "378", "198", "64", "130"]
  ]), "both original plant owners still accept watering without hit-geometry drift", result.water);

if (failed) process.exit(1);
console.log("garden woven planter rims: all checks passed");

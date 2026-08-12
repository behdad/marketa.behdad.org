#!/usr/bin/env node
// Shooting-star silhouette and lifecycle regression.
//
// The live garden/balcony spawner serves both lone wish-stars and calendar meteor
// showers. Keep its head subordinate to a long tapered trail, while retaining the
// shower/date/weather/day-night gates, reduced-motion opt-out, low-FPS visibility,
// and the occluded-tab cap. The cuddly projector's independent periodic star should
// use the same needle-like proportions.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], shapes: {}, gates: {}, cap: -1, lowFps: {}, reduced: -1, projector: {} };
  function clear(host) { while (host.firstChild) host.removeChild(host.firstChild); }
  function shape(hostId, shower, fireball) {
    var host = document.getElementById(hostId);
    clear(host);
    window.__spawnSkyMeteor(hostId, shower, fireball);
    var meteor = host.querySelector(".sky-meteor");
    if (!meteor) return null;
    var taper = meteor.querySelector(".sky-meteor-taper");
    var spine = meteor.querySelector(".sky-meteor-spine");
    var head = meteor.querySelector(".sky-meteor-head");
    return {
      children: Array.from(meteor.children).map(function (node) { return node.getAttribute("class"); }),
      taperClosed: !!(taper && /Z\s*$/.test(taper.getAttribute("d"))),
      taperOpacity: taper ? Number(taper.getAttribute("opacity")) : -1,
      trail: spine ? spine.getTotalLength() : -1,
      spineWidth: spine ? Number(spine.getAttribute("stroke-width")) : -1,
      head: head ? Number(head.getAttribute("r")) : -1,
      circles: meteor.querySelectorAll("circle").length
    };
  }
  addEventListener("load", function () {
    setTimeout(function () {
      try {
        Math.random = function () { return 0.5; };
        Element.prototype.animate = function () { return { onfinish: null, cancel: function () {} }; };
        var shower = { key: "perseids", rx: -1.05, ry: 0.55 };
        report.shapes.garden = shape("garden-skyfx", null, false);
        report.shapes.gardenFireball = shape("garden-skyfx", shower, true);
        report.shapes.balcony = shape("balcony-skyfx", null, false);
        report.shapes.balconyFireball = shape("balcony-skyfx", shower, true);

        var projectorLine = document.querySelector("#cuddly-stars .sky-shoot line");
        var projectorHead = document.querySelector("#cuddly-stars .sky-shoot circle");
        report.projector = {
          trail: projectorLine ? Math.hypot(Number(projectorLine.getAttribute("x2")) - Number(projectorLine.getAttribute("x1")), Number(projectorLine.getAttribute("y2")) - Number(projectorLine.getAttribute("y1"))) : -1,
          width: projectorLine ? Number(projectorLine.getAttribute("stroke-width")) : -1,
          head: projectorHead ? Number(projectorHead.getAttribute("r")) : -1
        };

        // dump-dom may mark its headless tab hidden; make this gate deterministic before
        // exercising the same visible-tab path a visitor gets.
        Object.defineProperty(document, "hidden", { configurable: true, get: function () { return false; } });
        window.__jumpToDate(2026, 7, 12);
        window.__goToStage("garden");
        window.__setDayNight(true);
        window.__setBalconyOvercast(false);
        report.gates.shower = window.__meteorShowerNow() && window.__meteorShowerNow().key;
        report.gates.clearNight = !!window.__meteorShowerLive("garden-skyfx");
        report.gates.clearNightState = {
          room: window.__currentStageName,
          dusk: document.getElementById("stage-garden").classList.contains("dusk"),
          cloudy: window.__skyCloudy(),
          hidden: document.hidden,
          reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        };
        window.__setDayNight(false);
        report.gates.day = !!window.__meteorShowerLive("garden-skyfx");
        window.__setDayNight(true);
        window.__setBalconyOvercast(true);
        report.gates.cloud = !!window.__meteorShowerLive("garden-skyfx");
        window.__setBalconyOvercast(false);
        window.__goToStage("kitchen");
        report.gates.otherRoom = !!window.__meteorShowerLive("garden-skyfx");
        window.__jumpToDate(2026, 7, 14);
        report.gates.ordinaryDate = !!window.__meteorShowerNow();

        var host = document.getElementById("garden-skyfx");
        clear(host);
        for (var i = 0; i < 20; i++) window.__spawnSkyMeteor("garden-skyfx", shower, false);
        report.cap = host.querySelectorAll(".sky-meteor").length;

        window.__frameHealthFeed(0); window.__frameHealthFeed(0);
        clear(host);
        window.__spawnSkyMeteor("garden-skyfx", null, false);
        report.lowFps = { slow: window.__frameHealthSlow(), count: host.querySelectorAll(".sky-meteor").length };

        var nativeMatchMedia = window.matchMedia;
        window.matchMedia = function (q) {
          if (q === "(prefers-reduced-motion: reduce)") return { matches: true };
          return nativeMatchMedia.call(window, q);
        };
        clear(host);
        window.__spawnSkyMeteor("garden-skyfx", null, false);
        report.reduced = host.querySelectorAll(".sky-meteor").length;
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = report.errors.concat(window.__errs || []);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 500);
  });
})();
</script>`;

var report = lib.runPageSync("loft-day.html", HARNESS, 2600, { patchRaf: true, forceMotion: true });
if (!report) { console.error("meteor shape: no report"); process.exit(1); }

var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + message + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}
function checkShape(name, shape, minTrail, maxSpine, maxHead) {
  check(shape && shape.children.join(",") === "sky-meteor-taper,sky-meteor-spine,sky-meteor-head",
    name + " uses one taper, one fine spine, and one head", shape);
  check(shape && shape.taperClosed && shape.taperOpacity <= 0.86,
    name + " has a subtle closed geometric taper", shape);
  check(shape && shape.trail >= minTrail, name + " keeps a long visible trail", shape);
  check(shape && shape.spineWidth <= maxSpine, name + " spine stays thin", shape);
  check(shape && shape.head <= maxHead && shape.circles === 1,
    name + " has one small non-bulbous head", shape);
  check(shape && shape.trail / (shape.head * 2) >= 20,
    name + " trail dominates its head by at least 20:1", shape);
}

check(!report.errors.length, "no uncaught page errors", report.errors);
checkShape("garden wish-star", report.shapes.garden, 29, 0.58, 0.65);
checkShape("balcony wish-star", report.shapes.balcony, 34, 0.65, 0.72);
checkShape("garden fireball", report.shapes.gardenFireball, 39, 0.73, 0.85);
checkShape("balcony fireball", report.shapes.balconyFireball, 45.5, 0.82, 0.94);
check(report.projector.trail >= 20 && report.projector.width <= 0.72 && report.projector.head <= 0.58,
  "cuddly projector star is a long fine streak with a tiny head", report.projector);
check(report.projector.trail / (report.projector.head * 2) >= 15,
  "cuddly projector trail dominates its head", report.projector);
check(report.gates.shower === "perseids" && report.gates.clearNight,
  "Perseids remain live in the active clear night sky", report.gates);
check(!report.gates.day && !report.gates.cloud && !report.gates.otherRoom && !report.gates.ordinaryDate,
  "day, cloud, room, and ordinary-date gates still suppress showers", report.gates);
check(report.cap === 16, "meteor shower remains capped at 16 retained streaks", report.cap);
check(report.lowFps.slow && report.lowFps.count === 1,
  "low-FPS mode still shows one bounded wish-star", report.lowFps);
check(report.reduced === 0, "reduced motion still suppresses live shooting stars", report.reduced);

if (failures) { console.error("\nmeteor-shape.js FAILED (" + failures + ")"); process.exit(1); }
console.log("\nmeteor shape: all checks passed");

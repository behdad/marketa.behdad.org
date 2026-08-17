#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function slide() {
    var el = document.querySelector("#iboga-layer .iboga-slide");
    return { href: el.getAttribute("href"), shown: el.classList.contains("iboga-slide-show") };
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      var report = { errors: window.__errs };
      try {
        var transition = getComputedStyle(document.querySelector(".iboga-slide")).transitionDuration;
        var tint = document.getElementById("iboga-tint-sat");
        report.authored = {
          trip: window.__TRIP_DURATIONS.iboga,
          hold: window.__IBOGA_TIMING.slideHoldMs,
          cycle: window.__IBOGA_TIMING.slideCycleMs,
          transition: transition,
          tint: tint.getAttribute("dur")
        };
        window.__TRIP_DURATIONS.iboga = 1000;
        window.__IBOGA_TIMING.slideHoldMs = 400;
        window.__IBOGA_TIMING.slideCycleMs = 500;
        document.querySelector("#iboga-layer .iboga-slide").__ibogaGuarded = true;
        window.__startTrip("iboga");
        await sleep(100); report.first = slide();
        await sleep(350); report.firstFading = slide();
        await sleep(100); report.second = slide();
        await sleep(400); report.secondFading = slide();
        await sleep(180);
        report.ended = { trip: window.__tripState(), slide: slide() };
      } catch (e) {
        window.__errs.push("harness: " + String(e && e.stack || e));
      }
      report.errors = window.__errs;
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 250);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]"));
  }
}

console.log("loft-day.html Ibogaine timing:");
var result = lib.runPageSync("loft-day.html", HARNESS, 3500, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.authored && result.authored.trip === 10000 && result.authored.hold === 4000 &&
    result.authored.cycle === 5000 && result.authored.transition === "1s" && result.authored.tint === "10s",
    "trip, photo fade/hold cycle, and tint share the ten-second timeline", result.authored);
  check(result.first && result.first.shown && /^art\/iboga\/iboga-\d\.jpg$/.test(result.first.href),
    "the first memory appears immediately", result.first);
  check(result.firstFading && !result.firstFading.shown && result.firstFading.href === result.first.href,
    "the first memory begins fading after its authored hold", result.firstFading);
  check(result.second && result.second.shown && result.second.href !== result.first.href,
    "a distinct second memory starts at the next five-second slot", result.second);
  check(result.secondFading && !result.secondFading.shown && result.secondFading.href === result.second.href,
    "the second memory fades before the trip ends", result.secondFading);
  check(result.ended && !result.ended.trip.active && result.ended.trip.variant === null && !result.ended.slide.shown,
    "natural completion clears the trip and slideshow together", result.ended);
}

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/iboga:\s*9\.5/.test(source) && /\[\[2\.5, 523\.25\], \[7\.5, 392\.0\]\]/.test(source),
  "the audio bed and two memory chimes align with the shortened photo sequence");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

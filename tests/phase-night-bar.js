#!/usr/bin/env node
"use strict";

// Night is a visual clock state. The calm bar is a phase-2 feature. Keep those two
// facts independent so a fresh nighttime playthrough cannot skip the kitchen puzzle.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    var kitchen = document.getElementById("stage-kitchen");
    window.__edmNowMins = function () { return 23 * 60; };
    window.__setSecondRound(false, { releaseHeld: false });
    window.__startAutoDayNight();
    check("fresh phase-one scene follows Edmonton night",
      kitchen.classList.contains("dusk"));
    check("phase-one night remains the puzzle kitchen",
      !kitchen.classList.contains("night-bar") && !window.__barUpNow(),
      kitchen.getAttribute("class"));

    window.goToStage("garden");
    window.goToStage("kitchen");
    check("leaving and revisiting cannot promote phase one into the bar",
      kitchen.classList.contains("dusk") && !kitchen.classList.contains("night-bar") && !window.__barUpNow(),
      kitchen.getAttribute("class"));

    window.__setSecondRound(true, { releaseHeld: false });
    check("phase two promotes the same night scene into the calm bar",
      kitchen.classList.contains("dusk") && kitchen.classList.contains("night-bar") && window.__barUpNow(),
      kitchen.getAttribute("class"));

    window.__setSecondRound(false, { releaseHeld: false });
    check("resetting the phase lowers the bar without changing the sky",
      kitchen.classList.contains("dusk") && !kitchen.classList.contains("night-bar") && !window.__barUpNow(),
      kitchen.getAttribute("class"));
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2500, {
  forceMotion: true,
  seedRandom: true
});

if (!report) { console.error("phase night bar: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("phase night bar: all " + report.checks.length + " checks passed");

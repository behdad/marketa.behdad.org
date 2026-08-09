#!/usr/bin/env node
"use strict";

// Lighting the smoker summons Hamid for the complete fire cycle. The slow ambient
// grillmaster tick must not re-roll him or his nested serving plate away mid-cook.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function lit() { return document.getElementById("balcony-smoker").classList.contains("smoking"); }
  function shown() { return document.getElementById("balcony-grillmaster").classList.contains("on"); }
  function plateVisible() {
    var plate = document.getElementById("balcony-grill-plate");
    var box = plate.getBoundingClientRect();
    return getComputedStyle(plate).visibility === "visible" && box.width > 0 && box.height > 0;
  }

  window.__gameStarted = function () { return true; };
  window.goToStage("balcony");
  // A stopped/restored party may briefly retain the old Garden arrival class even
  // though no party room is visible. It must not hide a directly started cookout.
  document.querySelector("#garden-guests .g-hamid").classList.add("arrived");
  document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  check("lighting without a party summons Hamid despite stale hidden attendance",
    !window.__gardenPartyOn && lit() && shown() && plateVisible());

  Math.random = function () { return 0.99; }; // the old drift roll hid him at this value
  window.__balconyGrillmasterDriftNow();
  check("ambient drift keeps Hamid and plate through the fire cycle", lit() && shown() && plateVisible());

  window.goToStage("cuddly");
  check("leaving the balcony hides the projection", lit() && !shown());
  window.goToStage("balcony");
  check("returning to the lit smoker restores the same grillmaster setup", lit() && shown() && plateVisible());

  document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));
  check("extinguishing the smoker releases Hamid", !lit() && !shown());
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2200, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true
});

if (!report) { console.error("grillmaster-continuity: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("grillmaster-continuity: all " + report.checks.length + " checks passed");

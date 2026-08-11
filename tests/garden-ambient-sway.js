#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var report = { errors: [], propSways: [], plantSways: [] };
  addEventListener("load", function () {
    setTimeout(function () {
      window.__goToStage("garden");
      // The first ambient-sway delay was chosen during page setup and is at most 14s.
      // Pin subsequent choices to the end of the candidate list: before the fix that
      // deterministically selected the frog; now it selects the last actual plant.
      Math.random = function () { return 0.999999; };
      var garden = document.getElementById("stage-garden");
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          var el = record.target;
          if (!el.classList.contains("plant-sway")) return;
          if (el.id === "garden-frog" || el.id === "garden-mushroom") report.propSways.push(el.id);
          else report.plantSways.push(el.id);
        });
      }).observe(garden, { attributes: true, subtree: true, attributeFilter: ["class"] });
      setTimeout(function () {
        report.errors = (window.__errs || []).slice();
        var pre = document.createElement("pre");
        pre.id = "__report";
        pre.textContent = JSON.stringify(report);
        document.body.appendChild(pre);
      }, 15000);
    }, 250);
  });
})();
</script>`;

var r = lib.runPageSync("rsvp.html", harness, 16500, { patchRaf: true, forceMotion: true });
if (!r) { console.error("garden ambient sway: no report"); process.exit(1); }
var failed = false;
function check(ok, text, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + text + (ok ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}
check(!r.errors.length, "no uncaught page errors", r.errors);
check(!r.propSways.length, "frog and mushroom never receive the plant-sway transform", r.propSways);
check(r.plantSways.indexOf("garden-money-tree") >= 0,
  "ambient sway still reaches the last eligible garden plant", r.plantSways);
if (failed) process.exit(1);
console.log("garden ambient sway: all checks passed");

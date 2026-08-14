#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var report = { pacerSchedules: 0, errors: [] };
  var realSetTimeout = window.setTimeout;
  window.setTimeout = function (callback, delay) {
    if (delay === 500 && /pacerTick/.test(String(callback))) report.pacerSchedules++;
    return realSetTimeout.apply(this, arguments);
  };
  try {
    window.__setGardenParty(true, false);
  } catch (error) {
    report.errors.push(String(error && error.stack || error));
  }
  realSetTimeout(function () {
    window.__setGardenParty(false, true);
    report.errors = report.errors.concat(window.__errs || []);
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 80);
})();
</script>`;

function run(label, urlSuffix, expected) {
  var result = lib.runPageSync("loft-day.html", harness, 1200, {
    patchRaf: true,
    forceMotion: true,
    urlSuffix: urlSuffix
  });
  var pass = result && result.errors.length === 0 && result.pacerSchedules === expected;
  console.log("  " + (pass ? "✓" : "✗") + " " + label +
    (pass ? "" : " — " + JSON.stringify(result)));
  return pass;
}

var enabled = run("Chromium schedules the Party GC pacer by default", "?pacemaker-test=default", 1);
var disabled = run("?pacemaker=off suppresses the Party GC pacer", "?pacemaker=off", 0);
if (!enabled || !disabled) process.exit(1);
console.log("Party GC pacemaker query checks passed.");

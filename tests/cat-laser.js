#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: window.__errs, steps: {} };
  function dblclick(cat) {
    cat.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
  }
  var cat = document.getElementById("witchy-chest-cat");
  window.__loftControllers.laser.set(false);
  dblclick(cat);
  report.steps.stowed = window.__loftControllers.laser.status();

  window.__goToStage("kitchen");
  window.__loftControllers.cat.set(true);
  cat.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
  report.steps.single = window.__loftControllers.laser.status();
  dblclick(document.getElementById("stage-kitchen"));
  report.steps.bareFirst = window.__loftControllers.laser.status();
  dblclick(document.getElementById("stage-kitchen"));
  report.steps.bareSecond = window.__loftControllers.laser.status();
  dblclick(cat);
  report.steps.firstDouble = window.__loftControllers.laser.status();
  dblclick(cat);
  report.steps.secondDouble = window.__loftControllers.laser.status();

  window.__homeCat("cuddly", true);
  dblclick(cat);
  report.steps.offRoom = window.__loftControllers.laser.status();

  window.__homeCat("kitchen", true);
  document.getElementById("witchy-chest-cat-walk").classList.remove("roaming", "roaming-sm");
  dblclick(cat);
  report.steps.notRoaming = window.__loftControllers.laser.status();

  document.getElementById("__report").textContent = JSON.stringify(report);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

console.log("rsvp.html roaming-cat laser gesture:");
var result = lib.runPageSync("rsvp.html", harness, 2200, { forceReduce: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.steps.stowed === false, "the stowed cat cannot turn on the laser", result.steps);
check(result.steps.single === false, "a single cat click leaves the laser alone", result.steps);
check(result.steps.bareFirst === true && result.steps.bareSecond === false,
  "double-clicking bare scenery toggles the laser while the roaming cat is visible", result.steps);
check(result.steps.firstDouble === true && result.steps.secondDouble === false,
  "double-clicking the visible roaming cat toggles the existing laser state", result.steps);
check(result.steps.offRoom === false, "the cat hit area cannot toggle from another room", result.steps);
check(result.steps.notRoaming === false, "a non-roaming cat hit area cannot toggle the laser", result.steps);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

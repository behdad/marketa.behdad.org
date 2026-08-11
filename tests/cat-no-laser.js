#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var harness = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var cat = document.getElementById("witchy-chest-cat");
  window.__goToStage("kitchen");
  window.__loftControllers.cat.set(true);
  cat.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
  document.getElementById("stage-kitchen").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, detail: 2 }));
  document.getElementById("__report").textContent = JSON.stringify({
    errors: window.__errs,
    controller: Object.prototype.hasOwnProperty.call(window.__loftControllers, "laser"),
    hooks: ["__laserOff", "__laserPointer", "__laserHop"].filter(function (key) { return key in window; }),
    dots: document.querySelectorAll(".laser-dot").length,
    catOut: window.__loftControllers.cat.status()
  });
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

console.log("rsvp.html roaming cat without laser:");
check(!/controllers\.laser|__laser(?:Off|Pointer|Hop)|laser-dot|toggleRoamingCatLaser/.test(source),
  "the removed laser has no controller, hooks, dot, or gesture implementation");
var result = lib.runPageSync("rsvp.html", harness, 2200, { forceReduce: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "double-clicking the cat and scenery causes no page errors", result.errors);
check(result.controller === false && result.hooks.length === 0 && result.dots === 0,
  "double-clicking cannot resurrect any laser state", result);
check(result.catOut === true, "the ordinary roaming cat remains available", result);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function isOn(light) { return light && !light.classList.contains("off"); }
  function at(mins) {
    window.__edmNowMins = function () { return mins; };
    window.__syncGrowlightSchedule(true);
  }
  function finish() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    var light = document.getElementById("garden-growlight");
    var plant = document.getElementById("garden-dieffenbachia-lift");
    check("Dieffenbachia paints in front of its grow lights",
      !!(light.compareDocumentPosition(plant) & Node.DOCUMENT_POSITION_FOLLOWING));
    at(10 * 60 + 59);
    check("grow light is off before 11:00", !isOn(light));
    at(11 * 60);
    check("grow light turns on at 11:00", isOn(light));
    at(16 * 60 + 59);
    check("grow light remains on through 16:59", isOn(light));
    at(17 * 60);
    check("grow light turns off at 17:00", !isOn(light));

    at(12 * 60);
    light.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    window.__updateGrowlightForNight();
    check("manual toggle survives a decorative day/night update", !isOn(light));
    window.__syncGrowlightSchedule(true);
    check("explicit clock re-evaluation resumes the schedule", isOn(light));
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  finish();
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1000, {
  patchRaf: true,
  forceMotion: true
});
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var failures = 0;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (!item.pass && item.detail ? " (" + item.detail + ")" : ""));
  if (!item.pass) failures++;
});
if (result.errors.length) {
  console.log("  ✗ uncaught page errors: " + result.errors.join("; "));
  failures++;
}
if (failures) process.exit(1);
console.log("All checks passed.");

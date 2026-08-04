#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<pre id="__report">pending</pre>
<script>
window.addEventListener("load", function () {
  setTimeout(function () {
    var low = window.__entranceDriveBrakeAudio(40, false);
    var street = window.__entranceDriveBrakeAudio(180, false);
    var highway = window.__entranceDriveBrakeAudio(180, true);
    document.getElementById("__report").textContent = JSON.stringify({
      errors: window.__errs || [], low: low, street: street, highway: highway
    });
  }, 200);
});
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1200, { patchRaf: true });
if (!result) { console.error("highway ABS: no report"); process.exit(1); }
var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message +
    (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}
check(!result.errors.length, "no uncaught page errors", result.errors);
check(!result.low.active && result.low.absGain === 0 && result.low.screechGain === 0,
  "braking below 65 km/h schedules no brake layer", result.low);
check(result.street.active && result.street.absGain > 0 &&
  result.street.screechGain >= result.street.absGain * 25,
  "hard street braking retains subordinate ABS feedback", result.street);
check(result.highway.active && result.highway.absGain === 0 &&
  result.highway.screechGain === result.street.screechGain &&
  result.highway.screechToneGain === result.street.screechToneGain,
  "Road Trip suppresses ABS chatter without removing the tire scream", result.highway);

if (failures) process.exit(1);
console.log("highway ABS: all checks passed");

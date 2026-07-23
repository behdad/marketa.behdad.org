#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.goToStage("kitchen");
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  if (window.__setDayNight) window.__setDayNight(true);
  var mixer = document.getElementById("kitchen-bar-mixer");
  var patrons = document.getElementById("kitchen-bar-patrons");
  var bottles = mixer ? mixer.querySelectorAll(".mixer-bottle") : [];
  var stool1 = document.getElementById("kitchen-bar-stool-1");
  var stool3 = document.getElementById("kitchen-bar-stool-3");
  var patronA = document.getElementById("kitchen-bar-patron-a");
  var patronB = document.getElementById("kitchen-bar-patron-b");
  function innerShift(el) {
    return el && el.firstElementChild ? el.firstElementChild.getAttribute("transform") : null;
  }
  var report = {
    errors: window.__errs,
    mixerBeforePatrons: !!(mixer && patrons && (mixer.compareDocumentPosition(patrons) & Node.DOCUMENT_POSITION_FOLLOWING)),
    bottleCount: bottles.length,
    vermouthBody: bottles[2] && bottles[2].querySelector("rect") ? bottles[2].querySelector("rect").getAttribute("fill") : null,
    shifts: [innerShift(stool1), innerShift(stool3), innerShift(patronA), innerShift(patronB)]
  };
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(report);
  document.body.appendChild(pre);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  \u2713 " + message);
  else { failures++; console.log("  \u2717 " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html calm-night bar layout:");
var result = lib.runPageSync("rsvp.html", harness, 1400, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.mixerBeforePatrons, "the hands-on mixer paints behind the seated patrons");
  check(result.bottleCount === 4, "the mixer still exposes exactly four ingredient bottles", result.bottleCount);
  check(result.vermouthBody === "#5f8a52", "the vermouth bottle uses distinct green glass", result.vermouthBody);
  check(result.shifts.length === 4 && result.shifts.every(function (v) { return v === "translate(-15,0)"; }),
    "both occupied stools and both patrons share the 15-unit default left shift", result.shifts);
}
process.exitCode = failures ? 1 : 0;

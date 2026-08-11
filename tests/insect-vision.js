#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.__goToStage("garden");
  var bug = document.getElementById("garden-ladybug");
  function tap(detail) {
    bug.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: detail }));
  }
  tap(1);
  var afterOne = window.__insectVisionActive();
  tap(2);
  var viewport = document.querySelector(".hunt-viewport");
  var overlay = viewport.querySelector(".insect-vision-overlay");
  var facet = overlay && overlay.querySelector(".insect-vision-facet");
  var facetStyle = facet && getComputedStyle(facet);
  var report = {
    errors: window.__errs,
    afterOne: afterOne,
    afterTwo: window.__insectVisionActive(),
    facets: overlay ? overlay.querySelectorAll(".insect-vision-facet").length : 0,
    pointerEvents: overlay ? getComputedStyle(overlay).pointerEvents : "",
    facetClip: facetStyle ? (facetStyle.clipPath || facetStyle.webkitClipPath) : "",
    facetBackdrop: facetStyle ? (facetStyle.backdropFilter || facetStyle.webkitBackdropFilter || "none") : "",
    gardenFilter: getComputedStyle(document.getElementById("stage-garden")).filter
  };
  tap(3);
  report.afterThree = window.__insectVisionActive();
  window.__insectVision(false);
  report.cleared = !window.__insectVisionActive() && !overlay.classList.contains("show");
  window.__goToStage("office");
  window.__startTrip("acid");
  var acidWaits = 0;
  function reportAcidVision() {
    var strip = document.getElementById("loft-game-strip");
    // Acid's room filter is enabled by the trip class after its deliberate double-rAF start.
    // Wait for that app-owned state, with a bounded fallback that still reports a real failure.
    if (!strip.classList.contains("acid") && acidWaits++ < 24) {
      setTimeout(reportAcidVision, 16);
      return;
    }
    report.acid = {
      active: window.__insectVisionActive(),
      overlay: overlay.classList.contains("show"),
      tripClass: strip.classList.contains("acid"),
      officeFilter: getComputedStyle(document.getElementById("stage-office")).filter
    };
    window.__stopTrip(true);
    report.acidCleared = !window.__insectVisionActive() && !overlay.classList.contains("show");
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }
  setTimeout(reportAcidVision, 40);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html ladybug insect vision:");
var result = lib.runPageSync("rsvp.html", harness, 1600, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(!result.afterOne && result.afterTwo && result.afterThree,
    "one tap stays a flutter while the second and third rapid taps activate/retrigger insect vision", result);
  check(result.facets === 54 && result.pointerEvents === "none",
    "the compound-eye overlay has 54 non-interactive facets", result);
  check(result.facetClip && result.facetClip.indexOf("polygon") !== -1,
    "the compound-eye facets retain their hexagonal clip", result.facetClip);
  check(result.facetBackdrop === "none",
    "the facets avoid the compositor-unstable backdrop filter", result.facetBackdrop);
  check(result.gardenFilter && result.gardenFilter !== "none",
    "the active garden uses the compound-eye displacement/color filter", result.gardenFilter);
  check(result.cleared, "the effect clears without leaving its room state behind");
  check(result.acid && result.acid.active && result.acid.overlay && result.acid.tripClass && result.acid.officeFilter && result.acid.officeFilter !== "none",
    "acid borrows compound-eye vision in the currently viewed room", result.acid);
  check(result.acidCleared, "stopping acid releases its borrowed insect vision");
}
process.exitCode = failures ? 1 : 0;

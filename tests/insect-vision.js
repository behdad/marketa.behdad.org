#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.goToStage("garden");
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
}
process.exitCode = failures ? 1 : 0;

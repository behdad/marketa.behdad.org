#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.__goToStage("kitchen");
  if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  if (window.__setDayNight) window.__setDayNight(true);

  function person(key) { return { key: key, name: key }; }
  var startedWithCompany, servedWithCompany, startedAlone, servedAlone;
  var flairWithCompany, flairQuitAlone, flairGameOverAlone;

  window.__whoIsHere = function () { return [person("pouria"), person("marketa")]; };
  startedWithCompany = window.__bartenderBored();
  window.__bartenderFinishBored();
  servedWithCompany = window.__bartenderSelfServing() || window.__ambientMaking();

  window.__whoIsHere = function () { return [person("pouria")]; };
  startedAlone = window.__bartenderBored();
  window.__bartenderFinishBored();
  servedAlone = window.__bartenderSelfServing() && window.__ambientMaking() &&
    document.getElementById("kitchen-bar-make").classList.contains("mk-live");

  // Leaving the room lets the ambient poll tear down that first drink. Return and exercise
  // Flair-Catch's real game-over flag against both occupancy branches.
  window.__goToStage("garden");
  setTimeout(function () {
    window.__goToStage("kitchen");
    window.__whoIsHere = function () { return [person("pouria"), person("marketa")]; };
    window.__flairTest(1, 16);
    window.__flairStop(true);
    flairWithCompany = window.__bartenderSelfServing() || window.__ambientMaking();

    window.__whoIsHere = function () { return [person("pouria")]; };
    window.__flairTest(1, 16);
    window.__flairStop();
    flairQuitAlone = window.__bartenderSelfServing() && window.__ambientMaking();

    window.__goToStage("garden");
    setTimeout(function () {
      window.__goToStage("kitchen");
      window.__whoIsHere = function () { return [person("pouria")]; };
      window.__flairTest(1, 16);
      window.__flairStop(true);
      flairGameOverAlone = window.__bartenderSelfServing() && window.__ambientMaking();

      var pre = document.createElement("pre");
      pre.id = "__report";
      pre.textContent = JSON.stringify({
        errors: window.__errs,
        startedWithCompany: startedWithCompany,
        servedWithCompany: servedWithCompany,
        startedAlone: startedAlone,
        servedAlone: servedAlone,
        flairWithCompany: flairWithCompany,
        flairQuitAlone: flairQuitAlone,
        flairGameOverAlone: flairGameOverAlone
      });
      document.body.appendChild(pre);
    }, 700);
  }, 700);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html Pouria self-serve:");
var result = lib.runPageSync("rsvp.html", harness, 3800, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.startedWithCompany && !result.servedWithCompany,
    "finishing the boredom beat does not start a drink while another person is at the bar", result);
  check(result.startedAlone && result.servedAlone,
    "finishing the boredom beat always starts Pouria's own drink when he is alone", result);
  check(!result.flairWithCompany,
    "finishing Flair-Catch does not start Pouria's drink while another person is at the bar", result);
  check(result.flairQuitAlone,
    "any Flair-Catch exit starts Pouria's own drink when he is alone", result);
  check(result.flairGameOverAlone,
    "a third-miss Flair-Catch ending starts Pouria's own drink when he is alone", result);
}
process.exitCode = failures ? 1 : 0;

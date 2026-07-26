#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  window.goToStage("kitchen");
  if (window.__setSecondRound) window.__setSecondRound(true, { releaseHeld: false });
  if (window.__setPartyMode) window.__setPartyMode(false, true);
  if (window.__setDayNight) window.__setDayNight(true);

  function person(key) { return { key: key, name: key }; }
  var startedWithCompany, servedWithCompany, startedAlone, servedAlone;

  window.__whoIsHere = function () { return [person("pouria"), person("marketa")]; };
  startedWithCompany = window.__bartenderBored();
  window.__bartenderFinishBored();
  servedWithCompany = window.__bartenderSelfServing() || window.__ambientMaking();

  window.__whoIsHere = function () { return [person("pouria")]; };
  startedAlone = window.__bartenderBored();
  window.__bartenderFinishBored();
  servedAlone = window.__bartenderSelfServing() && window.__ambientMaking() &&
    document.getElementById("kitchen-bar-make").classList.contains("mk-live");

  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify({
    errors: window.__errs,
    startedWithCompany: startedWithCompany,
    servedWithCompany: servedWithCompany,
    startedAlone: startedAlone,
    servedAlone: servedAlone
  });
  document.body.appendChild(pre);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  \u2713 " + message);
  else { failures++; console.log("  \u2717 " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html Pouria self-serve:");
var result = lib.runPageSync("rsvp.html", harness, 1600, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.startedWithCompany && !result.servedWithCompany,
    "finishing the boredom beat does not start a drink while another person is at the bar", result);
  check(result.startedAlone && result.servedAlone,
    "finishing the boredom beat always starts Pouria's own drink when he is alone", result);
}
process.exitCode = failures ? 1 : 0;

#!/usr/bin/env node
"use strict";

// The actionable piano text must use the same public transition as ordinary piano
// selection. That path owns the projector channel, foreground bed and party duck.
var lib = require("./lib");

var HARNESS = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  window.__setPartyMode(true, true);
  window.goToStage("garden");
  var realPiano = window.piano, pianoCalls = 0;
  window.piano = function () {
    pianoCalls++;
    return realPiano.apply(window, arguments);
  };

  window.__runMsgAction("piano");
  setTimeout(function () {
    check("message uses the canonical piano transition", pianoCalls === 1, String(pianoCalls));
    check("message opens the cuddly piano channel",
      window.currentStageName === "cuddly" &&
      window.__cuddlyProjector &&
      window.__cuddlyProjector.channel() === "stars",
      window.currentStageName + "/" + (window.__cuddlyProjector && window.__cuddlyProjector.channel()));
    check("piano foreground ducks the party bed", window.__partyDuck === 0.06, String(window.__partyDuck));
    report();
  }, 220);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", HARNESS, 1600, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!report) {
  console.error("piano-message: no report");
  process.exit(1);
}

var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("piano-message runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("piano-message: all checks passed");

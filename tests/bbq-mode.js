#!/usr/bin/env node
"use strict";

// Ordinary-date BBQ integration: a daytime party offers Behdad's prompt, and tapping it later
// at night lights the smoker without changing the sky. Party + smoker then owns a sticky split.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function night() { return document.getElementById("stage-balcony").classList.contains("dusk"); }
  function smoking() { return document.getElementById("balcony-smoker").classList.contains("smoking"); }

  window.__gameStarted = function () { return true; };
  window.__goToStage("balcony");
  window.__setDayNight(true);
  window.__setPartyMode(true);
  setTimeout(function () {
    check("ordinary party starts at night", !!window.__gardenPartyOn && night());
    check("night party does not pre-arm a BBQ", !window.__partyBBQOn() && !window.__bbqSplitOn && !smoking());

    window.__setDayNight(false);
    check("turning a party to day offers Behdad's BBQ text", window.__phoneMessageReceived("bbq"));
    check("the daytime offer waits for the player's click", !window.__partyBBQOn() && !window.__bbqSplitOn && !smoking());

    window.__setDayNight(true);
    window.__runMsgAction("bbq");
    setTimeout(function () {
      check("night BBQ message does not change day/night", night());
      check("BBQ message lights the smoker", smoking());
      check("party plus smoker starts BBQ mode", window.__partyBBQOn() && window.__bbqSplitOn);
      check("BBQ mode creates the four-adult split", window.__bbqSplitState().guests.length === 4, window.__bbqSplitState().guests.join(","));

      window.__setDayNight(false);
      window.__setDayNight(true);
      check("later day/night flips keep the BBQ running", night() && smoking() && window.__partyBBQOn() && window.__bbqSplitOn);
      report();
    }, 900);
  }, 120);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2500, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-05-15&time=20:00"
});

if (!report) { console.error("bbq-mode: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("bbq-mode: all " + report.checks.length + " checks passed");

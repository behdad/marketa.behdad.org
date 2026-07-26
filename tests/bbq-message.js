#!/usr/bin/env node
"use strict";

// A real cooked batch, rather than merely lighting the smoker, prompts Hamid's
// one-shot group-chat announcement.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }

  window.__gameStarted = function () { return true; };
  window.__secondRound = true;
  window.__monitorMessageRewrite = null;
  window.goToStage("balcony");
  document.getElementById("balcony-smoker-firebox").dispatchEvent(new MouseEvent("click", { bubbles: true }));

  setTimeout(function () {
    check("lighting alone does not announce food", !window.__phoneMessageReceived("hamid_food"));
  }, 1500);
  setTimeout(function () {
    var cooked = document.querySelectorAll("#balcony-smoker .smoker-burger.done").length;
    var ids = window.__phoneMessageThread();
    check("the food actually finishes cooking", cooked > 0, String(cooked));
    check("Hamid announces the first cooked batch", window.__phoneMessageReceived("hamid_food"), ids.join(","));
    check("the simultaneous patties produce one announcement", ids.filter(function (id) { return id === "hamid_food"; }).length === 1, ids.join(","));
    report();
  }, 7600);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 9000, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-05-02&time=18:00"
});

if (!report) { console.error("bbq-message: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("bbq-message: all " + report.checks.length + " checks passed");

#!/usr/bin/env node
"use strict";

// The shared balcony bonfire must describe the activity currently using it.
// S'mores temporarily outranks the seasonal fire-festival tooltip and lookup.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    check("Čarodějnice fire starts with its holiday identity",
      window.__bonfireTipKey() === "tip_carodejnice", window.__bonfireTipKey());
    window.__setSmores(true);
    check("active s'mores overrides the shared fire's holiday identity",
      window.__bonfireTipKey() === "tip_smores", window.__bonfireTipKey());
    window.__setSmores(false);
    check("ending s'mores restores the seasonal fire identity",
      window.__bonfireTipKey() === "tip_carodejnice", window.__bonfireTipKey());
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2500, {
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-04-30&time=22:00"
});

if (!report) { console.error("smores-fire: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("smores-fire: all " + report.checks.length + " checks passed");

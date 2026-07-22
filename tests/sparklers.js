#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  var guests = document.getElementById("garden-guests");
  guests.classList.add("guests-in");
  check("sparkler hook starts on an occupied dance floor", window.__startSparklerSendoff && window.__startSparklerSendoff());
  setTimeout(function () {
    var spark = guests.querySelector(".gm-spark"), core = spark && spark.querySelector(".gm-spark-core");
    var matrix = spark && spark.transform.baseVal.consolidate();
    check("sparkler moment holds the crowd and hosts", guests.classList.contains("gm-sparklers") && guests.classList.contains("gm-sp-hosts"));
    check("spark is positioned beside the guests", !!matrix && matrix.matrix.e >= 50 && matrix.matrix.e <= 590 && matrix.matrix.f >= 198 && matrix.matrix.f <= 244,
      matrix ? [matrix.matrix.e, matrix.matrix.f].join(",") : "missing");
    check("only the inner star owns the flicker animation", !!core && getComputedStyle(spark).animationName === "none" && getComputedStyle(core).animationName === "gm-spark-flicker",
      core ? getComputedStyle(spark).animationName + "/" + getComputedStyle(core).animationName : "missing");
    if (window.__endSparklerSendoff) window.__endSparklerSendoff();
    check("ending the moment removes all spark particles", !guests.querySelector(".gm-spark") && !guests.classList.contains("gm-sparklers"));
    report();
  }, 180);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 1600, { forceMotion: true, seedRandom: true, patchRaf: true });
if (!report) { console.error("sparklers: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("sparklers: all " + report.checks.length + " checks passed");

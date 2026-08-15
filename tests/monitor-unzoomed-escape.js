#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function pressEscape() {
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape", code: "Escape", bubbles: true, cancelable: true
    }));
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  try {
    window.__goToStage("office");
    var monitor = document.getElementById("office-monitor");
    var tower = document.getElementById("office-pc-desk-trio");
    var laptop = document.getElementById("office-laptop");
    tower.classList.add("on");
    monitor.classList.add("here", "screen-on", "show-caps");
    window.__openMonitorApp("life");
    window.__monitorZoomIn();
    window.__monitorZoomOut();

    window.__arcadeTest(1, 16);
    pressEscape();
    check("Escape exits Aliens without closing the app on the unzoomed monitor",
      !window.__arcadeState().active && monitor.classList.contains("show-life") && !window.__monitorZoomed());

    pressEscape();
    check("an ordinary unzoomed Escape leaves the background monitor app alone",
      monitor.classList.contains("show-life") && !window.__monitorZoomed());

    laptop.classList.add("open");
    window.__laptopZoomIn();
    pressEscape();
    check("laptop zoom cannot give Escape ownership to the unzoomed monitor",
      monitor.classList.contains("show-life") && !window.__laptopZoomed());

    window.__monitorZoomIn();
    pressEscape();
    check("a zoomed monitor still closes its own active app before unzooming",
      !monitor.classList.contains("show-life") && window.__monitorZoomed());
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2600, {
  forceMotion: true,
  seedRandom: true,
  patchRaf: true
});

if (!report) { console.error("monitor unzoomed Escape: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (check) {
  console.log("  " + (check.pass ? "✓" : "✗") + " " + check.name +
    (check.pass || !check.detail ? "" : " — " + check.detail));
  if (!check.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("monitor unzoomed Escape: all " + report.checks.length + " checks passed");

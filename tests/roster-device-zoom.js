#!/usr/bin/env node
"use strict";

// The Office devices temporarily own the whole viewport when zoomed. The room-level roster chrome
// must leave with either device and return without losing its open/closed state.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function state(el) {
    var css = getComputedStyle(el);
    return { visibility: css.visibility, pointer: css.pointerEvents, hidden: !!el.hidden };
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }

  try {
    window.__setGardenParty(true, false);
    window.__goToStage("office");
    if (window.__syncRosterAvail) window.__syncRosterAvail();

    var viewport = document.querySelector(".hunt-viewport");
    var toggle = document.querySelector(".roster-toggle");
    var panel = document.querySelector(".roster-panel");
    var backdrop = document.querySelector(".roster-backdrop");
    var monitor = document.getElementById("office-monitor");
    var laptop = document.getElementById("office-laptop");

    check("the live Who’s here chip begins available in the Office",
      toggle.classList.contains("avail") && state(toggle).visibility === "visible" && state(toggle).pointer === "auto",
      JSON.stringify(state(toggle)));

    monitor.classList.add("here", "screen-on", "show-caps");
    window.__monitorZoomIn();
    check("monitor zoom hides and disarms the Who’s here chip",
      viewport.classList.contains("device-zoomed") && window.__monitorZoomed() &&
        state(toggle).visibility === "hidden" && state(toggle).pointer === "none",
      JSON.stringify(state(toggle)));

    window.__monitorZoomOut();
    check("leaving monitor zoom restores the Who’s here chip",
      !viewport.classList.contains("device-zoomed") && !window.__monitorZoomed() &&
        state(toggle).visibility === "visible" && state(toggle).pointer === "auto",
      JSON.stringify(state(toggle)));

    laptop.classList.add("open");
    window.__laptopZoomIn();
    check("laptop zoom hides and disarms the same Who’s here chip",
      viewport.classList.contains("device-zoomed") && window.__laptopZoomed() &&
        state(toggle).visibility === "hidden" && state(toggle).pointer === "none",
      JSON.stringify(state(toggle)));

    window.__monitorZoomOut();
    check("leaving laptop zoom restores the Who’s here chip",
      !viewport.classList.contains("device-zoomed") && !window.__laptopZoomed() &&
        state(toggle).visibility === "visible" && state(toggle).pointer === "auto",
      JSON.stringify(state(toggle)));

    window.__toggleRoster(true);
    panel.classList.add("show"); // settle the rAF-delayed entrance before probing zoom restoration
    monitor.classList.add("screen-on");
    window.__monitorZoomIn();
    check("device zoom hides and disarms an open Who’s here panel and backdrop without closing them",
      window.__rosterOpen() && !panel.hidden &&
        state(panel).visibility === "hidden" && state(panel).pointer === "none" &&
        state(backdrop).visibility === "hidden" && state(backdrop).pointer === "none",
      JSON.stringify({ panel: state(panel), backdrop: state(backdrop), open: window.__rosterOpen() }));

    window.__monitorZoomOut();
    check("leaving zoom restores the still-open Who’s here panel and backdrop",
      window.__rosterOpen() && !panel.hidden &&
        state(panel).visibility === "visible" && state(panel).pointer === "auto" &&
        state(backdrop).visibility === "visible" && state(backdrop).pointer === "auto",
      JSON.stringify({ panel: state(panel), backdrop: state(backdrop), open: window.__rosterOpen() }));
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

if (!report) { console.error("roster device zoom: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("roster device zoom: all " + report.checks.length + " checks passed");

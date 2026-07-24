#!/usr/bin/env node
"use strict";

// Direct #play/loft-day mode uses the browser window without automatically entering fullscreen:
// title and language share a row, and wide screens may grow the shell to at most 1.5x its old cap.
var lib = require("./lib");

function run(width, height) {
  var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  setTimeout(function () {
  try {
    var title = document.getElementById("hunt-title").getBoundingClientRect();
    var langs = document.querySelector(".langs").getBoundingClientRect();
    var area = document.getElementById("hunt-fullscreen-area").getBoundingClientRect();
    var watch = document.querySelector(".watch-controls").getBoundingClientRect();
    check("game-only title and language share the top row", Math.abs(title.top - langs.top) <= 3,
      title.top + "/" + langs.top);
    check("game-only title stays centered in the browser", Math.abs((title.left + title.width / 2) - innerWidth / 2) <= 2,
      JSON.stringify({ innerWidth: innerWidth, titleLeft: title.left, titleWidth: title.width }));
    check("game-only shell stays inside the viewport width", area.left >= -1 && area.right <= innerWidth + 1,
      JSON.stringify({ innerWidth: innerWidth, left: area.left, right: area.right }));
    check("game-only shell respects the 1620px ceiling", area.width <= 1621,
      JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    if (innerWidth >= 1600 && innerHeight >= 900) {
      check("a large browser grows the shell beyond the old 1080px cap", area.width > 1080,
        JSON.stringify({ innerWidth: innerWidth, innerHeight: innerHeight, width: area.width }));
    }
    check("the invitation state keeps Trailer and Autoplay in view", watch.bottom <= innerHeight + 1,
      JSON.stringify({ innerHeight: innerHeight, watchBottom: watch.bottom, areaBottom: area.bottom }));
    check("Trailer and Autoplay stay below the scene", watch.top >= area.bottom - 1,
      JSON.stringify({ watchTop: watch.top, areaBottom: area.bottom }));
    var invitationWidth = area.width;
    window.__endAttract();
    setTimeout(function () {
      var enteredArea = document.getElementById("hunt-fullscreen-area").getBoundingClientRect();
      check("entering page mode hides all outer invitation chrome",
        ["hunt-title", "device-hint"].every(function (id) { return getComputedStyle(document.getElementById(id)).display === "none"; }) &&
        getComputedStyle(document.querySelector(".langs")).display === "none" &&
        getComputedStyle(document.querySelector(".watch-controls")).display === "none");
      check("entered page mode enlarges or preserves the scene shell", enteredArea.width >= invitationWidth,
        invitationWidth + " -> " + enteredArea.width);
      check("entered page mode remains outside true/class fullscreen",
        !document.getElementById("hunt-fullscreen-area").classList.contains("is-fullscreen"));
      report();
    }, 40);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
    report();
  }
  }, 100);
})();
</script>`;
  return lib.runPageSync("rsvp.html", harness, 2200, {
    urlSuffix: "#play",
    chromeFlags: "--window-size=" + width + "," + height + " --force-device-scale-factor=1"
  });
}

var reports = [
  { label: "wide", report: run(1800, 1000) },
  { label: "mobile", report: run(390, 844) }
];
var failed = false;
reports.forEach(function (entry) {
  if (!entry.report) {
    failed = true;
    console.error(entry.label + ": no report");
    return;
  }
  entry.report.checks.forEach(function (c) {
    console.log("  " + (c.pass ? "✓" : "✗") + " " + entry.label + ": " + c.name +
      (c.pass || !c.detail ? "" : " — " + c.detail));
    if (!c.pass) failed = true;
  });
  if (entry.report.errors.length) {
    failed = true;
    console.error(entry.label + " runtime errors:\n  " + entry.report.errors.join("\n  "));
  }
});
if (failed) process.exit(1);
console.log("game-only layout: all checks passed");

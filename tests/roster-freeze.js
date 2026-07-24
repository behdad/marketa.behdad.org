#!/usr/bin/env node
"use strict";

// The garden roster is a deliberate freeze-frame. Its existing row spotlight may temporarily
// release one named guest, but closing the spotlight must return to the roster freeze.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  function animatedPart(figure) {
    if (!figure) return null;
    var nodes = [figure].concat(Array.prototype.slice.call(figure.querySelectorAll("*")));
    return nodes.find(function (node) { return getComputedStyle(node).animationName !== "none"; }) || figure;
  }
  function state(node) { return node ? getComputedStyle(node).animationPlayState : "missing"; }

  try {
    window.__setGardenParty(true, false);
    window.goToStage("garden");
    if (window.__summonGuests) window.__summonGuests();
    var stage = document.getElementById("stage-garden");
    var ali = document.querySelector("#garden-guests .g-ali");
    var goli = document.querySelector("#garden-guests .g-goli");
    var irene = document.querySelector("#garden-guests .g-irene");
    var aliPart = animatedPart(ali), goliPart = animatedPart(goli), irenePart = animatedPart(irene);

    window.roster(true);
    check("opening the garden roster applies the adult freeze", stage.classList.contains("roster-freeze"));
    check("the open roster pauses named guests", state(aliPart) === "paused" && state(goliPart) === "paused",
      state(aliPart) + "/" + state(goliPart));
    check("party children keep dancing through the adult freeze", state(irenePart) === "running", state(irenePart));

    window.__spotlightGuest([".g-ali"]);
    check("a roster pick releases only the selected guest",
      state(aliPart) === "running" && state(goliPart) === "paused", state(aliPart) + "/" + state(goliPart));

    window.__clearGuestSpotlight();
    check("the roster freeze remains after the short spotlight",
      stage.classList.contains("roster-freeze") && state(aliPart) === "paused", state(aliPart));

    window.roster(false);
    check("closing the roster removes its freeze", !stage.classList.contains("roster-freeze") && state(aliPart) === "running",
      state(aliPart));
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 4000, {
  forceMotion: true,
  seedRandom: true
});

if (!report) { console.error("roster freeze: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) { failed = true; console.error("runtime errors:\n  " + report.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("roster freeze: all " + report.checks.length + " checks passed");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass) { out.checks.push({ name: name, pass: !!pass }); }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    window.__setGardenParty(true, false);
    window.__goToStage("garden");
    var strip = document.getElementById("loft-game-strip");
    var behdad = document.querySelector("#garden-guests .g-behdad");
    var marketa = document.querySelector("#garden-guests .g-marketa");
    var behdadReact = behdad.querySelector(".guest-react");
    var marketaReact = marketa.querySelector(".guest-react");

    behdad.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    check("tapping either host starts the synchronized couple reaction",
      behdadReact.classList.contains("host-bump") && marketaReact.classList.contains("host-bump"));

    behdadReact.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
    marketaReact.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
    check("the couple reaction cleans up for replay",
      !behdadReact.classList.contains("host-bump") && !marketaReact.classList.contains("host-bump"));

    marketa.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    check("the decorative hosts do not claim keyboard activation",
      !behdadReact.classList.contains("host-bump") && !marketaReact.classList.contains("host-bump"));

    behdadReact.classList.remove("host-bump");
    marketaReact.classList.remove("host-bump");
    strip.classList.add("dance-frozen");
    marketa.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    check("authored party choreography blocks the tap reaction",
      !behdadReact.classList.contains("host-bump") && !marketaReact.classList.contains("host-bump"));
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  report();
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 1800, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true
});

if (!report) { console.error("couple interaction: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name);
  if (!c.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("couple interaction: all " + report.checks.length + " checks passed");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function click(el) {
    if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function finish() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    window.goToStage("garden");
    var fairy = document.getElementById("witchy-chest-fairy");
    var target = window.__gardenClueTarget();
    check("the fairy initially points to an unwatered plant",
      target && target.id === "garden-monstera", target && target.id);

    click(fairy);
    var trail = document.getElementById("fairy-clue-trail");
    check("clicking the fairy creates a visible clue trail",
      trail && trail.getAttribute("data-target") === "garden-monstera",
      trail && trail.getAttribute("data-target"));
    check("the trail paints in the visible garden coordinate space",
      trail && trail.parentNode && trail.parentNode.id === "stage-garden" &&
      trail.getAttribute("data-coordinate-space") === "stage-garden",
      trail && trail.parentNode && trail.parentNode.id);
    check("the strengthened trail contains sixteen sparkles",
      trail && trail.children.length === 16,
      trail && String(trail.children.length));

    window.__setGardenParty(true, false);
    check("the fairy stops guiding once phase 2 begins",
      window.__gardenClueTarget() === null);
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
  }
  finish();
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, {
  patchRaf: true,
  forceMotion: true
});
if (!result) {
  console.log("  \u2717 harness produced no report");
  process.exit(1);
}
var failures = 0;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "\u2713" : "\u2717") + " " + item.name +
    (!item.pass && item.detail ? " (" + item.detail + ")" : ""));
  if (!item.pass) failures++;
});
if (result.errors.length) {
  console.log("  \u2717 uncaught page errors: " + result.errors.join("; "));
  failures++;
}
if (failures) process.exit(1);
console.log("All checks passed.");

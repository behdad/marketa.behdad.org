#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`
<pre id="__report">pending</pre>
<script>
(async function () {
  var sleep = function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
  var el = document.getElementById("office-laptop");
  window.__goToStage("office");
  el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
  await sleep(240);
  var shown = !!document.querySelector(".egg-bubble.show");
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "pen" }));
  await sleep(30);
  var penCleared = !document.querySelector(".egg-bubble.show");
  document.getElementById("__report").textContent = JSON.stringify({
    shown: shown, penCleared: penCleared, errors: window.__errs
  });
})().catch(function (e) {
  document.getElementById("__report").textContent = JSON.stringify({ fatal: String(e), errors: window.__errs });
});
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true });
var failed = false;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label + (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

console.log("Hover feedback:");
check(result && result.shown, "the shared tooltip appears after its short dwell", result);
check(result && result.penCleared, "a pen press dismisses the hover tooltip before activation", result);
check(result && result.errors && result.errors.length === 0, "no uncaught JS errors", result && result.errors);
if (failed) process.exit(1);

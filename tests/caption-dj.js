#!/usr/bin/env node
// The real DJ swap publishes a keyed claim that rerenders in place during its shout.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function snap() {
    var caption = document.getElementById("hunt-caption");
    var state = window.__captionState();
    return {
      key: window.__captionKey(),
      text: caption.textContent,
      html: caption.innerHTML,
      owner: state.overlay && state.overlay.owner,
      variant: state.overlay && state.overlay.variant
    };
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__unlockAllRooms();
        window.__goToStage("garden");
        window.__setLang("en");
        window.__swapDj();
        report.en = snap();
        window.__setLang("cs");
        report.cs = snap();
        report.rawHtmlSeam = typeof window.__captionArbiter.html;
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 1800, {
  urlSuffix: "?date=2026-08-08&time=20:00&captionDjFresh=1",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft-day.html DJ caption arbitration:");
check(result && result.errors.length === 0, "the real DJ swap has no uncaught errors",
  result && result.errors);
check(result && result.en.key === "dj_danesh" && result.en.owner === "dj-shout" &&
  Number.isInteger(result.en.variant) && /DJ Danesh/.test(result.en.text) && /<em>/.test(result.en.html),
  "the real DJ swap publishes a keyed authored-markup claim", result && result.en);
check(result && result.cs.key === result.en.key && result.cs.owner === result.en.owner &&
  result.cs.variant === result.en.variant && result.cs.text !== result.en.text && /DJ Danesh/.test(result.cs.text),
  "the live shout rerenders EN to CS without choosing a replacement variant", result);
check(result && result.rawHtmlSeam === "undefined",
  "the arbiter exposes no raw-markup publishing seam", result && result.rawHtmlSeam);

if (failures) process.exit(1);
console.log("DJ caption arbitration checks passed.");

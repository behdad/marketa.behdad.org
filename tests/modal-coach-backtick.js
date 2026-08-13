#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], checks: [] };
  function check(name, pass, detail) { report.checks.push({ name:name, pass:!!pass, detail:detail }); }
  function key(value) { var event = new KeyboardEvent("keydown", { key:value, bubbles:true, cancelable:true }); document.dispatchEvent(event); return event; }
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        if (window.__removeClickMe) window.__removeClickMe();
        if (window.__finishOpeningGuide) window.__finishOpeningGuide();
        if (window.__endAttract) window.__endAttract();
        var input = document.getElementById("dropterm-in");
        Array.prototype.forEach.call(document.querySelectorAll(".hunt-coach-overlay.modal-coach"), function (coach) {
          if (window.__closeDropTerm) window.__closeDropTerm();
          coach.classList.add("show");
          var opened = key(String.fromCharCode(96));
          var typed = key("x");
          var typingOwned = document.activeElement === input && input.value === "x";
          var closed = key(String.fromCharCode(96));
          check(coach.id || coach.className,
            opened.defaultPrevented && typingOwned &&
            typed.defaultPrevented && closed.defaultPrevented && !document.getElementById("dropterm").classList.contains("open") &&
            coach.classList.contains("show"),
            { opened:opened.defaultPrevented, typed:typed.defaultPrevented, closed:closed.defaultPrevented,
              typingOwned:typingOwned, coach:coach.className });
          input.value = "";
          coach.classList.remove("show");
        });
      } catch (error) { report.errors.push(String(error && error.stack || error)); }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 350);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 1500, {
  forceMotion: true, patchRaf: true, urlSuffix: "?fresh=modal-coach-backtick-" + Date.now()
});
var failures = 0;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message + (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}

console.log("loft-day.html modal coach backtick ownership:");
check(result && result.errors.length === 0, "the page has no uncaught errors", result && result.errors);
check(result && result.checks.length >= 3 && result.checks.every(function (row) { return row.pass; }),
  "every modal coach yields backtick to the dropdown while its input owns typing", result && result.checks);
if (failures) process.exit(1);
console.log("Modal coach backtick assertions passed.");

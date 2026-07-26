#!/usr/bin/env node
// The couple's "put us in your calendar" text comes from one host, not a joint account.
"use strict";

var lib = require("./lib");
var harness = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], senders: [] };
  window.addEventListener("load", function () {
    setTimeout(function () {
      try {
        window.__secondRound = true;
        var oldRandom = Math.random;
        [0, 0.999].forEach(function (roll) {
          Math.random = function () { return roll; };
          window.__deliverPhoneMessage("cue_calendar");
          window.__openMessagesAt("cue_calendar");
          var from = document.querySelector('.pm-msg-row[data-message-id="cue_calendar"] .pm-msg-from');
          report.senders.push(from && from.textContent);
          if (window.__closePhoneModal) window.__closePhoneModal(true);
          if (window.__resetPhoneApps) window.__resetPhoneApps();
          window.__secondRound = true;
        });
        Math.random = oldRandom;
      } catch (error) {
        window.__errs.push(String(error && error.stack || error));
      }
      report.errors = window.__errs;
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 250);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true });
var ok = result && result.errors.length === 0 &&
  result.senders.join("|") === "markéta|behdad";
console.log("rsvp.html calendar-message sender:");
console.log("  " + (ok ? "\u2713" : "\u2717") + " each host can send the couple's calendar reminder" +
  (ok ? "" : " [" + JSON.stringify(result) + "]"));
if (!ok) process.exit(1);
console.log("\nAll checks passed.");

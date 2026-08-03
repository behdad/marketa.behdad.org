#!/usr/bin/env node
// Scheduled authored texts occasionally answer or react to the preceding scheduled text.
"use strict";

var lib = require("./lib");
var harness = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { window.__errs.push(String(error && error.stack || error)); })
        .then(function () {
          report.errors = window.__errs;
          document.getElementById("__report").textContent = JSON.stringify(report);
        });
    }, 250);
  });
  async function run() {
    window.__secondRound = true;
    window.__monitorMessageRewrite = null;
    var oldRandom = Math.random;
    window.__deliverPhoneMessage("cue_mail", true);
    Math.random = function () { return 0.1; };
    window.__deliverPhoneMessage("hannah_banter", true);
    Math.random = function () { return 0.3; };
    window.__deliverPhoneMessage("farhang_banter", true);
    await sleep(900);
    window.__openMessagesAt("hannah_banter");
    await sleep(40);
    var quote = document.querySelector('.pm-msg-row[data-message-id="hannah_banter"] .pm-msg-quote');
    report.steps.quote = quote && quote.textContent;
    var reactions = document.querySelectorAll('.pm-msg-row[data-message-id="hannah_banter"] .pm-msg-reaction');
    report.steps.reactions = Array.prototype.map.call(reactions, function (el) { return el.textContent; });
    Math.random = oldRandom;
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 2600, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html scheduled-message continuity:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(result && /^Bahareh: did you check the mail/.test(result.steps.quote || ""),
  "a scheduled text can quote the preceding scheduled text", result && result.steps.quote);
check(result && result.steps.reactions && result.steps.reactions.length > 0,
  "a later scheduled text can react to the preceding scheduled text", result && result.steps.reactions);
if (failures) process.exit(1);
console.log("\nAll checks passed.");

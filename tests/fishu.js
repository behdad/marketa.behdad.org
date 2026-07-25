#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var fs = require("fs");
var path = require("path");

var harness = String.raw`<script>
(function () {
  var spoken = [];
  window.__speakFishu = function (phrase) { spoken.push(phrase); return true; };
  var returns = [window.fishu(), window.fishu(2), window.fishu(5)];
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify({
    spoken: spoken,
    returns: returns,
    errors: (window.__errs || []).slice()
  });
  document.body.appendChild(pre);
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2500);
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failed = false;
function check(ok, message, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + message + (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failed = true;
}

if (!report) { console.error("fishu: no report"); process.exit(1); }
check(!report.errors.length, "no uncaught page errors", report.errors);
check(JSON.stringify(report.spoken) === JSON.stringify(["fishu", "fish fishu", "fish fish fish fish fishu"]),
  "fishu(), fishu(2), and fishu(5) say the exact bounded phrases", report.spoken);
check(report.returns.every(Boolean), "Fishu scripting calls report success", report.returns);
var help = (/fishu:\s*"([^"]*(?:\\.[^"]*)*)"/.exec(source) || [])[1] || "";
check(/\bthem\b/.test(help) && !/\b(?:him|his)\b/.test(help),
  "Fishu's scripting help uses they/them pronouns", help);

if (failed) process.exit(1);
console.log("fishu: all checks passed");

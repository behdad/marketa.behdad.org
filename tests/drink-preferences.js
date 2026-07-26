#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var harness = String.raw`<script>
(function () {
  var names = ["jay", "spencer", "bahareh", "madla", "athena", "lauren", "marketa", "behdad", "hamid", "ali"];
  var values = {};
  names.forEach(function (name) { values[name] = window.__partyDrinkPreference(name); });
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify({ errors: window.__errs, values: values });
  document.body.appendChild(pre);
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  \u2713 " + message);
  else { failures++; console.log("  \u2717 " + message + (detail == null ? "" : " [" + JSON.stringify(detail) + "]")); }
}

console.log("rsvp.html party drink roster:");
var result = lib.runPageSync("rsvp.html", harness, 1600, { patchRaf: true, forceMotion: true });
check(!!result, "focused browser harness completed", result);
if (result) {
  check(!result.errors.length, "no uncaught page errors", result.errors);
  check(result.values.jay === "beer" && result.values.spencer === "beer", "Jay and Spencer prefer beer", result.values);
  check(["bahareh", "madla", "athena", "lauren"].every(function (name) { return result.values[name] === "wine"; }),
    "Bahareh, Madla, Athena and Lauren prefer wine", result.values);
  check(result.values.marketa === "diet-coke" && result.values.behdad === "diet-coke",
    "Markéta and Behdad prefer Diet Coke", result.values);
  check(result.values.hamid === "any" && result.values.ali === "any",
    "Hamid and unspecified guests retain random choice", result.values);
}
process.exitCode = failures ? 1 : 0;

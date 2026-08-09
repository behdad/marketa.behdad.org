#!/usr/bin/env node
"use strict";

// The same canonical file serves two public entry names. The filename is the
// contract: Egg Hunt is game-only, while save-the-dates reveals the invitation;
// #play can still force the game through the invitation alias.
var lib = require("./lib");

var HARNESS = String.raw`<script>
setTimeout(function () {
  var report = {
    revealed: document.documentElement.classList.contains("revealed"),
    title: document.title,
    errors: (window.__errs || []).slice()
  };
  var pre = document.createElement("pre");
  pre.id = "__report";
  pre.textContent = JSON.stringify(report);
  document.body.appendChild(pre);
}, 80);
</script>`;

function run(file, suffix) {
  return lib.runPageSync(file, HARNESS, 500, { urlSuffix: suffix || "" });
}

var cases = [
  { name: "canonical Egg Hunt is game-only", report: run("egg-hunt.html"), revealed: false, title: "Egg Hunt" },
  { name: "save-the-dates alias reveals the invitation", report: run("save-the-dates.html"), revealed: true, title: "markéta & behdad — Save the Dates — Egg Hunt" },
  { name: "#play forces Egg Hunt through the invitation alias", report: run("save-the-dates.html", "#play"), revealed: false, title: "Egg Hunt" }
];

var failed = false;
cases.forEach(function (entry) {
  var pass = entry.report && !entry.report.errors.length &&
    entry.report.revealed === entry.revealed && entry.report.title === entry.title;
  console.log("  " + (pass ? "✓" : "✗") + " " + entry.name);
  if (!pass) {
    failed = true;
    console.log("    " + JSON.stringify(entry.report));
  }
});

if (failed) process.exit(1);
console.log("Egg Hunt entry aliases: all checks passed");

#!/usr/bin/env node
"use strict";

var fs = require("fs");
var source = fs.readFileSync("loft-day.html", "utf8");
var failures = 0;

function check(ok, label) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) failures++;
}

console.log("monitor menu-bar buttons:");
check(/\.desk-bar-hit\{[^}]*fill-opacity:\.075[^}]*stroke-opacity:\.44/.test(source),
  "idle controls have a visible shared button surface");
check(/\.monitor-overlay-control:hover \.desk-bar-hit,[\s\S]*?\.monitor-overlay-control:focus-visible \.desk-bar-hit\{[^}]*fill-opacity:\.15[^}]*stroke-opacity:\.78/.test(source),
  "every control shares hover and keyboard-focus feedback");
check(/\.monitor-overlay-control:active \.desk-bar-hit\{[^}]*fill-opacity:\.24[^}]*stroke-opacity:1/.test(source),
  "every control shares pressed feedback");
check(/id: "monitor-desk-weather", "class": "desk-brand monitor-overlay-control", tabindex: "0"/.test(source) &&
    /weatherG\.addEventListener\("keydown",[\s\S]*?openWeather\(\);/.test(source),
  "weather button is keyboard operable like the other app buttons");

if (failures) {
  console.error("\n" + failures + " monitor menu-bar button check(s) failed.");
  process.exit(1);
}
console.log("\nAll monitor menu-bar button checks passed.");

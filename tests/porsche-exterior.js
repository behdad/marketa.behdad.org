#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var entrance = (source.match(/<div id="entrance-room"[\s\S]*?<\/div>\s*<div id="prince-basement"/) || [""])[0];
var failures = 0;

function check(ok, message) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message); }
}

console.log("rsvp.html Porsche exterior/open cockpit:");
check(/id="entrance-porsche-full-seats">[\s\S]*?id="entrance-porsche-passenger-seat-base">\s*<path d="M206 256[\s\S]*?id="entrance-porsche-center-console"[\s\S]*?id="entrance-porsche-driver-seat-base">\s*<path d="M226 258/.test(entrance),
  "the right-side driver seat paints after the passenger and center console");
check(!/entrance-porsche-(?:open-door-seats|closed-seatbacks)/.test(source) &&
  entrance.indexOf('id="entrance-porsche-full-seats"') < entrance.indexOf('id="entrance-porsche-door-panel"'),
  "one permanent seat stack preserves that order across every roof and door state");
check(/id="entrance-porsche-steering-wheel" transform="translate\(185 253\) scale\(1\.25\) translate\(-190 -248\)"/.test(entrance),
  "the cockpit steering wheel is twenty-five percent larger and shifted five units left and down");

if (failures) {
  console.log("\n" + failures + " Porsche exterior assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("\nPorsche exterior assertions passed.");

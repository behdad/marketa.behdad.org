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
check(/id="entrance-porsche-occupants" aria-hidden="true" pointer-events="none">[\s\S]*?id="entrance-porsche-behdad-passenger"[\s\S]*?id="entrance-porsche-marketa-driver"/.test(entrance),
  "the exterior seats identify Behdad as passenger and Markéta as driver without adding a hit target");
check(/#entrance-porsche-occupants\{opacity:0;transition:opacity \.22s ease\}[\s\S]*?#entrance-room\.drive-hud-visible #entrance-porsche-occupants\{opacity:1\}/.test(source),
  "the exterior occupants appear only with the optional driving HUD");
check(entrance.indexOf('id="entrance-drive-behdad-passenger"') < entrance.indexOf('id="entrance-drive-dashboard"') &&
  /id="entrance-drive-steering"[\s\S]*?id="entrance-drive-marketa-hands"/.test(entrance),
  "the passenger stays behind the dashboard while Markéta's hands share the steering-wheel transform");
check(/id="entrance-drive-marketa-hands"[\s\S]*?<ellipse cx="225" cy="151"[\s\S]*?<ellipse cx="329" cy="151"/.test(entrance),
  "both driver hands stay on the lower rim below the gauge cluster");
check(/#entrance-porsche-door-open\{[\s\S]*?transform:scaleX\(\.08\);transition:transform \.72s cubic-bezier\(\.42,0,\.58,1\),opacity \.28s linear[\s\S]*?#entrance-porsche\.door-open #entrance-porsche-door-open\{opacity:1;transform:scaleX\(1\)\}/.test(source),
  "the driver door eases between the approved endpoints while retaining its opacity timing");

if (failures) {
  console.log("\n" + failures + " Porsche exterior assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("\nPorsche exterior assertions passed.");

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
check(/#entrance-porsche-occupants\{opacity:1;transition:opacity \.22s ease\}/.test(source) &&
  !/#entrance-room\.drive-hud-visible #entrance-porsche-occupants|#entrance-porsche\.door-open #entrance-porsche-occupants/.test(source),
  "the exterior occupants remain visible before, during, and after the driving HUD");
check(/id="entrance-porsche-marketa-driver" transform="translate\(240 253\) scale\(.86\) translate\(-240 -253\)"/.test(entrance),
  "Markéta scales around the driver-seat base to fit the exterior cockpit");
check(/id="entrance-porsche-behdad-passenger" transform="translate\(217 248\) scale\(\.82\) translate\(-217 -248\)"/.test(entrance),
  "Behdad scales down around the passenger-seat base to match the car proportions");
check(/id="entrance-porsche-behdad-lower-body"[\s\S]*?id="entrance-porsche-marketa-lower-body"[\s\S]*?id="entrance-porsche-door-panel"/.test(entrance),
  "both occupants have seated lower bodies behind the later door-panel layer");
check(!/id="entrance-drive-(?:behdad-passenger|marketa-hands)"/.test(entrance),
  "the first-person HUD keeps its windshield and steering wheel free of occupant artifacts");
check(/id="entrance-porsche-trunk-panel">\s*<path d="M278 259Q323 257 350 270L358 279Q361 282 358 285Q325 271 281 269Z"/.test(entrance),
  "the raised trunk lid ends in a short rounded nose instead of a sharp polygon point");
check(/#entrance-porsche-trunk-well\{opacity:0;transition:opacity \.08s ease \.26s\}[\s\S]*?#entrance-porsche\.trunk-open #entrance-porsche-trunk-well\{opacity:1;transition:opacity \.16s ease\}/.test(source),
  "the trunk well covers the silver body until the closing lid reaches its final position");
check(/#entrance-porsche-door-closed\{transition:none\}/.test(source) &&
  /#entrance-porsche-door-open\{[\s\S]*?transform:scaleX\(\.08\);transition:none[\s\S]*?#entrance-porsche\.door-open #entrance-porsche-door-open\{opacity:1;transform:scaleX\(1\)\}/.test(source) &&
  /#entrance-porsche-door-well\{opacity:0;transition:none\}/.test(source),
  "the driver door opening mirrors the closing layer handoff without a fake hinge stretch");

if (failures) {
  console.log("\n" + failures + " Porsche exterior assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("\nPorsche exterior assertions passed.");

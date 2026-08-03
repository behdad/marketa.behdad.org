#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;

function check(ok, label) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) failures++;
}

var match = source.match(/function entranceRoadtripSeasonForDate\(s\)\s*\{[\s\S]*?\n  \}/);
check(!!match, "season classifier is present");
var classify = match ? Function("return (" + match[0] + ")")() : function () { return ""; };

check(classify({ m: 2, d: 31 }) === "winter" && classify({ m: 3, d: 1 }) === "spring",
  "March 31 gives way to spring on April 1");
check(classify({ m: 4, d: 31 }) === "spring" && classify({ m: 5, d: 1 }) === "summer",
  "spring gives way to summer in June");
check(classify({ m: 8, d: 21 }) === "summer" && classify({ m: 8, d: 22 }) === "autumn",
  "summer includes September 21 and autumn starts September 22");
check(classify({ m: 10, d: 20 }) === "autumn" && classify({ m: 10, d: 21 }) === "winter",
  "late autumn gives way to accumulated winter cover on November 21");

["spring", "summer", "autumn", "winter"].forEach(function (name) {
  check(source.indexOf('id="entrance-roadtrip-season-' + name + '"') >= 0 &&
    source.indexOf('id="entrance-roadtrip-mirror-season-' + name + '"') >= 0,
    name + " has matching windshield and mirror scenery");
  check(source.indexOf('entrance-roadtrip-season-' + name) >= 0,
    name + " is stamped on the Entrance room");
});
check(/data-roadtrip-season", roadtripSeason/.test(source),
  "the effective highway season is exposed for visual inspection");
check(/not\(\.entrance-day\)\.entrance-roadtrip-season-spring #entrance-roadtrip-mirror-season-spring,[\s\S]{0,400}#entrance-roadtrip-mirror-season-winter\{opacity:\.46\}/.test(source),
  "seasonal mirror scenery is dimmed independently at night");

if (failures) process.exit(1);
console.log("Entrance roadtrip season assertions passed.");

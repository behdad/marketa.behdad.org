#!/usr/bin/env node
// Source-only contract for localized roadtrip windshield damage; no browser required.
"use strict";

var fs = require("fs");
var path = require("path");

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;

function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]"));
  }
}

function extractFunction(name) {
  var start = source.indexOf("function " + name + "(");
  if (start < 0) return "";
  var open = source.indexOf("{", start);
  var depth = 0;
  for (var i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  return "";
}

function seeded(seed) {
  var state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function rotate(point, variant) {
  var radians = variant.rotation * Math.PI / 180;
  var x = point.x - variant.origin.x;
  var y = point.y - variant.origin.y;
  return {
    x: variant.origin.x + x * Math.cos(radians) - y * Math.sin(radians),
    y: variant.origin.y + x * Math.sin(radians) + y * Math.cos(radians)
  };
}

console.log("rsvp.html roadtrip windshield crack variants:");
var builderSource = extractFunction("entranceRoadtripCrackVariant");
var painterSource = extractFunction("paintRoadtripCrack");
check(!!builderSource && !!painterSource, "the pure crack builder and SVG painter are present");

var buildVariant = builderSource ? Function("return (" + builderSource + ");")() : null;
var samples = [];
if (buildVariant) {
  for (var i = 0; i < 96; i++) samples.push(buildVariant((i % 9 + 1) / 10, seeded(7300 + i), i));
}

check(samples.length === 96 && samples.every(function (variant) {
  return variant.origin.x >= 320 && variant.origin.x <= 416 &&
    variant.origin.y >= 27 && variant.origin.y <= 57 &&
    Math.abs(variant.rotation) <= 6.5;
}), "fracture roots stay in the lower windshield with only modest whole-crack rotation", samples.slice(0, 2));

check(samples.every(function (variant) {
  return variant.primaryCount === 3 && variant.secondaryCount >= 3 && variant.secondaryCount <= 5 &&
    (variant.primaryPath.match(/M/g) || []).length === variant.primaryCount &&
    (variant.secondaryPath.match(/M/g) || []).length === variant.secondaryCount &&
    variant.trunkSpan >= 55 && variant.branchRoots.length === 2;
}), "every localized crack has one long split, two offset limbs, and three to five smaller forks");

check(source.indexOf("entrance-roadtrip-crack-core") < 0 && samples.every(function (variant) {
  return variant.branchRoots.every(function (root) {
    return Math.hypot(root.x - variant.origin.x, root.y - variant.origin.y) > 15;
  });
}), "localized collision fractures have no circular stone-impact core or radial common root");

var signatures = new Set(samples.map(function (variant) {
  return variant.origin.x.toFixed(2) + ":" + variant.origin.y.toFixed(2) + ":" +
    variant.rotation.toFixed(2) + ":" + variant.primaryPath + ":" + variant.secondaryPath;
}));
check(signatures.size === samples.length, "successive impact samples do not repeat crack geometry", signatures.size);

var repeatedRandomA = buildVariant && buildVariant(.5, function () { return .5; }, 10);
var repeatedRandomB = buildVariant && buildVariant(.5, function () { return .5; }, 11);
check(repeatedRandomA && repeatedRandomB &&
  (repeatedRandomA.primaryPath !== repeatedRandomB.primaryPath ||
    repeatedRandomA.origin.x !== repeatedRandomB.origin.x ||
    repeatedRandomA.rotation !== repeatedRandomB.rotation),
  "the impact serial still separates consecutive cracks if the random source repeats");

var light = buildVariant && buildVariant(.12, seeded(991), 4);
var severe = buildVariant && buildVariant(.95, seeded(991), 4);
check(light && severe && severe.maxRadius > light.maxRadius * 1.35,
  "higher-severity localized damage grows materially farther than a light strike",
  light && severe ? { light: light.maxRadius, severe: severe.maxRadius } : null);

var bounded = samples.every(function (variant) {
  return variant.points.map(function (point) { return rotate(point, variant); }).every(function (point) {
    return point.x >= 245 && point.x <= 490 && point.y >= -105 && point.y <= 75;
  });
});
check(bounded && /id="entrance-roadtrip-crack"[^>]*clip-path="url\(#entrance-roadtrip-windshield-clip\)"/.test(source),
  "generated geometry stays compact and the SVG clip contains every fracture within the windshield");

check(/#entrance-room\.roadtrip-cracked #entrance-roadtrip-crack\{opacity:calc\(\.28 \+ var\(--roadtrip-damage,\.6\) \* \.68\)\}/.test(source),
  "localized crack opacity remains proportional to impact severity");
check(/damage === "crack" && !room\.classList\.contains\("roadtrip-shattered"\)[\s\S]{0,180}paintRoadtripCrack\(severity\)[\s\S]{0,120}roadtrip-cracked/.test(source) &&
  painterSource.indexOf("roadtrip-shattered") < 0,
  "crack impacts repaint only the localized layer and cannot promote themselves to a shatter");
check(/damage === "shatter"[\s\S]{0,180}roadtrip-shattered/.test(source) &&
  /#entrance-room\.roadtrip-shattered #entrance-roadtrip-shatter\{opacity:\.96\}/.test(source),
  "head-on damage retains its separate full-windshield shatter layer");

if (failures) process.exit(1);
console.log("  All windshield crack source checks passed.");

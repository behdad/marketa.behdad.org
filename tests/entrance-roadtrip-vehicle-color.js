#!/usr/bin/env node
// A highway vehicle keeps the same paint when its front/rear template swaps at the mirror.
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;

function bodyPaint(id) {
  var group = source.match(new RegExp('<g id="entrance-roadtrip-' + id + '">([\\s\\S]*?)</g>'));
  var pathTag = group && group[1].match(/<path\b[^>]*>/);
  var fill = pathTag && pathTag[0].match(/\bfill="([^"]+)"/);
  var stroke = pathTag && pathTag[0].match(/\bstroke="([^"]+)"/);
  return fill && stroke ? fill[1] + "/" + stroke[1] : "";
}

console.log("rsvp.html Road Trip vehicle paint continuity:");
["car", "pickup", "truck", "rv"].forEach(function (type) {
  var rear = bodyPaint(type);
  var front = bodyPaint(type + "-oncoming");
  if (rear && rear === front) console.log("  ✓ " + type + " front/rear body paint matches (" + rear + ")");
  else {
    failures++;
    console.log("  ✗ " + type + " changes paint at the mirror (rear " + rear + ", front " + front + ")");
  }
});

if (failures) process.exit(1);
console.log("Vehicle paint continuity checks passed.");

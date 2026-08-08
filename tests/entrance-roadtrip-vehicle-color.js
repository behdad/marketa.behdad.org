#!/usr/bin/env node
// A highway vehicle keeps the same paint when its front/rear template swaps at the mirror.
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;

function bodyPaint(id) {
  var group = source.match(new RegExp('<g id="entrance-roadtrip-' + id + '"[^>]*>([\\s\\S]*?)</g>'));
  var pathTag = group && group[1].match(/<path\b[^>]*>/);
  var fill = pathTag && pathTag[0].match(/\bfill="([^"]+)"/);
  var stroke = pathTag && pathTag[0].match(/\bstroke="([^"]+)"/);
  return fill && stroke ? fill[1] + "/" + stroke[1] : "";
}

function vehicleTemplate(id) {
  var group = source.match(new RegExp('<g id="entrance-roadtrip-' + id + '"([^>]*)>([\\s\\S]*?)</g>'));
  if (!group) return null;
  return {
    attrs: group[1],
    body: group[2],
    primitives: (group[2].match(/<(?:path|rect|circle|ellipse)\b/g) || []).length
  };
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

  [type, type + "-oncoming"].forEach(function (id, index) {
    var template = vehicleTemplate(id);
    var view = index ? "front" : "rear";
    var detailed = template && /data-vehicle-detail="panel"/.test(template.body) &&
      /data-vehicle-detail="plate"/.test(template.body) &&
      /data-vehicle-detail="wheel"/.test(template.body) &&
      (view === "rear" && type === "truck" || /data-vehicle-detail="glass"/.test(template.body));
    if (template && new RegExp('data-vehicle-view="' + view + '"').test(template.attrs) && detailed &&
        template.primitives >= 8 && template.primitives <= 14) {
      console.log("  ✓ " + id + " keeps a bounded, readable " + view + " detail set (" + template.primitives + " primitives)");
    } else {
      failures++;
      console.log("  ✗ " + id + " lost its " + view + " identity/detail budget [" + JSON.stringify(template) + "]");
    }
  });
});

if (failures) process.exit(1);
console.log("Vehicle paint continuity checks passed.");

#!/usr/bin/env node
// Static geometry contract for the Entrance highway's perspective road markings.
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

function between(start, end) {
  var from = source.indexOf(start);
  var to = source.indexOf(end, from + start.length);
  return from >= 0 && to > from ? source.slice(from, to) : "";
}

console.log("rsvp.html Entrance highway perspective lines:");

check(/\.entrance-roadtrip-rumble\{fill:none;stroke:#d9d1b8;stroke-width:1\.45;stroke-dasharray:2 3;opacity:\.62\}/.test(source),
  "the rumble strip stays a restrained dashed stroke beside the road edge");
check(/\.entrance-roadtrip-edge\{fill:#e9e5d7;stroke:none\}/.test(source) &&
  /\.entrance-roadtrip-centerline\{fill:#d8a72d;stroke:none;opacity:\.9\}/.test(source),
  "white edge and double-yellow markings are fills, not constant-width strokes");

var roadMarkup = between('<g id="entrance-roadtrip-road">', '<g id="entrance-roadtrip-furniture">');
var staticEdges = roadMarkup.match(/<path class="entrance-roadtrip-edge"[^>]+>/g) || [];
var staticCenter = (roadMarkup.match(/<path class="entrance-roadtrip-centerline"[^>]+>/) || [""])[0];
var staticDashes = between('<g id="entrance-roadtrip-lane-marks"', "</g>");
check(staticEdges.length === 2 && staticEdges.every(function (tag) {
  return /d="[^"]+Z"/.test(tag) && !/\bstroke=/.test(tag);
}) && /d="[^"]+ZM[^"]+Z"/.test(staticCenter) && !/\bstroke=/.test(staticCenter),
  "the initial edge and centre geometry is made of closed perspective bands");
check((staticDashes.match(/<path d="[^"]+Z"\/>/g) || []).length === 6,
  "all six initial dashed lane marks are closed filled polygons");

var project = between("function roadtripProjectionAt(distance, remaining, bodyPitch)", "function roadtripProject(remaining)");
var halfWidth = project.match(/halfWidth:\s*([\d.]+)\s*\+\s*perspective\s*\*\s*([\d.]+)/);
var paint = between("function paintRoadtripRoad()", "function roadtripLaneValue(lane)");
var geometry = between("function roadtripGeometryProfile()", "function setRoadtripBlendOpacity(id, opacity)");
var outer = geometry.match(/outerFraction:\s*([\d.]+)\s*\+/);
var farHalf = halfWidth ? Number(halfWidth[1]) : NaN;
var nearHalf = halfWidth ? farHalf + Number(halfWidth[2]) : NaN;
var outerFraction = outer ? Number(outer[1]) : NaN;
var horizonWidth = farHalf * outerFraction * 2;
var nearWidth = nearHalf * outerFraction * 2;
check(horizonWidth > 5 && horizonWidth < 7 && nearWidth > 700 && nearWidth / horizonWidth > 100,
  "the visible asphalt converges narrowly at the horizon and spans the near windshield",
  { horizonWidth: horizonWidth, nearWidth: nearWidth });

check(/var roadFraction = geometry\.roadFraction;/.test(paint) &&
  /roadtripSetAttribute\(roadtripEdgePaths\[0\], "d",[\s\S]*roadtripBandPath\(samples, -roadFraction, -roadFraction \+ \.006\)/.test(paint) &&
  /roadtripSetAttribute\(roadtripEdgePaths\[1\], "d",[\s\S]*roadtripBandPath\(samples, roadFraction - \.006, roadFraction\)/.test(paint) &&
  /roadtripSetAttribute\(roadtripCenterPath, "d",[\s\S]*-geometry\.centerFraction - geometry\.centerWidth \/ 2[\s\S]*geometry\.centerFraction \+ geometry\.centerWidth \/ 2/.test(paint),
  "route-aware runtime edges and centre markings are regenerated as filled bands");
check(/var farWidth = \.25 \+ far\.perspective \* 1\.5;/.test(paint) &&
  /var nearWidth = \.35 \+ near\.perspective \* 2\.1;/.test(paint) &&
  /roadtripSetAttribute\(mark, "d",[\s\S]+nearX - nearWidth[\s\S]+"Z"\);/.test(paint),
  "runtime lane dashes are closed polygons whose widths grow with perspective");

var mirror = between("function roadtripMirrorProject(behind)", "function roadtripProjectLateral(point, roadFraction)");
check(/function roadtripMirrorLinePath\(samples, roadFraction\)/.test(mirror) &&
  /function roadtripMirrorBandPath\(samples, outerFraction, innerFraction\)/.test(mirror),
  "the existing sampled rear-view road projection remains present and independent");

if (failures) {
  console.error(failures + " Entrance highway perspective-line assertion(s) failed.");
  process.exit(1);
}
console.log("Entrance highway perspective-line assertions passed.");

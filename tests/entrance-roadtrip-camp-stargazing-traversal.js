#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var startMarker = '<g class="entrance-roadtrip-stargazing-constellation" data-stargazing-constellation="ursa-minor">';
var endMarker = 'data-i="entrance_roadtrip_stargazing_ursa_minor"';
var start = source.indexOf(startMarker);
var end = source.indexOf(endMarker, start);
var block = start >= 0 && end > start ? source.slice(start, end) : "";
var failures = 0;

function check(ok, message, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + message + (ok || detail == null ? "" : " — " + JSON.stringify(detail)));
  if (!ok) failures++;
}
function attributes(tag) {
  var result = {}, match, pattern = /([\w-]+)="([^"]*)"/g;
  while ((match = pattern.exec(tag))) result[match[1]] = match[2];
  return result;
}
function point(x, y) { return [Number(x), Number(y)]; }
function samePoint(a, b) { return a[0] === b[0] && a[1] === b[1]; }
function sharesEndpoint(a, b) {
  return samePoint(a[0], b[0]) || samePoint(a[0], b[1]) ||
    samePoint(a[1], b[0]) || samePoint(a[1], b[1]);
}
function edgeKey(edge) {
  var ends = edge.map(function (end) { return end.join(","); }).sort();
  return ends.join("|");
}

var stars = [];
var starPattern = /<g class="entrance-roadtrip-stargazing-star" data-stargazing-star="(\d+)"><circle class="entrance-roadtrip-stargazing-star-hit"[^>]*>/g;
var match;
while ((match = starPattern.exec(block))) {
  var starAttrs = attributes(match[0]);
  stars[Number(match[1])] = point(starAttrs.cx, starAttrs.cy);
}
var segments = (block.match(/<line class="entrance-roadtrip-stargazing-segment"[^>]*>/g) || []).map(function (tag) {
  var attrs = attributes(tag);
  return {
    after: Number(attrs["data-stargazing-after"]),
    edge: [point(attrs.x1, attrs.y1), point(attrs.x2, attrs.y2)]
  };
});
var expectedShape = [
  [[466,42],[489,55]], [[489,55],[513,20]], [[513,20],[492,2]],
  [[492,2],[466,42]], [[513,20],[552,-8]], [[552,-8],[592,-8]],
  [[592,-8],[626,1]]
].map(edgeKey).sort();
var moves = stars.slice(1).map(function (to, index) {
  var from = stars[index];
  return segments.some(function (segment) {
    return (samePoint(from, segment.edge[0]) && samePoint(to, segment.edge[1])) ||
      (samePoint(from, segment.edge[1]) && samePoint(to, segment.edge[0]));
  });
});
var segmentChain = segments.slice(1).map(function (segment, index) {
  return sharesEndpoint(segments[index].edge, segment.edge);
});

console.log("loft-day.html Ursa Minor tracing traversal:");
check(block.length > 0, "the authored Ursa Minor trace card is present");
check(stars.length === 7 && stars.filter(Boolean).length === 7 && segments.length === 7,
  "the trace retains its seven authored stars and seven silhouette segments", { stars: stars, segments: segments });
check(JSON.stringify(segments.map(function (segment) { return edgeKey(segment.edge); }).sort()) === JSON.stringify(expectedShape),
  "the connected traversal preserves the Little Dipper silhouette", segments);
check(moves.length === 6 && moves.every(Boolean),
  "every consecutive prompted star is joined by an authored segment", { stars: stars, connected: moves });
check(segmentChain.length === 6 && segmentChain.every(Boolean),
  "every consecutive revealed segment shares an endpoint", { segments: segments, connected: segmentChain });
check(JSON.stringify(segments.map(function (segment) { return segment.after; })) === JSON.stringify([2,3,4,4,5,6,7]),
  "the connected segments retain the seven-step reveal schedule", segments);

if (failures) process.exit(1);
console.log("Ursa Minor tracing traversal assertions passed.");

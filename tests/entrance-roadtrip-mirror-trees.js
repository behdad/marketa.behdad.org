#!/usr/bin/env node
// Rear-view roadside trees stay planted at their curve-aware projected bases.
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failures = 0;

function check(ok, label, detail) {
  console.log("  " + (ok ? "✓ " : "✗ ") + label);
  if (!ok) {
    failures++;
    if (detail !== undefined) console.log("    " + JSON.stringify(detail));
  }
}

function attrNode() {
  var attrs = {};
  return {
    setAttribute: function (name, value) { attrs[name] = String(value); },
    removeAttribute: function (name) { delete attrs[name]; },
    getAttribute: function (name) { return attrs[name] || ""; }
  };
}

var functionMatch = source.match(/function paintRoadtripMirrorScenery\(\)\s*\{[\s\S]*?\n  \}/);
check(!!functionMatch, "mirror scenery painter is present");

var trees = Array.from({ length: 8 }, attrNode);
var roadtripMirrorTreePool = trees;
var roadtripMirrorTerrain = attrNode();
var ROADTRIP_FURNITURE_SIZE = 14;
var roadtripFurniturePool = Array.from({ length: ROADTRIP_FURNITURE_SIZE }, function (_, index) {
  return { index: index, type: index % 7 === 0 ? "speed-90" : index % 5 === 0 ? "lamp" : index % 3 === 0 ? "post" : "tree" };
});
var roadtripState = { active: true, distance: 60 };
function roadtripRearCurveOffset() { return 0; }
function roadtripMirrorProject(behind) {
  var perspective = Math.max(0, 1 - behind / 62);
  return { center: 340, halfWidth: 3 + perspective * 55, perspective: perspective, y: -99 + perspective * 22 };
}

var paint = functionMatch ? Function(
  "roadtripMirrorTreePool", "roadtripMirrorTerrain", "roadtripState", "roadtripFurniturePool", "ROADTRIP_FURNITURE_SIZE",
  "roadtripRearCurveOffset", "roadtripMirrorProject",
  "return (" + functionMatch[0] + ");"
)(roadtripMirrorTreePool, roadtripMirrorTerrain, roadtripState, roadtripFurniturePool, ROADTRIP_FURNITURE_SIZE,
  roadtripRearCurveOffset, roadtripMirrorProject) : function () {};
paint();

var visible = trees.filter(function (tree) { return tree.getAttribute("visibility") === "visible"; });
var rows = visible.map(function (tree) {
  var transform = tree.getAttribute("transform");
  var scale = transform.match(/scale\(([-+.\d]+) ([-+.\d]+)\)/);
  return {
    side: tree.getAttribute("data-roadtrip-side"),
    sourceIndex: Number(tree.getAttribute("data-roadtrip-source-index")),
    behind: Number(tree.getAttribute("data-roadtrip-behind")),
    base: Number(tree.getAttribute("data-roadtrip-base-y")),
    top: Number(tree.getAttribute("data-roadtrip-top-y")),
    project: Number(tree.getAttribute("data-roadtrip-project-y")),
    scaleX: scale && Number(scale[1]),
    scaleY: scale && Number(scale[2])
  };
});

check(trees.length === 8 && visible.length === 2 &&
  rows.map(function (row) { return row.behind; }).sort(function (a, b) { return a - b; }).join(",") === "14,35",
  "the bounded pool shows only the two authored roadside trees actually passed in the last 62 metres", rows);
check(rows.some(function (row) { return row.side === "left"; }) &&
  rows.some(function (row) { return row.side === "right"; }),
  "trees alternate across both roadside verges", rows);
check(rows.every(function (row) {
  return row.scaleX > 0 && row.scaleY === row.scaleX && row.top < row.base && row.base === row.project;
}), "each conifer grows upward from its projected road-edge base", rows);
var nearest = rows.slice().sort(function (a, b) { return a.behind - b.behind; })[0];
var farthest = rows.slice().sort(function (a, b) { return b.behind - a.behind; })[0];
check(nearest && farthest && nearest.scaleX > farthest.scaleX &&
  nearest.base - nearest.top > farthest.base - farthest.top,
  "trees shrink toward the rear-view horizon", { nearest: nearest, farthest: farthest });
check(/for \(var mirrorTreeIndex = 0; mirrorTreeIndex < 8; mirrorTreeIndex\+\+\)/.test(source) &&
  /mirrorTree\.setAttribute\("href", "#entrance-drive-conifer"\)/.test(source),
  "the tree pool reuses the native SVG conifer without new assets");
check(/roadtripFurniturePool\.filter\(function \(item\) \{ return item\.type === "tree"; \}\)/.test(source) &&
  /var treeAt = source\.index \* 21 \+ 4/.test(source) && /var side = source\.index % 2 \? 1 : -1/.test(source),
  "mirror trees reuse the windshield furniture cadence and roadside side");
check(/entrance-roadtrip-season-spring #entrance-roadtrip-mirror-trees\{fill:#4d7048\}/.test(source) &&
  /entrance-roadtrip-season-winter #entrance-roadtrip-mirror-trees\{fill:#3f4b48;stroke:#273330;stroke-width:\.35\}/.test(source),
  "mirror trees retain seasonal colouring with strong winter contrast");
check(source.indexOf('id="entrance-roadtrip-mirror-winter"') < source.indexOf('id="entrance-roadtrip-mirror-trees"') &&
  source.indexOf('id="entrance-roadtrip-mirror-trees"') < source.indexOf('id="entrance-roadtrip-mirror-road"'),
  "mirror trees paint above the snow bank and below the road surface");
check(/not\(\.entrance-day\) #entrance-roadtrip-mirror-trees\{fill:#10241c;stroke:#738678/.test(source),
  "night trees remain legible against the dark verge");

if (failures) process.exit(1);
console.log("Entrance Road Trip mirror-tree assertions passed.");

#!/usr/bin/env node
// Source-level roadtrip scoring contract: no browser or page runtime required.
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

function functionSource(name) {
  var start = source.indexOf("function " + name + "(");
  if (start < 0) throw new Error("missing function " + name);
  var brace = source.indexOf("{", start);
  var depth = 0, quote = "", escaped = false;
  for (var i = brace; i < source.length; i++) {
    var char = source.charAt(i);
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error("unterminated function " + name);
}

function loadFunction(name) {
  return Function("return (" + functionSource(name) + ");")();
}

console.log("rsvp.html Entrance roadtrip scoring:");

var distancePoints = loadFunction("roadtripDistancePoints");
var elapsedLabel = loadFunction("roadtripElapsedLabel");
var distanceLabel = loadFunction("roadtripDistanceLabel");
var gradeKey = loadFunction("roadtripGradeKey");
var collisionPenalty = loadFunction("roadtripCollisionPenalty");
var collectibleValue = loadFunction("roadtripCollectibleValue");
var legacyScore = loadFunction("roadtripLegacyScore");

check([0, 99, 100, 199, 200, 999].map(distancePoints).join(",") === "0,0,1,1,2,9",
  "distance earns exactly one unmultiplied point per 100 metres");
check(elapsedLabel(496) === "8:16" && elapsedLabel(3723) === "1:02:03",
  "elapsed time stays compact below and above one hour");
check(distanceLabel(12400, "en") === "12.4" && distanceLabel(12400, "cs") === "12,4",
  "distance uses a compact kilometre value with the active locale's decimal mark");
check([99, 100, 249, 250, 499, 500].map(gradeKey).join(",") === [
  "entrance_roadtrip_grade_sunday", "entrance_roadtrip_grade_scenic",
  "entrance_roadtrip_grade_scenic", "entrance_roadtrip_grade_regular",
  "entrance_roadtrip_grade_regular", "entrance_roadtrip_grade_legend"
].join(","), "grade boundaries are 100, 250, and 500 points");
check(collisionPenalty("rear-end", 0) === 10 && collisionPenalty("rear-end", 1) === 40 &&
  collisionPenalty("wildlife", 0) === 20 && collisionPenalty("wildlife", 1) === 60 &&
  collisionPenalty("head-on", .2) === 100,
  "collision deductions stay within the approved rear-end, wildlife, and head-on bounds");
check(legacyScore(2000) === 100, "legacy scores migrate to the compact scale proportionally");
check(/ROADTRIP_BEST_KEY = "entranceRoadtripBest:v2"/.test(source) &&
  /ROADTRIP_LEGACY_BEST_KEY = "entranceRoadtripBest:v1"/.test(source) &&
  /storedRoadtripBest = roadtripLegacyScore\(legacyRoadtripBest\)/.test(source),
  "the compact best key imports an existing v1 personal best once");

var bonusSource = functionSource("awardRoadtripBonus");
var penaltySource = functionSource("applyRoadtripPenalty");
var distanceAwardSource = functionSource("awardRoadtripDistance");
var paintSource = functionSource("paintRoadtripScore");
var checkpointStart = source.indexOf("var entranceCheckpoint = {");
var checkpointRestore = source.indexOf("restore: function (row, phase)", checkpointStart);
var checkpointCaptureSource = source.slice(checkpointStart, checkpointRestore);
check(/Math\.min\(3, roadtripState\.multiplier \+ 1\)/.test(bonusSource) &&
  /points \* roadtripState\.multiplier/.test(bonusSource),
  "only bonus awards use the combo and the combo caps at ×3");
check(/roadtripState\.score -= points/.test(penaltySource) && /roadtripState\.multiplier = 1/.test(penaltySource),
  "penalties are unmultiplied and reset the combo");
check(/roadtripState\.score \+= added/.test(distanceAwardSource) &&
  !/awardRoadtripBonus|multiplier/.test(distanceAwardSource),
  "distance points bypass the combo pipeline");
check(/awardRoadtripBonus\(3\)/.test(source) && /awardRoadtripBonus\(2\)/.test(source) &&
  ["heart", "mushroom", "kiss", "frog", "inf"].map(collectibleValue).join(",") === "5,7,10,12,25",
  "safe wildlife, close passes, and the five pickups use their documented point bases");
check(/roadtripCollisionPenalty\("rear-end"/.test(source) &&
  /roadtripCollisionPenalty\(smallWildlifeHit \? "rabbit" : "wildlife"/.test(source) &&
  /roadtripCollisionPenalty\("head-on"/.test(source),
  "every collision class routes through the shared penalty boundary");
check(!/padStart/.test(paintSource) && /roadtripElapsedLabel/.test(paintSource) &&
  /roadtripDistanceLabel/.test(paintSource) && /pointsUnit/.test(paintSource),
  "the HUD shows plain time · distance · points values without score padding");
check(/id="entrance-roadtrip-speed"[^>]*x="258"[^>]*text-anchor="end"/.test(source) &&
  /id="entrance-roadtrip-score"[^>]*x="29"/.test(source) &&
  /id="entrance-roadtrip-run-panel"[^>]*transform="translate\(-9\.5 -3\)"/.test(source),
  "the score stays left while a right-aligned speed slot reserves room through 263 km/h");
check(/scoringVersion: ROADTRIP_SCORING_VERSION/.test(source) &&
  /distancePoints: roadtripState\.distancePoints/.test(source) &&
  /elapsedSeconds: Math\.round\(roadtripState\.elapsedSeconds/.test(source),
  "checkpoints retain scoring version, elapsed time, and the distance-point watermark");
check(/odometerKm: Math\.round\(driveState\.odometerKm/.test(checkpointCaptureSource) &&
  !/\brpm:|\btemperature:/.test(checkpointCaptureSource),
  "checkpoint capture keeps the durable odometer but excludes ticking RPM and temperature");
var enMessages = fs.readFileSync(path.join(__dirname, "..", "loft-day.en.js"), "utf8");
var csMessages = fs.readFileSync(path.join(__dirname, "..", "loft-day.cs.js"), "utf8");
check(/"entrance_roadtrip_grade_sunday": "Scenic drive"/.test(enMessages) &&
  /"entrance_roadtrip_grade_sunday": "Vyhlídková jízda"/.test(csMessages) &&
  /"entrance_roadtrip_grade_legend": "Highway legend"/.test(enMessages) &&
  /"entrance_roadtrip_grade_legend": "Legenda dálnice"/.test(csMessages),
  "English and Czech grade labels cover both ends of the scale");
check(/gradeFallback\[gradeKey\]\[lang\]/.test(source) &&
  !/grade\.textContent\s*=.*:\s*gradeKey\s*;/.test(source),
  "the first HUD paint falls back to a translated grade instead of exposing its dictionary key");

console.log("");
if (failures) {
  console.log(failures + " roadtrip-scoring assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Entrance roadtrip scoring assertions passed.");

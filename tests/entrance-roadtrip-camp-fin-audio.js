#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var failed = false;

function check(ok, label) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) failed = true;
}
function functionBody(name) {
  var start = source.indexOf("function " + name + "(");
  if (start < 0) return "";
  var open = source.indexOf("{", start), depth = 0;
  for (var i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}" && --depth === 0) return source.slice(open + 1, i);
  }
  return "";
}

var melody = functionBody("playCampFinMelody");
var allowed = functionBody("campFinLoveVoiceAllowed");
var schedule = functionBody("scheduleCampFinLoveVoices");
var coda = functionBody("playCampBearCodaSound");

check(/getSfxCtx\(\)/.test(melody) && !/new\s+(?:AudioContext|webkitAudioContext)/.test(melody),
  "the fin motif stays on the shared SFX context");
check(/entrance-roadtrip-camp-marketa/.test(melody) &&
  /entrance-roadtrip-camp-behdad/.test(melody) &&
  /440[\s\S]*196[\s\S]*587\.33[\s\S]*146\.83[\s\S]*493\.88[\s\S]*185/.test(melody),
  "two spatially distinct voices trade the original fin phrase");
check(/146\.83[\s\S]*220[\s\S]*440[\s\S]*659\.25/.test(melody),
  "the two motif voices resolve together on the final glow");
check((schedule.match(/playILoveYouSound/g) || []).length === 2 &&
  /camp-marketa",\s*1\.08/.test(schedule) && /camp-behdad",\s*\.82/.test(schedule),
  "the completed motif hands off to two contrasting synthesized love lines");
check(/document\.hidden[\s\S]*document\.hasFocus[\s\S]*__roomAmbienceCovered[\s\S]*camp-sleep-congrats[\s\S]*trip\.active[\s\S]*trip\.route\s*===\s*"camp"/.test(allowed) &&
  (schedule.match(/campFinLoveVoiceAllowed\(\)/g) || []).length === 2,
  "both delayed voices re-check attention and terminal Camping ownership");
check(/kind\s*===\s*"finale"[\s\S]*playCampFinMelody\(\)[\s\S]*scheduleCampFinLoveVoices\(\)/.test(coda) &&
  !/playFinishMelody/.test(coda),
  "the campsite finale owns its new cue instead of reusing the Balcony melody");

if (failed) process.exit(1);
console.log("Campsite fin audio checks passed.");

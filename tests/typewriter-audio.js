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

var typeKey = functionBody("typeKey");
var sound = functionBody("playTypewriterSound");

check(/3\s*\+\s*Math\.floor\(Math\.random\(\)\s*\*\s*3\)/.test(typeKey) &&
  /for\s*\([^)]*i\s*<\s*burst/.test(typeKey),
  "one typewriter activation produces exactly a randomized 3–5-key burst");
check(/playTypewriterSound\([^;]*"office-typewriter"\s*,\s*at\)/.test(typeKey) &&
  /at\s*\+=\s*0\.055\s*\+\s*Math\.random\(\)\s*\*\s*0\.035/.test(typeKey),
  "the burst varies pitch and rapid key spacing");
check(/ctx\.currentTime\s*\+\s*Math\.max\(0,\s*delaySeconds\s*\|\|\s*0\)/.test(sound) &&
  typeKey.indexOf("setTimeout") < 0,
  "all key strikes are scheduled on the shared audio clock without deferred callbacks");

if (failed) process.exit(1);
console.log("typewriter audio checks passed");

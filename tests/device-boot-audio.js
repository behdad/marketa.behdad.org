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

var pc = functionBody("playPcBootSound");
var pcOff = functionBody("playPcShutdownSound");
var laptop = functionBody("playLaptopBootSound");
var call = functionBody("playCallConnectSound");
var laptopAllowed = functionBody("laptopUpdateSoundAllowed");
var updateStart = source.indexOf("function runLaptopUpdate()");
var updateEnd = source.indexOf("// Call the Prague garden:", updateStart);
var laptopFlow = source.slice(updateStart, source.indexOf("function endCall(", updateEnd));
var screenStart = source.indexOf("function updateScreen()");
var screenEnd = source.indexOf("window.__shortOutMonitor", screenStart);
var screenFlow = source.slice(screenStart, screenEnd);
var togglePc = functionBody("togglePc");
var monitorPower = functionBody("monitorSystemAction");
var helpersParse = true;
try {
  [pc, pcOff, laptop, call].forEach(function (body) { Function("panId", body); });
} catch (error) {
  helpersParse = false;
}

check(!!pc && !!pcOff && !!laptop && !!call,
  "PC power-up, PC power-off, laptop, and call connection own named cue helpers");
check(helpersParse, "all four cue helpers parse as JavaScript");
check([pc, pcOff, laptop, call].every(function (body) {
  return body.indexOf("getSfxCtx()") >= 0 &&
    /document\.hidden[\s\S]*document\.hasFocus\(\)/.test(body) &&
    !/new\s+(?:AudioContext|webkitAudioContext)/.test(body);
}), "all four cues are unattended-safe consumers of the shared SFX context");
check(new Set([pc, pcOff, laptop, call]).size === 4 && /146\.83[\s\S]*220/.test(pc) &&
  !/164\.81|246\.94|293\.66|440/.test(pc) &&
  /1318\.51[\s\S]*880[\s\S]*1108\.73/.test(laptop) &&
  /523\.25[\s\S]*659\.25[\s\S]*783\.99[\s\S]*1046\.5/.test(call),
  "the four helpers retain separate power-pair, glass-contour, and rising-call patterns");
check(/220[\s\S]*146\.83/.test(pcOff) &&
  /document\.hidden[\s\S]*document\.hasFocus\(\)/.test(pcOff) &&
  /playPcShutdownSound\("office-pc-desk-trio"\)/.test(togglePc) &&
  !/playSparkSound/.test(togglePc) && !/playMonitorShutdownSound/.test(source) &&
  !/playPcShutdownSound/.test(monitorPower),
  "PC off reverses the same two notes without a legacy spark or shutdown melody");
check(/document\.hidden[\s\S]*document\.hasFocus\(\)[\s\S]*__monitorAttention/.test(laptopAllowed),
  "the delayed laptop update click and cue are re-gated at callback time");
check(/playLaptopBootSound\("office-laptop"\)/.test(laptopFlow) &&
  /playCallConnectSound\("office-laptop"\)/.test(laptopFlow) &&
  /playPcBootSound\("office-monitor"\)/.test(screenFlow),
  "device and video-call completion paths invoke their own cues");
check(source.indexOf("playBootChimeSound") < 0 &&
  /boot:\s*function\s*\(\)\s*\{\s*playPcBootSound\.apply/.test(source),
  "the ambiguous shared boot helper is gone and console boot previews the PC cue");

if (failed) process.exit(1);
console.log("device boot audio checks passed");

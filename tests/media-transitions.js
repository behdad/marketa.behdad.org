#!/usr/bin/env node
// Shared transport pause and party-dance mirrors have one transition owner each.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__setPartyMode(true,true);var strip=document.getElementById("loft-game-strip"),garden=document.getElementById("stage-garden");',
  ' window.__setMusicPaused(true);S("paused",{flag:!!window.__musicPaused,frozen:strip.classList.contains("dance-frozen")});window.__setMusicPaused(false);S("playing",{flag:!!window.__musicPaused,frozen:strip.classList.contains("dance-frozen")});',
  ' var set=window.__setPartyDance("salsa");S("dance",{set:set,mirror:window.__partyDance,stage:garden.getAttribute("data-partydance"),mode:document.getElementById("trip-melt-dancers").getAttribute("data-dance")});',
  ' var before=window.__partyDance;window.__nextPartyDance();S("advance",{before:before,after:window.__partyDance,stage:garden.getAttribute("data-partydance")});',
  ' window.__setPartyMode(false,true);S("off",{party:!!window.__gardenPartyOn,dance:window.__partyDance,stage:garden.getAttribute("data-partydance"),mode:document.getElementById("trip-melt-dancers").getAttribute("data-dance"),paused:!!window.__musicPaused});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html media transitions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.paused && s.paused.flag && s.paused.frozen && s.playing && !s.playing.flag && !s.playing.frozen,
  "setMusicPaused keeps transport state and party freeze together", { paused: s.paused, playing: s.playing });
check(s.dance && s.dance.set && s.dance.mirror === "salsa" && s.dance.stage === "salsa" && s.dance.mode === "salsa",
  "setPartyDance keeps its mirror and both SVG projections together", s.dance);
check(s.advance && s.advance.after !== s.advance.before && s.advance.stage === s.advance.after,
  "automatic dance advance uses the same transition", s.advance);
check(s.off && !s.off.party && s.off.dance === "techno" && s.off.stage === "" && s.off.mode === "" && !s.off.paused,
  "party teardown resets dance and transport projections", s.off);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/window\.__musicPaused\s*=(?!=)/g) || []).length === 1 &&
      (source.match(/window\.__partyDance\s*=(?!=)/g) || []).length === 1 &&
      /function setMusicPausedState\(on\)/.test(source) && /function setPartyDanceState\(id, options\)/.test(source),
  "shared media mirrors have only their named writers");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

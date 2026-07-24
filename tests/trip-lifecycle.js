#!/usr/bin/env node
// Trip state, visual classes, timers and stale callbacks share one transition owner.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function classes(){var s=document.getElementById("loft-game-strip");return ["nitrous","shrooms","acid","froggies","dmt","molly","ketamine","iboga"].filter(function(x){return s.classList.contains(x);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__startTrip("shrooms");window.__stopTrip(true);await sleep(100);S("stale",{state:window.__tripState(),mirror:!!window.__tripActive,classes:classes(),bloom:window.__tripBloomLoopRunning&&window.__tripBloomLoopRunning()});',
  ' window.__startTrip("shrooms");await sleep(80);window.__startTrip("acid");await sleep(100);S("interrupt",{state:window.__tripState(),mirror:!!window.__tripActive,classes:classes()});',
  ' window.__stopTrip(true);S("stop",{state:window.__tripState(),mirror:!!window.__tripActive,classes:classes(),creatures:document.querySelectorAll(".trip-creature-show").length,cards:document.querySelectorAll(".mol-show").length});',
  ' window.__startTrip("acid");await sleep(3200);S("natural",{state:window.__tripState(),mirror:!!window.__tripActive,classes:classes()});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{code:"Digit1",shiftKey:true,bubbles:true}));await sleep(2100);S("firstHotkey",{state:window.__tripState(),classes:classes(),card:!!document.querySelector("#mol-card-nitrous.mol-show")});window.__stopTrip(true);',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{code:"Digit8",shiftKey:true,bubbles:true}));await sleep(100);S("lastHotkey",{state:window.__tripState(),classes:classes()});window.__stopTrip(true);',
  ' var veil=document.getElementById("trip-tolerance-veil"),beforeVeil=veil&&veil.style.opacity;TRIP_DURATIONS.nitrous=80;window.__startTrip("nitrous");await sleep(150);S("neutral",{state:window.__tripState(),before:beforeVeil,after:veil&&veil.style.opacity});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html trip lifecycle:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7200, { patchRaf: true });
if (!result) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.stale && !s.stale.state.active && s.stale.state.variant === null && !s.stale.mirror && !s.stale.classes.length && !s.stale.bloom,
  "an immediate stop invalidates queued trip callbacks and every state representation", s.stale);
check(s.interrupt && s.interrupt.state.active && s.interrupt.state.variant === "acid" && s.interrupt.mirror && s.interrupt.classes.join(",") === "acid",
  "interrupting a trip leaves only the replacement transition active", s.interrupt);
check(s.stop && !s.stop.state.active && s.stop.state.variant === null && !s.stop.mirror && !s.stop.classes.length && !s.stop.creatures && !s.stop.cards,
  "explicit stop clears flags, variant, classes, creatures and cards together", s.stop);
check(s.natural && !s.natural.state.active && s.natural.state.variant === null && !s.natural.mirror && !s.natural.classes.length,
  "natural completion uses the same settled state", s.natural);
check(s.firstHotkey && s.firstHotkey.state.active && s.firstHotkey.state.variant === "nitrous" && s.firstHotkey.classes.join(",") === "nitrous" && s.firstHotkey.card,
  "Shift+1 launches laughing gas and shows its molecule card", s.firstHotkey);
check(s.lastHotkey && s.lastHotkey.state.active && s.lastHotkey.state.variant === "iboga" && s.lastHotkey.classes.join(",") === "iboga",
  "the former seven trips shift up intact, ending with iboga on Shift+8", s.lastHotkey);
check(s.neutral && !s.neutral.state.active && s.neutral.before === s.neutral.after,
  "laughing gas ends without adding a gray tolerance veil", s.neutral);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var mirrorWrites = source.match(/window\.__tripActive\s*=/g) || [];
check(mirrorWrites.length === 1 && /function setTripActiveState\(on\)[\s\S]*?window\.__tripActive\s*=\s*tripActive/.test(source),
  "the public trip-active mirror has one named writer", { writes: mirrorWrites.length });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

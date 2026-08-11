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
  ' window.__startTrip("acid");await sleep(4700);S("natural",{state:window.__tripState(),mirror:!!window.__tripActive,classes:classes()});',
  ' window.__gardenPartyOn=true;window.__goToStage("garden");window.__unlockDrugsbox();window.__openTripPicker();document.querySelector("#garden-trip-picker [data-trip=ketamine]").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(100);S("partyChoice",{state:window.__tripState(),classes:classes(),pickerOpen:window.__tripPickerOpen()});window.__stopTrip(true);window.__gardenPartyOn=false;',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{code:"Digit1",shiftKey:true,bubbles:true}));await sleep(2100);S("firstHotkey",{state:window.__tripState(),classes:classes(),card:!!document.querySelector("#mol-card-nitrous.mol-show")});window.__stopTrip(true);',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{code:"Digit8",shiftKey:true,bubbles:true}));await sleep(100);S("lastHotkey",{state:window.__tripState(),classes:classes()});window.__stopTrip(true);',
  ' window.__TRIP_DURATIONS.nitrous=500;document.getElementById("kitchen-whipper").dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(200);S("whipperHiss",{state:window.__tripState(),squeezed:document.getElementById("kitchen-whipper").classList.contains("dispensing")});await sleep(900);document.getElementById("kitchen-whipper").dispatchEvent(new MouseEvent("click",{bubbles:true}));S("whipper",{state:window.__tripState(),classes:classes(),card:!!document.querySelector("#mol-card-nitrous.mol-show"),bubble:!!document.querySelector(".egg-bubble"),ghost:getComputedStyle(document.getElementById("kitchen-whipper-laugh-ghost")).animationName,jaw:getComputedStyle(document.getElementById("kitchen-whipper-laugh-jaw")).animationName});window.__stopTrip(true);',
  ' window.__TRIP_DURATIONS.froggies=500;var frog=document.getElementById("garden-frog");frog.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);var paisley=document.querySelector(".trip-froggies-paisley"),whiteout=document.querySelector(".trip-froggies-whiteout"),paisleyStyle=getComputedStyle(paisley),whiteoutStyle=getComputedStyle(whiteout),wobble=document.getElementById("froggies-wobble-ramp");S("frogFirst",{state:window.__tripState(),classes:classes(),paisleyAnimation:paisleyStyle.animationName,paisleyDuration:paisleyStyle.animationDuration,whiteoutAnimation:whiteoutStyle.animationName,whiteoutDuration:whiteoutStyle.animationDuration,wobbleValues:wobble&&wobble.getAttribute("values"),wobbleTimes:wobble&&wobble.getAttribute("keyTimes"),layered:!!(paisley.compareDocumentPosition(whiteout)&Node.DOCUMENT_POSITION_FOLLOWING)});frog.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);S("frog",{state:window.__tripState(),classes:classes(),card:!!document.querySelector("#mol-card-froggies.mol-show")});window.__stopTrip(true);frog.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);S("frogLater",{state:window.__tripState(),classes:classes()});window.__stopTrip(true);',
  ' window.__TRIP_DURATIONS.shrooms=500;var mushroom=document.getElementById("garden-mushroom");mushroom.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);S("mushroomFirst",{state:window.__tripState(),classes:classes()});mushroom.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);S("mushroom",{state:window.__tripState(),classes:classes(),card:!!document.querySelector("#mol-card-shrooms.mol-show")});window.__stopTrip(true);mushroom.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(100);S("mushroomLater",{state:window.__tripState(),classes:classes()});window.__stopTrip(true);',
  ' var veil=document.getElementById("trip-tolerance-veil"),beforeVeil=veil&&veil.style.opacity;window.__TRIP_DURATIONS.nitrous=80;window.__startTrip("nitrous");await sleep(150);S("neutral",{state:window.__tripState(),before:beforeVeil,after:veil&&veil.style.opacity});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html trip lifecycle:");
var result = lib.runPageSync("rsvp.html", HARNESS, 11000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
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
check(s.partyChoice && s.partyChoice.state.active && s.partyChoice.state.variant === "ketamine" && s.partyChoice.classes.join(",") === "ketamine" && !s.partyChoice.pickerOpen,
  "a vitamins choice overrides the party's lighter automatic picks", s.partyChoice);
check(s.firstHotkey && s.firstHotkey.state.active && s.firstHotkey.state.variant === "nitrous" && s.firstHotkey.classes.join(",") === "nitrous" && s.firstHotkey.card,
  "Shift+1 launches laughing gas and shows its molecule card", s.firstHotkey);
check(s.lastHotkey && s.lastHotkey.state.active && s.lastHotkey.state.variant === "iboga" && s.lastHotkey.classes.join(",") === "iboga",
  "the former seven trips shift up intact, ending with iboga on Shift+8", s.lastHotkey);
check(s.whipperHiss && !s.whipperHiss.state.active && s.whipperHiss.squeezed,
  "the kitchen cream whipper squeezes and hisses before its trip", s.whipperHiss);
check(s.whipper && s.whipper.state.active && s.whipper.state.variant === "nitrous" && s.whipper.classes.join(",") === "nitrous" && !s.whipper.card,
  "the kitchen cream whipper then starts laughing gas without a molecule card", s.whipper);
check(s.whipper && !s.whipper.bubble,
  "an uncarded cream-whipper request stays silent while a trip is active", s.whipper);
check(s.whipper && s.whipper.ghost === "kitchen-whipper-ghost-rise" && s.whipper.jaw === "kitchen-whipper-laugh-jaw",
  "laughing gas animates Behdad's dispenser apparition and jaw", s.whipper);
check(s.frogFirst && s.frogFirst.state.active && s.frogFirst.state.variant === "froggies" && s.frogFirst.classes.join(",") === "froggies",
  "the frog's first tap starts its trip", s.frogFirst);
check(s.frogFirst && s.frogFirst.paisleyAnimation === "trip-froggies-paisley-rise" && s.frogFirst.paisleyDuration === "5s" && s.frogFirst.whiteoutAnimation === "trip-froggies-whiteout-fade" && s.frogFirst.whiteoutDuration === "5s" && s.frogFirst.wobbleValues === "0;12;45;45" && s.frogFirst.wobbleTimes === "0;.09;.48;1" && s.frogFirst.layered,
  "the dense paisley onset recedes beneath a smoothly ramped five-second whiteout", s.frogFirst);
check(s.frog && s.frog.state.active && s.frog.state.variant === "froggies" && s.frog.classes.join(",") === "froggies" && !s.frog.card,
  "another frog tap keeps its uncarded trip active", s.frog);
check(s.frogLater && s.frogLater.state.active && s.frogLater.state.variant === "froggies" && s.frogLater.classes.join(",") === "froggies",
  "a later frog tap starts a fresh trip immediately", s.frogLater);
check(s.mushroomFirst && s.mushroomFirst.state.active && s.mushroomFirst.state.variant === "shrooms" && s.mushroomFirst.classes.join(",") === "shrooms",
  "the mushroom's first tap starts its trip", s.mushroomFirst);
check(s.mushroom && s.mushroom.state.active && s.mushroom.state.variant === "shrooms" && s.mushroom.classes.join(",") === "shrooms" && !s.mushroom.card,
  "another mushroom tap keeps its uncarded trip active", s.mushroom);
check(s.mushroomLater && s.mushroomLater.state.active && s.mushroomLater.state.variant === "shrooms" && s.mushroomLater.classes.join(",") === "shrooms",
  "a later mushroom tap starts a fresh trip immediately", s.mushroomLater);
check(s.neutral && !s.neutral.state.active && s.neutral.before === s.neutral.after,
  "laughing gas ends without adding a gray tolerance veil", s.neutral);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var mirrorWrites = source.match(/window\.__tripActive\s*=/g) || [];
check(mirrorWrites.length === 1 && /function setTripActiveState\(on\)[\s\S]*?window\.__tripActive\s*=\s*tripActive/.test(source),
  "the public trip-active mirror has one named writer", { writes: mirrorWrites.length });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

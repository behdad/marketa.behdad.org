#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' ["loftArcadesPlayed","loftArcadesSuggested"].forEach(function(k){localStorage.removeItem(k);});',
  ' window.__secondRound=true;var random=Math.random;Math.random=function(){return 0;};',
  ' window.__arcadeRunStarted("flair");var first=window.__arcadeOfferNext("flair"),again=window.__arcadeOfferNext("flair");',
  ' var firstState=window.__arcadeCrossPromotionState(),thread=window.__phoneMessageThread();',
  ' S("first_offer",first==="invaders"&&again==="tetris"&&firstState.played.join(",")==="flair"&&firstState.suggested.join(",")==="invaders,tetris"&&thread.indexOf("arcade_offer_invaders")!==-1&&thread.indexOf("arcade_offer_tetris")!==-1);',
  ' window.__runMsgAction("arcade_offer_invaders");await sleep(180);',
  ' S("action_launches",window.__currentStageName==="office"&&window.__arcadeState().active);window.__arcadeStop(false);',
  ' window.__arcadeRunStarted("invaders");var second=window.__arcadeOfferNext("invaders");window.__arcadeRunStarted("tetris");var third=window.__arcadeOfferNext("tetris");window.__arcadeRunStarted("pacman");var none=window.__arcadeOfferNext("pacman");',
  ' var finalState=window.__arcadeCrossPromotionState();',
  ' S("unplayed_only",second==="pacman"&&third===null&&none===null&&finalState.played.length===4&&finalState.suggested.join(",")==="invaders,tetris,pacman");',
  ' Math.random=random;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html arcade cross-promotion:");
check(["flair", "invaders", "tetris", "pacman"].every(function (id) {
  return html.indexOf('__arcadeRunStarted("' + id + '")') !== -1 &&
    html.indexOf('__arcadeOfferNext("' + id + '")') !== -1;
}), "all four arcades report real runs and new personal bests");

var result = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true, forceMotion: true });
if (!result) check(false, "harness produced a report");
else {
  check(result.steps.first_offer, "later new bests can offer another still-unplayed arcade", result.steps);
  check(result.steps.action_launches, "the message action pans to and starts its suggested arcade", result.steps);
  check(result.steps.unplayed_only, "played and previously suggested arcades leave the candidate pool", result.steps);
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
}

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

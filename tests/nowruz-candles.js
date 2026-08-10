#!/usr/bin/env node
// Nowruz haft-seen candles: independent season-gated toggles, visible flame/glow,
// day/night continuity, fish/cat behavior, and season/full-reset teardown.
"use strict";

var lib = require("./lib");

var HARNESS = [
  // CSS transitions can stay pinned at their start value under --virtual-time-budget.
  // Disable only the probe's fade so computed opacity reflects the settled authored state.
  '<style>#office-haftsin .sn-hs-flame,#office-haftsin .sn-hs-glow{transition:none!important}</style>',
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function click(id){document.getElementById(id).dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function fishPounceAnimations(){var w=document.getElementById("witchy-chest-cat-walk");return w.getAnimations().filter(function(a){return a.effect&&a.effect.getComputedTiming().duration===1450;});}',
  'function fishPounces(){return fishPounceAnimations().length;}',
  'function state(){var a=document.getElementById("office-hs-candle-1"),b=document.getElementById("office-hs-candle-2"),fa=a.querySelector(".sn-hs-flame"),fb=b.querySelector(".sn-hs-flame"),ga=a.querySelector(".sn-hs-glow"),gb=b.querySelector(".sn-hs-glow"),w=document.getElementById("witchy-chest-cat-walk");return {lit:window.__nowruzCandleState(),flame:[getComputedStyle(fa).opacity,getComputedStyle(fb).opacity],glow:[getComputedStyle(ga).opacity,getComputedStyle(gb).opacity],night:document.getElementById("stage-office").classList.contains("dusk"),cat:window.cat.status(),fish:document.getElementById("office-hs-fish-dart").classList.contains("darting"),pounces:fishPounces(),roamPaused:w.style.animationPlayState==="paused"};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.season("nowruz");window.goToStage("office");await sleep(40);S("initial",state());',
  ' click("office-hs-candle-1-hit");await sleep(350);S("firstOff",state());',
  ' click("office-hs-candle-2-hit");await sleep(350);S("bothOff",state());',
  ' click("office-hs-candle-1-hit");await sleep(350);S("firstRelit",state());',
  ' window.night();await sleep(60);S("night",state());window.day();await sleep(60);S("day",state());',
  ' click("office-hs-bowl-hit");await sleep(80);S("fishNoCat",state());',
  ' window.__releaseCat(true);window.__homeCat("office",true);await sleep(40);click("office-hs-bowl-hit");await sleep(80);S("fishCat",state());',
  ' click("office-hs-bowl-hit");await sleep(80);S("fishCatRepeat",state());',
  ' var catAnim=fishPounceAnimations()[0];if(catAnim&&catAnim.onfinish){catAnim.onfinish();catAnim.cancel();}await sleep(40);S("fishCatSettled",state());',
  ' window.season("canada");click("office-hs-bowl-hit");await sleep(80);S("fishOffSeason",state());',
  ' window.cat.set(false);await sleep(40);window.season("nowruz");',
  ' window.season("canada");click("office-hs-candle-1-hit");await sleep(40);S("seasonExit",state());',
  ' window.season("nowruz");click("office-hs-candle-2-hit");await sleep(40);window.__activateExtinguisher();await sleep(1300);S("fullReset",state());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function same(actual, expected) {
  return !!actual && actual.length === expected.length && actual.every(function (v, i) { return v === expected[i]; });
}

console.log("rsvp.html Nowruz haft-seen candles:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.initial && same(s.initial.lit, [true, true]) && s.initial.flame.every(function (v) { return +v > 0; }) && s.initial.glow.every(function (v) { return +v > 0; }),
  "Nowruz begins with two visibly lit candles", s.initial);
check(s.firstOff && same(s.firstOff.lit, [false, true]) && +s.firstOff.flame[0] === 0 && +s.firstOff.glow[0] === 0 && +s.firstOff.flame[1] > 0,
  "the first candle snuffs independently", s.firstOff);
check(s.bothOff && same(s.bothOff.lit, [false, false]) && s.bothOff.flame.every(function (v) { return +v === 0; }),
  "the second candle can be snuffed separately", s.bothOff);
check(s.firstRelit && same(s.firstRelit.lit, [true, false]) && +s.firstRelit.flame[0] > 0 && +s.firstRelit.glow[0] > 0,
  "a snuffed candle relights with flame and glow", s.firstRelit);
check(s.night && s.night.night && same(s.night.lit, [true, false]) && s.day && !s.day.night && same(s.day.lit, [true, false]),
  "day/night changes preserve each candle state", { night: s.night, day: s.day });
check(s.fishNoCat && s.fishNoCat.fish && s.fishNoCat.pounces === 0 && same(s.fishNoCat.lit, [true, false]),
  "the goldfish keeps its normal reaction when no cat is loose", s.fishNoCat);
check(s.fishCat && s.fishCat.fish && s.fishCat.cat && s.fishCat.pounces === 1 && s.fishCat.roamPaused,
  "a loose office cat makes one guarded attempt at the Nowruz fish", s.fishCat);
check(s.fishCatRepeat && s.fishCatRepeat.fish && s.fishCatRepeat.pounces === 1,
  "repeat bowl taps restart the fish without duplicating the cat pounce", s.fishCatRepeat);
check(s.fishCatSettled && s.fishCatSettled.pounces === 0 && !s.fishCatSettled.roamPaused,
  "the fish pounce finishes cleanly and resumes roaming", s.fishCatSettled);
check(s.fishOffSeason && s.fishOffSeason.fish && s.fishOffSeason.pounces === 0,
  "a hidden off-season bowl tap cannot start another cat pounce", s.fishOffSeason);
check(s.seasonExit && same(s.seasonExit.lit, [true, true]),
  "leaving Nowruz resets both candles and blocks hidden scripted taps", s.seasonExit);
check(s.fullReset && same(s.fullReset.lit, [true, true]) && s.fullReset.cat === false,
  "a full game reset restores both candles without disturbing the cat baseline", s.fullReset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

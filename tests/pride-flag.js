#!/usr/bin/env node
// Pride Day office-flag interaction: ordinary taps keep the shared wave, every third
// valid Pride tap gets the emphatic flutter + shared viewport wash, and season transitions reset it.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function click(){document.getElementById("office-pride-flag-hit").dispatchEvent(new MouseEvent("click",{bubbles:true}));}',
  'function state(){var c=document.getElementById("office-pride-flag-wave"),w=document.getElementById("pride-day-wash");return {wave:c.classList.contains("waving"),celebrate:c.classList.contains("pride-celebrating"),wash:w.classList.contains("pride-washing"),flagAnimation:getComputedStyle(c).animationName,washAnimation:getComputedStyle(w).animationName};}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return false;};window.__setSeason("pride");window.__gameStarted=function(){return true;};click();await sleep(80);S("first",state());',
  ' click();await sleep(80);S("second",state());',
  ' click();await sleep(80);S("third",state());',
  ' await sleep(2150);S("settled",state());',
  ' window.__setSeason("pride");click();click();await sleep(80);window.__loftControllers.season("canada");window.__loftControllers.season("pride");await sleep(2150);click();await sleep(80);S("seasonReset",state());',
  ' click();click();await sleep(80);window.__activateExtinguisher();await sleep(1300);window.__loftControllers.season("pride");await sleep(2150);click();await sleep(80);S("fullReset",state());',
  ' window.__setSeason("canada");click();await sleep(80);S("hiddenGate",state());',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Pride office flag:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.first && s.first.wave && !s.first.celebrate && !s.first.wash && s.first.flagAnimation === "flag-wave",
  "first tap preserves the ordinary shared flag wave", s.first);
check(s.second && s.second.wave && !s.second.celebrate && !s.second.wash,
  "second tap still restarts the ordinary wave", s.second);
check(s.third && !s.third.wave && s.third.celebrate && s.third.wash &&
      s.third.flagAnimation === "office-pride-flag-celebrate" && s.third.washAnimation === "pride-day-wash",
  "third tap runs the emphatic flutter and shared viewport wash", s.third);
check(s.settled && !s.settled.celebrate && !s.settled.wash,
  "the third-tap one-shots clean themselves up", s.settled);
check(s.seasonReset && s.seasonReset.wave && !s.seasonReset.celebrate && !s.seasonReset.wash,
  "leaving and re-entering Pride resets the three-tap count", s.seasonReset);
check(s.fullReset && s.fullReset.wave && !s.fullReset.celebrate && !s.fullReset.wash,
  "a full game reset starts Pride at tap one", s.fullReset);
check(s.hiddenGate && !s.hiddenGate.wave && !s.hiddenGate.celebrate && !s.hiddenGate.wash,
  "a Pride tap cannot run after its season gate closes", s.hiddenGate);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

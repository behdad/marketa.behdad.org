#!/usr/bin/env node
// Pride Day viewport wash: cadence, attendance, stronger-effect priority, flag reuse,
// season/reset teardown, and reduced-motion presentation.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var focused=true;document.hasFocus=function(){return focused;};',
  'function q(){return window.__prideDayWashState();}',
  'function clickFlag(){document.getElementById("office-pride-flag-hit").dispatchEvent(new MouseEvent("click",{bubbles:true}));}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__gameStarted=function(){return true;};window.__loftControllers.season("pride");await sleep(80);',
  ' var wash=document.getElementById("pride-day-wash"),view=document.querySelector(".hunt-viewport"),wr=wash.getBoundingClientRect(),vr=view.getBoundingClientRect();',
  ' S("activation",{state:q(),covers:wr.left<=vr.left&&wr.right>=vr.right&&wr.top<=vr.top&&wr.bottom>=vr.bottom,parent:wash.parentNode&&wash.parentNode.className});',
  ' window.__goToStage("balcony");await sleep(10150);S("recurrence",{state:q(),room:window.__currentStageName,sameParent:wash.parentNode===view});',
  ' focused=false;window.dispatchEvent(new Event("blur"));await sleep(40);var beforeBlur=q();window.__prideDayWashTick();await sleep(40);S("blur",{before:beforeBlur,after:q()});',
  ' focused=true;window.dispatchEvent(new Event("focus"));await sleep(80);S("refocus",q());',
  ' var strip=document.getElementById("loft-game-strip"),beforeTrip=q().count;window.__tripActive=true;strip.classList.add("acid");await sleep(40);var tripStart=q();window.__prideDayWashTick();await sleep(60);S("trip",{before:beforeTrip,start:tripStart,after:q()});',
  ' strip.classList.remove("acid");window.__tripActive=false;await sleep(40);var beforeFlag=q();clickFlag();clickFlag();clickFlag();await sleep(80);S("flag",{before:beforeFlag,after:q()});',
  ' var card=document.getElementById("mol-card-ethanol"),beforeChem=q().count;card.classList.add("mol-show");await sleep(40);var chemStart=q();var triggerResult=window.__triggerPrideDayWash();await sleep(40);S("chem",{before:beforeChem,start:chemStart,result:triggerResult,after:q()});card.classList.remove("mol-show");',
  ' window.__loftControllers.season("canada");await sleep(40);var left=q();window.__prideDayWashTick();await sleep(40);S("seasonExit",{left:left,after:q()});',
  ' window.__loftControllers.season("pride");await sleep(80);window.__activateExtinguisher();await sleep(1300);S("reset",q());',
  '}',
  '})();</script>'
].join("\n");

var REDUCED = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){window.__gameStarted=function(){return true;};window.__loftControllers.season("pride");await sleep(80);var w=document.getElementById("pride-day-wash");report.steps.on={state:window.__prideDayWashState(),animation:getComputedStyle(w).animationName,opacity:getComputedStyle(w).opacity};await sleep(2150);report.steps.off=window.__prideDayWashState();window.__loftControllers.season("canada");}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Pride Day recurring wash:");
var result = lib.runPageSync("rsvp.html", HARNESS, 13500, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ lifecycle harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.activation && s.activation.state.enabled && s.activation.state.scheduled && s.activation.state.active &&
      s.activation.state.count === 1 && s.activation.covers && /hunt-viewport/.test(s.activation.parent),
  "Pride activation paints once and covers the whole viewport", s.activation);
check(s.recurrence && s.recurrence.state.count === 2 && s.recurrence.state.scheduled &&
      s.recurrence.room === "balcony" && s.recurrence.sameParent,
  "one ten-second recurrence follows the current room without reparenting", s.recurrence);
check(s.blur && !s.blur.before.scheduled && !s.blur.before.active &&
      s.blur.after.count === s.blur.before.count && !s.blur.after.scheduled,
  "blur pauses the timer and suppresses a due beat", s.blur);
check(s.refocus && s.refocus.active && s.refocus.scheduled && s.refocus.count === s.blur.after.count + 1,
  "focus resumes with one immediate wash and one timer", s.refocus);
check(s.trip && s.trip.start.blocked && !s.trip.start.active &&
      s.trip.after.count === s.trip.before && s.trip.after.scheduled,
  "a trip immediately clears the wash and suppresses its due beat", s.trip);
check(s.flag && s.flag.after.count === s.flag.before.count + 1 && s.flag.after.active && s.flag.after.scheduled,
  "the third office-flag click uses the immediate path without losing the recurrence", s.flag);
check(s.chem && s.chem.start.blocked && !s.chem.start.active && s.chem.result === false &&
      s.chem.after.count === s.chem.before,
  "a chemistry card takes priority over manual and recurring washes", s.chem);
check(s.seasonExit && !s.seasonExit.left.enabled && !s.seasonExit.left.scheduled && !s.seasonExit.left.active &&
      s.seasonExit.after.count === s.seasonExit.left.count,
  "leaving Pride destroys the timer and suppresses later ticks", s.seasonExit);
check(s.reset && !s.reset.enabled && !s.reset.scheduled && !s.reset.active,
  "full reset cancels Pride recurrence", s.reset);

var reduced = lib.runPageSync("rsvp.html", REDUCED, 2800, {
  patchRaf: true, forceReduce: true, chromeFlags: "--force-prefers-reduced-motion=reduce"
});
check(reduced && reduced.errors.length === 0, "reduced-motion probe has no page errors", reduced && reduced.errors);
check(reduced && reduced.steps.on.state.active && reduced.steps.on.animation === "none" &&
      parseFloat(reduced.steps.on.opacity) > 0 && parseFloat(reduced.steps.on.opacity) <= 0.35 &&
      !reduced.steps.off.active,
  "reduced motion keeps a subtle static wash and deterministic cleanup", reduced && reduced.steps);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

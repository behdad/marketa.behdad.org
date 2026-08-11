#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],cases:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function missing(id,args,key){var controllers=window.__loftControllers,owner=controllers[key];delete controllers[key];var described=window.loft.api.describe(id,args),performed=await window.loft.api.perform(id,args,{source:"owner-gate-test"});controllers[key]=owner;return {described:described,performed:performed};}',
  'async function run(){',
  ' report.cases.cakeBirthday=await missing("calendar.birthday.cake",{person:"marketa"},"birthday");',
  ' report.cases.cakeOwner=await missing("calendar.birthday.cake",{person:"marketa"},"cake");',
  ' var cake=window.__loftControllers.cake;window.__loftControllers.cake=function(){return "";};report.cases.cakeEmpty=await window.loft.api.perform("calendar.birthday.cake",{person:"marketa"},{source:"owner-gate-test"});window.__loftControllers.cake=cake;',
  ' report.cases.wildfire=await missing("weather.wildfires.intensity",{level:.4},"wildfires");',
  ' report.cases.aurora=await missing("sky.aurora.intensity",{kp:4},"aurora");',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
function unavailable(entry, reason) {
  var described = entry && entry.described && entry.described.value;
  var performed = entry && entry.performed;
  return described && !described.available && described.availability && described.availability.reason === reason &&
    performed && !performed.ok && performed.code === "NOT_AVAILABLE" && performed.message === reason &&
    performed.availability && performed.availability.reason === reason;
}

console.log("loft owner availability:");
var result = lib.runPageSync("loft-day.html", HARNESS, 10000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(unavailable(result.cases.cakeBirthday, "The birthday controller is not ready."), "birthday cake advertises and returns the missing birthday owner reason", result.cases.cakeBirthday);
check(unavailable(result.cases.cakeOwner, "The cake controller is not ready."), "birthday cake advertises and returns the missing cake owner reason", result.cases.cakeOwner);
check(result.cases.cakeEmpty && !result.cases.cakeEmpty.ok && result.cases.cakeEmpty.code === "FAILED" && result.cases.cakeEmpty.message === "The birthday cake controller did not complete the request.", "birthday cake rejects an empty owner result instead of reporting a semantic change", result.cases.cakeEmpty);
check(unavailable(result.cases.wildfire, "The wildfire intensity controller is not ready."), "wildfire intensity advertises and returns its missing owner reason", result.cases.wildfire);
check(unavailable(result.cases.aurora, "The aurora intensity controller is not ready."), "aurora intensity advertises and returns its missing owner reason", result.cases.aurora);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All owner-availability checks passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var order=[];',
  ' report.steps.api=typeof window.__registerTransientResetHook==="function";',
  ' window.__registerTransientResetHook("test-first",function(){order.push("first");});',
  ' window.__registerTransientResetHook("test-broken",function(){order.push("broken");throw new Error("expected reset-hook probe");});',
  ' window.__registerTransientResetHook("test-last",function(){order.push("last");});',
  ' window.__activateExtinguisher();await sleep(850);',
  ' report.steps.order=order.slice();',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html transient reset hooks:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2000, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "a throwing hook does not escape the reset", result.errors);
check(result.steps.api, "the registration API is available");
check(result.steps.order && result.steps.order.join(",") === "first,broken,last",
  "hooks run additively in registration order and continue after an exception", result.steps.order);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

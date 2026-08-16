#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function visits(){return window.__phoneMessageThread().filter(function(id){return /^visit_/.test(id);});}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__gameStarted=function(){return true;};window.__secondRound=true;window.__monitorMessageRewrite=null;if(window.__setDayNight)window.__setDayNight(false);',
  ' var first=window.__cuddlyVisitorDripTick(),second=window.__cuddlyVisitorDripTick(),blocked=window.__cuddlyVisitorDripTick();report.steps.capped={results:[first,second,blocked],visits:visits(),pending:window.__pendingCuddlyVisitorTexts()};',
  ' var opened=visits()[0];window.__openMessagesAt(opened);await sleep(50);var row=document.querySelector(".pm-msg-row[data-message-id="+opened+"]");if(row)row.click();await sleep(20);window.__closePhoneModal(true);await sleep(20);var resumed=window.__cuddlyVisitorDripTick();report.steps.resumed={opened:opened,row:!!row,result:resumed,visits:visits(),pending:window.__pendingCuddlyVisitorTexts()};',
  ' window.__resetPhoneApps();var reset=window.__cuddlyVisitorDripTick();report.steps.reset={result:reset,visits:visits(),pending:window.__pendingCuddlyVisitorTexts()};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("loft-day.html visitor message cap:");
var result = lib.runPageSync("loft-day.html", HARNESS, 4000, { patchRaf: true, seedRandom: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.capped && s.capped.results[0] && s.capped.results[1] && !s.capped.results[2] &&
  s.capped.visits.length === 2 && s.capped.pending === 2,
  "autonomous visitor texts stop when two remain unopened", s.capped);
check(s.resumed && s.resumed.row && s.resumed.result && s.resumed.visits.length === 3 && s.resumed.pending === 2,
  "opening one visitor text makes room for exactly one more", s.resumed);
check(s.reset && s.reset.result && s.reset.visits.length === 1 && s.reset.pending === 1,
  "a full phone reset starts the visitor-text allowance fresh", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

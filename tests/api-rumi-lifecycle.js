#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],cases:{}};',
  'function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function prepare(){window.__goToStage("cuddly");window.__gardenPartyOn=false;document.getElementById("stage-balcony").classList.add("dusk");document.getElementById("cuddly-rumi-fairy").classList.add("present");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' prepare();var events=[],off=window.loft.api.subscribe(function(event){events.push(event);}),version=window.loft.api.stateVersion,first=window.loft.poetry.rumi.read();await wait(100);var detail=window.loft.api.describe("poetry.rumi.read",{}),second=await window.loft.poetry.rumi.read(),versionActive=window.loft.api.stateVersion,done=await first;off();report.cases.overlap={detail:detail,second:second,first:done,versionBefore:version,versionActive:versionActive,versionAfter:window.loft.api.stateVersion,events:events,active:window.__rumiExchangeActive(),bubbles:document.querySelectorAll(".rumi-bubble").length};',
  ' prepare();var leave=window.loft.poetry.rumi.read();await wait(100);window.__goToStage("office");var left=await leave;await wait(5400);report.cases.leave={result:left,room:window.__currentStageName,active:window.__rumiExchangeActive(),bubbles:document.querySelectorAll(".rumi-bubble").length};',
  ' prepare();var party=window.loft.poetry.rumi.read();await wait(100);window.__gardenPartyOn=true;var partied=await party;await wait(5400);report.cases.party={result:partied,active:window.__rumiExchangeActive(),bubbles:document.querySelectorAll(".rumi-bubble").length};window.__gardenPartyOn=false;',
  ' prepare();var reset=window.loft.poetry.rumi.read();await wait(100);window.__resetRumiFairy();var resetResult=await reset;await wait(5400);report.cases.reset={result:resetResult,active:window.__rumiExchangeActive(),bubbles:document.querySelectorAll(".rumi-bubble").length};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}
function cancelled(entry) { return entry && !entry.ok && entry.code === "FAILED" && /cancelled/.test(entry.message); }

console.log("loft Rumi lifecycle:");
var result = lib.runPageSync("loft-day.html", HARNESS, 40000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "no uncaught page errors", result.errors);
var overlap = result.cases.overlap;
check(overlap && overlap.detail.value && !overlap.detail.value.available && overlap.detail.value.availability.reason === "A Rumi exchange is already active." && overlap.second && !overlap.second.ok && overlap.second.code === "NOT_AVAILABLE" && overlap.second.message === "A Rumi exchange is already active.", "a second reading is exactly unavailable while the first owns the exchange", overlap);
check(overlap && overlap.first && overlap.first.ok && overlap.first.value.completed && overlap.versionActive === overlap.versionBefore && overlap.events.filter(function (event) { return event.id === "poetry.rumi.read"; }).length === 1 && !overlap.active && overlap.bubbles === 0, "the owning reading alone completes after its authored reply and advances typed state once", overlap);
check(result.cases.leave && cancelled(result.cases.leave.result) && result.cases.leave.room === "office" && !result.cases.leave.active && result.cases.leave.bubbles === 0, "leaving Cuddly cancels the owning reading without a late reply", result.cases.leave);
check(result.cases.party && cancelled(result.cases.party.result) && !result.cases.party.active && result.cases.party.bubbles === 0, "starting the Party cancels the owning reading without a late reply", result.cases.party);
check(result.cases.reset && cancelled(result.cases.reset.result) && !result.cases.reset.active && result.cases.reset.bubbles === 0, "reset cancels the owning reading without a late reply", result.cases.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All Rumi lifecycle checks passed.");

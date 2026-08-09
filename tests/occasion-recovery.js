#!/usr/bin/env node
// Date-driven keepsakes restore only onto the same effective occasion day. Physical
// pass-through plate damage remains calendar-independent, including pre-crack taps.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],checks:[]};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function ok(label,value,detail){report.checks.push({label:label,ok:!!value,detail:value?"":String(detail||"")});}',
  'function click(id){var el=document.getElementById(id);if(!el)throw new Error("missing "+id);el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function eaten(meal,dish){var el=document.querySelector("#cuddly-meal-"+meal+" .dish[data-dish=\\""+dish+"\\"]");return !!(el&&el.classList.contains("eaten"));}',
  'function cracks(){return [1,2].map(function(i){return document.getElementById("cuddly-passthrough-plates-"+i+"-crack").classList.contains("cracked");});}',
  'function restore(row){window.__restoreCheckpointSystems({"occasion-keepsakes":row},"afterStage");}',
  'async function run(){',
  ' await sleep(700);',
  ' if(!window.__applySeason||!window.__captureCheckpointSystems||!window.__restoreCheckpointSystems)throw new Error("checkpoint hooks unavailable");',
  ' window.__applySeason("nowruz");await sleep(80);',
  ' click("office-hs-candle-1-hit");',
  ' click("cuddly-passthrough-plates-1");click("cuddly-passthrough-plates-1");',
  ' click("cuddly-passthrough-plates-2");click("cuddly-passthrough-plates-2");click("cuddly-passthrough-plates-2");click("cuddly-passthrough-plates-2");',
  ' var fish=document.querySelector("#cuddly-meal-nowruz .dish[data-dish=\\"fish\\"]");fish.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(330);',
  ' var nowruz=window.__captureCheckpointSystems()["occasion-keepsakes"];',
  ' ok("capture records the effective Nowruz day and compact rows",!!(nowruz&&nowruz.nowruz&&nowruz.meal&&nowruz.nowruz.day===nowruz.meal.day),JSON.stringify(nowruz));',
  ' window.__restoreNowruzCandleState(null);window.__restoreMealPlateState(null);window.__restorePassthroughPlateState(null);',
  ' restore(nowruz);',
  ' var plate=window.__passthroughPlateState(),candles=window.__nowruzCandleState();',
  ' ok("same-day restore settles candle, meal, pre-crack taps and cracked stack",candles[0]===false&&candles[1]===true&&eaten("nowruz","fish")&&plate.clicks.join(",")==="2,4"&&cracks().join(",")==="false,true",JSON.stringify({candles:candles,meal:eaten("nowruz","fish"),plate:plate,cracks:cracks()}));',
  ' click("cuddly-passthrough-plates-1");ok("restored pre-crack count advances without cracking early",window.__passthroughPlateState().clicks[0]===3&&!cracks()[0]);',
  ' click("cuddly-passthrough-plates-1");ok("the next restored tap reaches the crack threshold",window.__passthroughPlateState().clicks[0]===4&&cracks()[0]);',
  ' window.__applySeason("xmas");await sleep(80);restore(nowruz);',
  ' plate=window.__passthroughPlateState();candles=window.__nowruzCandleState();',
  ' ok("changed day rejects occasion state but retains physical plate damage",candles[0]&&candles[1]&&!eaten("xmas","bird")&&plate.clicks.join(",")==="2,4",JSON.stringify({candles:candles,xmas:eaten("xmas","bird"),plate:plate}));',
  ' window.__applySeason("sadeh");await sleep(80);click("balcony-sadeh-wood-hit");click("balcony-sadeh-wood-hit");',
  ' var sadeh=window.__captureCheckpointSystems()["occasion-keepsakes"];window.__resetSadeh();restore(sadeh);',
  ' var fed=window.__sadehFedState(),strip=document.getElementById("loft-game-strip");',
  ' ok("same-day Sadeh restore settles the bounded fed level",fed.level===2&&strip.classList.contains("sadeh-fed-1")&&strip.classList.contains("sadeh-fed-2"),JSON.stringify(fed));',
  ' ok("restore leaves no Sadeh one-shot reaction running",!document.getElementById("balcony-sadeh-glow").classList.contains("fire-flare")&&!document.querySelector(".sadeh-spark")&&!document.querySelector("#balcony-sadeh-flint-wobble.wobbling,#balcony-sadeh-wood-wobble.wobbling"));',
  ' window.__applySeason("winter");await sleep(80);restore(sadeh);fed=window.__sadehFedState();',
  ' ok("changed day rejects and clears the saved Sadeh level",fed.level===0&&!strip.classList.contains("sadeh-fed-1")&&!strip.classList.contains("sadeh-fed-2"),JSON.stringify(fed));',
  ' window.__applySeason("sadeh");await sleep(80);var day=window.__captureCheckpointSystems()["occasion-keepsakes"].sadeh.day;',
  ' restore({plates:{clicks:[-20,99]},sadeh:{day:day,level:99}});',
  ' ok("malformed finite rows are clamped to owned bounds",window.__passthroughPlateState().clicks.join(",")==="0,4"&&window.__sadehFedState().level===2,JSON.stringify({plates:window.__passthroughPlateState(),sadeh:window.__sadehFedState()}));',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},100);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("loft-day.html", HARNESS, 5000, { patchRaf: true });
var failures = 0;
function check(ok, label, detail) {
  if (ok) console.log("  ✓ " + label);
  else { failures++; console.log("  ✗ " + label + (detail ? "   [" + detail + "]" : "")); }
}

console.log("loft-day.html occasion checkpoint recovery:");
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors.join("\n"));
result.checks.forEach(function (row) { check(row.ok, row.label, row.detail); });
console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

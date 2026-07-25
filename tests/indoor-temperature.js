#!/usr/bin/env node
// Garden/party occupancy warms the mini-split reading with thermal lag.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{run();}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  'function run(){',
  ' var oldRandom=Math.random,oldWho=window.__whoIsHere,people=[];Math.random=function(){return 0.5;};window.__whoIsHere=function(room){return room==="garden"?people:[];};',
  ' var garden=document.getElementById("stage-garden"),blind=document.getElementById("garden-blind"),unit=document.getElementById("garden-minisplit");garden.classList.remove("dusk");if(blind)blind.classList.remove("raised");if(unit)unit.classList.remove("on");window.__balconyStorm=false;window.__tripActive=false;window.__setOutdoorTemp(10);window.__resetIndoorTempModel();',
  ' var base=window.__indoorTempState();people=Array.from({length:9},function(_,i){return {key:"p"+i,name:"P"+i};});',
  ' people=[];var neutralTrips={};["nitrous","shrooms","acid","froggies","dmt","ketamine","iboga"].forEach(function(name){window.__startTrip(name);window.__loftTempTick();neutralTrips[name]=window.__indoorTempState();window.__stopTrip(true);});',
  ' window.__startTrip("molly");for(var h=0;h<5;h++)window.__loftTempTick();var mollyHot=window.__indoorTempState();window.__stopTrip(true);var mollyFirstCool=window.__loftTempTick();for(var c=1;c<10;c++)window.__loftTempTick();var mollyCool=window.__indoorTempState();',
  ' people=Array.from({length:9},function(_,i){return {key:"p"+i,name:"P"+i};});',
  ' var first=window.__loftTempTick();for(var i=1;i<12;i++)window.__loftTempTick();var warm=window.__indoorTempState();',
  ' people=[];var firstCool=window.__loftTempTick();for(var j=1;j<12;j++)window.__loftTempTick();var cool=window.__indoorTempState();',
  ' people=Array.from({length:9},function(_,i){return {key:"p"+i,name:"P"+i};});for(var k=0;k<8;k++)window.__loftTempTick();var beforeReset=window.__indoorTempState();window.__resetIndoorTempModel();var reset=window.__indoorTempState();',
  ' var context=window.__chatContext("what is the temperature inside?").environment.indoor_temperature;',
  ' var lcd=document.getElementById("garden-thermo-text").textContent;',
  ' function columnAt(v){window.__setOutdoorTemp(v);var c=document.getElementById("balcony-thermo-column");return {value:v,y:+c.getAttribute("y"),height:+c.getAttribute("height")};}',
  ' var tube={cold:columnAt(-40),belowOldFloor:columnAt(-20),mild:columnAt(0),hot:columnAt(40)};',
  ' S("temperature",{base:base,neutralTrips:neutralTrips,mollyHot:mollyHot,mollyFirstCool:mollyFirstCool,mollyCool:mollyCool,first:first,warm:warm,firstCool:firstCool,cool:cool,beforeReset:beforeReset,reset:reset,context:context,lcd:lcd,tube:tube});',
  ' Math.random=oldRandom;window.__whoIsHere=oldWho;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html indoor temperature model:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var t = r.steps.temperature || {};
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(t.base && t.base.temperature_c === 22 && t.base.occupancy_gain_c === 0, "an empty room starts at the climate-model baseline", t.base);
check(t.neutralTrips && Object.keys(t.neutralTrips).length === 7 && Object.keys(t.neutralTrips).every(function(name){return t.neutralTrips[name].temperature_c === 22 && t.neutralTrips[name].molly_gain_c === 0;}),
  "every non-Molly trip is thermally neutral", t.neutralTrips);
check(t.mollyHot && t.mollyHot.temperature_c === 27 && t.mollyHot.molly_gain_c === 5,
  "Molly ramps the room exactly five degrees above baseline", t.mollyHot);
check(t.mollyFirstCool && t.mollyFirstCool.molly_gain_c === 4.5 && t.mollyCool && t.mollyCool.temperature_c === 22 && t.mollyCool.molly_gain_c === 0,
  "Molly heat dissipates gradually after the trip", { first: t.mollyFirstCool, settled: t.mollyCool });
check(t.first && t.first.occupancy_count === 9 && t.first.occupancy_gain_c === 0.3 && t.first.temperature_c === 22, "nine arrivals begin warming gradually instead of jumping the display", t.first);
check(t.warm && t.warm.occupancy_gain_c === 3 && t.warm.temperature_c === 25, "three people contribute one degree after the thermal lag settles", t.warm);
check(t.firstCool && t.firstCool.occupancy_gain_c === 2.8 && t.firstCool.temperature_c === 25 && t.cool && t.cool.occupancy_gain_c === 0 && t.cool.temperature_c === 22, "departures cool the room with the same lag", { first: t.firstCool, settled: t.cool });
check(t.beforeReset && t.beforeReset.occupancy_gain_c > 0 && t.reset && t.reset.occupancy_gain_c === 0 && t.reset.temperature_c === 22, "a full model reset clears retained body heat", { before: t.beforeReset, after: t.reset });
check(t.context && t.context.temperature_c === t.reset.temperature_c && t.context.room === "garden" && t.context.occupancy_count === 9 && !Object.prototype.hasOwnProperty.call(t.context, "people"), "chat context carries only the bounded live reading and aggregate occupancy", t.context);
check(t.lcd === t.reset.temperature_c + "°C", "the chatbot reading is exactly the visible mini-split LCD", { lcd: t.lcd, context: t.context });
check(t.tube && t.tube.cold.y === 148 && t.tube.belowOldFloor.y < t.tube.cold.y &&
  t.tube.belowOldFloor.y > t.tube.mild.y && t.tube.hot.y === 114,
  "the outdoor thermometer column uses the full -40…40°C range", t.tube);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

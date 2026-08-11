#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],rooms:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(name){document.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' document.getElementById("loft-game-strip").style.transition="none";["bathroom-room","cinema-room","bedroom-room","entrance-room","prince-basement"].forEach(function(id){var el=document.getElementById(id);if(el)el.style.transition="none";});',
  ' var day=0,next=0,trip=0;window.__toggleDayNight=function(){day++;};window.__skipCurrentMusic=function(){next++;};window.__nextTrip=function(){trip++;};',
  ' async function probe(name,stage,open,close){window.__goToStage(stage);await sleep(30);open();await sleep(40);var before=[day,next,trip];key("d");key("n");key("t");await sleep(20);report.rooms[name]={before:before,after:[day,next,trip]};close();await sleep(30);}',
  ' await probe("bathroom","kitchen",window.__openBathroomRoom,window.__closeBathroomRoom);',
  ' await probe("dungeon","garden",window.__openGardenPrince,window.__closeMonitorPrince);',
  ' await probe("cinema","cuddly",window.__openCinemaRoom,window.__closeCinemaRoom);',
  ' await probe("bedroom","office",window.__openBedroomRoom,window.__closeBedroomRoom);',
  ' await probe("entrance","balcony",window.__openEntranceRoom,window.__closeEntranceRoom);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},240);});',
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

console.log("rsvp.html lower-room shortcut routing:");
var result = lib.runPageSync("rsvp.html", HARNESS, 10000, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(result.errors.length === 0, "no uncaught page errors", result.errors);
["bathroom", "dungeon", "cinema", "bedroom", "entrance"].forEach(function (name) {
  var row = result.rooms && result.rooms[name];
  check(row && row.after.every(function (value, index) {
    return value === row.before[index] + 1;
  }), name + " passes D, N, and T to the shared loft shortcuts", row);
});

console.log("");
if (failures) {
  console.log(failures + " lower-room shortcut assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room shortcut assertions passed.");

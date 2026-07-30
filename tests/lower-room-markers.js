#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(id){document.getElementById(id).dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function key(name){document.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' window.goToStage("garden");click("garden-dungeon-marker");await sleep(80);report.steps.dungeon={stage:window.currentStageName,state:window.__princeState()};key("Escape");await sleep(800);',
  ' window.goToStage("office");click("office-bedroom-marker");await sleep(80);report.steps.bedroom={stage:window.currentStageName,state:window.__bedroomRoomState()};key("Escape");await sleep(800);',
  ' window.goToStage("balcony");click("balcony-entrance-marker");await sleep(80);report.steps.entrance={stage:window.currentStageName,state:window.__entranceRoomState()};',
  ' var markers=["garden-dungeon-marker","office-bedroom-marker","balcony-entrance-marker"].map(function(id){var el=document.getElementById(id);return [id,el.getAttribute("role"),el.getAttribute("tabindex"),el.getAttribute("aria-label"),el.getAttribute("title")];});report.steps.en=markers;',
  ' setLang("cs");report.steps.cs=markers.map(function(row){var el=document.getElementById(row[0]);return [el.getAttribute("aria-label"),el.getAttribute("title")];});setLang("en");',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},260);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html lower-room markers:");
var result = lib.runPageSync("rsvp.html", HARNESS, 6000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.dungeon && s.dungeon.stage === "garden" && s.dungeon.state.basement,
  "Garden dungeon door pans to the dormant dungeon", s.dungeon);
check(s.bedroom && s.bedroom.stage === "office" && s.bedroom.state.open,
  "Office Zzz marker pans to Bedroom", s.bedroom);
check(s.entrance && s.entrance.stage === "balcony" && s.entrance.state.open,
  "Balcony key and fob pan to Entrance", s.entrance);
check(s.en && s.en.every(function (row) {
  return row[1] === "button" && row[2] === "-1" && row[3] && row[4];
}), "markers are labelled controls without joining the global Tab order", s.en);
check(s.cs && s.cs.every(function (row) { return row[0] && row[0] === row[1]; }),
  "marker labels and tooltips switch to Czech", s.cs);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/id="garden-dungeon-marker"[\s\S]*?<g id="garden-jacket"/.test(source),
  "the tiny dungeon door remains behind the Garden coat rack");
check(/id="office-bedroom-marker"[\s\S]*?<text[^>]*>Z<\/text>[\s\S]*?<text[^>]*>z…<\/text>/.test(source),
  "the Office marker is the rising Zzz wall motif");
check(/id="balcony-entrance-marker"[\s\S]*?<circle[^>]+fill="#d9a6a6"/.test(source),
  "the Balcony marker keeps the key-and-fob drawing");

console.log("");
if (failures) {
  console.log(failures + " lower-room-marker assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room-marker assertions passed.");

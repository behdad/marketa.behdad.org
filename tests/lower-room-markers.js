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
  'function dblclick(id){document.getElementById(id).dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));}',
  'function touchup(id){document.getElementById(id).dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"touch"}));}',
  'var cases=[',
  ' ["kitchen","kitchen-bathroom-marker",function(){return window.__bathroomRoomState().open;},function(){window.__closeBathroomRoom();}],',
  ' ["garden","garden-dungeon-marker",function(){return window.__princeState().basement;},function(){click("prince-basement-close");}],',
  ' ["cuddly","cuddly-cinema-ticket",function(){return window.__cinemaRoomState().open;},function(){window.__closeCinemaRoom();}],',
  ' ["office","office-bedroom-marker",function(){return window.__bedroomRoomState().open;},function(){window.__closeBedroomRoom();}],',
  ' ["balcony","balcony-entrance-marker",function(){return window.__entranceRoomState().open;},function(){window.__closeEntranceRoom();}]',
  '];',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();',
  ' for(var i=0;i<cases.length;i++){var c=cases[i];window.goToStage(c[0]);await sleep(30);click(c[1]);await sleep(30);var single=c[2]();dblclick(c[1]);await sleep(80);var mouse=c[2]();c[3]();await sleep(800);touchup(c[1]);await sleep(20);var firstTouch=c[2]();touchup(c[1]);await sleep(80);var touch=c[2]();report.steps[c[0]]={single:single,mouse:mouse,firstTouch:firstTouch,touch:touch};c[3]();await sleep(800);}',
  ' var ids=cases.map(function(c){return c[1];});var markers=ids.map(function(id){var el=document.getElementById(id);return [id,el.getAttribute("role"),el.getAttribute("tabindex"),el.getAttribute("aria-label"),el.getAttribute("title")];});report.steps.en=markers;',
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
var result = lib.runPageSync("rsvp.html", HARNESS, 14000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
[
  ["kitchen", "Kitchen WC sign pans to Bathroom"],
  ["garden", "Garden dungeon door pans to the dormant dungeon"],
  ["cuddly", "Cuddly-puddly ticket pans to Cinema"],
  ["office", "Office Zzz marker pans to Bedroom"],
  ["balcony", "Balcony key and fob pan to Entrance"]
].forEach(function (entry) {
  var step = s[entry[0]];
  check(step && !step.single && step.mouse && !step.firstTouch && step.touch,
    entry[1] + " only after double-click or double-tap", step);
});
check(s.en && s.en.every(function (row) {
  return row[1] === "button" && row[2] === "-1" && row[3] && row[4];
}), "markers are labelled controls without joining the global Tab order", s.en);
check(s.cs && s.cs.every(function (row) { return row[0] && row[0] === row[1]; }),
  "marker labels and tooltips switch to Czech", s.cs);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/id="kitchen-bathroom-marker"[\s\S]*?>WC<\/text>[\s\S]*?<g id="kitchen-pans"/.test(source),
  "the Kitchen marker is a small WC sign above the far-left pans");
check(/id="garden-dungeon-marker"[\s\S]*?<g id="garden-jacket"[\s\S]*?<rect x="3" y="136" width="31" height="62"/.test(source),
  "the tiny dungeon door remains behind a jacket-only Garden hit target");
check(/id="office-bedroom-marker"[\s\S]*?<text x="646"[^>]*>Z<\/text>[\s\S]*?<text x="664"[^>]*>z…<\/text>/.test(source),
  "the Office marker rises on the white wall right of the stained-glass window");
check(/id="balcony-entrance-marker"[\s\S]*?translate\(146 117\) scale\(0\.7\)[\s\S]*?<circle[^>]+fill="#d9a6a6"/.test(source),
  "the Balcony marker keeps the smaller raised key-and-fob drawing");

console.log("");
if (failures) {
  console.log(failures + " lower-room-marker assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room-marker assertions passed.");

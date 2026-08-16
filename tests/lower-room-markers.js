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
  'function context(id){return !document.getElementById(id).dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:320,clientY:240}));}',
  'function portalMenu(){return document.querySelector(".lower-portal-ctx");}',
  'function labels(){return window.__lowerPortalContextMenu?window.__lowerPortalContextMenu():[];}',
  'var cases=[',
  ' ["kitchen","kitchen-bathroom-marker",function(){return window.__bathroomRoomState().open;},function(){window.__closeBathroomRoom();}],',
  ' ["garden","garden-dungeon-marker",function(){return window.__princeState().basement;},function(){window.__closeMonitorPrince();}],',
  ' ["cuddly","cuddly-cinema-ticket",function(){return window.__cinemaRoomState().open;},function(){window.__closeCinemaRoom();}],',
  ' ["office","office-bedroom-marker",function(){return window.__bedroomRoomState().open;},function(){window.__closeBedroomRoom();}],',
  ' ["balcony","balcony-entrance-marker",function(){return window.__entranceRoomState().open;},function(){window.__closeEntranceRoom();}]',
  '];',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__setGardenParty(true,true);',
  ' for(var i=0;i<cases.length;i++){var c=cases[i];window.__goToStage(c[0]);await sleep(30);',
  '  click(c[1]);await sleep(700);var single=c[2](),singleCaption=document.getElementById("hunt-caption").textContent;',
  '  var prevented=context(c[1]);await sleep(30);var menu=portalMenu(),menuLabels=labels(),reset=menu&&menu.querySelector(".ctx-loft-reset"),unlock=menu&&menu.querySelector(".ctx-unlock");if(unlock)unlock.click();await sleep(80);var contextOpened=c[2]();c[3]();await sleep(800);',
  '  dblclick(c[1]);await sleep(80);var mouse=c[2]();c[3]();await sleep(800);',
  '  touchup(c[1]);await sleep(100);var firstTouch=c[2]();touchup(c[1]);await sleep(80);var touch=c[2]();',
  '  report.steps[c[0]]={single:single,singleCaption:singleCaption,prevented:prevented,menuLabels:menuLabels,resetLast:!!(menu&&reset&&menu.lastElementChild===reset&&reset.classList.contains("ctx-sep")),contextOpened:contextOpened,mouse:mouse,firstTouch:firstTouch,touch:touch};c[3]();await sleep(800);',
  ' }',
  ' var ids=cases.map(function(c){return c[1];});var markers=ids.map(function(id){var el=document.getElementById(id);return [id,el.getAttribute("tabindex"),el.classList.contains("lower-room-marker")];});report.steps.en=markers;',
  ' window.__setLang("cs");var csMenus=[];for(var j=0;j<cases.length;j++){window.__goToStage(cases[j][0]);await sleep(20);context(cases[j][1]);await sleep(20);csMenus.push(labels());window.__closeLowerPortalContextMenu();}report.steps.cs={lang:document.documentElement.lang,menus:csMenus};window.__setLang("en");',
  ' window.__goToStage("kitchen");context("kitchen-bathroom-marker");await sleep(20);document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(20);report.steps.escDismiss=!portalMenu();context("kitchen-bathroom-marker");await sleep(20);document.body.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,cancelable:true}));await sleep(20);report.steps.awayDismiss=!portalMenu();',
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
var result = lib.runPageSync("rsvp.html", HARNESS, 23000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
[
  ["kitchen", "Kitchen WC sign"],
  ["garden", "Garden dungeon door"],
  ["cuddly", "Cuddly-puddly ticket"],
  ["office", "Office Zzz marker"],
  ["balcony", "Balcony key and fob"]
].forEach(function (entry) {
  var step = s[entry[0]];
  check(step && step.single && step.singleCaption,
    entry[1] + " opens on its first click and publishes its room invitation", step);
  check(step && step.prevented && step.contextOpened &&
    JSON.stringify(step.menuLabels) === JSON.stringify(["Unlock"]) && !step.resetLast,
    entry[1] + " right-click offers the current Unlock action only", step);
  check(step && step.mouse && step.firstTouch && step.touch,
    entry[1] + " remains idempotent for repeated mouse and touch activation", step);
});
check(s.en && s.en.every(function (row) {
  return row[1] === "-1" && row[2];
}), "all five portal markers keep their explicit identity outside the Tab order", s.en);
check(s.cs && s.cs.menus.every(function (row) {
  return JSON.stringify(row) === JSON.stringify(["Odemknout"]);
}), "every portal menu switches Unlock to Czech", s.cs && s.cs.menus);
check(s.escDismiss && s.awayDismiss, "Escape and an away click dismiss the portal menu", {
  escape: s.escDismiss,
  away: s.awayDismiss
});

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/id="kitchen-bathroom-marker"[\s\S]*?<rect x="4" y="79" width="25" height="29"/.test(source),
  "the Kitchen portal remains a compact WC sign");
check(/id="garden-dungeon-marker"[\s\S]*?<g id="garden-jacket"/.test(source),
  "the tiny dungeon door remains beside the Garden jacket");
check(!/gardenSkylineHit|enterPrinceBasement/.test(source),
  "the Garden skyline no longer doubles as a dungeon entrance");
check(/id="office-bedroom-marker"[\s\S]*?<rect x="638" y="233" width="40" height="58"[\s\S]*?id="office-bedroom-zzz"[\s\S]*?M642 268H656L643 282H658/.test(source),
  "the Office marker uses crisp Zs at the foot of the white wall");
check(/id="balcony-entrance-marker"[\s\S]*?<path d="M155\.7 122\.5 H160\.3 V132/.test(source),
  "the Balcony marker keeps its raised key drawing");

console.log("");
if (failures) {
  console.log(failures + " lower-room-marker assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room-marker assertions passed.");

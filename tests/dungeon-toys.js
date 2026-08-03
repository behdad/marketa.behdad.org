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
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__releaseCat(true);window.goToStage("garden");window.__openGardenPrince();await sleep(100);',
  'report.steps.open={state:window.__princeDungeonState(),rat:document.getElementById("prince-dungeon-rat").classList.contains("scurrying"),catParent:document.getElementById("witchy-chest-cat-pos").parentNode.id,catReaction:window.__dungeonCatRatReaction()};',
  'click("prince-dungeon-torch-left");report.steps.one={state:window.__princeDungeonState(),caption:window.__captionKey(),wallPointer:getComputedStyle(document.getElementById("prince-play-wall")).pointerEvents};',
  'click("prince-dungeon-torch-right");report.steps.dark={state:window.__princeDungeonState(),caption:window.__captionKey(),wallPointer:getComputedStyle(document.getElementById("prince-play-wall")).pointerEvents};',
  'setLang("cs");report.steps.cs={caption:document.getElementById("hunt-caption").textContent.trim()};setLang("en");',
  'click("prince-dungeon-torch-left");report.steps.relit={state:window.__princeDungeonState(),caption:window.__captionKey()};',
  'var chain=document.getElementById("prince-dungeon-chain"),rect=chain.getBoundingClientRect();chain.dispatchEvent(new PointerEvent("pointerdown",{pointerId:17,clientX:rect.left+5,clientY:rect.top+5,bubbles:true,cancelable:true}));chain.dispatchEvent(new PointerEvent("pointermove",{pointerId:17,clientX:rect.left+105,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.drag=window.__princeDungeonState();chain.dispatchEvent(new PointerEvent("pointerup",{pointerId:17,clientX:rect.left+105,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.drop=window.__princeDungeonState();',
  'await sleep(2450);report.steps.later=window.__princeDungeonState();window.__closeMonitorPrince();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},260);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html dungeon toys:");
var result = lib.runPageSync("rsvp.html", HARNESS, 7600, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.open && s.open.state.dripNodes === 1 && s.open.state.dripRunning && s.open.rat &&
  s.open.catParent === "prince-cat-overlay" && s.open.catReaction,
  "one drip and one rat share the authored dungeon with its routed cat", s.open);
check(s.one && s.one.state.torchesOut === 1 && !s.one.state.dark &&
  s.one.caption === "lower_dungeon" && s.one.wallPointer !== "none",
  "either torch independently leaves the wall readable", s.one);
check(s.dark && s.dark.state.torchesOut === 2 && s.dark.state.dark &&
  s.dark.caption === "prince_dark" && s.dark.wallPointer === "none",
  "both snuffed torches materially darken and disable the play wall", s.dark);
check(s.cs && s.cs.caption === "Na zeď je příliš tma.",
  "the dark caption switches to Czech", s.cs);
check(s.relit && s.relit.state.torchesOut === 1 && !s.relit.state.dark &&
  s.relit.caption === "lower_dungeon",
  "relighting one torch restores the wall", s.relit);
check(s.drag && s.drag.chainX === 14 && s.drag.chainY === 78 && parseFloat(s.drag.gateLift) >= 60,
  "the weighted chain clamps both axes and raises the gate for its secret glimpse", s.drag);
check(s.drop && s.drop.chainX === 14 && s.drop.chainY === 78 && parseFloat(s.drop.gateLift) >= 60 &&
  s.later && s.later.chainX === 0 && s.later.chainY === 0 && parseFloat(s.later.gateLift) === 0,
  "releasing the chain drops the weight, then the gate settles after the glimpse", {drop:s.drop,later:s.later});
check(s.later && s.later.dripNodes === 1 && s.later.dripRunning,
  "the single ceiling drop replenishes without accumulating nodes", s.later);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/princeDripAnimation\.onfinish = function \(\) \{[\s\S]*?runPrinceDungeonDrip\(\)/.test(source) &&
  !/set(?:Timeout|Interval)\(runPrinceDungeonDrip/.test(source),
  "the drip is replenished only by its own animation finish");
check(/function playDungeonPlink\(\) \{\s*if \(document\.hidden \|\| !document\.hasFocus\(\)\) return;/.test(source),
  "the autonomous plink is gated while hidden or unfocused");
check(/addEventListener\(\"touchmove\"[\s\S]*?#prince-dungeon-chain[\s\S]*?passive: false/.test(source),
  "touch chain drags use a delegated non-passive pan guard");

console.log("");
if (failures) {
  console.log(failures + " dungeon-toys assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Dungeon toy assertions passed.");

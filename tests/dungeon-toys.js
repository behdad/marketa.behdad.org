#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<style>.prince-dungeon-light-pool{transition:none!important}</style>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(id){document.getElementById(id).dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__releaseCat(true);window.__goToStage("garden");window.__openGardenPrince();await sleep(100);',
  'report.steps.open={state:window.__princeDungeonState(),rat:document.getElementById("prince-dungeon-rat").classList.contains("scurrying"),catParent:document.getElementById("witchy-chest-cat-pos").parentNode.id,catReaction:window.__dungeonCatRatReaction(),wallDisabled:document.getElementById("prince-play-wall").disabled};',
  'function lights(){return ["left","right"].map(function(side){return Number(getComputedStyle(document.getElementById("prince-dungeon-light-"+side)).opacity);});}',
  'var chain=document.getElementById("prince-dungeon-chain"),rect=chain.getBoundingClientRect();chain.dispatchEvent(new PointerEvent("pointerdown",{pointerId:17,clientX:rect.left+5,clientY:rect.top+5,bubbles:true,cancelable:true}));chain.dispatchEvent(new PointerEvent("pointermove",{pointerId:17,clientX:rect.left+105,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.drag=window.__princeDungeonState();chain.dispatchEvent(new PointerEvent("pointerup",{pointerId:17,clientX:rect.left+105,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.drop=window.__princeDungeonState();',
  'await sleep(600);report.steps.earlySettled={state:window.__princeDungeonState(),caption:window.__captionKey()};click("prince-dungeon-torch-left");await sleep(360);report.steps.one={state:window.__princeDungeonState(),caption:window.__captionKey(),wallDisabled:document.getElementById("prince-play-wall").disabled,lights:lights()};',
  'click("prince-dungeon-torch-right");await sleep(360);report.steps.lit={state:window.__princeDungeonState(),caption:window.__captionKey(),wallDisabled:document.getElementById("prince-play-wall").disabled,lights:lights()};',
  'window.__setLang("cs");report.steps.cs={caption:document.getElementById("hunt-caption").textContent.trim()};window.__setLang("en");click("prince-dungeon-stone");await sleep(50);report.steps.potionFound={state:window.__princeDungeonState(),caption:window.__captionKey(),opacity:Number(getComputedStyle(document.getElementById("prince-dungeon-potion")).opacity)};click("prince-dungeon-potion");await sleep(50);var potion=document.getElementById("prince-dungeon-potion"),bubbles=potion.querySelector(".bubbles");report.steps.potionDrinking={state:window.__princeDungeonState(),caption:window.__captionKey(),drinking:potion.classList.contains("drinking"),animation:getComputedStyle(potion).animationName,bubbles:Number(getComputedStyle(bubbles).opacity)};await sleep(800);report.steps.potionDrunk={drunk:potion.classList.contains("drunk"),drinking:potion.classList.contains("drinking"),opacity:Number(getComputedStyle(potion).opacity),bubbles:Number(getComputedStyle(bubbles).opacity)};click("prince-dungeon-potion");await sleep(20);report.steps.emptyTap={tapped:potion.classList.contains("empty-tapped"),state:window.__princeDungeonState(),caption:window.__captionKey()};',
  'rect=chain.getBoundingClientRect();chain.dispatchEvent(new PointerEvent("pointerdown",{pointerId:18,clientX:rect.left+5,clientY:rect.top+5,bubbles:true,cancelable:true}));chain.dispatchEvent(new PointerEvent("pointermove",{pointerId:18,clientX:rect.left+5,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.revealDrag=window.__princeDungeonState();chain.dispatchEvent(new PointerEvent("pointerup",{pointerId:18,clientX:rect.left+5,clientY:rect.top+205,bubbles:true,cancelable:true}));report.steps.revealed={state:window.__princeDungeonState(),caption:window.__captionKey(),wallDisabled:document.getElementById("prince-play-wall").disabled};',
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
  s.open.catParent === "prince-cat-overlay" && s.open.catReaction &&
  s.open.state.torchesOut === 2 && s.open.state.dark && s.open.wallDisabled,
  "one drip and one rat share the cold sealed dungeon with its routed cat", s.open);
check(s.drag && s.drag.chainX === 14 && s.drag.chainY === 78 && parseFloat(s.drag.gateLift) >= 60 &&
  !s.drag.awakened && s.drop && !s.drop.awakened && s.earlySettled &&
  s.earlySettled.state.chainX === 0 && s.earlySettled.state.chainY === 0 &&
  s.earlySettled.caption === "lower_dungeon",
  "an early chain pull gives the temporary crowned glimpse without revealing Prince",
  { drag: s.drag, drop: s.drop, settled: s.earlySettled });
check(s.one && s.one.state.torchesOut === 1 && !s.one.state.dark &&
  s.one.caption === "prince_torch_one" && s.one.wallDisabled &&
  s.one.lights[0] > .5 && s.one.lights[1] === 0,
  "lighting the first torch leaves the sealed wall inert and points to the second", s.one);
check(s.lit && s.lit.state.torchesOut === 0 && !s.lit.state.dark && !s.lit.state.ready &&
  s.lit.caption === "prince_torches_lit" && s.lit.wallDisabled && s.lit.lights.every(function (opacity) { return opacity > .5; }),
  "both flames reveal the loose-stone clue without revealing Prince", s.lit);
check(s.cs && s.cs.caption === "Ve světle ohně je vidět uvolněný kámen v podlaze.",
  "the live loose-stone clue switches to Czech", s.cs);
check(s.potionFound && s.potionFound.state.stone && !s.potionFound.state.potion && !s.potionFound.state.ready &&
  s.potionFound.caption === "prince_potion_found" && s.potionFound.opacity > .9,
  "moving the stone exposes the green potion", s.potionFound);
check(s.potionDrinking && s.potionDrinking.state.ready && s.potionDrinking.state.potion &&
  s.potionDrinking.caption === "prince_potion_drunk" && s.potionDrinking.drinking &&
  s.potionDrinking.animation === "prince-potion-drink" && s.potionDrinking.bubbles === 0 &&
  s.potionDrunk && s.potionDrunk.drunk && !s.potionDrunk.drinking &&
  s.potionDrunk.opacity === 1 && s.potionDrunk.bubbles === 0,
  "drinking lifts and returns an emptied bottle while priming the chain",
  { drinking: s.potionDrinking, drunk: s.potionDrunk });
check(s.emptyTap && s.emptyTap.tapped && s.emptyTap.state.potion && s.emptyTap.state.ready &&
  s.emptyTap.caption === "prince_potion_drunk",
  "later clicks wobble the empty bottle without replaying the drink", s.emptyTap);
check(s.revealDrag && s.revealDrag.awakened && s.revealDrag.chainY === 78 &&
  s.revealed && s.revealed.state.awakened && !s.revealed.wallDisabled &&
  s.revealed.caption === "prince_awake" && s.later && s.later.awakened &&
  s.later.chainX === 0 && s.later.chainY === 78,
  "a ready chain drag reveals Prince permanently and leaves the weight pulled down",
  { drag: s.revealDrag, revealed: s.revealed, later: s.later });
check(s.later && s.later.dripNodes === 1 && s.later.dripRunning,
  "the single ceiling drop replenishes without accumulating nodes", s.later);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/princeDripAnimation\.onfinish = function \(\) \{[\s\S]*?runPrinceDungeonDrip\(\)/.test(source) &&
  !/set(?:Timeout|Interval)\(runPrinceDungeonDrip/.test(source),
  "the drip is replenished only by its own animation finish");
check(/function playDungeonPlink\(\) \{\s*if \(document\.hidden \|\| !document\.hasFocus\(\)\) return;/.test(source),
  "the autonomous plink is gated while hidden or unfocused");
check(/PRINCE_POTION_SOUND = "data:audio\/mpeg;base64,/.test(source) &&
  /function playDungeonPotionSound\(\)[\s\S]*?ctx\._ac\.decodeAudioData/.test(source) &&
  /action === "potion"[\s\S]*?playDungeonPotionSound\(\)/.test(source),
  "the potion action decodes PrinceJS's inline glug through the shared audio context");
check(/addEventListener\(\"touchmove\"[\s\S]*?#prince-dungeon-chain[\s\S]*?passive: false/.test(source),
  "touch chain drags use a delegated non-passive pan guard");
check(/\.prince-dungeon-prop\{[\s\S]*?-webkit-tap-highlight-color:transparent;[\s\S]*?-webkit-touch-callout:none;[\s\S]*?user-select:none;/.test(source) &&
  /\.prince-dungeon-prop:focus,\.prince-dungeon-prop:focus-visible\{outline:0\}/.test(source),
  "Dungeon props suppress focus borders, touch callouts, highlights, and selection");
check(/#prince-dungeon-drip\{[\s\S]*?left:17%;[\s\S]*?height:83%;/.test(source) &&
  /#prince-dungeon-puddle\{[\s\S]*?transform:translateY\(7px\)/.test(source),
  "the drip clears the sealed door and its puddle sits at floor level");

console.log("");
if (failures) {
  console.log(failures + " dungeon-toys assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Dungeon toy assertions passed.");

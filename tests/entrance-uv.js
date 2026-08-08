#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.goToStage("balcony");window.__setDayNight(true);await sleep(40);window.__openEntranceRoom();await sleep(50);',
  ' var strip=document.getElementById("loft-game-strip"),windows=Array.from(document.querySelectorAll("#entrance-room .entrance-prop[data-entrance-action=window]")),beforeCaption=window.__captionKey();window.__setUvMode(true);windows.forEach(click);await sleep(40);var es=window.__entranceRoomState();report.steps.uv={beforeCaption:beforeCaption,caption:window.__captionKey(),flash:window.__flashCaptionState(),windowCount:windows.length,night:es.night,lights:es.windows,reactions:es.reactions,uvLive:strip.classList.contains("uv-mode")};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
if (!result) process.exit(1);
var step = result.steps && result.steps.uv;
var ok = result.errors.length === 0 && step && step.beforeCaption === "lower_entrance_before_party" &&
  step.caption === step.beforeCaption && !step.flash &&
  step.windowCount === 5 && step.uvLive && step.lights.every(function (windowState) { return windowState.on; });
console.log(ok ? "  ✓ UV windows react without replacing the room caption" : "  ✗ UV window payoff regression", step);
if (!ok) process.exit(1);

#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function dblclick(el){el.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));}',
  'function touchup(el){el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"touch"}));}',
  'function key(name,options){var init={key:name,bubbles:true,cancelable:true};Object.assign(init,options||{});document.dispatchEvent(new KeyboardEvent("keydown",init));}',
  'function surface(cls){var el=document.createElement("div");el.className=cls;el.style.display="block";el.style.opacity="1";document.querySelector(".hunt-viewport").appendChild(el);return el;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' var room=document.getElementById("bathroom-room"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip");room.style.transition="none";strip.style.transition="none";',
  ' var roster=document.querySelector(".roster-panel"),rosterToggle=document.querySelector(".roster-toggle"),rosterBackdrop=document.querySelector(".roster-backdrop");roster.classList.add("show");rosterBackdrop.classList.add("show");rosterToggle.classList.add("avail");',
  ' var badge=surface("msg-badge show"),coach=surface("msg-badge-coach show"),thumb=surface("msg-thumb show"),call=surface("call-ring show");',
  ' key("ArrowDown");await sleep(80);',
  ' var roomBox=room.getBoundingClientRect(),viewBox=viewport.getBoundingClientRect(),kitchenBox=document.getElementById("stage-kitchen").getBoundingClientRect(),bathroomCloseStyle=getComputedStyle(document.getElementById("bathroom-room-close")),cinemaCloseStyle=getComputedStyle(document.getElementById("cinema-room-close")),princeCloseStyle=getComputedStyle(document.getElementById("prince-basement-close"));',
  ' report.steps.down={state:window.__bathroomRoomState(),room:window.currentStageName,covered:window.__roomAmbienceCovered(),viewport:viewport.classList.contains("bathroom-room-open"),geometry:{room:[roomBox.left,roomBox.top,roomBox.width,roomBox.height],viewport:[viewBox.left,viewBox.top,viewBox.width,viewBox.height],kitchenBottom:kitchenBox.bottom,controls:{bathroom:[parseFloat(bathroomCloseStyle.width),parseFloat(bathroomCloseStyle.height),parseFloat(bathroomCloseStyle.right),parseFloat(bathroomCloseStyle.top)],cinema:[parseFloat(cinemaCloseStyle.width),parseFloat(cinemaCloseStyle.height),parseFloat(cinemaCloseStyle.right),parseFloat(cinemaCloseStyle.top)],prince:[parseFloat(princeCloseStyle.width),parseFloat(princeCloseStyle.height),parseFloat(princeCloseStyle.right),parseFloat(princeCloseStyle.top)]}},roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility],messages:[getComputedStyle(badge).visibility,getComputedStyle(coach).visibility,getComputedStyle(thumb).visibility,getComputedStyle(call).visibility],images:room.querySelectorAll("img").length};',
  ' setLang("cs");report.steps.cs={room:room.getAttribute("aria-label"),close:document.getElementById("bathroom-room-close").getAttribute("aria-label")};setLang("en");',
  ' key("ArrowUp");await sleep(760);report.steps.up={state:window.__bathroomRoomState(),viewport:viewport.classList.contains("bathroom-room-open"),covered:window.__roomAmbienceCovered(),roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility],messages:[getComputedStyle(badge).visibility,getComputedStyle(coach).visibility,getComputedStyle(thumb).visibility,getComputedStyle(call).visibility]};',
  ' dblclick(document.getElementById("kitchen-pan-1"));await sleep(30);report.steps.interactive=window.__bathroomRoomState();',
  ' dblclick(document.getElementById("kitchen-wall"));await sleep(80);report.steps.mouse=window.__bathroomRoomState();key("Escape");await sleep(760);',
  ' touchup(document.getElementById("kitchen-wall"));await sleep(20);touchup(document.getElementById("kitchen-wall"));await sleep(80);report.steps.touch=window.__bathroomRoomState();key("Backspace");await sleep(760);',
  ' window.__openBathroomRoom();await sleep(60);click(document.getElementById("bathroom-room-close"));await sleep(760);report.steps.dismiss=window.__bathroomRoomState();',
  ' window.__openBathroomRoom();await sleep(60);window.goToStage("office");await sleep(80);report.steps.navigate={state:window.__bathroomRoomState(),room:window.currentStageName};window.goToStage("kitchen");',
  ' var times=[],oldStep=window.__calStepTime;window.__calStepTime=function(n){times.push(n);};key("ArrowDown",{shiftKey:true});window.__calStepTime=oldStep;report.steps.shift={times:times,state:window.__bathroomRoomState()};',
  ' window.__secondRound=true;window.__openBathroomRoom();await sleep(80);window.__deliverPhoneMessage("cue_mail");await sleep(80);report.steps.messageHold={held:window.__messageNotificationsHeld(),thread:window.__phoneMessageThread()};key("ArrowUp");await sleep(1300);report.steps.messageRelease={held:window.__messageNotificationsHeld(),thread:window.__phoneMessageThread()};',
  ' window.__openBathroomRoom();await sleep(80);key("ArrowRight");await sleep(760);report.steps.right={state:window.__bathroomRoomState(),room:window.currentStageName,focus:document.activeElement.classList.contains("hunt-viewport")};',
  ' window.goToStage("kitchen");window.__openBathroomRoom();await sleep(80);var dot=document.querySelectorAll(".hunt-dot")[4];dot.focus();click(dot);await sleep(760);report.steps.dot={state:window.__bathroomRoomState(),room:window.currentStageName,focus:document.activeElement===dot};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html bathroom room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.down && s.down.state.open && !s.down.state.hidden && s.down.room === "kitchen" &&
  s.down.covered && s.down.viewport,
  "plain Down opens the bathroom beneath Kitchen / Bar and covers upstairs ambience", s.down);
check(s.down && s.down.geometry &&
  s.down.geometry.room.every(function (value, index) { return Math.abs(value - s.down.geometry.viewport[index]) < 0.7; }) &&
  s.down.geometry.kitchenBottom <= s.down.geometry.viewport[1] + s.down.geometry.viewport[3] * 0.05,
  "entry completes the downward pan while preserving Kitchen / Bar above", s.down && s.down.geometry);
check(s.down && s.down.geometry && s.down.geometry.controls &&
  s.down.geometry.controls.bathroom.every(function (value, index) {
    return Math.abs(value - s.down.geometry.controls.cinema[index]) < 0.7 &&
      Math.abs(value - s.down.geometry.controls.prince[index]) < 0.7;
  }) &&
  s.down.geometry.controls.bathroom[2] <= 8.5 && s.down.geometry.controls.bathroom[3] <= 8.5,
  "all lower rooms share one tightly tucked close-control geometry",
  s.down && s.down.geometry && s.down.geometry.controls);
check(s.down && s.down.roster.every(function (value) { return value === "hidden"; }),
  "Who's here controls and panel hide while the bathroom owns the viewport", s.down && s.down.roster);
check(s.down && s.down.messages.every(function (value) { return value === "hidden"; }),
  "message badges, previews, and call cards hide below the loft", s.down && s.down.messages);
check(s.down && s.down.images === 0,
  "the bathroom is entirely code-native and embeds no photo", s.down);
check(s.cs && s.cs.room === "Koupelna / toalety" && s.cs.close === "Zpět do Kuchyně / baru",
  "room and return labels switch to Czech", s.cs);
check(s.up && !s.up.state.open && s.up.state.hidden && !s.up.viewport && !s.up.covered &&
  s.up.roster.every(function (value) { return value === "visible"; }) &&
  s.up.messages.every(function (value) { return value === "visible"; }),
  "plain Up returns upstairs and restores suppressed UI", s.up);
check(s.interactive && !s.interactive.open && s.mouse && s.mouse.open && s.touch && s.touch.open,
  "only the true bare kitchen background accepts mouse or touch double activation",
  { interactive: s.interactive, mouse: s.mouse, touch: s.touch });
check(s.dismiss && !s.dismiss.open && s.dismiss.hidden,
  "the visible dismiss control closes and settles the room", s.dismiss);
check(s.navigate && !s.navigate.state.open && s.navigate.room === "office",
  "ordinary room navigation closes the bathroom", s.navigate);
check(s.shift && s.shift.times.join(",") === "-1" && !s.shift.state.open,
  "Shift+Down keeps its calendar-step meaning instead of entering", s.shift);
check(s.messageHold && s.messageHold.held.messages.indexOf("cue_mail") !== -1 &&
  s.messageHold.thread.indexOf("cue_mail") !== -1 &&
  s.messageRelease && !s.messageRelease.held.messages.length,
  "an arriving message enters its thread but waits to surface until the upward return",
  { held: s.messageHold, released: s.messageRelease });
check(s.right && !s.right.state.open && s.right.state.hidden && s.right.room === "garden" && s.right.focus,
  "Right exits to the adjacent main-floor room and restores viewport focus", s.right);
check(s.dot && !s.dot.state.open && s.dot.state.hidden && s.dot.room === "balcony" && s.dot.focus,
  "a room dot exits directly to its selected main-floor room and keeps dot focus", s.dot);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
["bathroom-sink", "bathroom-tub", "bathroom-shower-curtain", "bathroom-waffle-towel",
 "bathroom-stool", "bathroom-scale", "bathroom-toilet-nook"].forEach(function (id) {
  check(new RegExp('id="' + id + '"').test(source), "illustration includes " + id);
});
check(!/codex-clipboard|ZAJ6YO|zTrLmq/.test(source),
  "private reference filenames are absent from authored source");

console.log("");
if (failures) {
  console.log(failures + " bathroom-room assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Bathroom-room assertions passed.");

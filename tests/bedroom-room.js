#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function dblclick(el){el.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));}',
  'function touchup(el){el.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"touch"}));}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function key(name){document.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function propkey(el,name){el.focus();el.dispatchEvent(new KeyboardEvent("keydown",{key:name,bubbles:true,cancelable:true}));}',
  'function box(el){var r=el.getBoundingClientRect();return [r.left,r.top,r.width,r.height];}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' var room=document.getElementById("bedroom-room"),viewport=document.querySelector(".hunt-viewport"),strip=document.getElementById("loft-game-strip"),office=document.getElementById("stage-office");room.style.transition="none";viewport.style.transition="none";strip.style.transition="none";window.goToStage("office");window.__setDayNight(false);await sleep(100);',
  ' key("ArrowDown");await sleep(780);var roster=document.querySelector(".roster-panel"),rosterToggle=document.querySelector(".roster-toggle"),rosterBackdrop=document.querySelector(".roster-backdrop");roster.classList.add("show");rosterBackdrop.classList.add("show");',
  ' var badge=document.querySelector(".msg-badge"),coach=document.querySelector(".msg-badge-coach"),thumb=document.querySelector(".msg-thumb"),ring=document.querySelector(".call-ring");[badge,coach,thumb,ring].forEach(function(el){if(el)el.classList.add("show");});',
  ' var rb=box(room),vb=box(viewport),ob=box(office),bedroomCloseStyle=getComputedStyle(document.getElementById("bedroom-room-close")),cinemaCloseStyle=getComputedStyle(document.getElementById("cinema-room-close")),princeCloseStyle=getComputedStyle(document.getElementById("prince-basement-close"));function controlStyle(style){return [parseFloat(style.width),parseFloat(style.height),parseFloat(style.right),parseFloat(style.top)];}report.steps.open={state:window.__bedroomRoomState(),room:window.currentStageName,hidden:room.hidden,klass:viewport.classList.contains("bedroom-room-open"),geometry:{bedroom:rb,viewport:vb,officeBottom:ob[1]+ob[3],controls:{bedroom:controlStyle(bedroomCloseStyle),cinema:controlStyle(cinemaCloseStyle),prince:controlStyle(princeCloseStyle)}},roster:[getComputedStyle(rosterToggle).visibility,getComputedStyle(roster).visibility,getComputedStyle(rosterBackdrop).visibility],notices:[badge,coach,thumb,ring].map(function(el){return el&&getComputedStyle(el).visibility;})};',
  ' var wash=room.querySelector(".bedroom-night-wash"),halo=room.querySelector(".bedroom-lamp-halo");wash.style.transition="none";halo.style.transition="none";report.steps.day={state:window.__bedroomRoomState(),wash:getComputedStyle(wash).opacity,halo:getComputedStyle(halo).opacity};window.__setDayNight(true);await sleep(50);report.steps.night={state:window.__bedroomRoomState(),wash:getComputedStyle(wash).opacity,halo:getComputedStyle(halo).opacity};window.__setDayNight(false);await sleep(50);',
  ' setLang("cs");report.steps.cs={room:room.getAttribute("aria-label"),close:document.getElementById("bedroom-room-close").getAttribute("aria-label"),title:document.getElementById("bedroom-room-close").getAttribute("title"),scene:document.getElementById("bedroom-room-art").getAttribute("aria-label"),props:Array.from(room.querySelectorAll(".bedroom-prop")).map(function(el){return [el.id,el.getAttribute("aria-label"),el.getAttribute("title")];})};setLang("en");',
  ' var glass=document.getElementById("bedroom-stained-glass"),sprinkler=document.getElementById("bedroom-sprinkler"),leftLamp=document.getElementById("bedroom-left-lamp"),rightLamp=document.getElementById("bedroom-right-lamp"),gearLeft=document.getElementById("bedroom-wall-gear-left"),gearMiddle=document.getElementById("bedroom-wall-gear-middle"),gearRight=document.getElementById("bedroom-wall-gear-right"),wardrobe=document.getElementById("bedroom-wardrobe"),bed=document.getElementById("bedroom-bed"),leftTable=document.getElementById("bedroom-left-table"),rightTable=document.getElementById("bedroom-right-table");click(glass);click(leftLamp);click(rightLamp);click(gearLeft);click(gearMiddle);propkey(gearRight,"Enter");propkey(wardrobe," ");click(bed);click(leftTable);propkey(rightTable,"Enter");report.steps.props={state:window.__bedroomRoomState(),focus:document.activeElement&&document.activeElement.id};report.steps.sleep={wash:getComputedStyle(room.querySelector(".bedroom-night-wash")).opacity,linen:getComputedStyle(room.querySelector(".bedroom-linen")).animationName,zzz:getComputedStyle(room.querySelector(".bedroom-sleep-z")).animationName,saved:(window.__captureCheckpointSystems()["bedroom-lamps"]||null)};click(sprinkler);report.steps.spray=window.__bedroomRoomState();await sleep(1250);report.steps.soaked=window.__bedroomRoomState();await sleep(4100);report.steps.dry=window.__bedroomRoomState();',
  ' window.__secondRound=true;window.__deliverPhoneMessage("cue_mail");await sleep(80);badge=document.querySelector(".msg-badge");coach=document.querySelector(".msg-badge-coach");thumb=document.querySelector(".msg-thumb");report.steps.hold={held:window.__messageNotificationsHeld(),thread:window.__phoneMessageThread(),badge:badge&&badge.classList.contains("show"),coach:coach&&coach.classList.contains("show"),thumb:thumb&&thumb.classList.contains("show")};',
  ' key("ArrowUp");await sleep(1300);badge=document.querySelector(".msg-badge");thumb=document.querySelector(".msg-thumb");report.steps.return={state:window.__bedroomRoomState(),hidden:room.hidden,klass:viewport.classList.contains("bedroom-room-open"),focus:document.activeElement===viewport,held:window.__messageNotificationsHeld(),badge:badge&&badge.classList.contains("show"),thumb:thumb&&thumb.classList.contains("show")};if(window.__hideMessageThumb)window.__hideMessageThumb(true);',
  ' window.goToStage("office");dblclick(document.getElementById("office-stainedglass"));await sleep(40);report.steps.interactive=window.__bedroomRoomState();',
  ' dblclick(document.getElementById("office-wall-bg"));await sleep(100);report.steps.mouse=window.__bedroomRoomState();',
  ' touchup(document.getElementById("office-floor-bg"));await sleep(30);touchup(document.getElementById("office-floor-bg"));await sleep(100);report.steps.touch=window.__bedroomRoomState();',
  ' window.goToStage("office");key("ArrowDown");await sleep(100);key("ArrowLeft");await sleep(780);report.steps.left={room:window.currentStageName,source:window.__bedroomRoomState(),target:window.__cinemaRoomState(),hidden:room.hidden,focus:document.activeElement===viewport};',
  ' window.goToStage("office");key("ArrowDown");await sleep(100);key("ArrowRight");await sleep(780);report.steps.right={room:window.currentStageName,source:window.__bedroomRoomState(),target:window.__entranceRoomState(),hidden:room.hidden,focus:document.activeElement===viewport};',
  ' window.goToStage("office");key("ArrowDown");await sleep(100);var dot=document.querySelectorAll(".hunt-dot")[0];dot.focus();click(dot);await sleep(780);report.steps.dot={room:window.currentStageName,source:window.__bedroomRoomState(),target:window.__bathroomRoomState(),hidden:room.hidden,focus:document.activeElement===dot};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
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

console.log("rsvp.html bedroom room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 18000, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.open && s.open.state.open && !s.open.state.closing && s.open.room === "office" &&
  !s.open.hidden && s.open.klass,
  "plain Down opens Bedroom without changing the preserved Office room", s.open);
check(s.open && s.open.geometry &&
  s.open.geometry.bedroom.every(function (value, index) {
    return Math.abs(value - s.open.geometry.viewport[index]) < 0.7;
  }) &&
  s.open.geometry.officeBottom <= s.open.geometry.viewport[1] + s.open.geometry.viewport[3] * 0.05,
  "Bedroom fills the viewport after the Office pans above it", s.open && s.open.geometry);
check(s.open && s.open.geometry && s.open.geometry.controls &&
  s.open.geometry.controls.bedroom.every(function (value, index) {
    return Math.abs(value - s.open.geometry.controls.cinema[index]) < 0.7 &&
      Math.abs(value - s.open.geometry.controls.prince[index]) < 0.7;
  }) && s.open.geometry.controls.bedroom[2] <= 8.5 && s.open.geometry.controls.bedroom[3] <= 8.5,
  "Bedroom joins the shared tightly tucked lower-room close geometry",
  s.open && s.open.geometry && s.open.geometry.controls);
check(s.open && s.open.roster.every(function (value) { return value === "hidden"; }) &&
  s.open.notices.every(function (value) { return !value || value === "hidden"; }),
  "Who's here, message chrome, and the call ring stay upstairs", s.open);
check(s.day && !s.day.state.night && s.day.wash === "0" && Number(s.day.halo) < 0.4 &&
  s.night && s.night.state.night && Number(s.night.wash) > 0.2 && Number(s.night.halo) > 0.7,
  "Bedroom mirrors Office daylight and night lamp treatment", { day: s.day, night: s.night });
check(s.cs && s.cs.room === "Ložnice" && s.cs.close === "Zpět do pracovny" &&
  s.cs.title === "Zpět do pracovny" && s.cs.scene === "Interaktivní ložnice" &&
  s.cs.props && s.cs.props.length === 11 &&
  s.cs.props.every(function (entry) { return entry[1] && entry[1] === entry[2]; }),
  "Bedroom dialog and exit control switch to Czech", s.cs);
var propState = s.props && s.props.state && s.props.state.props || [];
function propHas(id, cls) {
  var found = propState.find(function (prop) { return prop.id === id; });
  return !!(found && found.state.split(/\s+/).indexOf(cls) !== -1);
}
check(s.spray && s.spray.spraying && s.spray.bedWet &&
  s.soaked && !s.soaked.spraying && s.soaked.bedWet &&
  s.dry && !s.dry.spraying && !s.dry.bedWet,
  "the sprinkler visibly sprays the bed, leaves it wet, then lets it dry",
  { spray: s.spray, soaked: s.soaked, dry: s.dry });
check(propState.length === 11 &&
  propHas("bedroom-stained-glass", "glinting") &&
  propHas("bedroom-left-lamp", "off") &&
  propHas("bedroom-right-lamp", "off") &&
  propHas("bedroom-wall-gear-left", "wiggling") &&
  propHas("bedroom-wall-gear-middle", "wiggling") &&
  propHas("bedroom-wall-gear-right", "wiggling") &&
  propHas("bedroom-wardrobe", "tidied") &&
  propHas("bedroom-bed", "made") &&
  propHas("bedroom-left-table", "open") &&
  propHas("bedroom-right-table", "open") &&
  s.props.focus !== "bedroom-right-table",
  "every Bedroom prop responds to pointer or direct keyboard activation without taking Tab focus", s.props);
check(s.props && s.props.state && s.props.state.sleeping &&
  parseFloat(s.sleep && s.sleep.wash) >= .6 &&
  s.sleep && s.sleep.linen === "bedroom-linen-breathe" &&
  s.sleep.zzz === "bedroom-zzz-rise" &&
  s.sleep.saved && s.sleep.saved.leftOff && s.sleep.saved.rightOff,
  "turning off both mushroom lamps darkens the room, raises Z marks, and enters the checkpoint",
  { state: s.props && s.props.state, sleep: s.sleep });
check(s.hold && s.hold.held.messages.indexOf("cue_mail") !== -1 &&
  s.hold.thread.indexOf("cue_mail") !== -1 && !s.hold.badge && !s.hold.coach && !s.hold.thumb &&
  s.return && !s.return.held.messages.length && s.return.badge && s.return.thumb,
  "incoming messages collect downstairs and surface after the return pan", { hold: s.hold, returned: s.return });
check(s.return && !s.return.state.open && !s.return.state.closing && s.return.hidden &&
  !s.return.klass && s.return.focus && s.return.state.sleeping &&
  s.return.state.props.every(function (prop) {
    var persistentLamp = /bedroom-(?:left|right)-lamp/.test(prop.id) && /\boff\b/.test(prop.state);
    return persistentLamp || !/\b(?:glinting|off|wiggling|tidied|made|open)\b/.test(prop.state);
  }),
  "Up clears transient props but preserves both lamp switches and their sleep state", s.return);
check(s.interactive && !s.interactive.open && s.mouse && !s.mouse.open && s.touch && !s.touch.open,
  "Office props and bare backgrounds no longer open Bedroom",
  { interactive: s.interactive, mouse: s.mouse, touch: s.touch });
check(s.left && s.left.room === "cuddly" && !s.left.source.open && s.left.hidden &&
  s.left.target.open && s.left.focus &&
  s.right && s.right.room === "balcony" && !s.right.source.open && s.right.hidden &&
  s.right.target.open && s.right.focus,
  "Bedroom Left/Right pan to adjacent lower rooms with viewport focus",
  { left: s.left, right: s.right });
check(s.dot && s.dot.room === "kitchen" && !s.dot.source.open && s.dot.hidden &&
  s.dot.target.open && s.dot.focus,
  "a room dot pans from Bedroom to Bathroom and retains dot focus", s.dot);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
["bedroom-room", "bedroom-bed", "bedroom-wall-gear", "bedroom-wall-gear-left", "bedroom-wall-gear-middle", "bedroom-wall-gear-right", "bedroom-stained-glass", "bedroom-wardrobe"].forEach(function (id) {
  check(new RegExp('id="' + id + '"').test(source), "Bedroom art keeps #" + id + " as a native SVG group");
});
check((source.match(/class="bedroom-prop[^"]*"[^>]* role="button"/g) || []).length === 11 &&
  !/class="bedroom-prop[^"]*"[^>]* role="button"[^>]* tabindex="0"/.test(source),
  "all eleven distinct Bedroom prop groups stay outside the Tab order");
check(!/id="bedroom-(?:left|right)-lamp"[^>]*tabindex=/.test(source),
  "the two bedside lamps do not add tab stops");
check(!/#bedroom-room\s+\.bedroom-prop:hover\s*\{[^}]*opacity/.test(source),
  "Bedroom props stay fully opaque on hover");
check((source.match(/class="bedroom-lamp-pedestal"/g) || []).length === 2 &&
  (source.match(/class="bedroom-lamp-shade"/g) || []).length === 2 &&
  (source.match(/class="bedroom-lamp-fixture" transform="translate\([^"]+\) scale\(\.8\)"/g) || []).length === 2 &&
  (source.match(/class="bedroom-lamp-hit"/g) || []).length === 2 &&
  source.indexOf('id="bedroom-side-tables"') < source.indexOf('id="bedroom-lamps"'),
  "matching brass mushroom lamps scale to eighty percent over the painted bedside tables");
check(!/<image[^>]+bedroom/i.test(source),
  "Bedroom remains code-native rather than embedding a raster room image");
check(/id="bedroom-brick" width="60" height="32"[\s\S]*?M0 1H60M0 16H60M0 31H60/.test(source),
  "Bedroom uses a native running-bond loft brick pattern");

console.log("");
if (failures) {
  console.log(failures + " bedroom-room assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Bedroom-room assertions passed.");

#!/usr/bin/env node
// Date/time join the existing room-navigation row without moving it. The
// console pull-tab + FPS meter sit in the top chrome at their old scene-left x.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function ymd(){var d=window.__now();return [d.getFullYear(),d.getMonth()+1,d.getDate()].join("-");}',
  'function geom(el){var r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,cy:r.top+r.height/2};}',
  'function inspect(nav,time,row,vp,dots){var s=getComputedStyle(nav),r=geom(nav),t=geom(time),v=geom(vp),d=geom(dots);return {display:s.display,visibility:s.visibility,rowVisible:row.classList.contains("date-time-visible"),parent:nav.parentNode&&nav.parentNode.id,below:r.top>=v.bottom,alignLeft:Math.abs(r.left-v.left)<1.1,alignRight:Math.abs(t.right-v.right)<1.1,sameBand:Math.abs(r.cy-d.cy)<1.1&&Math.abs(t.cy-d.cy)<1.1,dateWidth:r.width,timeWidth:t.width,viewport:v.width};}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.__setSecondRound(true,{releaseHeld:false});window.goToStage("balcony");await sleep(30);var bottom=document.getElementById("hunt-bottom-nav"),dots=document.getElementById("hunt-dots"),baseline={bottom:geom(bottom),dots:geom(dots)};window.__applySeason("winter");await sleep(30);var shown={bottom:geom(bottom),dots:geom(dots)};window.__openEntranceRoom();await sleep(90);',
  ' var nav=document.querySelector(".loft-datenav"),time=document.getElementById("loft-timenav"),row=document.getElementById("loft-datetime-row"),vp=document.querySelector(".hunt-viewport");report.steps.exterior=inspect(nav,time,row,vp,dots);report.steps.navStable={top:Math.abs(baseline.bottom.top-shown.bottom.top),height:Math.abs(baseline.bottom.height-shown.bottom.height),dotsTop:Math.abs(baseline.dots.top-shown.dots.top),dotsHeight:Math.abs(baseline.dots.height-shown.dots.height)};',
  ' var before=ymd();document.getElementById("loft-datenextday").click();await sleep(30);report.steps.step={before:before,after:ymd(),date:new URL(location.href).searchParams.get("date")};',
  ' document.getElementById("loft-datepill").click();await sleep(60);report.steps.calendar={open:!!document.querySelector(".phone-backdrop.show"),phone:!!document.querySelector(".calx-phone"),entrance:!!window.__entranceRoomOpen};if(window.__closePhoneModal)window.__closePhoneModal(true);await sleep(450);',
  ' window.__openEntrancePorscheDriveHud();await sleep(30);var nr=nav.getBoundingClientRect(),vr=vp.getBoundingClientRect();report.steps.driving={display:getComputedStyle(nav).display,hud:document.getElementById("entrance-room").classList.contains("drive-hud-visible"),below:nr.top>=vr.bottom};',
  ' vp.dispatchEvent(new KeyboardEvent("keydown",{key:"`",code:"Backquote",bubbles:true,cancelable:true}));await sleep(60);var tab=document.getElementById("loft-console-hint"),fps=document.getElementById("dropterm-fps"),tools=document.getElementById("loft-console-tools"),tr=geom(tab),fr=geom(fps),tg=geom(tools),fg=geom(document.querySelector(".hunt-frame"));report.steps.tools={keyboardOpen:!!window.__dropTermOpen(),tabOpen:tab.classList.contains("open"),toolsParent:tools.parentNode&&(tools.parentNode.id||tools.parentNode.className),tabParent:tab.parentNode&&tab.parentNode.id,fpsParent:fps.parentNode&&fps.parentNode.id,tabNorth:tr.bottom<=vr.top+1,fpsNorth:fr.bottom<=vr.top+1,tabX:Math.abs(tr.left-vr.left-3),fpsX:Math.abs(fr.left-vr.left-30),frameLeft:fg.left,viewportLeft:vr.left,toolsLeft:tg.left,tabLeft:tr.left,tabInScene:vp.contains(tab),fpsInScene:vp.contains(fps),tabDisplay:getComputedStyle(tab).display,fpsDisplay:getComputedStyle(fps).display};',
  ' tab.click();await sleep(30);report.steps.consoleClosed=!window.__dropTermOpen();tab.click();await sleep(30);report.steps.consoleReopened=!!window.__dropTermOpen()&&tab.classList.contains("open");tab.click();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

function run(label, chromeFlags) {
  console.log("  " + label + ":");
  var r = lib.runPageSync("rsvp.html", HARNESS, 2200, { patchRaf: true, chromeFlags: chromeFlags });
  if (!r) { check(false, "harness produced a report"); return; }
  var s = r.steps;
  check(r.errors.length === 0, "no uncaught page errors", r.errors);
  check(s.exterior && s.exterior.display !== "none" && s.exterior.visibility !== "hidden" &&
    s.exterior.rowVisible && s.exterior.parent === "loft-datetime-row" && s.exterior.below &&
    s.exterior.sameBand && s.exterior.alignLeft && s.exterior.alignRight,
    "date and time share the room-navigation band at the Entrance scene edges", s.exterior);
  check(s.navStable && s.navStable.top < .5 && s.navStable.height < .5 &&
    s.navStable.dotsTop < .5 && s.navStable.dotsHeight < .5,
    "revealing date/time does not move or resize the existing room navigation", s.navStable);
  check(s.step && s.step.before !== s.step.after && s.step.date,
    "the shared next-day control changes the canonical effective date downstairs", s.step);
  check(s.calendar && s.calendar.open && s.calendar.phone && s.calendar.entrance,
    "the shared date pill opens Calendar without leaving Entrance", s.calendar);
  check(s.driving && s.driving.hud && s.driving.display !== "none" && s.driving.below,
    "the date controls remain in chrome outside the active driving surface", s.driving);
  check(s.tools && s.tools.keyboardOpen && s.tools.tabOpen &&
    s.tools.tabParent === "loft-console-tools" && s.tools.fpsParent === "loft-console-tools" &&
    s.tools.tabNorth && s.tools.fpsNorth && s.tools.tabX < 1.1 && s.tools.fpsX < 1.1 &&
    !s.tools.tabInScene && !s.tools.fpsInScene && s.tools.tabDisplay !== "none" && s.tools.fpsDisplay !== "none",
    "real backtick discovery shows console + FPS in top chrome at their old left alignment", s.tools);
  check(s.consoleClosed && s.consoleReopened,
    "the relocated pull-tab remains available to close and reopen the drop-down", { closed: s.consoleClosed, reopened: s.consoleReopened });
}

console.log("rsvp.html Entrance date controls:");
run("desktop", "--window-size=1100,900");
run("mobile landscape", "--window-size=844,390");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All Entrance date-control checks passed.");

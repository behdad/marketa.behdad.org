#!/usr/bin/env node
// The canonical date/time navigator stays in the outer game chrome, aligned
// below the scene and usable from the Entrance without touching driving space.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function ymd(){var d=window.__now();return [d.getFullYear(),d.getMonth()+1,d.getDate()].join("-");}',
  'function inspect(nav,time,row,vp){var s=getComputedStyle(nav),r=nav.getBoundingClientRect(),t=time.getBoundingClientRect(),v=vp.getBoundingClientRect();return {display:s.display,visibility:s.visibility,rowVisible:row.classList.contains("date-time-visible"),parent:nav.parentNode&&nav.parentNode.id,below:r.top>=v.bottom,alignLeft:Math.abs(r.left-v.left)<1.1,alignRight:Math.abs(t.right-v.right)<1.1,separate:r.top>=v.bottom&&t.top>=v.bottom,dateWidth:r.width,timeWidth:t.width,viewport:v.width};}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' window.__setSecondRound(true,{releaseHeld:false});window.goToStage("balcony");window.__applySeason("winter");window.__openEntranceRoom();await sleep(90);',
  ' var nav=document.querySelector(".loft-datenav"),time=document.getElementById("loft-timenav"),row=document.getElementById("loft-datetime-row"),vp=document.querySelector(".hunt-viewport");report.steps.exterior=inspect(nav,time,row,vp);',
  ' var before=ymd();document.getElementById("loft-datenextday").click();await sleep(30);report.steps.step={before:before,after:ymd(),date:new URL(location.href).searchParams.get("date")};',
  ' document.getElementById("loft-datepill").click();await sleep(60);report.steps.calendar={open:!!document.querySelector(".phone-backdrop.show"),phone:!!document.querySelector(".calx-phone"),entrance:!!window.__entranceRoomOpen};if(window.__closePhoneModal)window.__closePhoneModal(true);',
  ' window.__openEntrancePorscheDriveHud();await sleep(30);var nr=nav.getBoundingClientRect(),vr=vp.getBoundingClientRect();report.steps.driving={display:getComputedStyle(nav).display,hud:document.getElementById("entrance-room").classList.contains("drive-hud-visible"),below:nr.top>=vr.bottom};',
  ' window.__revealConsoleTab();await sleep(30);var tab=document.getElementById("loft-console-hint"),fps=document.getElementById("dropterm-fps"),tools=document.getElementById("loft-console-tools"),tr=tab.getBoundingClientRect(),fr=fps.getBoundingClientRect();report.steps.tools={row:row.classList.contains("console-tools-visible"),tabParent:tab.parentNode&&tab.parentNode.id,fpsParent:fps.parentNode&&fps.parentNode.id,tabBelow:tr.top>=vr.bottom,fpsBelow:fr.top>=vr.bottom,tabInScene:vp.contains(tab),fpsInScene:vp.contains(fps),tabDisplay:getComputedStyle(tab).display,fpsDisplay:getComputedStyle(fps).display};',
  ' tab.click();await sleep(30);report.steps.consoleOpen=!!window.__dropTermOpen();tab.click();await sleep(30);report.steps.consoleClosed=!window.__dropTermOpen();',
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
    s.exterior.separate && s.exterior.alignLeft && s.exterior.alignRight,
    "date and time controls align beneath the Entrance scene in the outer chrome", s.exterior);
  check(s.step && s.step.before !== s.step.after && s.step.date,
    "the shared next-day control changes the canonical effective date downstairs", s.step);
  check(s.calendar && s.calendar.open && s.calendar.phone && s.calendar.entrance,
    "the shared date pill opens Calendar without leaving Entrance", s.calendar);
  check(s.driving && s.driving.hud && s.driving.display !== "none" && s.driving.below,
    "the date controls remain in chrome outside the active driving surface", s.driving);
  check(s.tools && s.tools.row && s.tools.tabParent === "loft-console-tools" &&
    s.tools.fpsParent === "loft-console-tools" && s.tools.tabBelow && s.tools.fpsBelow &&
    !s.tools.tabInScene && !s.tools.fpsInScene && s.tools.tabDisplay !== "none" && s.tools.fpsDisplay !== "none",
    "the discovered console pull-tab and FPS meter stay together in outer chrome", s.tools);
  check(s.consoleOpen && s.consoleClosed,
    "the relocated console pull-tab still opens and closes the shared drop-down", { open: s.consoleOpen, closed: s.consoleClosed });
}

console.log("rsvp.html Entrance date controls:");
run("desktop", "--window-size=1100,900");
run("mobile landscape", "--window-size=844,390");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All Entrance date-control checks passed.");

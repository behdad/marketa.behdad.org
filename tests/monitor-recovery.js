#!/usr/bin/env node
// Monitor recovery restores only the device shell. Legacy app activity is discarded,
// contradictory derived screen state is reconciled with PC power, and apps launched
// after Continue enter through their normal live paths.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{pc:{powered:true},monitor:{surface:"monitor",screenOn:false,foreground:"video",running:["video","mail","doom","python","linux"],zoomed:false}}};',
  'if(!sessionStorage.getItem("monitor-recovery-seeded")){sessionStorage.setItem("monitor-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}},appClasses=["show-browser","show-nowplaying","photobooth","show-video","show-family","show-chat","show-mail","show-calendar","show-clock","show-tattoo","show-mines","show-pacman","show-life","show-doom","show-code","show-console","show-python","show-linux","show-weather","show-about","show-credits"];',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),restored={tower:tower.classList.contains("on"),here:monitor.classList.contains("here"),screen:monitor.classList.contains("screen-on"),desktop:monitor.classList.contains("show-caps"),zoomed:window.__monitorZoomed()};monitor.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,button:0,pointerType:"mouse"}));monitor.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0}));',
  ' setTimeout(function(){try{var row=window.__captureCheckpointSystems().monitor,persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.monitor;',
  ' report.steps.continued={room:window.__currentStageName,tower:tower.classList.contains("on"),here:monitor.classList.contains("here"),screen:monitor.classList.contains("screen-on"),desktop:monitor.classList.contains("show-caps"),zoomed:window.__monitorZoomed(),restored:restored,running:window.__monitorRunningApps(),activity:appClasses.filter(function(c){return monitor.classList.contains(c);}),row:row,persisted:persisted};',
  ' setTimeout(function(){try{report.steps.saver={show:monitor.classList.contains("show-saver"),zoomed:window.__monitorZoomed(),state:window.__monitorSaverState()};window.__wakeMonitorSaver();var video=document.getElementById("monitor-video-el"),fakePaused=true,playCalls=0;try{Object.defineProperty(video,"paused",{configurable:true,get:function(){return fakePaused;}});}catch(_e){}video.play=function(){playCalls++;fakePaused=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){fakePaused=true;video.dispatchEvent(new Event("pause"));};var opened=window.__openMonitorApp("video");var pp=document.querySelector("#monitor-video-wrap .vid-ctrl-pp");if(pp)pp.click();setTimeout(function(){report.steps.video={opened:opened,open:monitor.classList.contains("show-video"),desktop:monitor.classList.contains("show-caps"),src:/art\\/downtown-dance\\.mp4$/.test(video.src),playCalls:playCalls,playing:window.__videoPlaying(),running:window.__monitorRunningApps().slice()};',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},40);}catch(e){window.__errs.push("idle: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},8100);',
  '}catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},330);',
  '}catch(e){window.__errs.push("restore: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},450);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html monitor checkpoint shell recovery:");
var r = lib.runPageSync("loft-day.html", HARNESS, 11200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps, continued = s.continued, video = s.video;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(continued && continued.room === "office" && continued.restored &&
  continued.restored.tower && continued.restored.here && continued.restored.screen &&
  continued.restored.desktop && !continued.restored.zoomed && continued.zoomed,
  "Continue reconciles a dark saved monitor with PC power before its first tap zooms the desktop", continued);
check(continued && continued.running.length === 0 && continued.activity.length === 0,
  "Continue discards every legacy foreground and running-app identity", continued);
check(continued && Object.keys(continued.row).sort().join(",") === "dockOrder,screenOn,surface,zoomed" &&
  Object.keys(continued.persisted).sort().join(",") === "dockOrder,screenOn,surface,zoomed" &&
  continued.row.dockOrder.join(",") === continued.persisted.dockOrder.join(","),
  "new in-memory and persisted monitor rows retain only shell state and dock order", continued);
check(s.saver && s.saver.show && s.saver.zoomed && s.saver.state.kind,
  "Continue rearms the restored monitor's idle saver without changing its zoom", s.saver);
check(video && /video/.test(video.opened || "") && video.open && video.desktop && video.src &&
  video.playCalls === 1 && video.playing && video.running.join(",") === "video",
  "Video launches fresh from the recovered desktop and its normal play control works", video);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

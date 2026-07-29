#!/usr/bin/env node
// Focused monitor Video regression: track selection, independent playheads, playback
// continuity across a switch, close/reopen retention, and Kill reset.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),video=document.getElementById("monitor-video-el"),wrap=document.getElementById("monitor-video-wrap"),downtown=wrap.querySelector("[data-video-track=downtown]"),rose=wrap.querySelector("[data-video-track=rose]");',
  ' tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__openMonitorApp("video");',
  ' var fakePaused=true,fakeEnded=false,fakeTime=0,playCalls=0,pauseCalls=0;',
  ' Object.defineProperty(video,"paused",{configurable:true,get:function(){return fakePaused;}});Object.defineProperty(video,"ended",{configurable:true,get:function(){return fakeEnded;}});Object.defineProperty(video,"currentTime",{configurable:true,get:function(){return fakeTime;},set:function(v){fakeTime=Number(v)||0;}});',
  ' video.play=function(){playCalls++;fakePaused=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){pauseCalls++;fakePaused=true;video.dispatchEvent(new Event("pause"));};',
  ' report.steps.initial={track:window.__monitorVideoTrack(),src:video.src,downtown:downtown.textContent,rose:rose.textContent,downtownPressed:downtown.getAttribute("aria-pressed"),rosePressed:rose.getAttribute("aria-pressed")};',
  ' fakeTime=12.5;video.dispatchEvent(new Event("timeupdate"));video.play();rose.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.rose={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls,downtownPressed:downtown.getAttribute("aria-pressed"),rosePressed:rose.getAttribute("aria-pressed")};',
  ' fakeTime=7.25;video.dispatchEvent(new Event("timeupdate"));downtown.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.returned={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls};',
  ' window.__closeMonitorVideo();var closedTime=fakeTime;monitor.classList.add("show-caps");window.__openMonitorApp("video");',
  ' report.steps.reopened={open:monitor.classList.contains("show-video"),track:window.__monitorVideoTrack(),time:fakeTime,closedTime:closedTime,playing:window.__videoPlaying()};',
  ' window.resetMonitorAppState("video");video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.reset={open:monitor.classList.contains("show-video"),track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,downtownPressed:downtown.getAttribute("aria-pressed"),rosePressed:rose.getAttribute("aria-pressed")};',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor Video playlist:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true, urlSuffix: "#play" });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial && s.initial.track === "downtown" && /art\/downtown-dance\.mp4$/.test(s.initial.src) &&
  s.initial.downtown === "Downtown dance" && s.initial.rose === "Mon amie la rose" &&
  s.initial.downtownPressed === "true" && s.initial.rosePressed === "false",
  "opens on Downtown dance with both exact titles and matching selected state", s.initial);
check(s.rose && s.rose.track === "rose" && /art\/monamielarose\.mp4$/.test(s.rose.src) &&
  s.rose.time > 0 && s.rose.time < 0.01 && s.rose.playing && s.rose.playCalls === 2 &&
  s.rose.pauseCalls === 1 && s.rose.downtownPressed === "false" && s.rose.rosePressed === "true",
  "switches to Mon amie la rose and continues playback from its own beginning", s.rose);
check(s.returned && s.returned.track === "downtown" && /art\/downtown-dance\.mp4$/.test(s.returned.src) &&
  s.returned.time === 12.5 && s.returned.playing && s.returned.playCalls === 3 && s.returned.pauseCalls === 2,
  "switching back restores Downtown dance's independent playhead without stopping playback", s.returned);
check(s.reopened && s.reopened.open && s.reopened.track === "downtown" &&
  s.reopened.time === 12.5 && s.reopened.closedTime === 12.5 && !s.reopened.playing,
  "normal close and reopen retain the selected film and playhead while staying paused", s.reopened);
check(s.reset && !s.reset.open && s.reset.track === "downtown" &&
  /art\/downtown-dance\.mp4$/.test(s.reset.src) && s.reset.time > 0 && s.reset.time < 0.01 &&
  s.reset.downtownPressed === "true" && s.reset.rosePressed === "false",
  "Kill/reset closes the app, selects Downtown dance, and rewinds both films", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

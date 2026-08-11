#!/usr/bin/env node
// Focused monitor Video regression: three-track selection, independent playheads, playback
// continuity across a switch, close/reopen retention, and Kill reset.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),video=document.getElementById("monitor-video-el"),wrap=document.getElementById("monitor-video-wrap"),downtown=wrap.querySelector("[data-video-track=downtown]"),rose=wrap.querySelector("[data-video-track=rose]"),butterfly=wrap.querySelector("[data-video-track=butterfly]");',
  ' tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__openMonitorApp("video");',
  ' var fakePaused=true,fakeEnded=false,fakeTime=0,playCalls=0,pauseCalls=0;',
  ' Object.defineProperty(video,"paused",{configurable:true,get:function(){return fakePaused;}});Object.defineProperty(video,"ended",{configurable:true,get:function(){return fakeEnded;}});Object.defineProperty(video,"duration",{configurable:true,get:function(){return 100;}});Object.defineProperty(video,"currentTime",{configurable:true,get:function(){return fakeTime;},set:function(v){fakeTime=Number(v)||0;}});',
  ' video.play=function(){playCalls++;fakePaused=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){pauseCalls++;fakePaused=true;video.dispatchEvent(new Event("pause"));};',
  ' var stage=wrap.querySelector(".vid-stage");wrap.classList.add("paused");var pausedHeight=stage.getBoundingClientRect().height;wrap.classList.remove("paused");var playingHeight=stage.getBoundingClientRect().height;wrap.classList.add("paused");',
  ' report.steps.initial={track:window.__monitorVideoTrack(),src:video.src,downtown:downtown.textContent,rose:rose.textContent,butterfly:butterfly.textContent,downtownActive:downtown.classList.contains("active"),roseActive:rose.classList.contains("active"),butterflyActive:butterfly.classList.contains("active"),pausedHeight:pausedHeight,playingHeight:playingHeight};',
  ' var seek=wrap.querySelector(".vid-ctrl-bar"),volume=wrap.querySelector(".vid-ctrl-vol"),sr=seek.getBoundingClientRect(),vr=volume.getBoundingClientRect();seek.setPointerCapture=function(){throw new Error("capture unavailable");};volume.setPointerCapture=function(){throw new Error("capture unavailable");};',
  ' seek.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:sr.left+1,clientY:sr.top+sr.height/2}));window.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:sr.right-1,clientY:sr.top+sr.height/2}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,clientX:sr.right-1,clientY:sr.top+sr.height/2}));',
  ' volume.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:vr.left+1,clientY:vr.top+vr.height/2}));window.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:vr.right-1,clientY:vr.top+vr.height/2}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,clientX:vr.right-1,clientY:vr.top+vr.height/2}));',
  ' report.steps.sliders={time:fakeTime,volume:window.__vidCtrlVolume(),seekWidth:sr.width,volumeWidth:vr.width};',
  ' fakeTime=12.5;video.dispatchEvent(new Event("timeupdate"));video.play();rose.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.rose={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls,downtownActive:downtown.classList.contains("active"),roseActive:rose.classList.contains("active"),butterflyActive:butterfly.classList.contains("active")};',
  ' fakeTime=7.25;video.dispatchEvent(new Event("timeupdate"));butterfly.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.butterfly={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls,downtownActive:downtown.classList.contains("active"),roseActive:rose.classList.contains("active"),butterflyActive:butterfly.classList.contains("active")};',
  ' fakeTime=3.75;video.dispatchEvent(new Event("timeupdate"));rose.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.roseReturned={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls};',
  ' downtown.click();video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.returned={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,playing:window.__videoPlaying(),playCalls:playCalls,pauseCalls:pauseCalls};',
  ' window.__closeMonitorVideo();var closedTime=fakeTime;monitor.classList.add("show-caps");window.__openMonitorApp("video");',
  ' report.steps.reopened={open:monitor.classList.contains("show-video"),track:window.__monitorVideoTrack(),time:fakeTime,closedTime:closedTime,playing:window.__videoPlaying()};',
  ' window.__resetMonitorAppState("video");video.dispatchEvent(new Event("loadedmetadata"));',
  ' report.steps.reset={open:monitor.classList.contains("show-video"),track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,downtownActive:downtown.classList.contains("active"),roseActive:rose.classList.contains("active"),butterflyActive:butterfly.classList.contains("active")};',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html monitor Video playlist:");
var r = lib.runPageSync("loft-day.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial && s.initial.track === "downtown" && /art\/downtown-dance\.mp4$/.test(s.initial.src) &&
  s.initial.downtown === "Downtown dance" && s.initial.rose === "Mon amie la rose" &&
  s.initial.butterfly === "Rainbow Butterfly" && s.initial.downtownActive &&
  !s.initial.roseActive && !s.initial.butterflyActive,
  "opens on Downtown dance with all three exact titles and matching selected state", s.initial);
check(s.initial && s.initial.pausedHeight > 0 &&
  Math.abs(s.initial.pausedHeight - s.initial.playingHeight) < 0.01,
  "opening the film selector does not shift or resize the picture", s.initial);
check(s.sliders && s.sliders.seekWidth > 0 && s.sliders.volumeWidth > 0 &&
  s.sliders.time > 80 && s.sliders.volume > 0.8,
  "mouse drags update seek and volume even when pointer capture is unavailable", s.sliders);
check(s.rose && s.rose.track === "rose" && /art\/monamielarose\.mp4$/.test(s.rose.src) &&
  s.rose.time > 0 && s.rose.time < 0.01 && s.rose.playing && s.rose.playCalls === 2 &&
  s.rose.pauseCalls === 1 && !s.rose.downtownActive && s.rose.roseActive &&
  !s.rose.butterflyActive,
  "switches to Mon amie la rose and continues playback from its own beginning", s.rose);
check(s.butterfly && s.butterfly.track === "butterfly" && /art\/rainbow-butterfly\.mp4$/.test(s.butterfly.src) &&
  s.butterfly.time > 0 && s.butterfly.time < 0.01 && s.butterfly.playing &&
  s.butterfly.playCalls === 3 && s.butterfly.pauseCalls === 2 &&
  !s.butterfly.downtownActive && !s.butterfly.roseActive &&
  s.butterfly.butterflyActive,
  "switches to Rainbow Butterfly and continues playback from its own beginning", s.butterfly);
check(s.roseReturned && s.roseReturned.track === "rose" &&
  /art\/monamielarose\.mp4$/.test(s.roseReturned.src) && s.roseReturned.time === 7.25 &&
  s.roseReturned.playing && s.roseReturned.playCalls === 4 && s.roseReturned.pauseCalls === 3,
  "switching back restores Mon amie la rose's independent playhead", s.roseReturned);
check(s.returned && s.returned.track === "downtown" && /art\/downtown-dance\.mp4$/.test(s.returned.src) &&
  s.returned.time === 12.5 && s.returned.playing && s.returned.playCalls === 5 && s.returned.pauseCalls === 4,
  "switching back restores Downtown dance's independent playhead without stopping playback", s.returned);
check(s.reopened && s.reopened.open && s.reopened.track === "downtown" &&
  s.reopened.time === 12.5 && s.reopened.closedTime === 12.5 && !s.reopened.playing,
  "normal close and reopen retain the selected film and playhead while staying paused", s.reopened);
check(s.reset && !s.reset.open && s.reset.track === "downtown" &&
  /art\/downtown-dance\.mp4$/.test(s.reset.src) && s.reset.time > 0 && s.reset.time < 0.01 &&
  s.reset.downtownActive && !s.reset.roseActive &&
  !s.reset.butterflyActive,
  "Kill/reset closes the app, selects Downtown dance, and rewinds every film", s.reset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

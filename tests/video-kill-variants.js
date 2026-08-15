#!/usr/bin/env node
// Focused monitor Video Kill regression: the chooser and each selected film own their
// SVG/caption, and teardown cannot leak one variant into the next Kill.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}},killCfg=null;',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),video=document.getElementById("monitor-video-el");',
  ' var fakePaused=true,fakeEnded=false,fakeTime=0;',
  ' Object.defineProperty(video,"paused",{configurable:true,get:function(){return fakePaused;}});Object.defineProperty(video,"ended",{configurable:true,get:function(){return fakeEnded;}});Object.defineProperty(video,"currentTime",{configurable:true,get:function(){return fakeTime;},set:function(v){fakeTime=Number(v)||0;}});',
  ' video.play=function(){fakePaused=false;fakeEnded=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){fakePaused=true;video.dispatchEvent(new Event("pause"));};',
  ' window.__runMonitorDeathFlash=function(cfg){killCfg=cfg;monitor.classList.add(cfg.screenClass);if(cfg.freeze)cfg.freeze();if(cfg.tick)cfg.tick(.08);};',
  ' function open(){tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__openMonitorApp("video");}',
  ' function finish(){monitor.classList.remove("death-video");killCfg.close();return {visual:window.__monitorVideoKillState(),track:window.__monitorVideoTrack(),open:monitor.classList.contains("show-video")};}',
  ' open();window.__killMonitorVideo();report.steps.chooserEarly={visual:window.__monitorVideoKillState(),key:killCfg.beats[0].key};killCfg.tick(.62);report.steps.chooserMid=window.__monitorVideoKillState();killCfg.tick(1);report.steps.chooserFinal=window.__monitorVideoKillState();report.steps.chooserReset=finish();',
  ' open();window.__selectMonitorVideoTrack("downtown");window.__killMonitorVideo();report.steps.downtownEarly={visual:window.__monitorVideoKillState(),key:killCfg.beats[0].key,paused:fakePaused,ended:fakeEnded};killCfg.tick(.62);report.steps.downtownMid=window.__monitorVideoKillState();report.steps.downtownReset=finish();',
  ' open();window.__selectMonitorVideoTrack("rose");fakePaused=true;fakeEnded=false;window.__killMonitorVideo();report.steps.roseEarly={visual:window.__monitorVideoKillState(),key:killCfg.beats[0].key,paused:fakePaused,ended:fakeEnded};killCfg.tick(.62);report.steps.roseMid=window.__monitorVideoKillState();report.steps.roseReset=finish();',
  ' open();window.__selectMonitorVideoTrack("butterfly");fakePaused=true;fakeEnded=true;window.__killMonitorVideo();report.steps.butterflyEarly={visual:window.__monitorVideoKillState(),key:killCfg.beats[0].key,paused:fakePaused,ended:fakeEnded};killCfg.tick(.62);report.steps.butterflyMid=window.__monitorVideoKillState();killCfg.tick(1);report.steps.butterflyFinal=window.__monitorVideoKillState();report.steps.butterflyReset=finish();',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function resetClean(step) {
  return step && !step.open && step.track === "downtown" && step.visual &&
    !step.visual.active && step.visual.track === "" && step.visual.stage === "" &&
    step.visual.dancers === 0 && step.visual.petals === 0 && step.visual.notes === 0 &&
    step.visual.drips === 0 && step.visual.frames === 0 && step.visual.flashOpacity === 0 &&
    !step.visual.behdadTransform && step.visual.paintOpacity === 1 &&
    Math.abs(step.visual.outlineOpacity - .18) < .001;
}

console.log("loft-day.html monitor Video Kill variants:");
var r = lib.runPageSync("loft-day.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.chooserEarly && s.chooserEarly.visual.track === "chooser" &&
  s.chooserEarly.visual.stage === "framing" && s.chooserEarly.key === "df_video_chooser_quip",
  "the chooser opens on Behdad framing the shot with its own caption", s.chooserEarly);
check(s.chooserMid && s.chooserMid.track === "chooser" && s.chooserMid.stage === "flash" &&
  s.chooserMid.frames === 8 && s.chooserMid.flashOpacity > .7 && /translate\(/.test(s.chooserMid.behdadTransform),
  "the camera shoots back in a flash and scatters all eight film frames", s.chooserMid);
check(s.chooserFinal && s.chooserFinal.stage === "cut" && s.chooserFinal.flashOpacity === 0,
  "the selector gag lands on its final cut", s.chooserFinal);
check(resetClean(s.chooserReset), "chooser teardown clears its camera gag state", s.chooserReset);
check(s.downtownEarly && s.downtownEarly.visual.track === "downtown" &&
  s.downtownEarly.visual.stage === "alone" && s.downtownEarly.visual.dancers === 1 &&
  s.downtownEarly.key === "df_video_quip",
  "Downtown keeps the lone-dancer opening and its original caption", s.downtownEarly);
check(s.downtownMid && s.downtownMid.track === "downtown" &&
  s.downtownMid.dancers > 6 && s.downtownMid.stage === "crowd",
  "Downtown still grows into the crowd", s.downtownMid);
check(resetClean(s.downtownReset), "Downtown teardown clears all variant state", s.downtownReset);
check(s.roseEarly && s.roseEarly.paused && !s.roseEarly.ended &&
  s.roseEarly.visual.track === "rose" && s.roseEarly.visual.stage === "performance" &&
  s.roseEarly.visual.notes === 3 && s.roseEarly.key === "df_video_rose_quip",
  "a paused Mon amie la rose selects the guitar-performance opening and rose caption", s.roseEarly);
check(s.roseMid && s.roseMid.track === "rose" && s.roseMid.stage === "petals" &&
  s.roseMid.petals > 10 && s.roseMid.notes === 0,
  "the guitar performance gives way to falling rose petals", s.roseMid);
check(resetClean(s.roseReset), "rose teardown clears petals and cannot leak into the next Kill", s.roseReset);
check(s.butterflyEarly && s.butterflyEarly.paused && s.butterflyEarly.ended &&
  s.butterflyEarly.visual.track === "butterfly" && s.butterflyEarly.visual.stage === "painted" &&
  s.butterflyEarly.key === "df_video_butterfly_quip",
  "an ended Rainbow Butterfly still selects its painted-curtain opening and caption", s.butterflyEarly);
check(s.butterflyMid && s.butterflyMid.track === "butterfly" &&
  s.butterflyMid.stage === "dripping" && s.butterflyMid.drips === 5 &&
  s.butterflyMid.paintOpacity < .6 && s.butterflyMid.outlineOpacity > .6,
  "the painted colours drip and fade as the outline emerges", s.butterflyMid);
check(s.butterflyFinal && s.butterflyFinal.stage === "outline" &&
  s.butterflyFinal.drips === 0 && s.butterflyFinal.paintOpacity === 0 &&
  s.butterflyFinal.outlineOpacity === 1,
  "Rainbow Butterfly finishes on the bare butterfly outline", s.butterflyFinal);
check(resetClean(s.butterflyReset), "butterfly teardown restores neutral visuals and playlist default", s.butterflyReset);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

#!/usr/bin/env node
// Focused monitor Video regression: card chooser → player navigation, corner controls,
// whole-chrome auto-hide, independent playheads, close/reopen retention, media
// arbitration, and Kill reset.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`
<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
  var report={errors:[],steps:{}};
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  function activate(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}
  function controlState(el){var s=getComputedStyle(el),r=el.getBoundingClientRect();return{opacity:Number(s.opacity),pointer:s.pointerEvents,left:r.left,right:r.right,path:el.querySelector("path").getAttribute("d")};}
  addEventListener("load",function(){setTimeout(async function(){try{
    var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),video=document.getElementById("monitor-video-el"),wrap=document.getElementById("monitor-video-wrap"),root=document.getElementById("monitor-video"),stage=wrap.querySelector(".vid-stage"),chooser=wrap.querySelector(".vid-chooser"),downtown=wrap.querySelector("[data-video-track=downtown]"),rose=wrap.querySelector("[data-video-track=rose]"),butterfly=wrap.querySelector("[data-video-track=butterfly]"),back=document.getElementById("monitor-video-back"),fullscreen=document.getElementById("monitor-video-fullscreen"),close=document.getElementById("monitor-video-close");
    tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__openMonitorApp("video");
    var fakePaused=true,fakeEnded=false,fakeTime=0,playCalls=0,pauseCalls=0,fullscreenRequested=false;
    Object.defineProperty(video,"paused",{configurable:true,get:function(){return fakePaused;}});Object.defineProperty(video,"ended",{configurable:true,get:function(){return fakeEnded;}});Object.defineProperty(video,"duration",{configurable:true,get:function(){return 100;}});Object.defineProperty(video,"currentTime",{configurable:true,get:function(){return fakeTime;},set:function(v){fakeTime=Number(v)||0;}});
    video.play=function(){playCalls++;fakePaused=false;video.dispatchEvent(new Event("play"));return Promise.resolve();};video.pause=function(){pauseCalls++;fakePaused=true;video.dispatchEvent(new Event("pause"));};
    stage.requestFullscreen=function(){fullscreenRequested=true;return Promise.resolve();};
    var chooserTitle=wrap.querySelector(".vid-chooser-title").textContent;window.__setLang("cs");var chooserTitleCs=wrap.querySelector(".vid-chooser-title").textContent;window.__setLang("en");
    report.steps.initial={view:wrap.getAttribute("data-video-view"),rootView:root.getAttribute("data-video-view"),src:video.getAttribute("src")||"",title:chooserTitle,titleCs:chooserTitleCs,chooser:getComputedStyle(chooser).display,stage:getComputedStyle(stage).display,titles:[downtown,rose,butterfly].map(function(card){return card.querySelector(".vid-choice-label").textContent;}),art:[downtown,rose,butterfly].map(function(card){var svg=card.querySelector("svg.vid-choice-art");return{svg:!!svg,viewBox:svg&&svg.getAttribute("viewBox"),marks:svg&&svg.querySelectorAll("path,circle,rect,ellipse").length};}),active:[downtown.classList.contains("active"),rose.classList.contains("active"),butterfly.classList.contains("active")],back:controlState(back),fullscreen:controlState(fullscreen),close:controlState(close)};
    downtown.click();video.dispatchEvent(new Event("loadedmetadata"));await sleep(30);
    var bs=controlState(back),fs=controlState(fullscreen),xs=controlState(close),stageRect=stage.getBoundingClientRect();
    report.steps.player={view:wrap.getAttribute("data-video-view"),rootView:root.getAttribute("data-video-view"),src:video.src,chooser:getComputedStyle(chooser).display,stage:getComputedStyle(stage).display,stageSize:[stageRect.width,stageRect.height],controls:{back:bs,fullscreen:fs,close:xs},ordered:bs.left<fs.left&&fs.left<xs.left,distinct:bs.path!==fs.path&&fs.path!==xs.path};
    fullscreen.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);report.steps.fullscreen={requested:fullscreenRequested};
    video.play();await sleep(2700);
    report.steps.idle={wrap:wrap.classList.contains("ctrl-idle"),root:root.classList.contains("video-controls-idle"),strip:getComputedStyle(wrap.querySelector(".vid-ctrl")).pointerEvents,back:controlState(back).pointer,fullscreen:controlState(fullscreen).pointer,close:controlState(close).pointer};
    wrap.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,pointerType:"mouse"}));
    report.steps.wake={wrap:wrap.classList.contains("ctrl-idle"),root:root.classList.contains("video-controls-idle"),strip:getComputedStyle(wrap.querySelector(".vid-ctrl")).pointerEvents,back:controlState(back).pointer,fullscreen:controlState(fullscreen).pointer,close:controlState(close).pointer};
    wrap.classList.remove("absent");var seek=wrap.querySelector(".vid-ctrl-bar"),volume=wrap.querySelector(".vid-ctrl-vol"),sr=seek.getBoundingClientRect(),vr=volume.getBoundingClientRect();seek.setPointerCapture=function(){throw new Error("capture unavailable");};volume.setPointerCapture=function(){throw new Error("capture unavailable");};
    seek.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:sr.left+1,clientY:sr.top+sr.height/2}));window.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:sr.right-1,clientY:sr.top+sr.height/2}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:801,pointerType:"mouse",isPrimary:true,button:0,clientX:sr.right-1,clientY:sr.top+sr.height/2}));
    volume.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:vr.left+1,clientY:vr.top+vr.height/2}));window.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,buttons:1,clientX:vr.right-1,clientY:vr.top+vr.height/2}));window.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:802,pointerType:"mouse",isPrimary:true,button:0,clientX:vr.right-1,clientY:vr.top+vr.height/2}));
    report.steps.sliders={time:fakeTime,volume:window.__vidCtrlVolume(),seekWidth:sr.width,volumeWidth:vr.width};
    fakeTime=12.5;video.dispatchEvent(new Event("timeupdate"));back.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
    report.steps.back={open:monitor.classList.contains("show-video"),view:wrap.getAttribute("data-video-view"),paused:fakePaused,src:video.src};
    rose.click();video.dispatchEvent(new Event("loadedmetadata"));report.steps.rose={view:wrap.getAttribute("data-video-view"),track:window.__monitorVideoTrack(),src:video.src,time:fakeTime};video.play();fakeTime=7.25;video.dispatchEvent(new Event("timeupdate"));activate(back);
    butterfly.click();video.dispatchEvent(new Event("loadedmetadata"));report.steps.butterfly={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime};activate(back);
    rose.click();video.dispatchEvent(new Event("loadedmetadata"));report.steps.roseReturned={track:window.__monitorVideoTrack(),src:video.src,time:fakeTime};
    activate(close);monitor.classList.add("show-caps");window.__openMonitorApp("video");report.steps.reopened={open:monitor.classList.contains("show-video"),view:wrap.getAttribute("data-video-view"),track:window.__monitorVideoTrack(),active:rose.classList.contains("active")};
    rose.click();video.dispatchEvent(new Event("loadedmetadata"));window.__closeTopMonitorApp(true);var escapedBack={open:monitor.classList.contains("show-video"),view:wrap.getAttribute("data-video-view")};window.__closeTopMonitorApp(true);report.steps.escape={back:escapedBack,closed:!monitor.classList.contains("show-video")};
    monitor.classList.add("show-caps");window.__openMonitorApp("video");butterfly.click();video.dispatchEvent(new Event("loadedmetadata"));window.__resetMonitorAppState("video");video.dispatchEvent(new Event("loadedmetadata"));report.steps.reset={open:monitor.classList.contains("show-video"),view:wrap.getAttribute("data-video-view"),track:window.__monitorVideoTrack(),src:video.src,time:fakeTime,active:[downtown.classList.contains("active"),rose.classList.contains("active"),butterfly.classList.contains("active")]};
    monitor.classList.add("show-caps");window.__openMonitorApp("video");downtown.click();document.getElementById("tumbala-song-audio").dispatchEvent(new Event("play"));report.steps.song={closed:!monitor.classList.contains("show-video"),view:wrap.getAttribute("data-video-view")};
    report.steps.calls={play:playCalls,pause:pauseCalls};report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
  }catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},120);});
})();</script>`;

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html monitor Video chooser/player:");
var r = lib.runPageSync("loft-day.html", HARNESS, 5200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial && s.initial.view === "chooser" && s.initial.rootView === "chooser" && !s.initial.src &&
  s.initial.title === "Choose a film" && s.initial.titleCs === "Vyber film" &&
  s.initial.chooser !== "none" && s.initial.stage === "none" &&
  JSON.stringify(s.initial.titles) === JSON.stringify(["Downtown dance","Mon amie la rose","Rainbow Butterfly"]) &&
  s.initial.art.every(function(art){return art.svg&&art.viewBox==="0 0 36 28"&&art.marks>=12;}) &&
  JSON.stringify(s.initial.active) === JSON.stringify([true,false,false]),
  "opens on the bilingual three-card illustrated chooser without fetching a film", s.initial);
check(s.initial && s.initial.back.pointer === "none" && s.initial.fullscreen.pointer === "none" && s.initial.close.pointer !== "none",
  "chooser exposes only Dismiss", s.initial);
check(s.player && s.player.view === "player" && s.player.rootView === "player" && /art\/downtown-dance\.mp4$/.test(s.player.src) &&
  s.player.chooser === "none" && s.player.stage !== "none" && s.player.stageSize[0] > 0 && s.player.stageSize[1] > 0 &&
  s.player.controls.back.pointer !== "none" && s.player.controls.fullscreen.pointer !== "none" && s.player.controls.close.pointer !== "none" &&
  s.player.ordered && s.player.distinct,
  "selecting a card opens a player with ordered Back, Fullscreen, and Dismiss controls", s.player);
check(s.fullscreen && s.fullscreen.requested, "Fullscreen targets the video player surface", s.fullscreen);
check(s.idle && s.idle.wrap && s.idle.root && s.idle.strip === "none" && s.idle.back === "none" && s.idle.fullscreen === "none" && s.idle.close === "none",
  "playing idle hides the bottom strip and all three corner controls together", s.idle);
check(s.wake && !s.wake.wrap && !s.wake.root && s.wake.strip !== "none" && s.wake.back !== "none" && s.wake.fullscreen !== "none" && s.wake.close !== "none",
  "pointer activity wakes the entire player chrome together", s.wake);
check(s.sliders && s.sliders.seekWidth > 0 && s.sliders.volumeWidth > 0 && s.sliders.time > 80 && s.sliders.volume > .8,
  "mouse drags update seek and volume when pointer capture is unavailable", s.sliders);
check(s.back && s.back.open && s.back.view === "chooser" && s.back.paused,
  "Back pauses the film and returns to the chooser without closing Video", s.back);
check(s.rose && s.rose.view === "player" && s.rose.track === "rose" && /art\/monamielarose\.mp4$/.test(s.rose.src) && s.rose.time > 0 && s.rose.time < .01,
  "the rose card opens its own player at the beginning", s.rose);
check(s.butterfly && s.butterfly.track === "butterfly" && /art\/rainbow-butterfly\.mp4$/.test(s.butterfly.src) && s.butterfly.time > 0 && s.butterfly.time < .01,
  "the butterfly card opens its own player at the beginning", s.butterfly);
check(s.roseReturned && s.roseReturned.track === "rose" && /art\/monamielarose\.mp4$/.test(s.roseReturned.src) && s.roseReturned.time === 7.25,
  "returning through the chooser restores each film's independent playhead", s.roseReturned);
check(s.reopened && s.reopened.open && s.reopened.view === "chooser" && s.reopened.track === "rose" && s.reopened.active,
  "Dismiss/reopen returns to the chooser while retaining the selected film", s.reopened);
check(s.escape && s.escape.back.open && s.escape.back.view === "chooser" && s.escape.closed,
  "Escape follows player Back first, then closes Video from the chooser", s.escape);
check(s.reset && !s.reset.open && s.reset.view === "chooser" && s.reset.track === "downtown" && /art\/downtown-dance\.mp4$/.test(s.reset.src) && s.reset.time > 0 && s.reset.time < .01 && JSON.stringify(s.reset.active) === JSON.stringify([true,false,false]),
  "Kill/reset closes Video, restores the chooser, selects Downtown, and rewinds every film", s.reset);
check(s.song && s.song.closed && s.song.view === "chooser",
  "starting a song closes the player fully rather than taking its Back path", s.song);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

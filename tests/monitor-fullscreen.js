#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(async function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var out={},mon=document.getElementById("office-monitor"),area=document.getElementById("hunt-fullscreen-area"),button=document.getElementById("monitor-desk-fullscreen"),screen=document.getElementById("monitor-zoom-box");',
  'window.__goToStage("office");document.getElementById("office-pc-desk-trio").classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(60);',
  'var before=screen.getBoundingClientRect(),brandHit=document.querySelector("#monitor-system-brand .desk-bar-hit").getBoundingClientRect(),searchHit=document.querySelector("#monitor-desk-search-button .desk-bar-hit").getBoundingClientRect(),dateHit=document.querySelector("#monitor-desk-calendar .desk-bar-hit").getBoundingClientRect(),timeHit=document.querySelector("#monitor-desk-clock .desk-bar-hit").getBoundingClientRect(),weatherHit=document.querySelector("#monitor-desk-weather .desk-bar-hit").getBoundingClientRect(),langHit=document.querySelector("#monitor-desk-language .desk-bar-hit").getBoundingClientRect(),volume=document.getElementById("monitor-desk-volume"),volumeHit=volume.querySelector(".desk-bar-hit").getBoundingClientRect(),fsHit=button.querySelector(".desk-bar-hit").getBoundingClientRect();out.beforeRatio=before.width/before.height;out.visible=getComputedStyle(button).pointerEvents==="auto";out.taskbarGeometry={brand:[brandHit.left,brandHit.right,brandHit.width],search:[searchHit.left,searchHit.right,searchHit.width,searchHit.height],date:[dateHit.left,dateHit.right],time:[timeHit.left,timeHit.right],weather:[weatherHit.left,weatherHit.right],language:[langHit.left,langHit.right],volume:[volumeHit.left,volumeHit.right,volumeHit.width,volumeHit.height],fullscreen:[fsHit.left,fsHit.right,fsHit.width,fsHit.height],screenCenter:(before.left+before.right)/2,timeCenter:(timeHit.left+timeHit.right)/2};out.volumeBefore=window.__loftControllers.volumebutton();volume.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));out.volumeAfter=window.__loftControllers.volumebutton();',
  'button.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}));button.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(180);window.__openMonitorApp("code");var editor=document.getElementById("monitor-code-code");editor.focus();var during=screen.getBoundingClientRect(),viewport=document.querySelector(".hunt-viewport"),areaRect=area.getBoundingClientRect(),root=document.documentElement;out.entered=!area.classList.contains("is-fullscreen")&&area.classList.contains("monitor-content-fullscreen-host")&&mon.classList.contains("monitor-content-fullscreen");out.browserUntouched=!document.fullscreenElement&&!document.webkitFullscreenElement;out.areaRect=[areaRect.left,areaRect.top,areaRect.right,areaRect.bottom,root.clientWidth,root.clientHeight];out.surfaceRect=[during.left,during.top,during.right,during.bottom,root.clientWidth,root.clientHeight];out.fillsViewport=areaRect.left<=0&&Math.abs(areaRect.top)<1&&areaRect.right>=root.clientWidth&&areaRect.bottom>=root.clientHeight;out.surfaceUsesWidth=during.width>=root.clientWidth*.95;out.surfaceVisible=during.top>=0&&during.bottom<=root.clientHeight;out.duringRatio=during.width/during.height;out.codeRetained=mon.classList.contains("show-code");out.focusRetained=document.activeElement===editor;out.contentOnly=getComputedStyle(document.getElementById("office-monitor-bezel")).visibility==="hidden"&&getComputedStyle(document.getElementById("office-monitor-screen-content")).visibility==="visible";out.chromeHidden=getComputedStyle(document.getElementById("hunt-caption")).display==="none"&&getComputedStyle(document.getElementById("hunt-left")).display==="none"&&getComputedStyle(document.getElementById("hunt-right")).display==="none"&&getComputedStyle(document.getElementById("hunt-bottom-nav")).display==="none";out.blackSurround=getComputedStyle(area).backgroundColor==="rgb(0, 0, 0)"&&getComputedStyle(viewport).backgroundColor==="rgb(0, 0, 0)";out.enterLabel=button.getAttribute("aria-label");out.enterMark=button.querySelector("path").getAttribute("d");',
  'var surround=document.elementFromPoint(1,1)||area;out.surroundTarget=surround.id||surround.tagName;surround.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0,clientX:1,clientY:1}));await sleep(80);out.surroundExited=!area.classList.contains("monitor-content-fullscreen-host")&&window.__monitorZoomed();window.__toggleMonitorContentFullscreen();await sleep(80);document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(80);out.exited=!area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host")&&!mon.classList.contains("monitor-content-fullscreen");out.zoomRetained=window.__monitorZoomed();out.exitMark=button.querySelector("path").getAttribute("d");window.__toggleFullscreen();await sleep(80);out.fOwnsBrowserFullscreen=area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host");window.__toggleMonitorContentFullscreen();await sleep(160);var nested=screen.getBoundingClientRect(),nestedArea=area.getBoundingClientRect();out.nestedSurfaceWidth=nested.width;out.nestedArea=[nestedArea.left,nestedArea.top,nestedArea.right,nestedArea.bottom,root.clientWidth,root.clientHeight];out.monitorInsideBrowserFullscreen=area.classList.contains("is-fullscreen")&&area.classList.contains("monitor-content-fullscreen-host")&&area.parentNode!==document.getElementById("monitor-focus-dialog");out.nestedUsesViewport=nested.width>=root.clientWidth*.95&&nestedArea.left<=0&&nestedArea.right>=root.clientWidth;window.__toggleMonitorContentFullscreen();await sleep(80);out.browserFullscreenRetained=area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host");if(window.__toggleFullscreen)window.__toggleFullscreen();out.noInnerControls=!document.getElementById("monitor-snake-fs")&&!document.querySelector(".vid-ctrl-fs");out.shootException=!!document.getElementById("monitor-doom-fullscreen")&&!!window.__enterShootBrowserFullscreen;',
  'document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(error){document.getElementById("__report").textContent=JSON.stringify({error:String(error&&error.stack||error)});});<\/script>'
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 1800, {
  patchRaf: true,
  chromeFlags: "--window-size=2048,864"
});
var tallState = lib.runPageSync("rsvp.html", harness, 1800, {
  patchRaf: true,
  chromeFlags: "--window-size=2048,1152"
});
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) {
    failures++;
    if (detail != null) console.log("    " + JSON.stringify(detail));
  }
}

console.log("rsvp.html in-page monitor focus mode:");
check(state && !state.error, "focused harness completed", state && state.error);
if (state && !state.error) {
  var authoredRatio = 124 / 42;
  check(state.visible, "the taskbar control is available on the zoomed monitor desktop", state);
  check(Math.abs(state.taskbarGeometry.search[2] - state.taskbarGeometry.search[3]) < 0.1 &&
      Math.abs(state.taskbarGeometry.volume[2] - state.taskbarGeometry.volume[3]) < 0.1 &&
      Math.abs(state.taskbarGeometry.fullscreen[2] - state.taskbarGeometry.fullscreen[3]) < 0.1 &&
      Math.abs(state.taskbarGeometry.search[2] - state.taskbarGeometry.volume[2]) < 0.1 &&
      Math.abs(state.taskbarGeometry.search[2] - state.taskbarGeometry.fullscreen[2]) < 0.1 &&
      state.taskbarGeometry.volume[0] > state.taskbarGeometry.language[1] &&
      state.taskbarGeometry.fullscreen[0] > state.taskbarGeometry.volume[1],
    "Search, Volume, and Fullscreen use matching square cells in the requested order",
    state.taskbarGeometry);
  check(state.taskbarGeometry.brand[2] < state.taskbarGeometry.date[1] - state.taskbarGeometry.date[0] &&
      state.taskbarGeometry.search[1] < state.taskbarGeometry.date[0] &&
      state.taskbarGeometry.date[1] < state.taskbarGeometry.time[0] &&
      state.taskbarGeometry.time[1] < state.taskbarGeometry.weather[0] &&
      state.taskbarGeometry.weather[1] < state.taskbarGeometry.language[0] &&
      Math.abs(state.taskbarGeometry.timeCenter - state.taskbarGeometry.screenCenter) < 0.1,
    "the compact brand precedes Date, Time, Weather, with Time centered on the monitor",
    state.taskbarGeometry);
  check(state.volumeBefore !== state.volumeAfter,
    "the taskbar volume button advances the shared music-volume step", state);
  check(state.volumeBefore === 0.15 && state.volumeAfter === 0.4,
    "the shared volume steps use the revised quiet and medium levels", state);
  check(state.entered && state.browserUntouched && state.codeRetained,
    "the taskbar expands the monitor without invoking browser fullscreen", state);
  check(state.fillsViewport,
    "the in-page monitor layer consumes the complete browser viewport", state);
  check(state.surfaceUsesWidth,
    "the monitor surface itself consumes the available viewport width", state);
  check(state.surfaceVisible,
    "the full-width monitor surface remains vertically inside the viewport", state);
  check(state.contentOnly, "monitor fullscreen paints only the clipped display surface", state);
  check(state.chromeHidden && state.blackSurround,
    "monitor fullscreen hides all game chrome against a black surround", state);
  check(state.focusRetained, "monitor focus mode retains keyboard focus in the active app", state);
  check(Math.abs(state.beforeRatio - authoredRatio) < 0.01 &&
      Math.abs(state.duringRatio - authoredRatio) < 0.01,
    "the monitor preserves its authored aspect ratio before and during fullscreen", state);
  check(/374\.15 155\.55/.test(state.enterMark) &&
      /373\.55 156\.15/.test(state.exitMark),
    "the taskbar glyph reflects enter/exit state without metadata", state);
  check(state.exited && state.zoomRetained,
    "Escape leaves monitor focus mode without dropping the ordinary monitor zoom", state);
  check(state.surroundExited,
    "a black-surround tap exits focus mode while retaining ordinary monitor zoom", state);
  check(state.fOwnsBrowserFullscreen,
    "F remains the independent browser-fullscreen toggle", state);
  check(state.monitorInsideBrowserFullscreen && state.browserFullscreenRetained,
    "monitor focus reuses and preserves an existing loft browser-fullscreen session", state);
  check(state.nestedUsesViewport,
    "monitor focus consumes the full viewport inside an existing browser-fullscreen session", state);
  check(tallState && !tallState.error && tallState.surfaceUsesWidth && tallState.surfaceVisible &&
      tallState.nestedUsesViewport,
    "full-width monitor focus stays centered at the 2048×1152 desktop viewport", tallState);
  check(state.noInnerControls && state.shootException,
    "shared apps stay taskbar-local while Shoot exposes its intentional true-fullscreen control", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

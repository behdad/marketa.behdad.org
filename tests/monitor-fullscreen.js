#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(async function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var out={},mon=document.getElementById("office-monitor"),area=document.getElementById("hunt-fullscreen-area"),button=document.getElementById("monitor-bezel-fullscreen"),screen=document.getElementById("monitor-zoom-box");',
  'window.goToStage("office");document.getElementById("office-pc-desk-trio").classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(60);window.__openMonitorApp("code");var editor=document.getElementById("monitor-code-code");editor.focus();',
  'var before=screen.getBoundingClientRect();out.beforeRatio=before.width/before.height;out.visible=getComputedStyle(button).pointerEvents==="auto";',
  'button.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}));button.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(180);var during=screen.getBoundingClientRect(),viewport=document.querySelector(".hunt-viewport"),areaRect=area.getBoundingClientRect(),root=document.documentElement;out.entered=!area.classList.contains("is-fullscreen")&&area.classList.contains("monitor-content-fullscreen-host")&&mon.classList.contains("monitor-content-fullscreen");out.browserUntouched=!document.fullscreenElement&&!document.webkitFullscreenElement;out.areaRect=[areaRect.left,areaRect.top,areaRect.right,areaRect.bottom,root.clientWidth,root.clientHeight];out.surfaceRect=[during.left,during.top,during.right,during.bottom,root.clientWidth,root.clientHeight];out.fillsViewport=areaRect.left<=0&&Math.abs(areaRect.top)<1&&areaRect.right>=root.clientWidth&&areaRect.bottom>=root.clientHeight;out.surfaceUsesWidth=during.width>=root.clientWidth*.95;out.surfaceVisible=during.top>=0&&during.bottom<=root.clientHeight;out.duringRatio=during.width/during.height;out.codeRetained=mon.classList.contains("show-code");out.focusRetained=document.activeElement===editor;out.contentOnly=getComputedStyle(document.getElementById("office-monitor-bezel")).visibility==="hidden"&&getComputedStyle(document.getElementById("office-monitor-screen-content")).visibility==="visible";out.chromeHidden=getComputedStyle(document.getElementById("hunt-caption")).display==="none"&&getComputedStyle(document.getElementById("hunt-left")).display==="none"&&getComputedStyle(document.getElementById("hunt-right")).display==="none"&&getComputedStyle(document.getElementById("hunt-dots")).display==="none";out.blackSurround=getComputedStyle(area).backgroundColor==="rgb(0, 0, 0)"&&getComputedStyle(viewport).backgroundColor==="rgb(0, 0, 0)";out.enterLabel=button.getAttribute("aria-label");out.enterMark=button.querySelector("path").getAttribute("d");',
  'area.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0,clientX:1,clientY:1}));await sleep(80);out.surroundExited=!area.classList.contains("monitor-content-fullscreen-host")&&window.__monitorZoomed();window.__toggleMonitorContentFullscreen();await sleep(80);document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(80);out.exited=!area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host")&&!mon.classList.contains("monitor-content-fullscreen");out.zoomRetained=window.__monitorZoomed();out.exitLabel=button.getAttribute("aria-label");document.dispatchEvent(new KeyboardEvent("keydown",{key:"f",bubbles:true,cancelable:true}));await sleep(80);out.fOwnsBrowserFullscreen=area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host");window.__toggleMonitorContentFullscreen();await sleep(160);var nested=screen.getBoundingClientRect(),nestedArea=area.getBoundingClientRect();out.nestedSurfaceWidth=nested.width;out.nestedArea=[nestedArea.left,nestedArea.top,nestedArea.right,nestedArea.bottom,root.clientWidth,root.clientHeight];out.monitorInsideBrowserFullscreen=area.classList.contains("is-fullscreen")&&area.classList.contains("monitor-content-fullscreen-host")&&area.parentNode!==document.getElementById("monitor-focus-dialog");out.nestedUsesViewport=nested.width>=root.clientWidth*.95&&nestedArea.left<=0&&nestedArea.right>=root.clientWidth;window.__toggleMonitorContentFullscreen();await sleep(80);out.browserFullscreenRetained=area.classList.contains("is-fullscreen")&&!area.classList.contains("monitor-content-fullscreen-host");if(window.__toggleFullscreen)window.__toggleFullscreen();out.noInnerControls=!document.getElementById("monitor-snake-fs")&&!document.querySelector(".vid-ctrl-fs");out.shootException=!document.getElementById("monitor-doom-fullscreen")&&!!window.__enterShootBrowserFullscreen;',
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
  check(state.visible, "the bezel control is available while the monitor is zoomed", state);
  check(state.entered && state.browserUntouched && state.codeRetained,
    "the bezel expands the monitor without invoking browser fullscreen or closing Code", state);
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
  check(/Exit/i.test(state.enterLabel) && /Enter/i.test(state.exitLabel) &&
      /377\.35 153\.7/.test(state.enterMark),
    "the bezel label and glyph reflect enter/exit state", state);
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
    "one bezel control stays monitor-local except for Shoot’s true-browser-fullscreen routing", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

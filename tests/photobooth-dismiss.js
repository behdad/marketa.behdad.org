#!/usr/bin/env node
// Monitor Photobooth: the standard app dismiss stays usable over the look picker.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  ' var mon=document.getElementById("office-monitor"),close=document.getElementById("monitor-pb-close");',
  ' window.goToStage("office");',
  ' mon.classList.add("screen-on","pb-error");',
  ' var error=document.getElementById("monitor-pb-error");',
  ' S("unzoomedError",{pointerEvents:getComputedStyle(error).pointerEvents});',
  ' if(window.__monitorZoomOut)window.__monitorZoomOut();',
  ' var zr=document.getElementById("monitor-zoom-box").getBoundingClientRect();',
  ' mon.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,button:0,clientX:(zr.left+zr.right)/2,clientY:(zr.top+zr.bottom)/2}));',
  ' mon.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0,clientX:(zr.left+zr.right)/2,clientY:(zr.top+zr.bottom)/2}));',
  ' S("errorZoom",{zoomed:window.__monitorZoomed&&window.__monitorZoomed(),error:mon.classList.contains("pb-error")});',
  ' var ok=document.getElementById("monitor-pb-error-ok");',
  ' var or=ok.getBoundingClientRect(),ox=(or.left+or.right)/2,oy=(or.top+or.bottom)/2;',
  ' ok.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,button:0,clientX:ox,clientY:oy}));',
  ' ok.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0,clientX:ox,clientY:oy}));',
  ' S("errorOk",{zoomed:window.__monitorZoomed&&window.__monitorZoomed(),error:mon.classList.contains("pb-error")});',
  ' if(window.__monitorZoomOut)window.__monitorZoomOut();',
  ' mon.classList.remove("pb-error");',
  ' mon.classList.add("screen-on","photobooth","picking");',
  ' var style=getComputedStyle(close);',
  ' S("pickerClose",{opacity:style.opacity,pointerEvents:style.pointerEvents,visible:!!close.getClientRects().length});',
  ' close.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  ' S("dismissed",{photobooth:mon.classList.contains("photobooth"),picking:mon.classList.contains("picking")});',
  ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor Photobooth dismiss:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1500, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.unzoomedError.pointerEvents === "none",
  "an unzoomed Photobooth error cannot intercept the monitor's zoom tap", s.unzoomedError);
check(s.errorZoom.zoomed,
  "a tap on the unzoomed no-camera state zooms the monitor", s.errorZoom);
check(s.errorOk.zoomed && !s.errorOk.error,
  "OK dismisses the no-camera state without unzooming the monitor", s.errorOk);
check(s.pickerClose.visible && s.pickerClose.opacity === "1" && s.pickerClose.pointerEvents !== "none",
  "the standard app dismiss is visible and interactive over the look picker", s.pickerClose);
check(!s.dismissed.photobooth && !s.dismissed.picking,
  "clicking dismiss exits the Photobooth and clears the picker state", s.dismissed);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

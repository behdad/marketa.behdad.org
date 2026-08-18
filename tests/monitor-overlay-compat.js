#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||{}};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function box(el){var r=el.getBoundingClientRect();return [r.left,r.top,r.width,r.height];}',
  'function shift(a,b){return Math.max.apply(Math,a.map(function(v,i){return Math.abs(v-b[i]);}));}',
  'function clearSurface(){var monitor=document.getElementById("office-monitor");Array.from(monitor.classList).forEach(function(c){if(/^(show-|death-|photobooth$|picking$|pb-)/.test(c))monitor.classList.remove(c);});monitor.classList.add("show-caps");}',
  'function click(id){var el=document.getElementById(id);el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},320);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(60);var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),controls=document.getElementById("monitor-html-overlay-controls");tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(70);',
  ' var toolbarIds=["monitor-system-brand","monitor-desk-search-button","monitor-desk-calendar","monitor-desk-clock","monitor-desk-weather","monitor-desk-language","monitor-desk-volume","monitor-desk-fullscreen"];report.toolbar={parents:toolbarIds.map(function(id){return document.getElementById(id).parentNode===controls;}),zoomed:window.__monitorZoomed()};',
  ' click("monitor-system-brand");report.toolbar.system=window.__monitorSystemMenuOpen();click("monitor-system-brand");',
  ' click("monitor-desk-search-button");report.toolbar.search=window.__monitorDockSearch();window.__closeMonitorDockSearch();',
  ' click("monitor-desk-calendar");await sleep(25);report.toolbar.calendar=monitor.classList.contains("show-calendar")&&window.__monitorZoomed();window.__closeTopMonitorApp(false);await sleep(25);',
  ' click("monitor-desk-clock");await sleep(25);report.toolbar.clock=monitor.classList.contains("show-clock")&&window.__monitorZoomed();window.__closeTopMonitorApp(false);await sleep(25);',
  ' click("monitor-desk-weather");await sleep(25);report.toolbar.weather=monitor.classList.contains("show-weather")&&window.__monitorZoomed();window.__closeTopMonitorApp(false);await sleep(25);',
  ' var lang=document.documentElement.lang;click("monitor-desk-language");report.toolbar.language=document.documentElement.lang!==lang;',
  ' var volume=window.__loftControllers.volumebutton();click("monitor-desk-volume");report.toolbar.volume=window.__loftControllers.volumebutton()!==volume;',
  ' click("monitor-desk-fullscreen");await sleep(40);report.toolbar.fullscreen=window.__monitorContentFullscreen()&&window.__monitorZoomed();click("monitor-desk-fullscreen");await sleep(40);',
  ' clearSurface();await sleep(25);report.paint={parked:Array.from(document.querySelectorAll("#office-monitor-screen-content foreignObject.monitor-overlay-parked")).length,allHidden:Array.from(document.querySelectorAll("#office-monitor-screen-content foreignObject.monitor-overlay-parked")).every(function(fo){return getComputedStyle(fo).visibility==="hidden";}),capsHidden:getComputedStyle(document.getElementById("monitor-logo-caps")).visibility==="hidden"};',
  ' window.__openMonitorApp("mail");await sleep(30);window.__closeTopMonitorApp(false);await sleep(30);report.paint.returned=window.__monitorHtmlOverlayState().roots.join(",")==="dock-grid"&&Array.from(document.querySelectorAll("#office-monitor-screen-content foreignObject.monitor-overlay-parked")).every(function(fo){return getComputedStyle(fo).visibility==="hidden";});',
  ' clearSurface();monitor.classList.add("pb-confirm");await sleep(30);var confirm=document.getElementById("monitor-pb-confirm"),confirmYes=document.getElementById("monitor-pb-confirm-yes");report.photobooth={confirm:{overlay:window.__monitorHtmlOverlayState().active,dock:getComputedStyle(document.getElementById("monitor-desktop-dock")).visibility,visible:getComputedStyle(confirm).visibility,pointer:getComputedStyle(confirm).pointerEvents,yesWidth:confirmYes.getBoundingClientRect().width}};',
  ' monitor.classList.remove("pb-confirm");monitor.classList.add("pb-error");await sleep(220);var error=document.getElementById("monitor-pb-error"),booth=document.getElementById("monitor-photobooth"),errorCard=document.getElementById("monitor-pb-error-card"),errorClose=document.getElementById("monitor-pb-close");report.photobooth.error={overlay:window.__monitorHtmlOverlayState().active,dock:getComputedStyle(document.getElementById("monitor-desktop-dock")).visibility,visible:getComputedStyle(error).visibility,booth:{display:getComputedStyle(booth).display,matched:booth.matches("#office-monitor.pb-error #monitor-photobooth"),pointer:getComputedStyle(booth).pointerEvents},card:{width:errorCard.getBoundingClientRect().width,closeWidth:errorClose.getBoundingClientRect().width},nested:error.parentNode===booth};errorClose.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));report.photobooth.error.dismissed=!monitor.classList.contains("pb-error");',
  ' clearSurface();monitor.classList.add("show-nowplaying","song-paused","eq-live");await sleep(30);var thumbs=Array.from(document.querySelectorAll("#monitor-manual-eq .meq-thumb")).map(function(el){return el.getAttribute("y");});var title=document.getElementById("monitor-np-title").textContent;report.music={rail:getComputedStyle(document.getElementById("hunt-side")).visibility,transports:["monitor-prev-btn","monitor-pause-btn","monitor-next-btn"].filter(function(id){return getComputedStyle(document.getElementById(id)).visibility==="visible";}).length,eqCount:document.querySelectorAll("#monitor-manual-eq").length,marquee:getComputedStyle(document.getElementById("monitor-np-marquee")).transform};window.__monitorZoomOut();await sleep(25);window.__monitorZoomIn();await sleep(40);report.music.retained=monitor.classList.contains("show-nowplaying")&&monitor.classList.contains("song-paused")&&title===document.getElementById("monitor-np-title").textContent&&JSON.stringify(thumbs)===JSON.stringify(Array.from(document.querySelectorAll("#monitor-manual-eq .meq-thumb")).map(function(el){return el.getAttribute("y");}));',
  ' clearSurface();monitor.classList.add("show-mines");document.getElementById("monitor-mines").setAttribute("data-view","mines");await sleep(35);var classics=document.getElementById("monitor-mines-back"),cb=box(classics);classics.focus();report.focus={classics:{shift:shift(cb,box(classics)),outline:getComputedStyle(classics).outlineStyle}};',
  ' clearSurface();monitor.classList.add("show-doom");document.getElementById("monitor-doom").setAttribute("data-shoot-view","q3");document.getElementById("monitor-doom-wrap").setAttribute("data-shoot-view","q3");await sleep(35);var back=document.getElementById("monitor-doom-back"),full=document.getElementById("monitor-doom-fullscreen"),bb=box(back),fb=box(full);back.focus();var backStyle=getComputedStyle(back);full.focus();report.focus.shoot={backShift:shift(bb,box(back)),backOutline:backStyle.outlineStyle,fullShift:shift(fb,box(full)),fullOutline:getComputedStyle(full).outlineStyle};',
  ' clearSurface();monitor.classList.add("show-snake");await sleep(35);var root=document.getElementById("monitor-snake-wrap"),frame=document.createElement("iframe");frame.src="about:blank";root.appendChild(frame);await sleep(25);var win=frame.contentWindow,before=window.__monitorHtmlOverlayState().metrics;monitor.classList.add("snake-runtime-ready");await sleep(40);var after=window.__monitorHtmlOverlayState().metrics;report.runtime={sameFrame:frame===root.querySelector("iframe"),sameWindow:win===frame.contentWindow,mounts:after.mounts-before.mounts,restores:after.restores-before.restores,root:window.__monitorHtmlOverlayState().roots};frame.remove();',
  '}',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) { failures++; if (detail != null) console.log("    " + JSON.stringify(detail)); }
}

console.log("monitor overlay compatibility:");
check(!!result, "focused harness completed");
if (result) {
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.toolbar.parents.every(Boolean) && result.toolbar.zoomed,
    "every desktop toolbar control is promoted above the ordinary-DOM dock", result.toolbar);
  check(result.toolbar.system && result.toolbar.search.open && result.toolbar.calendar && result.toolbar.clock &&
      result.toolbar.weather && result.toolbar.language && result.toolbar.volume && result.toolbar.fullscreen,
    "system, search, calendar, clock, weather, language, volume, and fullscreen retain their actions while zoomed", result.toolbar);
  check(result.paint.parked > 10 && result.paint.allHidden && result.paint.capsHidden && result.paint.returned,
    "parked foreignObjects and idle caps never share paint ownership with the promoted dock", result.paint);
  check(!result.photobooth.confirm.overlay && result.photobooth.confirm.dock === "hidden" &&
      result.photobooth.confirm.visible === "visible" && result.photobooth.confirm.pointer === "auto" &&
      result.photobooth.confirm.yesWidth > 0 &&
      !result.photobooth.error.overlay && result.photobooth.error.dock === "hidden" &&
      result.photobooth.error.visible === "visible" && result.photobooth.error.booth.display !== "none" &&
      result.photobooth.error.booth.matched && result.photobooth.error.booth.pointer === "none" &&
      result.photobooth.error.card.width > 0 && result.photobooth.error.card.closeWidth > 0 &&
      result.photobooth.error.nested && result.photobooth.error.dismissed,
    "photobooth error is a dismissible dialog over its inert app surface", result.photobooth);
  check(result.music.rail === "visible" && result.music.transports === 3 && result.music.eqCount === 1 &&
      result.music.marquee !== "none" && result.music.retained,
    "Music keeps the shared page transport and retains its player state across zoom cycles", result.music);
  check(result.focus.classics.shift <= 0.1 && result.focus.classics.outline === "none" &&
      result.focus.shoot.backShift <= 0.1 && result.focus.shoot.backOutline === "none" &&
      result.focus.shoot.fullShift <= 0.1 && result.focus.shoot.fullOutline === "none",
    "promoted Classics and shooter controls keep authored geometry without the page focus ring", result.focus);
  check(result.runtime.sameFrame && result.runtime.sameWindow && result.runtime.mounts === 0 &&
      result.runtime.restores === 0 && result.runtime.root.join(",") === "monitor-snake-wrap",
    "runtime state mutations refit in place without reparenting or reloading the browsing context", result.runtime);
}

if (failures) {
  console.error("\n" + failures + " monitor overlay compatibility check(s) failed.");
  process.exit(1);
}
console.log("\nAll monitor overlay compatibility checks passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function rect(el){var r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}',
  'function delta(a,b){return Math.max(Math.abs(a.left-b.left),Math.abs(a.top-b.top),Math.abs(a.right-b.right),Math.abs(a.bottom-b.bottom));}',
  'var report={errors:[],apps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},320);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(80);',
  ' var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),host=document.getElementById("monitor-html-overlay"),controls=document.getElementById("monitor-html-overlay-controls"),box=document.getElementById("monitor-zoom-box");',
  ' if(tower)tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(80);',
  ' var initial=window.__monitorHtmlOverlayState();report.policy={policy:initial.policy,denied:initial.denied,supported:initial.supported,credits:initial.supported.indexOf("monitor-credits-layer")};',
  ' report.surfaces={};var stateCases=[',
  ' ["desktop",["show-caps"],["dock-grid"]],',
  ' ["console",["show-console"],["monitor-console-wrap"]],["code",["show-code"],["monitor-code-wrap"]],["mail",["show-mail"],["monitor-mail-wrap"]],',
  ' ["classics-chooser",["show-mines"],["monitor-classics-wrap"],"chooser"],["classics-mines",["show-mines"],["monitor-mines-wrap"],"mines"],["classics-solitaire",["show-mines"],["monitor-solitaire-wrap"],"solitaire"],',
  ' ["pacman",["show-pacman"],["monitor-pacman-wrap"]],["prince",["show-prince"],["prince-monitor-wrap"]],["video",["show-video"],["monitor-video-wrap"]],',
  ' ["tattoo",["show-tattoo"],["monitor-tattoo-wrap"]],["life",["show-life"],["monitor-life-wrap"]],["calendar",["show-calendar"],["monitor-cal-body"]],',
  ' ["clock",["show-clock"],["monitor-clock-wrap"]],["chat",["show-chat"],["monitor-chat-wrap"]],["python",["show-python"],["monitor-py-wrap"]],["linux",["show-linux"],["monitor-linux-wrap"]],',
  ' ["snake",["show-snake"],["monitor-snake-wrap"]],["shoot",["show-doom"],["monitor-doom-wrap"]],["browser",["show-browser"],["monitor-browser-wrap"]],',
  ' ["fatality",["death-doom"],["fatality-wrap"]],["bsod",["death-linux"],["bsod-wrap"]],["photobooth",["photobooth"],["monitor-pb-videowrap"]],["photobooth-picker",["photobooth","picking"],["monitor-pb-videowrap","monitor-pb-picker-grid"]]',
  ' ];',
  ' function setSurface(spec){Array.from(monitor.classList).forEach(function(c){if(/^(show-|death-|photobooth$|picking$|pb-)/.test(c))monitor.classList.remove(c);});var classics=document.getElementById("monitor-mines");if(spec[3]&&classics)classics.setAttribute("data-view",spec[3]);spec[1].forEach(function(c){monitor.classList.add(c);});}',
  ' for(var sc=0;sc<stateCases.length;sc++){var stateSpec=stateCases[sc];setSurface(stateSpec);await sleep(25);report.surfaces[stateSpec[0]]=window.__monitorHtmlOverlayState().roots.slice().sort();}',
  ' setSurface(["desktop",["show-caps"]]);await sleep(25);',
  ' var specs=[ ["code","monitor-code-wrap"], ["console","monitor-console-wrap"], ["python","monitor-py-wrap"], ["linux","monitor-linux-wrap"], ["mail","monitor-mail-wrap"], ["chat","monitor-chat-wrap"], ["chrome","monitor-browser-wrap"] ];',
  ' for(var i=0;i<specs.length;i++){var spec=specs[i],result=window.__openMonitorApp(spec[0]);await sleep(spec[0]==="chrome"?900:45);var state=window.__monitorHtmlOverlayState(),root=document.getElementById(spec[1]),layer=root&&root.closest(".monitor-html-layer");report.apps[spec[0]]={result:result,active:state.active,roots:state.roots.slice(),parent:root&&root.parentNode&&root.parentNode.className,ownerInControls:state.owners.length===1&&document.getElementById(state.owners[0]).parentNode===controls,aligned:delta(rect(host),rect(box)),fills:layer?delta(rect(layer),rect(box)):999,rootSame:root===document.getElementById(spec[1])};}',
  ' window.__openMonitorApp("console");await sleep(45);var input=document.getElementById("monitor-console-in"),sameInput=input;input.value="retained-state";input.focus();input.setSelectionRange(4,8);var monitorClicks=0;monitor.addEventListener("click",function(){monitorClicks++;});input.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));report.clickThrough=monitorClicks;',
  ' var caret=document.querySelector("#monitor-console-wrap .console-caret");report.caretWidth=caret&&caret.getBoundingClientRect().width;var beforeIdle=window.__monitorHtmlOverlayState().metrics.geometryReads;await sleep(180);var afterIdle=window.__monitorHtmlOverlayState().metrics.geometryReads;report.idleGeometryReads=afterIdle-beforeIdle;var focusedBeforeZoom=document.activeElement===input;',
  ' window.__monitorZoomOut();await sleep(30);var parked=window.__monitorHtmlOverlayState(),parkedParent=input.closest("foreignObject");window.__monitorZoomIn();await sleep(55);var restored=window.__monitorHtmlOverlayState();report.retention={same:sameInput===document.getElementById("monitor-console-in"),value:input.value,selection:[input.selectionStart,input.selectionEnd],focusedBefore:focusedBeforeZoom,focused:document.activeElement===input,parked:!parked.active&&!!parkedParent,restored:restored.active&&restored.roots.length===1};',
  ' window.__toggleMonitorContentFullscreen();await sleep(180);var fullState=window.__monitorHtmlOverlayState();report.fullscreen={active:window.__monitorContentFullscreen(),aligned:delta(rect(host),rect(box)),geometry:fullState.geometry};window.__toggleMonitorContentFullscreen();await sleep(180);report.afterFullscreen={aligned:delta(rect(host),rect(box)),active:window.__monitorHtmlOverlayState().active};',
  ' window.__goToStage("garden");await sleep(40);report.roomPan={active:window.__monitorHtmlOverlayState().active,ownerHome:!!document.getElementById("monitor-console").closest("#office-monitor-screen-content")};',
  '}',
  '})();</script>'
].join("\n");

function run(label, chromeFlags) {
  var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, chromeFlags: chromeFlags });
  var failures = 0;
  function check(condition, message, detail) {
    if (condition) console.log("  ✓ " + message);
    else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
  }
  console.log(label + ":");
  if (!result) { console.log("  ✗ harness produced no report"); return 1; }
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.policy.policy === "overlay-by-default" && result.policy.denied.length === 0,
    "foreignObject HTML uses an overlay-by-default policy with an explicit empty denylist", result.policy);
  check(result.policy.credits === -1, "native SVG Credits stays outside the HTML inventory", result.policy);
  var expectedSurfaces={desktop:["dock-grid"],console:["monitor-console-wrap"],code:["monitor-code-wrap"],mail:["monitor-mail-wrap"],"classics-chooser":["monitor-classics-wrap"],"classics-mines":["monitor-mines-wrap"],"classics-solitaire":["monitor-solitaire-wrap"],pacman:["monitor-pacman-wrap"],prince:["prince-monitor-wrap"],video:["monitor-video-wrap"],tattoo:["monitor-tattoo-wrap"],life:["monitor-life-wrap"],calendar:["monitor-cal-body"],clock:["monitor-clock-wrap"],chat:["monitor-chat-wrap"],python:["monitor-py-wrap"],linux:["monitor-linux-wrap"],snake:["monitor-snake-wrap"],shoot:["monitor-doom-wrap"],browser:["monitor-browser-wrap"],fatality:["fatality-wrap"],bsod:["bsod-wrap"],photobooth:["monitor-pb-videowrap"],"photobooth-picker":["monitor-pb-picker-grid","monitor-pb-videowrap"]};
  Object.keys(expectedSurfaces).forEach(function (name) {
    check(JSON.stringify(result.surfaces[name]) === JSON.stringify(expectedSurfaces[name]),
      name + " follows the default overlay policy", result.surfaces[name]);
  });
  Object.keys(result.apps).forEach(function (id) {
    var app = result.apps[id];
    check(app.active && app.roots.length === 1 && app.ownerInControls && app.rootSame,
      (id === "chrome" ? "browser" : id) + " mounts exactly its live HTML root with its SVG controls", app);
    check(app.aligned <= 0.75 && app.fills <= 0.75,
      (id === "chrome" ? "browser" : id) + " is flush with all four native screen edges", app);
  });
  check(result.clickThrough === 0, "promoted app input does not click through to the monitor", result.clickThrough);
  check(result.caretWidth >= 0.8 && result.caretWidth <= 1.2, "Console caret stays one physical pixel wide", result.caretWidth);
  check(result.idleGeometryReads === 0, "idle overlay performs no geometry polling", result.idleGeometryReads);
  check(result.retention.same && result.retention.value === "retained-state" &&
      result.retention.selection[0] === 4 && result.retention.selection[1] === 8 &&
      result.retention.focused === result.retention.focusedBefore && result.retention.parked && result.retention.restored,
    "zoom-out/in preserves the exact node, value, selection, focus state and foreignObject home", result.retention);
  check(result.fullscreen.active && result.fullscreen.aligned <= 0.75,
    "content fullscreen refits the overlay to the native screen", result.fullscreen);
  check(result.afterFullscreen.active && result.afterFullscreen.aligned <= 0.75,
    "leaving content fullscreen restores exact alignment", result.afterFullscreen);
  check(!result.roomPan.active && result.roomPan.ownerHome,
    "room navigation parks HTML and SVG controls before the pan", result.roomPan);
  console.log("");
  return failures;
}

var failures = 0;
failures += run("monitor HTML overlay — desktop", "--window-size=1100,900");
failures += run("monitor HTML overlay — 390px landscape mobile", "--window-size=390,300");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All monitor HTML overlay checks passed.");

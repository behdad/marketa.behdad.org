#!/usr/bin/env node
// Compact/mobile controls keep stable, non-overlapping targets large enough for touch.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function rect(el){var r=el.getBoundingClientRect();return{id:el.id||"dot",x:r.left,y:r.top,w:r.width,h:r.height,right:r.right,bottom:r.bottom};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var ids=["hunt-prev","hunt-next","hunt-escape-btn","hunt-fullscreen-btn","hunt-restart-btn","hunt-volume-btn","hunt-playpause-btn","hunt-skip-btn"],controls=ids.map(function(id){return rect(document.getElementById(id));}),dots=[].slice.call(document.querySelectorAll(".hunt-dot")).map(rect),all=controls.concat(dots),overlaps=[];',
  ' for(var i=0;i<all.length;i++)for(var j=i+1;j<all.length;j++){var a=all[i],b=all[j];if(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)overlaps.push(a.id+"/"+b.id);}',
  ' report.steps={width:innerWidth,controls:controls,dots:dots,overlaps:overlaps};',
  ' var machine=document.getElementById("kitchen-lamarzocco");document.getElementById("hunt-escape-btn").click();report.steps.escapeDismissedIntro=!document.getElementById("click-me-overlay")&&!(machine&&machine.classList.contains("powered-on"));',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html mobile control targets:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1600, { patchRaf: true, chromeFlags: "--window-size=500,844" });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
function named(id) { return s.controls.filter(function(c){return c.id === id;})[0]; }
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(named("hunt-prev").w >= 34 && named("hunt-next").w >= 34, "room arrows have enlarged stable mobile targets", s.controls);
check(Math.abs((named("hunt-prev").y + named("hunt-prev").h / 2) - (named("hunt-next").y + named("hunt-next").h / 2)) < 1, "room arrows share one vertical centerline", s.controls);
check(named("hunt-escape-btn").w >= 36 && named("hunt-fullscreen-btn").w >= 36 && named("hunt-restart-btn").w >= 36, "Escape, fullscreen, and restart have enlarged stable mobile targets", s.controls);
check(s.escapeDismissedIntro, "mobile Escape dismisses CLICK ME without operating La Maz", s);
check(["hunt-volume-btn","hunt-playpause-btn","hunt-skip-btn"].every(function(id){var c=named(id);return c.w >= 32 && c.h >= 32;}), "all scene media controls have at least 32px mobile targets", s.controls);
check(s.dots.length === 5 && s.dots.every(function(d){return d.w >= 32 && d.h >= 32;}), "every room dot has at least a 32px mobile target", s.dots);
check(s.overlaps.length === 0, "enlarged mobile targets do not overlap", { overlaps: s.overlaps, controls: s.controls });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

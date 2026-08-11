#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function context(el){var r=el.getBoundingClientRect();var e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:r.left+r.width/2,clientY:r.top+r.height/2});return !el.dispatchEvent(e);}',
  'function menu(){return document.querySelector(".mon-ctx.tattoo-ctx");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  ' window.__goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("tattoo");await sleep(80);',
  ' var thumb=document.querySelector(".tattoo-thumb");S("gallery_prevented",context(thumb));var m=menu(),mr=m&&m.getBoundingClientRect();S("gallery_menu",{exists:!!m,count:m?m.querySelectorAll("button").length:0,label:m?m.textContent.trim():"",appKill:!!(m&&m.querySelector(".ctx-kill")),topmost:!!(m&&document.elementsFromPoint(mr.left+5,mr.top+5).indexOf(m)>=0)});',
  ' document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));S("esc_closed",!menu());',
  ' document.querySelector(".tattoo-new").closest(".tattoo-cell").click();await sleep(30);',
  ' var canvas=document.querySelector(".tattoo-canvas"),before=canvas.toDataURL();',
  ' var r=canvas.getBoundingClientRect();canvas.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:9,isPrimary:true,button:2,buttons:2,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));',
  ' S("right_did_not_draw",canvas.toDataURL()===before);S("canvas_prevented",context(canvas));m=menu();S("canvas_menu",{exists:!!m,count:m?m.querySelectorAll("button").length:0,label:m?m.textContent.trim():""});',
  ' if(m)m.querySelector("button").click();S("copy_closed",!menu());',
  ' canvas.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:10,isPrimary:true,button:0,buttons:1,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));',
  ' canvas.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:10,isPrimary:true,button:0,buttons:0,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));',
  ' S("left_still_draws",canvas.toDataURL()!==before);',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html tattoo context menu:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.gallery_prevented === true && s.gallery_menu.exists && s.gallery_menu.count === 1 &&
  s.gallery_menu.label === "Copy" && !s.gallery_menu.appKill && s.gallery_menu.topmost,
  "a built-in tattoo has only Copy", s.gallery_menu);
check(s.esc_closed === true, "Escape dismisses the tattoo menu");
check(s.right_did_not_draw === true, "right-click leaves the drawing unchanged");
check(s.canvas_prevented === true && s.canvas_menu.exists && s.canvas_menu.count === 1 &&
  s.canvas_menu.label === "Copy", "the drawn tattoo has only Copy", s.canvas_menu);
check(s.copy_closed === true, "choosing Copy dismisses the menu");
check(s.left_still_draws === true, "primary-button drawing still works");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

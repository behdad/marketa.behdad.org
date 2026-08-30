#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'function ctx(el,x,y){var r=el.getBoundingClientRect(),e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:x==null?r.left+r.width/2:x,clientY:y==null?r.top+r.height/2:y});return !el.dispatchEvent(e);}',
  'function menus(){return [].map.call(document.querySelectorAll(".mon-ctx,.console-ctx.show"),function(menu){return menu.textContent.trim();});}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  'window.__setLang("en");var splash=document.getElementById("click-me-overlay"),machine=document.getElementById("kitchen-lamarzocco");',
  'report.steps.splash={prevented:ctx(splash),present:!!document.getElementById("click-me-overlay"),menus:menus(),powered:machine.classList.contains("powered-on")};',
  'splash.dispatchEvent(new Event("touchstart",{bubbles:true,cancelable:true}));report.steps.splashHold={prevented:ctx(splash),present:!!document.getElementById("click-me-overlay"),menus:menus()};',
  'window.__endAttract();var pans=document.getElementById("kitchen-pans"),stage=document.getElementById("stage-kitchen");',
  'report.steps.prop={prevented:ctx(pans),menus:menus(),powered:machine.classList.contains("powered-on")};',
  'report.steps.scenery={prevented:ctx(stage),menus:menus(),powered:machine.classList.contains("powered-on")};',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));report.steps.enter={powered:machine.classList.contains("powered-on")};',
  'report.steps.outside={native:document.body.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:2,clientY:2})),menus:menus()};',
  'window.__goToStage("garden");window.__resetDrugsbox();var box=document.getElementById("garden-drugsbox");report.steps.local={prevented:ctx(box),menus:menus()};',
  '}catch(e){window.__errs.push(String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true });
if (!result) { console.log("scene context guard: no report"); process.exit(1); }
var s = result.steps || {}, failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + "   [" + JSON.stringify(detail) + "]"); }
}

console.log("rsvp.html scene context guard:");
check(s.splash && s.splash.prevented && s.splash.present && !s.splash.menus.length && !s.splash.powered,
  "right-click on the splash is consumed without opening a menu or operating Kitchen", s.splash);
check(s.splashHold && s.splashHold.prevented && s.splashHold.present && !s.splashHold.menus.length,
  "a touch-generated splash contextmenu is consumed without dismissing the splash", s.splashHold);
check(s.prop && s.prop.prevented && !s.prop.menus.length && !s.prop.powered &&
  s.scenery && s.scenery.prevented && !s.scenery.menus.length && !s.scenery.powered,
  "ordinary room props and scenery suppress browser chrome without exposing Solve", { prop: s.prop, scenery: s.scenery });
check(s.enter && s.enter.powered,
  "Enter remains the global next-step shortcut", s.enter);
check(s.outside && s.outside.native && !s.outside.menus.length,
  "outside the game viewport retains the native context menu", s.outside);
check(s.local && s.local.prevented && s.local.menus.length === 1 && s.local.menus[0] === "Unlock",
  "a supported prop still owns its intentional local context menu", s.local);
check(!result.errors.length, "no uncaught page errors", result.errors);

if (failures) process.exit(1);
console.log("\nScene context guard assertions passed.");

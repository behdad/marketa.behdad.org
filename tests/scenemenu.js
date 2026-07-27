#!/usr/bin/env node
"use strict";
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  "<script>",
  "(function(){",
  "var report={errors:[],steps:{}};",
  "function S(k,v){report.steps[k]=v;}",
  "function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "function ctx(el,x,y){var r=el.getBoundingClientRect(),e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:x==null?r.left+r.width/2:x,clientY:y==null?r.top+r.height/2:y});return !el.dispatchEvent(e);}",
  "function ctxView(el){var r=document.querySelector('.hunt-viewport').getBoundingClientRect();return ctx(el,r.left+r.width/2,r.top+r.height/2);}",
  "function items(){return window.__sceneContextMenu?window.__sceneContextMenu():[];}",
  "function button(cls){return document.querySelector('.scene-ctx '+cls);}",
  "async function run(){",
  "if(window.__endAttract)window.__endAttract();",
  "var pan=document.getElementById('kitchen-pans');",
  "S('kitchen_prevented',ctx(pan));S('kitchen_items',items());",
  "button('.ctx-hint').click();await sleep(20);S('hint_blinks',document.getElementById('hunt-caption').classList.contains('hint-blink'));",
  "var kitchenStage=document.getElementById('stage-kitchen');S('bare_prevented',ctx(kitchenStage));S('bare_items',items());button('.ctx-hint').click();",
  "S('outside_native',document.body.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:2,clientY:2})));S('outside_items',items());",
  "ctx(pan);button('.ctx-solve').click();S('solve_advanced',document.getElementById('kitchen-lamarzocco').classList.contains('powered-on'));",
  "window.goToStage('garden');await sleep(800);var guitar=document.getElementById('garden-guitar');",
  "S('garden_prevented',ctx(guitar));S('garden_items',items());button('.ctx-hint').click();S('garden_room',window.currentStageName);",
  "window.__secondRound=true;window.goToStage('office');await sleep(800);if(window.computer)window.computer(true);if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(20);",
  "var vp=document.querySelector('.hunt-viewport').getBoundingClientRect(),officeStage=document.getElementById('stage-office');S('layer_prevented',ctx(officeStage,vp.left+vp.width/2,vp.top+vp.height/2));S('layer_items',items());button('.ctx-escape').click();await sleep(30);S('escape_zoomed',window.__monitorZoomed&&window.__monitorZoomed());S('escape_room',window.currentStageName);",
  "window.goToStage('kitchen');await sleep(800);S('phase2_kitchen_prevented',ctxView(pan));S('phase2_kitchen_items',items());button('.ctx-hint').click();",
  "window.__secondRound=false;window.__setMaxUnlocked(0);document.documentElement.lang='cs';S('czech_prevented',ctxView(pan));S('czech_items',items());",
  "report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);",
  "}",
  "window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);});},400);});",
  "})();",
  "</script>"
].join("\n");

var rep = lib.runPageSync("rsvp.html", HARNESS, 10000, { patchRaf: true });
if (!rep) { console.log("scene context menu: no report"); process.exit(1); }
var s = rep.steps, fails = 0;
function check(name, ok, detail) {
  if (ok) console.log("  ✓ " + name);
  else { fails++; console.log("  ✗ " + name + " [" + JSON.stringify(detail) + "]"); }
}
console.log("scene context menu:");
check("phase-one kitchen offers Hint and Solve", s.kitchen_prevented && JSON.stringify(s.kitchen_items) === JSON.stringify(["Hint", "Solve"]), s.kitchen_items);
check("Hint re-emphasizes the room clue", s.hint_blinks === true, s.hint_blinks);
check("bare scenery gets the same game menu", s.bare_prevented && JSON.stringify(s.bare_items) === JSON.stringify(["Hint", "Solve"]), { prevented: s.bare_prevented, items: s.bare_items });
check("outside the loft retains the native menu", s.outside_native === true && !s.outside_items.length, { native: s.outside_native, items: s.outside_items });
check("Solve advances one guided step", s.solve_advanced === true, s.solve_advanced);
check("frontier menus never pan to the previous room", s.garden_prevented && JSON.stringify(s.garden_items) === JSON.stringify(["Hint", "Solve"]) && s.garden_room === "garden", { items: s.garden_items, room: s.garden_room });
check("a real layer exposes Escape and delegates to canonical behavior", s.layer_prevented && JSON.stringify(s.layer_items) === JSON.stringify(["Escape"]) && s.escape_zoomed === false && s.escape_room === "office", { items: s.layer_items, zoomed: s.escape_zoomed, room: s.escape_room });
check("without a layer, phase two omits Escape but keeps a useful fallback", s.phase2_kitchen_prevented && JSON.stringify(s.phase2_kitchen_items) === JSON.stringify(["Hint"]), { prevented: s.phase2_kitchen_prevented, items: s.phase2_kitchen_items });
check("Czech menu copy stays in parity", s.czech_prevented && JSON.stringify(s.czech_items) === JSON.stringify(["Nápověda", "Vyřešit"]), s.czech_items);
check("no uncaught page errors", !rep.errors.length, rep.errors);
process.exit(fails ? 1 : 0);

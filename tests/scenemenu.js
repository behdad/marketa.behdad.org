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
  "function ctx(el){var r=el.getBoundingClientRect(),e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+r.width/2,clientY:r.top+r.height/2});return !el.dispatchEvent(e);}",
  "function items(){return window.__sceneContextMenu?window.__sceneContextMenu():[];}",
  "function button(cls){return document.querySelector('.scene-ctx '+cls);}",
  "async function run(){",
  "if(window.__endAttract)window.__endAttract();",
  "var pan=document.getElementById('kitchen-pans');",
  "S('kitchen_prevented',ctx(pan));S('kitchen_items',items());",
  "button('.ctx-hint').click();await sleep(20);S('hint_blinks',document.getElementById('hunt-caption').classList.contains('hint-blink'));",
  "ctx(pan);button('.ctx-solve').click();S('solve_advanced',document.getElementById('kitchen-lamarzocco').classList.contains('powered-on'));",
  "S('bare_native',document.getElementById('stage-kitchen').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:2,clientY:2})));",
  "window.goToStage('garden');await sleep(20);var guitar=document.getElementById('garden-guitar');",
  "S('garden_prevented',ctx(guitar));S('garden_items',items());button('.ctx-back').click();S('back_room',window.currentStageName);",
  "window.__secondRound=true;window.goToStage('garden');await sleep(20);S('phase2_prevented',ctx(guitar));S('phase2_items',items());",
  "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));window.goToStage('kitchen');await sleep(20);",
  "S('phase2_kitchen_native',pan.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:4,clientY:4})));S('phase2_kitchen_items',items());",
  "window.__secondRound=false;window.__setMaxUnlocked(0);document.documentElement.lang='cs';S('czech_prevented',ctx(pan));S('czech_items',items());",
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
check("Solve advances one guided step", s.solve_advanced === true, s.solve_advanced);
check("bare scenery retains the native menu", s.bare_native === true, s.bare_native);
check("later frontier rooms add Back", s.garden_prevented && JSON.stringify(s.garden_items) === JSON.stringify(["Back", "Hint", "Solve"]) && s.back_room === "kitchen", { items: s.garden_items, room: s.back_room });
check("phase two keeps only contextual Back", s.phase2_prevented && JSON.stringify(s.phase2_items) === JSON.stringify(["Back"]), s.phase2_items);
check("phase-two kitchen retains the native menu", s.phase2_kitchen_native === true && !s.phase2_kitchen_items.length, { native: s.phase2_kitchen_native, items: s.phase2_kitchen_items });
check("Czech menu copy stays in parity", s.czech_prevented && JSON.stringify(s.czech_items) === JSON.stringify(["Nápověda", "Vyřešit"]), s.czech_items);
check("no uncaught page errors", !rep.errors.length, rep.errors);
process.exit(fails ? 1 : 0);

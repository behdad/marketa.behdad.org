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
  "function closeMenus(){if(window.__closeSceneContextMenu)window.__closeSceneContextMenu();document.dispatchEvent(new MouseEvent('mousedown',{bubbles:true,cancelable:true}));}",
  "async function hold(el,id){closeMenus();var r=el.getBoundingClientRect(),x=r.left+Math.max(1,r.width/2),y=r.top+Math.max(1,r.height/2);el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:x,clientY:y}));await sleep(420);el.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerId:id,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y}));return {scene:items(),app:!!document.querySelector('.mon-ctx:not(.scene-ctx),.console-ctx.show')};}",
  "async function run(){",
  "if(window.__endAttract)window.__endAttract();",
  "var pan=document.getElementById('kitchen-pans');",
  "S('kitchen_prevented',ctx(pan));S('kitchen_items',items());",
  "var kitchenStage=document.getElementById('stage-kitchen');S('bare_prevented',ctx(kitchenStage));S('bare_items',items());closeMenus();",
  "S('outside_native',document.body.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:2,clientY:2})));S('outside_items',items());",
  "ctx(pan);button('.ctx-solve').click();S('solve_advanced',document.getElementById('kitchen-lamarzocco').classList.contains('powered-on'));",
  "window.__goToStage('garden');await sleep(800);var guitar=document.getElementById('garden-guitar');",
  "S('garden_prevented',ctx(guitar));S('garden_items',items());closeMenus();S('garden_room',window.__currentStageName);",
  "window.__secondRound=true;window.__goToStage('office');await sleep(800);if(window.__loftControllers.computer)window.__loftControllers.computer.set(true);if(window.__monitorZoomIn)window.__monitorZoomIn();await sleep(20);",
  "var vp=document.querySelector('.hunt-viewport').getBoundingClientRect(),officeStage=document.getElementById('stage-office');S('layer_prevented',ctx(officeStage,vp.left+vp.width/2,vp.top+vp.height/2));S('layer_items',items());S('layer_zoomed',window.__monitorZoomed&&window.__monitorZoomed());",
  "window.__goToStage('kitchen');await sleep(800);S('phase2_kitchen_prevented',ctxView(pan));S('phase2_kitchen_items',items());",
  "window.__secondRound=false;window.__setMaxUnlocked(0);document.documentElement.lang='cs';S('czech_prevented',ctxView(pan));S('czech_items',items());",
  "document.documentElement.lang='en';closeMenus();S('touch_positive',await hold(kitchenStage,801));",
  "closeMenus();window.__flairTest(1,16);S('flair_live',window.__flairState().active);S('flair_hold',await hold(kitchenStage,802));window.__flairStop();",
  "window.__goToStage('office');await sleep(60);var officeStage=document.getElementById('stage-office');window.__arcadeTest(1,16);S('invaders_live',window.__arcadeState().active);S('invaders_hold',await hold(officeStage,803));window.__arcadeStop();",
  "window.__goToStage('balcony');await sleep(60);window.__startBalconyTetris();var tetrisUi=document.getElementById('balcony-tetris-ui');S('tetris_live',window.__balconyTetrisState().active);S('tetris_hold',await hold(tetrisUi,804));window.__stopBalconyTetris();",
  "window.__goToStage('office');await sleep(60);var monitor=document.getElementById('office-monitor');monitor.classList.add('screen-on','show-caps');window.__unlockPacman(true);await sleep(80);var pacman=document.getElementById('monitor-pacman-wrap');S('pacman_live',monitor.classList.contains('show-pacman'));S('pacman_hold',await hold(pacman,805));if(window.__closeMonitorPacman)window.__closeMonitorPacman();",
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
check("phase-one kitchen offers Solve without a generic Hint", s.kitchen_prevented && JSON.stringify(s.kitchen_items) === JSON.stringify(["Solve"]), s.kitchen_items);
check("bare scenery gets the same one-action menu", s.bare_prevented && JSON.stringify(s.bare_items) === JSON.stringify(["Solve"]), { prevented: s.bare_prevented, items: s.bare_items });
check("outside the loft retains the native menu", s.outside_native === true && !s.outside_items.length, { native: s.outside_native, items: s.outside_items });
check("Solve advances one guided step", s.solve_advanced === true, s.solve_advanced);
check("frontier menus never pan to the previous room", s.garden_prevented && JSON.stringify(s.garden_items) === JSON.stringify(["Solve"]) && s.garden_room === "garden", { items: s.garden_items, room: s.garden_room });
check("a real layer suppresses the native menu without offering a no-op Escape action", s.layer_prevented && !s.layer_items.length && s.layer_zoomed === true, { items: s.layer_items, zoomed: s.layer_zoomed });
check("a solved scene suppresses the native menu without showing an empty custom menu", s.phase2_kitchen_prevented && !s.phase2_kitchen_items.length, { prevented: s.phase2_kitchen_prevented, items: s.phase2_kitchen_items });
check("Czech menu copy stays in parity", s.czech_prevented && JSON.stringify(s.czech_items) === JSON.stringify(["Vyřešit"]), s.czech_items);
check("ordinary touch holds still reach the contextual Solve action", s.touch_positive && JSON.stringify(s.touch_positive.scene) === JSON.stringify(["Solve"]) && !s.touch_positive.app, s.touch_positive);
check("Flair Catch touch holds stay in the action game", s.flair_live && s.flair_hold && !s.flair_hold.scene.length && !s.flair_hold.app, s.flair_hold);
check("Alien Resources touch holds stay in the action game", s.invaders_live && s.invaders_hold && !s.invaders_hold.scene.length && !s.invaders_hold.app, s.invaders_hold);
check("Block Party touch holds stay in the action game", s.tetris_live && s.tetris_hold && !s.tetris_hold.scene.length && !s.tetris_hold.app, s.tetris_hold);
check("Hack-Man touch holds stay in the action game", s.pacman_live && s.pacman_hold && !s.pacman_hold.scene.length && !s.pacman_hold.app, s.pacman_hold);
check("no uncaught page errors", !rep.errors.length, rep.errors);
process.exit(fails ? 1 : 0);

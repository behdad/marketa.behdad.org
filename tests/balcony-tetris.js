#!/usr/bin/env node
// Across-the-street apartment lights + hidden Window Tetris regression.
// Proves the 5x8 physical facade / 10x16 game mapping, independent manual and
// ambient lights, same-window launch gesture, keyboard ownership, scoring,
// persistence, and teardown restoration.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k){var e=new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true});return !document.dispatchEvent(e);}',
  'function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}',
  'function clicks(el,n){for(var i=0;i<n;i++)el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{},debug:{}};function S(k,v){report.steps[k]=!!v;}',
  'async function run(){',
  'localStorage.removeItem("balconyTetrisHigh");',
  'window.goToStage("balcony");await sleep(40);',
  'var grid=document.getElementById("balcony-building-window-grid"),apartments=[].slice.call(grid.querySelectorAll(".balcony-building-window")),cells=[].slice.call(grid.querySelectorAll(".balcony-building-cell"));',
  'S("facade_shape",apartments.length===40&&cells.length===160&&Math.max.apply(null,cells.map(function(c){return +c.dataset.tetrisRow;}))===15&&Math.max.apply(null,cells.map(function(c){return +c.dataset.tetrisCol;}))===9);',
  'var before=window.__balconyTetrisState().windows.slice();clicks(apartments[7],1);var afterOne=window.__balconyTetrisState().windows.slice(),diff=afterOne.filter(function(v,i){return v!==before[i];}).length;',
  'S("single_window",diff===1&&afterOne[7]!==before[7]&&!window.__balconyTetrisState().active);',
  'var beforeAmbient=afterOne.slice();window.__balconyTetrisTest("ambient");var afterAmbient=window.__balconyTetrisState().windows.slice();',
  'S("ambient_individual",afterAmbient.filter(function(v,i){return v!==beforeAmbient[i];}).length===1&&!window.__balconyTetrisState().active);',
  'var focused=false,unattendedBefore=afterAmbient.slice();document.hasFocus=function(){return focused;};window.__balconyTetrisTest("ambient");',
  'S("ambient_unattended",same(unattendedBefore,window.__balconyTetrisState().windows));focused=true;document.hasFocus=function(){return focused;};',
  'var preGame=window.__balconyTetrisState().windows.slice(),preCaption=window.__captionKey&&window.__captionKey();clicks(apartments[11],2);S("two_clicks_inert",!window.__balconyTetrisState().active);clicks(apartments[11],1);await sleep(30);',
  'var started=window.__balconyTetrisState();S("same_window_launch",started.active&&started.board.length===16&&started.board.every(function(r){return r.length===10;})&&document.getElementById("stage-balcony").classList.contains("tetris-on"));',
  'var gameNormal=started.windows.slice();S("three_clicks_toggle",gameNormal[11]!==preGame[11]&&gameNormal.filter(function(v,i){return v!==preGame[i];}).length===1);',
  'var nightBefore=document.getElementById("stage-balcony").classList.contains("dusk"),p0=started.piece,downPrevented=key("ArrowDown"),p1=window.__balconyTetrisState().piece,rotatePrevented=key("ArrowUp"),p2=window.__balconyTetrisState().piece;',
  'S("keys_captured",downPrevented&&rotatePrevented&&p1.y>=p0.y&&p2.rotation!==p1.rotation&&document.getElementById("stage-balcony").classList.contains("dusk")===nightBefore);',
  'var b=new Array(16).fill(null).map(function(){return new Array(10).fill(null);});for(var c=0;c<8;c++)b[15][c]="z";window.__balconyTetrisTest("set",{board:b,piece:{type:"o",rotation:0,x:8,y:14},score:0,lines:0});var dropPrevented=key(" ");var cleared=window.__balconyTetrisState();',
  'report.debug.cleared={active:cleared.active,lines:cleared.lines,score:cleared.score,high:cleared.high,piece:cleared.piece};',
  'S("line_scoring",dropPrevented&&cleared.active&&cleared.lines===1&&cleared.score===100&&cleared.high===100);',
  'apartments[39].classList.add("lit");stage=document.getElementById("stage-balcony");stage.classList.add("dusk");window.__balconyTetrisTest("set",{board:b,piece:{type:"o",rotation:0,x:8,y:14},score:0,lines:0});var nightCell=grid.querySelector("[data-tetris-row=\\"14\\"][data-tetris-col=\\"8\\"]");S("night_piece_color",getComputedStyle(nightCell).fill==="rgb(229, 196, 81)");stage.classList.remove("dusk");',
  'window.__balconyTetrisTest("gameover");var over=window.__balconyTetrisState(),stage=document.getElementById("stage-balcony");',
  'report.debug.over={active:over.active,result:over.result,high:over.high,same:same(over.windows,preGame),on:stage.classList.contains("tetris-on"),resultClass:stage.classList.contains("tetris-result")};',
  'S("gameover_restores",!over.active&&over.result&&same(over.windows,gameNormal)&&!stage.classList.contains("tetris-on")&&stage.classList.contains("tetris-result")&&over.high===100);',
  'S("gameover_caption",window.__captionKey&&window.__captionKey()==="tetris_game_over");',
  'var restartPrevented=key("Enter"),restarted=window.__balconyTetrisState();S("enter_restarts",restartPrevented&&restarted.active&&restarted.score===0&&restarted.high===100);',
  'report.debug.restarted={prevented:restartPrevented,active:restarted.active,score:restarted.score,high:restarted.high};',
  'window.setLang("cs");S("czech_hud",document.querySelector(".tetris-title").textContent==="OKENNÍ TETRIS"&&document.querySelector(".tetris-score-label").textContent==="SKÓRE");',
  'var exitPrevented=key("Escape"),exited=window.__balconyTetrisState();S("escape_restores",exitPrevented&&!exited.active&&!exited.result&&same(exited.windows,gameNormal)&&!stage.classList.contains("tetris-on")&&window.__captionKey&&window.__captionKey()===preCaption);',
  'window.setLang("en");var beforeLeave=window.__balconyTetrisState().windows.slice();window.__startBalconyTetris();window.goToStage("kitchen");var left=window.__balconyTetrisState();S("room_leave_restores",!left.active&&!left.result&&!stage.classList.contains("tetris-on")&&same(left.windows,beforeLeave));',
  'window.goToStage("balcony");var beforeBlur=window.__balconyTetrisState().windows.slice();window.__startBalconyTetris();focused=false;window.dispatchEvent(new Event("blur"));var blurred=window.__balconyTetrisState();S("blur_restores",!blurred.active&&!stage.classList.contains("tetris-on")&&same(blurred.windows,beforeBlur));',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness:"+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) {
  failures++;
  console.log("  ✗ " + msg);
  if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
}

console.log("rsvp.html balcony Window Tetris:");
var r = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!r) fail("harness reported");
else {
  var checks = {
    facade_shape: "facade is 5x8 physical windows backed by a 10x16 cell board",
    single_window: "one click toggles only that apartment and does not launch",
    ambient_individual: "ambient controller changes one apartment at a time",
    ambient_unattended: "ambient controller changes nothing while unfocused",
    two_clicks_inert: "two rapid clicks on one apartment do not launch early",
    same_window_launch: "third rapid click on the same apartment launches the game",
    three_clicks_toggle: "three launch clicks preserve the final manual apartment toggle",
    keys_captured: "movement/rotation keys are captured before room navigation",
    line_scoring: "hard drop completes a line, scores it, and banks the high score",
    night_piece_color: "active piece colors outrank lit-apartment dusk styling",
    gameover_restores: "game over restores facade lights and releases the scene modal",
    gameover_caption: "game over exposes the restart instruction",
    enter_restarts: "Enter restarts from the result state without losing the high score",
    czech_hud: "live HUD copy follows the Czech language switch",
    escape_restores: "Escape exits and restores the exact apartment-light/caption snapshot",
    room_leave_restores: "programmatic room leave tears down and restores synchronously",
    blur_restores: "window blur tears down without background simulation"
  };
  Object.keys(checks).forEach(function (key) {
    if (r.steps[key]) pass(checks[key]);
    else fail(checks[key], JSON.stringify({ steps: r.steps, debug: r.debug }));
  });
  if (r.errors.length === 0) pass("no uncaught JS errors");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

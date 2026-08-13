#!/usr/bin/env node
// Across-the-street apartment lights + hidden Block Party regression.
// Proves the 5x8 physical facade / 10x16 game mapping, ambient lights,
// single-click launch, mouse/touch/keyboard ownership,
// scoring, persistence, and teardown restoration.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k){var e=new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true});return !document.dispatchEvent(e);}',
  'function pointer(el,type,x,y,id){el.dispatchEvent(new PointerEvent(type,{pointerId:id||1,pointerType:"mouse",button:0,buttons:type==="pointerup"?0:1,clientX:x,clientY:y,bubbles:true,cancelable:true}));}',
  'function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}',
  'function clicks(el,n){for(var i=0;i<n;i++)el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{},debug:{}};function S(k,v){report.steps[k]=!!v;}',
  'async function run(){',
  'localStorage.removeItem("balconyTetrisHigh");',
  'window.__goToStage("balcony");await sleep(40);',
  'var grid=document.getElementById("balcony-building-window-grid"),apartments=[].slice.call(grid.querySelectorAll(".balcony-building-window")),cells=[].slice.call(grid.querySelectorAll(".balcony-building-cell"));',
  'S("facade_shape",apartments.length===40&&cells.length===160&&Math.max.apply(null,cells.map(function(c){return +c.dataset.tetrisRow;}))===15&&Math.max.apply(null,cells.map(function(c){return +c.dataset.tetrisCol;}))===9);',
  'var beforeAmbient=window.__balconyTetrisState().windows.slice();window.__balconyTetrisTest("ambient");var afterAmbient=window.__balconyTetrisState().windows.slice();',
  'S("ambient_individual",afterAmbient.filter(function(v,i){return v!==beforeAmbient[i];}).length===1&&!window.__balconyTetrisState().active);',
  'var focused=false,unattendedBefore=afterAmbient.slice();document.hasFocus=function(){return focused;};window.__balconyTetrisTest("ambient");',
  'S("ambient_unattended",same(unattendedBefore,window.__balconyTetrisState().windows));focused=true;document.hasFocus=function(){return focused;};',
  'var cameoBase=window.__balconyTetrisState().windows.slice(),cameos=window.__balconyTetrisTest("cameos");S("idle_cameos",cameos.attract===4&&cameos.watchers===1&&cameos.state.attract===0&&cameos.state.watchers===0&&same(cameoBase,cameos.state.windows));',
  'var policy=window.__balconyTetrisTest("watcher-policy");S("population_watchers",policy.empty===0&&policy.couple>0&&policy.crowd>.9&&policy.crowd>policy.couple);',
  'var preGame=window.__balconyTetrisState().windows.slice(),preCaption=window.__captionKey&&window.__captionKey();clicks(apartments[11],1);await sleep(30);',
  'var started=window.__balconyTetrisState();S("single_click_launch",started.active&&started.board.length===16&&started.board.every(function(r){return r.length===10;})&&document.getElementById("stage-balcony").classList.contains("tetris-on"));',
  'S("desktop_keyboard_hint",document.querySelector(".tetris-status").textContent==="← → MOVE · ↑ ROTATE · SPACE DROP"&&window.__captionKey&&window.__captionKey()==="tetris_hint");',
  'var gameNormal=started.windows.slice();S("single_click_preserves",gameNormal.every(function(v,i){return v===preGame[i];}));',
  'window.__resetActTwo();window.__armActTwo(true);var actBefore=window.__actTwoState();for(var ti=0;ti<20;ti++)window.__actTwoTick();var actAfter=window.__actTwoState();S("party_timer_paused",actBefore.beat==="act_b2"&&actAfter.beat===actBefore.beat&&actAfter.elapsed===actBefore.elapsed);window.__resetActTwo();if(preCaption&&window.__setCaption)window.__setCaption(preCaption);',
  'var speedBoard=new Array(16).fill(null).map(function(){return new Array(10).fill(null);}),speedPiece={type:"i",rotation:0,x:3,y:0};window.__balconyTetrisTest("set",{board:speedBoard,piece:speedPiece,score:0,lines:9});var speed0=window.__balconyTetrisState();window.__balconyTetrisTest("set",{board:speedBoard,piece:speedPiece,score:0,lines:10});var speed1=window.__balconyTetrisState();window.__balconyTetrisTest("set",{board:speedBoard,piece:speedPiece,score:0,lines:80});var speed8=window.__balconyTetrisState();window.__balconyTetrisTest("set",{board:speedBoard,piece:speedPiece,score:0,lines:290});var speed29=window.__balconyTetrisState();S("level_speed",speed0.level===0&&speed0.gravityMs===800&&speed1.level===1&&speed1.gravityMs===717&&speed8.level===8&&speed8.gravityMs===133&&speed29.level===29&&speed29.gravityMs===17);window.__balconyTetrisTest("set",{board:speedBoard,piece:speedPiece,score:0,lines:0});',
  'var touch0=window.__balconyTetrisState().piece,touchLeft=window.__balconyTetrisTest("touch",{dx:-36,dy:2,ms:300}),touchRot=window.__balconyTetrisTest("touch",{dx:2,dy:2,ms:90});',
  'S("touch_controls",touchLeft.gesture==="left"&&touchLeft.state.piece.x<touch0.x&&touchRot.gesture==="rotate"&&touchRot.state.piece.rotation!==touchLeft.state.piece.rotation);',
  'window.__balconyTetrisTest("set",{board:new Array(16).fill(null).map(function(){return new Array(10).fill(null);}),piece:{type:"i",rotation:0,x:4,y:0},score:0,lines:0});',
  'window.__balconyTetrisTest("touch-begin",{x:100,y:100,at:1000});var liveOne=window.__balconyTetrisTest("touch-move",{x:64,y:102}),liveMany=window.__balconyTetrisTest("touch-move",{x:20,y:104}),liveReverse=window.__balconyTetrisTest("touch-move",{x:70,y:103}),liveEnd=window.__balconyTetrisTest("touch-end",{x:70,y:103,at:1300});',
  'S("touch_tracks_live",liveOne.state.piece.x===3&&liveMany.state.piece.x===1&&liveReverse.state.piece.x===3&&liveEnd.state.piece.x===3&&liveEnd.gesture==="left");',
  'var ui=document.getElementById("balcony-tetris-ui");window.__balconyTetrisTest("set",{board:new Array(16).fill(null).map(function(){return new Array(10).fill(null);}),piece:{type:"i",rotation:0,x:4,y:0},score:0,lines:0});',
  'pointer(ui,"pointerdown",200,200,7);pointer(ui,"pointermove",164,202,7);pointer(ui,"pointermove",120,204,7);pointer(ui,"pointermove",170,203,7);pointer(ui,"pointerup",170,203,7);var mouseDrag=window.__balconyTetrisState();',
  'pointer(ui,"pointerdown",200,200,8);pointer(ui,"pointerup",203,202,8);var mouseClick=window.__balconyTetrisState();',
  'S("mouse_move_rotate",mouseDrag.piece.x===3&&mouseDrag.piece.rotation===0&&mouseClick.piece.x===3&&mouseClick.piece.rotation===1);',
  'window.__balconyTetrisTest("set",{board:new Array(16).fill(null).map(function(){return new Array(10).fill(null);}),piece:{type:"o",rotation:0,x:4,y:0},score:0,lines:0});pointer(ui,"pointerdown",200,100,9);pointer(ui,"pointermove",202,130,9);pointer(ui,"pointerup",202,130,9);var mouseSoft=window.__balconyTetrisState();pointer(ui,"pointerdown",200,100,10);pointer(ui,"pointermove",202,200,10);pointer(ui,"pointerup",202,200,10);var mouseHard=window.__balconyTetrisState();',
  'S("mouse_drop",mouseSoft.piece.y>0&&mouseSoft.score>0&&mouseHard.score>mouseSoft.score);',
  'document.querySelector(".tetris-close").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));S("close_button",!window.__balconyTetrisState().active);window.__startBalconyTetris();',
  'var nightBefore=document.getElementById("stage-balcony").classList.contains("dusk"),p0=started.piece,downPrevented=key("ArrowDown"),p1=window.__balconyTetrisState().piece,rotatePrevented=key("ArrowUp"),p2=window.__balconyTetrisState().piece;',
  'S("keys_captured",downPrevented&&rotatePrevented&&p1.y>=p0.y&&p2.rotation!==p1.rotation&&document.getElementById("stage-balcony").classList.contains("dusk")===nightBefore);',
  'var b=new Array(16).fill(null).map(function(){return new Array(10).fill(null);});for(var c=0;c<8;c++)b[15][c]="z";window.__balconyTetrisTest("set",{board:b,piece:{type:"o",rotation:0,x:8,y:14},score:0,lines:0});window.__musicPaused=true;var dropPrevented=key(" ");var musicStayedPaused=window.__musicPaused===true;window.__musicPaused=false;var cleared=window.__balconyTetrisState();',
  'report.debug.cleared={active:cleared.active,lines:cleared.lines,score:cleared.score,high:cleared.high,piece:cleared.piece};',
  'S("line_scoring",dropPrevented&&cleared.active&&cleared.lines===1&&cleared.score===100&&cleared.high===100);',
  'S("space_music_isolation",musicStayedPaused);',
  'apartments[39].classList.add("lit");stage=document.getElementById("stage-balcony");stage.classList.add("dusk");window.__balconyTetrisTest("set",{board:b,piece:{type:"o",rotation:0,x:8,y:14},score:0,lines:0});var nightCell=grid.querySelector("[data-tetris-row=\\"14\\"][data-tetris-col=\\"8\\"]");S("night_piece_color",getComputedStyle(nightCell).fill==="rgb(242, 210, 56)");stage.classList.remove("dusk");',
  'window.__balconyTetrisTest("gameover");var over=window.__balconyTetrisState(),stage=document.getElementById("stage-balcony");',
  'report.debug.over={active:over.active,result:over.result,high:over.high,same:same(over.windows,preGame),on:stage.classList.contains("tetris-on"),resultClass:stage.classList.contains("tetris-result")};',
  'S("gameover_restores",!over.active&&over.result&&same(over.windows,gameNormal)&&!stage.classList.contains("tetris-on")&&stage.classList.contains("tetris-result")&&over.high===100);',
  'S("gameover_caption",window.__captionKey&&window.__captionKey()==="tetris_game_over");',
  'var touchRestart=window.__balconyTetrisTest("touch",{dx:0,dy:0,ms:80});S("touch_restarts",touchRestart.gesture==="restart"&&touchRestart.state.active&&touchRestart.state.score===0);window.__balconyTetrisTest("gameover");',
  'var restartPrevented=key("Enter"),restarted=window.__balconyTetrisState();S("enter_restarts",restartPrevented&&restarted.active&&restarted.score===0&&restarted.high===100);',
  'report.debug.restarted={prevented:restartPrevented,active:restarted.active,score:restarted.score,high:restarted.high};',
  'window.__setLang("cs");S("czech_hud",document.querySelector(".tetris-title").textContent==="BLOCK PARTY"&&document.querySelector(".tetris-score-label").textContent==="SKÓRE");',
  'var exitPrevented=key("Escape"),exited=window.__balconyTetrisState();S("escape_restores",exitPrevented&&!exited.active&&!exited.result&&same(exited.windows,gameNormal)&&!stage.classList.contains("tetris-on")&&window.__captionKey&&window.__captionKey()===preCaption);',
  'window.__setLang("en");var beforeLeave=window.__balconyTetrisState().windows.slice();window.__startBalconyTetris();window.__goToStage("kitchen");var left=window.__balconyTetrisState();S("room_leave_restores",!left.active&&!left.result&&!stage.classList.contains("tetris-on")&&same(left.windows,beforeLeave));',
  'window.__goToStage("balcony");var beforeBlur=window.__balconyTetrisState().windows.slice();window.__startBalconyTetris();focused=false;window.dispatchEvent(new Event("blur"));var blurred=window.__balconyTetrisState();S("blur_restores",!blurred.active&&!stage.classList.contains("tetris-on")&&same(blurred.windows,beforeBlur));',
  'focused=true;window.dispatchEvent(new Event("focus"));window.__goToStage("balcony");window.__startBalconyTetris();window.__balconyTetrisTest("gameover");focused=false;window.dispatchEvent(new Event("blur"));await sleep(6800);var parkedResult=window.__balconyTetrisState(),parkedSchedule=window.__attentionScheduleState();S("result_attended_pause",parkedResult.result&&window.__captionKey()==="tetris_game_over"&&parkedSchedule.jobs.some(function(job){return job.owner==="minigame-tetris-result"&&!job.running;}));focused=true;window.dispatchEvent(new Event("focus"));await sleep(6600);S("result_attended_resume",!window.__balconyTetrisState().result&&window.__captionKey()!=="tetris_game_over");',
  'window.__goToStage("kitchen");window.__openDropTerm();var commandRun=window.loft.minigame.start("block-party");await commandRun;await sleep(100);var commandStarted=window.__balconyTetrisState();S("console_command",window.__currentStageName==="balcony"&&commandStarted.active&&commandRun&&typeof commandRun.then==="function");var consoleStayed=window.__dropTermOpen(),backtickPrevented=key("`");S("console_handoff",consoleStayed&&backtickPrevented&&!window.__dropTermOpen()&&window.__balconyTetrisState().active);document.querySelector(".tetris-close").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
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

console.log("rsvp.html balcony Block Party:");
var r = lib.runPageSync("rsvp.html", HARNESS, 20000, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!r) fail("harness reported");
else {
  var checks = {
    facade_shape: "facade is 5x8 physical windows backed by a 10x16 cell board",
    ambient_individual: "ambient controller changes one apartment at a time",
    ambient_unattended: "ambient controller changes nothing while unfocused",
    idle_cameos: "idle facade previews a tetromino and party-watcher silhouettes without changing apartment state",
    population_watchers: "watcher frequency rises with the balcony's live population",
    single_click_launch: "one apartment click launches the game",
    desktop_keyboard_hint: "a fine-pointer desktop advertises keyboard controls before mouse gestures",
    single_click_preserves: "the launch click preserves the original window lights",
    party_timer_paused: "the automatic party countdown pauses while Tetris is active",
    level_speed: "ten-line levels follow the classic NES 48→43→…→1 frame gravity curve",
    touch_controls: "tap rotates and a horizontal swipe moves the active piece",
    touch_tracks_live: "horizontal touch dragging follows crossed columns, reverses, and does not replay on release",
    mouse_move_rotate: "horizontal mouse dragging follows and reverses live without rotating on release; a click rotates",
    mouse_drop: "downward mouse drags soft-drop and hard-drop the active piece",
    close_button: "the visible close button exits the game",
    keys_captured: "movement/rotation keys are captured before room navigation",
    line_scoring: "hard drop completes a line, scores it, and banks the high score",
    space_music_isolation: "Tetris hard drop does not toggle the global music transport",
    night_piece_color: "active piece colors outrank lit-apartment dusk styling",
    gameover_restores: "game over restores facade lights and releases the scene modal",
    gameover_caption: "game over exposes the restart instruction",
    touch_restarts: "a tap restarts from the touch result state",
    enter_restarts: "Enter restarts from the result state without losing the high score",
    czech_hud: "live HUD copy follows the Czech language switch",
    escape_restores: "Escape exits and restores the exact apartment-light/caption snapshot",
    room_leave_restores: "programmatic room leave tears down and restores synchronously",
    blur_restores: "window blur tears down without background simulation",
    result_attended_pause: "game-over result and restart instruction park while unfocused",
    result_attended_resume: "game-over result consumes its remaining attended time after refocus",
    console_command: "loft.minigame.start('block-party') pans to the balcony, starts Block Party, and returns a Promise",
    console_handoff: "the typed Block Party action leaves the console open and backtick can close it without ending the game"
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

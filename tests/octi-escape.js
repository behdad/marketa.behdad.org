#!/usr/bin/env node
// Octi's optional cushion game must not steal his solve click or trunk ownership.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function key(target,k){var e=new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true});return !target.dispatchEvent(e);}',
  'var report={errors:[],steps:{},debug:{}};var focused=true;Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});function S(k,v){report.steps[k]=!!v;}',
  'async function run(){',
  ' window.goToStage("cuddly");await sleep(50);',
  ' var octi=document.getElementById("cuddly-octopus"),trunk=document.getElementById("cuddly-trunk"),stage=document.getElementById("stage-cuddly"),peek=document.getElementById("cuddly-octi-escape-peek"),pillows=[0,1,2].map(function(i){return document.getElementById("cuddly-pillow-"+(i+1));});',
  ' click(octi);click(octi);await sleep(90);var first=window.__octiEscapeState();S("solve_click_protected",octi.classList.contains("played")&&!first.active&&!stage.classList.contains("octi-escape-on"));',
  ' var before=window.__captionKey();click(octi);await sleep(20);var invited=window.__captionKey(),armed=window.__octiEscapeState();click(octi);await sleep(50);var started=window.__octiEscapeState();',
  ' S("repeat_launch",invited==="octi_escape_invite"&&started.active&&started.phase==="dashing"&&!started.inside&&stage.classList.contains("octi-escape-on")&&octi.classList.contains("escape-running"));',
  ' await sleep(1800);var ready=window.__octiEscapeState(),target=ready.target;',
  ' S("native_peek",ready.active&&ready.phase==="guess"&&target>=0&&target<3&&peek.nextElementSibling===document.getElementById("cuddly-bolster")&&getComputedStyle(peek).pointerEvents==="none");',
  ' window.__octiEscapeTest("target",2);target=2;var squishes=0,oldSquish=window.playPlushSquishSound;window.playPlushSquishSound=function(){squishes++;};var p1=pillows[0].getBoundingClientRect();document.getElementById("cuddly-marketa").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,clientX:p1.left+p1.width/2,clientY:p1.top+6}));await sleep(50);var missed=window.__octiEscapeState();window.playPlushSquishSound=oldSquish;',
  ' S("wrong_squishes_once",squishes===1&&missed.active&&missed.finds===0&&missed.target===target&&window.__captionKey()==="octi_escape_wrong");',
  ' await sleep(1000);click(pillows[target]);await sleep(60);var one=window.__octiEscapeState();',
  ' window.__octiEscapeTest("target",1);click(pillows[1]);await sleep(60);var two=window.__octiEscapeState();',
  ' window.__octiEscapeTest("target",2);click(pillows[2]);focused=false;window.dispatchEvent(new Event("blur"));await sleep(2300);var pausedWin={state:window.__octiEscapeState(),caption:window.__captionKey(),scheduler:window.__attentionScheduleState()};focused=true;window.dispatchEvent(new Event("focus"));await sleep(2300);var won=window.__octiEscapeState(),wonCaption=window.__captionKey();',
  ' S("three_find_win",two.finds===2&&!won.active&&!won.inside&&!stage.classList.contains("octi-escape-on")&&!octi.classList.contains("escape-running")&&!octi.classList.contains("escape-returning")&&!octi.classList.contains("in-chest")&&!peek.classList.contains("peeking")&&!peek.classList.contains("found")&&window.__captionKey()==="octi_escape_win");',
  ' window.setCaption("explore_cuddly",true);window.__startOctiEscape();var escapePrevented=key(document,"Escape"),cancelled=window.__octiEscapeState();',
  ' S("escape_first",escapePrevented&&!cancelled.active&&!cancelled.inside&&window.__captionKey()==="explore_cuddly");',
  ' window.__startOctiEscape();window.__octiCheckpointRestore({inside:true});var restored=window.__octiEscapeState();',
  ' S("checkpoint_cancels",!restored.active&&restored.inside&&octi.classList.contains("in-chest")&&!stage.classList.contains("octi-escape-on"));',
  ' window.__octiCheckpointRestore({inside:false});window.__startOctiEscape();window.goToStage("kitchen");var left=window.__octiEscapeState();',
  ' S("room_leave_cancels",!left.active&&!left.inside&&!octi.classList.contains("in-chest")&&!stage.classList.contains("octi-escape-on"));',
  ' window.goToStage("cuddly");window.__startOctiEscape();click(trunk);var trunked=window.__octiEscapeState();',
  ' S("trunk_keeps_toggle",!trunked.active&&trunked.inside&&octi.classList.contains("falling-in"));',
  ' window.resetOctopusChest();var reset=window.__octiEscapeState(),resetJobs=window.__attentionScheduleState().jobs.filter(function(job){return /^minigame-octi/.test(job.owner);});',
  ' S("reset_settles",!reset.active&&!reset.inside&&!octi.classList.contains("played")&&!octi.classList.contains("in-chest")&&!octi.classList.contains("falling-in")&&resetJobs.length===0);',
  ' S("win_coda_attended",pausedWin.state.active&&pausedWin.caption==="octi_escape_win"&&pausedWin.scheduler.running===0&&!won.active&&wonCaption==="octi_escape_win");',
  ' report.debug={before:before,invited:invited,armed:armed,started:started,ready:ready,missed:missed,one:one,two:two,pausedWin:pausedWin,won:won};',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else {
    failures++;
    console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html Octi's Escape:");
var r = lib.runPageSync("loft-day.html", HARNESS, 13000, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var checks = {
  solve_click_protected: "the first solve squeeze and a fast repeat cannot launch the optional game",
  repeat_launch: "two later nearby squeezes launch from Octi without changing trunk ownership",
  native_peek: "the clue is pointer-inert and painted behind the room's real cushions",
  wrong_squishes_once: "the foreground-covered cushion keeps one ordinary squish and does not advance",
  three_find_win: "three finds return Octi to his canonical outside trunk perch",
  win_coda_attended: "the win coda parks while unfocused and resumes without losing its result",
  escape_first: "Escape cancels first and restores the pregame caption/state",
  checkpoint_cancels: "checkpoint recovery cancels the transient game before restoring inside state",
  room_leave_cancels: "leaving the room synchronously restores the outside state",
  trunk_keeps_toggle: "a trunk click cancels, then performs its ordinary inside toggle",
  reset_settles: "a full Octi reset clears the game and all transient classes"
};
Object.keys(checks).forEach(function (key) { check(r.steps[key], checks[key], r.debug); });
check(r.errors.length === 0, "no uncaught JS errors", r.errors);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

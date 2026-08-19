#!/usr/bin/env node
// Laptop saver fixed-order rotation + attended lifecycle.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'var focused=true;Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(920);window.__resetLaptop();',
  ' var laptop=document.getElementById("office-laptop");window.__restoreCheckpointSystems({laptop:{open:true,zoomed:false}},"beforeStage");window.__restoreCheckpointSystems({laptop:{open:true,zoomed:false}},"afterStage");await sleep(8100);S("continued",{open:laptop.classList.contains("open"),show:laptop.classList.contains("show-saver"),zoomed:window.__laptopZoomed(),state:window.__laptopSaverState()});window.__resetLaptop();laptop.classList.add("open");',
  ' var hit=document.getElementById("laptop-saver-cycle-hit"),bezel=document.getElementById("office-laptop-bezel"),parentPointer=0,parentClick=0;laptop.addEventListener("pointerdown",function(){parentPointer++;});laptop.addEventListener("click",function(){parentClick++;});function tapHit(){var move=new PointerEvent("pointermove",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}),down=new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"mouse",button:0}),click=new MouseEvent("click",{bubbles:true,cancelable:true,button:0});hit.dispatchEvent(move);var kept=laptop.classList.contains("show-saver"),pointerPrevented=!hit.dispatchEvent(down),clickPrevented=!hit.dispatchEvent(click);return{kept:kept,pointerPrevented:pointerPrevented,clickPrevented:clickPrevented};}',
  ' var hb=hit.getBBox(),bb=bezel.getBBox(),innerClear=!hit.isPointInFill(new DOMPoint(389,165));S("control",{exists:!!hit,noTab:!hit.hasAttribute("tabindex"),transparent:hit.getAttribute("fill")==="transparent",cursor:hit.getAttribute("cursor"),inside:hb.x>=bb.x&&hb.y>=bb.y&&hb.x+hb.width<=bb.x+bb.width&&hb.y+hb.height<=bb.y+bb.height,innerClear:innerClear,path:hit.getAttribute("d")});',
  ' var beforeHit=window.__laptopSaverState(),firstTap=tapHit();await sleep(60);var firstHit=window.__laptopSaverState(),firstShow=laptop.classList.contains("show-saver"),firstZoom=window.__laptopZoomed(),secondTap=tapHit();await sleep(60);var secondHit=window.__laptopSaverState();S("bezel",{before:beforeHit,first:firstHit,second:secondHit,firstTap:firstTap,secondTap:secondTap,firstShow:firstShow,show:laptop.classList.contains("show-saver"),firstZoom:firstZoom,zoom:window.__laptopZoomed(),open:laptop.classList.contains("open"),parentPointer:parentPointer,parentClick:parentClick});',
  ' window.__resetLaptop();laptop.classList.add("open");window.__laptopZoomIn();await sleep(60);window.__startLaptopSaver("caps");await sleep(20);var wakeScreen=document.getElementById("office-laptop-screen"),wakeTile=document.getElementById("laptop-calltile"),wakeDown=new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"touch",pointerId:77,isPrimary:true,button:0}),wakeDownPrevented=!wakeScreen.dispatchEvent(wakeDown),wakeClickPrevented=!wakeTile.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0}));await sleep(20);var wakeFirst={awake:!laptop.classList.contains("show-saver"),call:window.__laptopCallState(),zoom:window.__laptopZoomed()};wakeTile.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerType:"touch",pointerId:78,isPrimary:true,button:0}));wakeTile.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0}));await sleep(20);var wakeSecond=window.__laptopCallState();S("wake",{downPrevented:wakeDownPrevented,clickPrevented:wakeClickPrevented,first:wakeFirst,second:wakeSecond});window.__endLaptopCall(true);window.__laptopLidZoom(false);window.__resetLaptop();',
  ' async function blocked(state){window.__resetLaptop();if(state!=="closed")laptop.classList.add("open");if(state!=="closed")laptop.classList.add(state);var tap=tapHit();await sleep(280);var value={show:laptop.classList.contains("show-saver"),kind:window.__laptopSaverState().kind,open:laptop.classList.contains("open"),zoom:window.__laptopZoomed(),tap:tap};laptop.classList.remove(state);return value;}S("blocked",{closed:await blocked("closed"),updating:await blocked("updating"),rebooting:await blocked("rebooting"),calling:await blocked("calling")});window.__resetLaptop();laptop.classList.add("open");',
  ' var sequence=[];window.__startLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());window.__cycleLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());window.__cycleLaptopSaver();await sleep(60);sequence.push(window.__laptopSaverState());S("sequence",sequence);',
  ' var sleepState=sequence.filter(function(x){return x.kind==="sleep";})[0];S("scene",{sleepClass:laptop.classList.contains("saver-sleep"),behdad:document.querySelectorAll("#laptop-saver-zzz-behdad .laptop-saver-z").length,marketa:document.querySelectorAll("#laptop-saver-zzz-marketa .laptop-saver-z").length,people:document.querySelectorAll("#laptop-saver-sleeping-behdad,#laptop-saver-sleeping-marketa").length,sleepState:sleepState});',
  ' window.__startLaptopSaver("caps");await sleep(60);var beforeBlur=window.__laptopSaverState();focused=false;window.dispatchEvent(new Event("blur"));await sleep(20);var blurred=window.__laptopSaverState();focused=true;window.dispatchEvent(new Event("focus"));await sleep(20);var refocused=window.__laptopSaverState();S("focus",{before:beforeBlur,blurred:blurred,refocused:refocused});',
  ' window.__startLaptopSaver("sleep");await sleep(20);window.__goToStage("garden");await sleep(20);var parked=window.__laptopSaverState();window.__goToStage("office");await sleep(20);var returned=window.__laptopSaverState();S("room",{parked:parked,returned:returned});',
  ' window.__resetLaptop();await sleep(20);S("reset",{state:window.__laptopSaverState(),show:laptop.classList.contains("show-saver"),sleep:laptop.classList.contains("saver-sleep")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("rsvp.html laptop screensavers:");
var r = lib.runPageSync("rsvp.html", HARNESS, 12500, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(r && r.errors.length === 0, "the saver reel runs without uncaught errors", r && r.errors);
check(r && r.steps.continued && r.steps.continued.open && r.steps.continued.show && !r.steps.continued.zoomed &&
  r.steps.continued.state.kind && r.steps.continued.state.cycling,
  "Continue rearms the open, unzoomed laptop's idle saver", r && r.steps.continued);
check(r && r.steps.control && r.steps.control.exists && r.steps.control.noTab && r.steps.control.transparent &&
  r.steps.control.cursor === "pointer" && r.steps.control.inside && r.steps.control.innerClear &&
  r.steps.control.path === "M384 160 H398 V164 H388 V174 H384 Z",
  "the unmarked, untabbable hit target stays wholly on the top-left laptop bezel", r && r.steps.control);
var bezel = r && r.steps.bezel;
check(bezel && bezel.first.kind === bezel.first.order[bezel.before.next] &&
  bezel.second.kind === bezel.second.order[bezel.first.next] && bezel.first.kind !== bezel.second.kind &&
  bezel.firstShow && bezel.show && !bezel.firstZoom && !bezel.zoom && bezel.open,
  "the bezel starts the next idle saver, then advances it without waking or zooming", bezel);
check(bezel && bezel.firstTap.pointerPrevented && bezel.firstTap.clickPrevented &&
  bezel.secondTap.kept && bezel.secondTap.pointerPrevented && bezel.secondTap.clickPrevented &&
  bezel.parentPointer === 0 && bezel.parentClick === 0,
  "pointer movement preserves the active saver and both activation events stay out of ordinary laptop behavior", bezel);
var wake = r && r.steps.wake;
check(wake && wake.downPrevented && wake.clickPrevented && wake.first.awake &&
  !wake.first.call.active && wake.first.zoom && wake.second.active && wake.second.contact === "prague",
  "a trusted-style touch wakes the zoomed saver without launching the exposed call tile", wake);
var blocked = r && r.steps.blocked;
check(blocked && !blocked.closed.show && !blocked.closed.kind && !blocked.closed.open && !blocked.closed.zoom &&
  [blocked.updating, blocked.rebooting, blocked.calling].every(function (state) {
    return state && !state.show && !state.kind && state.open && !state.zoom;
  }), "the bezel is inert while the laptop is closed, updating, rebooting, or in a call", blocked);
var sequence = r && r.steps.sequence || [], order = sequence[0] && sequence[0].order || [];
check(sequence.length === 3 && order.length === 2 &&
  order.slice().sort().join("|") === "caps|sleep" &&
  sequence[0].kind === order[1] && sequence[1].kind === order[0] && sequence[2].kind === order[1] &&
  sequence.every(function (state) { return state.order.join("|") === order.join("|") && state.cycling; }),
  "the once-shuffled order stays fixed across a complete wrap", sequence);
check(order.filter(function (kind) { return kind === "sleep"; }).length * 2 === order.length,
  "the fixed reel gives the sleeping scene half of its equal-duration slots", order);
check(r && r.steps.scene && r.steps.scene.behdad === 3 && r.steps.scene.marketa === 3 &&
  r.steps.scene.people === 2 && r.steps.scene.sleepState && r.steps.scene.sleepState.kind === "sleep",
  "the sleeping saver includes both people and a three-Z trail for each", r && r.steps.scene);
check(r && r.steps.focus && r.steps.focus.before.running && r.steps.focus.before.cycling &&
  !r.steps.focus.blurred.running && !r.steps.focus.blurred.cycling &&
  r.steps.focus.refocused.running && r.steps.focus.refocused.cycling &&
  r.steps.focus.blurred.remaining <= r.steps.focus.before.remaining &&
  r.steps.focus.refocused.remaining <= r.steps.focus.blurred.remaining,
  "blur pauses both the caps frame and the reel timeout, then focus resumes them", r && r.steps.focus);
check(r && r.steps.room && !r.steps.room.parked.running && !r.steps.room.parked.cycling &&
  r.steps.room.parked.kind === "sleep" && !r.steps.room.returned.running &&
  r.steps.room.returned.cycling && r.steps.room.returned.kind === "sleep",
  "leaving the Office parks the reel on its exact scene and returning resumes it", r && r.steps.room);
check(r && r.steps.reset && !r.steps.reset.show && !r.steps.reset.sleep &&
  !r.steps.reset.state.kind && !r.steps.reset.state.running && !r.steps.reset.state.cycling,
  "laptop reset clears the selected saver, frame, and cycle timeout", r && r.steps.reset);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

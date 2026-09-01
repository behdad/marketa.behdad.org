#!/usr/bin/env node
// Replaying a room's terminal activity must never repeat its first-solve handoff. Exercise the
// real scene click/pointer path and the capture-phase document Enter path for every Phase 1 owner.
"use strict";

var lib = require("./lib");

function harness(mode) {
  return String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function click(id){var el=document.getElementById(id);if(el)el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}
function enter(){document.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));}
function finish(mode,id){if(mode==="enter")enter();else click(id);}
var report={mode:${JSON.stringify(mode)},errors:[],rooms:{},checkpoint:null};
async function stay(name,delay){
  await sleep(delay);
  var terminal=name==="kitchen"?window.__captureKitchenCoffeeState().step:null;
  var completed=name==="kitchen"?!document.getElementById("kitchen-shotcup").classList.contains("filled"):
    name==="garden"?document.getElementById("garden-candle-2").classList.contains("lit"):
    name==="cuddly"?document.getElementById("cuddly-blanket").classList.contains("done"):
    document.getElementById("office-stainedglass").classList.contains("done");
  report.rooms[name]={room:window.__currentStageName,solved:window.__roomSolved(name),completed:completed,terminal:terminal};
}
async function run(){
  document.getElementById("hunt-fullscreen-area").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
  window.__endAttract();
  window.__setMaxUnlocked(4);
  window.__setSolvedRooms(["kitchen","garden","cuddly","office"]);

  // Kitchen's repeat espresso remains available in Phase 2. The shot is the same terminal
  // click reached by the document Enter walker, and used to call the handoff again after each sip.
  window.__setSecondRound(true,{releaseHeld:false});
  window.__goToStage("kitchen");
  window.__setDayNight(false);
  window.__setKitchenCoffeeState({step:"brewed",rounds:2});
  finish(report.mode,"kitchen-shotcup");
  await stay("kitchen",850);
  window.__setSecondRound(false,{releaseHeld:false});

  // Prepare each remaining solved room one real action before its terminal prop. Only the
  // setup is direct; the completion itself always uses the tested scene-input path.
  window.__goToStage("garden");
  window.__markGardenWatered();
  click("garden-guitar");
  click("garden-candle-1");
  finish(report.mode,"garden-candle-2");
  await stay("garden",850);

  window.__goToStage("cuddly");
  document.getElementById("cuddly-octopus").classList.add("played");
  document.getElementById("cuddly-balcony-door").classList.add("open");
  if(report.mode==="enter")enter();
  else{
    var blanket=document.getElementById("cuddly-blanket");
    blanket.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:7,clientX:0,clientY:0}));
    blanket.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:7,clientX:0,clientY:0}));
  }
  await stay("cuddly",850);

  window.__goToStage("office");
  window.__setOfficeProgress("prague",true);
  window.__setOfficeProgress("pc",true);
  window.__settleOfficeLamps(true,true);
  finish(report.mode,"office-stainedglass");
  await stay("office",2150);
  if(report.mode==="pointer"){
    var imported=window.__loftSessionImport(JSON.stringify({kind:"loft-session",version:1,progress:{room:"office",maxUnlocked:4,solvedRooms:["kitchen","garden","cuddly","office"],seenRooms:["kitchen","garden","cuddly","office"],phase2:false,party:false,daylight:true,bbq:false},puzzle:{office:{prague:true,pc:true,lamp:true,pendant:true,glass:true}}}));
    var restoredGlass=document.getElementById("office-stainedglass");
    restoredGlass.classList.remove("done","zoomed");
    restoredGlass.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));
    await sleep(2150);
    report.checkpoint={imported:imported,room:window.__currentStageName,solved:window.__roomSolved("office"),completed:restoredGlass.classList.contains("done")};
  }
}
window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});
})();</script>`;
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html solved-room replay progression:");
var results = {};
["pointer", "enter"].forEach(function (mode) {
  var result = lib.runPageSync("rsvp.html", harness(mode), 8500, { patchRaf: true, seedRandom: true });
  results[mode] = result;
  check(result && result.errors.length === 0, mode + " harness has no uncaught errors", result && result.errors);
  ["kitchen", "garden", "cuddly", "office"].forEach(function (room) {
    var state = result && result.rooms && result.rooms[room];
    check(state && state.room === room && state.solved && state.completed,
      mode + " replay stays in solved " + room, state);
  });
});
var checkpoint = results.pointer && results.pointer.checkpoint;
check(checkpoint && checkpoint.imported && checkpoint.solved && checkpoint.completed && checkpoint.room === "office",
  "a restored solved Office completion stays in Office", checkpoint);

console.log("");
if (failures) { console.log(failures + " solved-room replay assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Solved-room replay assertions passed.");

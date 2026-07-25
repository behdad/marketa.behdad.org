#!/usr/bin/env node
// Focused lifecycle test for the ketamine-ghost Pac-Man unlock. The game is hidden
// until the drifting ghost is clicked, retains a live maze across close/Continue,
// stops its sole simulation timer off-screen, and resets without relocking on Kill.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}',
  'async function run(){',
  'var monitor=document.getElementById("office-monitor"), tower=document.getElementById("office-pc-desk-trio"), ghost=document.getElementById("rsvp-trip-ghost-inner"), dock=document.getElementById("monitor-dock-pacman");',
  'S("initial_locked",window.__pacmanUnlocked&&window.__pacmanUnlocked()===false&&dock&&dock.classList.contains("dock-app-locked"));',
  'if(window.goToStage)window.goToStage("office"); if(tower)tower.classList.add("on"); monitor.classList.add("here","screen-on","show-caps");',
  'ghost.classList.add("roaming"); ghost.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); await sleep(120);',
  'var first=window.__pacmanState&&window.__pacmanState();',
  'S("ghost_unlocks",!!first&&first.unlocked===true&&dock&&!dock.classList.contains("dock-app-locked"));',
  'S("ghost_opens",monitor.classList.contains("show-pacman")&&window.currentStageName==="office");',
  'var wrap=document.getElementById("monitor-pacman-wrap");',
  'S("board_complete",wrap&&wrap.querySelectorAll(".pac-cell").length===289&&wrap.querySelectorAll(".pac-wall").length>100&&wrap.querySelectorAll(".pac-dot,.pac-power").length>100&&wrap.querySelectorAll(".pac-ghost").length===3);',
  'try{Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return true;}});}catch(e){}',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true,cancelable:true})); await sleep(560);',
  'var moved=window.__pacmanState(); S("keyboard_plays",moved.status==="running"&&moved.score>0&&moved.remaining<first.remaining);',
  'var saved=window.__pacmanCapture(); window.__closeMonitorPacman(); await sleep(40);',
  'S("close_stops",!monitor.classList.contains("show-pacman")&&window.__pacmanState().running===false);',
  'window.__pacmanRestore(saved); var restored=window.__pacmanState(); S("checkpoint_roundtrip",restored.unlocked===true&&restored.score===saved.score&&restored.remaining===saved.pellets.filter(Boolean).length&&restored.running===false);',
  'monitor.classList.add("show-caps"); window.__openMonitorApp("pacman"); await sleep(40); window.__killMonitorPacman(); await sleep(2400);',
  'var killed=window.__pacmanState(); S("kill_resets_not_relocks",killed.unlocked===true&&killed.status==="ready"&&killed.score===0&&!monitor.classList.contains("show-pacman"));',
  'window.__resetPacmanUnlock(); S("full_reset_relocks",window.__pacmanUnlocked()===false&&dock.classList.contains("dock-app-locked")&&window.__pacmanState().running===false);',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness:"+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},400);});',
  '})();',
  '</script>'
].join("\n");

var failures=0;
function pass(msg){console.log("  ✓ "+msg);}
function fail(msg,detail){failures++;console.log("  ✗ "+msg);if(detail)console.log("      "+String(detail).split("\n").join("\n      "));}

console.log("rsvp.html ketamine-ghost Pac-Man:");
var r=lib.runPageSync("rsvp.html",HARNESS,9000,{patchRaf:true});
if(!r) fail("harness reported");
else {
  var checks={initial_locked:"app begins undiscovered",ghost_unlocks:"clicking the ketamine ghost reveals Pac-Man",ghost_opens:"ghost click opens Pac-Man on the office monitor",board_complete:"maze, pellets, player, and ghosts render",keyboard_plays:"arrow controls advance the live maze",close_stops:"normal close stops the simulation timer",checkpoint_roundtrip:"maze state survives capture/restore without running off-screen",kill_resets_not_relocks:"Kill resets the maze but keeps the discovery",full_reset_relocks:"full reset hides Pac-Man again"};
  Object.keys(checks).forEach(function(k){if(r.steps[k])pass(checks[k]);else fail(checks[k],JSON.stringify(r.steps));});
  if(r.errors.length===0)pass("no uncaught JS errors");else fail("no uncaught JS errors",r.errors.slice(0,12).join("\n"));
}
console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);} console.log("All checks passed.");

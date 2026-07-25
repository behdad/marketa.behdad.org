#!/usr/bin/env node
// Focused lifecycle test for the search-only ketamine Pac-Man app. The game stays
// off the desktop while search and the roaming ghost can open it, retains a live maze across close/Continue,
// parks its sole simulation timer off-screen, and follows the monitor's Close/Kill
// task semantics. A second load covers the static reduced-motion catch target.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'function ctxAt(el){var b=el.getBoundingClientRect(),e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:b.left+Math.min(8,b.width/2),clientY:b.top+Math.min(8,b.height/2)});return !el.dispatchEvent(e);}',
  'function menu(){return document.querySelector(".mon-ctx");}',
  'var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}',
  'async function run(){',
  'var monitor=document.getElementById("office-monitor"), tower=document.getElementById("office-pc-desk-trio"), ghost=document.getElementById("rsvp-trip-ghost-inner"), dock=document.getElementById("monitor-dock-pacman");',
  'localStorage.removeItem("pacmanHigh");',
  'S("initial_locked",window.__pacmanUnlocked&&window.__pacmanUnlocked()===false&&!dock);',
  'if(window.goToStage)window.goToStage("office"); if(tower)tower.classList.add("on"); monitor.classList.add("here","screen-on","show-caps"); if(window.__monitorZoomIn)window.__monitorZoomIn(); await sleep(30);',
  '["p","a","c"].forEach(key);var lockedSearch=window.__monitorDockSearch();key("Escape");var lockedList=window.__openMonitorApp("__missing__");',
  'var initialApps=window.__chatMonitorApps();S("search_only",lockedSearch.query==="pac"&&lockedSearch.match==="pacman"&&Array.isArray(lockedList)&&lockedList.indexOf("pacman")>=0&&initialApps.some(function(app){return app.id==="pacman"&&app.access==="search";})&&!dock);',
  'window.__openMonitorApp("pacman");await sleep(60);S("search_opens",monitor.classList.contains("show-pacman")&&window.__pacmanUnlocked());window.__closeMonitorPacman();window.__resetPacmanUnlock();',
  'ghost.classList.add("roaming");ghost.dispatchEvent(new AnimationEvent("animationend",{animationName:"trip-ghost-roam",bubbles:true}));S("finished_ghost_inert",!ghost.classList.contains("roaming"));',
  'ghost.classList.add("roaming"); ghost.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); await sleep(120);',
  'var first=window.__pacmanState&&window.__pacmanState();',
  'S("ghost_unlocks",!!first&&first.unlocked===true&&!dock);',
  'S("stays_tileless",!document.getElementById("monitor-dock-pacman"));',
  'S("ghost_opens",monitor.classList.contains("show-pacman")&&window.currentStageName==="office");',
  'var wrap=document.getElementById("monitor-pacman-wrap");',
  'S("board_complete",wrap&&wrap.querySelectorAll(".pac-cell").length===289&&wrap.querySelectorAll(".pac-wall").length>100&&wrap.querySelectorAll(".pac-dot,.pac-power").length>100&&wrap.querySelectorAll(".pac-ghost").length===3);',
  'var focused=true;try{Object.defineProperty(document,"hasFocus",{configurable:true,value:function(){return focused;}});}catch(e){}',
  'key("ArrowUp");await sleep(220);S("blocked_start_waits",window.__pacmanState().status==="ready"&&window.__pacmanState().score===0&&!window.__pacmanState().running);',
  'key("ArrowLeft");for(var repeat=0;repeat<16;repeat++){await sleep(25);key("ArrowLeft");}await sleep(180);',
  'var moved=window.__pacmanState(); S("held_key_plays",moved.status==="running"&&moved.score>=20&&moved.remaining<first.remaining&&moved.running);',
  'focused=false;window.dispatchEvent(new Event("blur"));var paused=window.__pacmanState();await sleep(260);S("blur_parks",!paused.running&&window.__pacmanState().score===paused.score);',
  'focused=true;window.dispatchEvent(new Event("focus"));await sleep(210);S("focus_resumes",window.__pacmanState().running);',
  'var saved=window.__pacmanCapture(),pelletMask=new Array(saved.pellets.length).fill(false);[].forEach.call(wrap.querySelectorAll(".pac-dot,.pac-power"),function(el){var r=parseInt(el.style.getPropertyValue("--r"),10)-1,c=parseInt(el.style.getPropertyValue("--c"),10)-1;pelletMask[r*19+c]=true;});var saveHits=0,realSave=window.__saveLoftCheckpoint;window.__saveLoftCheckpoint=function(){saveHits++;return true;};',
  'var collision=JSON.parse(JSON.stringify(saved));collision.status="ready";collision.score=0;collision.lives=3;collision.fright=0;collision.player={r:13,c:9};collision.direction=collision.desired="left";collision.ghosts[0]={r:13,c:8,dir:"right"};collision.ghosts[1]={r:1,c:1,dir:"right"};collision.ghosts[2]={r:1,c:17,dir:"left"};collision.pellets=pelletMask.slice();window.__pacmanRestore(collision);key("ArrowLeft");await sleep(180);var hit=window.__pacmanState();S("collision_costs_life",hit.status==="ready"&&hit.lives===2&&!hit.running&&saveHits>0);',
  'var power=JSON.parse(JSON.stringify(collision));power.player={r:13,c:2};power.ghosts[0]={r:13,c:1,dir:"right"};power.lives=3;power.status="ready";power.score=0;power.fright=0;window.__pacmanRestore(power);key("ArrowLeft");await sleep(180);var ate=window.__pacmanState(),ateSaved=window.__pacmanCapture();S("power_eats_ghost",ate.status==="running"&&ate.lives===3&&ate.score===250&&ate.high===250&&ateSaved.fright>0);',
  'var over=JSON.parse(JSON.stringify(collision));over.lives=1;window.__pacmanRestore(over);key("ArrowLeft");await sleep(180);var lost=window.__pacmanState(),overSaved=window.__pacmanCapture();S("collision_game_over",lost.status==="over"&&lost.lives===0&&!lost.running);window.__pacmanRestore(overSaved);S("game_over_roundtrip",window.__pacmanState().status==="over"&&window.__pacmanState().lives===0);',
  'var win=JSON.parse(JSON.stringify(collision)),lastIdx=13*19+8;win.ghosts[0]={r:1,c:1,dir:"right"};win.pellets=win.pellets.map(function(_,i){return i===lastIdx;});window.__pacmanRestore(win);key("ArrowLeft");await sleep(180);var cleared=window.__pacmanState();S("maze_clears",cleared.status==="win"&&cleared.remaining===0&&!cleared.running);',
  'wrap.querySelector(".pac-new").click();var fresh=window.__pacmanState();S("new_resets",fresh.status==="ready"&&fresh.score===0&&fresh.high===250&&fresh.lives===3&&fresh.remaining===141);wrap.querySelector(".pac-btn[data-dir=left]").click();S("pad_plays",window.__pacmanState().status==="running"&&window.__pacmanState().running);',
  'window.__saveLoftCheckpoint=realSave;window.__pacmanRestore(saved);window.__closeMonitorPacman(); await sleep(40);',
  'S("close_stops",!monitor.classList.contains("show-pacman")&&window.__pacmanState().running===false);',
  'window.__pacmanRestore(saved); var restored=window.__pacmanState(); S("checkpoint_roundtrip",restored.unlocked===true&&restored.score===saved.score&&restored.remaining===saved.pellets.filter(Boolean).length&&restored.running===false);',
  'window.__pacmanRestore(saved);',
  'monitor.classList.add("show-caps");window.__unlockPacman(true);await sleep(60);var inAppPrevented=ctxAt(wrap),killBtn=menu()&&menu().querySelector(".ctx-kill");S("app_context",inAppPrevented&&!!killBtn&&!menu().querySelector(".ctx-restart"));if(killBtn)killBtn.click();',
  'focused=false;window.dispatchEvent(new Event("blur"));focused=true;window.dispatchEvent(new Event("focus"));await sleep(260);var dying=window.__pacmanState();S("kill_stays_frozen",dying.dying===true&&dying.running===false);await sleep(2200);',
  'var killed=window.__pacmanState(); S("kill_resets_not_relocks",killed.unlocked===true&&killed.status==="ready"&&killed.score===0&&!killed.dying&&!monitor.classList.contains("show-pacman"));',
  'window.__resetPacmanUnlock(); S("full_reset_relocks",window.__pacmanUnlocked()===false&&!document.getElementById("monitor-dock-pacman")&&window.__pacmanState().running===false&&window.__pacmanState().high===250);',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness:"+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},400);});',
  '})();',
  '</script>'
].join("\n");

var failures=0;
function pass(msg){console.log("  ✓ "+msg);}
function fail(msg,detail){failures++;console.log("  ✗ "+msg);if(detail)console.log("      "+String(detail).split("\n").join("\n      "));}

console.log("rsvp.html ketamine-ghost Pac-Man:");
var r=lib.runPageSync("rsvp.html",HARNESS,10000,{patchRaf:true,forceMotion:true});
if(!r) fail("harness reported");
else {
  var checks={initial_locked:"app begins undiscovered and has no desktop tile",search_only:"Pac-Man is searchable and listed without receiving a desktop tile",search_opens:"type-to-open can launch Pac-Man before the ghost is caught",finished_ghost_inert:"the finished roaming ghost loses its invisible hit target",ghost_unlocks:"clicking the ketamine ghost reveals Pac-Man without adding a tile",stays_tileless:"Pac-Man stays off the desktop after discovery",ghost_opens:"ghost click opens Pac-Man on the office monitor",board_complete:"maze, pellets, player, and ghosts render",blocked_start_waits:"a blocked opening direction does not start the ghosts",held_key_plays:"held arrow input cannot starve the simulation timer",blur_parks:"blur parks the simulation without advancing state",focus_resumes:"focus resumes an open running maze",collision_costs_life:"a collision costs one life, checkpoints, and waits for input",power_eats_ghost:"a corner power pellet makes a collided ghost edible and banks the high score",collision_game_over:"the last collision reaches game over with zero lives",game_over_roundtrip:"game-over checkpoints retain zero lives",maze_clears:"the final pellet ends the maze in a win",new_resets:"New restores the maze but retains the high score",pad_plays:"the on-screen direction pad starts the game",close_stops:"normal close stops the simulation timer",checkpoint_roundtrip:"checkpoint retains discovery without exposing a desktop tile",app_context:"the open game exposes Kill without Restart",kill_stays_frozen:"focus changes cannot restart a Pac-Man Kill flash",kill_resets_not_relocks:"Kill resets the maze but keeps the discovery",full_reset_relocks:"full reset hides Pac-Man again without erasing the high score"};
  Object.keys(checks).forEach(function(k){if(r.steps[k])pass(checks[k]);else fail(checks[k],JSON.stringify(r.steps));});
  if(r.errors.length===0)pass("no uncaught JS errors");else fail("no uncaught JS errors",r.errors.slice(0,12).join("\n"));
}

var REDUCED = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'var ghost=document.getElementById("rsvp-trip-ghost-inner");ghost.classList.add("roaming");var css=getComputedStyle(ghost);',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,steps:{static_target:css.animationName==="none"&&parseFloat(css.opacity)>.9&&css.pointerEvents!=="none"}});',
  '},350);});</script>'
].join("\n");
var rm=lib.runPageSync("rsvp.html",REDUCED,1200,{patchRaf:true,forceReduce:true,chromeFlags:"--force-prefers-reduced-motion=reduce"});
if(rm&&rm.steps.static_target)pass("reduced motion presents a static visible catch target");else fail("reduced motion presents a static visible catch target",rm&&JSON.stringify(rm.steps));
if(rm&&rm.errors.length===0)pass("reduced-motion load has no uncaught JS errors");else fail("reduced-motion load has no uncaught JS errors",rm&&rm.errors.join("\n"));

console.log("");
if(failures){console.log(failures+" check(s) failed.");process.exit(1);} console.log("All checks passed.");

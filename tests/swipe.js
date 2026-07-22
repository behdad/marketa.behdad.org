#!/usr/bin/env node
// Focused mobile edge-swipe test. Synthetic touch PointerEvents exercise the same
// event path as current Android/iOS browsers without enabling broad touch emulation.
"use strict";
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  '  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  '  var report={errors:[],steps:{}}; function S(k,v){report.steps[k]=v;}',
  '  function bg(room){return document.querySelector("#stage-"+room+" > rect:first-of-type");}',
  '  function point(target,type,id,x,y,primary){target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:"touch",pointerId:id,isPrimary:primary!==false,button:0,clientX:x,clientY:y}));}',
  '  function mousePoint(target,type,id,x,y){target.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:"mouse",pointerId:id,isPrimary:true,button:0,clientX:x,clientY:y}));}',
  '  function rect(){return document.querySelector(".hunt-viewport").getBoundingClientRect();}',
  '  function swipe(target,side,dx,dy,id){var r=rect(),x=side==="left"?r.left+8:r.right-8,y=r.top+r.height/2;point(target,"pointerdown",id,x,y);point(target,"pointermove",id,x+dx,y+dy);point(target,"pointerup",id,x+dx,y+dy);}',
  '  async function run(){',
  '    S("hook",typeof window.__roomSwipeState==="function"); S("config",window.__roomSwipeState&&window.__roomSwipeState());',
  '    swipe(bg("kitchen"),"right",-110,2,1); S("locked_frontier_stays",window.currentStageName);',
  '    window.__unlockAllRooms();',
  '    var r=rect(),mid=r.left+r.width/2,y=r.top+r.height/2,t=bg("kitchen"); point(t,"pointerdown",2,mid,y);point(t,"pointermove",2,mid-120,y);point(t,"pointerup",2,mid-120,y); S("centre_stays",window.currentStageName);',
  '    swipe(bg("kitchen"),"right",-72,90,3); S("vertical_stays",window.currentStageName);',
  '    var interactive=document.getElementById("kitchen-lamarzocco"),clicked=0; interactive.addEventListener("click",function(){clicked++;}); swipe(interactive,"right",-110,0,4); interactive.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); S("interactive_stays",window.currentStageName); S("interactive_click_kept",clicked);',
  '    var safe=bg("kitchen"),safeClicks=0;safe.addEventListener("click",function(){safeClicks++;});swipe(safe,"right",-110,2,5);safe.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));S("forward",window.currentStageName);S("swipe_click_suppressed",safeClicks);',
  '    await sleep(850); swipe(bg("garden"),"left",110,1,6); S("back",window.currentStageName);',
  '    await sleep(850); var oldFlair=window.__flairState;window.__flairState=function(){return {active:true};};swipe(bg("kitchen"),"right",-110,0,7);S("flair_blocks",window.currentStageName);window.__flairState=oldFlair;',
  '    window.goToStage("office"); await sleep(850); var oldArcade=window.__arcadeState;window.__arcadeState=function(){return {active:true};};swipe(bg("office"),"left",110,0,8);S("arcade_blocks",window.currentStageName);window.__arcadeState=oldArcade;',
  '    window.goToStage("garden"); await sleep(850); swipe(document.getElementById("garden-bottles"),"right",-110,0,9);S("drag_target_blocks",window.currentStageName);',
  '    await sleep(30); var rr=rect(),sx=rr.right-8,sy=rr.top+rr.height/2,b=bg("garden");point(b,"pointerdown",10,sx,sy);point(document.body,"pointerdown",11,sx-20,sy,true);point(b,"pointermove",10,sx-110,sy);point(b,"pointerup",10,sx-110,sy);point(document.body,"pointerup",11,sx-20,sy);S("multitouch_blocks",window.currentStageName);',
  '    await sleep(30); mousePoint(b,"pointerdown",12,sx,sy);mousePoint(b,"pointermove",12,sx-110,sy);mousePoint(b,"pointerup",12,sx-110,sy);S("mouse_ignored",window.currentStageName);',
  '  }',
  '  window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},400);});',
  '})();',
  '</script>'
].join('\n');

var rep = lib.runPageSync("rsvp.html", HARNESS, 9000, { patchRaf: true });
if (!rep) { console.log("  x swipe harness produced no report"); process.exit(1); }
var failures=0;
function check(name,ok,detail){if(ok)console.log("  ok "+name);else{failures++;console.log("  x "+name+(detail!==undefined?" ["+JSON.stringify(detail)+"]":""));}}
var s=rep.steps;
console.log("mobile edge room swipe:");
check("test/config hook is exposed",s.hook===true&&s.config&&s.config.edge_px>=48&&s.config.distance_px>=58,s.config);
check("a swipe cannot cross a locked frontier",s.locked_frontier_stays==="kitchen",s.locked_frontier_stays);
check("a swipe starting in the scene centre is ignored",s.centre_stays==="kitchen",s.centre_stays);
check("vertical intent is ignored",s.vertical_stays==="kitchen",s.vertical_stays);
check("interactive targets keep both the room and their click",s.interactive_stays==="kitchen"&&s.interactive_click_kept===1,{room:s.interactive_stays,clicks:s.interactive_click_kept});
check("right-edge inward swipe advances one unlocked room",s.forward==="garden",s.forward);
check("the click trailing a successful swipe is swallowed",s.swipe_click_suppressed===0,s.swipe_click_suppressed);
check("left-edge inward swipe goes back one room",s.back==="kitchen",s.back);
check("Flair-Catch owns touch while active",s.flair_blocks==="kitchen",s.flair_blocks);
check("Invaders owns touch while active",s.arcade_blocks==="office",s.arcade_blocks);
check("a known draggable target blocks room swipe",s.drag_target_blocks==="garden",s.drag_target_blocks);
check("a second finger cancels the candidate swipe",s.multitouch_blocks==="garden",s.multitouch_blocks);
check("mouse pointer drags never become room swipes",s.mouse_ignored==="garden",s.mouse_ignored);
check("no uncaught errors",rep.errors.length===0,rep.errors);
if(failures){console.log("\n"+failures+" failure(s)");process.exit(1);}console.log("\nall swipe checks passed");

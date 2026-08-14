#!/usr/bin/env node
// Party ambient-memory regression: fixed firefly pools must retain their SVG/WAAPI
// identities while visible and disappear completely when their room loses ownership.
"use strict";

var fs = require("fs");
var lib = require("./lib");

var source = fs.readFileSync("loft-day.html", "utf8");
var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
function pool(id){
  var el=document.getElementById(id),nodes=Array.prototype.slice.call(el.children),animations=el.getAnimations({subtree:true});
  return {nodes:nodes,animations:animations,count:nodes.length,animationCount:animations.length,
    infinite:animations.every(function(animation){return animation.effect.getTiming().iterations===Infinity;})};
}
function publish(report){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}
async function run(){
  var report={errors:[]};
  document.hasFocus=function(){return true;};
  if(window.__endAttract)window.__endAttract();
  window.__goToStage("garden");
  window.__setPartyMode(true,true,false);
  window.__setDayNight(true,true);
  await sleep(2100);
  var garden=pool("garden-fireflyfx"),gardenNodes=garden.nodes,gardenAnimations=garden.animations;
  await sleep(1700);
  var gardenAgain=pool("garden-fireflyfx");
  report.garden={count:garden.count,animationCount:garden.animationCount,infinite:garden.infinite,
    sameNodes:gardenAgain.nodes.every(function(node,index){return node===gardenNodes[index];}),
    sameAnimations:gardenAgain.animations.every(function(animation,index){return animation===gardenAnimations[index];})};
  var balconyStage=document.getElementById("stage-balcony"),balconyCells=Array.prototype.slice.call(document.querySelectorAll(".balcony-building-cell"));
  report.parkedBalcony={far:balconyStage.classList.contains("stage-far"),cells:balconyCells.length,
    transitions:balconyCells.reduce(function(total,cell){return total+cell.getAnimations().filter(function(animation){return typeof animation.transitionProperty==="string";}).length;},0),
    duration:getComputedStyle(balconyCells[0]).transitionDuration};
  window.__goToStage("office");await sleep(2300);
  report.office={garden:pool("garden-fireflyfx").count,balcony:pool("balcony-fireflyfx").count};
  window.__goToStage("balcony");await sleep(2300);
  var balcony=pool("balcony-fireflyfx");
  report.balcony={garden:pool("garden-fireflyfx").count,count:balcony.count,animationCount:balcony.animationCount,infinite:balcony.infinite,
    transitionDuration:getComputedStyle(balconyCells[0]).transitionDuration};
  window.__goToStage("garden");await sleep(2300);
  report.returned={garden:pool("garden-fireflyfx").count,balcony:pool("balcony-fireflyfx").count};
  publish(report);
}
window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("party ambient memory harness: "+String(error&&error.stack||error));publish({errors:window.__errs});});},250);});
})();</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Party ambient memory:");
check(!/function spawnFirefly\(svg\)/.test(source) && !/scheduleFireflies/.test(source),
  "the duplicate whole-strip firefly spawner is absent");
check(/#stage-balcony\.stage-far \.balcony-building-cell\{transition:none!important\}/.test(source),
  "parked Balcony cells suppress hidden lighting transitions");

var r = lib.runPageSync("rsvp.html", HARNESS, 13000, {
  forceMotion: true,
  seedRandom: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
check(r && r.errors.length === 0, "runtime probe completes without page errors", r && r.errors);
check(r && r.garden.count === 8 && r.garden.animationCount === 16 && r.garden.infinite && r.garden.sameNodes && r.garden.sameAnimations,
  "Garden retains eight fireflies and their sixteen looping timelines", r && r.garden);
check(r && r.parkedBalcony.far && r.parkedBalcony.cells === 160 && r.parkedBalcony.transitions === 0 && r.parkedBalcony.duration === "0s",
  "the hidden Balcony holds no pending cell transitions", r && r.parkedBalcony);
check(r && r.office.garden === 0 && r.office.balcony === 0,
  "leaving both outdoor rooms releases both firefly pools", r && r.office);
check(r && r.balcony.garden === 0 && r.balcony.count === 8 && r.balcony.animationCount === 16 && r.balcony.infinite && r.balcony.transitionDuration !== "0s",
  "Balcony owns one retained pool and restores its visible lighting transitions", r && r.balcony);
check(r && r.returned.garden === 8 && r.returned.balcony === 0,
  "returning to Garden transfers ambient ownership without duplication", r && r.returned);

if (failures) { console.log("\n" + failures + " check(s) failed."); process.exit(1); }
console.log("\nAll checks passed.");

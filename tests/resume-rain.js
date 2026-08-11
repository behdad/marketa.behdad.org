#!/usr/bin/env node
"use strict";

// The first Balcony arrival schedules a brief sun shower. Its delayed bursts used to
// append balcony-local x coordinates directly to the five-room strip, placing the rain
// over Kitchen when a player left the Balcony or resumed after the timer had fired.

var lib = require("./lib");

function harness(mode) {
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'window.addEventListener("load",function(){setTimeout(async function(){try{',
    'var seen=[];',
    'new MutationObserver(function(records){records.forEach(function(record){Array.prototype.forEach.call(record.addedNodes,function(node){',
    ' if(node.nodeType===1&&node.localName==="line"&&node.getAttribute("stroke")==="#a8c4d4"&&Number(node.getAttribute("x1"))>=400){seen.push({parent:node.parentNode&&node.parentNode.id,stage:node.closest("[id^=stage-]")&&node.closest("[id^=stage-]").id,room:window.__currentStageName,x:Number(node.getAttribute("x1"))});}',
    '});});}).observe(document.getElementById("loft-game-strip"),{childList:true,subtree:true});',
    mode === "hide" ? 'var fakeHidden=false;Object.defineProperty(document,"hidden",{configurable:true,get:function(){return fakeHidden;}});Object.defineProperty(document,"visibilityState",{configurable:true,get:function(){return fakeHidden?"hidden":"visible";}});' : '',
    'window.__endAttract();window.__goToStage("balcony");',
    mode === "leave" ? 'setTimeout(function(){window.__goToStage("kitchen");},60);' : '',
    mode === "hide" ? 'setTimeout(function(){fakeHidden=true;document.dispatchEvent(new Event("visibilitychange"));},60);setTimeout(function(){fakeHidden=false;document.dispatchEvent(new Event("visibilitychange"));},900);' : '',
    'await new Promise(function(resolve){setTimeout(resolve,1250);});',
    'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,room:window.__currentStageName,seen:seen,live:document.querySelectorAll(".balcony-finale-drop").length,direct:document.querySelectorAll("#loft-game-strip > .balcony-finale-drop").length});',
    '}catch(e){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs.concat([String(e&&e.stack||e)])});}},80);});',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html resumed Balcony rain:");
var stayed = lib.runPageSync("loft-day.html", harness("stay"), 1800, { patchRaf: true, forceMotion: true });
var left = lib.runPageSync("loft-day.html", harness("leave"), 1800, { patchRaf: true, forceMotion: true });
var resumed = lib.runPageSync("loft-day.html", harness("hide"), 1800, { patchRaf: true, forceMotion: true });

check(stayed && stayed.errors.length === 0 && stayed.seen.length > 0 && stayed.direct === 0 &&
  stayed.seen.every(function (drop) { return drop.parent === "balcony-precipfx" && drop.stage === "stage-balcony" && drop.x >= 435 && drop.x <= 665; }),
  "the arrival shower paints only in Balcony-local coordinates", stayed);
check(left && left.errors.length === 0 && left.room === "kitchen" && left.seen.length === 0 && left.live === 0 && left.direct === 0,
  "leaving before a delayed burst cancels it instead of raining into Kitchen on resume", left);
check(resumed && resumed.errors.length === 0 && resumed.room === "balcony" && resumed.seen.length === 0 && resumed.live === 0 && resumed.direct === 0,
  "backgrounding before a delayed burst tears it down instead of replaying stale rain on resume", resumed);

console.log("");
if (failures) {
  console.log(failures + " resumed-rain assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Resumed-rain assertions passed.");

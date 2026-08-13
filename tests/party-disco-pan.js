#!/usr/bin/env node
"use strict";

// The Party's neutral disco-ball render sits outside the UV-filtered room strip. It must still own
// the same five-room track and transform, or the destination gate paints it at its final viewport
// position while Garden itself is still panning in.
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(async function(){
  var report={errors:window.__errs,track:null,inbound:null,outbound:null};
  function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
  try{
    var strip=document.getElementById("loft-game-strip");
    var overlay=document.getElementById("garden-disco-overlay");
    var clip=overlay.querySelector("#garden-disco-overlay-room-clip rect");
    var viewBox=overlay.viewBox.baseVal;
    report.track={viewBoxWidth:viewBox.width,cssWidth:getComputedStyle(overlay).width,
      stripWidth:getComputedStyle(strip).width,clipX:clip.x.baseVal.value,clipWidth:clip.width.baseVal.value};

    window.__unlockAllRooms();
    window.__setGardenParty(true,false);
    window.__goToStage("office");
    await sleep(850);
    window.__goToStage("garden");
    report.inbound={strip:strip.style.transform,overlay:overlay.style.transform,
      opacity:getComputedStyle(overlay).opacity,viewingGarden:overlay.parentElement.classList.contains("viewing-garden")};

    await sleep(850);
    window.__goToStage("office");
    report.outbound={strip:strip.style.transform,overlay:overlay.style.transform,
      opacity:getComputedStyle(overlay).opacity,viewingGarden:overlay.parentElement.classList.contains("viewing-garden")};
  }catch(e){window.__errs.push("Party disco pan harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},300);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,3000,{patchRaf:true,forceMotion:true,seedRandom:true,
  urlSuffix:"?fresh=party-disco-pan"});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Party disco-ball room pan:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.track&&r.track.viewBoxWidth===3400&&r.track.cssWidth===r.track.stripWidth&&
  r.track.clipX===680&&r.track.clipWidth===680,
  "the anti-UV render uses the five-room track with a Garden-local clip",r&&r.track);
check(r&&r.inbound&&r.inbound.strip==="translateX(-20%)"&&r.inbound.overlay===r.inbound.strip&&
  r.inbound.opacity==="1"&&r.inbound.viewingGarden,
  "the disco-ball track shares the strip's inbound destination transform",r&&r.inbound);
check(r&&r.outbound&&r.outbound.strip==="translateX(-60%)"&&r.outbound.overlay===r.outbound.strip&&
  r.outbound.opacity==="1"&&!r.outbound.viewingGarden,
  "the neutral ball stays on its room track while Garden pans away",r&&r.outbound);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");

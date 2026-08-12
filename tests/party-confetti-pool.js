#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>(function(){
window.addEventListener("load",function(){setTimeout(function(){
  var report={errors:window.__errs,started:0,hidden:false,reused:false,removed:0,active:0};
  try{
    window.__goToStage("garden");
    var container=document.getElementById("garden-confettifx");
    window.__setGardenParty(true,false);
    report.started=container.childElementCount;
    var first=container.firstElementChild;
    var nativeRemove=Element.prototype.remove;
    Element.prototype.remove=function(){if(container.contains(this))report.removed++;return nativeRemove.apply(this,arguments);};
    window.__setGardenParty(false,false);
    report.hidden=container.getAttribute("visibility")==="hidden"&&container.firstElementChild===first&&container.childElementCount===report.started;
    window.__setGardenParty(true,false);
    report.reused=container.getAttribute("visibility")!=="hidden"&&container.firstElementChild===first&&container.childElementCount===report.started;
    report.active=container.querySelectorAll('[data-confetti-active="1"]').length;
    Element.prototype.remove=nativeRemove;
  }catch(e){window.__errs.push("party confetti pool harness: "+String(e&&e.stack||e));}
  report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);
},250);});
})();</script>`;

var r=lib.runPageSync("rsvp.html",HARNESS,1800,{patchRaf:true,forceMotion:true,seedRandom:true});
var failures=0;
function check(ok,msg,detail){if(ok)console.log("  ✓ "+msg);else{failures++;console.log("  ✗ "+msg+(detail?"   ["+JSON.stringify(detail)+"]":""));}}
console.log("rsvp.html Party confetti pool:");
check(r&&r.errors.length===0,"no uncaught page errors",r&&r.errors);
check(r&&r.started===20,"full-motion Party starts the bounded 20-piece pool",r);
check(r&&r.hidden&&r.removed===0,"teardown hides and cancels without removing pooled SVG nodes",r);
check(r&&r.reused&&r.active===20,"the next Party restarts all twenty existing nodes",r);
if(failures){console.log("\n"+failures+" check(s) failed.");process.exit(1);}
console.log("\nAll checks passed.");

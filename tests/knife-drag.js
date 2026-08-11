#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'var report={errors:[],steps:{},debug:{}};',
  'function pointer(el,type,id,x,y){el.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType:"mouse",isPrimary:true,button:0,buttons:type==="pointerup"?0:1,clientX:x,clientY:y}));}',
  'window.addEventListener("load",function(){setTimeout(function(){',
  'window.__goToStage("cuddly");',
  'var knife=document.getElementById("cuddly-knife-1"),r=knife.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;',
  'pointer(knife,"pointerdown",71,x,y);pointer(knife,"pointermove",71,x+120,y+80);',
  'report.steps.moved=knife.style.translate!=="0px 0px";',
  'knife.dispatchEvent(new PointerEvent("lostpointercapture",{bubbles:true,pointerId:71,pointerType:"mouse"}));',
  'report.steps.captureLossHomes=parseFloat(knife.style.translate)===0;',
  'pointer(knife,"pointerdown",72,x,y);pointer(knife,"pointermove",72,x+120,y+80);',
  'document.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:72,pointerType:"mouse",button:0,buttons:0,clientX:x+120,clientY:y+80}));',
  'report.steps.outsideReleaseHomes=parseFloat(knife.style.translate)===0;',
  'report.debug={translate:knife.style.translate};report.errors=window.__errs;',
  'document.getElementById("__report").textContent=JSON.stringify(report);',
  '},350);});',
  '})();',
  '</script>'
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

console.log("rsvp.html Cuddly knife drag recovery:");
var result = lib.runPageSync("rsvp.html", harness, 3000, {
  patchRaf: true,
  forceMotion: true
});
check(result && result.steps.moved, "the knife follows an active drag", result && result.debug);
check(result && result.steps.captureLossHomes, "lost pointer capture returns the knife to its board", result && result.debug);
check(result && result.steps.outsideReleaseHomes, "a release outside the knife returns it to its board", result && result.debug);
check(result && result.errors.length === 0, "no uncaught JS errors", result && result.errors);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

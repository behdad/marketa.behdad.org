#!/usr/bin/env node
// Monitor saver rotation + shared bitmap-loop lifecycle.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var html = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function saverCaption(){var c=window.__captionArbiter&&window.__captionArbiter.state().overlay;return c&&{key:c.key,owner:c.owner,remaining:c.remaining};}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(920);',
  ' var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");mon.classList.remove("show-saver","saver-pipes","saver-flower");',
  ' var hit=document.getElementById("monitor-saver-cycle-hit");function tapHit(){hit.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0}));hit.dispatchEvent(new MouseEvent("click",{bubbles:true}));}tapHit();await sleep(360);var first=window.__monitorSaverState();tapHit();await sleep(360);var second=window.__monitorSaverState(),bezelCaption=saverCaption();window.__wakeMonitorSaver();S("bezelCycle",{first:first.kind,second:second.kind,awake:!mon.classList.contains("show-saver"),caption:bezelCaption,afterWake:saverCaption()});',
  ' window.__monitorZoomIn();await sleep(40);var cycles=[];for(var i=0;i<4;i++){window.__startMonitorSaver();await sleep(360);var state=window.__monitorSaverState();cycles.push({kind:state.kind,painted:state.painted,running:state.running,segments:state.segments,backend:state.backend,order:state.order,next:state.next,pipesClass:mon.classList.contains("saver-pipes"),flowerClass:mon.classList.contains("saver-flower"),caption:saverCaption()});if(i<3)window.__wakeMonitorSaver();}window.__monitorZoomOut();S("zoomOutCaption",saverCaption());',
  ' S("cycles",cycles);',
  ' window.__goToStage("garden");await sleep(80);S("parked",{running:window.__monitorSaverLoopRunning(),state:window.__monitorSaverState()});',
  '}',
  '})();</script>'
].join("\n");

var REDUCED_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'window.__goToStage("office");var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");',
  'window.__startMonitorSaver("flower");document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,state:window.__monitorSaverState()});',
  '},350);});</script>'
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

console.log("rsvp.html monitor screensavers:");
check(/vlen\.push\(\(1 - d\) \/ d\)/.test(html) &&
  /var f = 1 \+ mesh\.vlen\[i\] \* sf/.test(html) &&
  /var min = -1\.1, span = 6\.2/.test(html) &&
  /0xe4 \/ 255, 0x03 \/ 255, 0x03 \/ 255/.test(html) &&
  /0xff \/ 255, 0x8c \/ 255, 0x00 \/ 255/.test(html) &&
  /0xff \/ 255, 0xed \/ 255, 0x00 \/ 255/.test(html) &&
  /0x00 \/ 255, 0x80 \/ 255, 0x26 \/ 255/.test(html) &&
  /0x00 \/ 255, 0x4d \/ 255, 0xff \/ 255/.test(html) &&
  /0x75 \/ 255, 0x07 \/ 255, 0x87 \/ 255/.test(html) &&
  /gl\.enable\(gl\.CULL_FACE\)/.test(html),
  "Flower Box uses the source-derived radial cube projection and six exact rainbow-flag face colors");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true
});
check(r && r.errors.length === 0, "all screensavers run without uncaught errors", r && r.errors);
check(r && r.steps.bezelCycle && r.steps.bezelCycle.awake &&
  r.steps.bezelCycle.first !== r.steps.bezelCycle.second && !r.steps.bezelCycle.caption &&
  !r.steps.bezelCycle.afterWake,
  "the top-left bezel starts and advances the unzoomed saver without captioning the room",
  r && r.steps.bezelCycle);
var cycles = r && r.steps.cycles || [], firstOrder = cycles[0] && cycles[0].order || [];
check(cycles.length === 4 && firstOrder.length === 3 &&
  firstOrder.slice().sort().join("|") === "flower|julia|pipes" &&
  cycles.slice(0, 3).map(function (x) { return x.kind; }).sort().join("|") === "flower|julia|pipes" &&
  cycles[3].kind === cycles[0].kind,
  "the shuffled order yields one complete stable cycle, then wraps", cycles);
check(cycles.every(function (x) {
  var selected = x.kind === "pipes" ? x.pipesClass && !x.flowerClass :
    (x.kind === "flower" ? x.flowerClass && !x.pipesClass : !x.pipesClass && !x.flowerClass);
  var healthy = x.kind === "pipes" ? x.segments >= 5 :
    (x.kind === "flower" ? /^(webgl|canvas)$/.test(x.backend || "") : true);
  return x.painted && x.running && selected && healthy;
}) && cycles.every(function (x) {
  return x.caption && x.caption.owner === "monitor-saver" && x.caption.remaining > 3000 &&
    x.caption.key === "mon_saver_caption_" + x.kind;
}), "every shuffled saver paints through its selected SVG image and names itself briefly", cycles);
check(r && !r.steps.zoomOutCaption,
  "zooming out dismisses the monitor screensaver caption", r && r.steps.zoomOutCaption);
check(r && !r.steps.parked.running,
  "the shared saver loop stops when the office is parked", r && r.steps.parked);
var reduced = lib.runPageSync("rsvp.html", REDUCED_HARNESS, 1200, {
  patchRaf: true,
  forceReduce: true,
  seedRandom: true
});
check(reduced && reduced.errors.length === 0 && reduced.state.kind === "flower" &&
  reduced.state.painted && !reduced.state.running &&
  reduced.state.flowerScale > 3 && reduced.state.flowerScale < 4 &&
  /^(webgl|canvas)$/.test(reduced.state.backend || ""),
  "reduced motion gets a complete static Flower Box frame without a live loop",
  reduced && reduced.state);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

#!/usr/bin/env node
// Roaming-creature checkpoints restore settled ownership/location without replaying
// jumps, reactions, or Octi's trunk animations.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"office",maxUnlocked:4,phase2:false,party:false,daylight:true,bbq:false},puzzle:{cuddly:{octopus:true}},phone:null,album:null,systems:{creatures:{cat:{loose:true,room:"kitchen",gone:false},octi:{inside:true}}}};',
  'if(!sessionStorage.getItem("checkpoint-creatures-seeded")){sessionStorage.setItem("checkpoint-creatures-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[]};',
  'function catSnap(){var pos=document.getElementById("witchy-chest-cat-pos"),walk=document.getElementById("witchy-chest-cat-walk");return {state:window.__catCheckpointCapture(),parent:pos.parentNode&&pos.parentNode.id,transform:pos.getAttribute("transform"),classes:walk.getAttribute("class")||"",paused:walk.style.animationPlayState,transient:!!document.querySelector("#witchy-chest-cat.wobbling,#witchy-chest-cat-breathe.napping,#witchy-chest-cat-breathe.stretching,#witchy-chest-cat-tail.flicking,#witchy-chest-cat-groom.grooming,#witchy-chest-cat-ear-l.twitching,#witchy-chest-cat-pounce.pouncing,#witchy-chest-cat-pounce.swatting")};}',
  'function octiSnap(){var o=document.getElementById("cuddly-octopus"),s=window.__octiCheckpointCapture();return {inside:s.inside,played:o.classList.contains("played"),inChest:o.classList.contains("in-chest"),opacity:getComputedStyle(o).opacity,transient:o.classList.contains("falling-in")||o.classList.contains("popping-out")||o.classList.contains("wobble")||o.classList.contains("twitch")||o.classList.contains("sneezing")||o.classList.contains("ouch")||o.classList.contains("stabbed")};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate");gate.querySelector(".loft-recovery-btn").click();',
  ' report.continued={room:window.__currentStageName,cat:catSnap(),octi:octiSnap(),persisted:JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.creatures};',
  ' window.__catCheckpointRestore({loose:true,room:"balcony",gone:true});var release=window.__releaseCat(true);report.gone={cat:catSnap(),release:release};',
  ' window.__catCheckpointRestore({loose:false,room:"office",gone:false});window.__octiCheckpointRestore({inside:false});report.defaults={cat:catSnap(),octi:octiSnap()};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html roaming-creature checkpoint recovery:");
var r = lib.runPageSync("loft-day.html", HARNESS, 1900, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(r.continued && r.continued.room === "office" &&
  r.continued.cat.state.loose && !r.continued.cat.state.gone &&
  r.continued.cat.state.room === "kitchen" && r.continued.cat.parent === "stage-kitchen" &&
  r.continued.cat.transform === "translate(-486,41)" &&
  /\broaming-sm\b/.test(r.continued.cat.classes) && !r.continued.cat.transient && !r.continued.cat.paused,
  "Continue restores the loose cat to her saved room in a settled floor pace", r.continued && r.continued.cat);
check(r.continued && r.continued.octi.inside && r.continued.octi.played &&
  r.continued.octi.inChest && r.continued.octi.opacity === "0" && !r.continued.octi.transient,
  "Continue restores Octi inside the trunk without replaying fall/pop or losing the separate solve milestone", r.continued && r.continued.octi);
check(r.continued && r.continued.persisted &&
  r.continued.persisted.cat.loose && r.continued.persisted.cat.room === "kitchen" &&
  !r.continued.persisted.cat.gone && r.continued.persisted.octi.inside,
  "the post-Continue checkpoint retains both creature rows", r.continued && r.continued.persisted);
check(r.gone && r.gone.cat.state.gone && !r.gone.cat.state.loose &&
  /\bgone\b/.test(r.gone.cat.classes) && r.gone.release === false && !r.gone.cat.transient,
  "a permanently-gone cat stays absent and cannot be released from the chest", r.gone);
check(r.defaults && !r.defaults.cat.state.loose && !r.defaults.cat.state.gone &&
  r.defaults.cat.state.room === "garden" && r.defaults.cat.parent === "garden-chest" &&
  r.defaults.cat.transform === "translate(-46,0)" && !r.defaults.cat.transient &&
  !r.defaults.octi.inside && r.defaults.octi.played && !r.defaults.octi.inChest && !r.defaults.octi.transient,
  "settled stowed/outside restores clear transient state while preserving Octi puzzle progress", r.defaults);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

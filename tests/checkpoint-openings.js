#!/usr/bin/env node
// Stable physical openings round-trip without replaying their one-shot inhabitants/effects.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var wanted=["kitchen-cabinet-1","kitchen-cabinet-3","cuddly-passthrough-door-2","cuddly-cabinet-door-1","witchy-door-1","witchy-door-2","balcony-door"];',
  'var saved={version:1,savedAt:Date.now(),progress:{room:"cuddly",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{cuddly:{door:false}},phone:null,album:null,systems:{openings:{open:wanted,grill:{uncovered:true,open:true},surprise:{kind:"goat",cabinet:2}}}};',
  'if(!sessionStorage.getItem("checkpoint-openings-seeded")){sessionStorage.setItem("checkpoint-openings-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'var report={errors:[],steps:{}};function state(){var g=window.__coveredGrillState(),surprise=window.__kitchenCabinetSurpriseState();return {open:wanted.map(function(id){return [id,document.getElementById(id).classList.contains("open")];}),nook:document.getElementById("cuddly-balcony-door").classList.contains("open"),grill:g,surprise:surprise,goat:document.getElementById("kitchen-cabinet-goat").style.display,ghost:document.getElementById("kitchen-cabinet-ghost").style.display,placement:document.getElementById("kitchen-cabinet-surprise").style.transform,wobbling:!!document.querySelector("#kitchen-cabinet-surprise .wobbling"),mouse:document.getElementById("cuddly-mouse").classList.contains("scurrying"),cat:document.getElementById("witchy-chest-cat-walk").classList.contains("out"),fairy:document.getElementById("witchy-chest-fairy").classList.contains("released"),roach:window.__kitchenRoachState()};}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();',
  ' setTimeout(function(){try{report.steps.restored=state();report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.openings;',
  ' window.__restoreCheckpointSystems({openings:{open:["not-a-door","kitchen-cabinet-2"],grill:{uncovered:false,open:true},surprise:{kind:"octopus",cabinet:9}}},"beforeStage");',
  ' var g=window.__coveredGrillState();report.steps.validated={one:document.getElementById("kitchen-cabinet-1").classList.contains("open"),two:document.getElementById("kitchen-cabinet-2").classList.contains("open"),bad:!!document.getElementById("not-a-door"),grill:g,surprise:window.__kitchenCabinetSurpriseState()};',
  ' window.__restoreCheckpointSystems({openings:{open:["kitchen-cabinet-2"],grill:{uncovered:false,open:false}}},"beforeStage");report.steps.legacy=window.__kitchenCabinetSurpriseState();',
  ' var revision=window.loft.api.stateVersion;document.getElementById("kitchen-cabinet-2").dispatchEvent(new MouseEvent("click",{bubbles:true}));setTimeout(function(){var row=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems.openings;report.steps.interaction={closed:row.open.indexOf("kitchen-cabinet-2")===-1,revisionBefore:revision,revisionAfter:window.loft.api.stateVersion};report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},500);',
  '}catch(e){window.__errs.push("inner: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},450);',
  '}catch(e){window.__errs.push("outer: "+String(e&&e.stack||e));report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);}},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html checkpoint physical openings:");
var r = lib.runPageSync("loft-day.html", HARNESS, 2200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps, restored = s.restored, persisted = s.persisted, validated = s.validated, legacy = s.legacy, interaction = s.interaction;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(restored && restored.open.every(function (pair) { return pair[1]; }) && restored.nook,
  "Continue restores every selected cabinet/chest/passthrough and both views of the balcony door", restored);
check(restored && restored.grill.uncovered && restored.grill.open,
  "Continue restores the uncovered grill and its raised lid", restored);
check(restored && restored.surprise.kind === "goat" && restored.surprise.cabinet === 2 &&
  restored.goat === "" && restored.ghost === "none" &&
  restored.placement === "translateX(150px)" && !restored.wobbling,
  "Continue restores the cabinet occupant and location without replaying its effect", restored);
check(restored && !restored.mouse && !restored.cat && !restored.fairy && restored.roach.state === "hidden",
  "settling open doors does not replay their mouse, cat, fairy, or cockroach effects", restored);
check(persisted && persisted.open.join(",") === [
  "kitchen-cabinet-1", "kitchen-cabinet-3", "cuddly-passthrough-door-2",
  "cuddly-cabinet-door-1", "witchy-door-1", "witchy-door-2", "balcony-door"
].join(",") && persisted.grill.uncovered && persisted.grill.open &&
  persisted.surprise.kind === "goat" && persisted.surprise.cabinet === 2,
  "the post-Continue checkpoint captures the settled row again", persisted);
check(validated && !validated.one && validated.two && !validated.bad &&
  !validated.grill.uncovered && !validated.grill.open &&
  validated.surprise.kind === "goat" && validated.surprise.cabinet === 2,
  "restore accepts only known openings and valid cabinet occupants, and cannot leave a covered grill lid open", validated);
check(legacy && legacy.kind === "goat" && legacy.cabinet === 2,
  "an older openings row without surprise data preserves the visit's selected occupant", legacy);
check(interaction && interaction.closed && interaction.revisionBefore === interaction.revisionAfter,
  "a physical toggle schedules its checkpoint without becoming an API state revision", interaction);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

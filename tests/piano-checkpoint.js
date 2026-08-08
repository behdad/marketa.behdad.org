#!/usr/bin/env node
// A dismissed projector piano survives the real reload/Continue path. Only a deliberate
// projector-channel change within the recovered visit may bring it back.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function snap(){var s=window.__projectorPianoState(),p=document.getElementById("cuddly-projector-piano");return {room:window.currentStageName,channel:window.__cuddlyProjector.channel(),enabled:s.enabled,dismissed:s.dismissed,hidden:p.classList.contains("piano-dismissed"),captured:window.__captureCheckpointSystems()["projector-piano"]};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' if(!sessionStorage.getItem("piano-checkpoint-seeded")){',
  '  window.__setMaxUnlocked(4);window.__setSecondRound(true,{releaseHeld:false});window.goToStage("cuddly");window.__cuddlyProjector.set("stars");window.__dismissProjectorPiano();',
  '  report.steps.before=snap();var saved=window.__saveLoftCheckpoint();sessionStorage.setItem("piano-checkpoint-seeded","1");sessionStorage.setItem("piano-checkpoint-before",JSON.stringify({saved:saved,state:report.steps.before}));location.reload();return;',
  ' }',
  ' report.steps.before=JSON.parse(sessionStorage.getItem("piano-checkpoint-before"));',
  ' var gate=document.getElementById("loft-recovery-gate"),button=gate&&gate.querySelector(".loft-recovery-btn");if(button)button.click();await sleep(650);',
  ' report.steps.restored=snap();window.goToStage("garden");window.goToStage("cuddly");report.steps.returned=snap();',
  ' window.__cuddlyProjector.set("stars");report.steps.same=snap();window.__cuddlyProjector.set("fire");window.__cuddlyProjector.set("stars");report.steps.changed=snap();',
  ' report.steps.persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["projector-piano"];',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},160);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html piano checkpoint recovery:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true, forceMotion: true, seedRandom: true, urlSuffix: "#play" });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {}, before = s.before || {}, restored = s.restored, returned = s.returned, same = s.same, changed = s.changed;
check(result.errors.length === 0, "reload/Continue harness has no uncaught errors", result.errors);
check(before.saved && before.state && before.state.dismissed && before.state.captured.dismissed,
  "dismissal is captured into the checkpoint before reload", before);
check(restored && restored.room === "cuddly" && restored.channel === "stars" && restored.dismissed && !restored.enabled && restored.hidden,
  "Continue restores the dismissed keybed in its saved room", restored);
check(returned && returned.dismissed && !returned.enabled && returned.hidden,
  "room navigation after Continue keeps the keybed dismissed", returned);
check(same && same.dismissed && !same.enabled,
  "re-selecting the same channel after Continue does not rearm it", same);
check(changed && !changed.dismissed && changed.enabled && !changed.hidden,
  "an explicit channel change after Continue rearms it", changed);
check(s.persisted && s.persisted.dismissed === true,
  "the recovered checkpoint retains the durable dismissal before a debounced rearm save", s.persisted);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

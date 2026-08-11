#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});window.__unlockAllRooms();window.__goToStage("balcony");window.__openEntranceRoom();window.__openEntrancePorscheDriveHud();await sleep(40);',
  'var horn=document.getElementById("entrance-drive-horn"),steering=document.getElementById("entrance-drive-steering"),door=document.getElementById("entrance-door-art");function pointer(type){horn.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:17,pointerType:"mouse"}));}',
  'report.steps.before={door:door.classList.contains("horn-answering"),horn:steering.classList.contains("horn-pressed")};pointer("pointerdown");report.steps.held={door:door.classList.contains("horn-answering"),horn:steering.classList.contains("horn-pressed")};pointer("pointerup");await sleep(30);report.steps.released={door:door.classList.contains("horn-answering"),horn:steering.classList.contains("horn-pressed")};pointer("pointerdown");pointer("pointercancel");await sleep(30);report.steps.cancelled={door:door.classList.contains("horn-answering"),horn:steering.classList.contains("horn-pressed")};',
  '}catch(error){report.errors.push(String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Porsche horn / entrance-door response:");
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
var s = result && result.steps || {};
check(s.before && !s.before.door && !s.before.horn, "horn and entrance door start idle", s.before);
check(s.held && s.held.door && s.held.horn, "holding the horn answers with the entrance door while preserving horn press state", s.held);
check(s.released && !s.released.door && !s.released.horn, "releasing the horn clears both transient states", s.released);
check(s.cancelled && !s.cancelled.door && !s.cancelled.horn, "cancelling the horn also clears both transient states", s.cancelled);

if (failures) { console.log("\n" + failures + " Porsche horn assertion(s) failed."); process.exit(1); }
console.log("\nPorsche horn assertions passed.");

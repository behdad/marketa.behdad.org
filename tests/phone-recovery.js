#!/usr/bin/env node
// Phone checkpoints retain the physical shell and restore Messages when it was open.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-1000,progress:{room:"office",maxUnlocked:4,phase2:true,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{"phone-shell":{unlocked:true,open:true,app:"music"}}};',
  'if(!sessionStorage.getItem("phone-recovery-seeded")){sessionStorage.setItem("phone-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function key(name){document.dispatchEvent(new KeyboardEvent("keydown",{key:name,code:name===" "?"Space":"",bubbles:true,cancelable:true}));}',
  'function shellState(){var shell=document.querySelector(".phone-shell");return {open:!!document.querySelector(".phone-backdrop.show"),locked:!!(shell&&shell.classList.contains("booting")),home:!!(shell&&shell.classList.contains("pm-home")),app:!!(shell&&shell.classList.contains("pm-app")),tiles:shell?shell.querySelectorAll(".phone-app-tile").length:0};}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' key(" ");await sleep(80);',
  ' var persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["phone-shell"];',
  ' report.steps.continued={gate:!!document.getElementById("loft-recovery-gate"),shell:shellState(),row:persisted};',
  ' window.__deliverPhoneMessage("cue_mail");',
  ' var selfie=window.__albumAddSelfie(new Blob(["checkpoint-shell"],{type:"image/png"}),{source:"phone",frame:"none",filter:"none"});',
  ' var ids=window.__openPhoneApp("__checkpoint_catalog__"),cases=ids.concat(["legacy-unknown",42,{app:"nested"}]),rows=[];',
  ' for(var i=0;i<cases.length;i++){',
  '   window.__restoreCheckpointSystems({"phone-shell":{unlocked:true,open:true,app:cases[i]}},"afterStage");await sleep(30);',
  '   var restored=shellState(),notes=document.getElementById("phone-app-notes");if(notes)notes.click();await sleep(20);',
  '   var functional=!!document.querySelector(".phone-shell.pm-app .pmn-pad"),captured=window.__captureCheckpointSystems()["phone-shell"];',
  '   window.__restoreCheckpointSystems({"phone-shell":{unlocked:true,open:true,app:cases[i]}},"afterStage");await sleep(20);',
  '   var back=document.querySelector(".pnav-back"),close=document.querySelector(".phone-close");if(i%2&&close)close.click();else if(back)back.click();await sleep(240);',
  '   rows.push({id:typeof cases[i]==="string"?cases[i]:typeof cases[i],restored:restored,functional:functional,captureKeys:Object.keys(captured).sort(),closed:!document.querySelector(".phone-backdrop.show")});',
  ' }',
  ' report.steps.rows=rows;report.steps.catalog=ids;',
  ' report.steps.data={message:window.__phoneMessageReceived("cue_mail"),selfie:!!selfie&&window.__albumList().some(function(row){return row.id===selfie.id;})};',
  ' window.__restoreCheckpointSystems({"phone-shell":{unlocked:false,open:true,app:"notes"}},"afterStage");await sleep(30);var locked=document.querySelector(".phone-shell");report.steps.locked={open:shellState().open,booting:!!(locked&&locked.classList.contains("booting")),app:shellState().app};',
  ' var ok=locked&&locked.querySelector(".pb-key.pb-ok");if(ok){ok.click();ok.click();ok.click();}await sleep(450);',
  ' var afterUnlock=JSON.parse(localStorage.getItem("loftCheckpoint:v1")).systems["phone-shell"];report.steps.unlocked={home:shellState().home,booting:!!(locked&&locked.classList.contains("booting")),saved:afterUnlock};',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html phone checkpoint recovery:");
var result = lib.runPageSync("loft-day.html", HARNESS, 10500, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var steps = result.steps || {};
var rows = steps.rows || [];
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(steps.continued && !steps.continued.gate && steps.continued.shell.open &&
  steps.continued.shell.locked && !steps.continued.shell.app,
  "Continue restores an open phone behind its lock screen", steps.continued);
check(steps.continued && steps.continued.row && Object.keys(steps.continued.row).sort().join(",") === "app,open,unlocked" && steps.continued.row.app === null,
  "the post-Continue checkpoint drops the legacy app identity", steps.continued && steps.continued.row);
check(steps.continued && steps.continued.row && steps.continued.row.unlocked === false,
  "the post-Continue checkpoint records the renewed phone lock", steps.continued && steps.continued.row);
check(steps.catalog && steps.catalog.length === 20 && rows.length === 23 &&
  rows.every(function (row) {
    var messages = row.id === "messages";
    return row.restored.open && row.restored.home === !messages && row.restored.app === messages &&
      row.restored.tiles === 20 && row.functional &&
      row.captureKeys.join(",") === "app,open,unlocked" && row.closed;
  }), "Messages resumes while every other current, legacy, and malformed app identity lands on a functional launcher", rows);
check(steps.data && steps.data.message && steps.data.selfie,
  "shell restoration preserves separately owned Messages and Album data", steps.data);
check(steps.locked && steps.locked.open && steps.locked.booting && !steps.locked.app,
  "a saved locked shell remains locked instead of reviving an app", steps.locked);
check(steps.unlocked && steps.unlocked.home && !steps.unlocked.booting &&
  steps.unlocked.saved && steps.unlocked.saved.unlocked === true,
  "unlocking the phone immediately persists its unlocked checkpoint state", steps.unlocked);

console.log("");
if (failures) {
  console.log(failures + " phone checkpoint assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Phone checkpoint assertions passed.");

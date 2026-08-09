#!/usr/bin/env node
// Phone checkpoints retain only compact, validated app data; the physical shell still
// restores to its launcher and Messages/Album keep their separate owners.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function row(state,id){return (state.appRows||[]).find(function(x){return x.id===id;});}',
  'function open(id){window.__openPhoneAppHere(id,false);return document.querySelector(".phone-shell");}',
  'function calcKey(shell,text){return Array.from(shell.querySelectorAll(".pc-key")).find(function(x){return x.textContent===text;});}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__setSecondRound(true,{releaseHeld:false});window.__deliverPhoneMessage("cue_mail");',
  ' var selfie=window.__albumAddSelfie(new Blob(["phone-data"],{type:"image/png"}),{source:"phone",frame:"none",filter:"none"});',
  ' var shell=open("cards");shell.querySelector(".pmc-next").click();shell.querySelector(".pmc-next").click();',
  ' shell=open("currency");var amount=shell.querySelector(".pmu-amt"),from=shell.querySelector(".pmu-from"),to=shell.querySelector(".pmu-to");amount.value="321.5";amount.dispatchEvent(new Event("input",{bubbles:true}));from.value="USD";from.dispatchEvent(new Event("change",{bubbles:true}));to.value="EUR";to.dispatchEvent(new Event("change",{bubbles:true}));',
  ' shell=open("calculator");["7","×","8","="].forEach(function(k){calcKey(shell,k).click();});',
  ' shell=open("dressup");shell.querySelector(\'[data-id="shades"]\').click();shell.querySelector(\'[data-id="veil"]\').click();',
  ' shell=open("album");shell.querySelector(".pm-album-view").click();',
  ' var saved=window.__checkpointPhoneCapture();S("saved",{rows:saved.appRows,message:window.__phoneMessageReceived("cue_mail"),selfie:!!selfie&&window.__albumList().some(function(x){return x.id===selfie.id;})});',
  ' var malformed=Object.assign({},saved,{appRows:[',
  '   {id:"cards",index:999},{id:"currency",amount:"1e999",from:"BTC",to:"EUR"},',
  '   {id:"calculator",state:{acc:null,pending:"*",cur:"8",fresh:true,errored:false}},',
  '   {id:"dressup",on:["veil","unknown","veil"]},{id:"album",compact:"yes",seenMaxId:1e20}',
  ' ]});window.__checkpointPhoneRestore(malformed);var clean=window.__checkpointPhoneCapture();S("malformed",{rows:clean.appRows,message:window.__phoneMessageReceived("cue_mail"),selfie:window.__albumList().some(function(x){return x.id===selfie.id;})});',
  ' window.__checkpointPhoneRestore(saved);',
  ' shell=open("cards");var cards=shell.querySelector(".pmc-count").textContent;',
  ' shell=open("currency");var currency={amount:shell.querySelector(".pmu-amt").value,from:shell.querySelector(".pmu-from").value,to:shell.querySelector(".pmu-to").value};',
  ' shell=open("calculator");var calculator=shell.querySelector(".pc-display").textContent;',
  ' shell=open("dressup");var dressup=Array.from(shell.querySelectorAll(".pmd-chip.on")).map(function(x){return x.dataset.id;}).sort();',
  ' shell=open("album");var album={compact:shell.querySelector(".pm-album-grid").classList.contains("compact"),seenMaxId:row(window.__checkpointPhoneCapture(),"album").seenMaxId};',
  ' window.__restoreCheckpointSystems({"phone-shell":{unlocked:true,open:true,app:"calculator"}},"afterStage");shell=document.querySelector(".phone-shell");',
  ' S("restored",{cards:cards,currency:currency,calculator:calculator,dressup:dressup,album:album,launcher:!!(shell&&shell.classList.contains("pm-home")&&!shell.classList.contains("pm-app")),message:window.__phoneMessageReceived("cue_mail"),selfie:window.__albumList().some(function(x){return x.id===selfie.id;})});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},350);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html phone checkpoint data:");
var result = lib.runPageSync("loft-day.html", HARNESS, 2600, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {}, saved = s.saved || {}, malformed = s.malformed || {}, restored = s.restored || {};
var savedRows = saved.rows || [], badRows = malformed.rows || [];
function find(rows, id) { return rows.find(function (row) { return row.id === id; }) || {}; }

check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(savedRows.length === 5 && savedRows.map(function (row) { return row.id; }).join(",") === "cards,currency,calculator,dressup,album",
  "capture emits exactly the five allowlisted compact app rows", savedRows);
check(find(savedRows, "cards").index === 2 &&
  find(savedRows, "currency").amount === "321.5" && find(savedRows, "currency").from === "USD" && find(savedRows, "currency").to === "EUR" &&
  find(savedRows, "calculator").state && find(savedRows, "calculator").state.cur === "56" &&
  find(savedRows, "dressup").on.join(",") === "shades,veil" &&
  find(savedRows, "album").compact && find(savedRows, "album").seenMaxId > 0,
  "capture retains phrasebook, converter, validated calculator, outfit, and album projection", savedRows);
check(saved.message && saved.selfie, "capture leaves separately owned Messages and Album records intact", saved);
check(find(badRows, "cards").index === 0 &&
  find(badRows, "currency").amount === "100" && find(badRows, "currency").from === "CAD" && find(badRows, "currency").to === "CZK" &&
  find(badRows, "calculator").state === null &&
  find(badRows, "dressup").on.join(",") === "veil" &&
  !find(badRows, "album").compact && find(badRows, "album").seenMaxId === 0,
  "malformed and unknown values fall back independently without escaping their bounds", badRows);
check(malformed.message && malformed.selfie, "invalid compact rows do not erase Messages or Album data", malformed);
check(restored.cards.indexOf("3 / ") === 0 &&
  restored.currency && restored.currency.amount === "321.5" && restored.currency.from === "USD" && restored.currency.to === "EUR" &&
  restored.calculator === "56" && restored.dressup && restored.dressup.join(",") === "shades,veil" &&
  restored.album && restored.album.compact && restored.album.seenMaxId === find(savedRows, "album").seenMaxId,
  "valid rows rebuild each app's compact data", restored);
check(restored.launcher && restored.message && restored.selfie,
  "shell recovery still lands on the launcher while Messages and Album survive", restored);

console.log("");
if (failures) { console.log(failures + " phone checkpoint data assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Phone checkpoint data assertions passed.");

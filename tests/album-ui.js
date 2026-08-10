#!/usr/bin/env node
// Album UI: session-only photobooth selfies, compact view, search keys, and per-photo removal.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  ' var initialList=window.__albumList(),initial=initialList.length;S("preroll",{count:initial,unique:(new Set(initialList.map(function(x){return x.subjectId;}))).size,allShoot:initialList.every(function(x){return x.shoot;}),couple:initialList.some(function(x){return x.subjectId==="shoot-couple";}),aspen:initialList.some(function(x){return x.subjectId==="shoot-aspen";})});',
  ' var first=window.__albumAddSelfie(new Blob(["first"],{type:"image/png"}),{source:"phone",filter:"none",frame:"none"});',
  ' var firstUrl=first&&first.selfieUrl;',
  ' var updated=window.__albumAddSelfie(new Blob(["second"],{type:"image/png"}),{id:first&&first.id,source:"phone",filter:"sepia(1)",frame:"hearts"});',
  ' var list=window.__albumList(),safe=window.__chatContext("show my album").apps.album;',
  ' S("store",{initial:initial,count:list.length,id:first&&first.id,updatedId:updated&&updated.id,urlChanged:!!updated&&updated.selfieUrl!==firstUrl,filter:updated&&updated.filter,kind:safe&&safe[0]&&safe[0].kind,leaks:safe&&safe.some(function(x){return Object.prototype.hasOwnProperty.call(x,"selfieUrl")||Object.prototype.hasOwnProperty.call(x,"selfieBlob");})});',
  ' window.phone.open("album");await sleep(120);',
  ' var shell=document.querySelector(".phone-shell"),card=document.querySelector(".pm-pol-selfie"),view=document.querySelector(".pm-album-view");',
  ' view.click();S("compact",{active:view.classList.contains("active"),grid:document.querySelector(".pm-album-grid").classList.contains("compact"),cards:document.querySelectorAll(".pm-polaroid").length,deleteButtons:document.querySelectorAll(".pm-pol-delete").length,selfie:!!card});',
  ' shell.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));await sleep(20);var search=document.activeElement;S("slash",{active:search&&search.className});',
  ' search.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(40);S("back",{phone:!!document.querySelector(".phone-backdrop.show"),home:shell.classList.contains("pm-home"),album:!!document.querySelector(".pm-album"),active:document.activeElement&&document.activeElement.className});',
  ' window.__openPhoneAppHere("album",true);await sleep(40);shell.focus();shell.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(260);S("directEscape",{phone:!!document.querySelector(".phone-backdrop.show")});',
  ' window.__openPhoneAppHere("album",true);await sleep(40);shell.focus();shell.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(260);S("directBackspace",{phone:!!document.querySelector(".phone-backdrop.show")});',
  ' window.phone.open("album");await sleep(80);card=document.querySelector(".pm-pol-selfie");var del=card&&card.querySelector(".pm-pol-delete");if(del)del.click();await sleep(80);S("remove",{count:window.__albumList().length,selfie:!!document.querySelector(".pm-pol-selfie"),stillAlbum:!!document.querySelector(".pm-album")});',
  ' window.__setSecondRound(true,{releaseHeld:false});window.__setGardenParty(true,false);var portrait=window.__albumAdd(true);var group=window.__albumAddGroupPhoto();window.__setGardenParty(false,true);window.__albumRefresh();await sleep(80);',
  ' var recap=document.querySelector(".pm-album-recap-toggle");var liveCount=window.__albumList().filter(function(x){return !x.shoot;}).length;if(recap)recap.click();await sleep(80);var headings=Array.prototype.map.call(document.querySelectorAll(".pm-album-section h3"),function(x){return x.textContent;});S("recap",{available:!!recap,portrait:!!portrait,group:!!group,open:document.querySelector(".pm-album-grid").classList.contains("recap"),sections:headings,cards:document.querySelectorAll(".pm-album-section-grid .pm-polaroid").length,live:liveCount});',
  ' setLang("cs");await sleep(80);S("recapCs",{title:document.querySelector(".pm-album-recap b").textContent,headings:Array.prototype.map.call(document.querySelectorAll(".pm-album-section h3"),function(x){return x.textContent;})});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Album UI:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.preroll.count === 7 && s.preroll.unique === 7 && s.preroll.allShoot && s.preroll.couple && s.preroll.aspen, "a fresh album pins the first two portraits and adds five distinct shuffled pre-wedding portraits", s.preroll);
check(s.store.count === s.store.initial + 1 && s.store.id === s.store.updatedId && s.store.urlChanged && s.store.filter === "sepia(1)", "a selfie is added once and styling updates the same session record", s.store);
check(s.store.kind === "selfie" && !s.store.leaks, "chat receives only selfie metadata, never pixels, blobs, or object URLs", s.store);
check(s.compact.active && s.compact.grid && s.compact.cards === s.compact.deleteButtons && s.compact.selfie, "compact mode makes a two-column roll and every picture has a remove button", s.compact);
check(s.slash.active === "pm-as-input", "/ focuses the Album search field", s.slash);
check(s.back.phone && !s.back.home && s.back.album && s.back.active === "pm-as-input", "Backspace leaves an empty Album search open and focused", s.back);
check(!s.directEscape.phone && !s.directBackspace.phone, "Escape and Backspace close a directly opened Aspen Album", { escape: s.directEscape, backspace: s.directBackspace });
check(s.remove.count === s.store.initial && !s.remove.selfie && s.remove.stillAlbum, "removing a selfie updates the open Album without leaving it", s.remove);
check(s.recap.available && s.recap.portrait && s.recap.group && s.recap.open && s.recap.cards === s.recap.live, "after the party, the recap groups every live keepsake and excludes pre-wedding seed photos", s.recap);
check(s.recap.sections.indexOf("everyone together") !== -1 && s.recap.sections.indexOf("portraits") !== -1, "the recap separates the group keepsake from party portraits", s.recap);
check(s.recapCs.title === "dnešní večer v loftu" && s.recapCs.headings.indexOf("všichni společně") !== -1, "the open recap relabels in Czech without losing its view", s.recapCs);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

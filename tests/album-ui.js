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
  ' var initial=window.__albumList().length;',
  ' var first=window.__albumAddSelfie(new Blob(["first"],{type:"image/png"}),{source:"phone",filter:"none",frame:"none"});',
  ' var firstUrl=first&&first.selfieUrl;',
  ' var updated=window.__albumAddSelfie(new Blob(["second"],{type:"image/png"}),{id:first&&first.id,source:"phone",filter:"sepia(1)",frame:"hearts"});',
  ' var list=window.__albumList(),safe=window.__chatContext("show my album").apps.album;',
  ' S("store",{initial:initial,count:list.length,id:first&&first.id,updatedId:updated&&updated.id,urlChanged:!!updated&&updated.selfieUrl!==firstUrl,filter:updated&&updated.filter,kind:safe&&safe[0]&&safe[0].kind,leaks:safe&&safe.some(function(x){return Object.prototype.hasOwnProperty.call(x,"selfieUrl")||Object.prototype.hasOwnProperty.call(x,"selfieBlob");})});',
  ' window.phone("album");await sleep(120);',
  ' var shell=document.querySelector(".phone-shell"),card=document.querySelector(".pm-pol-selfie"),view=document.querySelector(".pm-album-view");',
  ' view.click();S("compact",{pressed:view.getAttribute("aria-pressed"),grid:document.querySelector(".pm-album-grid").classList.contains("compact"),cards:document.querySelectorAll(".pm-polaroid").length,deleteButtons:document.querySelectorAll(".pm-pol-delete").length,selfie:!!card});',
  ' shell.dispatchEvent(new KeyboardEvent("keydown",{key:"/",bubbles:true,cancelable:true}));await sleep(20);var search=document.activeElement;S("slash",{active:search&&search.className});',
  ' search.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));await sleep(40);S("back",{phone:!!document.querySelector(".phone-backdrop.show"),home:shell.classList.contains("pm-home")});',
  ' window.phone("album");await sleep(80);card=document.querySelector(".pm-pol-selfie");var del=card&&card.querySelector(".pm-pol-delete");if(del)del.click();await sleep(80);S("remove",{count:window.__albumList().length,selfie:!!document.querySelector(".pm-pol-selfie"),stillAlbum:!!document.querySelector(".pm-album")});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Album UI:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3000, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.store.count === s.store.initial + 1 && s.store.id === s.store.updatedId && s.store.urlChanged && s.store.filter === "sepia(1)", "a selfie is added once and styling updates the same session record", s.store);
check(s.store.kind === "selfie" && !s.store.leaks, "chat receives only selfie metadata, never pixels, blobs, or object URLs", s.store);
check(s.compact.pressed === "true" && s.compact.grid && s.compact.cards === s.compact.deleteButtons && s.compact.selfie, "compact mode makes a two-column roll and every picture has a remove button", s.compact);
check(s.slash.active === "pm-as-input", "/ focuses the Album search field", s.slash);
check(s.back.phone && s.back.home, "Backspace in an empty Album search performs the app's normal back navigation", s.back);
check(s.remove.count === s.store.initial && !s.remove.selfie && s.remove.stillAlbum, "removing a selfie updates the open Album without leaving it", s.remove);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

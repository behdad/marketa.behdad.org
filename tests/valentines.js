#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return true;};garden.set(false);window.goToStage("cuddly");',
  ' var strip=document.getElementById("loft-game-strip"),bunting=document.getElementById("cuddly-valentine-bunting"),hit=document.getElementById("cuddly-valentine-heart-hit"),bouquet=document.getElementById("cuddly-valentine-bouquet"),couple=document.getElementById("cuddly-couple");',
  ' window.__jumpToDate(2027,0,31);await sleep(50);S("ordinary",{season:strip.classList.contains("season-valentines"),bunting:getComputedStyle(bunting).display,bouquet:getComputedStyle(bouquet).display});',
  ' window.__jumpToDate(2027,1,14);await sleep(80);var box=bunting.getBBox(),center=document.querySelector("#cuddly-valentine-bunting .v3").parentNode.transform.baseVal.consolidate().matrix;',
  ' S("active",{season:strip.classList.contains("season-valentines"),room:window.currentStageName,width:box.width,height:box.height,centerScale:center.a,hit:getComputedStyle(hit).pointerEvents,bouquet:getComputedStyle(bouquet).display,bouquetParent:bouquet.parentNode&&bouquet.parentNode.id,handAfter:bouquet.nextElementSibling&&bouquet.nextElementSibling.tagName});',
  ' hit.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(60);var kiss=bunting.querySelector(".cuddly-valentine-kiss");S("click",{count:bunting.querySelectorAll(".cuddly-valentine-kiss-wrap").length,animation:kiss&&getComputedStyle(kiss).animationName});',
  ' await sleep(1550);S("clickCleanup",{count:bunting.querySelectorAll(".cuddly-valentine-kiss-wrap").length});',
  ' window.goToStage("garden");await sleep(50);hit.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);S("roomGate",{room:window.currentStageName,count:bunting.querySelectorAll(".cuddly-valentine-kiss-wrap").length});',
  ' window.goToStage("cuddly");garden.set(true);await sleep(80);S("party",{couple:couple.classList.contains("at-party"),visibility:getComputedStyle(couple).visibility});garden.set(false);',
  ' window.__jumpToDate(2027,1,15);await sleep(80);S("leave",{season:strip.classList.contains("season-valentines"),bunting:getComputedStyle(bunting).display,bouquet:getComputedStyle(bouquet).display,kisses:bunting.querySelectorAll(".cuddly-valentine-kiss-wrap").length});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var REDUCED = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(async function(){try{window.__gameStarted=function(){return true;};window.goToStage("cuddly");window.__jumpToDate(2027,1,14);await sleep(80);var b=document.getElementById("cuddly-valentine-bunting"),h=document.getElementById("cuddly-valentine-heart-hit"),heart=b.querySelector(".sn-vheart");h.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(40);var kiss=b.querySelector(".cuddly-valentine-kiss");report.steps.active={heart:getComputedStyle(heart).animationName,kiss:kiss&&getComputedStyle(kiss).animationName,count:b.querySelectorAll(".cuddly-valentine-kiss-wrap").length};await sleep(1550);report.steps.cleanup=b.querySelectorAll(".cuddly-valentine-kiss-wrap").length;}catch(e){window.__errs.push("reduced: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Valentine's Day Cuddly special:");
var result = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true, forceMotion: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.ordinary && !s.ordinary.season && s.ordinary.bunting === "none" && s.ordinary.bouquet === "none",
  "an ordinary day keeps both Valentine additions absent", s.ordinary);
check(s.active && s.active.season && s.active.room === "cuddly" && s.active.width >= 150 &&
  s.active.height >= 50 && s.active.centerScale >= 2.35 && s.active.hit === "all",
  "February 14 reveals a clearly enlarged, clickable heart string", s.active);
check(s.active && s.active.bouquet !== "none" && s.active.bouquetParent === "cuddly-marketa-right-arm-inner" &&
  s.active.handAfter === "circle",
  "Markéta's roses ride behind the hand in her moving arm wrapper", s.active);
check(s.click && s.click.count === 6 && s.click.animation === "cuddly-valentine-kiss-fly" &&
  s.clickCleanup && s.clickCleanup.count === 0,
  "a click launches six kisses and cleans every particle", { click: s.click, cleanup: s.clickCleanup });
check(s.roomGate && s.roomGate.room === "garden" && s.roomGate.count === 0,
  "off-room activation cannot leak kisses into Cuddly", s.roomGate);
check(s.party && s.party.couple && s.party.visibility === "hidden",
  "the bouquet leaves with Markéta when the hosts go to the party", s.party);
check(s.leave && !s.leave.season && s.leave.bunting === "none" && s.leave.bouquet === "none" && s.leave.kisses === 0,
  "leaving Valentine's Day restores the normal scene cleanly", s.leave);

var reduced = lib.runPageSync("rsvp.html", REDUCED, 2700, {
  patchRaf: true, forceReduce: true, chromeFlags: "--force-prefers-reduced-motion=reduce"
});
check(reduced && reduced.errors.length === 0, "reduced-motion probe has no page errors", reduced && reduced.errors);
check(reduced && reduced.steps.active && reduced.steps.active.heart === "none" &&
  reduced.steps.active.kiss === "cuddly-valentine-kiss-fade" && reduced.steps.active.count === 6 &&
  reduced.steps.cleanup === 0,
  "reduced motion replaces flight with a short fade and still cleans up", reduced && reduced.steps);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

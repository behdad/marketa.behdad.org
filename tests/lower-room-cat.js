#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],cinema:[]};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function snap(){var pos=document.getElementById("witchy-chest-cat-pos"),walk=document.getElementById("witchy-chest-cat-walk"),breathe=document.getElementById("witchy-chest-cat-breathe"),hit=document.getElementById("witchy-chest-cat-hit");hit.scrollIntoView({block:"center",inline:"center"});var r=hit.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {count:document.querySelectorAll("#witchy-chest-cat-pos").length,parent:pos.parentNode&&pos.parentNode.id,transform:pos.getAttribute("transform"),visible:pos.style.visibility!=="hidden",napping:breathe.classList.contains("napping"),walkTransform:getComputedStyle(walk).transform,hitWidth:r.width,hitHeight:r.height,hitTop:!!(top&&hit.parentNode.contains(top)),hitTopId:top&&(top.id||top.tagName)};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' document.getElementById("hunt-fullscreen-area").scrollIntoView({block:"center"});await sleep(80);',
  ' window.__releaseCat(true);window.goToStage("cuddly");',
  ' for(var i=0;i<4;i++){window.__openCinemaRoom();await sleep(i===3?1200:60);if(i===3)document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.cinema.push(snap());window.__closeCinemaRoom();await sleep(60);}',
  ' window.goToStage("office");window.__openBedroomRoom();await sleep(1200);document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.bedroom=snap();window.__closeBedroomRoom();await sleep(60);',
  ' window.goToStage("kitchen");window.__openBathroomRoom();await sleep(60);report.bathroom=snap();window.__closeBathroomRoom();await sleep(60);',
  ' window.goToStage("balcony");window.__openEntranceRoom();await sleep(60);report.entrance=snap();window.__closeEntranceRoom();await sleep(60);',
  ' window.goToStage("garden");window.__openGardenPrince();await sleep(60);report.dungeon=snap();window.__closeMonitorPrince();await sleep(900);report.returned=snap();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
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

console.log("rsvp.html lower-room cat cameos:");
var r = lib.runPageSync("rsvp.html", HARNESS, 11000, {
  patchRaf: true,
  forceHybridPointer: true,
  chromeFlags: "--window-size=844,390",
  urlSuffix: "#play"
});
if (!r) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(r.cinema && r.cinema.length === 4 &&
  r.cinema.every(function (s) { return s.count === 1 && s.parent === "cinema-furniture-overlay" && s.visible; }) &&
  new Set(r.cinema.slice(0, 3).map(function (s) { return s.transform; })).size === 3,
  "one cat alternates across the pouf and both bicycles", r.cinema);
check(r.cinema && r.cinema[0].napping &&
  r.cinema[3].walkTransform.indexOf("-195, -65") !== -1,
  "the pouf settles the cat and the fourth cinema visit hops onto the daybed", r.cinema);
check(r.cinema && r.cinema.every(function (s) {
  return s.hitWidth >= 44 && s.hitHeight >= 44 && s.hitTop;
}), "the lower-room cat keeps a topmost 44px touch target", r.cinema);
check(r.bedroom && r.bedroom.count === 1 && r.bedroom.parent === "bedroom-room-art" &&
  r.bedroom.visible && r.bedroom.walkTransform !== "none",
  "the bedroom cat hops from the floor onto the bed", r.bedroom);
check(r.bathroom && r.bathroom.count === 1 && !r.bathroom.visible &&
  r.entrance && r.entrance.count === 1 && !r.entrance.visible,
  "the same cat stays hidden in the bathroom and entrance", { bathroom: r.bathroom, entrance: r.entrance });
check(r.dungeon && r.dungeon.count === 1 && r.dungeon.parent === "prince-cat-overlay" && r.dungeon.visible &&
  r.returned && r.returned.count === 1 && r.returned.parent === "garden-chest" && r.returned.visible,
  "the dungeon cameo returns cleanly to the upstairs garden", { dungeon: r.dungeon, returned: r.returned });

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

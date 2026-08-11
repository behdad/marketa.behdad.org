#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],cinema:[]};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function snap(){var pos=document.getElementById("witchy-chest-cat-pos"),walk=document.getElementById("witchy-chest-cat-walk"),breathe=document.getElementById("witchy-chest-cat-breathe"),cat=document.getElementById("witchy-chest-cat"),hit=document.getElementById("witchy-chest-cat-hit");hit.scrollIntoView({block:"center",inline:"center"});var r=hit.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {count:document.querySelectorAll("#witchy-chest-cat-pos").length,parent:pos.parentNode&&pos.parentNode.id,transform:pos.getAttribute("transform"),visible:pos.style.visibility!=="hidden",napping:breathe.classList.contains("napping"),wobbling:cat.classList.contains("wobbling"),walkTransform:getComputedStyle(walk).transform,animations:walk.getAnimations().map(function(a){return a.effect&&a.effect.getComputedTiming().duration;}),hit:[r.left,r.top,r.right,r.bottom],hitWidth:r.width,hitHeight:r.height,hitTop:!!(top&&hit.parentNode.contains(top)),hitTopId:top&&(top.id||top.tagName)};}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' document.getElementById("hunt-fullscreen-area").scrollIntoView({block:"center"});await sleep(80);',
  ' window.__releaseCat(true);window.__goToStage("cuddly");',
  ' for(var i=0;i<4;i++){window.__openCinemaRoom();await sleep(i===3?1200:60);if(i===3)document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.cinema.push(snap());window.__closeCinemaRoom();await sleep(60);}',
  ' window.__goToStage("office");window.__openBedroomRoom();await sleep(60);document.getElementById("bedroom-sprinkler").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);report.bedroomFloorSpray=snap();await sleep(1100);document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.bedroom=snap();document.getElementById("bedroom-sprinkler").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);report.bedroomStartled=snap();document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.bedroomFloor=snap();window.__closeBedroomRoom();await sleep(60);',
  ' window.__goToStage("kitchen");window.__openBathroomRoom();await sleep(60);report.bathroomStart=snap();window.__closeBathroomRoom();await sleep(60);report.bathroomCancelled=snap();await sleep(900);report.bathroomAfterTimer=snap();window.__openBathroomRoom();await sleep(900);report.bathroomHop=snap();document.getElementById("witchy-chest-cat-walk").getAnimations().forEach(function(a){try{a.finish();}catch(_e){}});await sleep(40);report.bathroomSettled=snap();var water=document.getElementById("bathroom-tub-water").getBoundingClientRect(),toilet=document.getElementById("bathroom-toilet-action").getBoundingClientRect();report.bathroomBounds={water:[water.left,water.top,water.right,water.bottom],toilet:[toilet.left,toilet.top,toilet.right,toilet.bottom]};document.getElementById("bathroom-tub").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));var bubble=document.getElementById("bathroom-bubble-2"),bubbleHit=bubble.querySelector(".bathroom-bubble-hit"),bubbleBox=bubbleHit.getBoundingClientRect(),bubbleTop=document.elementFromPoint(bubbleBox.left+bubbleBox.width/2,bubbleBox.top+bubbleBox.height/2);report.bathroomBubbleTop=!!(bubbleTop&&bubble.contains(bubbleTop));window.__closeBathroomRoom();await sleep(60);if(window.__bathroomRoomOpen)window.__closeBathroomRoom();await sleep(60);report.bathroomReturned=snap();',
  ' window.__goToStage("balcony");window.__openEntranceRoom();await sleep(60);report.entrance=snap();window.__closeEntranceRoom();await sleep(60);',
  ' window.__goToStage("garden");window.__openGardenPrince();await sleep(60);report.dungeon=snap();window.__closeMonitorPrince();await sleep(900);report.returned=snap();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var REDUCED_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){window.addEventListener("load",function(){setTimeout(function(){',
  'var report={};try{window.__releaseCat(true);window.__goToStage("office");window.__openBedroomRoom();',
  'var sprinkler=document.getElementById("bedroom-sprinkler");sprinkler.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'var pos=document.getElementById("witchy-chest-cat-pos"),walk=document.getElementById("witchy-chest-cat-walk"),breathe=document.getElementById("witchy-chest-cat-breathe");',
  'report={transform:pos.getAttribute("transform"),napping:breathe.classList.contains("napping"),animations:walk.getAnimations().map(function(a){return a.effect&&a.effect.getComputedTiming().duration;}),errors:window.__errs};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},220);});})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html lower-room cat cameos:");
var r = lib.runPageSync("loft-day.html", HARNESS, 11000, {
  patchRaf: true,
  forceHybridPointer: true,
  chromeFlags: "--window-size=844,390",
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
check(r.bedroomFloorSpray && r.bedroomFloorSpray.animations.indexOf(720) === -1 &&
  !r.bedroomFloorSpray.wobbling,
  "the bedroom sprinkler leaves a cat that has not reached the bed alone", r.bedroomFloorSpray);
check(r.bedroomStartled && r.bedroomStartled.animations.indexOf(720) !== -1 &&
  r.bedroomStartled.wobbling && !r.bedroomStartled.napping &&
  r.bedroomFloor && r.bedroomFloor.walkTransform.indexOf("matrix(1, 0, 0, 1, 0, 0)") !== -1,
  "the bedroom sprinkler startles a perched cat awake and back onto the floor",
  { startled: r.bedroomStartled, floor: r.bedroomFloor });
check(r.bathroomStart && r.bathroomStart.count === 1 &&
  r.bathroomStart.parent === "bathroom-cat-overlay" && r.bathroomStart.visible &&
  r.bathroomStart.transform === "translate(-426,1)" && r.bathroomStart.hitTop,
  "the same loose cat starts beside the bathroom tub with its touch target on top", r.bathroomStart);
check(r.bathroomHop && r.bathroomHop.animations.indexOf(1250) !== -1 &&
  r.bathroomSettled && r.bathroomSettled.walkTransform.indexOf("85, -108") !== -1 &&
  !r.bathroomSettled.napping,
  "the bathroom cameo makes a playful two-beat hop onto the tub rim", {
    hop: r.bathroomHop, settled: r.bathroomSettled
  });
check(r.bathroomBounds && r.bathroomSettled &&
  r.bathroomSettled.hit[0] >= r.bathroomBounds.water[0] &&
  r.bathroomSettled.hit[2] <= r.bathroomBounds.water[2] &&
  r.bathroomSettled.hit[3] >= r.bathroomBounds.water[1] &&
  r.bathroomSettled.hit[2] < r.bathroomBounds.toilet[0],
  "the landed cat stays over the bath water and clear of the toilet nook", {
    cat: r.bathroomSettled.hit, bounds: r.bathroomBounds
  });
check(r.bathroomBubbleTop,
  "the active bubble hunt stays tappable in front of the cat cameo");
check(r.bathroomCancelled && r.bathroomCancelled.parent === "stage-kitchen" &&
  r.bathroomCancelled.visible && r.bathroomCancelled.animations.indexOf(1250) === -1 &&
  r.bathroomAfterTimer && r.bathroomAfterTimer.parent === "stage-kitchen" &&
  r.bathroomAfterTimer.animations.indexOf(1250) === -1,
  "leaving before the cameo clears its delayed hop before the cat resumes upstairs", {
    cancelled: r.bathroomCancelled, afterTimer: r.bathroomAfterTimer
  });
check(r.bathroomReturned && r.bathroomReturned.parent === "stage-kitchen" &&
  r.bathroomReturned.visible && r.bathroomReturned.animations.indexOf(1250) === -1,
  "leaving after the cameo cancels its held animation cleanly", {
    returned: r.bathroomReturned
  });
check(r.entrance && r.entrance.count === 1 && !r.entrance.visible,
  "the entrance remains cat-free", r.entrance);
check(r.dungeon && r.dungeon.count === 1 && r.dungeon.parent === "prince-cat-overlay" && r.dungeon.visible &&
  r.returned && r.returned.count === 1 && r.returned.parent === "garden-chest" && r.returned.visible,
  "the dungeon cameo returns cleanly to the upstairs garden", { dungeon: r.dungeon, returned: r.returned });

var reduced = lib.runPageSync("loft-day.html", REDUCED_HARNESS, 1200, {
  patchRaf: true,
  forceReduce: true,
  chromeFlags: "--force-prefers-reduced-motion=reduce",
});
check(reduced && reduced.errors.length === 0,
  "the reduced-motion sprinkler reaction has no page errors", reduced && reduced.errors);
check(reduced && reduced.transform === "translate(-558,33)" && !reduced.napping &&
  reduced.animations.indexOf(720) === -1,
  "reduced motion puts the startled bed cat directly on the floor without a jump", reduced);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

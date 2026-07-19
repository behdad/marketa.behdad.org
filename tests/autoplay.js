#!/usr/bin/env node
// Autoplay (attract-mode) test: the self-driving BBQ STATE MACHINE.
//
// Verifies the supervisor's contract for the rearchitected autoplay — an observe-decide-act
// loop that TAKES OVER IN PLACE, REACTS TO NOTIFICATIONS, and LOOPS forever. It does NOT
// assert the choreography of any one room (play.js / enter.js already exercise every solve);
// it asserts the machine's behaviour. Same one-shot headless-Chrome runner as play.js
// (rAF->setTimeout patch, error collectors).
//
// It runs in phases on one page load:
//   1. TAKE OVER IN PLACE — put the game in a NON-kitchen room first (goToStage('office')),
//      THEN autoplay(true). Assert the badge shows, autoplay is on, and it did NOT jump back
//      to the kitchen (the old design replayed the fixed kitchen->balcony cinematic; the new
//      one drives on from wherever the game already is).
//   2. DRIVES MULTIPLE ROOMS + LOOPS — let the machine run; assert its step counter grows
//      (it keeps taking actions) and it visits more than one distinct room over time (it
//      travels the loft), i.e. it advances and loops, forever.
//   3. HANDLE A NOTIFICATION — deliver a phone text mid-run (__deliverPhoneMessage) with an
//      action that pans to a KNOWN room; assert the machine OPENS + CLEARS it (it's no longer
//      the top unread) and ACTS on it (the room changes to the message's target) —
//      notifications are part of the flow.
//   4. PAUSE / no-accumulate — while running, hide the tab: the step counter STOPS growing
//      while hidden (paused, not ticking) and the DOM node count stays bounded across a long
//      hidden spell (no pile-up — the crickets rule). Unhiding resumes it. An UNFOCUSED-but-
//      visible tab pauses the same way (blur path).
//   5. TAKEOVER — __autoplayTakeover exits (keeps idle-resume), then autoplay(false) stops it
//      for good, and a plain synthetic CLICK afterwards does NOT re-arm / re-start it (the
//      kiosk owner must be able to click without killing or reviving the show).
// Fails on any uncaught JS error across the whole run.
//
// Usage: node tests/autoplay.js
"use strict";

var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report={errors:[],fresh:false,phase1:{},phase2:{},phase3:{},phase4:{},phase5:{}};",
  // headless tabs are unfocused; autoplay gates on document.hasFocus() (the crickets rule),
  // so force it true, exactly like DEBUGGING.md recipe 2 does for focus-gated behaviour.
  "  var _focus=true; document.hasFocus=function(){return _focus;};",
  // a redefinable document.hidden so we can simulate backgrounding
  "  var _hidden=false;",
  "  try { Object.defineProperty(document,'hidden',{configurable:true,get:function(){return _hidden;}});",
  "        Object.defineProperty(document,'visibilityState',{configurable:true,get:function(){return _hidden?'hidden':'visible';}}); } catch(e){}",
  "  function setHidden(h){ _hidden=h; document.dispatchEvent(new Event('visibilitychange')); }",
  "  function setFocus(f){ _focus=f; window.dispatchEvent(new Event(f?'focus':'blur')); }",
  "  function nodeCount(){ return document.getElementsByTagName('*').length; }",
  "  function roomsSeen(seen){ var r=window.currentStageName; if(r) seen[r]=1; }",
  "  async function run(){",
  // assertFresh: prove the loaded page carries the NEW state-machine code, not a stale build
  // (a reused headless Chrome can serve the pre-edit file — see DEBUGGING.md).
  "    report.fresh = (typeof window.__autoplaySteps==='function' && typeof window.__latestUnreadMessage==='function' && typeof window.__maxUnlocked==='function');",
  "    if (!window.autoplay || !window.__autoplayOn || !report.fresh) { report.errors=window.__errs.concat(['autoplay state-machine API missing (stale page?)']); return; }",
  // ── Phase 1: TAKE OVER IN PLACE (start from a non-kitchen room; must NOT jump to kitchen) ──
  "    window.goToStage('office'); await sleep(300);",
  "    report.phase1.startedRoom = window.currentStageName;",   // should be 'office'
  "    window.autoplay(true);",
  "    await sleep(700);",                                       // first step lands on a ~500ms timer
  "    report.phase1.on = window.__autoplayOn();",
  "    var badge=document.getElementById('autoplay-badge');",
  "    report.phase1.badgeShown = !!(badge && badge.classList.contains('show'));",
  "    report.phase1.roomAfterStart = window.currentStageName;", // must NOT be 'kitchen' (didn't reset)
  // ── Phase 2: it drives multiple rooms + keeps stepping (advances + loops) ──
  "    var seen={}; roomsSeen(seen);",
  "    var steps0 = window.__autoplaySteps();",
  "    for (var k=0;k<16;k++){ await sleep(700); roomsSeen(seen); }", // ~11s of running (several 1.9s steps)
  "    report.phase2.steps = window.__autoplaySteps() - steps0;",     // must grow (it keeps acting)
  "    report.phase2.distinctRooms = Object.keys(seen).length;",       // must be > 1 (it travels)
  "    report.phase2.on = window.__autoplayOn();",
  // ── Phase 3: deliver a notification mid-run → the machine opens + acts on it ──
  // 'invaders' has an action that pans to the office; deliver it from elsewhere, then confirm
  // it gets opened (no longer the top unread) AND its action lands us in the office.
  "    window.goToStage('garden'); await sleep(500);",           // stand somewhere that isn't the target
  "    window.__deliverPhoneMessage('invaders');",                // a text with a pan-to-office action
  "    var beforeUnread = window.__latestUnreadMessage();",       // should be 'invaders' (unread)
  "    report.phase3.deliveredUnread = beforeUnread;",
  "    var handled=false, landedOffice=false;",
  "    for (var h=0; h<16 && !(handled && landedOffice); h++){ await sleep(700); var top=window.__latestUnreadMessage(); if(top!=='invaders') handled=true; if(window.currentStageName==='office') landedOffice=true; }",
  "    report.phase3.cleared = handled;",                          // 'invaders' no longer the top unread → opened/read
  "    report.phase3.actedRoom = window.currentStageName;",        // the action panned us
  "    report.phase3.landedOffice = landedOffice;",
  // ── Phase 4: hide → paused, no accumulation; then resume; then unfocused pauses too ──
  "    var stepsBeforeHide = window.__autoplaySteps();",
  "    var nodesBeforeHide = nodeCount();",
  "    setHidden(true);",
  "    await sleep(6000);",                                        // a long hidden spell
  "    report.phase4.stepsWhileHidden = window.__autoplaySteps() - stepsBeforeHide;", // must be 0
  "    report.phase4.nodeGrowthWhileHidden = nodeCount() - nodesBeforeHide;",         // must stay tiny
  "    setHidden(false);",
  "    var stepsAtResume = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase4.stepsAfterResume = window.__autoplaySteps() - stepsAtResume;",   // must be > 0
  "    setFocus(false);",                                          // visible-but-unfocused
  "    var stepsBeforeBlur = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase4.stepsWhileUnfocused = window.__autoplaySteps() - stepsBeforeBlur;", // must be 0
  "    setFocus(true); await sleep(300);",
  // ── Phase 5: takeover / stop-for-good; a plain click must NOT revive it ──
  "    if (window.__autoplayTakeover) window.__autoplayTakeover();", // a takeover exits (idle-resume kept)
  "    await sleep(200);",
  "    report.phase5.offAfterTakeover = !window.__autoplayOn();",
  "    window.autoplay(true); await sleep(700);",                  // arm again
  "    report.phase5.onAgain = window.__autoplayOn();",
  "    window.autoplay(false); await sleep(300);",                 // deliberate stop → for good
  "    report.phase5.offAfterStop = !window.__autoplayOn();",
  "    document.dispatchEvent(new MouseEvent('click',{bubbles:true}));", // a plain click...
  "    if (document.body.click) document.body.click();",
  "    await sleep(1400);",
  "    report.phase5.stillOffAfterClick = !window.__autoplayOn();", // ...must NOT re-start autoplay
  "  }",
  "  window.addEventListener('load',function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){if(!report.errors.length)report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}); },400); });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

console.log("rsvp.html autoplay (attract-mode state machine):");
var r = lib.runPageSync("rsvp.html", HARNESS, 70000, { patchRaf: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  var p1 = r.phase1 || {}, p2 = r.phase2 || {}, p3 = r.phase3 || {}, p4 = r.phase4 || {}, p5 = r.phase5 || {};
  if (r.fresh) pass("loaded page carries the new state-machine API (assertFresh)");
  else fail("loaded page is stale — no state-machine API", JSON.stringify(r).slice(0, 300));
  // Phase 1
  if (p1.on && p1.badgeShown) pass("autoplay(true) starts the loop and shows the 'auto' badge");
  else fail("autoplay(true) starts + badge", JSON.stringify(p1));
  if (p1.startedRoom === "office" && p1.roomAfterStart && p1.roomAfterStart !== "kitchen")
    pass("TAKE OVER IN PLACE: started in the office, did NOT jump to the kitchen (roomAfterStart=" + p1.roomAfterStart + ")");
  else fail("must take over in place, not reset to kitchen", JSON.stringify(p1));
  // Phase 2
  if (p2.steps >= 3) pass("it keeps acting — the machine took " + p2.steps + " steps over ~7s (advances + loops forever)");
  else fail("the machine must keep stepping", "only " + p2.steps + " step(s): " + JSON.stringify(p2));
  if (p2.distinctRooms >= 2) pass("it drives multiple rooms (" + p2.distinctRooms + " distinct rooms visited)");
  else fail("it must travel the loft (multiple rooms)", JSON.stringify(p2));
  // Phase 3
  if (p3.deliveredUnread === "invaders") pass("a phone notification was delivered mid-run (unread)");
  else fail("notification delivery", JSON.stringify(p3));
  if (p3.cleared) pass("the machine OPENED the notification (it's no longer the top unread — read/handled)");
  else fail("autoplay must open+clear a delivered notification", JSON.stringify(p3));
  if (p3.landedOffice) pass("the machine ACTED on the notification (its action panned us to the office)");
  else fail("autoplay must act on the notification (pan to office)", JSON.stringify(p3));
  // Phase 4
  if (p4.stepsWhileHidden === 0) pass("no steps run while hidden (paused, not ticking)");
  else fail("machine must pause while hidden", "advanced " + p4.stepsWhileHidden + " step(s) while hidden");
  if (p4.nodeGrowthWhileHidden <= 20) pass("DOM node count stays bounded across a long hidden spell (+" + p4.nodeGrowthWhileHidden + ", no pile-up)");
  else fail("no accumulation while hidden", "node count grew by " + p4.nodeGrowthWhileHidden + " while hidden");
  if (p4.stepsAfterResume > 0) pass("the machine resumes after the tab is shown again");
  else fail("the machine resumes on show", JSON.stringify(p4));
  if (p4.stepsWhileUnfocused === 0) pass("no steps run while visible-but-UNFOCUSED (crickets rule)");
  else fail("machine must pause while unfocused", "advanced " + p4.stepsWhileUnfocused + " step(s) while unfocused");
  // Phase 5
  if (p5.offAfterTakeover) pass("__autoplayTakeover exits autoplay (hands over the wheel)");
  else fail("takeover must exit autoplay", JSON.stringify(p5));
  if (p5.onAgain && p5.offAfterStop) pass("autoplay(false) stops it for good");
  else fail("autoplay(false) must stop cleanly", JSON.stringify(p5));
  if (p5.stillOffAfterClick) pass("a plain click does NOT stop or revive autoplay (kiosk-safe)");
  else fail("a plain click must not toggle autoplay", JSON.stringify(p5));
  // Errors
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }

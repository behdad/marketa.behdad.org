#!/usr/bin/env node
// Autoplay (attract-mode) test: the self-driving BBQ ROUTINE SEQUENCER.
//
// Verifies the rearchitected autoplay — a CHAINED-ROUTINE loop (not one isolated action per
// tick). Each "beat" of an authored routine runs a step with its own pause; a routine tells a
// little story in a room before the next room is picked. It does NOT assert the choreography of
// any one room (play.js / enter.js already exercise every solve); it asserts the machine's
// contract. Same one-shot headless-Chrome runner as play.js (rAF->setTimeout patch, error
// collectors).
//
// It runs in phases on one page load:
//   1. TAKE OVER IN PLACE — put the game in a NON-kitchen room first (goToStage('office')),
//      THEN autoplay(true). Assert the badge shows, autoplay is on, it did NOT jump back to the
//      kitchen, AND the first routine it builds is CHAINED (multiple beats — not one-and-jump).
//   2. DRIVES MULTIPLE ROOMS + LOOPS — let the machine run; assert its beat counter grows (it
//      keeps taking beats) and it visits more than one distinct room over time (it travels).
//   3. DWELL + APP-PLAY (shape, deterministic) — solve the game (goToStage('balcony') + party
//      on), then read each room's routine shape via __autoplayRoutineBeats: assert the GARDEN
//      routine has MORE beats and MORE total dwell time than kitchen and cuddly (the party
//      lingers longest), and that the OFFICE (monitor) and BALCONY (phone) routines each OPEN
//      SEVERAL apps (spy on window.computer/window.phone calls while those routines run).
//   4. GHOST CURSOR — while a routine with a tapped beat runs, the cinematic ghost cursor
//      (#cine-cursor.visible) appears; a takeover tears it down (no stranded dot).
//   5. HANDLE A NOTIFICATION — deliver a phone text mid-run (__deliverPhoneMessage) with an
//      action that pans to a KNOWN room; assert the machine OPENS + CLEARS it (no longer the top
//      unread) and ACTS on it (the room changes to the message's target). It's an interrupt.
//   6. PAUSE / no-accumulate — while running, hide the tab: the beat counter STOPS growing while
//      hidden and the DOM node count stays bounded across a long hidden spell. Unhiding resumes.
//      An UNFOCUSED-but-visible tab pauses the same way (blur path).
//   7. TAKEOVER — __autoplayTakeover exits (keeps idle-resume), then autoplay(false) stops it for
//      good, and a plain synthetic CLICK afterwards does NOT re-arm / re-start it.
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
  "  var report={errors:[],fresh:false,phase1:{},phase2:{},phase3:{},phase4:{},phase5:{},phase6:{},phase7:{}};",
  "  async function run(){",
  // assertFresh: prove the loaded page carries the NEW routine-sequencer code, not a stale build.
  "    report.fresh = (typeof window.__autoplayRoutineBeats==='function' && typeof window.__autoplayRoutineLen==='function' && typeof window.__latestUnreadMessage==='function' && typeof window.__maxUnlocked==='function'",
"                    && typeof window.__autoplayInvariants==='function' && typeof window.__autoplayTapMisses==='function' && typeof window.__autoplayLastHandledMsg==='function' && typeof window.__autoplayIdleMs==='function');",
  "    if (!window.autoplay || !window.__autoplayOn || !report.fresh) { report.errors=window.__errs.concat(['autoplay routine-sequencer API missing (stale page?)']); return; }",
  // ── Phase 1: TAKE OVER IN PLACE + first routine is CHAINED ──
  "    window.goToStage('office'); await sleep(300);",
  "    report.phase1.startedRoom = window.currentStageName;",
  "    window.autoplay(true);",
  "    await sleep(800);",
  "    report.phase1.on = window.__autoplayOn();",
  "    var badge=document.getElementById('autoplay-badge');",
  "    report.phase1.badgeShown = !!(badge && badge.classList.contains('show'));",
  "    report.phase1.roomAfterStart = window.currentStageName;",   // must NOT be 'kitchen'
  "    report.phase1.firstRoutineLen = window.__autoplayRoutineLen();",
"    report.invariants = window.__autoplayInvariants();", // a routine is running → multiple beats
  // ── Phase 2: drives multiple rooms + keeps stepping ──
  "    var seen={}; roomsSeen(seen);",
  "    var steps0 = window.__autoplaySteps();",
  "    for (var k=0;k<18;k++){ await sleep(700); roomsSeen(seen); }",
  "    report.phase2.steps = window.__autoplaySteps() - steps0;",
  "    report.phase2.distinctRooms = Object.keys(seen).length;",
  "    report.phase2.on = window.__autoplayOn();",
// KIOSK-SAFE: poke the screen while the show RUNS — a stray click/keypress must not stop it.
"    var stepsBeforePoke = window.__autoplaySteps();",
"    document.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
"    if (document.body.click) document.body.click();",
"    document.dispatchEvent(new KeyboardEvent('keydown',{key:'x',bubbles:true}));",
"    await sleep(4000);",
"    report.phase2.onAfterPoke = window.__autoplayOn();",
"    report.phase2.stepsAfterPoke = window.__autoplaySteps() - stepsBeforePoke;",
  // ── Phase 3: DWELL + APP-PLAY (deterministic, on a solved game) ──
  // pause autoplay so nothing races the measurements, solve the game, then read routine shapes.
  "    window.autoplay(false); await sleep(200);",
  "    window.goToStage('balcony'); await sleep(200);",           // maxUnlocked → balcony: every earlier room solved
  "    if (window.party) window.party(true); await sleep(300);",   // party on → balcony (finale) counts solved too
  "    var g=window.__autoplayRoutineBeats('garden'), kt=window.__autoplayRoutineBeats('kitchen'), cu=window.__autoplayRoutineBeats('cuddly');",
  "    report.phase3.garden=g; report.phase3.kitchen=kt; report.phase3.cuddly=cu;",
  // APP-PLAY: the office + phone routines each open SEVERAL apps. Read the authored routine shape
  // (deterministic — no waiting out the deliberately slow run) AND live-verify the office one
  // actually reaches several apps when run (a real click storm through the monitor dock).
  "    var off=window.__autoplayRoutineBeats('office'), bal=window.__autoplayRoutineBeats('balcony');",
  "    report.phase3.monitorApps = off ? off.apps : 0; report.phase3.monitorAppList = off ? off.appList : [];",
  "    report.phase3.phoneApps = bal ? bal.apps : 0; report.phase3.phoneAppList = bal ? bal.appList : [];",
  // live sanity: run the office routine and confirm the machine really opens >1 distinct app
  "    var pcApps={}; var _pc=window.computer;",
  "    window.computer=function(a){ if(typeof a==='string'&&a!=='') pcApps[a]=1; return _pc.apply(window,arguments); };",
  "    window.goToStage('office'); await sleep(150);",
  "    window.autoplay(true); await sleep(150);",                  // first routine builds in the office (take-over-in-place)
  "    for (var o=0;o<30 && Object.keys(pcApps).length<3;o++){ await sleep(700); }",
  "    report.phase3.monitorAppsLive = Object.keys(pcApps).length;",
  "    window.computer=_pc;",                                       // un-spy
  // ── Phase 4: GHOST CURSOR appears mid-routine, gone after a takeover ──
  // the office routine's PC-power beat taps #office-pc-desk-trio; sample the cursor while it runs.
  "    window.autoplay(false); await sleep(150);",
  "    window.goToStage('office'); await sleep(150);",
  "    window.autoplay(true);",
  "    var cursorSeen=false;",
  "    for (var c=0;c<20 && !cursorSeen;c++){ await sleep(400); var cc=document.getElementById('cine-cursor'); if(cc && cc.classList.contains('visible')) cursorSeen=true; }",
  "    report.phase4.cursorSeen = cursorSeen;",
  "    if (window.__autoplayTakeover) window.__autoplayTakeover(); await sleep(300);",
  "    var cc2=document.getElementById('cine-cursor');",
  "    report.phase4.cursorGoneAfterTakeover = !cc2;",
"    report.phase4.ripplesAfterTakeover = document.querySelectorAll('.cine-ripple').length;",
"    report.phase4.tapMisses = window.__autoplayTapMisses(); report.phase4.verbMisses = window.__autoplayVerbMisses();",             // torn down: element removed
  // ── Phase 5: notification interrupt ──
  "    window.autoplay(true); await sleep(400);",
  "    window.goToStage('garden'); await sleep(400);",
  "    window.__deliverPhoneMessage('invaders');",
  "    var beforeUnread = window.__latestUnreadMessage();",
  "    report.phase5.deliveredUnread = beforeUnread;",
  "    var handled=false, landedOffice=false;",
  "    for (var h=0; h<20 && !(handled && landedOffice); h++){ await sleep(700); var top=window.__latestUnreadMessage(); if(top!=='invaders') handled=true; if(window.currentStageName==='office') landedOffice=true; }",
  "    report.phase5.cleared = handled;",
  "    report.phase5.actedRoom = window.currentStageName;",
  "    report.phase5.landedOffice = landedOffice;",
"    report.phase5.lastHandled = window.__autoplayLastHandledMsg();",
  // ── Phase 6: hide → paused, no accumulation; resume; unfocused pauses too ──
  "    var stepsBeforeHide = window.__autoplaySteps();",
  "    var nodesBeforeHide = nodeCount();",
  "    setHidden(true);",
  "    await sleep(6000);",
  "    report.phase6.stepsWhileHidden = window.__autoplaySteps() - stepsBeforeHide;",
  "    report.phase6.nodeGrowthWhileHidden = nodeCount() - nodesBeforeHide;",
  "    setHidden(false);",
  "    var stepsAtResume = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase6.stepsAfterResume = window.__autoplaySteps() - stepsAtResume;",
  "    setFocus(false);",
  "    var stepsBeforeBlur = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase6.stepsWhileUnfocused = window.__autoplaySteps() - stepsBeforeBlur;",
  "    setFocus(true); await sleep(300);",
  // ── Phase 7: takeover / stop-for-good; a plain click must NOT revive it ──
  "    if (window.__autoplayTakeover) window.__autoplayTakeover();",
  "    await sleep(200);",
  "    report.phase7.offAfterTakeover = !window.__autoplayOn();",
  "    window.autoplay(true); await sleep(700);",
  "    report.phase7.onAgain = window.__autoplayOn();",
  "    window.autoplay(false); await sleep(300);",
  "    report.phase7.offAfterStop = !window.__autoplayOn();",
// the 90s drift-back, shortened so it fits the budget: a TAKEOVER keeps it armed…
"    window.__autoplayIdleMs(1200);",
"    window.autoplay(true); await sleep(500); window.__autoplayTakeover(); await sleep(200);",
"    report.phase7.offAfterTakeover2 = !window.__autoplayOn();",
"    await sleep(2600);",
"    report.phase7.driftedBack = window.__autoplayOn();",
// …while a deliberate autoplay(false) clears it for good.
"    window.autoplay(false); await sleep(2600);",
"    report.phase7.noDriftAfterStop = !window.__autoplayOn();",
  "    document.dispatchEvent(new MouseEvent('click',{bubbles:true}));",
  "    if (document.body.click) document.body.click();",
  "    await sleep(1400);",
  "    report.phase7.stillOffAfterClick = !window.__autoplayOn();",
  "  }",
  "  window.addEventListener('load',function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){if(!report.errors.length)report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}); },400); });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

console.log("rsvp.html autoplay (attract-mode routine sequencer):");
var r = lib.runPageSync("rsvp.html", HARNESS, 155000, { patchRaf: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  var p1 = r.phase1 || {}, p2 = r.phase2 || {}, p3 = r.phase3 || {}, p4 = r.phase4 || {}, p5 = r.phase5 || {}, p6 = r.phase6 || {}, p7 = r.phase7 || {};
  if (r.fresh) pass("loaded page carries the new director API (assertFresh)");
  else fail("loaded page is stale — no director API", JSON.stringify(r).slice(0, 300));
  // The director self-checks its own authored intent at parse: every room has a builder + a
  // budget, every signature tap id resolves, and the garden dwells longest in BOTH the solved and
  // unsolved branches. This is what makes "it drifted" a failing test rather than a bug report.
  if (r.invariants && r.invariants.ok) pass("plan-time invariants hold (__autoplayInvariants)");
  else fail("the director's plan-time invariants must hold", JSON.stringify(r.invariants));
  // Phase 1
  if (p1.on && p1.badgeShown) pass("autoplay(true) starts the loop and shows the 'auto' badge");
  else fail("autoplay(true) starts + badge", JSON.stringify(p1));
  // strict: the opening beat must run in the room the game is ALREADY in and navigate nowhere —
  // "not the kitchen" would also pass a machine that jumped straight to some other room.
  if (p1.startedRoom === "office" && p1.roomAfterStart === p1.startedRoom)
    pass("TAKE OVER IN PLACE: the first beat runs where the game already was (" + p1.roomAfterStart + ", no jump)");
  else fail("must take over in place, in the SAME room", JSON.stringify(p1));
  if (p1.firstRoutineLen >= 3) pass("the first routine is CHAINED (" + p1.firstRoutineLen + " beats — not one-and-jump)");
  else fail("routines must chain multiple beats", "first routine had only " + p1.firstRoutineLen + " beat(s): " + JSON.stringify(p1));
  // Phase 2
  if (p2.steps >= 4) pass("it keeps acting — " + p2.steps + " beats over ~13s (advances + loops forever)");
  else fail("the machine must keep stepping", "only " + p2.steps + " beat(s): " + JSON.stringify(p2));
  if (p2.distinctRooms >= 2) pass("it drives multiple rooms (" + p2.distinctRooms + " distinct rooms visited)");
  else fail("it must travel the loft (multiple rooms)", JSON.stringify(p2));
  // the owner's core kiosk rule, asserted while the show is actually RUNNING (the phase-7 click
  // check fires after autoplay(false), so it could only ever pass vacuously).
  if (p2.onAfterPoke && p2.stepsAfterPoke > 0)
    pass("KIOSK-SAFE: a stray click + keypress DURING the show neither stops nor stalls it (+" + p2.stepsAfterPoke + " beats after)");
  else fail("stray clicks/keys must not stop autoplay while it runs", JSON.stringify(p2));
  // Phase 3 — dwell + app-play
  var g = p3.garden || {}, kt = p3.kitchen || {}, cu = p3.cuddly || {};
  if (g.beats > kt.beats && g.beats > cu.beats && g.totalWait > kt.totalWait && g.totalWait > cu.totalWait)
    pass("the PARTY dwells longest (garden " + g.beats + " beats/" + g.totalWait + "ms vs kitchen " + kt.beats + "/" + kt.totalWait + ", cuddly " + cu.beats + "/" + cu.totalWait + ")");
  else fail("garden must dwell longer than other rooms", JSON.stringify(p3));
  if (p3.monitorApps >= 3) pass("the monitor routine PLAYS WITH several apps (authored " + p3.monitorApps + ": " + (p3.monitorAppList || []).join(", ") + ")");
  else fail("monitor routine must open several apps", "authored " + p3.monitorApps + ": " + JSON.stringify(p3.monitorAppList));
  if (p3.monitorAppsLive >= 3) pass("…and it really opens several when run (live: " + p3.monitorAppsLive + " distinct apps reached)");
  else fail("monitor routine must reach several apps live", "reached " + p3.monitorAppsLive + " live");
  if (p3.phoneApps >= 3) pass("the phone routine PLAYS WITH several apps (authored " + p3.phoneApps + ": " + (p3.phoneAppList || []).join(", ") + ")");
  else fail("phone routine must open several apps", "authored " + p3.phoneApps + ": " + JSON.stringify(p3.phoneAppList));
  // Phase 4 — ghost cursor
  if (p4.cursorSeen) pass("the ghost cursor is VISIBLE mid-routine (viewers can follow the taps)");
  else fail("the ghost cursor must show during a tapped beat", JSON.stringify(p4));
  if (p4.cursorGoneAfterTakeover && p4.ripplesAfterTakeover === 0)
    pass("the ghost cursor AND its ripples are torn down on takeover (no stranded dot)");
  else fail("takeover must remove the cursor and every .cine-ripple", JSON.stringify(p4));
  // a tap id that no longer resolves, or a beat naming a renamed console verb, is a real defect —
  // the old build let both rot silently (every authored tap was dead metadata for months).
  if (p4.tapMisses === 0 && p4.verbMisses === 0) pass("every authored tap id and verb resolved (no dead beat metadata)");
  else fail("dead tap ids / renamed verbs in the scene library", "tapMisses=" + p4.tapMisses + " verbMisses=" + p4.verbMisses);
  // Phase 5 — notification interrupt
  if (p5.deliveredUnread === "invaders") pass("a phone notification was delivered mid-run (unread)");
  else fail("notification delivery", JSON.stringify(p5));
  // "no longer the top unread" alone is a false-pass (a NEWER unread displaces it with nothing
  // read), so assert the director actually took THAT id.
  if (p5.cleared && p5.lastHandled === "invaders") pass("the machine OPENED that exact notification (handled, not displaced)");
  else fail("autoplay must open+clear the delivered notification itself", JSON.stringify(p5));
  if (p5.landedOffice) pass("the machine ACTED on the notification (its action panned us to the office)");
  else fail("autoplay must act on the notification (pan to office)", JSON.stringify(p5));
  // Phase 6 — pause / no accumulation
  if (p6.stepsWhileHidden === 0) pass("no beats run while hidden (paused, not ticking)");
  else fail("machine must pause while hidden", "advanced " + p6.stepsWhileHidden + " beat(s) while hidden");
  if (p6.nodeGrowthWhileHidden <= 20) pass("DOM node count stays bounded across a long hidden spell (+" + p6.nodeGrowthWhileHidden + ", no pile-up)");
  else fail("no accumulation while hidden", "node count grew by " + p6.nodeGrowthWhileHidden + " while hidden");
  if (p6.stepsAfterResume > 0) pass("the machine resumes after the tab is shown again");
  else fail("the machine resumes on show", JSON.stringify(p6));
  if (p6.stepsWhileUnfocused === 0) pass("no beats run while visible-but-UNFOCUSED (crickets rule)");
  else fail("machine must pause while unfocused", "advanced " + p6.stepsWhileUnfocused + " beat(s) while unfocused");
  // Phase 7 — takeover / stop
  if (p7.offAfterTakeover) pass("__autoplayTakeover exits autoplay (hands over the wheel)");
  else fail("takeover must exit autoplay", JSON.stringify(p7));
  if (p7.onAgain && p7.offAfterStop) pass("autoplay(false) stops it for good");
  else fail("autoplay(false) must stop cleanly", JSON.stringify(p7));
  if (p7.offAfterTakeover2 && p7.driftedBack) pass("after a TAKEOVER the kiosk drifts back to attract on its own");
  else fail("takeover must keep the idle drift-back armed", JSON.stringify(p7));
  if (p7.noDriftAfterStop) pass("…but autoplay(false) clears the drift-back for good");
  else fail("a deliberate stop must clear idle-resume", JSON.stringify(p7));
  if (p7.stillOffAfterClick) pass("a plain click does NOT stop or revive autoplay (kiosk-safe)");
  else fail("a plain click must not toggle autoplay", JSON.stringify(p7));
  // Errors
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }

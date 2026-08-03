#!/usr/bin/env node
// Autoplay (attract-mode) test: the self-driving BBQ MARKOV DIRECTOR.
//
// Verifies the explicit FSM + seeded constrained-Markov planner over a broad catalog of authored
// mini-sequences. It does NOT assert every vignette's choreography (play.js / enter.js exercise
// the solve paths); it asserts deterministic planning, diversity/fairness, and the runtime kiosk
// contract. Same one-shot headless-Chrome runner as play.js (rAF->setTimeout patch, errors).
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
//   4. GHOST CURSOR + PANELS — while a routine with a tapped beat runs, the cinematic ghost cursor
//      (#cine-cursor.visible) appears; a takeover tears it down (no stranded dot) and closes the
//      who's-here roster (opened by the TEST first, so it can't pass vacuously).
//   5. HANDLE A NOTIFICATION — deliver a phone text mid-run (__deliverPhoneMessage) with an
//      action that pans to a KNOWN room; assert the machine OPENS + CLEARS it (no longer the top
//      unread) and ACTS on it (the room changes to the message's target). It's an interrupt.
//   6. PAUSE / no-accumulate — while running, hide the tab: the beat counter STOPS growing while
//      hidden and the DOM node count stays bounded across a long hidden spell. Unhiding resumes.
//      An UNFOCUSED-but-visible tab pauses the same way (blur path).
//   7. TAKEOVER — __autoplayTakeover exits (keeps idle-resume) and the kiosk drifts back on its
//      own; then autoplay(false) stops it for good, no drift-back, and a plain synthetic CLICK
//      afterwards does NOT re-arm / re-start it.
//   8. PANELS, part 2 — a panel opened while the show RUNS is closed by the show itself (beats are
//      forced back-to-back and the closing one is counted) and by autoplay(false). Last, because
//      forcing beats also fires the garden MOMENTS, whose delayed texts would displace phase 5's.
// Across ALL phases a background sampler asserts the ghost cursor never sits visible and motionless
// beyond its idle span — the frozen-pointer defect, whose worst stretch was ~95s in the garden.
// A SECOND, short page load then runs the whole machine under prefers-reduced-motion:reduce (the
// director drops its `flourish` beats and stretches its waits there, so the branch is real code,
// not just the cursor helpers snapping): it must still travel and still show the cursor, and must
// spawn ZERO ripples.
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
  // Autoplay may randomly open Chat. Keep this broad director test offline: the dedicated
  // Chat test exercises the real Turnstile integration with its own deterministic stub.
  "  window.turnstile={render:function(host,opts){this._opts=opts;return 'autoplay-test-widget';},remove:function(){},execute:function(){var o=this._opts;if(o&&o.callback)setTimeout(function(){o.callback('autoplay-test-token');},0);}};",
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
  "  var report={errors:[],fresh:false,model:{},phase1:{},phase2:{},phase3:{},phase4:{},phase5:{},phase6:{},phase7:{},cursor:{}};",
  // A background sampler for the whole run, so the ghost cursor's WORST case is measured over
  // every phase instead of at one convenient instant. A "frozen" sample is the dot visible at the
  // very same viewport point as the sample before it — which is what a viewer sees as a stuck
  // artifact while a self-navigating beat slides the scene underneath the pointer.
  "  var _cur={run:0,worst:0,lastPos:null,samples:0,visible:0};",
  "  setInterval(function(){",
  "    var c=document.getElementById('cine-cursor');",
  "    var vis=!!(c&&c.classList.contains('visible')); var pos=vis?(c.style.transform||'?'):null;",
  "    _cur.samples++; if(vis)_cur.visible++;",
  "    if(vis&&pos&&pos===_cur.lastPos){ _cur.run++; if(_cur.run>_cur.worst)_cur.worst=_cur.run; } else _cur.run=0;",
  "    _cur.lastPos=pos;",
  "  },250);",
  "  async function run(){",
  // assertFresh: prove the loaded page carries the NEW routine-sequencer code, not a stale build.
  "    report.fresh = (typeof window.__autoplayRoutineBeats==='function' && typeof window.__autoplayRoutineLen==='function' && typeof window.__latestUnreadMessage==='function' && typeof window.__maxUnlocked==='function'",
"                    && typeof window.__autoplayInvariants==='function' && typeof window.__autoplayTapMisses==='function' && typeof window.__autoplayLastHandledMsg==='function' && typeof window.__autoplayIdleMs==='function'",
"                    && typeof window.__autoplaySeed==='function' && typeof window.__autoplayPlan==='function' && typeof window.__autoplayCatalog==='function' && typeof window.__autoplayMachine==='function');",
  "    if (!window.autoplay || !window.__autoplayOn || !report.fresh) { report.errors=window.__errs.concat(['autoplay routine-sequencer API missing (stale page?)']); return; }",
  // ── Model: pure seeded planning, broad authored catalog, hard diversity/fairness ──
  "    var cat=window.__autoplayCatalog(), pa=window.__autoplayPlan(20270501,60), pb=window.__autoplayPlan(20270501,60), pc=window.__autoplayPlan(20270710,60);",
  "    var aid=pa.choices.map(function(x){return x.id;}), bid=pb.choices.map(function(x){return x.id;}), cid=pc.choices.map(function(x){return x.id;});",
  "    var exactRecent=true; for(var pi=0;pi<aid.length;pi++)for(var back=1;back<=5&&pi-back>=0;back++)if(aid[pi]===aid[pi-back])exactRecent=false;",
  "    var drought={kitchen:0,garden:0,cuddly:0,office:0,balcony:0}, maxDrought=0; pa.choices.forEach(function(x){Object.keys(drought).forEach(function(room){drought[room]++;});x.rooms.forEach(function(room){drought[room]=0;});Object.keys(drought).forEach(function(room){maxDrought=Math.max(maxDrought,drought[room]);});});",
  "    var roomCounts={}, moods={}, cross=0, minBeats=999, interactive=0, missingVerbs=[]; cat.forEach(function(s){roomCounts[s.room]=(roomCounts[s.room]||0)+1;moods[s.mood]=1;if(s.crossRoom)cross++;minBeats=Math.min(minBeats,s.beats);interactive+=s.taps+s.apps.length+s.verbs.length;s.verbs.forEach(function(v){if(typeof window[v]!=='function'&&missingVerbs.indexOf(v)<0)missingVerbs.push(v);});});",
  "    var detail=pa.details&&pa.details[0], factors=!!(detail&&detail.candidates&&detail.candidates.length&&typeof detail.candidates[0].markov==='number'&&typeof detail.candidates[0].roomFair==='number'&&typeof detail.candidates[0].sequenceFair==='number'&&typeof detail.candidates[0].cadence==='number'&&typeof detail.candidates[0].continuity==='number'&&typeof detail.candidates[0].travel==='number');",
  "    var cadenceNames=['arrival','gather','peak','glow','exhale'],cadenceEnergy=[1,2,3,2,0],cadenceHits=0,cadenceOk=pa.choices.every(function(x,i){if(x.energy===cadenceEnergy[i%cadenceEnergy.length])cadenceHits++;return x.cadence===cadenceNames[i%cadenceNames.length]&&typeof x.energy==='number';}),cadenceMatch=cadenceHits/pa.choices.length;",
  "    report.model={catalog:cat.length,roomCounts:roomCounts,moods:Object.keys(moods).length,cross:cross,minBeats:minBeats,interactive:interactive,missingVerbs:missingVerbs,sameSeed:aid.join('|')===bid.join('|'),differentSeed:aid.join('|')!==cid.join('|'),exactRecent:exactRecent,maxDrought:maxDrought,factors:factors,cadenceOk:cadenceOk,cadenceMatch:cadenceMatch,choices:aid.slice(0,12),invariants:window.__autoplayInvariants()};",
  // ── Phase 1: TAKE OVER IN PLACE + first routine is CHAINED ──
  "    window.goToStage('office'); await sleep(300);",
  "    report.phase1.startedRoom = window.currentStageName;",
  "    window.autoplay(true);",
  "    await sleep(800);",
  "    report.phase1.on = window.__autoplayOn();",
  "    var badge=document.getElementById('autoplay-badge');",
  "    report.phase1.badgeShown = !!(badge && badge.classList.contains('show'));",
  "    var launchTrailer=document.getElementById('watch-loft-btn'), launchAuto=document.getElementById('watch-autoplay-btn'), takeover=document.getElementById('watch-skip-btn');",
  "    report.phase1.watchControls = { launchHidden:!!(launchTrailer&&launchTrailer.hidden&&launchAuto&&launchAuto.hidden), takeoverShown:!!(takeover&&!takeover.hidden) };",
  "    report.phase1.roomAfterStart = window.currentStageName;",   // must NOT be 'kitchen'
  "    report.phase1.firstRoutineLen = window.__autoplayRoutineLen();",
  "    report.phase1.machine = window.__autoplayMachine();",
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
  "    if(window.__autoplayForceSequence) window.__autoplayForceSequence('office.app-hop');",
  "    for (var o=0;o<30 && Object.keys(pcApps).length<3;o++){ await sleep(700); }",
  "    report.phase3.monitorAppsLive = Object.keys(pcApps).length;",
  "    window.computer=_pc;",                                       // un-spy
  // ── Phase 4: GHOST CURSOR appears mid-routine, gone after a takeover ──
  // the office routine's PC-power beat taps #office-pc-desk-trio; sample the cursor while it runs.
  "    window.autoplay(false); await sleep(150);",
  "    window.goToStage('office'); await sleep(150);",
  "    window.autoplay(true);",
  "    if(window.__autoplayForceSequence) window.__autoplayForceSequence('office.desk-toys');",
  "    var cursorSeen=false;",
  "    for (var c=0;c<20 && !cursorSeen;c++){ await sleep(400); var cc=document.getElementById('cine-cursor'); if(cc && cc.classList.contains('visible')) cursorSeen=true; }",
  "    report.phase4.cursorSeen = cursorSeen;",
  // A PANEL the show opens must never be inherited. Opened by hand HERE (the office routine never
  // opens one) so the assertion can't pass vacuously — the old build left the garden's who's-who
  // list up across rooms, across scenes and straight through the □ Take-over button.
  "    window.__secondRound = true;", // the who's-here roster only opens in the "second round" (after a party has lit) — put the test there so this hand-open isn't a no-op
  "    window.__toggleRoster(true); await sleep(150);",
  "    report.phase4.rosterOpenBeforeTakeover = window.__rosterOpen();",
  "    if (window.__autoplayTakeover) window.__autoplayTakeover(); await sleep(300);",
  "    report.phase4.rosterClosedAfterTakeover = !window.__rosterOpen();",
  "    var cc2=document.getElementById('cine-cursor');",
  "    report.phase4.cursorGoneAfterTakeover = !cc2;",
"    report.phase4.ripplesAfterTakeover = document.querySelectorAll('.cine-ripple').length;",
"    report.phase4.tapMisses = window.__autoplayTapMisses(); report.phase4.verbMisses = window.__autoplayVerbMisses();",             // torn down: element removed
  // ── Phase 5: notification interrupt ──
  "    window.autoplay(true); await sleep(400);",
  "    window.goToStage('garden'); await sleep(400);",
  // This phase asserts the director handles the EXACT notification we hand it, so the ambient
  // drips have to be off while it runs — otherwise the assertion is a race. The garden is the
  // party room, and lighting the party arms the cue drip (whose opener is only a few seconds),
  // so a cue would land inside the poll below and displace 'invaders' as the top unread. That
  // showed up as lastHandled being cue_cocktails/group rather than a real director bug. Stopped
  // again on every poll turn because a party re-light re-arms it — the calls are idempotent.
  "    var hush = function () { if (window.__stopCueDrip) window.__stopCueDrip(); if (window.__stopDayDrip) window.__stopDayDrip(); };",
  "    hush();",
  "    window.__deliverPhoneMessage('invaders');",
  "    var beforeUnread = window.__latestUnreadMessage();",
  "    report.phase5.deliveredUnread = beforeUnread;",
  "    var handled=false, landedOffice=false;",
  "    for (var h=0; h<20 && !(handled && landedOffice); h++){ hush(); await sleep(700); var top=window.__latestUnreadMessage(); if(top!=='invaders') handled=true; if(window.currentStageName==='office') landedOffice=true; }",
  "    report.phase5.cleared = handled;",
  "    report.phase5.actedRoom = window.currentStageName;",
  "    report.phase5.landedOffice = landedOffice;",
"    report.phase5.lastHandled = window.__autoplayLastHandledMsg();",
"    for(var settle=0;settle<20;settle++){ var mt=window.__autoplayMachine(); if(mt.trace.some(function(x){return x.to==='resuming';})) break; hush(); await sleep(700); }", // wait for the completed interrupt to cross its explicit RESUMING state; fixed wall time became stale as the authored scene grew
  "    report.phase5.machine = window.__autoplayMachine();",
  // ── Phase 6: hide → paused, no accumulation; resume; unfocused pauses too ──
  "    var stepsBeforeHide = window.__autoplaySteps();",
  "    var nodesBeforeHide = nodeCount();",
  "    setHidden(true);",
  "    await sleep(6000);",
  "    report.phase6.stepsWhileHidden = window.__autoplaySteps() - stepsBeforeHide;",
  "    report.phase6.machineHidden = window.__autoplayMachine();",
  "    report.phase6.nodeGrowthWhileHidden = nodeCount() - nodesBeforeHide;",
  "    setHidden(false);",
  "    var stepsAtResume = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase6.stepsAfterResume = window.__autoplaySteps() - stepsAtResume;",
  "    report.phase6.machineResumed = window.__autoplayMachine();",
  "    setFocus(false);",
  "    var stepsBeforeBlur = window.__autoplaySteps();",
  "    await sleep(4000);",
  "    report.phase6.stepsWhileUnfocused = window.__autoplaySteps() - stepsBeforeBlur;",
  "    report.phase6.machineBlurred = window.__autoplayMachine();",
  "    setFocus(true); await sleep(300);",
  // ── Phase 7: takeover / stop-for-good; a plain click must NOT revive it ──
  "    if (window.__autoplayTakeover) window.__autoplayTakeover();",
  "    await sleep(200);",
  "    report.phase7.offAfterTakeover = !window.__autoplayOn();",
  "    report.phase7.takeoverState = window.__autoplayMachine().state;",
  "    window.autoplay(true); await sleep(700);",
  "    report.phase7.onAgain = window.__autoplayOn();",
  "    window.autoplay(false); await sleep(300);",
  "    report.phase7.offAfterStop = !window.__autoplayOn();",
  "    report.phase7.stopState = window.__autoplayMachine().state;",
  "    report.phase7.watchControlsRestored = !!(launchTrailer&&!launchTrailer.hidden&&launchAuto&&!launchAuto.hidden&&takeover&&takeover.hidden);",
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
  // ── Phase 8: a panel the show opens is closed while it KEEPS RUNNING ── drive beats with no
  // waits and count how many it takes. The old build never closed the roster at all, so this could
  // only ever run out the loop. It goes LAST: forcing beats back-to-back also fires the garden's
  // MOMENTS, whose own delayed phone texts would otherwise displace phase 5's notification.
  "    window.autoplay(true); await sleep(400);",
  "    window.__secondRound = true;", // second-round gate: the roster only opens once a party's lit this session
  "    window.__toggleRoster(true);",
  "    var stepsToClose=-1;",
  "    for (var pz=1; pz<=40 && stepsToClose<0; pz++){ window.__autoplayForceStep(); if(!window.__rosterOpen()) stepsToClose=pz; }",
  "    report.phase8 = { rosterStepsToClose: stepsToClose };",
  "    window.autoplay(false); await sleep(200);",
  // …and a deliberate stop closes one opened while the show was already running.
  "    window.autoplay(true); await sleep(200); window.__secondRound = true; window.__toggleRoster(true); window.autoplay(false); await sleep(200);",
  "    report.phase8.rosterClosedAfterStop = !window.__rosterOpen();",
  "    report.cursor = { samples:_cur.samples, visible:_cur.visible, worstFrozenMs:_cur.worst*250 };",
  "  }",
  "  window.addEventListener('load',function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){if(!report.errors.length)report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}); },400); });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

console.log("rsvp.html autoplay (seeded Markov director):");
var r = lib.runPageSync("rsvp.html", HARNESS, 155000, { patchRaf: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  var model = r.model || {}, p1 = r.phase1 || {}, p2 = r.phase2 || {}, p3 = r.phase3 || {}, p4 = r.phase4 || {}, p5 = r.phase5 || {}, p6 = r.phase6 || {}, p7 = r.phase7 || {}, p8 = r.phase8 || {};
  if (r.fresh) pass("loaded page carries the new director API (assertFresh)");
  else fail("loaded page is stale — no director API", JSON.stringify(r).slice(0, 300));
  if (model.catalog >= 25 && Object.keys(model.roomCounts || {}).length === 5 && Object.keys(model.roomCounts || {}).every(function (room) { return model.roomCounts[room] >= 4; }))
    pass("catalog has " + model.catalog + " authored mini-sequences with >=4 choices per room");
  else fail("catalog must be broad across every room", JSON.stringify(model));
  if (model.cross >= 3 && model.moods >= 7 && model.minBeats >= 3 && model.interactive >= 80)
    pass("catalog includes cross-room relays, " + model.moods + " moods and dense interaction chains (" + model.interactive + " authored actions)");
  else fail("catalog breadth / interaction density", JSON.stringify(model));
  if (model.sameSeed && model.differentSeed) pass("seeded planner is reproducible, while a different seed changes the show");
  else fail("seed determinism/divergence", JSON.stringify(model));
  if (model.exactRecent) pass("exact sequences never repeat inside the five-story recent window");
  else fail("anti-repetition window", JSON.stringify(model.choices));
  if (model.maxDrought <= 5) pass("coverage ledger bounds every room drought (max " + model.maxDrought + " selections)");
  else fail("room fairness bound", JSON.stringify(model));
  if (model.factors) pass("each probabilistic choice exposes mood, cadence, story-continuity, travel, room and sequence factors");
  else fail("weighted selection must be inspectable", JSON.stringify(model));
  if (model.cadenceOk && model.cadenceMatch >= 0.7) pass("the seeded show visibly follows its arrival → peak → exhale cadence (" + Math.round(model.cadenceMatch * 100) + "% exact-energy choices; fairness owns the rest)");
  else fail("macro pacing cadence", JSON.stringify(model.choices));
  if (model.missingVerbs && model.missingVerbs.length === 0) pass("every named interaction in the sequence catalog resolves to a live game verb");
  else fail("catalog contains missing interaction verbs", JSON.stringify(model.missingVerbs));
  // The director self-checks its own authored intent at parse: every room has a builder + a
  // budget, every signature tap id resolves, and the garden dwells longest in BOTH the solved and
  // unsolved branches. This is what makes "it drifted" a failing test rather than a bug report.
  if (r.invariants && r.invariants.ok) pass("plan-time invariants hold (__autoplayInvariants)");
  else fail("the director's plan-time invariants must hold", JSON.stringify(r.invariants));
  // Phase 1
  if (p1.on && p1.badgeShown) pass("autoplay(true) starts the loop and shows the 'auto' badge");
  else fail("autoplay(true) starts + badge", JSON.stringify(p1));
  if (p1.watchControls && p1.watchControls.launchHidden && p1.watchControls.takeoverShown) pass("launch links yield to one visible Take over control while Autoplay runs");
  else fail("Autoplay watch controls", JSON.stringify(p1.watchControls));
  // strict: the opening beat must run in the room the game is ALREADY in and navigate nowhere —
  // "not the kitchen" would also pass a machine that jumped straight to some other room.
  if (p1.startedRoom === "office" && p1.roomAfterStart === p1.startedRoom)
    pass("TAKE OVER IN PLACE: the first beat runs where the game already was (" + p1.roomAfterStart + ", no jump)");
  else fail("must take over in place, in the SAME room", JSON.stringify(p1));
  if (p1.firstRoutineLen >= 3) pass("the first routine is CHAINED (" + p1.firstRoutineLen + " beats — not one-and-jump)");
  else fail("routines must chain multiple beats", "first routine had only " + p1.firstRoutineLen + " beat(s): " + JSON.stringify(p1));
  if (p1.machine && p1.machine.transitionErrors === 0 && ["overture", "sequence"].indexOf(p1.machine.state) !== -1)
    pass("explicit FSM enters its overture/sequence state with no illegal transition");
  else fail("FSM start transition", JSON.stringify(p1.machine));
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
  // PANELS ARE NEVER INHERITED. The who's-who roster was opened by a bare toggle and closed by
  // nothing: it stayed up across rooms, across scenes and through the □ Take-over button, so a
  // human inherited a loft with the name list pinned over it. All three exits are asserted, and
  // the roster is opened BY THE TEST first so none of them can pass vacuously.
  if (p4.rosterOpenBeforeTakeover && p4.rosterClosedAfterTakeover)
    pass("a panel open during the show is CLOSED by the take-over (nothing stranded for the human)");
  else fail("takeover must close the who's-here roster", JSON.stringify(p4));
  if (p8.rosterStepsToClose > 0)
    pass("…the running show closes one itself within " + p8.rosterStepsToClose + " beat(s) (scene-boundary net)");
  else fail("a panel must not survive a scene boundary", "never closed across 40 forced beats: " + JSON.stringify(p8));
  if (p8.rosterClosedAfterStop) pass("…and autoplay(false) leaves no panel open either");
  else fail("stopping autoplay must close the roster", JSON.stringify(p8));
  // Phase 5 — notification interrupt
  if (p5.deliveredUnread === "invaders") pass("a phone notification was delivered mid-run (unread)");
  else fail("notification delivery", JSON.stringify(p5));
  // "no longer the top unread" alone is a false-pass (a NEWER unread displaces it with nothing
  // read), so assert the director actually took THAT id.
  if (p5.cleared && p5.lastHandled === "invaders") pass("the machine OPENED that exact notification (handled, not displaced)");
  else fail("autoplay must open+clear the delivered notification itself", JSON.stringify(p5));
  if (p5.landedOffice) pass("the machine ACTED on the notification (its action panned us to the office)");
  else fail("autoplay must act on the notification (pan to office)", JSON.stringify(p5));
  var st = (p5.machine && p5.machine.trace) || [];
  if (st.some(function (x) { return x.to === "interrupt"; }) && st.some(function (x) { return x.to === "resuming"; }) && p5.machine.transitionErrors === 0)
    pass("FSM records notification interrupt → resuming without an illegal edge");
  else fail("interrupt/resume state transitions", JSON.stringify(p5.machine));
  // Phase 6 — pause / no accumulation
  if (p6.stepsWhileHidden === 0) pass("no beats run while hidden (paused, not ticking)");
  else fail("machine must pause while hidden", "advanced " + p6.stepsWhileHidden + " beat(s) while hidden");
  if (p6.nodeGrowthWhileHidden <= 20) pass("DOM node count stays bounded across a long hidden spell (+" + p6.nodeGrowthWhileHidden + ", no pile-up)");
  else fail("no accumulation while hidden", "node count grew by " + p6.nodeGrowthWhileHidden + " while hidden");
  if (p6.stepsAfterResume > 0) pass("the machine resumes after the tab is shown again");
  else fail("the machine resumes on show", JSON.stringify(p6));
  if (p6.stepsWhileUnfocused === 0) pass("no beats run while visible-but-UNFOCUSED (crickets rule)");
  else fail("machine must pause while unfocused", "advanced " + p6.stepsWhileUnfocused + " beat(s) while unfocused");
  if (p6.machineHidden && p6.machineHidden.state === "paused" && p6.machineResumed && p6.machineResumed.state !== "paused" && p6.machineBlurred && p6.machineBlurred.state === "paused")
    pass("FSM exposes paused → resumed → paused across visibility and focus gates");
  else fail("pause/resume FSM states", JSON.stringify({ hidden: p6.machineHidden, resumed: p6.machineResumed, blurred: p6.machineBlurred }));
  // Phase 7 — takeover / stop
  if (p7.offAfterTakeover) pass("__autoplayTakeover exits autoplay (hands over the wheel)");
  else fail("takeover must exit autoplay", JSON.stringify(p7));
  if (p7.onAgain && p7.offAfterStop) pass("autoplay(false) stops it for good");
  else fail("autoplay(false) must stop cleanly", JSON.stringify(p7));
  if (p7.takeoverState === "takeover" && p7.stopState === "stopped") pass("FSM distinguishes takeover (idle-resume armed) from deliberate stop");
  else fail("takeover/stop FSM states", JSON.stringify(p7));
  if (p7.watchControlsRestored) pass("stopping restores Trailer + Autoplay and retires Take over");
  else fail("watch controls must restore after stop", JSON.stringify(p7));
  if (p7.offAfterTakeover2 && p7.driftedBack) pass("after a TAKEOVER the kiosk drifts back to attract on its own");
  else fail("takeover must keep the idle drift-back armed", JSON.stringify(p7));
  if (p7.noDriftAfterStop) pass("…but autoplay(false) clears the drift-back for good");
  else fail("a deliberate stop must clear idle-resume", JSON.stringify(p7));
  if (p7.stillOffAfterClick) pass("a plain click does NOT stop or revive autoplay (kiosk-safe)");
  else fail("a plain click must not toggle autoplay", JSON.stringify(p7));
  // THE POINTER NEVER FREEZES. Sampled across every phase: the dot must not sit visible at one
  // fixed viewport point for longer than its idle span. The garden's MOMENTS pan the camera
  // themselves, so a dot left up there hangs over a sliding scene for ~14s a beat — the longest,
  // most-watched stretch of the show. 9s is the 6s idle fade plus slack for the sampler.
  var cur = r.cursor || {};
  if (cur.samples > 0 && cur.worstFrozenMs <= 9000)
    pass("the ghost cursor never freezes in place (worst motionless-and-visible stretch " + cur.worstFrozenMs + "ms over " + cur.samples + " samples)");
  else fail("the cursor must retire when the show stops pointing", JSON.stringify(cur));
  // Errors
  if (r.errors.length === 0) pass("no uncaught JS errors across the entire run");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

// ── reduced motion ── a second, short load with prefers-reduced-motion:reduce forced.
var RM = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  window.turnstile={render:function(host,opts){this._opts=opts;return 'autoplay-test-widget';},remove:function(){},execute:function(){var o=this._opts;if(o&&o.callback)setTimeout(function(){o.callback('autoplay-test-token');},0);}};",
  "  var report={errors:[],fresh:false,rooms:0,cursorSeen:false,ripples:0,steps:0,invariants:null};",
  "  async function run(){",
  "    report.fresh = (typeof window.__autoplayInvariants==='function');",
  "    if (!window.autoplay || !report.fresh) { report.errors=window.__errs.concat(['director API missing (stale page?)']); return; }",
  "    report.invariants = window.__autoplayInvariants();",
  "    window.goToStage('office'); await sleep(300);",
  "    window.autoplay(true);",
  "    var seen={}, maxRipples=0;",
  "    for (var i=0;i<26;i++){ await sleep(500);",
  "      if (window.currentStageName) seen[window.currentStageName]=1;",
  "      var cc=document.getElementById('cine-cursor'); if(cc && cc.classList.contains('visible')) report.cursorSeen=true;",
  "      maxRipples=Math.max(maxRipples, document.querySelectorAll('.cine-ripple').length); }",
  "    report.rooms=Object.keys(seen).length; report.ripples=maxRipples; report.steps=window.__autoplaySteps();",
  "    window.autoplay(false); await sleep(300);",
  "  }",
  "  window.addEventListener('load',function(){ setTimeout(function(){ run().catch(function(e){window.__errs.push('harness:'+String(e&&e.stack||e));}).then(function(){if(!report.errors.length)report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}); },400); });",
  "})();",
  "</script>"
].join("\n");

console.log("");
console.log("rsvp.html autoplay under prefers-reduced-motion:reduce:");
var rm = lib.runPageSync("rsvp.html", RM, 45000, { patchRaf: true, forceReduce: true });
if (!rm || !rm.fresh) {
  fail("reduced-motion run reported (page error before load, or budget too small)", JSON.stringify(rm));
} else {
  if (rm.invariants && rm.invariants.ok) pass("plan-time invariants still hold on the reduced-motion profile");
  else fail("invariants must hold under reduced motion too", JSON.stringify(rm.invariants));
  if (rm.steps >= 3) pass("the machine still runs under reduced motion (" + rm.steps + " beats)");
  else fail("reduced motion must not stall the machine", JSON.stringify(rm));
  if (rm.rooms >= 2) pass("it still travels under reduced motion (" + rm.rooms + " distinct rooms)");
  else fail("it must still travel under reduced motion", JSON.stringify(rm));
  if (rm.cursorSeen) pass("the ghost cursor still shows under reduced motion (it snaps instead of gliding)");
  else fail("the cursor must still appear under reduced motion", JSON.stringify(rm));
  if (rm.ripples === 0) pass("NO tap ripples are spawned under reduced motion");
  else fail("reduced motion must spawn no ripples", "saw " + rm.ripples);
  if (rm.errors.length === 0) pass("no uncaught JS errors in the reduced-motion run");
  else fail("no uncaught JS errors (reduced motion)", rm.errors.slice(0, 8).join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }

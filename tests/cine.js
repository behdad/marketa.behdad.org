#!/usr/bin/env node
// Trailer (▷ Trailer) cinematic tests: drives window.__startCinematic in headless
// Chrome and verifies (1) the FULL reel runs to a clean end in ~55-68s, crosses floors in
// deliberately non-map order, then reaches a preview-only highway and camp tableau, (2) the
// entire run keeps the later act, party, solutions, inventories, and major payoffs hidden, and
// (3) full end, Take over, and hidden-tab abort leave no cinematic/device/game state behind. A
// reduced-motion run checks the same editorial contract, and a real post-reel balcony entry
// proves the normal first-arrival finale remains available.
//
// Timing method: under --virtual-time-budget timers fast-forward, but performance.now()
// tracks virtual time — so (end - start) of performance.now() around the run equals the
// summed beat timeline. rAF is patched to setTimeout (lib patchRaf) so double-rAF toy
// reactions actually advance.
//
// Usage: node tests/cine.js
"use strict";

var lib = require("./lib");

var COMMON = [
  "function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }",
  "function finish(report) { report.errors = window.__errs; document.getElementById('__report').textContent = JSON.stringify(report); }",
  "function seedArcadeLedger() { localStorage.setItem('loftArcadesPlayed', '[\"flair\"]'); localStorage.setItem('loftArcadesSuggested', '[\"pacman\"]'); }",
  "function instrumentCineAudio() { var a = document.getElementById('tumbala-song-audio'); if (!a || a._cineTestPlayOwner) return; a._cineTestPlayOwner = a.play; a._cineTestPlayCalls = 0; a.play = function () { a._cineTestPlayCalls++; return a._cineTestPlayOwner.call(a); }; }",
  // a compact snapshot of every bit of state the reel touches — read after the show ends
  "function snapshot() {",
  "  var strip = document.getElementById('loft-game-strip');",
  "  var bc = document.getElementById('balcony-couple');",
  "  var sg = document.getElementById('stage-garden');",
  "  var sb = document.getElementById('stage-balcony');",
  "  var panel = document.getElementById('roster-panel');",
  "  var cineRoad = window.__cineRoadtripDemoState ? window.__cineRoadtripDemoState() : {active:false};",
  "  var entranceState = window.__entranceRoomState ? window.__entranceRoomState() : null;",
  "  var roadtrip = entranceState && entranceState.drive && entranceState.drive.roadtrip;",
  "  var cineAudio = window.__cinematicAudioState ? window.__cinematicAudioState() : {};",
  "  var score = document.getElementById('tumbala-song-audio');",
  "  var campPorsche = document.getElementById('entrance-roadtrip-camp-porsche');",
  "  return {",
  "    cinematic: !!window.__cinematic,",
  "    cursor: !!document.getElementById('cine-cursor'),",
  "    ripples: document.querySelectorAll('.cine-ripple').length,",
  "    partyOn: !!window.__gardenPartyOn,",
  "    uvMode: !!(strip && strip.classList.contains('uv-mode')),",
  "    rosterOpen: !!(window.__rosterOpen && window.__rosterOpen()),",
  "    rosterPanelShown: !!(panel && panel.classList.contains('show')),",
  "    coupleShowing: !!(bc && bc.classList.contains('showing')),",
  "    auroraForceGarden: !!(sg && sg.classList.contains('aurora-force')),",
  "    auroraForceBalcony: !!(sb && sb.classList.contains('aurora-force')),",
  "    seasonClass: strip ? ((strip.getAttribute('class') || '').match(/season-[a-z]+/) || [null])[0] : null,",
  "    frameRunning: !!document.querySelector('#hunt-fullscreen-area.cinematic-running'),",
  "    cineCaption: !!document.querySelector('#hunt-caption.cine-caption'),",
  "    secondRound: !!window.__secondRound,",
  "    cineRoadtripActive: !!cineRoad.active,",
  "    cineRoadtripClass: !!document.querySelector('#entrance-room.cine-roadtrip-preview'),",
  "    cineCampPorscheReady: !!(campPorsche && campPorsche.getAttribute('data-ready') === 'true'),",
  "    cineCampPorscheChildren: campPorsche ? campPorsche.childNodes.length : 0,",
  "    roadtripActive: !!(roadtrip && roadtrip.active),",
  "    roadtripRoute: roadtrip ? roadtrip.route : null,",
  "    roadtripCampVisited: !!(roadtrip && roadtrip.campVisited),",
  "    roadtripCampFire: !!(roadtrip && roadtrip.campFire && roadtrip.campFire.complete),",
  "    roadtripStargazing: !!(roadtrip && roadtrip.stargazing && roadtrip.stargazing.complete),",
  "    cineScoreStarted: !!cineAudio.scoreStarted,",
  "    cineTailCueStarted: !!cineAudio.tailCueStarted,",
  "    scorePlayCalls: score ? score._cineTestPlayCalls || 0 : 0,",
  "    scorePaused: !score || score.paused,",
  "    scoreTime: score ? score.currentTime : 0,",
  "    scoreFadeActive: !!(score && score._fadeTimer),",
  "    lowerRooms: { bathroom:!!window.__bathroomRoomOpen, cinema:!!window.__cinemaRoomOpen, bedroom:!!window.__bedroomRoomOpen, entrance:!!window.__entranceRoomOpen },",
  "    phoneOpen: !!(window.__chatPhoneState && window.__chatPhoneState().open),",
  "    arcadeActive: !!(window.__arcadeState && window.__arcadeState().active),",
  "    tetrisActive: !!(window.__balconyTetrisState && window.__balconyTetrisState().active),",
  "    bubblesActive: !!(window.__bathroomInteractionState && window.__bathroomInteractionState().bubbles.active),",
  "    tttPhase: window.__bedroomTicTacToeState ? window.__bedroomTicTacToeState().phase : 'idle',",
  "    monitorApps: window.__monitorRunningApps ? window.__monitorRunningApps() : [],",
  "    pcOn: !!document.querySelector('#office-pc-desk-trio.on'),",
  "    arcadePlayed: localStorage.getItem('loftArcadesPlayed'),",
  "    arcadeSuggested: localStorage.getItem('loftArcadesSuggested'),",
  "    balconyUnlocked: !!(window.__balconyUnlocked && window.__balconyUnlocked()),",
  "    maxUnlocked: window.__maxUnlocked ? window.__maxUnlocked() : null,",
  "    stage: window.currentStageName || null,",
  "    captionKey: window.__captionKey ? window.__captionKey() : null",
  "  };",
  "}",
  // Sample editorial invariants throughout the run. A clean end cannot prove a payoff was
  // never shown, so these flags latch on the first offending frame and survive teardown.
  "function sample(report) {",
  "  var stage = window.currentStageName || null; if (stage) report.seenStages[stage] = true;",
  "  var key = window.__captionKey ? window.__captionKey() : null; if (key) report.seenCaptions[key] = true;",
  "  var strip = document.getElementById('loft-game-strip');",
  "  var guests = document.getElementById('garden-guests');",
  "  var monitor = document.getElementById('office-monitor');",
  "  var panel = document.getElementById('roster-panel');",
  "  var rosterToggle = document.querySelector('.roster-toggle');",
  "  var picker = document.getElementById('garden-djpicker');",
  "  var phoneState = window.__chatPhoneState ? window.__chatPhoneState() : {open:false,app:null};",
  "  var projector = window.__cuddlyProjector && window.__cuddlyProjector.channel ? window.__cuddlyProjector.channel() : 'off';",
  "  var cineRoad = window.__cineRoadtripDemoState ? window.__cineRoadtripDemoState() : {active:false,mode:null};",
  "  var entranceState = window.__entranceRoomState ? window.__entranceRoomState() : null;",
  "  var roadtrip = entranceState && entranceState.drive && entranceState.drive.roadtrip;",
  "  var cineAudio = window.__cinematicAudioState ? window.__cinematicAudioState() : {};",
  "  var albumNow = window.__albumList ? window.__albumList().length : report.albumStart;",
  "  if (key && key.indexOf('cine_') !== 0) report.spoilers.explanatoryCaption = true;",
  "  if ((window.__rosterOpen && window.__rosterOpen()) || (panel && panel.classList.contains('show'))) report.spoilers.roster = true;",
  "  if (window.__gardenPartyOn || (window.__guestsIn && window.__guestsIn())) report.spoilers.party = true;",
  "  if (window.__secondRound) report.spoilers.phase2 = true;",
  "  if ((picker && picker.classList.contains('open')) || (window.__cinematic && rosterToggle && getComputedStyle(rosterToggle).visibility !== 'hidden' && rosterToggle.classList.contains('avail'))) report.spoilers.partyUi = true;",
  "  if (guests && (guests.classList.contains('solo-spot') || guests.querySelector('.spotlighted'))) report.spoilers.spotlight = true;",
  "  if (window.__firstDanceOn || window.__slowDanceOn || window.__toastsOn || window.__groupPhotoOn || window.__sparklersOn || window.__cakeOn || window.__bouquetOn || window.__chairliftOn) report.spoilers.formalMoment = true;",
  "  if (strip && /(?:^|\\s)season-[a-z]+/.test(strip.getAttribute('class') || '')) report.spoilers.season = true;",
  "  if (projector !== 'off' && projector !== 'fire') report.spoilers.projector = true;",
  "  if (document.querySelector('#balcony-couple.showing')) report.spoilers.couple = true;",
  "  if (document.querySelector('#stage-garden.aurora-force, #stage-balcony.aurora-force')) report.spoilers.aurora = true;",
  "  if (window.__balconyUnlocked && window.__balconyUnlocked()) report.spoilers.finale = true;",
  "  if (cineRoad.active) {",
  "    report.seenRoadtripPreview[cineRoad.mode] = true;",
  "    if (roadtrip && (roadtrip.active || roadtrip.route !== 'calgary' || roadtrip.campVisited || roadtrip.campFire.complete || roadtrip.stargazing.complete)) report.previewPlayerStateStable = false;",
  "    if (cineRoad.mode === 'highway' && cineRoad.highway && document.querySelector('#entrance-room.roadtrip-route-banff')) report.highwayTableau = true;",
  "    if (cineRoad.mode === 'camp') {",
  "      var camp = document.getElementById('entrance-roadtrip-camp');",
  "      var stars = document.getElementById('entrance-roadtrip-camp-const-cassiopeia');",
  "      var finale = document.getElementById('entrance-roadtrip-camp-finale-constellations');",
  "      var bear = document.getElementById('entrance-roadtrip-camp-mama-bear');",
  "      if (cineRoad.camp && camp && camp.classList.contains('fire-built') && stars && getComputedStyle(stars).display !== 'none' && finale && getComputedStyle(finale).display === 'none' && bear && getComputedStyle(bear).display === 'none') report.campTableauSafe = true;",
  "      if ((finale && getComputedStyle(finale).display !== 'none') || (bear && getComputedStyle(bear).display !== 'none')) report.spoilers.campPayoff = true;",
  "    }",
  "  }",
  "  if (cineAudio.tailCueStarted) report.sawTailCue = true;",
  "  if (albumNow > report.albumStart) report.spoilers.album = true;",
  "  if (report.stageOrder[report.stageOrder.length - 1] !== stage) report.stageOrder.push(stage);",
  "  if (window.__cinemaRoomOpen) report.seenLower.cinema = true;",
  "  if (window.__bathroomRoomOpen) report.seenLower.bathroom = true;",
  "  if (window.__bedroomRoomOpen) report.seenLower.bedroom = true;",
  "  if (window.__entranceRoomOpen) report.seenLower.entrance = true;",
  "  if (phoneState.open && phoneState.app) report.seenPhoneApps[phoneState.app] = true;",
  "  if (monitor && monitor.classList.contains('show-life')) report.seenMonitorApps.life = true;",
  "  if (monitor && monitor.classList.contains('show-code')) report.seenMonitorApps.code = true;",
  "  if (window.__arcadeState && window.__arcadeState().active) report.seenGames.arcade = true;",
  "  if (window.__bathroomInteractionState && window.__bathroomInteractionState().bubbles.active) report.seenGames.bubbles = true;",
  "  if (window.__bedroomTicTacToeState && window.__bedroomTicTacToeState().phase !== 'idle') report.seenGames.ttt = true;",
  "  if (window.__balconyTetrisState && window.__balconyTetrisState().active) report.seenGames.tetris = true;",
  "  var frame = document.getElementById('hunt-fullscreen-area');",
  "  if (window.__cinematic && frame && frame.classList.contains('cinematic-running') && document.querySelector('#hunt-caption.cine-caption')) report.sawPresentation = true;",
  "}"
].join("\n");

// Run the FULL reel to completion, timing it, then snapshot the clean end.
var FULL_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], reducedMotion: null, durationMs: null, ended: false, snap: null, realEntryArmed: false, sawCursorDuringRun: false, seenStages: {}, stageOrder: [], seenLower: {}, seenPhoneApps: {}, seenMonitorApps: {}, seenGames: {}, seenCaptions: {}, seenRoadtripPreview: {}, previewPlayerStateStable: true, highwayTableau: false, campTableauSafe: false, sawTailCue: false, sawPresentation: false, albumStart: 0, spoilers: { party:false, phase2:false, explanatoryCaption:false, roster:false, partyUi:false, spotlight:false, formalMoment:false, season:false, projector:false, couple:false, aurora:false, finale:false, campPayoff:false, album:false } };",
  "  async function run() {",
  "    report.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    seedArcadeLedger();",
  "    instrumentCineAudio();",
  "    var t0 = performance.now();",
  "    window.__startCinematic();",
  "    report.albumStart = window.__albumList ? window.__albumList().length : 0;",
  "    // Poll the whole run: sample the montage surfaces and detect its clean natural end.",
  "    // and detect the end (the reel flips __cinematic false via its own stopCinematic()).",
  "    var guard = 0;",
  "    while (window.__cinematic && guard < 2000) {",
  "      sample(report);",
  "      if (document.getElementById('cine-cursor')) report.sawCursorDuringRun = true;",
  "      await sleep(120);",
  "      guard++;",
  "    }",
  "    report.durationMs = Math.round(performance.now() - t0);",
  "    report.ended = !window.__cinematic;",
  "    await sleep(600);", // let the final stopCinematic teardown + caption restore settle
  "    report.snap = snapshot();",
  "    if (window.goToStage) { window.goToStage('office'); window.goToStage('balcony'); }",
  "    report.realEntryArmed = !!(window.__balconyUnlocked && window.__balconyUnlocked());",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// Start the reel, then TAKE OVER partway through (__stopCinematic) and snapshot the teardown.
var TAKEOVER_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var report = { errors: [], stoppedMidRun: false, snap: null, seenStages: {}, stageOrder: [], seenLower: {}, seenPhoneApps: {}, seenMonitorApps: {}, seenGames: {}, seenCaptions: {}, seenRoadtripPreview: {}, previewPlayerStateStable: true, highwayTableau: false, campTableauSafe: false, sawTailCue: false, sawPresentation: false, albumStart: 0, spoilers: { party:false, phase2:false, explanatoryCaption:false, roster:false, partyUi:false, spotlight:false, formalMoment:false, season:false, projector:false, couple:false, aurora:false, finale:false, campPayoff:false, album:false } };",
  "  async function run() {",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    seedArcadeLedger();",
  "    instrumentCineAudio();",
  "    window.__startCinematic();",
  "    report.albumStart = window.__albumList ? window.__albumList().length : 0;",
  "    for (var i=0; i<167 && window.__cinematic; i++) { sample(report); await sleep(120); }",
  // ~20s in: the lower-floor bubble game is active; Take over must cancel it cleanly.
  "    report.stoppedMidRun = !!window.__cinematic;",
  "    if (window.__stopCinematic) window.__stopCinematic();",
  "    await sleep(800);",
  "    report.snap = snapshot();",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// A hidden tab must abort rather than letting wall-clock timers outrun paused scene motion.
var HIDDEN_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  COMMON,
  "  var forcedHidden = false;",
  "  var report = { errors: [], started: false, snap: null };",
  "  async function run() {",
  "    if (!window.__startCinematic) { window.__errs.push('no __startCinematic hook'); return; }",
  "    seedArcadeLedger();",
  "    instrumentCineAudio();",
  "    Object.defineProperty(document, 'hidden', { configurable:true, get:function(){ return forcedHidden; } });",
  "    window.__startCinematic();",
  "    await sleep(2500);",
  "    report.started = !!window.__cinematic;",
  "    forcedHidden = true; document.dispatchEvent(new Event('visibilitychange'));",
  "    await sleep(700);",
  "    report.snap = snapshot();",
  "  }",
  "  window.addEventListener('load', function () {",
  "    setTimeout(function () {",
  "      run().catch(function (e) { window.__errs.push('harness: ' + String(e && e.stack || e)); }).then(function () { finish(report); });",
  "    }, 400);",
  "  });",
  "})();",
  "</script>"
].join("\n");

// Exercise the road/camp boundary directly: presentation attributes restore byte-for-byte,
// player state stays identical, and the adapter never asks the checkpoint owner to write.
var ROAD_PREVIEW_HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function compactRoadtrip() {",
  "    var entrance = window.__entranceRoomState ? window.__entranceRoomState() : null;",
  "    var r = entrance && entrance.drive && entrance.drive.roadtrip;",
  "    return r ? { active:r.active, paused:r.paused, campVisited:r.campVisited, route:r.route, routeDistance:r.routeDistance, distance:r.distance, score:r.score, accepted:r.accepted, unlocked:r.unlocked, fire:{ complete:r.campFire.complete, lit:r.campFire.lit, open:r.campFire.open }, stew:{ status:r.stew.status, open:r.stew.open }, stars:{ open:r.stargazing.open, complete:r.stargazing.complete, progress:r.stargazing.progress } } : null;",
  "  }",
  "  window.addEventListener('load', function () { setTimeout(function () {",
  "    var report = { errors: [] };",
  "    try {",
  "      window.__cinematic = true;",
  "      if (window.goToStage) window.goToStage('balcony');",
  "      if (window.__openEntranceRoom) window.__openEntranceRoom();",
  "      var room = document.getElementById('entrance-room');",
  "      var camp = document.getElementById('entrance-roadtrip-camp');",
  "      var campPorsche = document.getElementById('entrance-roadtrip-camp-porsche');",
  "      var driveSvg = document.getElementById('entrance-drive-hud-svg');",
  "      var beforeAttrs = [room.getAttribute('class'), room.getAttribute('style'), camp.getAttribute('class'), camp.getAttribute('style'), campPorsche.getAttribute('class'), campPorsche.getAttribute('style'), campPorsche.getAttribute('data-ready'), campPorsche.childNodes.length, driveSvg.getAttribute('viewBox'), driveSvg.getAttribute('preserveAspectRatio')];",
  "      var beforeState = compactRoadtrip();",
  "      var checkpoints = 0, checkpointOwner = window.__checkpointChanged;",
  "      window.__checkpointChanged = function () { checkpoints++; };",
  "      report.highway = !!(window.__cineRoadtripDemo && window.__cineRoadtripDemo('highway'));",
  "      report.highwayState = window.__cineRoadtripDemoState ? window.__cineRoadtripDemoState() : null;",
  "      report.camp = !!(window.__cineRoadtripDemo && window.__cineRoadtripDemo('camp'));",
  "      report.campState = window.__cineRoadtripDemoState ? window.__cineRoadtripDemoState() : null;",
  "      report.duringState = compactRoadtrip();",
  "      report.stopped = !!(window.__cineRoadtripDemo && window.__cineRoadtripDemo(false));",
  "      report.afterAttrs = [room.getAttribute('class'), room.getAttribute('style'), camp.getAttribute('class'), camp.getAttribute('style'), campPorsche.getAttribute('class'), campPorsche.getAttribute('style'), campPorsche.getAttribute('data-ready'), campPorsche.childNodes.length, driveSvg.getAttribute('viewBox'), driveSvg.getAttribute('preserveAspectRatio')];",
  "      report.afterState = compactRoadtrip();",
  "      report.checkpoints = checkpoints;",
  "      report.previewClassAfter = room.classList.contains('cine-roadtrip-preview');",
  "      window.__checkpointChanged = checkpointOwner;",
  "      window.__cinematic = false;",
  "      if (window.__closeEntranceRoom) window.__closeEntranceRoom();",
  "      report.beforeAttrs = beforeAttrs;",
  "      report.beforeState = beforeState;",
  "    } catch (e) { report.errors.push(String(e && e.stack || e)); }",
  "    document.getElementById('__report').textContent = JSON.stringify(report);",
  "  }, 400); });",
  "})();",
  "</script>"
].join("\n");

var failures = 0;
function pass(msg) { console.log("  ✓ " + msg); }
function fail(msg, detail) { failures++; console.log("  ✗ " + msg); if (detail) console.log("      " + String(detail).split("\n").join("\n      ")); }

// Assert every reel-touched bit of state is clean in a post-run snapshot.
function assertClean(label, s) {
  if (!s) { fail(label + ": snapshot captured"); return; }
  if (!s.cinematic) pass(label + ": __cinematic cleared"); else fail(label + ": __cinematic cleared");
  if (!s.cursor) pass(label + ": ghost cursor removed"); else fail(label + ": ghost cursor removed");
  if (s.ripples === 0) pass(label + ": no stranded ripples"); else fail(label + ": no stranded ripples", s.ripples + " left");
  if (!s.partyOn && !s.uvMode) pass(label + ": garden party + UV torn down"); else fail(label + ": garden party + UV torn down", JSON.stringify({ partyOn: s.partyOn, uvMode: s.uvMode }));
  if (!s.rosterOpen && !s.rosterPanelShown) pass(label + ": who's-who panel closed"); else fail(label + ": who's-who panel closed", JSON.stringify({ open: s.rosterOpen, shown: s.rosterPanelShown }));
  if (!s.coupleShowing) pass(label + ": balcony couple released"); else fail(label + ": balcony couple released");
  if (!s.auroraForceGarden && !s.auroraForceBalcony) pass(label + ": aurora override cleared"); else fail(label + ": aurora override cleared", JSON.stringify({ g: s.auroraForceGarden, b: s.auroraForceBalcony }));
  if (!s.seasonClass) pass(label + ": no previewed season stranded"); else fail(label + ": no previewed season stranded", s.seasonClass);
  if (!s.frameRunning && !s.cineCaption) pass(label + ": cinematic presentation classes cleared"); else fail(label + ": cinematic presentation classes cleared", JSON.stringify({ frame: s.frameRunning, caption: s.cineCaption }));
  if (!s.secondRound) pass(label + ": later act remains locked"); else fail(label + ": later act remains locked");
  if (!s.cineRoadtripActive && !s.cineRoadtripClass) pass(label + ": road/camp preview adapter torn down");
  else fail(label + ": road/camp preview adapter torn down", JSON.stringify({ active: s.cineRoadtripActive, className: s.cineRoadtripClass }));
  if (!s.cineCampPorscheReady && s.cineCampPorscheChildren === 0) pass(label + ": preview-only camp car DOM removed");
  else fail(label + ": preview-only camp car DOM removed", JSON.stringify({ ready: s.cineCampPorscheReady, children: s.cineCampPorscheChildren }));
  if (!s.roadtripActive && s.roadtripRoute === "calgary" && !s.roadtripCampVisited && !s.roadtripCampFire && !s.roadtripStargazing) pass(label + ": preview left Road Trip/Camping player state fresh");
  else fail(label + ": preview left Road Trip/Camping player state fresh", JSON.stringify({ active: s.roadtripActive, route: s.roadtripRoute, visited: s.roadtripCampVisited, fire: s.roadtripCampFire, stars: s.roadtripStargazing }));
  if (!s.cineScoreStarted && !s.cineTailCueStarted) pass(label + ": trailer score and reprise ownership cleared");
  else fail(label + ": trailer score and reprise ownership cleared", JSON.stringify({ score: s.cineScoreStarted, tail: s.cineTailCueStarted }));
  if (s.scorePaused && s.scoreTime < 0.01 && !s.scoreFadeActive) pass(label + ": score paused, rewound, and has no live fade");
  else fail(label + ": score paused, rewound, and has no live fade", JSON.stringify({ paused:s.scorePaused, time:s.scoreTime, fade:s.scoreFadeActive }));
  var strandedLower = Object.keys(s.lowerRooms || {}).filter(function (room) { return s.lowerRooms[room]; });
  if (!strandedLower.length) pass(label + ": no lower room stranded"); else fail(label + ": no lower room stranded", strandedLower.join(", "));
  if (!s.phoneOpen) pass(label + ": phone preview closed"); else fail(label + ": phone preview closed");
  if (!s.arcadeActive && !s.tetrisActive && !s.bubblesActive && s.tttPhase === "idle") pass(label + ": minigames stopped and reset");
  else fail(label + ": minigames stopped and reset", JSON.stringify({ arcade: s.arcadeActive, tetris: s.tetrisActive, bubbles: s.bubblesActive, ttt: s.tttPhase }));
  if (!s.pcOn && s.monitorApps.length === 0) pass(label + ": monitor previews shut down"); else fail(label + ": monitor previews shut down", JSON.stringify({ pc: s.pcOn, apps: s.monitorApps }));
  if (s.arcadePlayed === '["flair"]' && s.arcadeSuggested === '["pacman"]') pass(label + ": passive previews preserve arcade recommendations");
  else fail(label + ": passive previews preserve arcade recommendations", JSON.stringify({ played: s.arcadePlayed, suggested: s.arcadeSuggested }));
  if (s.stage === "kitchen" && s.maxUnlocked === 0) pass(label + ": control returns to the fresh starting line");
  else fail(label + ": control returns to the fresh starting line", JSON.stringify({ stage: s.stage, maxUnlocked: s.maxUnlocked }));
  if (!s.balconyUnlocked) pass(label + ": first-arrival finale remains unspent"); else fail(label + ": first-arrival finale remains unspent");
}

function assertSpoilerFree(label, s) {
  if (!s) { fail(label + ": run report captured"); return; }
  var shown = Object.keys(s.spoilers || {}).filter(function (k) { return s.spoilers[k]; });
  if (shown.length === 0) pass(label + ": no party, later-act solution, or payoff systems shown");
  else fail(label + ": no party, later-act solution, or payoff systems shown", shown.join(", "));
}

function assertKeys(label, seen, expected) {
  var missing = expected.filter(function (key) { return !seen || !seen[key]; });
  if (!missing.length) pass(label);
  else fail(label, "missing " + missing.join(", "));
}

function assertNonSequential(label, order, exact) {
  var got = (order || []).join("|");
  if (exact && got === exact.join("|")) pass(label + ": authored arbitrary cut order held");
  else if (!exact && /office\|cuddly\|garden\|kitchen/.test(got)) pass(label + ": montage reverses map order");
  else fail(label + ": montage is non-sequential", got || "no stages sampled");
}

function assertCaptions(label, seen, expected) {
  var missing = expected.filter(function (key) { return !seen || !seen[key]; });
  if (!missing.length) pass(label + ": authored captions complete");
  else fail(label + ": authored captions complete", "missing " + missing.join(", "));
}

console.log("Trailer cinematic — FULL reel (forced full-motion, focused):");
var r = lib.runPageSync("loft-day.html", FULL_HARNESS, 90000, { patchRaf: true, forceMotion: true });
if (!r) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (r.reducedMotion === false) pass("full-motion path selected (prefers-reduced-motion overridden)");
  else fail("full-motion path selected", "reduceMotion=" + r.reducedMotion);
  if (r.ended) pass("reel ran to a clean end on its own (stopCinematic fired)");
  else fail("reel ran to a clean end on its own", "still running after the guard window");
  if (r.durationMs != null && r.durationMs >= 55000 && r.durationMs <= 68000) pass("full reel duration ~1 minute (" + (r.durationMs / 1000).toFixed(1) + "s, target 55-65s)");
  else fail("full reel duration in the 55-68s band", "measured " + (r.durationMs == null ? "null" : (r.durationMs / 1000).toFixed(1) + "s"));
  if (r.sawCursorDuringRun) pass("ghost cursor visible during the run");
  else fail("ghost cursor visible during the run");
  if (r.sawPresentation) pass("authored film presentation active during the run");
  else fail("authored film presentation active during the run");
  assertNonSequential("full reel", r.stageOrder, ["kitchen", "office", "cuddly", "garden", "kitchen", "office", "cuddly", "balcony"]);
  assertKeys("full reel: selected lower rooms appear", r.seenLower, ["cinema", "bathroom", "bedroom", "entrance"]);
  assertKeys("full reel: selected phone apps appear", r.seenPhoneApps, ["clock", "mines"]);
  assertKeys("full reel: selected minigames appear", r.seenGames, ["arcade", "bubbles", "ttt"]);
  assertKeys("full reel: road and camp tableaux appear", r.seenRoadtripPreview, ["highway", "camp"]);
  if (r.highwayTableau && r.campTableauSafe) pass("full reel: authored highway plus spoiler-light fire/stars camp held");
  else fail("full reel: authored highway plus spoiler-light fire/stars camp held", JSON.stringify({ highway: r.highwayTableau, camp: r.campTableauSafe }));
  if (r.previewPlayerStateStable) pass("full reel: road/camp adapter never advances player state");
  else fail("full reel: road/camp adapter never advances player state");
  if (r.sawTailCue) pass("full reel: ending reprise cue started at the road cut");
  else fail("full reel: ending reprise cue started at the road cut");
  if (r.snap && r.snap.scorePlayCalls >= 3) pass("full reel: score was primed, started, and replayed for the ending");
  else fail("full reel: score was primed, started, and replayed for the ending", r.snap && r.snap.scorePlayCalls);
  assertCaptions("full reel", r.seenCaptions, ["cine_open", "cine_arcade", "cine_below", "cine_clues", "cine_anywhere", "cine_phone", "cine_round", "cine_more", "cine_soft", "cine_road", "cine_camp", "cine_signoff"]);
  assertSpoilerFree("full reel", r);
  if (r.seenLower && r.seenLower.entrance) pass("reel closes through the downstairs road/camp preview");
  else fail("reel closes through the downstairs road/camp preview");
  assertClean("full-end", r.snap);
  if (r.realEntryArmed) pass("a later real balcony entry still arms the finale");
  else fail("a later real balcony entry still arms the finale");
  if (r.errors.length === 0) pass("no uncaught JS errors across the full reel");
  else fail("no uncaught JS errors", r.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — mid-reel TAKE OVER teardown:");
var t = lib.runPageSync("loft-day.html", TAKEOVER_HARNESS, 40000, { patchRaf: true, forceMotion: true });
if (!t) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (t.stoppedMidRun) pass("reel was still running at the take-over point");
  else fail("reel was still running at the take-over point (raise the wait, or it's too short)");
  assertSpoilerFree("take-over run", t);
  assertClean("take-over", t.snap);
  if (t.errors.length === 0) pass("no uncaught JS errors through the take-over");
  else fail("no uncaught JS errors", t.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — reduced-motion path (default headless):");
var rm = lib.runPageSync("loft-day.html", FULL_HARNESS, 45000, { patchRaf: true, forceReduce: true });
if (!rm) {
  fail("harness reported (page error before load, or budget too small)");
} else {
  if (rm.reducedMotion === true) pass("reduced-motion path selected");
  else fail("reduced-motion path selected", "reduceMotion=" + rm.reducedMotion);
  if (rm.ended) pass("reduced reel ran to a clean end");
  else fail("reduced reel ran to a clean end");
  if (rm.durationMs != null && rm.durationMs <= 40000) pass("reduced reel is shorter (" + (rm.durationMs / 1000).toFixed(1) + "s)");
  else fail("reduced reel is shorter than the full one (<=40s)", rm.durationMs == null ? "null" : (rm.durationMs / 1000).toFixed(1) + "s");
  assertNonSequential("reduced reel", rm.stageOrder);
  assertKeys("reduced reel: selected lower rooms appear", rm.seenLower, ["cinema", "bathroom", "bedroom", "entrance"]);
  assertKeys("reduced reel: selected phone apps appear", rm.seenPhoneApps, ["clock", "mines"]);
  assertKeys("reduced reel: selected minigames appear", rm.seenGames, ["arcade", "bubbles", "ttt"]);
  assertKeys("reduced reel: road and camp tableaux appear", rm.seenRoadtripPreview, ["highway", "camp"]);
  if (rm.highwayTableau && rm.campTableauSafe && rm.previewPlayerStateStable) pass("reduced reel: safe road/camp adapter held");
  else fail("reduced reel: safe road/camp adapter held", JSON.stringify({ highway: rm.highwayTableau, camp: rm.campTableauSafe, stable: rm.previewPlayerStateStable }));
  if (rm.sawTailCue) pass("reduced reel: ending reprise cue started");
  else fail("reduced reel: ending reprise cue started");
  if (rm.snap && rm.snap.scorePlayCalls >= 3) pass("reduced reel: score was primed, started, and replayed for the ending");
  else fail("reduced reel: score was primed, started, and replayed for the ending", rm.snap && rm.snap.scorePlayCalls);
  assertCaptions("reduced reel", rm.seenCaptions, ["cine_open", "cine_arcade", "cine_below", "cine_clues", "cine_anywhere", "cine_phone", "cine_more", "cine_round", "cine_road", "cine_camp", "cine_signoff"]);
  assertSpoilerFree("reduced reel", rm);
  assertClean("reduced-end", rm.snap);
  if (rm.errors.length === 0) pass("no uncaught JS errors across the reduced reel");
  else fail("no uncaught JS errors", rm.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — hidden-tab abort:");
var h = lib.runPageSync("loft-day.html", HIDDEN_HARNESS, 15000, { patchRaf: true, forceMotion: true });
if (!h) {
  fail("hidden-tab harness reported");
} else {
  if (h.started) pass("reel was active before visibility loss"); else fail("reel was active before visibility loss");
  assertClean("hidden-tab", h.snap);
  if (h.errors.length === 0) pass("no uncaught JS errors through hidden-tab abort");
  else fail("no uncaught JS errors through hidden-tab abort", h.errors.slice(0, 12).join("\n"));
}

console.log("");
console.log("Trailer cinematic — road/camp preview adapter contract:");
var p = lib.runPageSync("loft-day.html", ROAD_PREVIEW_HARNESS, 15000, { patchRaf: true, forceMotion: true });
if (!p) {
  fail("road/camp preview adapter harness reported");
} else {
  if (p.highway && p.highwayState && p.highwayState.highway) pass("adapter presents the highway tableau");
  else fail("adapter presents the highway tableau", JSON.stringify(p.highwayState));
  if (p.camp && p.campState && p.campState.camp) pass("adapter presents the camp tableau");
  else fail("adapter presents the camp tableau", JSON.stringify(p.campState));
  if (p.stopped && !p.previewClassAfter && JSON.stringify(p.beforeAttrs) === JSON.stringify(p.afterAttrs)) pass("adapter restores exact incoming presentation attributes");
  else fail("adapter restores exact incoming presentation attributes", JSON.stringify({ stopped:p.stopped, preview:p.previewClassAfter, before:p.beforeAttrs, after:p.afterAttrs }));
  if (JSON.stringify(p.beforeState) === JSON.stringify(p.duringState) && JSON.stringify(p.beforeState) === JSON.stringify(p.afterState)) pass("adapter never mutates Road Trip/Camping player state");
  else fail("adapter never mutates Road Trip/Camping player state", JSON.stringify({ before:p.beforeState, during:p.duringState, after:p.afterState }));
  if (p.checkpoints === 0) pass("adapter never checkpoints");
  else fail("adapter never checkpoints", p.checkpoints);
  if (p.errors.length === 0) pass("no uncaught JS errors across adapter contract");
  else fail("no uncaught JS errors across adapter contract", p.errors.join("\n"));
}

console.log("");
if (failures > 0) { console.log(failures + " check(s) failed."); process.exit(1); }
else { console.log("All checks passed."); }

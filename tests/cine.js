#!/usr/bin/env node
// Authored Trailer regression: verifies the roughly 95-second reel — gong-struck title,
// day montage (Invaders, Cinema projector, bubbles, tic-tac-toe, Totoro), Party, then the
// authored night arc (clear-sky aurora on the Balcony, a rolling cruise-controlled drive,
// starlit Camping) — preview-safe use of the real owners, narration lead time, score
// ownership, and all natural/take-over/attention-loss/error teardown paths. The final
// matrix also checks the EN/CS title treatment in desktop and phone-landscape frames.
// (The typed Python ready/Kill lifecycle checks live here too: they share this one-shot
// page harness even though the Trailer timeline no longer boots Python.)
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");
var CINE_CHROME = "--allow-file-access-from-files --autoplay-policy=no-user-gesture-required";

var COMMON = [
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "function value(envelope){return envelope&&envelope.ok?envelope.value:null;}",
  "function finish(report){report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}",
  "function finalState(){",
  " var road=value(window.loft.roadtrip.status())||{},room=value(window.loft.room.current()),preview=value(window.loft.session.preview.status())||{},app=value(window.loft.app.current())||{};",
  " var score=document.getElementById('tumbala-song-audio'),fire=document.getElementById('entrance-roadtrip-camp');",
  " var python=value(window.loft.app.python.status())||{};return {room:room,preview:!!preview.active,party:!!window.__gardenPartyOn,roadActive:!!road.active,roadRoute:road.route||null,fireBuilt:!!(fire&&fire.classList.contains('fire-built')),phoneOpen:!!app.phone_open,monitor:app.monitor||null,python:python,arcade:!!(window.__arcadeState&&window.__arcadeState().active),bubbles:!!(window.__bathroomInteractionState&&window.__bathroomInteractionState().bubbles.active),ttt:window.__bedroomTicTacToeState?window.__bedroomTicTacToeState().phase:'idle',frame:!!document.querySelector('#hunt-fullscreen-area.cinematic-running'),cursor:!!document.getElementById('cine-cursor'),scorePaused:!score||score.paused,scoreLoop:!!(score&&score.loop),scoreTime:score?score.currentTime:0,raw:localStorage.getItem('loftCheckpoint:v1'),custom:localStorage.getItem('trailer-test'),max:window.__maxUnlocked?window.__maxUnlocked():null,clickMe:!!document.getElementById('click-me-overlay'),recovery:!!document.getElementById('loft-recovery-gate'),recoveryPreview:document.getElementById('loft-game-strip').classList.contains('recovery-preview'),started:window.__gameStarted()};",
  "}",
  "function instrumentScore(){var a=document.getElementById('tumbala-song-audio');if(!a||a._trailerPlayOwner)return;a._trailerPlayOwner=a.play;a._trailerPlayCalls=0;a.play=function(){a._trailerPlayCalls++;return a._trailerPlayOwner.call(a);};}",
  "function baseReport(){return {errors:[],duration:0,ended:false,reduced:false,rooms:[],captions:{},arrivals:{},visibleForeignCaptions:[],games:{},roads:{},party:false,formal:false,projector:false,totoro:false,aurora:false,balconyNight:false,driveMoving:false,cruise:false,steered:false,merged:false,campNight:false,scoreAtRoad:false,scoreAtCamp:false,scorePlayCalls:0,roadExact:false,campExact:false,campFire:false,presentation:false,extinguisher:false,state:null,checkpoint:'{ \\\"trailer\\\": \\\"raw bytes\\\", \\\"spacing\\\": true }'};}",
  "function sample(r,t0){",
  " var now=performance.now()-t0,room=value(window.loft.room.current()),key=window.__captionKey?window.__captionKey():null,overlay=document.getElementById('cine-overlay'),cut=!!(overlay&&overlay.classList.contains('cine-cut'));",
  " if(key&&r.captions[key]==null)r.captions[key]=now;",
  " if(key&&!cut&&key!=='kitchen'&&key!=='extinguisher_reset'&&key.indexOf('cine_')!==0&&r.visibleForeignCaptions.indexOf(key)<0)r.visibleForeignCaptions.push(key);",
  " if(room&&r.rooms[r.rooms.length-1]!==room){r.rooms.push(room);r.arrivals[room]={time:now,key:key};}",
  " if(room==='cinema'&&window.__cinemaRoomState&&window.__cinemaRoomState().powered)r.projector=true;",
  " if(room==='cuddly'&&window.__cuddlyProjector&&window.__cuddlyProjector.channel&&window.__cuddlyProjector.channel()==='totoro')r.totoro=true;",
  " if(room==='balcony'){var au=window.__auroraStatus&&window.__auroraStatus();if(au&&au.showing)r.aurora=true;var bal=document.getElementById('stage-balcony');if(bal&&bal.classList.contains('dusk'))r.balconyNight=true;}",
  " if(window.__arcadeState&&window.__arcadeState().active)r.games.invaders=true;",
  " if(window.__bathroomInteractionState&&window.__bathroomInteractionState().bubbles.active)r.games.bubbles=true;",
  " if(window.__bedroomTicTacToeState&&window.__bedroomTicTacToeState().phase!=='idle')r.games.ttt=true;",
  " if(window.__gardenPartyOn)r.party=true;",
  " if(window.__firstDanceOn||window.__slowDanceOn||window.__toastsOn||window.__groupPhotoOn||window.__sparklersOn||window.__cakeOn||window.__bouquetOn)r.formal=true;",
  " var road=value(window.loft.roadtrip.status())||{},score=document.getElementById('tumbala-song-audio');",
  " if(road.active&&road.route){r.roads[road.route]=true;var ent=window.__entranceRoomState?window.__entranceRoomState():null;if(road.route==='banff'){r.roadExact=!!document.querySelector('#entrance-room.roadtrip-route-banff');r.scoreAtRoad=!!(score&&score.loop&&score._trailerPlayCalls>=2);if(ent&&ent.drive&&ent.drive.speed>5)r.driveMoving=true;if(ent&&ent.drive&&ent.drive.cruise&&ent.drive.cruise.active)r.cruise=true;if(ent&&ent.drive&&ent.drive.holds&&(ent.drive.holds.steerLeft||ent.drive.holds.steerRight))r.steered=true;if(road.playerLane<1.62)r.merged=true;}if(road.route==='camp'){var camp=document.getElementById('entrance-roadtrip-camp');r.campExact=!!(camp&&getComputedStyle(camp).display!=='none');r.campFire=!!(camp&&camp.classList.contains('fire-built')&&!camp.classList.contains('fire-out'));r.scoreAtCamp=!!(score&&score.loop&&score._trailerPlayCalls>=2);if(ent&&ent.night)r.campNight=true;}}",
  " if(document.querySelector('#hunt-fullscreen-area.cinematic-running #cine-overlay'))r.presentation=true;",
  "}",
  "async function runNatural(r){",
  " r.autonomousAttempt=null;var rewriteCalls=0;window.__monitorMessageRewrite=function(){rewriteCalls++;return Promise.resolve('message rewrite must not run');};",
  " localStorage.setItem('loftCheckpoint:v1',r.checkpoint);localStorage.setItem('trailer-test','before');instrumentScore();",
  " var events=[],off=window.loft.api.subscribe(function(event){events.push(event);}),t0=performance.now(),promise=window.loft.trailer.play(),guard=0;",
  " while(window.__cinematic&&guard++<1800){sample(r,t0);if(r.party&&r.autonomousAttempt===null)r.autonomousAttempt=window.__deliverAutonomousPhoneMessage('athena_banter');await wait(80);}",
  " await promise;await wait(800);off();r.duration=Math.round(performance.now()-t0-800);r.ended=!window.__cinematic;r.events=events.map(function(e){return e.id;});r.scorePlayCalls=document.getElementById('tumbala-song-audio')._trailerPlayCalls||0;r.extinguisher=r.events.indexOf('game.reset')>=0;r.autonomous={attempt:r.autonomousAttempt,rewriteCalls:rewriteCalls,turnstile:performance.getEntriesByType('resource').filter(function(entry){return /turnstile|challenges\\.cloudflare/i.test(entry.name);}).map(function(entry){return entry.name;})};r.state=finalState();",
  "}",
  "function boot(run){window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){window.__errs.push('harness: '+String(e&&e.stack||e));}).then(function(){finish(window.__reportValue);});},400);});}",
].join("\n");

var NATURAL = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  COMMON,
  "var r=baseReport();if(new URLSearchParams(location.search).has('saved'))r.checkpoint=JSON.stringify({version:1,savedAt:Date.now(),progress:{room:'garden',maxUnlocked:1,solvedRooms:['kitchen'],seenRooms:['kitchen','garden'],phase2:false,party:false,daylight:true,bbq:false},puzzle:{}},null,2);r.reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);window.__reportValue=r;boot(function(){return runNatural(r);});",
  "})();</script>"
].join("\n");

function interruptionHarness(kind) {
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
    COMMON,
    "var r=baseReport();r.kind=" + JSON.stringify(kind) + ";window.__reportValue=r;boot(async function(){",
    " window.__setMaxUnlocked(3);localStorage.setItem('loftCheckpoint:v1',r.checkpoint);localStorage.setItem('trailer-test','before');",
    kind === "hidden" ? " var forced=false;Object.defineProperty(document,'hidden',{configurable:true,get:function(){return forced;}});" : "",
    kind === "error" ? " window.__weddingTestShouldIgnoreError=function(e){return e&&e.message==='forced trailer error';};" : "",
    kind === "generic-error" ? " var genericError=new ErrorEvent('error',{message:'Script error.',error:null});window.__weddingTestShouldIgnoreError=function(e){return e===genericError;};" : "",
    " window.loft.trailer.play();await wait(" + (kind === "takeover" ? "18000" : "2600") + ");r.started=!!window.__cinematic;",
    kind === "takeover" ? " await window.loft.trailer.stop('fresh');" : kind === "hidden" ? " forced=true;document.dispatchEvent(new Event('visibilitychange'));" : kind === "generic-error" ? " var afterEvents=[],offAbort=window.loft.api.subscribe(function(event){afterEvents.push(event.id);});window.dispatchEvent(genericError);r.stoppedSync=!window.__cinematic;" : " window.dispatchEvent(new ErrorEvent('error',{message:'forced trailer error',error:new Error('forced trailer error')}));",
    " await wait(" + (kind === "generic-error" ? "5000" : "1000") + ");if(typeof offAbort==='function')offAbort();r.state=finalState();r.ignored=window.__ignoredWeddingTestErrors||0;r.nullDetail=typeof genericError!=='undefined'&&genericError.error===null;r.afterEvents=typeof afterEvents==='undefined'?[]:afterEvents;",
    "});})();</script>"
  ].join("\n");
}

var LAYOUT = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "window.addEventListener('load',function(){setTimeout(async function(){var r={errors:window.__errs};try{window.__setLang(new URLSearchParams(location.search).get('lang')||'en');window.loft.trailer.play();await wait(1200);var frame=document.getElementById('hunt-fullscreen-area').getBoundingClientRect(),card=document.querySelector('.cine-card').getBoundingClientRect(),title=document.querySelector('.cine-card-title'),detail=document.querySelector('.cine-card-detail');r.lang=document.documentElement.lang;r.text=[title.textContent.trim(),detail.textContent.trim()];r.geometry={frame:[frame.left,frame.top,frame.right,frame.bottom],card:[card.left,card.top,card.right,card.bottom],vw:innerWidth,vh:innerHeight,overflow:card.left<frame.left-1||card.right>frame.right+1||card.top<frame.top-1||card.bottom>frame.bottom+1};await window.loft.trailer.stop('restore');}catch(e){window.__errs.push(String(e&&e.stack||e));}r.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(r);},400);});",
  "})();</script>"
].join("\n");

var LAZY = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "window.addEventListener('load',function(){setTimeout(async function(){var r={errors:window.__errs};try{",
  " r.before=(window.__codeSnippetResourceRequests||[]).slice();var load=window.__codeSnippetResourceLoader;window.__codeSnippetResourceLoader=function(path){return new Promise(function(resolve,reject){setTimeout(function(){Promise.resolve(load(path)).then(resolve,reject);},240);});};",
  " var cancelledPlay=window.loft.trailer.play();await wait(40);var cancelledStop=await window.loft.trailer.stop('restore');await cancelledPlay;await wait(320);r.cancelled={stop:cancelledStop,inactive:!window.__cinematic&&!value(window.loft.session.preview.status()).active};",
  " var play=window.loft.trailer.play();await wait(1200);r.active=!!window.__cinematic&&!!document.getElementById('cine-overlay')&&value(window.loft.session.preview.status()).active;await window.loft.trailer.stop('restore');await play;",
  " localStorage.setItem('deskCodeBuiltinOverrides',JSON.stringify({'trailer.js':'window.__trailerOverrideRuns=(window.__trailerOverrideRuns||0)+1;'}));await window.loft.trailer.play();r.override=window.__trailerOverrideRuns===1&&!window.__cinematic&&!value(window.loft.session.preview.status()).active;r.requests=(window.__codeSnippetResourceRequests||[]).slice();",
  "}catch(e){window.__errs.push(String(e&&e.stack||e));}r.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(r);},400);});",
  "function value(envelope){return envelope&&envelope.ok?envelope.value:null;}",
  "})();</script>"
].join("\n");

var PYTHON_LIFECYCLE = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "function value(envelope){return envelope&&envelope.ok?envelope.value:null;}",
  "window.addEventListener('load',function(){setTimeout(async function(){var r={errors:window.__errs,states:[],death:false};try{",
  " var t0=performance.now(),opened=await window.loft.app.open('python'),deadline=performance.now()+30000,status;do{status=value(window.loft.app.python.status());if(status&&r.states[r.states.length-1]!==status.state)r.states.push(status.state);if(status&&status.ready)break;await wait(80);}while(performance.now()<deadline&&status&&status.state!=='failed');r.opened=opened;r.ready=status;r.readyAfter=Math.round(performance.now()-t0);",
  " if(status&&status.ready){await wait(2600);var killAt=performance.now(),kill=window.loft.app.kill({app:'python',device:'monitor'});while(value(window.loft.app.python.status()).open){if(document.getElementById('office-monitor').classList.contains('death-python'))r.death=true;await wait(40);}r.kill=await kill;r.killDuration=Math.round(performance.now()-killAt);r.after=value(window.loft.app.python.status());await window.loft.app.open('python');var cancelDeadline=performance.now()+3000;do{r.cancelBefore=value(window.loft.app.python.status());if(r.cancelBefore.state==='loading')break;await wait(40);}while(performance.now()<cancelDeadline);await window.loft.game.reset('instant');await wait(10000);r.cancelAfter=value(window.loft.app.python.status());}",
  "}catch(e){window.__errs.push(String(e&&e.stack||e));}r.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(r);},400);});",
  "})();</script>"
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]")); }
}
function hasAll(map, keys) { return keys.every(function (key) { return !!map[key]; }); }
function clean(r, disposition) {
  var s = r && r.state;
  check(!!s, disposition + " captured a final state", s);
  if (!s) return;
  check(!s.preview && !s.frame && !s.cursor, disposition + " clears preview and presentation ownership", s);
  var recoveryValid = typeof s.raw === "string" && s.raw.length > 0;
  try {
    var actual = JSON.parse(s.raw), expected = JSON.parse(r.checkpoint);
    if (expected && expected.version) {
      recoveryValid = actual.version === expected.version && actual.progress &&
        actual.puzzle;
    }
  } catch (_error) {}
  // Checkpoint saves legitimately refresh wall-clock attendance, generated Album shots,
  // savedAt and the randomized cabinet while the reel runs. Those bytes are not Trailer
  // ownership; verify the recovery envelope and unrelated storage survive instead.
  check(recoveryValid && s.custom === "before", disposition + " preserves recovery state and browser storage", { raw: s.raw, custom: s.custom });
  check(!s.party && !s.roadActive && !s.phoneOpen && s.monitor !== "python" && s.python.state === "stopped" && !s.arcade && !s.bubbles && s.ttt === "idle", disposition + " tears down real preview owners", s);
  check(s.scorePaused && !s.scoreLoop && s.scoreTime < .05, disposition + " restores the incoming score state", { paused: s.scorePaused, loop: s.scoreLoop, time: s.scoreTime });
}

console.log("Trailer cinematic — lazy ordinary-script activation:");
var lazy = lib.runPageSync("loft-day.html", LAZY, 7000, { patchRaf: true, forceMotion: true, chromeFlags: CINE_CHROME });
check(lazy && lazy.errors.length === 0, "lazy activation has no uncaught errors", lazy && lazy.errors);
check(lazy && lazy.before.length === 0 && lazy.requests.filter(function (path) { return path === "code-snippets/trailer-js.txt"; }).length === 1,
  "the page requests Trailer source only on first activation and reuses that lazy load", lazy && { before: lazy.before, requests: lazy.requests });
check(lazy && lazy.cancelled && lazy.cancelled.stop && lazy.cancelled.inactive,
  "Stop during the lazy load cancels execution without a delayed restart", lazy && lazy.cancelled);
check(lazy && lazy.active && lazy.override,
  "repeat activation executes the ordinary canonical source, while a local built-in override remains authoritative", lazy);

console.log("\nTrailer cinematic — real Python readiness and Kill lifecycle:");
var pythonLifecycle = lib.runPageSync("loft-day.html", PYTHON_LIFECYCLE, 45000, { patchRaf: true, forceMotion: true, chromeFlags: CINE_CHROME });
check(pythonLifecycle && pythonLifecycle.errors.length === 0, "Python lifecycle has no uncaught errors", pythonLifecycle && pythonLifecycle.errors);
check(pythonLifecycle && pythonLifecycle.opened && pythonLifecycle.ready && pythonLifecycle.ready.open && pythonLifecycle.ready.ready && pythonLifecycle.states.includes("loading") && pythonLifecycle.states.includes("ready"),
  "typed Python status reaches the real user-visible ready state (" + ((pythonLifecycle && pythonLifecycle.readyAfter || 0) / 1000).toFixed(1) + "s cold)", pythonLifecycle);
check(pythonLifecycle && pythonLifecycle.death && pythonLifecycle.kill && pythonLifecycle.kill.ok && pythonLifecycle.killDuration >= 2500 && pythonLifecycle.after && !pythonLifecycle.after.open && !pythonLifecycle.after.ready && pythonLifecycle.after.state === "stopped",
  "typed app.kill awaits Python's full themed lifecycle and cold reset", pythonLifecycle);
check(pythonLifecycle && pythonLifecycle.cancelBefore && pythonLifecycle.cancelBefore.state === "loading" && pythonLifecycle.cancelAfter && !pythonLifecycle.cancelAfter.open && !pythonLifecycle.cancelAfter.ready && pythonLifecycle.cancelAfter.state === "stopped",
  "reset during a repeated Python boot cannot resurrect the cancelled runtime", pythonLifecycle);

console.log("\nTrailer cinematic — authored full reel:");
var full = lib.runPageSync("loft-day.html", NATURAL, 165000, { patchRaf: true, forceMotion: true, chromeFlags: CINE_CHROME });
if (!full) check(false, "full reel produced a report");
else {
  check(full.errors.length === 0, "no uncaught errors", full.errors);
  check(!full.reduced && full.ended, "full-motion reel ends naturally", { reduced: full.reduced, ended: full.ended });
  check(full.duration >= 75000 && full.duration <= 115000, "editorial duration stays bounded (" + (full.duration / 1000).toFixed(1) + "s)", full.duration);
  check(full.presentation, "authored cards, grade, rails, and captions own the presentation");
  check(full.rooms.join("|") === "kitchen|office|cinema|bathroom|bedroom|cuddly|garden|balcony|entrance|kitchen", "room order is the authored day-to-night montage", full.rooms);
  check(full.events.indexOf("kitchen.gong.strike") >= 0, "the title beat strikes the real Kitchen gong", full.events);
  check(hasAll(full.games, ["invaders", "bubbles", "ttt"]), "real room minigames appear", full.games);
  check(full.projector && full.totoro, "the Cinema projector powers on and the Cuddly projector tunes to Totoro", { projector: full.projector, totoro: full.totoro });
  check(full.party && !full.formal, "Party appears without a formal/spoiler payoff", { party: full.party, formal: full.formal });
  check(full.aurora && full.balconyNight, "night falls and the summoned aurora is showing over the Balcony", { aurora: full.aurora, night: full.balconyNight });
  check(full.autonomous && full.autonomous.attempt === false && full.autonomous.rewriteCalls === 0 && full.autonomous.turnstile.length === 0,
    "Trailer holds autonomous rewrites before Chat or Turnstile starts", full.autonomous);
  check(full.roads.banff && full.roads.camp && full.roadExact && full.campExact && full.campFire, "real Road Trip and lit Camping renderers appear", { roads: full.roads, road: full.roadExact, camp: full.campExact, fire: full.campFire });
  check(full.driveMoving && full.cruise, "the highway actually rolls under cruise control", { moving: full.driveMoving, cruise: full.cruise });
  check(full.steered && full.merged, "the autopilot steers off the shoulder into the driving lane", { steered: full.steered, merged: full.merged });
  check(full.campNight, "Camping plays under the night sky so the stars can come out", full.campNight);
  check(full.scorePlayCalls >= 2 && full.scoreAtRoad && full.scoreAtCamp, "one looping score covers Road Trip through Camping", { calls: full.scorePlayCalls, road: full.scoreAtRoad, camp: full.scoreAtCamp });
  check(full.visibleForeignCaptions.length === 0, "room/minigame clues never replace narration outside the canonical reset", full.visibleForeignCaptions);
  [["cinema","cine_below"],["bathroom","cine_anywhere"],["bedroom","cine_round"],["balcony","cine_late"]].forEach(function (pair) { var arrival=full.arrivals[pair[0]],lead=arrival&&full.captions[pair[1]]!=null?arrival.time-full.captions[pair[1]]:null;check(arrival&&arrival.key===pair[1]&&lead>=1950,pair[0]+" narration leads the pan by at least ~2s and survives it",{arrival:arrival,lead:lead}); });
  check(full.extinguisher && full.state.room === "kitchen" && full.state.max === 0, "finale pans to Kitchen and uses canonical extinguisher reset", { event: full.extinguisher, state: full.state });
  check(full.state.clickMe && !full.state.recovery && !full.state.started, "normal completion with no resumable save returns to CLICK ME", full.state);
  clean(full, "natural finish");
}

console.log("\nTrailer cinematic — reduced motion:");
var reduced = lib.runPageSync("loft-day.html", NATURAL, 125000, { patchRaf: true, forceReduce: true, urlSuffix: "?saved=1", chromeFlags: CINE_CHROME });
if (!reduced) check(false, "reduced reel produced a report");
else {
  check(reduced.errors.length === 0, "no reduced-motion errors", reduced.errors);
  check(reduced.reduced && reduced.ended && reduced.duration >= 40000 && reduced.duration <= 90000, "reduced edit is finite and deliberately shorter", { reduced: reduced.reduced, ended: reduced.ended, duration: reduced.duration });
  check(reduced.roads.banff && reduced.roads.camp && reduced.party && hasAll(reduced.games,["bubbles","ttt"]), "reduced edit preserves the real authored beats (motion-heavy Invaders stays suppressed)", { roads: reduced.roads, party: reduced.party, games: reduced.games });
  check(reduced.aurora && reduced.campNight, "reduced edit keeps the aurora night arc", { aurora: reduced.aurora, night: reduced.campNight });
  check(reduced.autonomous && reduced.autonomous.attempt === false && reduced.autonomous.rewriteCalls === 0 && reduced.autonomous.turnstile.length === 0,
    "reduced Trailer holds autonomous rewrites before Chat or Turnstile starts", reduced.autonomous);
  check(reduced.state.recovery && reduced.state.recoveryPreview && !reduced.state.clickMe && !reduced.state.started && reduced.state.room === "kitchen" && reduced.state.max === 0, "normal completion reconstructs Welcome back without applying the resumable save", reduced.state);
  clean(reduced, "reduced finish");
}

[
  ["takeover", "fresh", true],
  ["hidden", "restore", false],
  ["error", "restore", false],
  ["generic-error", "restore", false]
].forEach(function (row) {
  console.log("\nTrailer cinematic — " + row[0] + " teardown:");
  var result = lib.runPageSync("loft-day.html", interruptionHarness(row[0]), row[0] === "takeover" ? 26000 : 12000, { patchRaf: true, forceMotion: true, chromeFlags: CINE_CHROME });
  if (!result) { check(false, row[0] + " produced a report"); return; }
  check(result.started, row[0] + " interrupts an active reel");
  check(result.errors.length === 0, row[0] + " has no unexpected page errors", result.errors);
  if (row[0] === "error") check(result.ignored === 1, "forced error reached the trailer abort path", result.ignored);
  if (row[0] === "generic-error") {
    check(result.nullDetail && result.ignored === 1 && result.stoppedSync, "exact null-detail generic ErrorEvent synchronously stops the Trailer", result);
    check(result.afterEvents.indexOf("game.reset") < 0 && result.afterEvents.indexOf("room.go") < 0,
      "aborted timeline issues no later room or reset actions", result.afterEvents);
  }
  check(result.state.room === "kitchen" && result.state.max === (row[2] ? 0 : 3), row[0] + " uses the requested " + row[1] + " disposition", { room: result.state.room, max: result.state.max });
  clean(result, row[0]);
});

console.log("\nTrailer cinematic — EN/CS desktop + phone-landscape title layout:");
[["en",1100,900,false],["cs",1100,900,false],["en",844,390,true],["cs",844,390,true]].forEach(function (row) {
  var layout = lib.runPageSync("loft-day.html", LAYOUT, 7000, { patchRaf: true, forceMotion: true, forceCoarsePointer: row[3], urlSuffix: "?lang=" + row[0], chromeFlags: "--window-size=" + row[1] + "," + row[2] + " " + CINE_CHROME });
  var label = row[0].toUpperCase() + " " + row[1] + "×" + row[2];
  check(layout && layout.errors.length === 0, label + " loads without errors", layout && layout.errors);
  check(layout && layout.lang === row[0] && layout.text.every(Boolean), label + " renders translated title copy", layout && { lang: layout.lang, text: layout.text });
  check(layout && !layout.geometry.overflow, label + " keeps the title card inside the game frame", layout && layout.geometry);
});

console.log("\nTrailer cinematic — authored-file boundary:");
var source = fs.readFileSync(path.join(lib.ROOT, "code-snippets", "trailer-js.txt"), "utf8");
check(!/window\.__|__cineRoadtripDemo|createElementNS|<path|setAttribute\s*\(\s*[\"']d[\"']/.test(source), "external timeline uses typed API primitives, not private hooks or invented SVG geometry");
check(/roadtrip\.preview\.show\(\{ route: "banff"/.test(source) && /roadtrip\.preview\.show\(\{ route: "camp"/.test(source), "timeline selects both exact renderer-owned routes");
var html = fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8");
check(!/function runFullCinematic|function runReducedCinematic|__cineRoadtripDemo/.test(html), "obsolete inline/fake trailer runners are gone");
check((html.match(/src="code-snippets\/trailer\.js"/g) || []).length === 0 && /window\.__runCodeScript\("trailer\.js"/.test(html) && !/LoftDayTrailer|loft-day\.trailer\.js/.test(html), "page lazily hands the one canonical Code-visible Trailer file to the general source runner");
check(!/\bhost\./.test(source), "canonical Trailer has no injected presentation host dependency");
check(/loft\.trailer\.play\(\)/.test(source) && /loft\.session\.preview\.begin\("trailer"\)/.test(source) && /loft\.game\.reset\("instant"\)/.test(source) && /loft\.trailer\.stop\("entry"\)/.test(source), "ordinary Trailer source bootstraps its bounded public play, preview, and entry-completion lifecycle");
var normalizedSource = source.replace(/\["tic-tac-toe"\]/g, ".tic-tac-toe");
var apiCalls = Array.from(new Set(Array.from(normalizedSource.matchAll(/(?:window\.)?loft\.([A-Za-z0-9_.-]+)\s*\(/g), function (match) { return match[1]; }))).sort();
var expectedApiCalls = ["bathroom.bubbles.preview","bedroom.tic-tac-toe.preview","camping.fire.light","camping.fire.open","camping.fire.place","car.control.set","car.cruise.set","car.engine.set","car.range.set","car.status","car.transmission.set","cinema.projector.set","cuddly.projector.set","game.reset","interaction.activate","kitchen.gong.strike","office.invaders.preview","party.set","presentation.card.hide","presentation.card.show","presentation.caption.show","presentation.chapter.show","presentation.cut","presentation.point","presentation.reduced.status","roadtrip.preview.show","roadtrip.status","room.go","session.preview.begin","session.preview.score.play","session.preview.score.stop","sky.effect.set","trailer.play","trailer.status","trailer.stop","util.sleep","weather.scene.set"].sort();
check(apiCalls.join("|") === expectedApiCalls.join("|"), "every Trailer dependency stays under the public Loft root", apiCalls);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

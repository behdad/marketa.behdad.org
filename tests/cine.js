#!/usr/bin/env node
// Authored Trailer regression: verifies the ~90-second reel, preview-safe use of real
// rooms/apps/minigames/Road Trip/Camping, narration lead time, score ownership, and all
// natural/take-over/attention-loss/error teardown paths. The final matrix also checks the
// EN/CS title treatment in desktop and phone-landscape frames.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var COMMON = [
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "function value(envelope){return envelope&&envelope.ok?envelope.value:null;}",
  "function finish(report){report.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(report);}",
  "function finalState(){",
  " var road=value(window.loft.roadtrip.status())||{},room=value(window.loft.room.current()),preview=value(window.loft.session.preview.status())||{},app=value(window.loft.app.current())||{};",
  " var score=document.getElementById('tumbala-song-audio'),fire=document.getElementById('entrance-roadtrip-camp');",
  " return {room:room,preview:!!preview.active,party:!!window.__gardenPartyOn,roadActive:!!road.active,roadRoute:road.route||null,fireBuilt:!!(fire&&fire.classList.contains('fire-built')),phoneOpen:!!app.phone_open,arcade:!!(window.__arcadeState&&window.__arcadeState().active),bubbles:!!(window.__bathroomInteractionState&&window.__bathroomInteractionState().bubbles.active),ttt:window.__bedroomTicTacToeState?window.__bedroomTicTacToeState().phase:'idle',frame:!!document.querySelector('#hunt-fullscreen-area.cinematic-running'),cursor:!!document.getElementById('cine-cursor'),scorePaused:!score||score.paused,scoreLoop:!!(score&&score.loop),scoreTime:score?score.currentTime:0,raw:localStorage.getItem('loftCheckpoint:v1'),custom:localStorage.getItem('trailer-test'),max:window.__maxUnlocked?window.__maxUnlocked():null};",
  "}",
  "function instrumentScore(){var a=document.getElementById('tumbala-song-audio');if(!a||a._trailerPlayOwner)return;a._trailerPlayOwner=a.play;a._trailerPlayCalls=0;a.play=function(){a._trailerPlayCalls++;return a._trailerPlayOwner.call(a);};}",
  "function baseReport(){return {errors:[],duration:0,ended:false,reduced:false,rooms:[],captions:{},arrivals:{},visibleForeignCaptions:[],apps:{},games:{},roads:{},party:false,formal:false,scoreAtRoad:false,scoreAtCamp:false,scorePlayCalls:0,roadExact:false,campExact:false,campFire:false,presentation:false,extinguisher:false,state:null,checkpoint:'{ \\\"trailer\\\": \\\"raw bytes\\\", \\\"spacing\\\": true }'};}",
  "function sample(r,t0){",
  " var now=performance.now()-t0,room=value(window.loft.room.current()),key=window.__captionKey?window.__captionKey():null,overlay=document.getElementById('cine-overlay'),cut=!!(overlay&&overlay.classList.contains('cine-cut'));",
  " if(key&&r.captions[key]==null)r.captions[key]=now;",
  " if(key&&!cut&&key!=='kitchen'&&key.indexOf('cine_')!==0&&r.visibleForeignCaptions.indexOf(key)<0)r.visibleForeignCaptions.push(key);",
  " if(room&&r.rooms[r.rooms.length-1]!==room){r.rooms.push(room);r.arrivals[room]={time:now,key:key};}",
  " var app=value(window.loft.app.current())||{};if(app.phone)r.apps[app.phone]=true;",
  " if(window.__arcadeState&&window.__arcadeState().active)r.games.invaders=true;",
  " if(window.__bathroomInteractionState&&window.__bathroomInteractionState().bubbles.active)r.games.bubbles=true;",
  " if(window.__bedroomTicTacToeState&&window.__bedroomTicTacToeState().phase!=='idle')r.games.ttt=true;",
  " if(window.__gardenPartyOn)r.party=true;",
  " if(window.__firstDanceOn||window.__slowDanceOn||window.__toastsOn||window.__groupPhotoOn||window.__sparklersOn||window.__cakeOn||window.__bouquetOn||window.__chairliftOn)r.formal=true;",
  " var road=value(window.loft.roadtrip.status())||{},score=document.getElementById('tumbala-song-audio');",
  " if(road.active&&road.route){r.roads[road.route]=true;if(road.route==='banff'){r.roadExact=!!document.querySelector('#entrance-room.roadtrip-route-banff');r.scoreAtRoad=!!(score&&score.loop&&score._trailerPlayCalls>=2);}if(road.route==='camp'){var camp=document.getElementById('entrance-roadtrip-camp');r.campExact=!!(camp&&getComputedStyle(camp).display!=='none');r.campFire=!!(camp&&camp.classList.contains('fire-built')&&!camp.classList.contains('fire-out'));r.scoreAtCamp=!!(score&&score.loop&&score._trailerPlayCalls>=2);}}",
  " if(document.querySelector('#hunt-fullscreen-area.cinematic-running #cine-overlay'))r.presentation=true;",
  "}",
  "async function runNatural(r){",
  " localStorage.setItem('loftCheckpoint:v1',r.checkpoint);localStorage.setItem('trailer-test','before');instrumentScore();",
  " var events=[],off=window.loft.api.subscribe(function(event){events.push(event);}),t0=performance.now(),promise=window.__startCinematic(),guard=0;",
  " while(window.__cinematic&&guard++<1800){sample(r,t0);await wait(80);}",
  " await promise;await wait(800);off();r.duration=Math.round(performance.now()-t0-800);r.ended=!window.__cinematic;r.events=events.map(function(e){return e.id;});r.scorePlayCalls=document.getElementById('tumbala-song-audio')._trailerPlayCalls||0;r.extinguisher=r.events.indexOf('game.reset')>=0;r.state=finalState();",
  "}",
  "function boot(run){window.addEventListener('load',function(){setTimeout(function(){run().catch(function(e){window.__errs.push('harness: '+String(e&&e.stack||e));}).then(function(){finish(window.__reportValue);});},400);});}",
].join("\n");

var NATURAL = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  COMMON,
  "var r=baseReport();r.reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);window.__reportValue=r;boot(function(){return runNatural(r);});",
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
    " window.__startCinematic();await wait(" + (kind === "takeover" ? "18000" : "2600") + ");r.started=!!window.__cinematic;",
    kind === "takeover" ? " await window.__stopCinematic('fresh');" : kind === "hidden" ? " forced=true;document.dispatchEvent(new Event('visibilitychange'));" : " window.dispatchEvent(new ErrorEvent('error',{message:'forced trailer error',error:new Error('forced trailer error')}));",
    " await wait(1000);r.state=finalState();r.ignored=window.__ignoredWeddingTestErrors||0;",
    "});})();</script>"
  ].join("\n");
}

var LAYOUT = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre><script>(function(){',
  "function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}",
  "window.addEventListener('load',function(){setTimeout(async function(){var r={errors:window.__errs};try{setLang(new URLSearchParams(location.search).get('lang')||'en');window.__startCinematic();await wait(1200);var frame=document.getElementById('hunt-fullscreen-area').getBoundingClientRect(),card=document.querySelector('.cine-card').getBoundingClientRect(),title=document.querySelector('.cine-card-title'),detail=document.querySelector('.cine-card-detail');r.lang=document.documentElement.lang;r.text=[title.textContent.trim(),detail.textContent.trim()];r.geometry={frame:[frame.left,frame.top,frame.right,frame.bottom],card:[card.left,card.top,card.right,card.bottom],vw:innerWidth,vh:innerHeight,overflow:card.left<frame.left-1||card.right>frame.right+1||card.top<frame.top-1||card.bottom>frame.bottom+1};await window.__stopCinematic('restore');}catch(e){window.__errs.push(String(e&&e.stack||e));}r.errors=window.__errs;document.getElementById('__report').textContent=JSON.stringify(r);},400);});",
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
  check(s.raw === r.checkpoint && s.custom === "before", disposition + " preserves raw recovery bytes and browser storage", { raw: s.raw, custom: s.custom });
  check(!s.party && !s.roadActive && !s.phoneOpen && !s.arcade && !s.bubbles && s.ttt === "idle", disposition + " tears down real preview owners", s);
  check(s.scorePaused && !s.scoreLoop && s.scoreTime < .05, disposition + " restores the incoming score state", { paused: s.scorePaused, loop: s.scoreLoop, time: s.scoreTime });
}

console.log("Trailer cinematic — authored full reel:");
var full = lib.runPageSync("loft-day.html", NATURAL, 105000, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!full) check(false, "full reel produced a report");
else {
  check(full.errors.length === 0, "no uncaught errors", full.errors);
  check(!full.reduced && full.ended, "full-motion reel ends naturally", { reduced: full.reduced, ended: full.ended });
  check(full.duration >= 84000 && full.duration <= 94000, "editorial duration is about 90 seconds (" + (full.duration / 1000).toFixed(1) + "s)", full.duration);
  check(full.presentation, "authored cards, grade, rails, and captions own the presentation");
  check(full.rooms.join("|") === "kitchen|office|cinema|garden|bathroom|bedroom|cuddly|garden|entrance|kitchen", "room order is the authored non-map montage", full.rooms);
  check(hasAll(full.apps, ["clock", "mines"]), "real Clock and Mines phone apps appear", full.apps);
  check(hasAll(full.games, ["invaders", "bubbles", "ttt"]), "real room minigames appear", full.games);
  check(full.party && !full.formal, "Party appears without a formal/spoiler payoff", { party: full.party, formal: full.formal });
  check(full.roads.banff && full.roads.camp && full.roadExact && full.campExact && full.campFire, "real Road Trip and lit Camping renderers appear", { roads: full.roads, road: full.roadExact, camp: full.campExact, fire: full.campFire });
  check(full.scorePlayCalls >= 2 && full.scoreAtRoad && full.scoreAtCamp, "one looping score covers Road Trip through Camping", { calls: full.scorePlayCalls, road: full.scoreAtRoad, camp: full.scoreAtCamp });
  check(full.visibleForeignCaptions.length === 0, "room/minigame clues never replace narration outside the canonical reset", full.visibleForeignCaptions);
  [["cinema","cine_below"],["bathroom","cine_anywhere"],["bedroom","cine_round"]].forEach(function (pair) { var arrival=full.arrivals[pair[0]],lead=arrival&&full.captions[pair[1]]!=null?arrival.time-full.captions[pair[1]]:null;check(arrival&&arrival.key===pair[1]&&lead>=1950,pair[0]+" narration leads the pan by at least ~2s and survives it",{arrival:arrival,lead:lead}); });
  check(full.extinguisher && full.state.room === "kitchen" && full.state.max === 0, "finale pans to Kitchen and uses canonical extinguisher reset", { event: full.extinguisher, state: full.state });
  clean(full, "natural finish");
}

console.log("\nTrailer cinematic — reduced motion:");
var reduced = lib.runPageSync("loft-day.html", NATURAL, 72000, { patchRaf: true, forceReduce: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
if (!reduced) check(false, "reduced reel produced a report");
else {
  check(reduced.errors.length === 0, "no reduced-motion errors", reduced.errors);
  check(reduced.reduced && reduced.ended && reduced.duration >= 47000 && reduced.duration <= 64000, "reduced edit is finite and deliberately shorter", { reduced: reduced.reduced, ended: reduced.ended, duration: reduced.duration });
  check(reduced.roads.banff && reduced.roads.camp && reduced.party && hasAll(reduced.games,["bubbles","ttt"]), "reduced edit preserves the real authored beats (motion-heavy Invaders stays suppressed)", { roads: reduced.roads, party: reduced.party, games: reduced.games });
  clean(reduced, "reduced finish");
}

[
  ["takeover", "fresh", true],
  ["hidden", "restore", false],
  ["error", "restore", false]
].forEach(function (row) {
  console.log("\nTrailer cinematic — " + row[0] + " teardown:");
  var result = lib.runPageSync("loft-day.html", interruptionHarness(row[0]), row[0] === "takeover" ? 26000 : 12000, { patchRaf: true, forceMotion: true, chromeFlags: "--autoplay-policy=no-user-gesture-required" });
  if (!result) { check(false, row[0] + " produced a report"); return; }
  check(result.started, row[0] + " interrupts an active reel");
  check(result.errors.length === 0, row[0] + " has no unexpected page errors", result.errors);
  if (row[0] === "error") check(result.ignored === 1, "forced error reached the trailer abort path", result.ignored);
  check(result.state.room === "kitchen" && result.state.max === (row[2] ? 0 : 3), row[0] + " uses the requested " + row[1] + " disposition", { room: result.state.room, max: result.state.max });
  clean(result, row[0]);
});

console.log("\nTrailer cinematic — EN/CS desktop + phone-landscape title layout:");
[["en",1100,900,false],["cs",1100,900,false],["en",844,390,true],["cs",844,390,true]].forEach(function (row) {
  var layout = lib.runPageSync("loft-day.html", LAYOUT, 7000, { patchRaf: true, forceMotion: true, forceCoarsePointer: row[3], urlSuffix: "?lang=" + row[0], chromeFlags: "--window-size=" + row[1] + "," + row[2] + " --autoplay-policy=no-user-gesture-required" });
  var label = row[0].toUpperCase() + " " + row[1] + "×" + row[2];
  check(layout && layout.errors.length === 0, label + " loads without errors", layout && layout.errors);
  check(layout && layout.lang === row[0] && layout.text.every(Boolean), label + " renders translated title copy", layout && { lang: layout.lang, text: layout.text });
  check(layout && !layout.geometry.overflow, label + " keeps the title card inside the game frame", layout && layout.geometry);
});

console.log("\nTrailer cinematic — authored-file boundary:");
var source = fs.readFileSync(path.join(lib.ROOT, "loft-day.trailer.js"), "utf8");
check(!/window\.__|__cineRoadtripDemo|createElementNS|<path|setAttribute\s*\(\s*[\"']d[\"']/.test(source), "external timeline uses typed API primitives, not private hooks or invented SVG geometry");
check(/roadtrip\.preview\.show\(\{ route: "banff"/.test(source) && /roadtrip\.preview\.show\(\{ route: "camp"/.test(source), "timeline selects both exact renderer-owned routes");
check(!/function runFullCinematic|function runReducedCinematic|__cineRoadtripDemo/.test(fs.readFileSync(path.join(lib.ROOT, "loft-day.html"), "utf8")), "obsolete inline/fake trailer runners are gone");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

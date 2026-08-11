#!/usr/bin/env node
// Shared transport pause and party-dance mirrors have one transition owner each.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' window.__setPartyMode(true,true);var strip=document.getElementById("loft-game-strip"),garden=document.getElementById("stage-garden");',
  ' window.__setMusicPaused(true);S("paused",{flag:!!window.__musicPaused,frozen:strip.classList.contains("dance-frozen")});window.__setMusicPaused(false);S("playing",{flag:!!window.__musicPaused,frozen:strip.classList.contains("dance-frozen")});',
  ' window.__setPartyDance("bandari");S("bandari",{playing:!!(window.__bandariPlaying&&window.__bandariPlaying()),label:window.__nowPlayingLabel(),bpm:window.__DANCE_BPM&&window.__DANCE_BPM.bandari,volume:typeof window.__applyBandariMusicVolume==="function"});',
  ' window.__toggleMusicPlayback();S("bandariPaused",{paused:!!window.__musicPaused,playing:!!window.__bandariPlaying()});window.__toggleMusicPlayback();S("bandariResumed",{paused:!!window.__musicPaused,playing:!!window.__bandariPlaying()});',
  ' window.__setLang("cs");S("bandariCs",window.__nowPlayingLabel());window.__setLang("en");',
  ' var set=window.__setPartyDance("salsa");S("dance",{set:set,mirror:window.__partyDance,stage:garden.getAttribute("data-partydance"),mode:document.getElementById("trip-melt-dancers").getAttribute("data-dance")});',
  ' var before=window.__partyDance;window.__nextPartyDance();S("advance",{before:before,after:window.__partyDance,stage:garden.getAttribute("data-partydance")});',
  ' window.__setPartyMode(false,true);S("off",{party:!!window.__gardenPartyOn,dance:window.__partyDance,stage:garden.getAttribute("data-partydance"),mode:document.getElementById("trip-melt-dancers").getAttribute("data-dance"),paused:!!window.__musicPaused});',
  ' var oldStarsPlaying=window.__starsPlaying,oldSkipStars=window.__skipStarsPiece,starSkips=0;window.__starsPlaying=function(){return true;};window.__skipStarsPiece=function(){starSkips++;};var projectorOrder=window.__cuddlyProjector.order(),firstProgram=projectorOrder[0],fireExpected=projectorOrder[(projectorOrder.indexOf("fire")+1)%projectorOrder.length];window.__cuddlyProjector.set("fire");window.__updatePlayPauseBtn();var fireShown=document.getElementById("hunt-skip-btn").classList.contains("shown"),fireSkip=window.__skipCurrentMusic(),fireAfter=window.__cuddlyProjector.channel();window.__cuddlyProjector.set("totoro");var wrapSkip=window.__skipCurrentMusic(),wrapAfter=window.__cuddlyProjector.channel();window.__cuddlyProjector.set("workout");var projectorBefore=window.__cuddlyProjector.channel(),channelSkip=window.__skipCurrentMusic(),projectorAfter=window.__cuddlyProjector.channel();window.__cuddlyProjector.set("stars");var pianoSkip=window.__skipCurrentMusic();S("projectorSkip",{before:projectorBefore,after:projectorAfter,channelHandled:channelSkip,pianoHandled:pianoSkip,stars:starSkips,final:window.__cuddlyProjector.channel(),shown:document.getElementById("hunt-skip-btn").classList.contains("shown"),fireShown:fireShown,fireHandled:fireSkip,fireAfter:fireAfter,fireExpected:fireExpected,wrapHandled:wrapSkip,wrapAfter:wrapAfter,first:firstProgram});window.__starsPlaying=oldStarsPlaying;window.__skipStarsPiece=oldSkipStars;window.__cuddlyProjector.set("fire");',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html media transitions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.paused && s.paused.flag && s.paused.frozen && s.playing && !s.playing.flag && !s.playing.frozen,
  "setMusicPaused keeps transport state and party freeze together", { paused: s.paused, playing: s.playing });
check(s.bandari && s.bandari.playing && s.bandari.label === "Bandari" &&
      s.bandari.bpm === 124 && s.bandari.volume,
  "Bandari owns its localized source, tempo and volume hook", s.bandari);
check(s.bandariPaused && s.bandariPaused.paused && !s.bandariPaused.playing &&
      s.bandariResumed && !s.bandariResumed.paused && s.bandariResumed.playing,
  "Bandari pauses and resumes through the unified transport", { paused: s.bandariPaused, resumed: s.bandariResumed });
check(s.bandariCs === "Bandari",
  "the Czech Bandari title matches", s.bandariCs);
check(s.dance && s.dance.set && s.dance.mirror === "salsa" && s.dance.stage === "salsa" && s.dance.mode === "salsa",
  "setPartyDance keeps its mirror and both SVG projections together", s.dance);
check(s.advance && s.advance.after !== s.advance.before && s.advance.stage === s.advance.after,
  "automatic dance advance uses the same transition", s.advance);
check(s.off && !s.off.party && s.off.dance === "techno" && s.off.stage === "" && s.off.mode === "" && !s.off.paused,
  "party teardown resets dance and transport projections", s.off);
check(s.projectorSkip && s.projectorSkip.before === "workout" && s.projectorSkip.after === "aqua" &&
      s.projectorSkip.channelHandled && s.projectorSkip.pianoHandled && s.projectorSkip.stars === 1 &&
      s.projectorSkip.final === "stars" && s.projectorSkip.shown && s.projectorSkip.fireShown &&
      s.projectorSkip.fireHandled && s.projectorSkip.fireAfter === s.projectorSkip.fireExpected &&
      s.projectorSkip.wrapHandled && s.projectorSkip.wrapAfter === s.projectorSkip.first,
  "next advances every non-piano projector program, skips off at the wrap, then parks on piano pieces", s.projectorSkip);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(!/Reng-e Shur|id:\s*"persian"|__persianPlaying|__applyPersianMusicVolume/.test(source),
  "removed Reng source is absent from the party catalog and transport");
check((source.match(/window\.__musicPaused\s*=(?!=)/g) || []).length === 1 &&
      (source.match(/window\.__partyDance\s*=(?!=)/g) || []).length === 1 &&
      /function setMusicPausedState\(on\)/.test(source) && /function setPartyDanceState\(id, options\)/.test(source),
  "shared media mirrors have only their named writers");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

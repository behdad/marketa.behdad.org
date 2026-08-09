#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' var screen=document.getElementById("cuddly-wallscreen"),art=document.getElementById("cuddly-coffee"),phrase=art&&art.querySelector("text"),kettle=art&&art.querySelector(".coffee-kettle"),reader=document.getElementById("cuddly-home-reader"),title=reader&&reader.querySelector(".cat-reader-title"),readerSteam=reader&&reader.querySelector(".cat-reader-steam"),bath=document.getElementById("cuddly-bathroom-reader"),bathTitle=bath&&bath.querySelector("text"),bathPaper=bath&&bath.querySelector(".cat-bath-paper"),bathEyes=bath&&bath.querySelector(".cat-bath-eyes");',
  ' report.steps.fresh={channel:window.__cuddlyProjector.channel(),preferred:window.__cuddlyProjector.preferred(),order:window.__cuddlyProjector.order(),shown:screen.classList.contains("chan-coffee"),phrase:phrase&&phrase.textContent,font:phrase&&getComputedStyle(phrase).fontFamily,kettleAnimation:kettle&&getComputedStyle(kettle).animationName,dots:document.querySelectorAll("#cuddly-chan-badge .chan-dot").length,scenes:window.__coffeeSceneState&&window.__coffeeSceneState(),sceneGroups:document.querySelectorAll("#cuddly-coffee,#cuddly-cat-times,#cuddly-home-reader,#cuddly-bathroom-reader").length,readerTitle:title&&title.textContent.replace(/\\s+/g," ").trim(),readerFont:title&&getComputedStyle(title).fontFamily,readerSteam:readerSteam&&getComputedStyle(readerSteam).animationName,bathTitle:bathTitle&&bathTitle.textContent.trim(),bathFont:bathTitle&&getComputedStyle(bathTitle).fontFamily,bathPaper:bathPaper&&getComputedStyle(bathPaper).animationName,bathEyes:bathEyes&&getComputedStyle(bathEyes).animationName};',
  ' window.goToStage("cuddly");window.__cuddlyProjector.set("coffee");await sleep(520);',
  ' report.steps.playing={channel:window.__cuddlyProjector.channel(),playing:window.__coffeeMusicPlaying(),beds:window.__activeAudioBedCount(),label:window.__nowPlayingLabel(),captured:window.__captureCheckpointSystems().projector};',
  ' window.__toggleMusicPlayback();report.steps.paused={flag:!!window.__musicPaused,playing:window.__coffeeMusicPlaying()};window.__toggleMusicPlayback();report.steps.resumed={flag:!!window.__musicPaused,playing:window.__coffeeMusicPlaying()};',
  ' setLang("cs");report.steps.cs={label:window.__nowPlayingLabel(),toast:(document.querySelector(".np-toast")||{}).textContent};setLang("en");',
  ' window.__cuddlyProjector.set("fire");window.__restoreCheckpointSystems({projector:{channel:"coffee"}},"beforeStage");await sleep(720);report.steps.restored={channel:window.__cuddlyProjector.channel(),playing:window.__coffeeMusicPlaying(),captured:window.__captureCheckpointSystems().projector};',
  ' window.__cuddlyProjector.set("off");await sleep(720);report.steps.stopped={playing:window.__coffeeMusicPlaying(),beds:window.__activeAudioBedCount()};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},180);});',
  '})();</script>'
].join("\n");

var COLD_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){window.addEventListener("load",function(){setTimeout(function(){',
  'var first=window.__cuddlyProjector.channel(),preferred=window.__cuddlyProjector.preferred(),order=window.__cuddlyProjector.order();window.__cuddlyProjector.cycle();',
  'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,steps:{cold:{first:first,preferred:preferred,order:order,next:window.__cuddlyProjector.channel()}}});',
  '},180);});})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html coffee-cat projector:");
var warm = lib.runPageSync("loft-day.html", HARNESS, 3400, { patchRaf: true, urlSuffix: "?date=2027-07-10" });
check(!!warm && warm.errors.length === 0, "warm-half harness has no uncaught page errors", warm && warm.errors);
var w = warm && warm.steps || {};
check(w.fresh && w.fresh.channel === "coffee" && w.fresh.preferred === "coffee" &&
  w.fresh.order.slice(0, 2).join(",") === "coffee,fire" && w.fresh.shown,
  "April–September opens coffee first, immediately before fire", w.fresh);
check(w.fresh && w.fresh.phrase === "Hurry? Never—" && /Fraunces/i.test(w.fresh.font) &&
  w.fresh.kettleAnimation === "coffee-kettle-pour" && w.fresh.dots === 6,
  "the native channel retains its exact Fraunces phrase, slow animation and indicator", w.fresh);
check(w.fresh && w.fresh.sceneGroups === 4 && w.fresh.scenes && w.fresh.scenes.count === 4 &&
  w.fresh.scenes.interval === 15000 && w.fresh.scenes.index >= 0 && w.fresh.scenes.index < 4 &&
  w.fresh.readerTitle === "The Gentle Art of Being Home." && /Fraunces/i.test(w.fresh.readerFont) &&
  w.fresh.readerSteam === "cat-reader-steam-rise" && w.fresh.bathTitle === "THE DAILY PAWS" &&
  /Fraunces/i.test(w.fresh.bathFont) && w.fresh.bathPaper === "cat-bath-paper-settle" &&
  w.fresh.bathEyes === "cat-bath-blink",
  "four native café scenes rotate every 15 seconds, including both Fraunces-titled readers", w.fresh);
check(w.playing && w.playing.channel === "coffee" && w.playing.playing && w.playing.beds >= 1 &&
  w.playing.label === "Slow coffee" && w.playing.captured.channel === "coffee",
  "coffee music joins the shared bed, now-playing UI and checkpoint row", w.playing);
check(w.paused && w.paused.flag && !w.paused.playing && w.resumed && !w.resumed.flag && w.resumed.playing,
  "the shared transport pauses and resumes the coffee loop", { paused: w.paused, resumed: w.resumed });
check(w.cs && w.cs.label === "Pomalá káva" && w.cs.toast === "♪ Pomalá káva",
  "the live coffee now-playing label is mirrored in Czech", w.cs);
check(w.restored && w.restored.channel === "coffee" && w.restored.playing && w.restored.captured.channel === "coffee",
  "checkpoint restore retains an explicit coffee channel", w.restored);
check(w.stopped && !w.stopped.playing && w.stopped.beds === 0,
  "leaving the music channel tears its shared bed down", w.stopped);

var cold = lib.runPageSync("loft-day.html", COLD_HARNESS, 1200, { patchRaf: true, urlSuffix: "?date=2027-01-15" });
check(!!cold && cold.errors.length === 0, "cold-half harness has no uncaught page errors", cold && cold.errors);
var c = cold && cold.steps && cold.steps.cold;
check(c && c.first === "fire" && c.preferred === "fire" && c.order.slice(0, 2).join(",") === "fire,coffee" && c.next === "coffee",
  "October–March opens fire first with coffee immediately after", c);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

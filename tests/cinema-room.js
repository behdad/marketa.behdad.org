#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});',
  ' window.goToStage("cuddly");window.__cuddlyProjector.set("coffee");await sleep(520);',
  ' var channel=window.__cuddlyProjector.channel(),before=window.__activeAudioBedCount(),ticket=document.getElementById("cuddly-cinema-ticket");click(ticket);await sleep(850);',
  ' report.steps.open={state:window.__cinemaRoomState(),room:window.currentStageName,channel:window.__cuddlyProjector.channel(),covered:window.__roomAmbienceCovered(),beds:window.__activeAudioBedCount(),hidden:document.getElementById("cinema-room").hidden,viewport:document.querySelector(".hunt-viewport").classList.contains("cinema-room-open"),before:before};',
  ' setLang("cs");report.steps.cs={title:document.getElementById("cinema-room-title").textContent,close:document.getElementById("cinema-room-close").getAttribute("aria-label")};setLang("en");',
  ' var film=document.querySelector(".cinema-film[data-vimeo-id=\\"1096537359\\"]");click(film);await sleep(80);var frame=document.getElementById("cinema-player");',
  ' var shell=document.getElementById("cinema-screen-shell"),frameRect=frame&&frame.getBoundingClientRect(),shellRect=shell.getBoundingClientRect();',
  ' report.steps.play={state:window.__cinemaRoomState(),src:frame&&frame.src,allow:frame&&frame.getAttribute("allow"),duck:window.__partyDuck,chooser:document.getElementById("cinema-chooser").hidden,chooserDisplay:getComputedStyle(document.getElementById("cinema-chooser")).display,frameRect:frameRect&&{x:frameRect.x,y:frameRect.y,width:frameRect.width,height:frameRect.height},shellRect:{x:shellRect.x,y:shellRect.y,width:shellRect.width,height:shellRect.height}};',
  ' click(document.getElementById("cinema-chooser-back"));await sleep(40);report.steps.back={state:window.__cinemaRoomState(),frame:!!document.getElementById("cinema-player"),chooser:document.getElementById("cinema-chooser").hidden};',
  ' click(film);await sleep(40);window.goToStage("office");await sleep(80);report.steps.navigate={state:window.__cinemaRoomState(),room:window.currentStageName,frame:!!document.getElementById("cinema-player"),channel:window.__cuddlyProjector.channel()};',
  ' window.goToStage("cuddly");window.__cuddlyProjector.set("fire");window.__playSongAt(0);await sleep(100);window.__openCinemaRoom();click(film);await sleep(40);click(document.getElementById("cinema-room-close"));await sleep(900);report.steps.fastClose={open:window.__cinemaRoomState().open,song:window.__phoneMusicPlaying()};',
  ' report.steps.channelWas=channel;',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html cinema room:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, {
  patchRaf: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.open && s.open.state.open && !s.open.state.playing && s.open.room === "cuddly" &&
  s.open.channel === s.channelWas && s.open.covered && !s.open.hidden && s.open.viewport,
  "the projector ticket opens a covered subroom without changing room or channel state", s.open);
check(s.open && s.open.before >= 1 && s.open.beds === 0,
  "entering the cinema releases the active Cuddly projector score", s.open);
check(s.cs && s.cs.title === "Na co se podíváme?" && s.cs.close === "Zpět do Cuddly-puddly",
  "chooser and exit copy switch to Czech", s.cs);
check(s.play && s.play.state.playing && s.play.state.video === "1096537359" &&
  /player\.vimeo\.com\/video\/1096537359/.test(s.play.src || "") && /dnt=1/.test(s.play.src || "") &&
  /autoplay/.test(s.play.allow || "") && /fullscreen/.test(s.play.allow || "") && s.play.duck === 0.06 && s.play.chooser,
  "choosing a film creates the privacy-conscious Vimeo player and ducks the party", s.play);
check(s.play && s.play.chooserDisplay === "none" && s.play.frameRect && s.play.shellRect &&
  s.play.frameRect.x >= s.play.shellRect.x && s.play.frameRect.x - s.play.shellRect.x < 10 &&
  s.play.frameRect.y >= s.play.shellRect.y && s.play.frameRect.y - s.play.shellRect.y < 10 &&
  s.play.frameRect.width / s.play.shellRect.width > 0.95 &&
  s.play.frameRect.height / s.play.shellRect.height > 0.94,
  "the hidden chooser releases its layout so the Vimeo picture fills the screen aperture", s.play);
check(s.back && s.back.state.open && !s.back.state.playing && !s.back.frame && !s.back.chooser,
  "returning to the chooser removes the cross-origin player", s.back);
check(s.navigate && !s.navigate.state.open && !s.navigate.state.playing && s.navigate.room === "office" &&
  !s.navigate.frame && s.navigate.channel === s.channelWas,
  "ordinary room navigation tears down the cinema and preserves projector state", s.navigate);
check(s.fastClose && !s.fastClose.open && s.fastClose.song,
  "closing during the song fade still restores the borrowed loft song", s.fastClose);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
["1096537359", "902708480", "927763091", "930085724"].forEach(function (id) {
  check(new RegExp('data-vimeo-id="' + id + '"').test(source), "chooser includes Vimeo " + id);
});
check((source.match(/data-poster=""/g) || []).length === 4,
  "all four chooser cards expose the poster-ready data hook");
check((source.match(/data-vimeo-hash=""/g) || []).length === 4,
  "all four chooser cards expose the unlisted-video hash hook");

console.log("");
if (failures) { console.log(failures + " cinema-room assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Cinema-room assertions passed.");

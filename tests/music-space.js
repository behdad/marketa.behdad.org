#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = [
  '<pre id="__report">pending</pre>',
  '<script>(async function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function space(){var event=new KeyboardEvent("keydown",{key:" ",code:"Space",bubbles:true,cancelable:true});document.dispatchEvent(event);return event;}',
  'var out={errors:window.__errs};if(window.__removeClickMe)window.__removeClickMe();if(window.__finishOpeningGuide)window.__finishOpeningGuide();var openingSpace=space();await sleep(80);out.opening={prevented:openingSpace.defaultPrevented,resumable:window.__checkpointWorthSavingNow(),playing:window.__anyMusicPlaying()};document.getElementById("hunt-fullscreen-area").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__goToStage("office");var mon=document.getElementById("office-monitor");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(80);',
  'space();await sleep(180);var miniBars=[].slice.call(document.querySelectorAll(".dock-mini-eq .eq-bar"));out.desktop={caps:mon.classList.contains("show-caps"),music:mon.classList.contains("show-nowplaying"),playing:window.__anyMusicPlaying(),zoomed:window.__monitorZoomed(),overlay:miniBars.every(function(bar){return !!bar.closest("#monitor-html-overlay");}),bars:miniBars.map(function(bar){return bar.style.transform;})};',
  'space();await sleep(80);out.paused={caps:mon.classList.contains("show-caps"),music:mon.classList.contains("show-nowplaying"),playing:window.__anyMusicPlaying(),bars:miniBars.map(function(bar){return bar.style.transform;})};',
  'mon.classList.remove("show-caps");mon.classList.add("show-weather");space();await sleep(180);out.app={weather:mon.classList.contains("show-weather"),music:mon.classList.contains("show-nowplaying"),playing:window.__anyMusicPlaying()};',
  'window.__monitorZoomIn();var before=window.__phoneMusicId();window.__monitorSkip(1);await sleep(760);out.track={focused:window.__monitorAttention(),weather:mon.classList.contains("show-weather"),music:mon.classList.contains("show-nowplaying"),before:before,after:window.__phoneMusicId(),playing:window.__anyMusicPlaying()};',
  'mon.classList.remove("show-weather");mon.classList.add("show-caps");document.getElementById("monitor-dock-music").click();await sleep(40);out.launch={focused:window.__monitorAttention(),music:mon.classList.contains("show-nowplaying")};',
  'document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(error){document.getElementById("__report").textContent=JSON.stringify({error:String(error&&error.stack||error)});});<\/script>'
].join("\n");

var result = lib.runPageSync("rsvp.html", harness, 1600, {
  patchRaf: true,
  forceMotion: true,
  chromeFlags: "--autoplay-policy=no-user-gesture-required"
});
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) {
    failures++;
    if (detail != null) console.log("    " + JSON.stringify(detail));
  }
}

console.log("rsvp.html Space music transport:");
check(result && !result.error, "focused harness completed", result && result.error);
if (result && !result.error) {
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.opening.prevented && !result.opening.resumable && !result.opening.playing,
    "Space stays quiet at the checkpoint owner's untouched-Kitchen boundary", result.opening);
  check(result.desktop.playing && result.desktop.caps && !result.desktop.music && result.desktop.zoomed &&
      result.desktop.overlay && result.desktop.bars.length === 3 &&
      result.desktop.bars.every(function (value) { return /^scaleY\(/.test(value); }),
    "Space starts music on the desktop without opening Music", result.desktop);
  check(!result.paused.playing && result.paused.caps && !result.paused.music &&
      result.paused.bars.every(function (value) { return value === "scaleY(0)"; }),
    "Space pauses music without leaving the desktop", result.paused);
  check(result.app.playing && result.app.weather && !result.app.music,
    "Space resumes music without leaving the active monitor app", result.app);
  check(result.track.focused && result.track.playing && result.track.weather &&
    !result.track.music && result.track.before !== result.track.after,
    "a track change does not summon Music over a focused monitor app", result.track);
  check(result.launch.focused && result.launch.music,
    "clicking Music still opens it while the monitor is focused", result.launch);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

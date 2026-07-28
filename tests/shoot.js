#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};',
  'function snap(name){var s=window.__shootState();report.steps[name]={view:s.view,open:s.open,src:s.iframe&&s.iframe.src};}',
  'addEventListener("load",function(){setTimeout(function(){',
  'window.goToStage("office");',
  'var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  'tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  'report.steps.order=Array.from(document.querySelectorAll("[data-shoot-game]")).map(function(b){return b.getAttribute("data-shoot-game");});',
  'report.steps.icons=Array.from(document.querySelectorAll("[data-shoot-game] .shoot-logo")).map(function(svg){return svg.tagName.toLowerCase()+":"+svg.querySelectorAll("path,ellipse,circle").length;});',
  'report.steps.tile={id:!!document.getElementById("monitor-dock-shoot"),en:document.querySelector("#monitor-dock-shoot .dock-label").textContent,bg:getComputedStyle(document.querySelector("#monitor-dock-shoot .dock-tile")).backgroundColor};',
  'window.setLang("cs");report.steps.tile.cs=document.querySelector("#monitor-dock-shoot .dock-label").textContent;window.setLang("en");',
  'window.__openMonitorApp("shoot");snap("shoot");',
  'var doomIcon=document.querySelector(".shoot-choice-doom path"),closeBg=document.querySelector("#monitor-doom-close .shoot-close-bg");',
  'report.steps.colors={chooserClose:getComputedStyle(closeBg).fill};',
  'window.__openMonitorApp("doom");snap("doom");',
  'report.steps.colors.doomIcon=getComputedStyle(doomIcon).fill;report.steps.colors.doomClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("duke");snap("duke");report.steps.colors.dukeClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("quake3");snap("quake3");report.steps.colors.q3Close=getComputedStyle(closeBg).fill;',
  'var coach=document.getElementById("monitor-shoot-coach"),coachRect=coach.querySelector("rect"),screen=document.getElementById("office-monitor-bg");',
  'report.steps.coach={on:coach.classList.contains("on"),en:coach.querySelector("text").textContent,pointer:coach.getAttribute("pointer-events"),y:+coachRect.getAttribute("y"),screenBottom:+screen.getAttribute("y")+ +screen.getAttribute("height")};',
  'window.setLang("cs");report.steps.coach.cs=coach.querySelector("text").textContent;window.setLang("en");',
  'window.__openMonitorApp("quake");snap("quake");',
  'var close=document.getElementById("monitor-doom-close"),mark=document.getElementById("monitor-doom-close-mark");',
  'report.steps.dismissGame={aria:close.getAttribute("aria-label"),mark:mark.getAttribute("d")};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("back");',
  'report.steps.dismissChooser={aria:close.getAttribute("aria-label"),mark:mark.getAttribute("d")};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("closed");',
  'report.errors=window.__errs||[];document.getElementById("__report").textContent=JSON.stringify(report);',
  '},350);});',
  '})();</script>'
].join("");

var result = lib.runPageSync("rsvp.html", HARNESS, 2200, { patchRaf: true, forceMotion: true });
var failures = 0;
function check(ok, label, detail) {
  console.log("  " + (ok ? "✓" : "✗") + " " + label);
  if (!ok) { failures++; if (detail != null) console.log("    " + JSON.stringify(detail)); }
}

console.log("rsvp.html shoot launcher:");
check(!!result, "focused harness completed");
if (result) {
  var s = result.steps;
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(JSON.stringify(s.order) === JSON.stringify(["doom", "duke", "q3"]),
    "chooser order is Doom, Duke, Quake III", s.order);
  check(s.icons.length === 3 && s.icons.every(function(icon) { return /^svg:[1-9]/.test(icon); }),
    "all choices use distinct inline SVG pictograms", s.icons);
  check(s.tile.id && s.tile.en === "shoot" && s.tile.cs === "shoot",
    "the desktop tile is lowercase shoot in EN and CS", s.tile);
  check(s.shoot.view === "chooser", "shoot routes to the chooser", s.shoot);
  check(s.doom.view === "doom", "doom routes directly to Doom", s.doom);
  check(s.tile.bg === "rgb(128, 84, 56)" && s.colors.chooserClose === s.tile.bg &&
      s.colors.doomIcon === s.tile.bg &&
      s.colors.doomClose === s.tile.bg && s.colors.dukeClose === s.tile.bg &&
      s.colors.q3Close === s.tile.bg,
    "the Shoot tile, Doom icon, chooser dismiss, and every Back pillow share warm brown", {
      tile: s.tile.bg, colors: s.colors
    });
  check(s.duke.view === "duke" && s.duke.src === "duke/player.html",
    "duke routes directly to its self-hosted player", s.duke);
  check(s.quake3.view === "q3" && s.quake3.src === "q3/player.html",
    "quake3 routes directly to Quake III", s.quake3);
  check(s.coach.on && s.coach.en === "Esc releases mouse" && s.coach.cs === "Esc uvolní myš",
    "mouse-release coach appears immediately with EN/CS copy", s.coach);
  check(s.coach.pointer === "none" && s.coach.y >= s.coach.screenBottom,
    "coach is click-through and below the game viewport", s.coach);
  check(s.quake.view === "q3" && s.quake.src === "q3/player.html",
    "quake is a Quake III alias", s.quake);
  check(/Back to shooters/.test(s.dismissGame.aria) && s.back.view === "chooser" && s.back.open,
    "active-game dismiss returns a game to the chooser", { dismiss: s.dismissGame, back: s.back });
  check(/Close shoot/.test(s.dismissChooser.aria) && !s.closed.open,
    "the same dismiss closes shoot from the chooser", { dismiss: s.dismissChooser, closed: s.closed });
  check(s.dismissGame.mark !== s.dismissChooser.mark,
    "dismiss mark changes between back and close", [s.dismissGame.mark, s.dismissChooser.mark]);
}

var root = path.resolve(__dirname, "..");
var players = ["doom", "duke", "q3"].map(function(name) {
  return fs.readFileSync(path.join(root, name, "player.html"), "utf8");
});
check(players.every(function(source) { return /aspect-ratio:4\/3!important/.test(source); }),
  "all three players share the centered 4:3 viewport contract");
check(players.every(function(source) { return /shoot-pointer-lock/.test(source); }),
  "all three players report pointer-lock acquisition");
check(/movementX \* 0\.25/.test(players[1]) && /movementY \* 0\.25/.test(players[1]),
  "Duke scales raw pointer deltas to one quarter");
check(/"sensitivity", "0\.8"/.test(players[2]) && /"cl_mouseAccel", "0"/.test(players[2]),
  "Quake III starts at sensitivity 0.8 with acceleration off");
check(/"r_hdr", "0"/.test(players[2]) && /"r_postProcess", "0"/.test(players[2]) &&
    /"r_toneMap", "0"/.test(players[2]) && /"r_autoExposure", "0"/.test(players[2]),
  "Quake III keeps unsupported GLES postprocessing paths disabled");

if (failures) {
  console.error("\n" + failures + " shoot check(s) failed.");
  process.exit(1);
}
console.log("\nAll shoot launcher checks passed.");

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
  'function fsSnap(game){var buttons=Array.from(document.querySelectorAll("[data-shoot-fs]")),active=buttons.filter(function(b){var cs=getComputedStyle(b);return cs.opacity!=="0"&&cs.pointerEvents!=="none";}),b=active[0],bg=b&&b.querySelector(".shoot-fs-bg"),bgcs=bg&&getComputedStyle(bg),br=bg&&bg.getBoundingClientRect(),hr=b&&b.querySelector(".mini-hit").getBoundingClientRect(),close=document.querySelector("#monitor-doom-close .shoot-close-bg"),ccs=getComputedStyle(close),cr=close.getBoundingClientRect(),chr=document.querySelector("#monitor-doom-close .mini-hit").getBoundingClientRect(),hit=br&&document.elementFromPoint(br.left+br.width/2,br.top+br.height/2);if(b)b.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));report.steps.fs[game]={total:buttons.length,active:active.map(function(x){return x.getAttribute("data-shoot-fs");}),fill:bgcs&&bgcs.fill,stroke:bgcs&&bgcs.stroke,sameClose:!!bgcs&&bgcs.fill===ccs.fill&&bgcs.stroke===ccs.stroke,round:!!bg&&bg.getAttribute("rx")===close.getAttribute("rx"),sameSize:!!br&&Math.abs(br.width-cr.width)<.1&&Math.abs(br.height-cr.height)<.1,beside:!!br&&cr.left>br.right&&cr.left-br.right<br.width&&Math.abs((br.top+br.bottom)-(cr.top+cr.bottom))<.2,noHitOverlap:!!hr&&hr.right<=chr.left+.1,hit:!!b&&!!hit&&(hit===b||b.contains(hit)),hitTag:hit&&(hit.id||hit.getAttribute&&hit.getAttribute("data-shoot-fs")||hit.tagName),call:(window.__shootFsCalls||[]).slice(-1)[0]||null};}',
  'addEventListener("load",function(){setTimeout(function(){',
  'window.goToStage("office");',
  'var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  'tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  'window.__shootFsCalls=[];HTMLIFrameElement.prototype.requestFullscreen=function(){window.__shootFsCalls.push(this.getAttribute("src"));return Promise.resolve();};report.steps.fs={};',
  'report.steps.order=Array.from(document.querySelectorAll("[data-shoot-game]")).map(function(b){return b.getAttribute("data-shoot-game");});',
  'report.steps.icons=Array.from(document.querySelectorAll("[data-shoot-game] .shoot-logo")).map(function(svg){return svg.tagName.toLowerCase()+":"+svg.querySelectorAll("path,ellipse,circle").length;});',
  'report.steps.tile={id:!!document.getElementById("monitor-dock-shoot"),en:document.querySelector("#monitor-dock-shoot .dock-label").textContent,bg:getComputedStyle(document.querySelector("#monitor-dock-shoot .dock-tile")).backgroundColor};',
  'window.setLang("cs");report.steps.tile.cs=document.querySelector("#monitor-dock-shoot .dock-label").textContent;window.setLang("en");',
  'window.__openMonitorApp("shoot");snap("shoot");fsSnap("chooser");',
  'var doomIcon=document.querySelector(".shoot-choice-doom path"),closeBg=document.querySelector("#monitor-doom-close .shoot-close-bg");',
  'report.steps.colors={chooserClose:getComputedStyle(closeBg).fill};',
  'window.__openMonitorApp("doom");snap("doom");fsSnap("doom");',
  'report.steps.colors.doomIcon=getComputedStyle(doomIcon).fill;report.steps.colors.doomClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("duke");snap("duke");fsSnap("duke");report.steps.colors.dukeClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("quake3");snap("quake3");fsSnap("q3");report.steps.colors.q3Close=getComputedStyle(closeBg).fill;',
  'var gutters=document.querySelectorAll("#monitor-doom .monitor-runtime-side-hit");gutters[1].dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:850,clientY:450}));report.steps.gutters={count:gutters.length,menu:!!document.querySelector(".mon-ctx")};document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  'var coach=document.getElementById("monitor-shoot-coach"),coachRect=coach.querySelector("rect"),screen=document.getElementById("office-monitor-bg");',
  'report.steps.coach={on:coach.classList.contains("on"),en:coach.querySelector("text").textContent,pointer:coach.getAttribute("pointer-events"),y:+coachRect.getAttribute("y"),screenBottom:+screen.getAttribute("y")+ +screen.getAttribute("height")};',
  'window.setLang("cs");report.steps.coach.cs=coach.querySelector("text").textContent;window.setLang("en");',
  'window.__openMonitorApp("quake");snap("quake");',
  'var close=document.getElementById("monitor-doom-close"),back=document.getElementById("monitor-doom-back");',
  'report.steps.gameControls={closeAria:close.getAttribute("aria-label"),closeMark:close.querySelector("path").getAttribute("d"),backMark:back.querySelector("path").getAttribute("d"),backPointer:getComputedStyle(back).pointerEvents};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("dismissed");report.steps.hiddenControls={back:getComputedStyle(back).pointerEvents,fs:Array.from(document.querySelectorAll("[data-shoot-fs]")).map(function(x){return getComputedStyle(x).pointerEvents;})};',
  'window.__openMonitorApp("shoot");snap("resumed");back.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("back");',
  'report.steps.chooserControls={closeAria:close.getAttribute("aria-label"),backPointer:getComputedStyle(back).pointerEvents};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("closed");',
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
  check(s.fs.chooser.total === 3 && s.fs.chooser.active.length === 0 &&
      JSON.stringify(s.fs.doom.active) === JSON.stringify(["doom"]) &&
      JSON.stringify(s.fs.duke.active) === JSON.stringify(["duke"]) &&
      JSON.stringify(s.fs.q3.active) === JSON.stringify(["q3"]),
    "only the active game's fullscreen control is visible", s.fs);
  check(["doom", "duke", "q3"].every(function(game) {
      return s.fs[game].fill === "rgb(128, 84, 56)" &&
        s.fs[game].stroke === "rgb(94, 56, 39)" && s.fs[game].sameClose;
    }), "all fullscreen pillows use the Back button's exact shared brown palette", s.fs);
  check(["doom", "duke", "q3"].every(function(game) {
      return s.fs[game].round && s.fs[game].sameSize && s.fs[game].beside &&
        s.fs[game].noHitOverlap;
    }), "each round fullscreen pillow matches Back's size, sits beside it, and has a disjoint hit area", s.fs);
  check(s.fs.doom.call === "doom/player.html" && s.fs.duke.call === "duke/player.html" &&
      s.fs.q3.call === "q3/player.html",
    "each fullscreen control targets its active disposable iframe", s.fs);
  check(s.fs.doom.hit && s.fs.duke.hit && s.fs.q3.hit,
    "each fullscreen control owns its real pointer hit instead of the Back pill or side gutter", s.fs);
  check(s.gutters.count === 2 && s.gutters.menu,
    "both 4:3 side gutters belong to the monitor context-menu surface", s.gutters);
  check(s.coach.on && s.coach.en === "Esc releases mouse" && s.coach.cs === "Esc uvolní myš",
    "mouse-release coach appears immediately with EN/CS copy", s.coach);
  check(s.coach.pointer === "none" && s.coach.y >= s.coach.screenBottom,
    "coach is click-through and below the game viewport", s.coach);
  check(s.quake.view === "q3" && s.quake.src === "q3/player.html",
    "quake is a Quake III alias", s.quake);
  check(/Close shoot/.test(s.gameControls.closeAria) && s.gameControls.backPointer !== "none" &&
      s.gameControls.closeMark !== s.gameControls.backMark &&
      !s.dismissed.open && s.dismissed.view === "q3" && s.dismissed.src === "q3/player.html" &&
      s.hiddenControls.back === "none" && s.hiddenControls.fs.every(function(value) { return value === "none"; }) &&
      s.resumed.open && s.resumed.view === "q3" && s.resumed.src === "q3/player.html",
    "Dismiss pauses and preserves the active shooter for reopening", {
      controls: s.gameControls, dismissed: s.dismissed, resumed: s.resumed
    });
  check(s.back.view === "chooser" && s.back.open && !s.back.src &&
      s.chooserControls.backPointer === "none" && /Close shoot/.test(s.chooserControls.closeAria),
    "the separate Back returns to the chooser while Dismiss remains available", {
      back: s.back, controls: s.chooserControls
    });
  check(!s.closed.open, "Dismiss closes shoot from the chooser", s.closed);
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
check(/const arenas = \["oa_shine", "aggressor", "am_lavaarena"\]/.test(players[2]) &&
    /data-arena="oa_shine"/.test(players[2]) &&
    /data-arena="aggressor"/.test(players[2]) &&
    /data-arena="am_lavaarena"/.test(players[2]),
  "Quake III offers all three arenas in its visible picker");
check(/loft-arenas\.pk3/.test(players[2]) && /\+map", arena/.test(players[2]) &&
    /loft:q3-arena/.test(players[2]),
  "Quake III loads the extra arena pack and rotates the automatic choice");
var arenaManifest = fs.readFileSync(path.join(root, "q3/baseoa/loft-arenas.manifest"), "utf8");
check(/^maps\/aggressor\.(?:aas|bsp)$/m.test(arenaManifest) &&
    /^maps\/am_lavaarena\.(?:aas|bsp)$/m.test(arenaManifest) &&
    /^scripts\/loft_arenas\.arena$/m.test(arenaManifest),
  "the additional arena manifest carries both playable maps and its arena index");

if (failures) {
  console.error("\n" + failures + " shoot check(s) failed.");
  process.exit(1);
}
console.log("\nAll shoot launcher checks passed.");

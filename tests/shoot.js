#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs||[],steps:{}};',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function snap(name){var s=window.__shootState();report.steps[name]={view:s.view,open:s.open,src:s.iframe&&s.iframe.src,running:window.__monitorAppRunning&&window.__monitorAppRunning("shoot")};}',
  'addEventListener("load",function(){setTimeout(async function(){try{',
  'window.__goToStage("office");',
  'var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  'tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");',
  'report.steps.order=Array.from(document.querySelectorAll("[data-shoot-game]")).map(function(b){return b.getAttribute("data-shoot-game");});',
  'report.steps.icons=Array.from(document.querySelectorAll("[data-shoot-game] .shoot-logo")).map(function(svg){return svg.tagName.toLowerCase()+":"+svg.querySelectorAll("path,ellipse,circle").length;});',
  'report.steps.tile={id:!!document.getElementById("monitor-dock-shoot"),en:document.querySelector("#monitor-dock-shoot .dock-label").textContent,bg:getComputedStyle(document.querySelector("#monitor-dock-shoot .dock-tile")).backgroundColor};',
  'window.__setLang("cs");report.steps.tile.cs=document.querySelector("#monitor-dock-shoot .dock-label").textContent;window.__setLang("en");',
  'var focus=document.getElementById("monitor-desk-fullscreen"),shootFullscreen=document.getElementById("monitor-doom-fullscreen"),shootHost=document.getElementById("monitor-shoot-host"),launchRequested=false;window.__monitorZoomIn();focus.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__openMonitorApp("shoot");snap("shoot");shootHost.requestFullscreen=function(){launchRequested=this===shootHost;return Promise.resolve();};document.querySelector("[data-shoot-game=\\"doom\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(120);var expandedFrame=document.querySelector("#monitor-shoot-host iframe"),expandedWindow=expandedFrame.contentWindow,expandedSrc=expandedFrame.getAttribute("src"),expandedLoads=0;expandedFrame.addEventListener("load",function(){expandedLoads++;});report.steps.expandedLaunch={requested:launchRequested,monitorFocus:window.__monitorContentFullscreen(),hostParent:shootHost.parentNode.id};shootFullscreen.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(60);report.steps.focusFromExpanded={requested:launchRequested,monitorFocus:window.__monitorContentFullscreen(),hostParent:shootHost.parentNode.id,sameFrame:expandedFrame===document.querySelector("#monitor-shoot-host iframe"),sameWindow:expandedWindow===expandedFrame.contentWindow,sameSrc:expandedSrc===expandedFrame.getAttribute("src"),loads:expandedLoads,controlOutside:!shootHost.contains(shootFullscreen)};document.dispatchEvent(new Event("fullscreenchange"));await sleep(60);report.steps.focusFromExpanded.after={sameFrame:expandedFrame===document.querySelector("#monitor-shoot-host iframe"),sameWindow:expandedWindow===expandedFrame.contentWindow,sameSrc:expandedSrc===expandedFrame.getAttribute("src"),loads:expandedLoads,hostParent:shootHost.parentNode.id,monitorFocus:window.__monitorContentFullscreen()};',
  'var doomIcon=document.querySelector(".shoot-choice-doom path"),closeBg=document.querySelector("#monitor-doom-close .shoot-close-bg");',
  'report.steps.colors={chooserClose:getComputedStyle(closeBg).fill};',
  'window.__openMonitorApp("doom");snap("doom");',
  'report.steps.colors.doomIcon=getComputedStyle(doomIcon).fill;report.steps.colors.doomClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("duke");snap("duke");report.steps.colors.dukeClose=getComputedStyle(closeBg).fill;',
  'window.__openMonitorApp("quake");report.steps.colors.q3Close=getComputedStyle(closeBg).fill;window.__openMonitorApp("doom");',
  'var gutters=document.querySelectorAll("#monitor-doom .monitor-runtime-side-hit");gutters[1].dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:850,clientY:450}));report.steps.gutters={count:gutters.length,menu:!!document.querySelector(".mon-ctx")};document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  'var coachState=window.__captionArbiter&&window.__captionArbiter.state();',
  'report.steps.coach={en:document.getElementById("hunt-caption").textContent,key:coachState&&coachState.visible&&coachState.visible.key};',
  'window.__setLang("cs");report.steps.coach.cs=document.getElementById("hunt-caption").textContent;window.__setLang("en");',
  'window.__openMonitorApp("quake");snap("quake");await sleep(120);report.steps.q3Gutters=Array.from(document.querySelectorAll("#monitor-doom .monitor-runtime-side-hit")).map(function(el){return getComputedStyle(el).pointerEvents;});',
  'var close=document.getElementById("monitor-doom-close"),back=document.getElementById("monitor-doom-back"),fullscreen=document.getElementById("monitor-doom-fullscreen"),shootHost=document.getElementById("monitor-shoot-host");',
  'var backRect=back.querySelector(".shoot-close-bg").getBoundingClientRect(),fullscreenRect=fullscreen.querySelector(".shoot-close-bg").getBoundingClientRect(),closeRect=close.querySelector(".shoot-close-bg").getBoundingClientRect(),backHit=back.querySelector(".mini-hit").getBoundingClientRect(),fullscreenHit=fullscreen.querySelector(".mini-hit").getBoundingClientRect(),closeHit=close.querySelector(".mini-hit").getBoundingClientRect();report.steps.gameControls={closeMark:close.querySelector("path").getAttribute("d"),fullscreenMark:fullscreen.querySelector("path").getAttribute("d"),backMark:back.querySelector("path").getAttribute("d"),backPointer:getComputedStyle(back).pointerEvents,fullscreenPointer:getComputedStyle(fullscreen).pointerEvents,order:backRect.left<fullscreenRect.left&&fullscreenRect.left<closeRect.left,disjoint:backHit.right<=fullscreenHit.left+.1&&fullscreenHit.right<=closeHit.left+.1};var requested=false,beforeFrame=document.querySelector("#monitor-shoot-host iframe"),beforeWindow=beforeFrame.contentWindow,beforeSrc=beforeFrame.getAttribute("src"),focusLoads=0;beforeFrame.addEventListener("load",function(){focusLoads++;});shootHost.requestFullscreen=function(){requested=this===shootHost;return Promise.resolve();};fullscreen.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(60);report.steps.focus={requested:requested,hostParent:shootHost.parentNode.id,sameFrame:beforeFrame===document.querySelector("#monitor-shoot-host iframe"),sameWindow:beforeWindow===beforeFrame.contentWindow,sameSrc:beforeSrc===beforeFrame.getAttribute("src"),loads:focusLoads,noExitButton:!document.getElementById("shoot-focus-exit"),controlOutside:!shootHost.contains(fullscreen)};document.dispatchEvent(new Event("fullscreenchange"));await sleep(60);report.steps.focus.after={sameFrame:beforeFrame===document.querySelector("#monitor-shoot-host iframe"),sameWindow:beforeWindow===beforeFrame.contentWindow,sameSrc:beforeSrc===beforeFrame.getAttribute("src"),loads:focusLoads,hostParent:shootHost.parentNode.id};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("dismissed");report.steps.hiddenControls={back:getComputedStyle(back).pointerEvents,fullscreen:getComputedStyle(fullscreen).pointerEvents};',
  'window.__openMonitorApp("shoot");snap("reopened");document.querySelector("[data-shoot-game=\\"q3\\"]").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));snap("q3reopened");var fallbackFrame=document.querySelector("#monitor-shoot-host iframe");shootHost.requestFullscreen=null;shootHost.webkitRequestFullscreen=null;fullscreen.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);report.steps.fallback={content:window.__monitorContentFullscreen(),sameFrame:fallbackFrame===document.querySelector("#monitor-shoot-host iframe"),hostParent:shootHost.parentNode.id};fullscreen.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(40);report.steps.fallback.after={content:window.__monitorContentFullscreen(),sameFrame:fallbackFrame===document.querySelector("#monitor-shoot-host iframe"),hostParent:shootHost.parentNode.id};back.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("back");',
  'report.steps.chooserControls={closePointer:getComputedStyle(close).pointerEvents,backPointer:getComputedStyle(back).pointerEvents};close.dispatchEvent(new MouseEvent("click",{bubbles:true}));snap("closed");',
  '}catch(e){report.errors=(window.__errs||[]).concat(["harness: "+String(e&&e.stack||e)]);}report.errors=report.errors.length?report.errors:(window.__errs||[]);document.getElementById("__report").textContent=JSON.stringify(report);',
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
  check(s.gameControls.fullscreenPointer !== "none" &&
      s.gameControls.order && s.gameControls.disjoint &&
      s.gameControls.backMark !== s.gameControls.fullscreenMark &&
      s.gameControls.fullscreenMark !== s.gameControls.closeMark,
    "active Shoot controls are ordered Back, Fullscreen, Dismiss with separate hit targets",
    s.gameControls);
  check(s.focus.requested && s.focus.hostParent === "monitor-doom-wrap" &&
      s.focus.sameFrame && s.focus.sameWindow && s.focus.sameSrc && s.focus.loads === 0 &&
      s.focus.noExitButton && s.focus.controlOutside &&
      s.focus.after.sameFrame && s.focus.after.sameWindow && s.focus.after.sameSrc &&
      s.focus.after.loads === 0 &&
      s.focus.after.hostParent === "monitor-doom-wrap",
    "Shoot Fullscreen preserves iframe identity, source, load count, and browsing-context state through enter and exit", {
      controls: s.gameControls, focus: s.focus
    });
  check(!s.expandedLaunch.requested && s.expandedLaunch.monitorFocus &&
      s.expandedLaunch.hostParent === "monitor-doom-wrap" &&
      s.focusFromExpanded.requested && s.focusFromExpanded.monitorFocus &&
      s.focusFromExpanded.hostParent === "monitor-doom-wrap" &&
      s.focusFromExpanded.sameFrame && s.focusFromExpanded.sameWindow &&
      s.focusFromExpanded.sameSrc && s.focusFromExpanded.loads === 0 &&
      s.focusFromExpanded.after.sameFrame && s.focusFromExpanded.after.sameWindow &&
      s.focusFromExpanded.after.sameSrc && s.focusFromExpanded.after.loads === 0 &&
      s.focusFromExpanded.after.hostParent === "monitor-doom-wrap" &&
      s.focusFromExpanded.after.monitorFocus &&
      s.focusFromExpanded.controlOutside,
    "expanded monitor focus also preserves the exact live browsing context through fullscreen",
    { launch: s.expandedLaunch, fullscreen: s.focusFromExpanded });
  check(s.fallback && s.fallback.content && s.fallback.sameFrame && s.fallback.hostParent === "monitor-doom-wrap" &&
      s.fallback.after && !s.fallback.after.content && s.fallback.after.sameFrame &&
      s.fallback.after.hostParent === "monitor-doom-wrap",
    "tablet fullscreen fallback uses monitor-content fullscreen without moving the live iframe",
    { fallback: s.fallback });
  check(s.gutters.count === 2 && s.gutters.menu,
    "both 4:3 side gutters belong to the monitor context-menu surface", s.gutters);
  check(s.coach.key === "shoot_mouse_coach" && s.coach.en === "Esc releases mouse" && s.coach.cs === "Esc uvolní myš",
    "mouse-release coach appears immediately in the shared EN/CS caption", s.coach);
  check(s.quake.view === "q3" && s.quake.src === "q3/player.html",
    "quake routes directly to Quake III", s.quake);
  check(s.gameControls.backPointer !== "none" &&
      s.gameControls.closeMark !== s.gameControls.backMark &&
      !s.dismissed.open && s.dismissed.view === "chooser" && !s.dismissed.src && !s.dismissed.running &&
      s.hiddenControls.back === "none" && s.hiddenControls.fullscreen === "none" &&
      s.reopened.open && s.reopened.view === "chooser" && !s.reopened.src && s.reopened.running &&
      s.q3reopened.open && s.q3reopened.view === "q3" && s.q3reopened.src === "q3/player.html",
    "Dismiss silently destroys the shooter, clears its task LED, and reopening starts cleanly", {
      controls: s.gameControls, dismissed: s.dismissed, reopened: s.reopened, q3reopened: s.q3reopened
    });
  check(s.back.view === "chooser" && s.back.open && !s.back.src &&
      s.chooserControls.backPointer === "none" && s.chooserControls.closePointer !== "none",
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
check(players.every(function(source) {
  return /id="touch-pad"/.test(source) &&
    (source.match(/class="touch-pad-button"/g) || []).length === 8 &&
    (source.match(/data-dir=/g) || []).length >= 8 &&
    (source.match(/data-touch-key="[wasd]"/g) || []).length >= 4 &&
    /any-pointer:coarse/.test(source) && /left:max\(/.test(source) && /emitTouchKey/.test(source) && /setPointerCapture/.test(source) &&
    /releaseTouchKeys/.test(source);
}), "all three players expose a coarse-pointer left-side WASD touch pad with held-key cleanup");
check(players.every(function(source) {
  return /--touch-cell:clamp\(25px,16\.6vmin,76px\)/.test(source) &&
    /bottom:max\(clamp\(5px,2vmin,14px\),env\(safe-area-inset-bottom\)\)/.test(source) &&
    !/top:50%;transform:translateY\(-50%\)/.test(source);
}), "all three shooter D-pads share the enlarged bottom-left touch geometry");
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
  "Quake III loads the extra arena pack and remembers the explicit choice");
check(!/setTimeout\(\(\) => pick/.test(players[2]) &&
    /canvas\.addEventListener\("pointerdown"/.test(players[2]) &&
    !/document\.addEventListener\("pointerdown", \(\) =>/.test(players[2]),
  "Quake III waits for a choice and only the game canvas takes pointer focus");
check(/width:min\(84vw,760px\)/.test(players[2]) &&
    /touch-action:manipulation/.test(players[2]),
  "Quake III arena cards keep touch-sized explicit pointer targets");
check(result && result.steps.q3Gutters.length === 2 &&
    result.steps.q3Gutters.every(function(value) { return value === "none"; }),
  "Quake III leaves its full visible picker free of monitor gutter hit surfaces");
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

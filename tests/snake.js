#!/usr/bin/env node
"use strict";

var lib = require("./lib");
var crypto = require("crypto");
var fs = require("fs");
var childProcess = require("child_process");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'function routedKey(k){var active=document.activeElement;if(active&&active.tagName==="IFRAME")return;var target=active||document;target.dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.__goToStage("office");if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(40);',
  ' var ids=[].slice.call(document.querySelectorAll(".dock-grid .dock-app")).map(function(el){return el.id.replace("monitor-dock-","");});',
  ' S("grid",{ids:ids,calendar:!!document.getElementById("monitor-dock-calendar"),tattooAt:ids.indexOf("tattoo"),games:ids.slice(8,12),bottom:ids.slice(12,16)});var snakeApp=document.querySelector(".dock-app-snake"),snakeTile=snakeApp.querySelector(".dock-tile"),snakeDos=document.querySelector("#dicon-snake path");S("theme",{tile:snakeTile&&getComputedStyle(snakeTile).backgroundColor,dos:snakeDos&&snakeDos.getAttribute("stroke")});',
  ' var dateControl=document.getElementById("monitor-desk-calendar");if(dateControl)dateControl.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(20);S("calendar",{control:!!dateControl,opened:mon.classList.contains("show-calendar"),phoneTile:!!document.querySelector(".phone-app-tile[data-app=\\"calendar\\"], [data-phone-app=\\"calendar\\"]")});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");',
  ' function search(q){q.split("").forEach(key);var state=window.__monitorDockSearch();key("Escape");return state;}function searchOpen(q){q.split("").forEach(key);key("Enter");}S("aliases",{snake:search("snake"),nibbles:search("nibbles"),dos:search("dos")});',
  ' window.__openMonitorApp("snake");await sleep(30);var setup=document.getElementById("snake-launch-panel"),setupState=window.__snakeState();S("setup",{panel:!!setup,native:!!setup&&setup.parentElement.id==="monitor-snake-wrap",backdrop:!!document.querySelector(".snake-launch-backdrop"),players:setup&&!!setup.querySelector("#snake-launch-players"),speed:setup&&!!setup.querySelector("#snake-launch-speed"),visible:mon.classList.contains("snake-setup-open"),state:setupState});setup.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(30);var first=document.querySelector("#monitor-snake-wrap iframe"),firstWindow=first.contentWindow,lifecycleBefore=window.__monitorHtmlOverlayState().metrics;window.dispatchEvent(new MessageEvent("message",{origin:location.origin,source:firstWindow,data:{type:"snake-ready"}}));await sleep(30);var lifecycleAfter=window.__monitorHtmlOverlayState().metrics,overlayState=window.__monitorHtmlOverlayState(),frameBox=first.getBoundingClientRect(),overlayBox=document.getElementById("monitor-html-overlay").getBoundingClientRect();S("identity",{count:document.querySelectorAll("#monitor-snake-wrap iframe").length,sameFrame:first===document.querySelector("#monitor-snake-wrap iframe"),sameWindow:firstWindow===first.contentWindow,mounts:lifecycleAfter.mounts-lifecycleBefore.mounts,restores:lifecycleAfter.restores-lifecycleBefore.restores});S("surface",{physical:overlayState.geometry&&overlayState.geometry.physicalRuntime,frameWidth:frameBox.width,frameHeight:frameBox.height,overlayWidth:overlayBox.width,overlayHeight:overlayBox.height,closeTransform:document.getElementById("monitor-snake-close").getAttribute("transform"),resetAbsent:!document.getElementById("monitor-snake-reset")});S("open",{open:mon.classList.contains("show-snake"),frame:!!first,src:first&&first.getAttribute("src"),state:window.__snakeState(),innerFs:!!document.getElementById("monitor-snake-fs"),allow:first&&first.getAttribute("allow")});var gutters=document.querySelectorAll("#monitor-snake .monitor-runtime-side-hit");var gutterOpened=window.__openMonitorContextAt(gutters[0],250,250),gutterMenu=document.querySelector(".mon-ctx"),gutterLabels=gutterMenu?[].slice.call(gutterMenu.querySelectorAll("button")).map(function(b){return b.textContent.trim();}):[];S("gutters",{count:gutters.length,opened:gutterOpened,menu:!!gutterMenu,ownsFocus:!!(gutterMenu&&gutterMenu.contains(document.activeElement))});S("menu",{labels:gutterLabels,kill:!!(gutterMenu&&gutterMenu.querySelector(".ctx-kill:not(:disabled)")),restart:!!(gutterMenu&&gutterMenu.querySelector(".ctx-restart:not(:disabled)"))});document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  ' var dock=document.getElementById("monitor-desktop-dock");dock.focus();var move=new KeyboardEvent("keydown",{key:"ArrowUp",code:"ArrowUp",bubbles:true,cancelable:true});try{Object.defineProperty(move,"keyCode",{get:function(){return 38;}});}catch(_error){}dock.dispatchEvent(move);await sleep(10);var ownershipState=window.__snakeState();S("ownership",{focus:document.activeElement===first,prevented:move.defaultPrevented,relayed:ownershipState.relayedKeys,last:ownershipState.lastRelayedKey});var modal=document.createElement("div");modal.className="pb-dialog-backdrop";document.body.appendChild(modal);dock.focus();var blocked=new KeyboardEvent("keydown",{key:"ArrowLeft",code:"ArrowLeft",bubbles:true,cancelable:true});dock.dispatchEvent(blocked);modal.remove();mon.classList.add("show-console");dock.focus();var otherApp=new KeyboardEvent("keydown",{key:"ArrowRight",code:"ArrowRight",bubbles:true,cancelable:true});dock.dispatchEvent(otherApp);mon.classList.remove("show-console");S("blockedOwners",{relayed:window.__snakeState().relayedKeys});',
  ' var dpadHost=document.getElementById("monitor-snake-dpad"),dpad=document.getElementById("monitor-snake-controls"),dpadButtons=[].slice.call(dpad.querySelectorAll(".snake-dpad-button[data-dir]")),dpadUp=dpad.querySelector("[data-snake-key=ArrowUp]"),dpadBefore=window.__snakeState();var dpadDownEvent=new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:721,pointerType:"touch",button:0});dpadUp.dispatchEvent(dpadDownEvent);var dpadHeld=window.__snakeState();var dpadUpEvent=new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:721,pointerType:"touch",button:0});dpadUp.dispatchEvent(dpadUpEvent);var dpadReleased=window.__snakeState();S("dpad",{count:dpadButtons.length,keys:dpadButtons.map(function(b){return b.getAttribute("data-snake-key");}),directions:dpadButtons.map(function(b){return b.getAttribute("data-dir");}),hostX:Number(dpadHost.getAttribute("x")),before:dpadBefore,held:dpadHeld,released:dpadReleased,downPrevented:dpadDownEvent.defaultPrevented,upPrevented:dpadUpEvent.defaultPrevented});',
  ' window.__closeMonitorSnake();await sleep(10);window.__currentStageName="office";mon.classList.add("show-caps");snakeApp.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:250,clientY:250}));var backgroundMenu=document.querySelector(".mon-ctx"),backgroundMenuOpened=!!backgroundMenu;S("close",{open:mon.classList.contains("show-snake"),frame:!!document.querySelector("#monitor-snake-wrap iframe"),running:window.__monitorAppRunning("snake"),host:window.__snakeRunning(),state:window.__snakeState(),dot:snakeApp.classList.contains("is-running"),menuOpened:backgroundMenuOpened,html:backgroundMenu&&backgroundMenu.innerHTML,kill:!!(backgroundMenu&&backgroundMenu.querySelector(".ctx-kill:not(:disabled)"))});key("Escape");snakeApp.click();await sleep(10);var reopenPanel=document.getElementById("snake-launch-panel");S("reopenGame",{setup:window.__snakeState().setupOpen,open:window.__snakeState().open,frame:!!document.querySelector("#monitor-snake-wrap iframe"),panel:!!reopenPanel});reopenPanel.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(20);var reopened=document.querySelector("#monitor-snake-wrap iframe");S("reopenStarted",{fresh:!!reopened&&reopened!==first,mode:window.__snakeState().mode});window.__closeMonitorSnake();',
  ' window.__openMonitorApp("dos");await sleep(20);var shell=document.querySelector("#monitor-snake-wrap iframe");S("dos",{fresh:!!shell&&shell!==first,src:shell&&shell.getAttribute("src"),mode:window.__snakeState().mode});window.__closeMonitorSnake();window.__openMonitorApp("dos");await sleep(10);S("reopenDos",{fresh:!!document.querySelector("#monitor-snake-wrap iframe")&&document.querySelector("#monitor-snake-wrap iframe")!==shell,mode:window.__snakeState().mode});shell=document.querySelector("#monitor-snake-wrap iframe");',
  ' shell.focus();shell.contentWindow.focus();window.dispatchEvent(new MessageEvent("message",{origin:location.origin,source:shell.contentWindow,data:{type:"snake-close"}}));await sleep(10);"mail".split("").forEach(routedKey);var afterExitSearch=window.__monitorDockSearch();S("dosExitFocus",{open:mon.classList.contains("show-snake"),frame:!!document.querySelector("#monitor-snake-wrap iframe"),focus:document.activeElement&&(document.activeElement.id||document.activeElement.tagName),search:afterExitSearch});routedKey("Escape");',
  ' window.__openMonitorApp("snake");await sleep(20);document.getElementById("snake-launch-panel").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(20);var game=document.querySelector("#monitor-snake-wrap iframe");window.dispatchEvent(new MessageEvent("message",{origin:location.origin,source:game.contentWindow,data:{type:"snake-exit"}}));await sleep(20);S("gameExit",{open:mon.classList.contains("show-snake"),frame:!!document.querySelector("#monitor-snake-wrap iframe"),state:window.__snakeState(),running:window.__monitorAppRunning("snake")});',
  ' mon.classList.add("show-caps");window.__openMonitorApp("nibbles");await sleep(20);document.getElementById("snake-launch-panel").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(20);var beforeRestart=document.querySelector("#monitor-snake-wrap iframe");window.__restartMonitorSnake();await sleep(20);var restartPanel=document.getElementById("snake-launch-panel");S("restartPrompt",{panel:!!restartPanel,setup:window.__snakeState().setupOpen,frame:!!document.querySelector("#monitor-snake-wrap iframe")});restartPanel.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(20);var second=document.querySelector("#monitor-snake-wrap iframe");S("restart",{open:mon.classList.contains("show-snake"),fresh:!!second&&second!==beforeRestart,mode:window.__snakeState().mode});',
  ' window.__killMonitorSnake();await sleep(20);S("killGag",{active:mon.classList.contains("death-snake")});await sleep(2200);S("kill",{open:mon.classList.contains("show-snake"),frame:!!document.querySelector("#monitor-snake-wrap iframe"),state:window.__snakeState()});',
  '}',
  '})();</script>'
].join("\n");

var DPAD_LAYOUT_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[]};window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),host=document.getElementById("monitor-html-overlay"),dpadHost=document.getElementById("monitor-snake-dpad"),dpad=document.getElementById("monitor-snake-controls");window.__goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");document.getElementById("hunt-fullscreen-area").scrollIntoView({block:"center"});await sleep(20);window.__monitorZoomIn();await sleep(40);dpadHost.style.setProperty("display","inline","important");dpad.style.setProperty("display","grid","important");window.__openMonitorApp("snake");await sleep(35);document.getElementById("snake-launch-panel").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));await sleep(50);var frame=document.querySelector("#monitor-snake-wrap iframe");window.dispatchEvent(new MessageEvent("message",{origin:location.origin,source:frame.contentWindow,data:{type:"snake-ready"}}));await sleep(50);var state=window.__monitorHtmlOverlayState(),buttonEl=dpad.querySelector("[data-snake-key=ArrowUp]"),button=buttonEl.getBoundingClientRect(),pad=dpad.getBoundingClientRect(),overlay=host.getBoundingClientRect(),hit=document.elementFromPoint(button.left+button.width/2,button.top+button.height/2),before=window.__snakeState().relayedKeys;if(hit){hit.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:722,pointerType:"touch",button:0}));hit.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:722,pointerType:"touch",button:0}));}report.layout={active:state.active,roots:state.roots,physical:state.geometry&&state.geometry.physicalRuntime,scale:state.geometry&&state.geometry.scale,overlay:!!dpad.closest("#monitor-html-overlay"),buttonX:button.x,buttonY:button.y,buttonWidth:button.width,buttonHeight:button.height,innerWidth:innerWidth,innerHeight:innerHeight,padWidth:pad.width,hostWidth:overlay.width,hostClass:host.className,hitTag:hit&&hit.tagName,hitClass:hit&&hit.getAttribute&&hit.getAttribute("class"),hitGutter:hit&&hit.getAttribute&&hit.getAttribute("data-runtime-gutter"),hitPointerEvents:hit&&getComputedStyle(hit).pointerEvents,hitKey:hit&&hit.getAttribute&&hit.getAttribute("data-snake-key"),relayed:window.__snakeState().relayedKeys-before};}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html snake DOS app:");
var expectedExeHash = "ca601f2eb07727b5100017d524df6f0698751b89ee2ea1eb8a1df08c955bedc2";
var sourceExe = fs.readFileSync("dos/source/nibbles.exe");
var bundle = fs.readFileSync("dos/snake.jsdos");
var playerHtml = fs.readFileSync("dos/player.html", "utf8");
var bundledExe = childProcess.execFileSync("unzip", ["-p", "dos/snake.jsdos", "NIBBLES.EXE"]);
var bundleEntries = childProcess.execFileSync("unzip", ["-Z1", "dos/snake.jsdos"], { encoding: "utf8" }).trim().split(/\r?\n/);
check(sourceExe.length === 59476 && crypto.createHash("sha256").update(sourceExe).digest("hex") === expectedExeHash,
  "the pinned owner-supplied four-player Nibbles executable has the exact expected size and hash");
check(bundledExe.equals(sourceExe) && crypto.createHash("sha256").update(bundledExe).digest("hex") === expectedExeHash,
  "the DOS bundle embeds that executable byte-for-byte");
check(crypto.createHash("sha256").update(bundle).digest("hex") === "7a0a1895d2f9c865b5f502f94426dad1040c1a2b9d92c95ff42af097b6736735",
  "the complete DOS bundle matches its documented pinned hash");
check(JSON.stringify(bundleEntries) === JSON.stringify([".jsdos/dosbox.conf", "NIBBLES.EXE", "README.TXT"]),
  "the DOS bundle contains only its configuration, historical executable, and provenance note", bundleEntries);
check(/mode = params\.get\("mode"\) === "dos" \? "dos" : "nibbles"/.test(playerHtml) &&
  /fetch\("snake\.jsdos\?v=7a0a1895", \{ cache: "no-store" \}\)/.test(playerHtml) &&
  /emulators\.bundleUpdateConfig\(new Uint8Array\(bundle\),/.test(playerHtml) &&
  /initFs: bundle/.test(playerHtml) &&
  /\.concat\(mode === "nibbles" \? \["NIBBLES\.EXE", "exit"\] : \[\]\)/.test(playerHtml) &&
  /atPrompt = mode === "dos"/.test(playerHtml) && /atPrompt = true/.test(playerHtml) &&
  /command === "exit"/.test(playerHtml) &&
  /command === "nibbles" \|\| command === "nibbles\.exe"/.test(playerHtml) &&
  /tell\("snake-close"\)/.test(playerHtml) && /tell\("snake-exit"\)/.test(playerHtml) &&
  /event\.data\.type === "snake-key" && mode === "nibbles"/.test(playerHtml) &&
  /Object\.defineProperty\(forwarded, "keyCode"/.test(playerHtml) &&
  /window\.dispatchEvent\(forwarded\)/.test(playerHtml) &&
  playerHtml.indexOf('window.addEventListener("keydown", handleExitKeys, true)') < playerHtml.indexOf("player = Dos("),
  "one pinned bundle boots either a bare DOS prompt or a one-shot Nibbles session");
var r = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var dpadLayout = lib.runPageSync("rsvp.html", DPAD_LAYOUT_HARNESS, 1800, { patchRaf: true });
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(!s.grid.calendar && s.grid.tattooAt === 7 &&
  JSON.stringify(s.grid.games) === JSON.stringify(["life", "classics", "snake", "shoot"]) &&
  JSON.stringify(s.grid.bottom) === JSON.stringify(["code", "console", "python", "linux"]),
  "desktop order removes Calendar, moves Tattoo, puts Life before Classics, and places snake before shoot", s.grid);
check(s.calendar.control && s.calendar.opened, "the explicit desktop date/countdown control opens Calendar", s.calendar);
check(s.aliases.snake.match === "snake" && s.aliases.nibbles.match === "snake" && s.aliases.dos.match === "snake",
  "search resolves snake, nibbles, and dos to the same app", s.aliases);
check(s.theme.tile === "rgb(23, 45, 150)" && s.theme.dos === "#ffd84a",
  "the Nibbles launcher is yellow on DOS blue", s.theme);
check(s.setup.panel && s.setup.native && !s.setup.backdrop && s.setup.players && s.setup.speed && s.setup.visible && s.setup.state.setupOpen && s.setup.state.open,
  "opening Nibbles presents its player and speed setup inside the monitor app", s.setup);
check(s.open.open && s.open.frame && /[?&]mode=nibbles(?:&|$)/.test(s.open.src || "") && s.open.state.mode === "nibbles",
  "opening snake lazily creates its self-hosted DOS iframe", s.open);
check(s.identity.count === 1 && s.identity.sameFrame && s.identity.sameWindow &&
    s.identity.mounts === 0 && s.identity.restores === 0,
  "Nibbles ready-state changes preserve its one iframe and browsing context", s.identity);
check(s.surface.physical && Math.abs(s.surface.frameWidth - s.surface.overlayWidth) < 1 &&
    Math.abs(s.surface.frameHeight - s.surface.overlayHeight) < 1 &&
    s.surface.closeTransform === "translate(76.0,29.3) scale(0.8)" &&
    s.surface.resetAbsent,
  "the DOS frame fills the monitor and Close uses standard app-control geometry", s.surface);
check(!s.open.innerFs && s.open.allow === "autoplay",
  "Nibbles relies on the shared monitor fullscreen instead of an iframe-level control", s.open);
check(s.gutters.count === 2 && s.gutters.opened && s.gutters.menu && s.gutters.ownsFocus,
  "both 4:3 side gutters open a keyboard-owning monitor context menu", s.gutters);
check(s.ownership.focus && s.ownership.prevented && s.ownership.relayed === 1 &&
  s.ownership.last.eventType === "keydown" && s.ownership.last.key === "ArrowUp" && s.ownership.last.keyCode === 38,
  "a first Nibbles control lost to parent chrome is relayed once while the iframe reclaims focus", s.ownership);
check(s.blockedOwners.relayed === 1,
  "Nibbles does not reclaim keys from a modal overlay or another foreground monitor app", s.blockedOwners);
var dpadChecks = s.dpad && {
  count: s.dpad.count === 4,
  keys: JSON.stringify(s.dpad.keys) === JSON.stringify(["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"]),
  right: s.dpad.hostX === 344,
  before: s.dpad.before.relayedKeys === 1,
  held: s.dpad.held.relayedKeys === 2 && s.dpad.held.lastRelayedKey.eventType === "keydown" && s.dpad.held.lastRelayedKey.key === "ArrowUp" && s.dpad.held.lastRelayedKey.keyCode === 38,
  released: s.dpad.released.relayedKeys === 3 && s.dpad.released.lastRelayedKey.eventType === "keyup" && s.dpad.released.lastRelayedKey.key === "ArrowUp",
  prevented: s.dpad.downPrevented && s.dpad.upPrevented
};
check(dpadChecks && dpadChecks.count && dpadChecks.keys &&
  dpadChecks.right && dpadChecks.before && dpadChecks.held && dpadChecks.released &&
  dpadChecks.prevented,
  "the right-side touch D-pad relays an ArrowUp press and release through snake-key", {state:s.dpad,checks:dpadChecks});
check(dpadLayout && dpadLayout.errors.length === 0 && dpadLayout.layout.active &&
    dpadLayout.layout.physical && dpadLayout.layout.overlay &&
    dpadLayout.layout.roots.indexOf("snake-dpad-host") !== -1 && dpadLayout.layout.scale > 1 &&
    Math.abs(dpadLayout.layout.buttonWidth / dpadLayout.layout.scale - 6) < 0.15 &&
    dpadLayout.layout.hitKey === "ArrowUp" && dpadLayout.layout.relayed === 2,
  "the promoted mobile Nibbles D-pad retains its authored size and receives real hit-tested input", dpadLayout);
check(s.menu.kill && !s.menu.restart && JSON.stringify(s.menu.labels) === JSON.stringify(["Kill app"]),
  "the open DOS surface exposes only the enabled Kill app action", s.menu);
check(!s.close.open && !s.close.frame && !s.close.running && !s.close.host && !s.close.dot &&
    s.close.menuOpened && !s.close.kill,
  "normal close destroys the DOS session and clears its running task", s.close);
check(s.reopenGame.setup && s.reopenGame.open && !s.reopenGame.frame && s.reopenGame.panel,
  "clicking Snake again returns to its setup panel", s.reopenGame);
check(s.reopenStarted.fresh && s.reopenStarted.mode === "nibbles",
  "submitting setup after close creates a fresh Nibbles machine", s.reopenStarted);
check(s.dos.fresh && /[?&]mode=dos(?:&|$)/.test(s.dos.src || "") && s.dos.mode === "dos",
  "opening dos after closing Nibbles creates a bare-shell machine", s.dos);
check(s.reopenDos.fresh && s.reopenDos.mode === "dos", "the dos command creates a fresh shell after close", s.reopenDos);
check(!s.dosExitFocus.open && !s.dosExitFocus.frame &&
  s.dosExitFocus.focus === "monitor-desktop-dock" &&
  s.dosExitFocus.search.query === "mail" && s.dosExitFocus.search.match === "mail",
  "DOS EXIT returns focus to the monitor and the next keys search without a click", s.dosExitFocus);
check(!s.gameExit.open && !s.gameExit.frame && s.gameExit.state.state === "cold" && !s.gameExit.running,
  "exiting a Nibbles launch tears it down and returns to the monitor", s.gameExit);
check(s.restartPrompt.panel && s.restartPrompt.setup && s.restartPrompt.frame &&
  s.restart.open && s.restart.fresh && s.restart.mode === "nibbles",
  "Restart returns through setup before replacing the game with a fresh machine",
  { prompt: s.restartPrompt, restart: s.restart });
check(s.killGag.active, "Kill starts the self-devouring snake farewell", s.killGag);
check(/id="monitor-snake-farewell"[\s\S]*?fill="#172d96"[\s\S]*?id="monitor-snake-kill-body"[\s\S]*?stroke="#ffd84a"/.test(fs.readFileSync("rsvp.html", "utf8")),
  "the Kill farewell uses the launcher's yellow snake on DOS blue");
check(!s.kill.open && !s.kill.frame && s.kill.state.state === "cold", "Kill tears the DOS machine down", s.kill);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

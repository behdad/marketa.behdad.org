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
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.goToStage("office");if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(40);',
  ' var ids=[].slice.call(document.querySelectorAll("#monitor-desktop-dock .dock-app")).map(function(el){return el.id.replace("monitor-dock-","");});',
  ' S("grid",{ids:ids,calendar:!!document.getElementById("monitor-dock-calendar"),tattooAt:ids.indexOf("tattoo"),games:ids.slice(8,12),bottom:ids.slice(12,16)});',
  ' var dateControl=document.getElementById("monitor-desk-calendar");if(dateControl)dateControl.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(20);S("calendar",{control:!!dateControl,opened:mon.classList.contains("show-calendar"),phoneTile:!!document.querySelector(".phone-app-tile[data-app=\\"calendar\\"], [data-phone-app=\\"calendar\\"]")});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");',
  ' function search(q){q.split("").forEach(key);var state=window.__monitorDockSearch();key("Escape");return state;}S("aliases",{snake:search("snake"),nibbles:search("nibbles"),dos:search("dos")});',
  ' window.__openMonitorApp("snake");await sleep(30);var first=document.querySelector("#monitor-snake-wrap iframe");S("open",{open:mon.classList.contains("show-snake"),frame:!!first,src:first&&first.getAttribute("src"),state:window.__snakeState()});var gutters=document.querySelectorAll("#monitor-snake .monitor-runtime-side-hit");gutters[0].dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:250,clientY:250}));S("gutters",{count:gutters.length,menu:!!document.querySelector(".mon-ctx")});document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  ' var oldReady=window.__snakeRunning;window.__snakeRunning=function(){return true;};mon.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:500,clientY:500}));var menu=document.querySelector(".mon-ctx"),labels=menu?[].slice.call(menu.querySelectorAll("button")).map(function(b){return b.textContent.trim();}):[];S("menu",{labels:labels,kill:!!(menu&&menu.querySelector(".ctx-kill:not(:disabled)")),restart:!!(menu&&menu.querySelector(".ctx-restart:not(:disabled)"))});document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));window.__snakeRunning=oldReady;',
  ' window.__closeMonitorSnake();await sleep(10);S("close",{open:mon.classList.contains("show-snake"),retained:document.querySelector("#monitor-snake-wrap iframe")===first});',
  ' mon.classList.add("show-caps");window.__restartMonitorSnake();await sleep(20);var second=document.querySelector("#monitor-snake-wrap iframe");S("restart",{open:mon.classList.contains("show-snake"),fresh:!!second&&second!==first});',
  ' window.__killMonitorSnake();await sleep(20);S("killGag",{active:mon.classList.contains("death-snake")});await sleep(2200);S("kill",{open:mon.classList.contains("show-snake"),frame:!!document.querySelector("#monitor-snake-wrap iframe"),state:window.__snakeState()});',
  '}',
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
var bundledExe = childProcess.execFileSync("unzip", ["-p", "dos/snake.jsdos", "NIBBLES.EXE"]);
var bundleEntries = childProcess.execFileSync("unzip", ["-Z1", "dos/snake.jsdos"], { encoding: "utf8" }).trim().split(/\r?\n/);
check(sourceExe.length === 59476 && crypto.createHash("sha256").update(sourceExe).digest("hex") === expectedExeHash,
  "the pinned owner-supplied four-player Nibbles executable has the exact expected size and hash");
check(bundledExe.equals(sourceExe) && crypto.createHash("sha256").update(bundledExe).digest("hex") === expectedExeHash,
  "the DOS bundle embeds that executable byte-for-byte");
check(crypto.createHash("sha256").update(bundle).digest("hex") === "15f35bb40c086fda6b76ae87d7b14839c0f029f061e643a5a6a4e68494598408",
  "the complete DOS bundle matches its documented pinned hash");
check(JSON.stringify(bundleEntries) === JSON.stringify([".jsdos/dosbox.conf", "NIBBLES.EXE", "README.TXT"]),
  "the DOS bundle contains only its configuration, historical executable, and provenance note", bundleEntries);
var r = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(!s.grid.calendar && s.grid.tattooAt === 7 &&
  JSON.stringify(s.grid.games) === JSON.stringify(["life", "classics", "snake", "shoot"]) &&
  JSON.stringify(s.grid.bottom) === JSON.stringify(["code", "console", "python", "linux"]),
  "desktop order removes Calendar, moves Tattoo, puts Life before Classics, and places snake before shoot", s.grid);
check(s.calendar.control && s.calendar.opened, "the explicit desktop date/countdown control opens Calendar", s.calendar);
check(s.aliases.snake.match === "snake" && s.aliases.nibbles.match === "snake" && s.aliases.dos.match === "snake",
  "search resolves snake, nibbles, and dos to the same app", s.aliases);
check(s.open.open && s.open.frame && /^dos\/player\.html\?lang=/.test(s.open.src || ""),
  "opening snake lazily creates its self-hosted DOS iframe", s.open);
check(s.gutters.count === 2 && s.gutters.menu,
  "both 4:3 side gutters belong to the monitor context-menu surface", s.gutters);
check(s.menu.kill && s.menu.restart && s.menu.labels.length === 2,
  "the open DOS surface exposes enabled Kill and Restart actions", s.menu);
check(!s.close.open && s.close.retained, "normal close pauses and retains the DOS machine", s.close);
check(s.restart.open && s.restart.fresh, "Restart replaces it with a fresh DOS machine", s.restart);
check(s.killGag.active, "Kill starts the self-devouring snake farewell", s.killGag);
check(!s.kill.open && !s.kill.frame && s.kill.state.state === "cold", "Kill tears the DOS machine down", s.kill);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

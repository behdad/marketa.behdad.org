#!/usr/bin/env node
"use strict";

var lib = require("./lib");

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
  ' var centered=[].slice.call(document.querySelectorAll("#monitor-desktop-dock .desk-bar-text")).filter(function(el){return el.getAttribute("x")==="316";})[0];if(centered)centered.parentNode.dispatchEvent(new MouseEvent("click",{bubbles:true}));await sleep(20);S("calendar",{opened:mon.classList.contains("show-calendar"),phoneTile:!!document.querySelector(".phone-app-tile[data-app=\\"calendar\\"], [data-phone-app=\\"calendar\\"]")});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");',
  ' function search(q){q.split("").forEach(key);var state=window.__monitorDockSearch();key("Escape");return state;}S("aliases",{snakes:search("snakes"),nibbles:search("nibbles"),dos:search("dos")});',
  ' window.__openMonitorApp("snakes");await sleep(30);var first=document.querySelector("#monitor-snakes-wrap iframe");S("open",{open:mon.classList.contains("show-snakes"),frame:!!first,src:first&&first.getAttribute("src"),state:window.__snakesState()});',
  ' var oldReady=window.__snakesRunning;window.__snakesRunning=function(){return true;};mon.dispatchEvent(new MouseEvent("contextmenu",{bubbles:true,cancelable:true,clientX:500,clientY:500}));var menu=document.querySelector(".mon-ctx"),labels=menu?[].slice.call(menu.querySelectorAll("button")).map(function(b){return b.textContent.trim();}):[];S("menu",{labels:labels,kill:!!(menu&&menu.querySelector(".ctx-kill:not(:disabled)")),restart:!!(menu&&menu.querySelector(".ctx-restart:not(:disabled)"))});document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));window.__snakesRunning=oldReady;',
  ' window.__closeMonitorSnakes();await sleep(10);S("close",{open:mon.classList.contains("show-snakes"),retained:document.querySelector("#monitor-snakes-wrap iframe")===first});',
  ' mon.classList.add("show-caps");window.__restartMonitorSnakes();await sleep(20);var second=document.querySelector("#monitor-snakes-wrap iframe");S("restart",{open:mon.classList.contains("show-snakes"),fresh:!!second&&second!==first});',
  ' window.__killMonitorSnakes();await sleep(10);S("kill",{open:mon.classList.contains("show-snakes"),frame:!!document.querySelector("#monitor-snakes-wrap iframe"),state:window.__snakesState()});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html snakes DOS app:");
var r = lib.runPageSync("rsvp.html", HARNESS, 2200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(!s.grid.calendar && s.grid.tattooAt === 7 &&
  JSON.stringify(s.grid.games) === JSON.stringify(["life", "mines", "shoot", "snakes"]) &&
  JSON.stringify(s.grid.bottom) === JSON.stringify(["code", "console", "python", "linux"]),
  "desktop order removes Calendar, moves Tattoo, puts Life before Mines, and gives snakes the games-row final slot", s.grid);
check(s.calendar.opened, "the centered desktop date/countdown still opens Calendar", s.calendar);
check(s.aliases.snakes.match === "snakes" && s.aliases.nibbles.match === "snakes" && s.aliases.dos.match === "snakes",
  "search resolves snakes, nibbles, and dos to the same app", s.aliases);
check(s.open.open && s.open.frame && /^dos\/player\.html\?lang=/.test(s.open.src || ""),
  "opening snakes lazily creates its self-hosted DOS iframe", s.open);
check(s.menu.kill && s.menu.restart && s.menu.labels.length === 2,
  "the open DOS surface exposes enabled Kill and Restart actions", s.menu);
check(!s.close.open && s.close.retained, "normal close pauses and retains the DOS machine", s.close);
check(s.restart.open && s.restart.fresh, "Restart replaces it with a fresh DOS machine", s.restart);
check(!s.kill.open && !s.kill.frame && s.kill.state.state === "cold", "Kill tears the DOS machine down", s.kill);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

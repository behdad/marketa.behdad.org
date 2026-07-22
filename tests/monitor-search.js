#!/usr/bin/env node
// Ephemeral type-to-open search on the zoomed monitor desktop.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' window.goToStage("office");await sleep(100);var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(40);',
  ' key("c");key("h");await sleep(20);var state=window.__monitorDockSearch();S("match",{state:state,highlight:document.querySelector(".dock-app.search-match")&&document.querySelector(".dock-app.search-match").id,visible:document.getElementById("monitor-dock-search").classList.contains("active")});',
  ' key("Escape");S("escape",{state:window.__monitorDockSearch(),searching:document.querySelector(".dock-grid").classList.contains("searching")});',
  ' ["c","o","n"].forEach(key);key("Enter");await sleep(30);S("launch",{console:mon.classList.contains("show-console"),state:window.__monitorDockSearch()});',
  ' key("x");key("y");S("appGuard",window.__monitorDockSearch());if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' setLang("cs");await sleep(20);S("beforeCzech",{zoom:window.__monitorZoomed&&window.__monitorZoomed(),classes:mon.getAttribute("class"),visibility:getComputedStyle(document.getElementById("monitor-desktop-dock")).visibility});["k","o","n"].forEach(key);S("czech",window.__monitorDockSearch());document.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));S("pointer",window.__monitorDockSearch());',
  ' if(window.__openPhoneModal)window.__openPhoneModal(true);await sleep(30);["x","y"].forEach(key);S("phoneGuard",window.__monitorDockSearch());if(window.phone)window.phone(false);',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor desktop search:");
var r = lib.runPageSync("rsvp.html", HARNESS, 2500, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.match.state.query === "ch" && s.match.state.match === "chat" && s.match.highlight === "monitor-dock-chat" && s.match.visible, "typing highlights the deterministic best localized app match", s.match);
check(!s.escape.state.query && !s.escape.state.match && !s.escape.searching, "Escape clears search before leaving the monitor", s.escape);
check(s.launch.console && !s.launch.state.query, "Enter opens the matched app and clears search", s.launch);
check(!s.appGuard.query, "typing inside an open monitor app does not start desktop search", s.appGuard);
check(s.czech.query === "kon" && s.czech.match === "console", "matching includes the current localized app label", { state: s.czech, before: s.beforeCzech });
check(!s.pointer.query && !s.pointer.match, "a pointer gesture dismisses the transient search", s.pointer);
check(!s.phoneGuard.query, "the phone never inherits monitor search", s.phoneGuard);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

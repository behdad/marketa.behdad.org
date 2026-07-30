#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k,opts){opts=opts||{};document.dispatchEvent(new KeyboardEvent("keydown",Object.assign({key:k,bubbles:true,cancelable:true},opts)));}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' key("?");await sleep(20);S("outside",{shortcuts:!!document.querySelector(".kbd-backdrop"),directory:window.__monitorAppDirectory&&window.__monitorAppDirectory().open});key("Escape");await sleep(260);',
  ' window.goToStage("office");await sleep(100);var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");key("?");await sleep(20);S("unzoomed",{shortcuts:!!document.querySelector(".kbd-backdrop"),directory:window.__monitorAppDirectory().open});key("Escape");await sleep(260);',
  ' window.__monitorZoomIn();await sleep(40);key("?");await sleep(20);var dir=document.getElementById("monitor-app-directory"),items=[].slice.call(dir.querySelectorAll(".monitor-app-directory-item")),expected=window.__chatMonitorApps().map(function(a){return a.id;}).filter(function(id){return id!=="quake";});S("open",{open:window.__monitorAppDirectory().open,shortcuts:!!document.querySelector(".kbd-backdrop"),title:document.getElementById("monitor-app-directory-title").textContent,aria:dir.getAttribute("aria-label"),ids:items.map(function(x){return x.getAttribute("data-app-id");}),expected:expected,active:document.activeElement&&document.activeElement.getAttribute("data-app-id"),searchOnly:["calendar","pacman","system"].every(function(id){return dir.querySelector("[data-app-id="+id+"]").classList.contains("search-only");}),toolbar:["weather","clock"].every(function(id){return !!dir.querySelector("[data-app-id="+id+"]");}),aliases:!dir.querySelector("[data-app-id=quake]")&&!!dir.querySelector("[data-app-id=quake3]")});',
  ' key("c");S("modal",{search:window.__monitorDockSearch(),open:window.__monitorAppDirectory().open});key("ArrowRight");S("arrow",document.activeElement&&document.activeElement.getAttribute("data-app-id"));key("Tab");S("tab",document.activeElement&&document.activeElement.getAttribute("data-app-id"));key("Escape");S("escape",window.__monitorAppDirectory().open);',
  ' key("?");await sleep(10);var weather=dir.querySelector("[data-app-id=weather]");weather.dispatchEvent(new PointerEvent("pointerdown",{pointerType:"touch",bubbles:true,cancelable:true}));weather.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);S("touch",{open:window.__monitorAppDirectory().open,weather:mon.classList.contains("show-weather")});window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' setLang("cs");key("?");await sleep(20);S("czech",{title:document.getElementById("monitor-app-directory-title").textContent,aria:dir.getAttribute("aria-label"),calendar:dir.querySelector("[data-app-id=calendar] text").textContent});',
  ' var calendar=dir.querySelector("[data-app-id=calendar]");calendar.focus();key("Enter");await sleep(30);S("keyboard",{open:window.__monitorAppDirectory().open,calendar:mon.classList.contains("show-calendar")});',
  ' key("?");await sleep(20);S("appContext",{shortcuts:!!document.querySelector(".kbd-backdrop"),directory:window.__monitorAppDirectory().open});key("Escape");',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor app directory:");
var r = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.outside.shortcuts && !s.outside.directory && s.unzoomed.shortcuts && !s.unzoomed.directory, "outside the zoomed bare desktop, ? keeps the shortcut card", { outside: s.outside, unzoomed: s.unzoomed });
check(s.open.open && !s.open.shortcuts && s.open.title === "All apps" && s.open.aria === "Monitor app directory", "the zoomed bare desktop routes ? to the app directory", s.open);
check(JSON.stringify(s.open.ids) === JSON.stringify(s.open.expected), "the directory exactly follows the searchable desktop and toolbar catalogs", { ids: s.open.ids, expected: s.open.expected });
check(s.open.active === s.open.ids[0] && s.open.searchOnly && s.open.toolbar && s.open.aliases, "the first entry is focused, search/toolbar apps are present, and aliases are not duplicated", s.open);
check(s.modal.open && !s.modal.search.query && s.arrow === s.open.ids[1] && s.tab === s.open.ids[2], "the modal holds letter shortcuts and supports arrow/Tab navigation", { modal: s.modal, arrow: s.arrow, tab: s.tab });
check(!s.escape, "Escape closes the directory");
check(!s.touch.open && s.touch.weather, "a touch/pointer activation launches a toolbar-only app", s.touch);
check(s.czech.title === "Všechny aplikace" && s.czech.aria === "Seznam aplikací monitoru" && s.czech.calendar === "kalendář", "directory chrome and catalog labels follow Czech", s.czech);
check(!s.keyboard.open && s.keyboard.calendar, "Enter launches the focused search-only app", s.keyboard);
check(s.appContext.shortcuts && !s.appContext.directory, "inside an open monitor app, ? keeps the shortcut card", s.appContext);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

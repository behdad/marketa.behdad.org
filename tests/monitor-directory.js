#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function key(k,target){(target||document).dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'function results(){return [].slice.call(document.querySelectorAll(".desk-search-result")).map(function(row){return {id:row.getAttribute("data-app-id"),label:row.querySelector(".desk-search-result-text").textContent,selected:row.classList.contains("selected")};});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(100);var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(40);',
  ' key("?");await sleep(20);S("question",{shortcuts:!!document.querySelector(".kbd-backdrop"),search:window.__monitorDockSearch()});key("Escape");await sleep(260);',
  ' var searchButton=document.getElementById("monitor-desk-search-button"),input=document.querySelector(".dock-search-keyboard");searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);var rows=results(),state=window.__monitorDockSearch(),expected=window.__chatMonitorApps().map(function(app){return {id:app.id,label:app.label.toLocaleLowerCase()};}).sort(function(a,b){return a.label.localeCompare(b.label)||a.id.localeCompare(b.id);});S("empty",{state:state,rows:rows,expected:expected,focused:document.activeElement===input,searchOnly:["calendar","pacman","system"].every(function(id){return rows.some(function(row){return row.id===id;});}),toolbar:["weather","clock"].every(function(id){return rows.some(function(row){return row.id===id;});}),quake:rows.filter(function(row){return row.id==="quake";})[0],lower:rows.every(function(row){return row.label===row.label.toLocaleLowerCase();})});',
  ' key("Enter",input);S("neutralEnter",{state:window.__monitorDockSearch(),apps:window.__monitorRunningApps()});key("ArrowDown",input);var picked=results().filter(function(row){return row.selected;})[0];S("arrow",{picked:picked,state:window.__monitorDockSearch()});key("Enter",input);await sleep(30);S("keyboardLaunch",{picked:picked&&picked.id,running:picked&&window.__monitorAppRunning(picked.id),open:window.__monitorDockSearch().open});window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(10);var weather=document.querySelector(".desk-search-result[data-app-id=weather]");weather.dispatchEvent(new PointerEvent("pointerdown",{pointerType:"touch",bubbles:true,cancelable:true}));weather.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);S("touch",{weather:mon.classList.contains("show-weather"),open:window.__monitorDockSearch().open});window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));input.value="p";input.dispatchEvent(new Event("input",{bubbles:true}));var pRows=results();S("filter",{state:window.__monitorDockSearch(),rows:pRows,highlights:[].slice.call(document.querySelectorAll(".dock-app.search-match")).map(function(el){return el.id.replace("monitor-dock-","");})});input.value="pac";input.dispatchEvent(new Event("input",{bubbles:true}));S("single",{state:window.__monitorDockSearch(),rows:results()});key("Enter",input);await sleep(30);S("singleLaunch",{pacman:mon.classList.contains("show-pacman"),open:window.__monitorDockSearch().open});window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' window.__setLang("cs");searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);var csRows=results();S("czech",{rows:csRows,sorted:csRows.map(function(row){return row.label;}).slice().sort(function(a,b){return a.localeCompare(b);}),weather:csRows.filter(function(row){return row.id==="weather";})[0]&&csRows.filter(function(row){return row.id==="weather";})[0].label});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html monitor search directory:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4200, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.question.shortcuts && !s.question.search.open, "? remains exclusively the keyboard-shortcuts control", s.question);
check(s.empty.state.open && !s.empty.state.query && s.empty.state.selected === -1 && s.empty.focused, "opening Search with an empty query shows a neutral directory", s.empty);
check(JSON.stringify(s.empty.rows.map(function (row) { return { id: row.id, label: row.label }; })) === JSON.stringify(s.empty.expected), "the empty directory is the complete sorted canonical app catalog", { rows: s.empty.rows, expected: s.empty.expected });
check(s.empty.quake && s.empty.quake.label === "quake", "the canonical Quake search entry uses its concise alias", s.empty.quake);
check(s.empty.searchOnly && s.empty.toolbar && s.empty.lower && s.empty.rows.every(function (row) { return !row.selected; }), "search-only and toolbar apps appear with lowercase names and no auto-selection", s.empty);
check(s.neutralEnter.state.open && s.neutralEnter.state.selected === -1 && s.neutralEnter.apps.length === 0, "Enter does not launch the first app from a neutral multi-match directory", s.neutralEnter);
check(s.arrow.picked && s.arrow.state.selected === 0 && s.keyboardLaunch.running && !s.keyboardLaunch.open, "arrow selection plus Enter launches the chosen app", { arrow: s.arrow, launch: s.keyboardLaunch });
check(s.touch.weather && !s.touch.open, "pointer/touch activation launches a toolbar-only directory app", s.touch);
check(JSON.stringify(s.filter.rows.map(function (row) { return row.id; })) === JSON.stringify(["pacman", "photobooth", "prince", "python"]) && s.filter.state.selected === -1, "typing prefix-filters the directory without selecting its first result", s.filter);
check(["photobooth", "python"].every(function (id) { return s.filter.highlights.indexOf(id) >= 0; }), "all matching tiled apps are highlighted", s.filter);
check(s.single.state.match === "pacman" && s.single.rows.length === 0 && s.singleLaunch.pacman && !s.singleLaunch.open, "one match has no redundant dropdown and Enter launches it", { single: s.single, launch: s.singleLaunch });
check(JSON.stringify(s.czech.rows.map(function (row) { return row.label; })) === JSON.stringify(s.czech.sorted) && s.czech.weather === "počasí", "the empty directory rebuilds in sorted localized Czech", s.czech);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

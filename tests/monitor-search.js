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
  ' var searchButton=document.getElementById("monitor-desk-search-button"),touchInput=document.querySelector(".dock-search-keyboard"),searchClose=document.getElementById("monitor-dock-search-close");var armedRect=touchInput.getBoundingClientRect(),armedStyle=getComputedStyle(touchInput);S("touchArmed",{armed:touchInput.classList.contains("armed"),active:touchInput.classList.contains("active"),pointer:armedStyle.pointerEvents,cursor:armedStyle.cursor,opacity:parseFloat(armedStyle.opacity),host:touchInput.parentElement&&touchInput.parentElement.id,inputBox:[armedRect.width,armedRect.height]});var touchDown=new PointerEvent("pointerdown",{pointerType:"touch",bubbles:true,cancelable:true});touchInput.dispatchEvent(touchDown);touchInput.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);var searchSurface=document.getElementById("monitor-dock-search"),inputRect=touchInput.getBoundingClientRect(),activeStyle=getComputedStyle(touchInput);S("touchOpen",{state:window.__monitorDockSearch(),prompt:touchInput.placeholder,svgHidden:getComputedStyle(document.getElementById("monitor-dock-search-text")).visibility,focused:document.activeElement===touchInput,defaultKept:!touchDown.defaultPrevented,pointer:getComputedStyle(searchSurface).pointerEvents,cursor:activeStyle.cursor,opacity:parseFloat(activeStyle.opacity),color:activeStyle.color,inputBox:[inputRect.width,inputRect.height]});touchInput.dispatchEvent(new PointerEvent("pointerdown",{pointerType:"touch",bubbles:true,cancelable:true}));S("touchRetains",{state:window.__monitorDockSearch(),focused:document.activeElement===touchInput});touchInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));await sleep(20);S("focusedEscape",{state:window.__monitorDockSearch(),focused:document.activeElement===touchInput,zoomed:window.__monitorZoomed()});touchInput.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);touchInput.value="wea";touchInput.dispatchEvent(new Event("input",{bubbles:true}));S("touchWeather",window.__monitorDockSearch());touchInput.value="clo";touchInput.dispatchEvent(new Event("input",{bubbles:true}));S("touchClock",window.__monitorDockSearch());touchInput.value="pac";touchInput.dispatchEvent(new Event("input",{bubbles:true}));S("touchMatch",window.__monitorDockSearch());S("singleDropdown",document.querySelectorAll(".desk-search-result").length);touchInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));await sleep(30);S("touchLaunch",{pacman:mon.classList.contains("show-pacman"),state:window.__monitorDockSearch()});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' key("c");S("cPrefix",{state:window.__monitorDockSearch(),labels:Array.from(document.querySelectorAll(".desk-search-result-text")).map(function(n){return n.textContent;})});key("h");await sleep(20);var state=window.__monitorDockSearch(),suffix=document.querySelector(".desk-search-completion");S("match",{state:state,text:document.getElementById("monitor-dock-search-text").textContent,suffix:suffix&&suffix.textContent,highlights:Array.from(document.querySelectorAll(".dock-app.search-match")).map(function(n){return n.id;}),results:Array.from(document.querySelectorAll(".desk-search-result")).map(function(n){return n.getAttribute("data-app-id");}),selected:document.querySelectorAll(".desk-search-result.selected").length,visible:document.getElementById("monitor-dock-search").classList.contains("active")});',
  ' key("Enter");S("multiEnter",window.__monitorDockSearch());key("Escape");S("escape",{state:window.__monitorDockSearch(),searching:document.querySelector(".dock-grid").classList.contains("searching")});',
  ' key("c");key("a");var calendarResult=document.querySelector(".desk-search-result[data-app-id=calendar]");if(calendarResult)calendarResult.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);S("resultClick",{calendar:mon.classList.contains("show-calendar"),state:window.__monitorDockSearch()});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' key("p");S("prefixOnly",{state:window.__monitorDockSearch(),labels:Array.from(document.querySelectorAll(".desk-search-result-text")).map(function(n){return n.textContent;})});key("Escape");',
  ' searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));searchClose.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));S("closeButton",window.__monitorDockSearch());searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));touchInput.value="";touchInput.dispatchEvent(new KeyboardEvent("keydown",{key:"Backspace",bubbles:true,cancelable:true}));S("emptyBackspace",{state:window.__monitorDockSearch(),focused:document.activeElement===touchInput});',
  ' ["c","o","n"].forEach(key);key("Enter");await sleep(30);S("launch",{console:mon.classList.contains("show-console"),state:window.__monitorDockSearch()});',
  ' key("x");key("y");S("appGuard",window.__monitorDockSearch());if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");await sleep(20);',
  ' setLang("cs");await sleep(20);S("beforeCzech",{zoom:window.__monitorZoomed&&window.__monitorZoomed(),classes:mon.getAttribute("class"),visibility:getComputedStyle(document.getElementById("monitor-desktop-dock")).visibility});searchButton.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));searchButton.dispatchEvent(new MouseEvent("click",{bubbles:true}));S("czechOpen",{prompt:document.getElementById("monitor-dock-search-text").textContent});document.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));["k","o","n"].forEach(key);S("czech",window.__monitorDockSearch());document.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true}));S("pointer",window.__monitorDockSearch());',
  ' setLang("en");["m","i","n"].forEach(key);key("Tab");await sleep(30);S("tabLaunch",{mines:mon.classList.contains("show-mines"),state:window.__monitorDockSearch()});if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();mon.classList.add("show-caps");',
  ' if(window.__openPhoneModal)window.__openPhoneModal(true);await sleep(30);["x","y"].forEach(key);S("phoneGuard",window.__monitorDockSearch());if(window.phone)window.phone.set(false);await sleep(30);',
  ' var oldFamily=window.__openMonitorApp("family"),oldPhone=window.__openMonitorApp("phone"),callId=window.__openMonitorApp("call");await sleep(30);S("callName",{tile:!!document.getElementById("monitor-dock-call"),oldPhoneTile:!!document.getElementById("monitor-dock-phone"),oldFamilyTile:!!document.getElementById("monitor-dock-family"),label:document.querySelector("#monitor-dock-call .dock-label").textContent,oldRejected:Array.isArray(oldFamily)&&Array.isArray(oldPhone),opened:mon.classList.contains("show-family"),result:callId});',
  ' if(window.__closeTopMonitorApp)window.__closeTopMonitorApp();var oldPocket=window.phone.open("phone"),newPocket=window.phone.open("call");await sleep(40);var ph=document.querySelector(".phone-shell");S("pocketCall",{oldRejected:Array.isArray(oldPocket),opened:!!document.querySelector(".phone-backdrop.show")&&ph&&ph.classList.contains("pm-app"),title:ph&&ph.querySelector(".pah-title")&&ph.querySelector(".pah-title").textContent,result:newPocket});if(window.phone)window.phone.set(false);',
  ' await sleep(260);window.goToStage("office");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(30);mon.classList.remove("show-caps");mon.classList.add("show-saver");key("c");await sleep(20);S("saverSearch",{state:window.__monitorDockSearch(),awake:mon.classList.contains("show-caps")&&!mon.classList.contains("show-saver"),phone:window.phone&&window.phone.status()});key("Escape");',
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
check(s.touchArmed.armed && !s.touchArmed.active && s.touchArmed.pointer === "auto" && s.touchArmed.cursor === "pointer" && s.touchArmed.opacity > 0 && s.touchArmed.host === "hunt-fullscreen-area" && s.touchArmed.inputBox[0] >= 20 && s.touchArmed.inputBox[1] >= 16, "a painted native input is armed over the search icon with its pointer cursor", s.touchArmed);
check(s.touchOpen.state.open && !s.touchOpen.state.query && s.touchOpen.prompt === "search apps…" && s.touchOpen.svgHidden === "hidden" && s.touchOpen.focused && s.touchOpen.defaultKept && s.touchOpen.pointer === "auto" && s.touchOpen.cursor === "text" && s.touchOpen.opacity === 1 && s.touchOpen.color !== "rgba(0, 0, 0, 0)" && s.touchOpen.inputBox[0] >= 32 && s.touchOpen.inputBox[1] >= 16, "a direct native-input touch opens a visibly editable finder without cancelling Android keyboard activation", s.touchOpen);
check(s.touchRetains.state.open && s.touchRetains.focused, "touching the visible search surface keeps input focus instead of falling through to an app", s.touchRetains);
check(!s.focusedEscape.state.open && !s.focusedEscape.state.query && !s.focusedEscape.focused && s.focusedEscape.zoomed, "Escape dismisses a focused search without dismissing monitor zoom", s.focusedEscape);
check(s.touchWeather.match === "weather" && s.touchClock.match === "clock", "touch search keeps toolbar-only Weather and Clock discoverable", { weather: s.touchWeather, clock: s.touchClock });
check(s.touchMatch.open && s.touchMatch.query === "pac" && s.touchMatch.match === "pacman", "touch input finds a search-only app", s.touchMatch);
check(s.singleDropdown === 0, "a single match does not render a redundant dropdown", s.singleDropdown);
check(s.touchLaunch.pacman && !s.touchLaunch.state.open && !s.touchLaunch.state.query, "touch search launches Pac-Man and clears itself", s.touchLaunch);
check(s.cPrefix.state.matches.indexOf("solitaire") < 0 && s.cPrefix.labels.indexOf("cards") < 0, "removed card aliases do not pollute the c-prefix results", s.cPrefix);
check(s.match.state.query === "ch" && !s.match.state.match && s.match.state.selected === -1 && s.match.text === "ch" && !s.match.suffix && s.match.selected === 0 && s.match.visible, "multiple matches show only typed characters and begin without a selected row", s.match);
check(["chat", "chrome"].every(function (id) { return s.match.state.matches.indexOf(id) >= 0 && s.match.results.indexOf(id) >= 0; }) && ["monitor-dock-chat", "monitor-dock-chrome"].every(function (id) { return s.match.highlights.indexOf(id) >= 0; }), "every match appears in the dropdown and every matching desktop icon is highlighted", s.match);
check(s.multiEnter.open && s.multiEnter.query === "ch" && !s.multiEnter.match, "Enter does not auto-open the first of several matches", s.multiEnter);
check(!s.escape.state.query && !s.escape.state.match && !s.escape.searching, "Escape clears search before leaving the monitor", s.escape);
check(s.resultClick.calendar && !s.resultClick.state.open && !s.resultClick.state.query, "a non-primary dropdown match is clickable and clears search after launch", s.resultClick);
check(JSON.stringify(s.prefixOnly.state.matches) === JSON.stringify(["pacman", "photobooth", "prince", "python"]) && JSON.stringify(s.prefixOnly.labels) === JSON.stringify(["pacman", "photobooth", "prince", "python"]), "a single letter alphabetizes the displayed lowercase search names without removed Solitaire aliases", s.prefixOnly);
check(!s.closeButton.open && !s.closeButton.query, "the finder's visible close control dismisses search", s.closeButton);
check(s.emptyBackspace.state.open && !s.emptyBackspace.state.query && s.emptyBackspace.focused, "Backspace leaves an already-empty monitor search open and focused", s.emptyBackspace);
check(s.launch.console && !s.launch.state.query, "Enter opens the matched app and clears search", s.launch);
check(!s.appGuard.query, "typing inside an open monitor app does not start desktop search", s.appGuard);
check(s.czechOpen.prompt === "hledat aplikace…", "the visible touch search prompt follows Czech", s.czechOpen);
check(s.czech.query === "kon" && s.czech.match === "console", "matching includes the current localized app label", { state: s.czech, before: s.beforeCzech });
check(!s.pointer.query && !s.pointer.match, "a pointer gesture dismisses the transient search", s.pointer);
check(s.tabLaunch.mines && !s.tabLaunch.state.query, "Tab accepts the highlighted app just like Enter", s.tabLaunch);
check(!s.phoneGuard.query, "the phone never inherits monitor search", s.phoneGuard);
check(s.callName.tile && !s.callName.oldPhoneTile && !s.callName.oldFamilyTile && s.callName.label === "call" && s.callName.oldRejected && s.callName.opened && /call/.test(s.callName.result || ""), "the monitor calling app and command are named call, without phone/family aliases", s.callName);
check(s.pocketCall.oldRejected && s.pocketCall.opened && s.pocketCall.title === "contacts" && /call/.test(s.pocketCall.result || ""), "the pocket calling app and phone command are also named call", s.pocketCall);
check(s.saverSearch.state.query === "c" && s.saverSearch.awake && !s.saverSearch.phone, "typing wakes the screensaver into search without leaking c to the cellphone shortcut", s.saverSearch);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

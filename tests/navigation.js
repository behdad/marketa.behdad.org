#!/usr/bin/env node
// Adjacent-room arrows must reflect destination accessibility immediately,
// regardless of whether a puzzle solve or a cheat opened the room.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function nav(id){var el=document.getElementById(id),cs=getComputedStyle(el);return{locked:el.classList.contains("locked"),disabled:el.disabled,background:cs.backgroundColor,wine:getComputedStyle(document.documentElement).getPropertyValue("--wine").trim()};}',
  'function dotState(){return [].slice.call(document.querySelectorAll(".hunt-dot")).map(function(d){return{locked:d.classList.contains("locked"),active:d.classList.contains("active")};});}',
  'function hoverRule(){var sheets=[].slice.call(document.styleSheets);for(var i=0;i<sheets.length;i++){var rules;try{rules=sheets[i].cssRules||[];}catch(e){continue;}for(var j=0;j<rules.length;j++){if(rules[j].selectorText===".hunt-nav:hover:not(:disabled):not(.locked)")return rules[j].style.background;}}return null;}',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' S("initial",nav("hunt-next"));S("dots_initial",dotState());',
  ' window.__unlockSolvedRoom("garden");S("solved",nav("hunt-next"));S("dots_solved",dotState());',
  ' window.__goToStage("garden");S("garden_prev",nav("hunt-prev"));S("garden_next_locked",nav("hunt-next"));',
  ' document.querySelectorAll(".hunt-dot")[4].dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));S("dot_cheat",{room:window.__currentStageName,max:window.__maxUnlocked()});window.__goToStage("garden");S("cheat_next",nav("hunt-next"));S("hover_rule",hoverRule());S("dots_unlocked",dotState());',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function isWine(state) { return state && state.background === "rgb(142, 58, 74)"; }

console.log("rsvp.html room navigation state:");
var r = lib.runPageSync("rsvp.html", HARNESS, 1800, { patchRaf: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.initial.locked && !isWine(s.initial), "the unopened next room starts pale and locked", s.initial);
check(s.dots_initial.length === 5 && s.dots_initial[0].active && !s.dots_initial[0].locked && s.dots_initial.slice(1).every(function(d){return d.locked && !d.active;}), "room dots expose the accurate initial lock and selection state", s.dots_initial);
check(!s.solved.locked && isWine(s.solved), "a normal solve immediately makes its arrow burgundy", s.solved);
check(!s.dots_solved[1].locked && s.dots_solved.slice(2).every(function(d){return d.locked;}), "unlocking a room immediately updates the dots' lock state", s.dots_solved);
check(!s.garden_prev.disabled && isWine(s.garden_prev), "the arrow back to an accessible room is burgundy", s.garden_prev);
check(s.garden_next_locked.locked && !isWine(s.garden_next_locked), "the still-locked forward room remains pale", s.garden_next_locked);
check(s.dot_cheat.room === "balcony" && s.dot_cheat.max === 4, "double-clicking a locked dot still unlocks through it and jumps there", s.dot_cheat);
check(!s.cheat_next.locked && isWine(s.cheat_next), "the all-rooms cheat immediately makes the forward arrow burgundy", s.cheat_next);
check(s.dots_unlocked.every(function(d){return !d.locked;}), "the all-rooms cheat exposes every dot as enabled", s.dots_unlocked);
check(s.hover_rule === "var(--wine)", "hover cannot leave an accessible arrow looking locked", s.hover_rule);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

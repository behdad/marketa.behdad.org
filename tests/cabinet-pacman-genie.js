#!/usr/bin/env node
// The kitchen critter owns the room Hack-Man discovery; the garden genie owns wishes only.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function key(name,shift){var event=new KeyboardEvent("keydown",{key:name,shiftKey:!!shift,bubbles:true,cancelable:true});document.dispatchEvent(event);return event.defaultPrevented;}',
  'var report={errors:[],steps:{},debug:{}};function S(name,value){report.steps[name]=!!value;}',
  'async function summon(){document.getElementById("garden-lamp").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(50);document.getElementById("garden-genie").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);var modals=document.querySelectorAll(".genie-wish-backdrop");return modals[modals.length-1];}',
  'async function run(){',
  'var originalRandom=Math.random;Math.random=function(){return .9;};',
  'window.__goToStage("kitchen");window.__resetPacmanUnlock();',
  'window.__restoreKitchenCabinetSurprise({kind:"ghost",cabinet:0});var ghost=document.getElementById("kitchen-cabinet-ghost");ghost.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(80);var ghostState=window.__pacmanPresentation();',
  'S("ghost_pacman",window.__pacmanUnlocked()&&ghostState.mode==="room"&&ghostState.room==="kitchen"&&ghost.classList.contains("wobbling"));',
  'window.__closeMonitorPacman();window.__resetPacmanUnlock();',
  'window.__restoreKitchenCabinetSurprise({kind:"goat",cabinet:2});var goat=document.getElementById("kitchen-cabinet-goat");goat.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(80);var goatState=window.__pacmanPresentation();',
  'S("goat_pacman",window.__pacmanUnlocked()&&goatState.mode==="room"&&goatState.room==="kitchen"&&goat.classList.contains("wobbling"));',
  'window.__closeMonitorPacman();window.__resetPacmanUnlock();Math.random=originalRandom;',
  'window.__goToStage("garden");var heartsBefore=document.querySelectorAll(".heart-particle").length,modal=await summon();',
  'S("genie_only",!!modal&&!window.__pacmanUnlocked()&&window.__pacmanPresentation().mode===null&&document.activeElement===modal.querySelector("[data-wish=love]"));',
  'modal.querySelector("[data-wish=love]").click();S("love",modal.getAttribute("data-wish-result")==="love"&&modal.querySelector(".genie-wish-result").textContent==="Already granted."&&document.querySelectorAll(".heart-particle").length>=heartsBefore+12);',
  'await sleep(1250);modal=await summon();modal.querySelector("[data-wish=money]").click();S("money",modal.getAttribute("data-wish-result")==="money"&&modal.querySelector(".genie-wish-result").textContent==="Approved for one brief shower."&&window.__genieWishState().coinShowers===1);',
  'await sleep(1250);modal=await summon();var close=modal.querySelector(".pb-dlg-x"),more=modal.querySelector("[data-wish=more]");more.focus();var tabForward=key("Tab",false)&&document.activeElement===close;close.focus();var tabBack=key("Tab",true)&&document.activeElement===more;more.click();S("more",modal.getAttribute("data-wish-result")==="more"&&modal.querySelector(".genie-wish-result").textContent==="Nice try.");S("focus_trap",tabForward&&tabBack);',
  'await sleep(1250);window.__setLang("cs");modal=await summon();S("czech",modal.querySelector(".genie-wish-title").textContent==="Něco si přej."&&modal.querySelector("[data-wish=love]").textContent==="Láska"&&modal.querySelector("[data-wish=money]").textContent==="Peníze"&&modal.querySelector("[data-wish=more]").textContent==="Další přání");',
  'var escapePrevented=key("Escape");await sleep(30);S("escape",escapePrevented&&!window.__genieWishState().open&&document.activeElement===document.getElementById("garden-lamp"));',
  'modal=await summon();modal.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(20);S("backdrop",!window.__genieWishState().open);',
  'modal=await summon();window.__goToStage("kitchen");S("room_leave",!window.__genieWishState().open);',
  'window.__setLang("en");',
  '}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness:"+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},380);});',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function check(value, message, detail) {
  if (value) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message);
    if (detail) console.log("      " + JSON.stringify(detail));
  }
}

console.log("loft-day.html cabinet Pac-Man + genie wishes:");
var result = lib.runPageSync("loft-day.html", HARNESS, 11000, { patchRaf: true, forceMotion: true, seedRandom: true });
if (!result) check(false, "harness reported");
else {
  check(result.steps.ghost_pacman, "the active cabinet ghost wobbles and opens retained room Hack-Man", result);
  check(result.steps.goat_pacman, "the active cabinet goat wobbles and opens retained room Hack-Man", result);
  check(result.steps.genie_only, "the genie opens wishes without unlocking or presenting Pac-Man", result);
  check(result.steps.love, "Love answers Already granted and showers hearts", result);
  check(result.steps.money, "Money answers dryly and starts a bounded coin rain", result);
  check(result.steps.more, "More wishes answers Nice try and retreats", result);
  check(result.steps.focus_trap, "Tab and Shift-Tab stay inside the wish modal", result);
  check(result.steps.czech, "the wish title and all choices switch to Czech", result);
  check(result.steps.escape, "Escape dismisses and returns focus to the lamp", result);
  check(result.steps.backdrop, "a backdrop click dismisses without leaking through", result);
  check(result.steps.room_leave, "leaving the garden tears down the wish modal", result);
  check(result.errors.length === 0, "no uncaught JS errors", result.errors);
}

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
var genieStart = source.indexOf("function enterGenie(e)");
var genieEnd = source.indexOf("if (lamp) {", genieStart);
var genieBody = source.slice(genieStart, genieEnd);
check(genieStart >= 0 && genieEnd > genieStart && !/__unlockPacman|__openRoomPacman/.test(genieBody),
  "the genie activation path contains no Pac-Man action");

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

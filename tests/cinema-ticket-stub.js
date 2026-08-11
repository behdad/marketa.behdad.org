#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var INTERACTION_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:window.__errs,steps:{}};function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function visible(el){return getComputedStyle(el).display!=="none";}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  'window.__endAttract();window.__unlockAllRooms();window.__goToStage("cuddly");await sleep(80);',
  'var ticket=document.getElementById("cuddly-cinema-ticket"),intact=ticket.querySelector(".cinema-ticket-intact"),used=ticket.querySelector(".cinema-ticket-used");',
  'report.steps.before={room:window.__currentStageName,seen:window.__roomSeen("cinema"),usedClass:ticket.classList.contains("ticket-used"),intact:visible(intact),used:visible(used),tabindex:ticket.getAttribute("tabindex")};',
  'ticket.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(520);',
  'var saved=JSON.parse(localStorage.getItem("loftCheckpoint:v1")||"null");report.steps.opened={room:window.__currentStageName,open:window.__cinemaRoomState().open,seen:window.__roomSeen("cinema"),usedClass:ticket.classList.contains("ticket-used"),intact:visible(intact),used:visible(used),savedSeen:!!(saved&&saved.progress&&saved.progress.seenRooms&&saved.progress.seenRooms.indexOf("cinema")!==-1)};',
  'window.__closeCinemaRoom();await sleep(500);var stub=ticket.querySelector(".cinema-ticket-left-stub").getBoundingClientRect(),main=ticket.querySelector(".cinema-ticket-main").getBoundingClientRect(),hit=ticket.querySelector(":scope > .cinema-ticket-wobble > rect");report.steps.pair={stub:[stub.left,stub.top,stub.right,stub.bottom],main:[main.left,main.top,main.right,main.bottom],separated:stub.right<main.left,hit:[hit.getAttribute("x"),hit.getAttribute("y"),hit.getAttribute("width"),hit.getAttribute("height")]};',
  'await window.__resetLoftGame("instant");report.steps.reset={room:window.__currentStageName,seen:window.__roomSeen("cinema"),usedClass:ticket.classList.contains("ticket-used"),intact:visible(intact),used:visible(used),entry:!!document.getElementById("click-me-overlay")};',
  '}catch(error){window.__errs.push("harness: "+String(error&&error.stack||error));}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var RECOVERY_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var saved={version:1,savedAt:Date.now()-120000,progress:{room:"cuddly",lowerRoom:"cinema",maxUnlocked:4,solvedRooms:["kitchen","garden"],seenRooms:["kitchen","garden","cuddly","cinema"],phase2:false,party:false,daylight:true,bbq:false},puzzle:{},phone:null,album:null,systems:{}};',
  'if(!sessionStorage.getItem("cinema-ticket-stub-seeded")){sessionStorage.setItem("cinema-ticket-stub-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
  'window.addEventListener("load",function(){setTimeout(function(){var gate=document.getElementById("loft-recovery-gate");if(gate)gate.querySelector(".loft-recovery-btn.primary").click();setTimeout(function(){var ticket=document.getElementById("cuddly-cinema-ticket");document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,gate:!!gate,room:window.__currentStageName,open:window.__cinemaRoomState().open,seen:window.__roomSeen("cinema"),usedClass:ticket.classList.contains("ticket-used"),intact:getComputedStyle(ticket.querySelector(".cinema-ticket-intact")).display!=="none",used:getComputedStyle(ticket.querySelector(".cinema-ticket-used")).display!=="none"});},280);},100);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html Cinema ticket stub:");
var interaction = lib.runPageSync("loft-day.html", INTERACTION_HARNESS, 4200, { patchRaf: true });
check(interaction && interaction.errors.length === 0,
  "real ticket activation and reset have no uncaught errors", interaction && interaction.errors);
check(interaction && interaction.steps.before && interaction.steps.before.room === "cuddly" &&
    !interaction.steps.before.seen && !interaction.steps.before.usedClass &&
    interaction.steps.before.intact && !interaction.steps.before.used && interaction.steps.before.tabindex === "-1",
  "the untouched ticket keeps its original intact, out-of-Tab-order portal state", interaction && interaction.steps.before);
check(interaction && interaction.steps.opened && interaction.steps.opened.open &&
    interaction.steps.opened.room === "cuddly" && interaction.steps.opened.seen &&
    interaction.steps.opened.usedClass && !interaction.steps.opened.intact &&
    interaction.steps.opened.used && interaction.steps.opened.savedSeen,
  "a real ticket click enters Cinema and derives the used art from checkpointed room visitation",
  interaction && interaction.steps.opened);
check(interaction && interaction.steps.pair && interaction.steps.pair.separated &&
    interaction.steps.pair.hit.join(",") === "-4,-4,34,21",
  "the torn left stub and main ticket remain separate inside the unchanged hit area",
  interaction && interaction.steps.pair);
check(interaction && interaction.steps.reset && interaction.steps.reset.room === "kitchen" &&
    !interaction.steps.reset.seen && !interaction.steps.reset.usedClass &&
    interaction.steps.reset.intact && !interaction.steps.reset.used && interaction.steps.reset.entry,
  "Reset clears the visit-derived tear and returns to the fresh CLICK ME entry",
  interaction && interaction.steps.reset);

var recovery = lib.runPageSync("loft-day.html", RECOVERY_HARNESS, 1900, { patchRaf: true });
check(recovery && recovery.errors.length === 0, "Cinema recovery has no uncaught errors", recovery && recovery.errors);
check(recovery && recovery.gate && recovery.room === "cuddly" && recovery.open &&
    recovery.seen && recovery.usedClass && !recovery.intact && recovery.used,
  "Continue restores the used-ticket pair from the canonical seen-room checkpoint", recovery);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/id="cuddly-cinema-ticket" class="hunt-hit lower-room-marker" transform="translate\(620 70\)" tabindex="-1"[\s\S]*?<rect x="-4" y="-4" width="34" height="21" rx="4" fill="transparent"\/>/.test(source),
  "the ticket keeps its portal identity, placement, and generous hit rectangle");
check(/class="cinema-ticket-left-stub"[\s\S]*?class="cinema-ticket-main"/.test(source) &&
    /#cuddly-cinema-ticket\.ticket-used \.cinema-ticket-intact\{display:none\}/.test(source),
  "the used drawing retains both authored halves and hides only the intact drawing");
check(/function syncCinemaTicketUsed\(\)[\s\S]*?window\.__roomSeen\("cinema"\)[\s\S]*?ticket\.classList\.toggle\("ticket-used", used\)/.test(source) &&
    /function setSeenRooms\(names\)[\s\S]*?window\.__syncCinemaTicketUsed\(\)/.test(source),
  "ticket appearance stays derived from the canonical room-visit owner");

console.log("");
if (failures) {
  console.log(failures + " Cinema ticket-stub assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Cinema ticket-stub assertions passed.");

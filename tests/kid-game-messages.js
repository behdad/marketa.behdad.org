#!/usr/bin/env node
"use strict";

// Irene's existing computer umbrella stays broad; only the two child-plausible games
// outside it gain their own daylight/party invitations and exact typed launch routes.
var fs = require("fs");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'var report={errors:[],steps:{}};function S(key,value){report.steps[key]=value;}',
  'function knowledge(id){return window.__chatMessagesKnowledge().filter(function(row){return row.id===id;})[0]||null;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push(String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var ids=["hannah_tetris","irene_tictactoe"];window.__maxUnlocked=function(){return 4;};',
  ' window.__secondRound=false;S("phase_one",ids.map(function(id){return {id:id,accepted:window.__deliverPhoneMessage(id),received:window.__phoneMessageReceived(id)};}));',
  ' window.__secondRound=true;var first=ids.map(function(id){return window.__deliverPhoneMessage(id);});var duplicate=ids.map(function(id){return window.__deliverPhoneMessage(id);});',
  ' var en=ids.map(knowledge);window.__setLang("cs");var cs=ids.map(knowledge);window.__setLang("en");',
  ' S("delivery",{first:first,duplicate:duplicate,thread:window.__phoneMessageThread(),en:en,cs:cs});',
  ' S("party_roster",window.__partyTextChoices().filter(function(id){return ids.indexOf(id)!==-1;}));',
  ' S("availability",{ttt:window.loft.api.describe("bedroom.tic-tac-toe.start",{}).value.availability,tetris:window.loft.api.describe("minigame.start",{game:"block-party"}).value.availability});',
  ' window.__runMsgAction("irene_tictactoe");await sleep(1050);S("ttt_route",{room:window.loft.api.query("room.current").value,state:window.__bedroomTicTacToeState()});',
  ' await window.loft.api.perform("bedroom.tic-tac-toe.dismiss",{},{source:"test-cleanup"});',
  ' window.__runMsgAction("hannah_tetris");await sleep(1050);S("tetris_route",{room:window.loft.api.query("room.current").value,state:window.__balconyTetrisState()});',
  ' window.__stopBalconyTetris();',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html kid game invitations:");
var source = fs.readFileSync("rsvp.html", "utf8");
var cuePool = (source.match(/var CUE_POOL = \[([^;]+)\]/) || [])[1] || "";
var dayPool = (source.match(/var DAY_POOL = \[([^;]+)\]/) || [])[1] || "";
var result = lib.runPageSync("rsvp.html", HARNESS, 4600, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.phase_one.every(function(row){return !row.accepted&&!row.received;}), "both invitations wait until the Morning solve is over", s.phase_one);
check(s.delivery.first.every(Boolean) && s.delivery.duplicate.every(function(value){return !value;}) &&
  ["hannah_tetris","irene_tictactoe"].every(function(id){return s.delivery.thread.filter(function(row){return row===id;}).length===1;}),
  "each invitation delivers at most once even when both drips share it", s.delivery);
check(s.delivery.en[0].sender === "Hannah" && s.delivery.en[0].text === "can I play Tetris?" &&
  s.delivery.en[1].sender === "Irene" && s.delivery.en[1].text === "can I play tic-tac-toe?" &&
  s.delivery.cs[0].text === "můžu si zahrát Tetris?" && s.delivery.cs[1].text === "můžu si zahrát piškvorky?",
  "the concise Hannah/Irene roster and English/Czech copy stay paired", {en:s.delivery.en,cs:s.delivery.cs});
check(["hannah_tetris","irene_tictactoe"].every(function(id){return cuePool.indexOf('"'+id+'"')!==-1&&dayPool.indexOf('"'+id+'"')!==-1;}) &&
  s.party_roster.join(",") === "hannah_tetris,irene_tictactoe",
  "both games remain discoverable through the attended daylight and Party drips", {day:dayPool,party:s.party_roster});
check(s.availability.ttt.available && s.availability.tetris.available,
  "both exact typed game actions are available after the solve", s.availability);
check(s.ttt_route.room === "bedroom" && (s.ttt_route.state.phase === "player" || s.ttt_route.state.phase === "computer"),
  "Irene's arrow opens the Bedroom and starts tic-tac-toe", s.ttt_route);
check(s.tetris_route.room === "balcony" && s.tetris_route.state.active,
  "Hannah's arrow opens the Balcony and starts Block Party/Tetris", s.tetris_route);
check(/irene_games:\s*\{[^}]*msg_irene_games_body[^}]*act:\s*"games"/.test(source),
  "Irene's existing computer-game umbrella remains the single Office invitation");

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

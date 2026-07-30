#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function pane(cell){return document.querySelector(".bedroom-ttt-pane[data-cell=\\""+cell+"\\"]");}',
  'function dbl(cell){pane(cell).dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));}',
  'function click(cell){pane(cell).dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'function touch(cell){pane(cell).dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerType:"touch"}));}',
  'function key(value){document.dispatchEvent(new KeyboardEvent("keydown",{key:value,bubbles:true,cancelable:true}));}',
  'function cap(){return {text:document.getElementById("hunt-caption").textContent,key:window.__captionKey&&window.__captionKey(),flash:window.__flashCaptionState&&window.__flashCaptionState()};}',
  'var lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],order=[4,0,2,6,8,1,3,5,7];',
  'function result(board){for(var i=0;i<lines.length;i++){var l=lines[i];if(board[l[0]]&&board[l[0]]===board[l[1]]&&board[l[0]]===board[l[2]])return board[l[0]];}return board.every(Boolean)?"draw":null;}',
  'function score(board,turn,depth){var r=result(board);if(r)return r==="O"?10-depth:r==="X"?depth-10:0;var best=turn==="O"?-Infinity:Infinity;order.forEach(function(cell){if(board[cell])return;board[cell]=turn;var n=score(board,turn==="O"?"X":"O",depth+1);board[cell]=null;best=turn==="O"?Math.max(best,n):Math.min(best,n);});return best;}',
  'function bestX(board){var cell=-1,best=Infinity;order.forEach(function(n){if(board[n])return;board[n]="X";var value=score(board,"O",0);board[n]=null;if(value<best){best=value;cell=n;}});return cell;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});var room=document.getElementById("bedroom-room"),strip=document.getElementById("loft-game-strip"),leakedDblclicks=0;room.addEventListener("dblclick",function(){leakedDblclicks++;});room.style.transition="none";strip.style.transition="none";window.goToStage("office");window.__openBedroomRoom();await sleep(80);',
  ' key("Enter");report.steps.enterStart=window.__bedroomTicTacToeState();key("Enter");report.steps.enterAgain=window.__bedroomTicTacToeState();await sleep(400);report.steps.enterReply=window.__bedroomTicTacToeState();window.__closeBedroomRoom();await sleep(760);window.goToStage("office");window.__openBedroomRoom();await sleep(80);',
  ' dbl(0);report.steps.chosen=window.__bedroomTicTacToeState();report.steps.isolated={leaked:leakedDblclicks,other:Array.from(room.querySelectorAll(".bedroom-prop:not(#bedroom-stained-glass)")).map(function(prop){return prop.getAttribute("class");})};await sleep(400);report.steps.reply=window.__bedroomTicTacToeState();',
  ' click(1);report.steps.turn=window.__bedroomTicTacToeState();report.steps.paneFlash=document.getElementById("bedroom-stained-glass").classList.contains("glinting");await sleep(400);report.steps.secondReply=window.__bedroomTicTacToeState();click(3);await sleep(400);report.steps.win=window.__bedroomTicTacToeState();var winLine=document.querySelector(".bedroom-ttt-win-o");report.steps.winLine=winLine&&{x1:winLine.getAttribute("x1"),y1:winLine.getAttribute("y1"),x2:winLine.getAttribute("x2"),y2:winLine.getAttribute("y2"),shadow:!!document.querySelector(".bedroom-ttt-win-shadow")};report.steps.winCaption=cap();',
  ' dbl(8);report.steps.restart=window.__bedroomTicTacToeState();report.steps.restartCaption=cap();await sleep(400);var guard=0;while(window.__bedroomTicTacToeState().phase!=="done"&&guard++<6){var state=window.__bedroomTicTacToeState();if(state.phase==="player"){click(bestX(state.board));}await sleep(400);}report.steps.draw=window.__bedroomTicTacToeState();report.steps.drawCaption=cap();',
  ' setLang("cs");report.steps.cs={glass:document.getElementById("bedroom-stained-glass").getAttribute("aria-label"),caption:cap()};setLang("en");',
  ' touch(5);await sleep(35);touch(5);report.steps.touch=window.__bedroomTicTacToeState();window.__closeBedroomRoom();report.steps.close=window.__bedroomTicTacToeState();await sleep(450);report.steps.closeSettled=window.__bedroomTicTacToeState();',
  ' await sleep(300);window.goToStage("office");window.__openBedroomRoom();await sleep(80);dbl(7);report.steps.resetStart=window.__bedroomTicTacToeState();window.__runTransientResetHooks();report.steps.loftReset={room:window.__bedroomRoomState(),game:window.__bedroomTicTacToeState()};await sleep(450);report.steps.loftResetSettled=window.__bedroomTicTacToeState();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
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
function count(board, mark) {
  return (board || []).filter(function (cell) { return cell === mark; }).length;
}

console.log("rsvp.html bedroom stained-glass tic-tac-toe:");
var result = lib.runPageSync("rsvp.html", HARNESS, 16000, { patchRaf: true });
if (!result) {
  console.log("  ✗ harness produced no report");
  process.exit(1);
}
var s = result.steps || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.enterStart && s.enterStart.phase === "computer" && s.enterStart.aiPending &&
  count(s.enterStart.board, "X") === 0 && count(s.enterStart.board, "O") === 0 &&
  s.enterAgain && s.enterAgain.phase === "computer" && s.enterAgain.aiPending &&
  count(s.enterAgain.board, "X") === 0 && count(s.enterAgain.board, "O") === 0 &&
  s.enterReply && s.enterReply.phase === "player" &&
  count(s.enterReply.board, "X") === 0 && count(s.enterReply.board, "O") === 1,
  "Bedroom Enter starts once with the computer's opening move",
  { start: s.enterStart, again: s.enterAgain, reply: s.enterReply });
check(s.chosen && s.chosen.board[0] === "X" && count(s.chosen.board, "X") === 1 &&
  count(s.chosen.board, "O") === 0 && s.chosen.phase === "computer" && s.chosen.aiPending,
  "double-click starts with X in the visitor's chosen pane", s.chosen);
check(s.isolated && s.isolated.leaked === 0 &&
  s.isolated.other.every(function (classes) {
    return !/\b(?:off|swinging|tidied|made|open)\b/.test(classes);
  }),
  "the pane double-click is contained to the glass and leaves other Bedroom props alone",
  s.isolated);
check(s.reply && count(s.reply.board, "X") === 1 && count(s.reply.board, "O") === 1 &&
  s.reply.phase === "player" && !s.reply.aiPending,
  "the strategic computer replies after its short delay", s.reply);
check(s.turn && count(s.turn.board, "X") === 2 && count(s.turn.board, "O") === 1 &&
  s.turn.phase === "computer" && s.secondReply &&
  count(s.secondReply.board, "X") === 2 && count(s.secondReply.board, "O") === 2 &&
  s.secondReply.phase === "player",
  "ordinary pane clicks alternate visitor and computer turns", { turn: s.turn, reply: s.secondReply });
check(s.paneFlash === false,
  "tic-tac-toe pane clicks do not trigger the stained-glass flash overlay");
check(s.win && s.win.phase === "done" && s.win.winner === "O" &&
  s.win.line.length === 3 && !s.win.aiPending,
  "a completed winning line settles the game and its timer", s.win);
check(s.winLine && s.winLine.shadow &&
  (s.winLine.x1 !== s.winLine.x2 || s.winLine.y1 !== s.winLine.y2),
  "the computer's winning cells receive a visible light-blue line with a contrast underlay",
  s.winLine);
check(s.win && s.win.resultCaptionKey === "bedroom_glass_loss" &&
  s.winCaption && s.winCaption.key === "bedroom_glass_loss" &&
  /window won/i.test(s.winCaption.text) && s.winCaption.flash &&
  s.winCaption.flash.owner === "bedroom-ttt",
  "a computer win is announced visibly as the visitor's loss", s.winCaption);
check(s.restart && s.restart.board[8] === "X" && count(s.restart.board, "X") === 1 &&
  count(s.restart.board, "O") === 0 && s.restart.phase === "computer",
  "double-click after completion clears the board and honors the new start pane", s.restart);
check(s.restartCaption && !s.restartCaption.flash &&
  s.restartCaption.key !== "bedroom_glass_loss" &&
  !/window won/i.test(s.restartCaption.text),
  "restart clears the completed game's visible result", s.restartCaption);
check(s.draw && s.draw.phase === "done" && s.draw.winner === "draw" &&
  count(s.draw.board, "X") === 5 && count(s.draw.board, "O") === 4,
  "optimal visitor play reaches and detects a draw", s.draw);
check(s.draw && s.draw.resultCaptionKey === "bedroom_glass_draw" &&
  s.drawCaption && s.drawCaption.key === "bedroom_glass_draw" &&
  /^Draw\b/.test(s.drawCaption.text),
  "a draw is announced distinctly in the visible room caption", s.drawCaption);
check(s.cs && /Remíza/.test(s.cs.glass) && s.cs.caption &&
  /Remíza/.test(s.cs.caption.text) && s.cs.caption.key === "bedroom_glass_draw",
  "the live board and visible result caption switch to Czech", s.cs);
check(s.touch && s.touch.board[5] === "X" && count(s.touch.board, "X") === 1 &&
  count(s.touch.board, "O") === 0 && s.touch.phase === "computer" && s.touch.aiPending,
  "touch double-tap restarts in the tapped pane", s.touch);
check(s.close && s.close.phase === "idle" && count(s.close.board, "X") === 0 &&
  count(s.close.board, "O") === 0 && !s.close.aiPending &&
  s.closeSettled && count(s.closeSettled.board, "O") === 0,
  "closing Bedroom clears the board and cancels a pending computer move",
  { close: s.close, settled: s.closeSettled });
check(s.resetStart && s.resetStart.board[7] === "X" && s.resetStart.aiPending &&
  s.loftReset && !s.loftReset.room.open && s.loftReset.game.phase === "idle" &&
  !s.loftReset.game.aiPending && s.loftResetSettled &&
  count(s.loftResetSettled.board, "O") === 0,
  "the loft transient reset also settles the game with no late move",
  { start: s.resetStart, reset: s.loftReset, settled: s.loftResetSettled });

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check((source.match(/class="bedroom-ttt-pane"/g) || []).length === 9 &&
  /id="bedroom-stained-glass" class="bedroom-prop" transform="translate\(0 -18\)"/.test(source) &&
  /<rect x="10" y="62" width="145" height="145"/.test(source),
  "the complete square board moves up exactly 18 units without changing local geometry");
check(!/M29 63L66 102L29 153L66 197|M135 63L105 102L135 153L105 197/.test(source),
  "the former decorative diagonal mullions stay removed");
check(/winner === "X"\) return "bedroom_glass_win"/.test(source) &&
  /winner === "O"\) return "bedroom_glass_loss"/.test(source) &&
  /winner === "draw"\) return "bedroom_glass_draw"/.test(source),
  "player win, computer win, and draw map to three distinct localized captions");
check(/bedroom-ttt-win-x\{stroke:#d9a6a6/.test(source) &&
  /bedroom-ttt-win-o\{stroke:#7f9ec0/.test(source),
  "winning strokes use the caps pink for X and light blue for O");

console.log("");
if (failures) {
  console.log(failures + " bedroom tic-tac-toe assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Bedroom tic-tac-toe assertions passed.");

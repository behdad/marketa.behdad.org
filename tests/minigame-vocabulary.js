#!/usr/bin/env node
// Minigame vocabulary contract: shared round/result terms stay bilingual, game
// renderers consume them, and app/runtime actions keep their distinct meanings.
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");
var lib = require("./lib");

var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "rsvp.html"), "utf8");
var failures = 0;

function check(ok, label, detail) {
  if (ok) console.log("  \u2713 " + label);
  else {
    failures++;
    console.log("  \u2717 " + label);
    if (detail) console.log("      " + detail);
  }
}

var start = html.indexOf("var T = {");
var end = html.indexOf("\n};\nvar LOFT_CREDITS", start);
var sandbox = {};
check(start >= 0 && end > start, "T dictionary source is discoverable");
if (start >= 0 && end > start) {
  vm.runInNewContext(html.slice(start, end + 3), sandbox);
}
var T = sandbox.T || { en: {}, cs: {} };
var shared = [
  "game_score", "game_best", "game_ready", "game_over", "game_paused", "game_cleared",
  "game_new", "game_play_again", "game_exit",
  "game_move_up", "game_move_down", "game_move_left", "game_move_right"
];

check(shared.every(function (key) { return T.en[key] && T.cs[key]; }),
  "shared game terms exist in English and Czech",
  shared.filter(function (key) { return !T.en[key] || !T.cs[key]; }).join(", "));
check(T.en.game_over === "GAME OVER" && T.cs.game_over === "KONEC HRY",
  "Game over has one canonical bilingual label");
check(T.en.game_new === "NEW GAME" && T.en.game_play_again === "PLAY AGAIN",
  "New game and Play again remain distinct round actions");
check(T.en.game_exit === "Exit game" && T.cs.game_exit === "Ukončit hru",
  "the shared close control is explicitly Exit game");

check(!/\b(?:pacman_ready|pacman_over|pacman_new|tetris_score|tetris_best|tetris_restart|tetris_touch_restart)\s*:/.test(html),
  "Pac-Man and Tetris do not duplicate shared vocabulary keys");
check(/pacState\.status === "over" \? "game_over"/.test(html) &&
      /actionKey = pacState\.status === "win" \|\| pacState\.status === "over" \? "game_play_again" : "game_new"/.test(html),
  "Pac-Man uses canonical result and round-action terms");
check(/mailT\(key === "mines_win" \? "game_cleared" : "game_over"\)/.test(html) &&
      /faceKey = minesOver \? "game_play_again" : "game_new"/.test(html),
  "Mines distinguishes cleared/lost results and new/repeat actions");
check(/hud\.scoreLabel\.textContent = text\("game_score"\)/.test(html) &&
      /hud\.highLabel\.textContent = text\("game_best"\)/.test(html),
  "Window Tetris uses the shared Score and Best labels");
check(/window\.__gameText\("game_over"\)/.test(html) &&
      /window\.__gameText\("game_score"\)/.test(html) &&
      !/game over · ×/.test(html),
  "Flair-Catch and Invaders localize terminal Score presentation");
check(/data-tkey", pair\[2\]/.test(html) && /lifeT\(tk\[i\]\.getAttribute\("data-tkey"\)\)/.test(html),
  "Pac-Man and Life control labels refresh with the language");
check(T.en.hunt.flair_hint.indexOf("Esc or × exits") >= 0 &&
      T.en.hunt.arcade_hint.indexOf("Esc or × exits") >= 0 &&
      T.en.hunt.flair_hint.indexOf("Space pauses") >= 0 &&
      T.en.hunt.arcade_hint.indexOf("Space fires") >= 0 &&
      T.cs.hunt.flair_hint.indexOf("Esc nebo ×") >= 0 &&
      T.cs.hunt.arcade_hint.indexOf("Esc nebo ×") >= 0,
  "scene-game captions name action and exit controls in both languages");
check(T.en.du_reset === "Reset outfit" && T.en.quiz_again === "Take quiz again",
  "Dress-up and Quiz repeat actions name their scope");
check(/^Loading DOOM/.test(T.en.doom_loading) && /Close and reopen to try again\.$/.test(T.en.doom_fail),
  "Doom launch and retry copy uses app/runtime vocabulary");
var harness = [
  '<pre id="__report">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'var out={errors:window.__errs};',
  'window.setLang("en");window.goToStage("balcony");window.__startBalconyTetris();',
  'var status=document.querySelector(".tetris-status"),close=document.querySelector(".tetris-close");',
  'out.enTetris={text:status.textContent,width:status.getComputedTextLength(),close:close.getAttribute("aria-label")};',
  'window.setLang("cs");out.csTetris={text:status.textContent,width:status.getComputedTextLength(),close:close.getAttribute("aria-label")};',
  'close.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'window.goToStage("office");window.__arcadeTest(1,16);',
  'var arcadeClose=document.querySelector("#office-alien-layer .game-close-btn"),arcadeHud=document.querySelector("#office-alien-layer [role=img]");',
  'var shotsBefore=window.__arcadeState().shots,musicBefore=window.__musicPaused;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'out.arcade={close:arcadeClose&&arcadeClose.getAttribute("aria-label"),hud:arcadeHud&&arcadeHud.getAttribute("aria-label"),spaceFired:window.__arcadeState().shots===shotsBefore+1,musicHeld:window.__musicPaused===musicBefore};',
  'arcadeClose.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));',
  'out.arcade.closed=!window.__arcadeState().active;',
  'window.__arcadeTest(1,16);var arcadeEscLeaked=0;',
  'document.addEventListener("keydown",function arcadeEscProbe(e){if(e.key==="Escape")arcadeEscLeaked++;},{once:true});',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  'out.arcade.escapeOwned=!window.__arcadeState().active&&arcadeEscLeaked===0;',
  'window.setLang("en");window.goToStage("kitchen");window.__flairTest(1,16);',
  'var flairClose=document.querySelector("#kitchen-flair-layer .game-close-btn"),flairHud=document.querySelector("#kitchen-flair-layer [role=img]");',
  'var flairMusicBefore=window.__musicPaused;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var pauseLabel=document.querySelector("#kitchen-flair-layer .game-pause-label");',
  'out.flair={close:flairClose&&flairClose.getAttribute("aria-label"),hud:flairHud&&flairHud.getAttribute("aria-label"),paused:window.__flairState().paused,pauseLabel:pauseLabel&&pauseLabel.textContent,musicHeld:window.__musicPaused===flairMusicBefore};',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'out.flair.resumed=!window.__flairState().paused;',
  'flairClose.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));',
  'out.flair.closed=!window.__flairState().active;',
  'window.__flairTest(1,16);var flairEscLeaked=0;',
  'document.addEventListener("keydown",function flairEscProbe(e){if(e.key==="Escape")flairEscLeaked++;},{once:true});',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  'out.flair.escapeOwned=!window.__flairState().active&&flairEscLeaked===0;',
  'var face=document.querySelector(".mines-face"),faceClicks=0;face.addEventListener("click",function(){faceClicks++;});',
  'var faceKey=new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true});',
  'out.mines={label:face&&face.getAttribute("aria-label"),title:face&&face.getAttribute("title"),keyboard:!face.dispatchEvent(faceKey)&&faceClicks===1};',
  'window.goToStage("office");var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  'if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("life");',
  'var life=document.querySelector(".life-btn"),lifeButtons=document.querySelectorAll(".life-btn"),lifeMusicBefore=window.__musicPaused;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var lifePaused=!window.__lifeState().playing;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var lifeResumed=window.__lifeState().playing;',
  'lifeButtons[3].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'lifeButtons[0].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__lifeAdvance();',
  'out.life={label:life&&life.getAttribute("aria-label"),paused:lifePaused,resumed:lifeResumed,musicHeld:window.__musicPaused===lifeMusicBefore,extinctPaused:!window.__lifeState().playing&&!window.__lifeState().alive};',
  'document.getElementById("__report").textContent=JSON.stringify(out);',
  '},350);});</script>'
].join("\n");
var rendered = lib.runPageSync("rsvp.html", harness, 2500, { patchRaf: true, forceMotion: true });
check(rendered && (!rendered.errors || rendered.errors.length === 0),
  "runtime vocabulary probe has no uncaught errors",
  rendered && rendered.errors && rendered.errors.join("\n"));
check(rendered && rendered.enTetris.close === "Exit game" &&
      rendered.csTetris.close === "Ukončit hru" &&
      rendered.enTetris.width <= 140 && rendered.csTetris.width <= 140,
  "Window Tetris labels switch language and fit the HUD",
  rendered && JSON.stringify({ en: rendered.enTetris, cs: rendered.csTetris }));
check(rendered && rendered.arcade.close === "Ukončit hru" &&
      /^SKÓRE 0\. REKORD /.test(rendered.arcade.hud || "") && rendered.arcade.spaceFired &&
      rendered.arcade.musicHeld && rendered.arcade.closed && rendered.arcade.escapeOwned,
  "Invaders owns its action and exit keys",
  rendered && JSON.stringify(rendered.arcade));
check(rendered && rendered.flair.close === "Exit game" &&
      /^SCORE 0\. BEST /.test(rendered.flair.hud || "") && rendered.flair.paused &&
      rendered.flair.pauseLabel === "PAUSED" && rendered.flair.musicHeld &&
      rendered.flair.resumed && rendered.flair.closed && rendered.flair.escapeOwned,
  "Flair-Catch owns its action and exit keys",
  rendered && JSON.stringify(rendered.flair));
check(rendered && rendered.mines.label === "NEW GAME" && rendered.mines.title === "NEW GAME" &&
      rendered.mines.keyboard,
  "Mines names its face control New game and accepts keyboard activation",
  rendered && JSON.stringify(rendered.mines));
check(rendered && rendered.life.label === "Play" && rendered.life.paused && rendered.life.resumed &&
      rendered.life.musicHeld && rendered.life.extinctPaused,
  "Life owns Space and pauses when its board goes extinct",
  rendered && JSON.stringify(rendered.life));

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

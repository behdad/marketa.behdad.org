#!/usr/bin/env node
// Minigame vocabulary contract: shared round/result terms stay bilingual, game
// renderers consume them, and app/runtime actions keep their distinct meanings.
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "rsvp.html"), "utf8");
var failures = 0;

function check(ok, label, detail) {
  if (ok) console.log("  ✓ " + label);
  else {
    failures++;
    console.log("  ✗ " + label);
    if (detail) console.log("      " + detail);
  }
}

function readMessages(lang) {
  var source = fs.readFileSync(path.join(root, "loft-day." + lang + ".js"), "utf8");
  var prefix = 'window.__loftMessages["' + lang + '"] = ';
  if (source.slice(0, prefix.length) !== prefix || source.slice(-2) !== ";\n") return {};
  return JSON.parse(source.slice(prefix.length, -2));
}
var messages = { en: readMessages("en"), cs: readMessages("cs") };
check(Object.keys(messages.en).length > 0 && Object.keys(messages.cs).length > 0,
  "external message dictionaries are discoverable");
var shared = [
  "game_score", "game_best", "game_ready", "game_over", "game_paused", "game_cleared",
  "game_new", "game_play_again"
];

check(shared.every(function (key) { return messages.en[key] && messages.cs[key]; }),
  "shared game terms exist in English and Czech",
  shared.filter(function (key) { return !messages.en[key] || !messages.cs[key]; }).join(", "));
check(messages.en.game_over === "GAME OVER" && messages.cs.game_over === "KONEC HRY",
  "Game over has one canonical bilingual label");
check(messages.en.mines_lose.includes("<br>") && messages.cs.mines_lose.includes("<br>") &&
      /minesMsgEl\.innerHTML\s*=/.test(html),
  "Mines authors a clean bilingual break before its game-over aside");
check(messages.en.game_new === "NEW GAME" && messages.en.game_play_again === "PLAY AGAIN",
  "New game and Play again remain distinct round actions");
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
  "Block Party uses the shared Score and Best labels");
check(/window\.__gameText\("game_over"\)/.test(html) &&
      /window\.__gameText\("game_score"\)/.test(html) &&
      !/game over · ×/.test(html),
  "Flair-Catch and Invaders localize terminal Score presentation");
check(messages.en.hunt.flair_hint.indexOf("Move Pouria") >= 0 &&
      messages.en.hunt.arcade_hint.indexOf("Space fires") >= 0 &&
      messages.en.hunt.arcade_hint.indexOf("← →") >= 0 &&
      messages.cs.hunt.flair_hint.indexOf("Pouriou") >= 0 &&
      messages.cs.hunt.arcade_hint.indexOf("← →") >= 0,
  "scene-game captions keep concise bilingual action guidance");
check(messages.en.quiz_again === "Take quiz again" && messages.cs.quiz_again,
  "Quiz keeps its scoped repeat action bilingual");
var harness = [
  '<pre id="__report">pending</pre>',
  '<script>window.addEventListener("load",function(){setTimeout(function(){',
  'var out={errors:window.__errs};',
  'function modalOwns(keys){var leaks=0,probe=function(){leaks++;};document.addEventListener("keydown",probe);var prevented=keys.every(function(key){return !document.dispatchEvent(new KeyboardEvent("keydown",{key:key,bubbles:true,cancelable:true}));});document.removeEventListener("keydown",probe);return prevented&&leaks===0;}',
  'window.setLang("en");window.goToStage("balcony");window.__startBalconyTetris();',
  'var status=document.querySelector(".tetris-status"),close=document.querySelector(".tetris-close");',
  'out.enTetris={text:status.textContent,width:status.getComputedTextLength()};',
  'window.setLang("cs");out.csTetris={text:status.textContent,width:status.getComputedTextLength()};',
  'close.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'window.goToStage("office");window.__arcadeTest(1,16);',
  'var arcadeClose=document.querySelector("#office-alien-layer .game-close-btn"),arcadeTitle=document.querySelector("#office-alien-layer .game-title-splash text");',
  'var shotsBefore=window.__arcadeState().shots,musicBefore=window.__musicPaused;',
  'var arcadeX0=window.__arcadeState().playerX,arcadeLeftOwned=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true,cancelable:true})),arcadeX1=window.__arcadeState().playerX,arcadeRightOwned=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true})),arcadeX2=window.__arcadeState().playerX;',
  'var arcadeNight=document.getElementById("stage-balcony").classList.contains("dusk"),arcadeShortcutsOwned=modalOwns(["ArrowUp","ArrowDown","Tab","c","n"]);',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'out.arcade={title:arcadeTitle&&arcadeTitle.textContent,score:document.querySelector("#office-alien-layer .arcade-score").textContent,high:document.querySelector("#office-alien-layer .arcade-high").textContent,circular:!!arcadeClose&&arcadeClose.querySelector(".game-close-ring").tagName.toLowerCase()==="circle"&&arcadeClose.querySelector(".mini-hit").getAttribute("r")==="20",arrows:arcadeLeftOwned&&arcadeRightOwned&&arcadeX1<arcadeX0&&arcadeX2===arcadeX0,shortcutsHeld:arcadeShortcutsOwned&&document.getElementById("stage-balcony").classList.contains("dusk")===arcadeNight,spaceFired:window.__arcadeState().shots===shotsBefore+1,musicHeld:window.__musicPaused===musicBefore};',
  'arcadeClose.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));',
  'out.arcade.closed=!window.__arcadeState().active;',
  'window.__arcadeTest(1,16);var arcadeEscLeaked=0;',
  'document.addEventListener("keydown",function arcadeEscProbe(e){if(e.key==="Escape")arcadeEscLeaked++;},{once:true});',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));',
  'out.arcade.escapeOwned=!window.__arcadeState().active&&arcadeEscLeaked===0;',
  'window.setLang("en");window.goToStage("kitchen");window.__flairTest(1,16);',
  'var flairClose=document.querySelector("#kitchen-flair-layer .game-close-btn"),flairTitle=document.querySelector("#kitchen-flair-layer .game-title-splash text");',
  'var flairMusicBefore=window.__musicPaused;',
  'var flairX0=window.__flairState().playerX,flairLeftOwned=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowLeft",bubbles:true,cancelable:true})),flairX1=window.__flairState().playerX,flairRightOwned=!document.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true,cancelable:true})),flairX2=window.__flairState().playerX;',
  'var flairNight=document.getElementById("stage-balcony").classList.contains("dusk"),flairShortcutsOwned=modalOwns(["ArrowUp","ArrowDown","Tab","c","n"]);',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var pauseLabel=document.querySelector("#kitchen-flair-layer .game-pause-label");',
  'out.flair={title:flairTitle&&flairTitle.textContent,score:document.querySelector("#kitchen-flair-layer .flair-score").textContent,high:document.querySelector("#kitchen-flair-layer .flair-high").textContent,circular:!!flairClose&&flairClose.querySelector(".game-close-ring").tagName.toLowerCase()==="circle"&&flairClose.querySelector(".mini-hit").getAttribute("r")==="20",arrows:flairLeftOwned&&flairRightOwned&&flairX1<flairX0&&flairX2===flairX0,shortcutsHeld:flairShortcutsOwned&&document.getElementById("stage-balcony").classList.contains("dusk")===flairNight,paused:window.__flairState().paused,pauseLabel:pauseLabel&&pauseLabel.textContent,musicHeld:window.__musicPaused===flairMusicBefore};',
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
  'out.mines={face:face&&face.textContent,keyboard:!face.dispatchEvent(faceKey)&&faceClicks===1};',
  'window.goToStage("office");var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");',
  'if(tower)tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__openMonitorApp("life");',
  'var life=document.querySelector(".life-btn"),lifeButtons=document.querySelectorAll(".life-btn"),lifeMusicBefore=window.__musicPaused;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var lifePaused=!window.__lifeState().playing;',
  'document.dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true,cancelable:true}));',
  'var lifeResumed=window.__lifeState().playing;',
  'lifeButtons[3].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'lifeButtons[0].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__lifeAdvance();',
  'out.life={face:life&&life.textContent,paused:lifePaused,resumed:lifeResumed,musicHeld:window.__musicPaused===lifeMusicBefore,extinctPaused:!window.__lifeState().playing&&!window.__lifeState().alive};',
  'var lifeCanvas=document.querySelector(".life-board"),lr=lifeCanvas.getBoundingClientRect();',
  'function paintLifeCell(r,c,id){var x=lr.left+(c+.5)*lr.width/30,y=lr.top+(r+.5)*lr.height/14;lifeCanvas.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:id,clientX:x,clientY:y}));lifeCanvas.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:id,clientX:x,clientY:y}));}',
  'paintLifeCell(6,14,1);paintLifeCell(6,15,2);paintLifeCell(7,14,3);paintLifeCell(7,15,4);var stillStartGen=window.__lifeState().generation;',
  'lifeButtons[0].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__lifeAdvance();var still=window.__lifeState();out.life.still=still;out.life.stepFace=lifeButtons[1].textContent;out.life.stationaryPaused=!still.playing&&still.alive&&still.stationary&&still.generation===stillStartGen+1;',
  'lifeButtons[8].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));lifeButtons[0].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));window.__lifeAdvance();var oscillator=window.__lifeState();out.life.oscillatorContinues=oscillator.playing&&oscillator.alive&&!oscillator.stationary;lifeButtons[0].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));',
  'document.getElementById("__report").textContent=JSON.stringify(out);',
  '},350);});</script>'
].join("\n");
var rendered = lib.runPageSync("rsvp.html", harness, 2500, { patchRaf: true, forceMotion: true });
check(rendered && (!rendered.errors || rendered.errors.length === 0),
  "runtime vocabulary probe has no uncaught errors",
  rendered && rendered.errors && rendered.errors.join("\n"));
check(rendered && /CLICK ROTATE/.test(rendered.enTetris.text) && /KLIK OTOČ/.test(rendered.csTetris.text) &&
      rendered.enTetris.width <= 140 && rendered.csTetris.width <= 140,
  "Block Party labels switch language and fit the HUD",
  rendered && JSON.stringify({ en: rendered.enTetris, cs: rendered.csTetris }));
check(rendered && rendered.arcade.title === "ALIEN RESOURCES" &&
      rendered.arcade.score === "0" && /^\d+$/.test(rendered.arcade.high) && rendered.arcade.spaceFired &&
      rendered.arcade.circular && rendered.arcade.arrows && rendered.arcade.shortcutsHeld && rendered.arcade.musicHeld &&
      rendered.arcade.closed && rendered.arcade.escapeOwned,
  "Alien Resources owns its action and exit keys",
  rendered && JSON.stringify(rendered.arcade));
check(rendered && rendered.flair.title === "FLAIR CATCH" &&
      rendered.flair.score === "0" && /^\d+$/.test(rendered.flair.high) && rendered.flair.paused &&
      rendered.flair.pauseLabel === "PAUSED" && rendered.flair.musicHeld &&
      rendered.flair.circular && rendered.flair.arrows && rendered.flair.shortcutsHeld && rendered.flair.resumed &&
      rendered.flair.closed && rendered.flair.escapeOwned,
  "Flair Catch owns its action and exit keys",
  rendered && JSON.stringify(rendered.flair));
check(rendered && rendered.mines.keyboard,
  "Mines keeps keyboard activation on its face control",
  rendered && JSON.stringify(rendered.mines));
check(rendered && rendered.life.face && rendered.life.paused && rendered.life.resumed &&
      rendered.life.musicHeld && rendered.life.extinctPaused && rendered.life.stationaryPaused &&
      rendered.life.oscillatorContinues && rendered.life.stepFace === "▶│",
  "Life owns Space and pauses when its board goes extinct or reaches a fixed point",
  rendered && JSON.stringify(rendered.life));

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'function key(k){document.dispatchEvent(new KeyboardEvent("keydown",{key:k,bubbles:true,cancelable:true}));}',
  'function search(q){q.split("").forEach(key);var state=window.__monitorDockSearch();key("Escape");return state;}',
  'try {',
  ' var gate=document.getElementById("loft-recovery-gate");if(gate)gate.querySelector(".loft-recovery-btn:not(.primary)").click();',
  ' var mon=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio");window.__endAttract();window.__goToStage("office");tower.classList.add("on");mon.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();',
  ' S("dock",{classics:!!document.getElementById("monitor-dock-classics"),mines:!!document.getElementById("monitor-dock-mines"),label:document.querySelector("#monitor-dock-classics .dock-label").textContent,icon:!!document.querySelector("#monitor-dock-classics use[href=\\"#dicon-classics\\"]")});',
  ' S("search",{classics:search("classics"),mines:search("mines"),solitaire:search("solitaire"),cards:search("cards")});',
  ' document.getElementById("monitor-dock-classics").click();S("chooser",{view:window.__classicsView(),show:mon.classList.contains("show-mines"),choices:[].slice.call(document.querySelectorAll(".classics-choice")).map(function(x){return x.getAttribute("data-classics-view");})});',
  ' document.querySelector(".classics-choice-solitaire").click();var st=window.__solitaireState();S("deal",{view:window.__classicsView(),stock:st.stock.length,waste:st.waste.length,tableau:st.tableau.map(function(x){return x.length;}),up:st.tableau.map(function(x){return x.filter(function(c){return c.faceUp;}).length;}),cards:document.querySelectorAll(".sol-card").length});',
  ' var solWrap=document.getElementById("monitor-solitaire-wrap"),solUnit=solWrap.getBoundingClientRect().width/124,solActions=document.querySelector(".sol-actions"),solButtons=[].slice.call(document.querySelectorAll(".sol-action")),solActionRect=solActions.getBoundingClientRect(),solButtonRects=solButtons.map(function(button){return button.getBoundingClientRect();});S("actionLayout",{height:solActionRect.height/solUnit,topPad:(solButtonRects[0].top-solActionRect.top)/solUnit,bottomPad:(solActionRect.bottom-solButtonRects[2].bottom)/solUnit,labelOffsets:solButtons.map(function(button){var b=button.getBoundingClientRect(),l=button.querySelector(".sol-action-label").getBoundingClientRect();return ((l.top+l.bottom)-(b.top+b.bottom))/2/solUnit;})});',
  ' var close=document.getElementById("monitor-mines-close"),back=document.getElementById("monitor-mines-back"),closeBg=close.querySelector(".classics-close-bg"),backBg=back.querySelector(".classics-close-bg");S("game_controls",{close:getComputedStyle(close).pointerEvents,back:getComputedStyle(back).pointerEvents,closePath:close.querySelector("path").getAttribute("d"),backPath:back.querySelector("path").getAttribute("d"),closeFill:getComputedStyle(closeBg).fill,backFill:getComputedStyle(backBg).fill});close.dispatchEvent(new MouseEvent("click",{bubbles:true}));S("dismissed",{view:window.__classicsView(),open:mon.classList.contains("show-mines")});document.getElementById("monitor-dock-classics").click();S("resumed",{view:window.__classicsView(),open:mon.classList.contains("show-mines")});back.dispatchEvent(new MouseEvent("click",{bubbles:true}));S("back",{view:window.__classicsView(),stillOpen:mon.classList.contains("show-mines"),back:getComputedStyle(back).pointerEvents,fill:getComputedStyle(closeBg).fill});',
  ' window.__openMonitorApp("mines");S("mines",{view:window.__classicsView(),cells:document.querySelectorAll("#monitor-mines-wrap .mines-cell").length,fill:getComputedStyle(closeBg).fill});close.dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  ' var rules=window.__solitaireRules;S("rules",{king:rules.tableau([{suit:"h",rank:13,faceUp:true}],[]),nonking:rules.tableau([{suit:"h",rank:12,faceUp:true}],[]),alt:rules.tableau([{suit:"h",rank:12,faceUp:true}],[{suit:"s",rank:13,faceUp:true}]),same:rules.tableau([{suit:"d",rank:12,faceUp:true}],[{suit:"h",rank:13,faceUp:true}]),ace:rules.foundation([{suit:"h",rank:1,faceUp:true}],"h",[]),wrongSuit:rules.foundation([{suit:"d",rank:1,faceUp:true}],"h",[])});',
  ' window.__openMonitorApp("solitaire");window.__solitaireLoadForTest({tableau:[[{suit:"s",rank:13}],[{suit:"h",rank:12},{suit:"c",rank:11}],[],[],[],[],[]]});var moved=window.__solitaireMove({kind:"tableau",pile:1,index:0},{kind:"tableau",pile:0});st=window.__solitaireState();S("move",{moved:moved,piles:st.tableau.map(function(x){return x.length;})});',
  ' window.__solitaireLoadForTest({tableau:[[{suit:"s",rank:13}],[{suit:"h",rank:12},{suit:"c",rank:11}],[],[],[],[],[]]});var source=document.querySelector("[data-sol-source=tableau][data-sol-pile=\\"1\\"][data-sol-index=\\"0\\"]"),target=document.querySelector("[data-sol-target=tableau][data-sol-pile=\\"0\\"]"),realPoint=document.elementFromPoint.bind(document);source.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,pointerId:91,button:0,clientX:20,clientY:20}));solitaireWrap=document.getElementById("monitor-solitaire-wrap");solitaireWrap.dispatchEvent(new PointerEvent("pointermove",{bubbles:true,pointerId:91,buttons:1,clientX:60,clientY:60}));var ghost=document.querySelector(".sol-drag-ghost"),ghostCards=ghost&&ghost.querySelectorAll(".sol-card").length,hidden=document.querySelectorAll(".sol-drag-source").length;document.elementFromPoint=function(){return target;};solitaireWrap.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,pointerId:91,button:0,clientX:60,clientY:60}));document.elementFromPoint=realPoint;st=window.__solitaireState();S("drag",{ghost:!!ghost,ghostCards:ghostCards,hidden:hidden,piles:st.tableau.map(function(x){return x.length;}),moves:st.moves});',
  ' window.__solitaireLoadForTest({waste:[{suit:"h",rank:1}],tableau:[[],[],[],[],[],[],[]]});var homed=window.__solitaireMove({kind:"waste",index:0},{kind:"foundation",suit:"h"});st=window.__solitaireState();S("foundation",{moved:homed,home:st.foundations.h,waste:st.waste});',
  ' window.__solitaireLoadForTest({tableau:[[{suit:"s",rank:13}],[{suit:"h",rank:12}],[{suit:"c",rank:11}],[],[],[],[]]});S("courts",[...document.querySelectorAll("[data-court-person]")].map(function(x){return x.getAttribute("data-court-person");}));',
  ' window.__openMonitorApp("classics");if(window.__classicsView()!=="chooser")back.dispatchEvent(new MouseEvent("click",{bubbles:true}));window.__killMonitorClassics();S("killChooser",{chooser:mon.classList.contains("death-classics"),mine:mon.classList.contains("death-mines")});window.__deathFlashCleanup();',
  ' window.__openMonitorApp("mines");window.__killMonitorClassics();S("killMines",{mine:mon.classList.contains("death-mines"),sol:mon.classList.contains("death-solitaire")});window.__deathFlashCleanup();',
  ' window.__openMonitorApp("solitaire");window.__killMonitorClassics();S("killSol",{sol:mon.classList.contains("death-solitaire"),mine:mon.classList.contains("death-mines"),cards:document.querySelectorAll(".sol-pickup-card").length});window.__deathFlashCleanup();',
  ' S("commands",{mines:typeof window.__loftControllers.mines,solitaire:typeof window.__loftControllers.solitaire,cards:window.__openMonitorApp("cards")});',
  '} catch(e) { window.__errs.push("harness: "+String(e&&e.stack||e)); }',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Classics + Klondike:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4500, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.dock.classics && !s.dock.mines && s.dock.label === "classics" && s.dock.icon,
  "the renamed lowercase Classics tile carries the combined vector icon", s.dock);
check(s.search.classics.match === "classics" && s.search.mines.match === "mines" &&
  s.search.solitaire.match === "solitaire" && !s.search.cards.match,
  "monitor search routes the current Classics game names without a retired cards alias", s.search);
check(s.chooser.show && s.chooser.view === "chooser" && JSON.stringify(s.chooser.choices) === JSON.stringify(["mines", "solitaire"]),
  "Classics opens a two-game chooser", s.chooser);
check(s.deal.view === "solitaire" && s.deal.stock === 24 && s.deal.waste === 0 &&
  JSON.stringify(s.deal.tableau) === JSON.stringify([1,2,3,4,5,6,7]) &&
  JSON.stringify(s.deal.up) === JSON.stringify([1,1,1,1,1,1,1]),
  "Klondike deals 24 stock cards and seven legal tableau piles", s.deal);
check(Math.abs(s.actionLayout.height - 12) < 0.1 &&
  Math.abs(s.actionLayout.topPad - s.actionLayout.bottomPad) < 0.1 &&
  s.actionLayout.labelOffsets.every(function (offset) { return Math.abs(offset) < 0.1; }),
  "Solitaire actions and their labels center vertically in the top lane", s.actionLayout);
check(s.game_controls.close !== "none" && s.game_controls.back !== "none" &&
  s.game_controls.closePath === "M373.45 158.2 L375.55 160.3 M375.55 158.2 L373.45 160.3" &&
  s.game_controls.backPath === "M375.4 157.9 L373.5 159.25 L375.4 160.6" &&
  s.game_controls.closeFill === "rgb(47, 102, 83)" && s.game_controls.backFill === "rgb(47, 102, 83)" &&
  !s.dismissed.open && s.dismissed.view === "solitaire" &&
  s.resumed.open && s.resumed.view === "solitaire" &&
  s.back.view === "chooser" && s.back.stillOpen && s.back.back === "none" &&
  s.back.fill === "rgb(200, 194, 180)",
  "game-level Dismiss preserves Solitaire while Back returns to the chooser", {
    controls: s.game_controls, dismissed: s.dismissed, resumed: s.resumed, back: s.back
  });
check(s.mines.view === "mines" && s.mines.cells === 112 && s.mines.fill === "rgb(138, 130, 114)",
  "direct Mines launch preserves the 16×7 board and grey Back pillow", s.mines);
check(s.rules.king && !s.rules.nonking && s.rules.alt && !s.rules.same && s.rules.ace && !s.rules.wrongSuit,
  "tableau and foundation validation enforce Klondike rank, colour and suit rules", s.rules);
check(s.move.moved && s.move.piles[0] === 3 && s.move.piles[1] === 0,
  "a legal multi-card tableau run moves as one stack", s.move);
check(s.drag.ghost && s.drag.ghostCards === 2 && s.drag.hidden === 2 &&
  s.drag.piles[0] === 3 && s.drag.piles[1] === 0 && s.drag.moves === 1,
  "pointer dragging lifts the full visible stack and lands a legal tableau move", s.drag);
check(s.foundation.moved && s.foundation.home.length === 1 && s.foundation.waste.length === 0,
  "an Ace moves from waste to its foundation", s.foundation);
check(JSON.stringify(s.courts.sort()) === JSON.stringify(["behdad","jay","marketa"]),
  "Jacks, Queens and Kings render Jay, Markéta and Behdad portraits", s.courts);
check(s.killChooser.chooser && !s.killChooser.mine && s.killMines.mine && !s.killMines.sol &&
  s.killSol.sol && !s.killSol.mine && s.killSol.cards === 52,
  "chooser, Mines and Solitaire dispatch their distinct Kill gags", { chooser: s.killChooser, mines: s.killMines, solitaire: s.killSol });
check(s.commands.mines === "function" && s.commands.solitaire === "function" && /solitaire/.test(s.commands.cards),
  "private game controllers and the cards device alias bypass the chooser", s.commands);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

#!/usr/bin/env node
// Pocket Mines must use the complete app surface while keeping square-ish cells
// and a coherent, finger-usable toolbar at every phone-shell aspect.
"use strict";

var lib = require("./lib");

function harness(lang) {
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
    'function rect(el){var r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}',
    'window.addEventListener("load",function(){setTimeout(async function(){',
    ' var report={errors:window.__errs};try{',
    '  setLang(' + JSON.stringify(lang) + ');window.phone("mines");await sleep(220);',
    '  var body=document.querySelector(".phone-app-body"),host=body.querySelector(".pm-mines-host"),board=host.querySelector(".mines-board"),toolbar=host.querySelector(".mines-side"),face=host.querySelector(".mines-face"),count=host.querySelector(".mines-count"),timer=host.querySelector(".mines-timer"),ring=count.querySelector(".mines-ring"),digits=count.querySelector(".mines-digits"),cell=board.querySelector(".mines-cell");',
    '  var cs=getComputedStyle(body),hs=getComputedStyle(host),cols=+board.getAttribute("data-mines-cols"),rows=+board.getAttribute("data-mines-rows");',
    '  report.layout={viewport:[innerWidth,innerHeight],padding:cs.padding,overflow:cs.overflowY,body:rect(body),host:rect(host),board:rect(board),toolbar:rect(toolbar),face:rect(face),count:rect(count),timer:rect(timer),ring:rect(ring),digits:rect(digits),cell:rect(cell),cols:cols,rows:rows,cells:board.children.length,scroll:[body.clientWidth,body.scrollWidth,body.clientHeight,body.scrollHeight],transform:hs.transform};',
    '  cell.click();var opened=board.querySelectorAll(".mines-cell.open").length;face.click();var reset=board.querySelectorAll(".mines-cell.open,.mines-cell.flag").length;face.focus();var fs=getComputedStyle(face);report.controls={tag:face.tagName,glyph:face.textContent,label:face.getAttribute("title"),opened:opened,reset:reset,outline:parseFloat(fs.outlineWidth)||0,outlineOffset:parseFloat(fs.outlineOffset)||0,countText:count.textContent,timerText:timer.textContent};',
    '  board.querySelector(".mines-cell").click();var beforeResize={cols:+board.dataset.minesCols,rows:+board.dataset.minesRows,cells:board.children.length,opened:board.querySelectorAll(".mines-cell.open").length};body.style.flex="none";body.style.height=Math.max(120,body.clientHeight-140)+"px";window.dispatchEvent(new Event("resize"));await sleep(100);report.resize={before:beforeResize,after:{cols:+board.dataset.minesCols,rows:+board.dataset.minesRows,cells:board.children.length,opened:board.querySelectorAll(".mines-cell.open").length}};',
    ' }catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
    ' report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);',
    '},350);});',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
function near(a, b, tolerance) { return Math.abs(a - b) <= tolerance; }

function run(label, lang, flags) {
  console.log("rsvp.html pocket Mines layout (" + label + "):");
  var report = lib.runPageSync("rsvp.html", harness(lang), 2600, { patchRaf: true, chromeFlags: flags });
  if (!report) { check(false, "harness produced a report"); return; }
  var l = report.layout || {}, c = report.controls || {}, b = l.body || {}, board = l.board || {}, bar = l.toolbar || {};
  check(report.errors.length === 0, "no uncaught page errors", report.errors);
  check(l.padding === "0px" && l.transform === "none" && l.scroll && l.scroll[0] === l.scroll[1] && l.scroll[2] === l.scroll[3],
    "Mines removes app padding and transform/scroll overflow", l);
  check(near(board.x, b.x, 1) && near(board.right, b.right, 1) && near(board.y, b.y, 1),
    "the board is flush with the phone's left, right and top edges", { body: b, board: board });
  check(near(board.bottom, bar.y, 1) && near(bar.x, b.x, 1) && near(bar.right, b.right, 1) && near(bar.bottom, b.bottom, 1),
    "board plus toolbar consume the full available app height", { body: b, board: board, toolbar: bar });
  check(l.cols >= 5 && l.rows >= 4 && l.cells === l.cols * l.rows && l.cell && l.cell.w / l.cell.h > 0.85 && l.cell.w / l.cell.h < 1.15,
    "the responsive topology fills with square-ish readable cells", { cols: l.cols, rows: l.rows, cells: l.cells, cell: l.cell });
  check(l.cell.w >= 33 && l.cell.h >= 33, "cell targets stay at least as large as the previous phone board", l.cell);
  check(near(l.face.h, l.count.h, 1) && near(l.count.h, l.timer.h, 1) && near(l.face.y, l.count.y, 1) && near(l.count.y, l.timer.y, 1) && near(l.count.w, l.timer.w, 1),
    "reset and both readouts share one aligned toolbar treatment", { face: l.face, count: l.count, timer: l.timer });
  check(l.face.h >= 44 && l.count.h >= 44 && l.timer.h >= 44,
    "every toolbar control retains a 44px touch target", { face: l.face, count: l.count, timer: l.timer });
  check(l.ring.right <= l.digits.x + 0.5 && Math.abs((l.ring.y + l.ring.h / 2) - (l.digits.y + l.digits.h / 2)) <= 3,
    "the ring sits horizontally left of vertically aligned counter digits", { ring: l.ring, digits: l.digits });
  check(c.tag === "BUTTON" && c.glyph === "↻" && c.label && c.opened > 0 && c.reset === 0,
    "the clear restart button remains keyboard-native and resets the live board", c);
  check(c.outline <= 2 && c.outlineOffset <= 0,
    "keyboard focus uses a restrained inset outline instead of the oversized default ring", c);
  check(report.resize && JSON.stringify(report.resize.before) === JSON.stringify(report.resize.after),
    "a live deal survives a phone resize without losing its topology or opened cells", report.resize);
  console.log("");
}

run("desktop EN", "en", "--window-size=1100,900");
run("mobile portrait CS", "cs", "--window-size=390,844");
run("compact landscape EN", "en", "--window-size=844,390");

if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

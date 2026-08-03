#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[]};window.addEventListener("load",function(){setTimeout(function(){try{',
  'var bricks=Array.from(document.querySelectorAll(".wall-brick")),caption=window.__captionKey();',
  'function click(el){el.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));}',
  'click(bricks[0]);var first=window.__brickInstrumentState(),pressed=bricks[0].classList.contains("brick-struck"),dust=document.querySelectorAll(".brick-note-dust").length;',
  'click(bricks[bricks.length-1]);var second=window.__brickInstrumentState();',
  'report={errors:window.__errs,captionBefore:caption,captionAfter:window.__captionKey(),count:bricks.length,first:first,second:second,pressed:pressed,dust:dust,pointers:bricks.every(function(b){return getComputedStyle(b).cursor==="pointer";}),legacy:document.querySelectorAll(".wall-brick.hunt-hit").length};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));report.errors=window.__errs;}',
  'document.getElementById("__report").textContent=JSON.stringify(report);},250);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html loose-brick instrument:");
var result = lib.runPageSync("rsvp.html", HARNESS, 8000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(result.count === 20 && result.first && result.first.bricks === 20,
  "all twenty loose bricks join one instrument", result);
check(result.first && result.first.strikes === 1 && result.second && result.second.strikes === 2,
  "each click records exactly one note", result);
check(result.first && result.second && result.first.last.semitone !== result.second.last.semitone,
  "horizontal brick position changes pitch", { first: result.first, second: result.second });
check(result.pressed && result.dust === 3,
  "a strike depresses the brick and emits three same-parent dust motes", result);
check(result.captionAfter === result.captionBefore,
  "brick notes never claim the caption", result);
check(result.pointers && result.legacy === 0,
  "bricks advertise the instrument without rejoining the generic hunt-hit system", result);

console.log("");
if (failures) { console.log(failures + " brick-instrument assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("Brick-instrument assertions passed.");

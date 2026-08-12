#!/usr/bin/env node
// Real entry regression: splash → Shift+P → Messages → Celebrate → eight-second postcard.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function key(key,extra){var init={key:key,bubbles:true,cancelable:true};Object.keys(extra||{}).forEach(function(k){init[k]=extra[k];});document.dispatchEvent(new KeyboardEvent("keydown",init));}',
  'async function waitFor(test,ms){var end=Date.now()+ms;while(Date.now()<end){var value=test();if(value)return value;await sleep(40);}return test();}',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},500);});',
  'async function run(){',
  ' var intro=document.getElementById("click-me-overlay");',
  ' report.splash={visible:!!intro,party:document.getElementById("loft-game-strip").classList.contains("party-on"),notice:!!document.querySelector(".msg-thumb.show,.msg-badge.show")};',
  ' if(intro)intro.click();await waitFor(function(){return !document.getElementById("click-me-overlay");},2000);',
  ' key("P",{shiftKey:true,code:"KeyP"});',
  ' key("/",{code:"Slash"});',
  ' var row=document.querySelector(".pm-msg-row[data-message-id=bd_marketa]"),action=row&&row.querySelector(".pm-msg-act.bd-celebrate");',
  ' report.partyStart={party:document.getElementById("loft-game-strip").classList.contains("party-on"),row:!!row,sender:row&&row.querySelector(".pm-msg-from").textContent,body:row&&row.querySelector(".pm-msg-text").textContent,label:action&&action.textContent.trim()};',
  ' if(action)action.click();',
  ' await sleep(450);report.celebrate={cake:!!document.querySelector("#garden-guests.bd-cake-cutting"),card:!!document.getElementById("sharecard-modal")};',
  ' await sleep(7200);report.beforeEight={card:!!document.getElementById("sharecard-modal")};',
  ' var card=await waitFor(function(){return document.querySelector("#sharecard-modal.show");},1800);',
  ' var download=card&&await waitFor(function(){var link=card.querySelector(".sharecard-dl");return link&&link.getAttribute("download")==="marketa-behdad-marketa.png"&&link;},1800);',
  ' report.afterEight={card:!!card,matching:!!download,image:!!(card&&card.querySelector(".sharecard-img").getAttribute("src"))};',
  ' var close=card&&card.querySelector(".sharecard-x");if(close)close.click();await sleep(350);key("/",{code:"Slash"});await sleep(80);',
  ' report.repeat={available:!!document.querySelector(".pm-msg-row[data-message-id=bd_marketa] .pm-msg-act.bd-celebrate")};',
  '}',
  '})();',
  '</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message); if (detail != null) console.log("      " + JSON.stringify(detail)); }
}

console.log("loft-day.html real birthday message flow:");
var r = lib.runPageSync("loft-day.html", HARNESS, 30000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-01-20&birthday-ui-regression=1"
});

check(r && r.splash.visible && !r.splash.party && !r.splash.notice,
  "the untouched splash has no birthday interruption", r && r.splash);
check(r && r.partyStart.party && r.partyStart.row && r.partyStart.sender === "behdad" &&
    /birthday.*Markéta/i.test(r.partyStart.body) && /Celebrate/.test(r.partyStart.label),
  "actual Shift+P synchronously releases the exact-day greeting into Messages", r && r.partyStart);
check(r && r.celebrate.cake && !r.celebrate.card,
  "the actual Celebrate button starts the cake without opening the postcard", r && r.celebrate);
check(r && !r.beforeEight.card && r.afterEight.card && r.afterEight.matching && r.afterEight.image,
  "the real matching postcard opens only after the fixed eight-second beat", { before: r && r.beforeEight, after: r && r.afterEight });
check(r && r.repeat.available, "Celebrate remains available after closing the postcard", r && r.repeat);
check(r && r.errors.length === 0, "no uncaught JavaScript errors", r && r.errors);

console.log("");
if (failures) { console.log(failures + " birthday UI assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("All checks passed.");

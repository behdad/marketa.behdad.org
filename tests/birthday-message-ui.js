#!/usr/bin/env node
// Real entry regressions: ordinary Party stays greeting-only; birthday ribbon starts the ceremony.
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
  ' await sleep(1700);',
  ' report.quietParty={message:!!window.__phoneMessageReceived("bd_marketa"),card:!!document.getElementById("sharecard-modal"),cake:!!window.__bdCakeOn};',
  ' key("/",{code:"Slash"});',
  ' var row=document.querySelector(".pm-msg-row[data-message-id=bd_marketa]"),action=row&&row.querySelector(".pm-msg-act");',
  ' report.partyStart={party:document.getElementById("loft-game-strip").classList.contains("party-on"),row:!!row,sender:row&&row.querySelector(".pm-msg-from").textContent,body:row&&row.querySelector(".pm-msg-text").textContent,arrow:!!(action&&action.querySelector("svg")),label:action&&action.textContent.trim(),standard:!!(action&&action.className==="pm-msg-act")};',
  ' if(action)action.click();',
  ' await sleep(450);report.celebrate={cake:!!document.querySelector("#garden-guests.bd-cake-cutting"),card:!!document.getElementById("sharecard-modal")};',
  ' await sleep(7200);report.beforeEight={card:!!document.getElementById("sharecard-modal")};',
  ' var card=await waitFor(function(){return document.querySelector("#sharecard-modal.show");},1800);',
  ' var download=card&&await waitFor(function(){var link=card.querySelector(".sharecard-dl");return link&&link.getAttribute("download")==="marketa-behdad-marketa.png"&&link;},1800);',
  ' report.afterEight={card:!!card,matching:!!download,image:!!(card&&card.querySelector(".sharecard-img").getAttribute("src"))};',
  ' var close=card&&card.querySelector(".sharecard-x");if(close)close.click();await sleep(350);key("/",{code:"Slash"});await sleep(80);',
  ' report.repeat={available:!!document.querySelector(".pm-msg-row[data-message-id=bd_marketa] .pm-msg-act")};',
  '}',
  '})();',
  '</script>'
].join("\n");

var BANNER_HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>',
  '(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'async function waitFor(test,ms){var end=Date.now()+ms;while(Date.now()<end){var value=test();if(value)return value;await sleep(40);}return test();}',
  'var report={errors:[]};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},500);});',
  'async function run(){',
  ' var banner=await waitFor(function(){return document.getElementById("occasion-banner");},1200);',
  ' report.before={splash:!!document.getElementById("click-me-overlay"),banner:!!banner,party:!!window.__gardenPartyOn,card:!!document.getElementById("sharecard-modal"),cake:!!window.__bdCakeOn};',
  ' if(banner)banner.click();',
  ' await waitFor(function(){return window.__bdCakeOn;},2200);',
  ' report.started={started:window.__gameStarted(),phase2:!!window.__secondRound,party:!!window.__gardenPartyOn,room:window.__currentStageName,message:!!window.__phoneMessageReceived("bd_hamid"),cake:!!window.__bdCakeOn,card:!!document.getElementById("sharecard-modal")};',
  ' await sleep(7200);report.beforeEight={card:!!document.getElementById("sharecard-modal")};',
  ' var card=await waitFor(function(){return document.querySelector("#sharecard-modal.show");},1800);',
  ' var link=card&&await waitFor(function(){var node=card.querySelector(".sharecard-dl");return node&&node.getAttribute("download")==="marketa-behdad-hamid.png"&&node;},1800);',
  ' report.afterEight={card:!!card,matching:!!link,image:!!(card&&card.querySelector(".sharecard-img").getAttribute("src"))};',
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
check(r && r.quietParty.message && !r.quietParty.card && !r.quietParty.cake,
  "ordinary Party shows only the greeting, with no automatic cake or postcard", r && r.quietParty);
check(r && r.partyStart.party && r.partyStart.row && r.partyStart.sender === "behdad" &&
    /birthday.*Markéta/i.test(r.partyStart.body) && r.partyStart.arrow && r.partyStart.standard && r.partyStart.label === "",
  "actual Shift+P releases the greeting with the standard arrow-only action", r && r.partyStart);
check(r && r.celebrate.cake && !r.celebrate.card,
  "the actual message action starts the cake without opening the postcard", r && r.celebrate);
check(r && !r.beforeEight.card && r.afterEight.card && r.afterEight.matching && r.afterEight.image,
  "the real matching postcard opens only after the fixed eight-second beat", { before: r && r.beforeEight, after: r && r.afterEight });
check(r && r.repeat.available, "the birthday action remains available after closing the postcard", r && r.repeat);
check(r && r.errors.length === 0, "no uncaught JavaScript errors", r && r.errors);

console.log("loft-day.html birthday ribbon flow:");
var banner = lib.runPageSync("loft-day.html", BANNER_HARNESS, 19000, {
  patchRaf: true,
  forceMotion: true,
  seedRandom: true,
  urlSuffix: "?date=2031-08-12&birthday-banner-regression=1"
});

check(banner && banner.before.splash && banner.before.banner && !banner.before.party && !banner.before.card && !banner.before.cake,
  "the birthday ribbon is available without auto-starting its ceremony", banner && banner.before);
check(banner && banner.started.started && banner.started.phase2 && banner.started.party && banner.started.room === "garden" &&
    banner.started.message && banner.started.cake && !banner.started.card,
  "the real ribbon fast-forwards to Party, delivers the greeting, and starts the cake", banner && banner.started);
check(banner && !banner.beforeEight.card && banner.afterEight.card && banner.afterEight.matching && banner.afterEight.image,
  "the ribbon-owned matching postcard waits for the same eight-second beat", { before: banner && banner.beforeEight, after: banner && banner.afterEight });
check(banner && banner.errors.length === 0, "the ribbon path has no uncaught JavaScript errors", banner && banner.errors);

console.log("");
if (failures) { console.log(failures + " birthday UI assertion" + (failures === 1 ? "" : "s") + " failed."); process.exit(1); }
console.log("All checks passed.");

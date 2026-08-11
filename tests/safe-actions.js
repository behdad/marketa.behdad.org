#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},250);});',
  'async function run(){',
  'window.__secondRound=true;window.__firstDanceOn=false;window.__slowDanceOn=false;window.__toastsOn=false;window.__groupPhotoOn=false;window.__sparklersOn=false;window.__cakeOn=false;window.__bouquetOn=false;',
  'window.__loftAwaitLifecycle=function(active,options){return new Promise(function(resolve,reject){var saw=!!active(),started=Date.now();function poll(){var on=!!active();saw=saw||on;if(saw&&!on){resolve(options&&typeof options.value==="function"?options.value():options&&options.value);return;}if(!saw&&Date.now()-started>250){reject(new Error((options&&options.label||"action")+" did not start."));return;}setTimeout(poll,5);}poll();});};',
  'var calls=[],events=[];window.addEventListener("loft:statechange",function(e){events.push(e.detail);});',
  'window.firstdance=function(){calls.push("first-dance");return true;};',
  'var moment=await window.loft.api.perform("garden.moment.start",{moment:"first-dance"},{source:"messages-chat"});window.__firstDanceOn=true;var overlap=await window.loft.api.perform("garden.moment.start",{moment:"cake"},{source:"charlie-chat"});window.__firstDanceOn=false;var badMoment=await window.loft.api.perform("garden.moment.start",{moment:"birthday-cake"});S("moment",{moment:moment,overlap:overlap,bad:badMoment,calls:calls.slice(),events:events.slice()});',
  'window.__chatPhoneState=function(){return {open:false,call:null};};function shortCall(kind){var ring=document.createElement("div");ring.className="call-ring show";document.body.appendChild(ring);setTimeout(function(){ring.remove();},30);calls.push(kind);return true;}window.__madlaRing=function(){return shortCall("madla-ring");};window.__pragueRing=function(){return shortCall("prague-ring");};window.__maxUnlocked=function(){return 4;};window.__laptopCall=function(who){var laptop=document.getElementById("office-laptop");laptop.classList.add("calling");setTimeout(function(){laptop.classList.remove("calling");},30);calls.push("video:"+who);return true;};',
  'var incoming=await window.loft.api.perform("call.incoming.trigger",{caller:"madla"},{source:"messages-chat"});var video=await window.loft.api.perform("call.video.start",{contact:"lubeck"},{source:"charlie-chat"});window.__openMonitorApp=function(name){var monitor=document.getElementById("office-monitor");monitor.classList.add("show-family");setTimeout(function(){monitor.classList.remove("show-family");},30);calls.push("monitor:"+name);return "queued";};var tehran=await window.loft.api.perform("call.video.start",{contact:"tehran"},{source:"charlie-chat"});S("calls",{incoming:incoming,video:video,tehran:tehran,calls:calls.slice()});',
  'window.__arcadeState=function(){return {active:false};};window.__flairState=function(){return {active:false};};var ambientMaking=false;window.__ambientMaking=function(){return ambientMaking;};window.__userMixing=function(){return false;};window.__bartenderDragging=function(){return false;};window.__makeCocktail=function(name,night){ambientMaking=true;setTimeout(function(){ambientMaking=false;},30);calls.push("cocktail:"+name+":"+night);return "ordered";};window.mixer=function(name){calls.push("mixer:"+name);return Promise.resolve({completed:true});};',
  'var cocktail=await window.loft.api.perform("kitchen.cocktail.make",{drink:"negroni"},{source:"messages-chat"});var mixer=await window.loft.api.perform("kitchen.mixer.start",{recipe:"yale"},{source:"charlie-chat"});var badDrink=await window.loft.api.perform("kitchen.cocktail.make",{drink:"beer"});S("bar",{cocktail:cocktail,mixer:mixer,bad:badDrink,calls:calls.slice()});',
  'window.goToStage=function(room){window.currentStageName=room;calls.push("room:"+room);};window.__startArcade=function(){calls.push("invaders");};window.__startFlairCatch=function(){calls.push("flair-catch");};window.__barUpNow=function(){return true;};',
  'var invaders=await window.loft.api.perform("minigame.start",{game:"invaders"},{source:"messages-chat"});var flair=await window.loft.api.perform("minigame.start",{game:"flair-catch"},{source:"charlie-chat"});S("games",{invaders:invaders,flair:flair,calls:calls.slice()});',
  'window.chase=function(){calls.push("kids-chase");return Promise.resolve({completed:true});};window.butterfly=function(){calls.push("butterfly");return Promise.resolve({completed:true});};window.rainbow=function(){calls.push("rainbow");return Promise.resolve({completed:true});};',
  'var chase=await window.loft.api.perform("scene.activity.start",{activity:"kids-chase"},{source:"messages-chat"});var butterfly=await window.loft.api.perform("scene.activity.start",{activity:"butterfly"},{source:"charlie-chat"});var rainbow=await window.loft.api.perform("scene.activity.start",{activity:"rainbow"},{source:"messages-chat"});',
  'var caps=window.loft.api.capabilities({kind:"action",available:true}).map(function(x){return x.id;});S("scene",{chase:chase,butterfly:butterfly,rainbow:rainbow,caps:caps,calls:calls.slice(),events:events.slice()});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html safe typed actions:");
var result = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps;
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.moment.moment.ok && s.moment.calls[0] === "first-dance" && !s.moment.overlap.ok && s.moment.overlap.code === "NOT_AVAILABLE" && !s.moment.bad.ok && s.moment.bad.code === "INVALID_ARGUMENT", "party moments are enum-validated and cannot overlap", s.moment);
check(s.calls.incoming.ok && s.calls.incoming.value.completed && s.calls.video.ok && s.calls.video.value.contact === "lubeck" && s.calls.video.value.completed && s.calls.tehran.ok && s.calls.tehran.value.contact === "tehran" && s.calls.tehran.value.completed && s.calls.calls.includes("madla-ring") && s.calls.calls.includes("video:lueb") && s.calls.calls.includes("monitor:tehran"), "incoming, laptop, and monitor calls use only authored destinations and settle after completion", s.calls);
check(s.bar.cocktail.ok && s.bar.cocktail.value.drink === "negroni" && s.bar.mixer.ok && s.bar.mixer.value.recipe === "yale" && !s.bar.bad.ok && s.bar.bad.code === "INVALID_ARGUMENT" && s.bar.calls.includes("cocktail:Negroni:true") && s.bar.calls.includes("mixer:yale"), "bar actions use the fixed cocktail and mixer menus", s.bar);
check(s.games.invaders.ok && s.games.flair.ok && s.games.calls.includes("invaders") && s.games.calls.includes("flair-catch") && s.games.calls.includes("room:office") && s.games.calls.includes("room:kitchen"), "both hidden games start through their authored hooks", s.games);
check(s.scene.chase.ok && s.scene.butterfly.ok && s.scene.rainbow.ok && ["garden.moment.start","call.incoming.trigger","call.video.start","kitchen.cocktail.make","kitchen.mixer.start","minigame.start","scene.activity.start"].every(function(id){return s.scene.caps.includes(id);}) && s.scene.events.some(function(e){return e.id==="scene.activity.start"&&e.source==="messages-chat";}), "safe scene actions are advertised and preserve action source", s.scene);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

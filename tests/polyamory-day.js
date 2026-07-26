#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function day(host,n){return [].find.call(host.querySelectorAll(".calx-day:not(.calx-out)"),function(e){var x=e.querySelector(".calx-num");return x&&x.textContent.trim()===String(n);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' document.hasFocus=function(){return true;};window.__gameStarted=function(){return true;};',
  ' window.__jumpToDate(2027,10,23);window.__openPhoneAppHere("calendar");await sleep(50);',
  ' var ph=document.querySelector(".calx-phone"),d23=day(ph,23);',
  ' S("english",{label:d23&&d23.getAttribute("aria-label"),icon:d23&&d23.querySelector(".calx-mk")&&d23.querySelector(".calx-mk").textContent,banner:document.getElementById("occasion-banner")&&document.getElementById("occasion-banner").textContent});',
  ' setLang("cs");await sleep(30);ph=document.querySelector(".calx-phone");d23=day(ph,23);S("czech",{label:d23&&d23.getAttribute("aria-label")});',
  ' setLang("en");ph=document.querySelector(".calx-phone");d23=day(ph,23);party(true);await sleep(30);d23.click();await sleep(700);',
  ' var pair=document.getElementById("cuddly-polyamory-pair");S("activate",{phone:!!document.querySelector(".phone-backdrop.show"),room:window.currentStageName,day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),partyOn:document.getElementById("loft-game-strip").classList.contains("party-on"),opacity:getComputedStyle(pair).opacity,roster:(window.__whoIsHere("cuddly")||[]).map(function(p){return p.key;})});',
  ' party(true);await sleep(80);S("party",{visibility:getComputedStyle(pair).visibility,on:document.getElementById("loft-game-strip").classList.contains("party-on")});party(false);',
  ' window.__jumpToDate(2027,10,24);await sleep(700);S("leave",{day:document.getElementById("loft-game-strip").classList.contains("polyamory-day"),opacity:getComputedStyle(pair).opacity});',
  ' var raffiArm=document.querySelector(".g-raffi .guest-arm-l"),raffiOrigin=raffiArm&&getComputedStyle(raffiArm).transformOrigin.split(" ");',
  ' S("models",{floor:!!document.querySelector(".g-chinnel")&&!!document.querySelector(".g-raffi"),bar:!!document.querySelector(".bc-chinnelraffi"),office:!!document.querySelector(".of-chinnelraffi"),balcony:!!document.getElementById("bh-chinnel")&&!!document.getElementById("bh-raffi"),raffiArmTop:!!raffiOrigin&&Math.abs(parseFloat(raffiOrigin[1]))<0.1});',
  ' window.__jumpToDate(2027,7,26);S("chinnelBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-chinnel"),bust:/calx-bust/.test(window.__bdPortrait({who:"chinnel",type:"hat"}))});',
  ' window.__jumpToDate(2027,8,26);S("raffiBirthday",{active:document.getElementById("loft-game-strip").classList.contains("bd-raffi"),bust:/calx-bust/.test(window.__bdPortrait({who:"raffi",type:"hat"}))});',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},300);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html World Polyamory Day:");
var r = lib.runPageSync("rsvp.html", HARNESS, 3800, { patchRaf: true, seedRandom: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.english && s.english.label === "23. World Polyamory Day" && /👨/.test(s.english.icon || "") &&
  s.english.banner === "World Polyamory Day", "November 23 is named in the English calendar and banner", s.english);
check(s.czech && s.czech.label === "23. Světový den polyamorie", "the occasion has a Czech calendar name", s.czech);
check(s.activate && !s.activate.phone && s.activate.room === "cuddly" && s.activate.day && !s.activate.partyOn &&
  s.activate.opacity === "1" && s.activate.roster.indexOf("chinnel") >= 0 && s.activate.roster.indexOf("raffi") >= 0,
  "activating the day stops the party, closes Calendar and gathers all four people in Cuddly", s.activate);
check(s.party && s.party.on && s.party.visibility === "hidden", "the couch pair yields to party mode", s.party);
check(s.leave && !s.leave.day && s.leave.opacity === "0", "leaving November 23 tears down the couch scene", s.leave);
check(s.models && s.models.floor && s.models.bar && s.models.office && s.models.balcony && s.models.raffiArmTop,
  "both travel buddies have floor, balcony, bar and office art, with Raffi's hanging arm pivoted at its top", s.models);
check(s.chinnelBirthday && s.chinnelBirthday.active && s.chinnelBirthday.bust,
  "Chinnel's August 26 birthday has a portrait", s.chinnelBirthday);
check(s.raffiBirthday && s.raffiBirthday.active && s.raffiBirthday.bust,
  "Raffi's September 26 birthday has a portrait", s.raffiBirthday);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

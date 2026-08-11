#!/usr/bin/env node
// Freezing-weather balcony play follows the physical door and keeps cold-weather
// party messaging coherent with the outdoor thermometer.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){try{',
  ' Math.random=function(){return .999;};window.__setSecondRound(true,{releaseHeld:false});window.__goToStage("balcony");window.__setDayNight(false);window.__setOutdoorTemp(-5);',
  ' report.steps.closed={snowman:!!window.__snowmanOn,door:document.getElementById("balcony-door").classList.contains("open")};',
  ' document.getElementById("balcony-door").dispatchEvent(new MouseEvent("click",{bubbles:true}));',
  ' var kids=[document.getElementById("balcony-snowman-kidL"),document.getElementById("balcony-snowman-kidR")];',
  ' report.steps.open={snowman:!!window.__snowmanOn,door:document.getElementById("balcony-door").classList.contains("open"),transform:document.getElementById("balcony-snowman").getAttribute("transform"),bodyTransform:document.getElementById("balcony-snowman-body").getAttribute("transform"),kids:kids.filter(function(k){return !k.classList.contains("balcony-kid-empty");}).length,names:window.__balconyPlayKidsNow()};',
  ' report.steps.corners={leafpile:document.getElementById("balcony-leafpile").getAttribute("transform"),blossom:document.getElementById("balcony-blossom").getAttribute("transform"),sprinkler:document.getElementById("balcony-sprinkler").getAttribute("transform")};',
  ' window.__setDayNight(true);report.steps.freezingTexts=window.__partyTextChoices();window.__setOutdoorTemp(5);report.steps.mildTexts=window.__partyTextChoices();',
  ' window.__setDayNight(false);window.__setOutdoorTemp(10);',
  ' function playState(){var s=window.__seasonDate(),strip=document.getElementById("loft-game-strip");return {snowman:!!window.__snowmanOn,leafpile:!!window.__leafpileOn,blossom:!!window.__blossomPlayOn,sprinkler:!!window.__sprinklerOn,summer:!!window.__summerSeason(),autumnPlay:!!window.__autumnPlaySeason(),autumnDecor:strip.classList.contains("season-autumn"),calendar:window.__calSeasonKey(s.m,s.d,s.y)};}',
  ' window.__jumpToDate(2027,3,15);report.steps.april15=playState();',
  ' window.__jumpToDate(2027,5,2);report.steps.june2=playState();',
  ' window.__jumpToDate(2027,8,21);report.steps.sep21=playState();',
  ' window.__jumpToDate(2027,8,22);report.steps.sep22=playState();',
  ' window.__jumpToDate(2027,9,15);report.steps.oct15=playState();',
  ' window.__jumpToDate(2027,9,16);report.steps.oct16=playState();',
  ' function ch(y,m,d){window.__jumpToDate(y,m,d);return document.getElementById("loft-game-strip").classList.contains("season-chaharshanbe");}',
  ' report.steps.chaharshanbe={mar16:ch(2026,2,16),mar17:ch(2026,2,17),mar18:ch(2026,2,18)};',
  ' var host=document.getElementById("bh-behdad");host.classList.add("bh-present");',
  ' function hostDisplay(y,m,d){window.__jumpToDate(y,m,d);return getComputedStyle(host).display;}',
  ' report.steps.fireHosts={ordinary:hostDisplay(2026,2,16),chaharshanbe:hostDisplay(2026,2,17),svatojanska:hostDisplay(2027,5,23)};',
  ' window.__jumpToDate(2027,5,2);window.__calStepDay(1);var nextDay=window.__now();window.__calStepDay(-1);var prevDay=window.__now();report.steps.daySteps={buttons:!!document.getElementById("loft-dateprevday")&&!!document.getElementById("loft-datenextday"),next:[nextDay.getFullYear(),nextDay.getMonth(),nextDay.getDate()],back:[prevDay.getFullYear(),prevDay.getMonth(),prevDay.getDate()]};',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},450);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html freezing balcony play:");
var r = lib.runPageSync("rsvp.html", HARNESS, 2600, { patchRaf: true, forceMotion: true });
if (!r) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = r.steps;
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(s.closed && !s.closed.door && !s.closed.snowman, "a shut balcony door does not send the kids outside", s.closed);
check(s.open && s.open.door && s.open.snowman, "opening the balcony door starts freezing-weather snowman play", s.open);
check(s.open && s.open.transform === "translate(470,0)", "the snowman scene sits 30px farther right", s.open);
check(s.open && s.open.bodyTransform === "translate(10,0)", "only the snowman body gets the final 10px nudge", s.open);
check(s.open && s.open.kids === 2 && s.open.names.length === 2, "the visible snowman has two children playing beside it", s.open);
check(s.corners && s.corners.leafpile === "translate(440,0)" && s.corners.blossom === "translate(440,0)" && s.corners.sprinkler === "translate(440,0)",
  "autumn, spring, and summer play share the right-side balcony corner", s.corners);
check(s.freezingTexts && s.freezingTexts.indexOf("smores") === -1, "freezing weather suppresses Bahareh's s'mores invitation", s.freezingTexts);
check(s.mildTexts && s.mildTexts.indexOf("smores") !== -1, "a mild night keeps the s'mores invitation eligible", s.mildTexts);
check(s.april15 && s.april15.blossom, "April 15 deterministically starts blossom play", s.april15);
check(s.june2 && s.june2.sprinkler, "June 2 deterministically starts water-balloon/sprinkler play", s.june2);
check(s.sep21 && s.sep21.summer && s.sep21.sprinkler && !s.sep21.autumnPlay && !s.sep21.autumnDecor && s.sep21.calendar === "summer",
  "September 21 remains summer across climate, calendar, decor, and balcony play", s.sep21);
check(s.sep22 && !s.sep22.summer && !s.sep22.sprinkler && s.sep22.autumnPlay && s.sep22.autumnDecor && s.sep22.leafpile && s.sep22.calendar === "autumn",
  "September 22 starts autumn across climate, calendar, decor, and balcony play", s.sep22);
check(s.oct15 && s.oct15.leafpile,
  "leaf-pile play continues through October 15", s.oct15);
check(s.oct16 && !s.oct16.snowman && !s.oct16.leafpile && !s.oct16.blossom && !s.oct16.sprinkler,
  "leaf-pile play ends after October 15", s.oct16);
check(s.chaharshanbe && !s.chaharshanbe.mar16 && s.chaharshanbe.mar17 && !s.chaharshanbe.mar18,
  "Chaharshanbe Suri decor is limited to its computed day", s.chaharshanbe);
check(s.fireHosts && s.fireHosts.ordinary !== "none" && s.fireHosts.chaharshanbe === "none" && s.fireHosts.svatojanska === "none",
  "the ordinary balcony hosts disappear while their fire-jumping doubles are active", s.fireHosts);
check(s.daySteps && s.daySteps.buttons && s.daySteps.next.join("-") === "2027-5-3" && s.daySteps.back.join("-") === "2027-5-2",
  "the date control exposes stable previous/next-day steps", s.daySteps);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

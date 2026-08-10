#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],states:{}};function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'function snap(){var room=document.getElementById("entrance-room"),rain=document.querySelector(".entrance-rain-weather"),snow=document.querySelector(".entrance-snow-flakes"),cloud=document.querySelector(".entrance-cloud-wash"),facade=document.querySelector(".entrance-wet-facade"),wet=document.querySelector(".entrance-wet-walk"),car=document.getElementById("entrance-porsche"),rainbow=document.getElementById("balcony-rainbow");function before(a,b){return !!(a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);}return {classes:room.className.baseVal||room.className,rain:parseFloat(getComputedStyle(rain).opacity),snow:parseFloat(getComputedStyle(snow).opacity),cloud:parseFloat(getComputedStyle(cloud).opacity),wet:parseFloat(getComputedStyle(wet).opacity),rainbow:rainbow.classList.contains("after-rain"),nodes:document.querySelectorAll("#entrance-weather *,#entrance-weather-wash *").length,streaks:document.querySelectorAll(".entrance-rain-streak").length,caps:document.querySelectorAll("#entrance-architectural-snow path").length,depth:{wetBeforeCloud:before(wet,cloud),cloudBeforeFacade:before(cloud,facade),facadeBeforeCar:before(facade,car),carBeforeRain:before(car,rain),carBeforeSnow:before(car,snow)}};}',
  'function clear(){window.__setBalconyRain(false,"test");window.__setBalconySnow(false,"test");window.__setBalconyStormLayer(false,"test");window.__setBalconyOvercast(false,"test");}',
  'window.addEventListener("load",function(){setTimeout(async function(){try{',
  ' Object.defineProperty(document,"hasFocus",{value:function(){return true;},configurable:true});var balcony=document.getElementById("stage-balcony"),rainbow=document.getElementById("balcony-rainbow");window.currentStageName="balcony";window.__roomAutonomyAllowed=function(room){return room==="balcony";};rainbow.style.animation="none";document.querySelectorAll("#entrance-weather *,#entrance-weather-wash *,.entrance-wet-walk").forEach(function(el){el.style.transition="none";});clear();await sleep(20);report.states.clear=snap();',
  ' window.__setBalconyRain(true,"test");await sleep(20);report.states.rain=snap();',
  ' window.__setBalconySnow(true,"test");await sleep(20);report.states.snowWins=snap();',
  ' clear();window.__setBalconyStormLayer(true,"test");await sleep(20);report.states.dryStorm=snap();',
  ' clear();window.__setBalconyOvercast(true,"test");await sleep(20);report.states.overcast=snap();',
  ' clear();var seasonalSnow=window.__snowsOnItsOwn;window.__snowsOnItsOwn=function(){return true;};window.__applyRealWx();await sleep(20);report.states.seasonalSnow=snap();window.__snowsOnItsOwn=seasonalSnow;',
  ' clear();await sleep(1200);report.states.after=snap();',
  ' rainbow.classList.remove("after-rain","burst");balcony.classList.remove("dusk");clear();window.__setBalconyRain(true,"test");await sleep(20);window.__setBalconyRain(false,"test");await sleep(60);report.states.postRain=snap();',
  ' rainbow.classList.remove("after-rain","burst");window.__setBalconyOvercast(true,"test");window.__setBalconyRain(true,"test");await sleep(20);window.__setBalconyRain(false,"test");await sleep(60);report.states.postRainOvercast=snap();window.__setBalconyOvercast(false,"test");await sleep(60);report.states.postRainCleared=snap();',
  ' rainbow.classList.remove("after-rain","burst");balcony.classList.add("dusk");clear();window.__setBalconyRain(true,"test");await sleep(20);window.__setBalconyRain(false,"test");await sleep(60);report.states.postRainNight=snap();',
  '}catch(e){window.__errs.push("harness: "+String(e&&e.stack||e));}',
  'report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);},220);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}
function has(state, cls) {
  return !!state && (" " + state.classes + " ").indexOf(" " + cls + " ") !== -1;
}

console.log("rsvp.html Entrance weather:");
var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.states || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.clear && !has(s.clear, "entrance-clouded") && !has(s.clear, "entrance-raining") &&
  !has(s.clear, "entrance-snowing") && s.clear.rain === 0 && s.clear.snow === 0,
  "clear weather leaves the facade undressed", s.clear);
check(s.rain && has(s.rain, "entrance-clouded") && has(s.rain, "entrance-raining") &&
  !has(s.rain, "entrance-snowing") && s.rain.rain > 0 && s.rain.wet > 0 && s.rain.cloud > 0,
  "the shared rain layer wets the facade and sidewalk under cloud", s.rain);
check(s.snowWins && has(s.snowWins, "entrance-raining") && has(s.snowWins, "entrance-snowing") &&
  s.snowWins.rain === 0 && s.snowWins.snow > 0 && s.snowWins.caps === 11,
  "snow settles on the rainy facade and suppresses rain streaks", s.snowWins);
check(s.dryStorm && has(s.dryStorm, "entrance-clouded") && !has(s.dryStorm, "entrance-raining") &&
  s.dryStorm.rain === 0 && s.dryStorm.wet === 0,
  "a dry lightning storm clouds Entrance without inventing rain", s.dryStorm);
check(s.overcast && has(s.overcast, "entrance-clouded") && !has(s.overcast, "entrance-raining") &&
  !has(s.overcast, "entrance-snowing") && s.overcast.cloud > 0,
  "plain overcast shares only the cloud wash", s.overcast);
check(s.seasonalSnow && has(s.seasonalSnow, "entrance-clouded") &&
  has(s.seasonalSnow, "entrance-snowing") && s.seasonalSnow.snow > 0,
  "the Balcony's seasonal snow roll settles on Entrance too", s.seasonalSnow);
check(s.clear && s.after && s.clear.nodes === s.after.nodes && s.clear.streaks === 7 &&
  s.after.streaks === 7,
  "weather toggles and an ambient tick keep a fixed particle inventory",
  { before: s.clear, after: s.after });
check(s.rain && s.rain.depth && s.rain.depth.wetBeforeCloud && s.rain.depth.cloudBeforeFacade &&
  s.rain.depth.facadeBeforeCar && s.rain.depth.carBeforeRain && s.rain.depth.carBeforeSnow,
  "broad pavement weather stays behind the car while falling rain and snow remain foreground precipitation",
  s.rain && s.rain.depth);
check(s.postRain && s.postRain.rainbow,
  "a clear attended daytime balcony gets a restrained rainbow after rain", s.postRain);
check(s.postRainOvercast && !s.postRainOvercast.rainbow &&
  s.postRainCleared && s.postRainCleared.rainbow,
  "post-rain overcast delays the rainbow until the cloud deck clears",
  { overcast: s.postRainOvercast, cleared: s.postRainCleared });
check(s.postRainNight && !s.postRainNight.rainbow,
  "post-rain night keeps the existing dark sky untouched", s.postRainNight);

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
check(/entrance\.classList\.toggle\("entrance-raining", rain\)/.test(source) &&
  /entrance\.classList\.toggle\("entrance-snowing", snow\)/.test(source) &&
  /previousRain === true/.test(source) && /postRainRainbowAllowed\(clouded\)/.test(source),
  "Entrance derives presentation from the shared weather writer");

console.log("");
if (failures) {
  console.log(failures + " Entrance-weather assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Entrance-weather assertions passed.");

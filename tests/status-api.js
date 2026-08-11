#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},300);});',
  'async function run(){',
  ' var oldMax=window.__maxUnlocked,oldSolved=window.__solvedRooms,oldRoomSolved=window.__roomSolved,oldPhone=window.__chatPhoneState,oldMessages=window.__chatMessagesSummary,oldArcade=window.__arcadeState,oldFlair=window.__flairState,oldContext=window.__chatContext,oldIndoor=window.__indoorTempState,oldOutdoor=window.__outdoorTempC;',
  ' window.__secondRound=true;window.__currentStageName="office";window.__maxUnlocked=function(){return 3;};window.__solvedRooms=function(){return ["kitchen","garden","cuddly"];};window.__roomSolved=function(room){return window.__solvedRooms().indexOf(room)!==-1;};window.__chatPhoneState=function(){return {open:true,app:"messages",call:null};};window.__chatMessagesSummary=function(){return {total:7,unread:2,recent:[{id:"safe-id",sender:"Athena",outgoing:false,read:false}]};};',
  ' window.__arcadeState=function(){return {active:false,raf:999,aliens:4,shots:2};};window.__flairState=function(){return {active:true,raf:888,items:12,score:6,miss:1,high:9};};',
  ' window.__chatContext=function(){return {daylight:false,environment:{uv:true,eclipse:"lunar",aurora:{showing:true,kp:5},moon:{name:"full"}}};};window.__indoorTempState=function(){return {temperature_c:25,room:"garden",occupancy_count:9,occupancy_gain_c:3};};window.__outdoorTempC=function(){return 14;};',
  ' var smoker=document.getElementById("balcony-smoker");if(smoker)smoker.classList.add("smoking","open");var balcony=document.getElementById("stage-balcony");if(balcony)balcony.classList.add("lunar-eclipse");var strip=document.getElementById("loft-game-strip");if(strip)strip.classList.add("uv-mode");window.__bbqPartySessionOn=true;',
  ' var laptop=document.getElementById("office-laptop");if(laptop)laptop.classList.add("connecting");var ring=document.createElement("div");ring.className="call-ring show";document.body.appendChild(ring);',
  ' var q={progress:window.loft.api.query("game.progress"),busy:window.loft.api.query("game.busy"),rooms:window.loft.api.query("room.list"),bbq:window.loft.api.query("balcony.bbq.status"),projector:window.loft.api.query("cuddly.projector.status"),currentApp:window.loft.api.query("app.current"),apps:window.loft.api.query("apps.list"),calls:window.loft.api.query("calls.status"),messages:window.loft.api.query("messages.summary"),games:window.loft.api.query("minigames.status"),environment:window.loft.api.query("scene.environment")};S("queries",q);',
  ' var calls=[];window.__loftControllers.rain={status:function(){return !!window.__wxRain;},set:function(on){window.__wxRain=!!on;calls.push("rain:"+on);return !!window.__wxRain;}};window.__loftControllers.storm={status:function(){return !!window.__wxStorm;},set:function(on){window.__wxStorm=!!on;calls.push("storm:"+on);return !!window.__wxStorm;}};window.__loftControllers.overcast={status:function(){return !!window.__wxOvercast;},set:function(on){window.__wxOvercast=!!on;calls.push("overcast:"+on);return !!window.__wxOvercast;}};',
  ' var thunder=await window.loft.api.perform("weather.scene.set",{mode:"thunderstorm"},{source:"test"});var clear=await window.loft.api.perform("weather.scene.set",{mode:"clear"},{source:"test"});var badWeather=await window.loft.api.perform("weather.scene.set",{mode:"hail"},{source:"test"});',
  ' var auroraOn=false,twilightOn=false;window.__loftControllers.aurora={status:function(){return auroraOn;},set:function(on){auroraOn=!!on;calls.push("aurora:"+on);return auroraOn;}};window.__loftControllers.twilight={status:function(){return twilightOn;},set:function(on){twilightOn=!!on;calls.push("twilight:"+on);return twilightOn;}};window.__auroraStatus=function(){return {showing:auroraOn,kp:7};};window.__setTwilight=function(){return twilightOn;};',
  ' var aurora=await window.loft.api.perform("sky.effect.set",{effect:"aurora"},{source:"test"});var twilight=await window.loft.api.perform("sky.effect.set",{effect:"twilight"},{source:"test"});var none=await window.loft.api.perform("sky.effect.set",{effect:"none"},{source:"test"});var badSky=await window.loft.api.perform("sky.effect.set",{effect:"eclipse"},{source:"test"});S("actions",{thunder:thunder,clear:clear,badWeather:badWeather,aurora:aurora,twilight:twilight,none:none,badSky:badSky,calls:calls});',
  ' window.__maxUnlocked=oldMax;window.__solvedRooms=oldSolved;window.__roomSolved=oldRoomSolved;window.__chatPhoneState=oldPhone;window.__chatMessagesSummary=oldMessages;window.__arcadeState=oldArcade;window.__flairState=oldFlair;window.__chatContext=oldContext;window.__indoorTempState=oldIndoor;window.__outdoorTempC=oldOutdoor;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html bounded status and environment API:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3200, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var q = result.steps.queries || {}, a = result.steps.actions || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(q.progress.ok && q.progress.value.phase === 2 && q.progress.value.current_room === "office" && q.progress.value.unlocked_rooms.length === 8 && q.progress.value.solved_rooms.length === 3, "game.progress reports all unlocked upper and paired lower rooms", q.progress);
check(q.busy.ok && q.busy.value.busy && q.busy.value.reasons.includes("flair-catch") && q.busy.value.reasons.includes("call") && !q.busy.value.reasons.includes("raf"), "game.busy exposes bounded authored reasons", q.busy);
check(q.rooms.ok && q.rooms.value.length === 10 && q.rooms.value[3].current && q.rooms.value[3].unlocked && !q.rooms.value[3].solved && !q.rooms.value[4].unlocked && q.rooms.value[8].id === "bedroom" && q.rooms.value[8].unlocked, "room.list covers ten rooms while keeping unlocked and solved state independent", q.rooms);
check(q.bbq.ok && q.bbq.value.on && q.bbq.value.smoking && q.bbq.value.open && q.bbq.value.party_split, "balcony.bbq.status reflects both smoker and party split state", q.bbq);
check(q.projector.ok && Object.keys(q.projector.value).sort().join(",") === "mode,on,room", "cuddly.projector.status stays compact", q.projector);
check(q.currentApp.ok && q.currentApp.value.phone === "messages" && q.currentApp.value.phone_open && q.apps.ok && q.apps.value.monitor.length > 10 && q.apps.value.phone.length > 10, "app queries reuse the canonical current state and public catalogs", { current: q.currentApp, counts: q.apps.ok && [q.apps.value.monitor.length,q.apps.value.phone.length] });
check(q.calls.ok && q.calls.value.busy && q.calls.value.incoming && q.calls.value.laptop.active && q.calls.value.laptop.status === "connecting", "calls.status summarizes active authored call surfaces with lifecycle detail", q.calls);
check(q.messages.ok && q.messages.value.total === 7 && q.messages.value.unread === 2 && q.messages.value.recent[0].id === "safe-id" && !Object.prototype.hasOwnProperty.call(q.messages.value.recent[0], "text"), "messages.summary exposes counts and metadata without message bodies", q.messages);
check(q.games.ok && q.games.value.active === "flair-catch" && q.games.value.flair_catch.score === 6 && !Object.prototype.hasOwnProperty.call(q.games.value.invaders, "raf"), "minigames.status omits animation handles and arrays", q.games);
check(q.environment.ok && q.environment.value.indoor_temperature.temperature_c === 25 && q.environment.value.indoor_temperature.occupancy_count === 9 && q.environment.value.outdoor_temperature_c === 14 && q.environment.value.eclipse === "lunar", "scene.environment includes the exact bounded mini-split and scene readings", q.environment);
check(a.thunder.ok && a.thunder.value.rain && a.thunder.value.storm && !a.thunder.value.overcast && a.clear.ok && !a.clear.value.rain && !a.clear.value.storm && !a.clear.value.overcast && !a.badWeather.ok && a.badWeather.code === "INVALID_ARGUMENT", "weather.scene.set accepts only four fixed scene presets", a);
check(a.aurora.ok && a.aurora.value.aurora.showing && !a.aurora.value.twilight && a.twilight.ok && !a.twilight.value.aurora.showing && a.twilight.value.twilight && a.none.ok && !a.none.value.aurora.showing && !a.none.value.twilight && !a.badSky.ok && a.badSky.code === "INVALID_ARGUMENT", "sky.effect.set uses mutually exclusive authored aurora/twilight controls", a);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

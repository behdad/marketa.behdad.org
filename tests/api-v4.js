#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,oldMax=window.__maxUnlocked;window.__maxUnlocked=function(){return 4;};window.__secondRound=true;',
  ' var caps=api.capabilities(),groups=api.groups(),rooms=api.query("room.list"),game=api.query("game.status"),manifest=window.__chatApiManifest();',
  ' function D(id,args){var r=api.describe(id,args);return r.ok?r.value:null;}',
  ' var schemas={environment:D("environment.daylight.set",{on:null}),transmission:D("car.transmission.set",{mode:"auto"}),route:D("roadtrip.route.start",{route:"banff"}),stars:D("camping.stargazing.trace",{constellation:"ursa-major",star:3}),trip:D("trip.start",{variant:"molly"}),fishu:D("cuddly.fishu.speak",{}),activity:D("scene.activity.start",{activity:"rainbow"}),caption:D("caption.show",{text:"hello"}),garden:D("garden.set",{on:true}),kitchen:D("kitchen.coffee.make",{})};',
  ' var strictNames=["laser","party","guests","roster","fullscreen","smoker","bbq","smores","snowman","leafpile","blossomplay","sprinkler","kidsAsleep","smokerlid","phone","laptop","computer","cat","dog","irene","mouses","porsche","audio"];',
  ' var strict=strictNames.map(function(name){var value=window[name],rejected=false,callable=true;try{value.set(null);}catch(e){rejected=e instanceof TypeError;}try{value();}catch(e){callable=false;}return {name:name,type:typeof value,frozen:Object.isFrozen(value),status:typeof value.status==="function",set:typeof value.set==="function",rejected:rejected,callable:callable};});',
  ' var envNames=["blacklight","daylight","storm","rain","snow","overcast","wildfires","aurora","twilight"],env=[];',
  ' for(var i=0;i<envNames.length;i++){var name=envNames[i],value=window[name],before=value.mode(),on=value.set(true),onMode=value.mode(),off=value.set(false),offMode=value.mode(),auto=value.set(null),autoMode=value.mode(),stringRejected=false;try{value.set("auto");}catch(e){stringRejected=e instanceof TypeError;}env.push({name:name,frozen:Object.isFrozen(value),on:on,onMode:onMode,off:off,offMode:offMode,auto:auto,autoMode:autoMode,stringRejected:stringRejected,status:typeof value.status()==="boolean"});}',
  ' var pans=0,oldGo=window.goToStage;window.goToStage=function(){pans++;return oldGo.apply(this,arguments);};var partyPromise=window.loft.garden.set(true),partyImmediate=!!window.__gardenPartyOn;await partyPromise;await window.loft.garden.set(false);await window.loft.environment.daylight.set(null);window.goToStage=oldGo;',
  ' var navBar=await api.perform("room.go",{room:"bar"},{source:"test"}),barRoom=api.query("room.current"),navParty=await api.perform("room.go",{room:"party"},{source:"test"}),partyRoom=api.query("room.current");',
  ' var invalidAuto=await api.perform("environment.daylight.set",{on:"auto"},{source:"test"}),invalidGear=await api.perform("car.transmission.set",{mode:"automatic"},{source:"test"});',
  ' var help={all:window.help(),loft:window.help(window.loft),kitchen:window.help(window.loft.kitchen),party:window.help(window.loft.party),weather:window.help(window.loft.weather),rain:window.help(window.loft.weather.rain),rainSet:window.help(window.loft.weather.rain.set),chest:window.help(window.loft.cuddly.chest),string:window.help("kitchen"),legacy:window.help("dance")};',
  ' S("api",{version:api.version,caps:caps,groups:groups,rooms:rooms,game:game,manifest:manifest,schemas:schemas,strict:strict,env:env,aliases:{bar:window.loft.bar===window.loft.kitchen,party:window.loft.party===window.loft.garden,roomBar:barRoom,roomParty:partyRoom,navBar:navBar,navParty:navParty},namespace:{partyImmediate:partyImmediate,pans:pans,chest:typeof window.loft.cuddly.chest.set,oldChest:typeof window.chest,oldPirate:typeof window.piratebox},invalid:{auto:invalidAuto,gear:invalidGear},help:help});',
  ' window.__maxUnlocked=oldMax;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html API v4 surface:");
var result = lib.runPageSync("loft-day.html", HARNESS, 5200, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps.api || {}, caps = s.caps || [], ids = caps.map(function (cap) { return cap.id; }), rooms = s.rooms && s.rooms.value || [];
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.version === 4 && caps.length >= 130 && caps.every(function (cap) {
  return cap.id && cap.group && (cap.kind === "query" || cap.kind === "action") && Array.isArray(cap.argOrder) &&
    (cap.completion === "instant" || cap.completion === "finite") && cap.description && cap.returns && cap.returns.type === "envelope";
}), "v4 exposes a stable, fully described grouped typed catalogue", { version: s.version, count: caps.length });
check(Array.isArray(s.groups) && s.groups.length >= 15 && s.groups.join("\0") === s.groups.slice().sort().join("\0") && s.groups.includes("Entrance / Car") && s.groups.includes("Road Trip") && s.groups.includes("Camping"), "capability groups are stable, sorted, and cover the terminal act", s.groups);
check(rooms.length === 10 && rooms[0].id === "kitchen" && rooms[5].id === "bathroom" && rooms[9].id === "entrance" && rooms[0].aliases.includes("bar") && rooms[1].aliases.includes("party"), "room catalogue covers both floors and canonical aliases", rooms);
check(s.game && s.game.ok && s.game.value.unlocked_rooms.length === 10 && s.game.value.unlocked_rooms.includes("entrance"), "game status reports all unlocked upper and lower rooms", s.game);
check(["caption.show","cuddly.chest.status","cuddly.chest.set","car.status","car.control.set","roadtrip.status","roadtrip.preview.show","camping.fire.place","camping.stew.select","camping.stargazing.trace","camping.finale.advance","session.preview.begin","session.preview.end","game.reset"].every(function (id) { return ids.includes(id); }), "room-owned controls, caption, terminal act, and preview lifecycle are typed", ids.length);
check(s.schemas && s.schemas.environment.args.on.nullable && s.schemas.environment.argOrder.join(",") === "on" && s.schemas.environment.completion === "instant" && s.schemas.transmission.args.mode.enum.join(",") === "auto,manual" && s.schemas.route.args.route.enum.join(",") === "calgary,banff,abraham" && s.schemas.trip.completion === "finite" && s.schemas.fishu.completion === "finite" && s.schemas.activity.completion === "finite" && s.schemas.caption.completion === "instant" && s.schemas.caption.argOrder.join(",") === "text", "argument order, nullable ownership, enums, and lifecycle completion are mechanically discoverable", s.schemas);
check(s.schemas.garden.aliases.includes("party.set") && s.schemas.kitchen.aliases.includes("bar.coffee.make") && caps.every(function (cap) { return Array.isArray(cap.aliases); }), "canonical room aliases are mechanically discoverable without duplicate capability ids", { garden: s.schemas.garden.aliases, kitchen: s.schemas.kitchen.aliases });
check((s.strict || []).every(function (entry) { return entry.type === "object" && entry.frozen && entry.status && entry.set && entry.rejected && !entry.callable; }), "non-environment boolean controls are strict frozen status/set objects", s.strict);
check((s.env || []).length === 9 && s.env.every(function (entry) { return entry.frozen && entry.on === true && entry.onMode === "on" && entry.off === false && entry.offMode === "off" && entry.autoMode === "auto" && entry.stringRejected && entry.status; }), "environment controls accept only true, false, or null and report effective state plus mode", s.env);
check(s.aliases && s.aliases.bar && s.aliases.party && s.aliases.roomBar.value === "kitchen" && s.aliases.roomParty.value === "garden", "bar and party are identity aliases while room results stay canonical", s.aliases);
check(s.namespace && s.namespace.partyImmediate && s.namespace.pans === 0 && s.namespace.chest === "function" && s.namespace.oldChest === "undefined" && s.namespace.oldPirate === "undefined", "namespace setters mutate immediately without panning and publish no chest compatibility globals", s.namespace);
check(s.invalid && !s.invalid.auto.ok && s.invalid.auto.code === "INVALID_ARGUMENT" && !s.invalid.gear.ok && s.invalid.gear.code === "INVALID_ARGUMENT", "string auto and invented controller values fail validation", s.invalid);
check(s.help && s.help.all === s.help.loft && /Loft typed API/.test(s.help.all) && /loft\.kitchen \(alias: loft\.bar\)/.test(s.help.all) && /loft\.garden \(alias: loft\.party\)/.test(s.help.all) && /loft\.weather/.test(s.help.all) && !/loft\.weather\.rain/.test(s.help.all) && !/\.set\(/.test(s.help.all), "bare help and help(loft) stay concise at the top-level namespace boundary", s.help);
check(s.help && /loft\.weather\.rain — namespace/.test(s.help.weather) && !/loft\.weather\.rain\.set/.test(s.help.weather) && /loft\.weather\.rain\.set/.test(s.help.rain) && /boolean\|null/.test(s.help.rainSet) && /automatic environment/.test(s.help.rainSet), "namespace help drills one level at a time and leaf help gives the exact typed contract", s.help);
check(s.help && /loft\.kitchen/.test(s.help.kitchen) && /alias: loft\.bar/.test(s.help.kitchen) && /loft\.kitchen\.coffee — namespace/.test(s.help.kitchen) && !/loft\.kitchen\.coffee\.make/.test(s.help.kitchen) && /loft\.garden/.test(s.help.party) && /alias: loft\.party/.test(s.help.party) && /loft\.cuddly\.chest\.status/.test(s.help.chest) && /loft\.cuddly\.chest\.set/.test(s.help.chest) && s.help.string === s.help.kitchen && /dance\(/.test(s.help.legacy), "string, namespace, alias, nested object, and direct legacy help remain discoverable", s.help);
check(s.manifest && s.manifest.version === "loft-api-4" && s.manifest.typed.length === caps.length && s.manifest.typed.every(function (entry) { return entry.id && entry.kind && Array.isArray(entry.argOrder) && Array.isArray(entry.aliases) && entry.completion && entry.returns; }) && !Object.prototype.hasOwnProperty.call(s.manifest, "globals"), "assistant manifest stays compact and derives from the typed registry", s.manifest && { version: s.manifest.version, count: s.manifest.typed && s.manifest.typed.length, primitives: s.manifest.primitives && s.manifest.primitives.length });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed (" + caps.length + " capabilities).");

#!/usr/bin/env node
// Query-triggered public app knowledge and live environment passed to Charlie.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push("harness: "+String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var wasRound=window.__secondRound;window.__secondRound=true;if(window.__deliverPhoneMessage)window.__deliverPhoneMessage("cue_mail");if(window.__hideMessageThumb)window.__hideMessageThumb();',
  ' var mail=window.__chatContext("What is in the mail inbox?").apps.mail;',
  ' var messages=window.__chatContext("What messages did Bahareh send?").apps.messages;',
  ' var phrasebook=window.__chatContext("Translate this with the Czech phrasebook.").apps.phrasebook;',
  ' var photos=window.__chatContext("Show me the photo album.").apps.album;',
  ' var tattoos=window.__chatContext("Who made the tattoo designs?").apps.tattoos;',
  ' var notes=window.__chatContext("Read the authored love notes.").apps.notes;',
  ' var named=window.__chatContext("Who is Pouria?").apps.contacts;',
  ' var roster=window.__chatContext("Who are all the guests?").apps.contacts;',
  ' var catalog=window.__chatContext("What apps are on the phone and computer?").apps.catalog;',
  ' var ordinary=window.__chatContext("hello there");',
  ' var apiCtx=window.__chatContext("What are the loft.api signatures and how do I write a party script?");',
  ' var broad=window.__chatContext("Who are all the guests and what apps are available?");',
  ' S("sources",{mail:mail,messages:messages,phrasebook:phrasebook,photos:photos,tattoos:tattoos,notes:notes,named:named,roster:roster,catalog:catalog,ordinaryApps:Object.keys(ordinary.apps),api:apiCtx.scripting_api,broadChars:JSON.stringify({message:"Who are all the guests and what apps are available?",history:[],language:"auto",context:broad}).length});',
  ' var oldWx=window.__realWx,oldC=window.__realOutdoorC,oldWp=window.__realWxPrague,oldCp=window.__realPragueC,oldDaily=window.__realDaily,oldRain=window.__wxRain,oldStorm=window.__wxStorm,oldOver=window.__wxOvercast;',
  ' window.__realWx={code:2};window.__realOutdoorC=21.6;window.__realWxPrague={code:61};window.__realPragueC=13.2;window.__realDaily=[{time:["2026-07-21","2026-07-22","2026-07-23","2026-07-24"],code:[0,2,61,95],max:[25,24.6,18.2,16.9],min:[14,12.4,9.8,8.1]},{time:["2026-07-21","2026-07-22","2026-07-23","2026-07-24"],code:[61,3,0,71],max:[18,20.1,23.7,4.3],min:[9,10.2,12.1,-1.2]}];',
  ' window.__wxRain=true;window.__wxStorm=true;window.__wxOvercast=true;var balcony=document.getElementById("stage-balcony"),strip=document.getElementById("loft-game-strip");balcony.classList.add("dusk","solar-eclipse");strip.classList.add("uv-mode");var environment=window.__chatContext("What is the weather forecast during this eclipse?");S("environment",environment);',
  ' balcony.classList.remove("dusk","solar-eclipse");strip.classList.remove("uv-mode");window.__realWx=oldWx;window.__realOutdoorC=oldC;window.__realWxPrague=oldWp;window.__realPragueC=oldCp;window.__realDaily=oldDaily;window.__wxRain=oldRain;window.__wxStorm=oldStorm;window.__wxOvercast=oldOver;',
  ' setLang("cs");await sleep(30);var csCatalog=window.__chatContext("Jaké aplikace jsou v telefonu a na počítači?").apps.catalog;S("csCatalog",csCatalog);setLang("en");window.__secondRound=wasRound;',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  \u2713 " + msg);
  else { failures++; console.log("  \u2717 " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html Charlie app context:");
var r = lib.runPageSync("rsvp.html", HARNESS, 4000, { patchRaf: true });
if (!r) { console.log("  \u2717 harness produced no report"); process.exit(1); }
var s = r.steps, sources = s.sources || {}, env = s.environment || {};
check(r.errors.length === 0, "no uncaught page errors", r.errors);
check(sources.mail && sources.mail.length === 3 && sources.mail.some(function (m) { return m.id === "lore" && /getting married/.test(m.body); }) && sources.mail.every(function (m) { return !Object.prototype.hasOwnProperty.call(m, "draft"); }), "Mail exposes only the three authored inbox messages", sources.mail);
check(sources.messages && sources.messages.length === 1 && sources.messages[0].id === "cue_mail" && /Bahareh/i.test(sources.messages[0].sender) && !/<[^>]+>/.test(sources.messages[0].text), "Messages exposes a bounded plain-text view of the live thread", sources.messages);
check(sources.phrasebook && sources.phrasebook.length === 13 && sources.phrasebook.some(function (p) { return p.english === "One beer, please" && p.czech === "Jedno pivo, prosím"; }), "phrasebook reuses its canonical English-Czech cards", sources.phrasebook);
check(sources.photos && sources.photos.length > 0 && sources.photos.every(function (p) { return Array.isArray(p.people) && !p.src && !p.image && !p.data; }) && !/data:image/.test(JSON.stringify(sources.photos)), "Album exposes photo metadata without pixels or URLs", sources.photos);
check(sources.tattoos && sources.tattoos.length === 6 && sources.tattoos.some(function (t) { return t.artist === "Markéta and Behdad"; }), "tattoo designs retain canonical artist credits", sources.tattoos);
check(sources.notes && sources.notes.length === 15 && sources.notes.every(function (note) { return typeof note === "string"; }) && !/draft/i.test(JSON.stringify(sources.notes)), "Notes exposes only the couple's authored cards, never a visitor draft", sources.notes);
check(sources.named && sources.named.length === 1 && sources.named[0].name === "Pouria" && /bartender/i.test(sources.named[0].role), "a named-person question retrieves only the matching public contact", sources.named);
check(sources.roster && sources.roster.length >= 25 && sources.roster.some(function (p) { return p.name === "Athena" && /wedding boss/i.test(p.role); }), "a generic guest question can retrieve the public cast directory", sources.roster && sources.roster.length);
check(sources.catalog && sources.catalog.monitor.some(function (a) { return a.id === "weather" && a.access === "toolbar"; }) && sources.catalog.phone.some(function (a) { return a.id === "notes" && a.installed; }), "app catalog mirrors monitor and installed phone apps, including toolbar-only Weather", sources.catalog);
check(sources.ordinaryApps && sources.ordinaryApps.length === 0 && sources.broadChars < 30000, "ordinary chat carries no app dump and the broadest retrieval stays below the request cap", { apps: sources.ordinaryApps, chars: sources.broadChars });
check(sources.api && sources.api.typed && sources.api.typed.some(function (entry) { return entry.id === "party.set" && entry.kind === "action" && entry.args.on.type === "boolean"; }) && sources.api.globals && /party\(true\)/.test(sources.api.globals.party) && /sleep\(ms\)/.test(sources.api.globals.sleep), "scripting questions receive typed loft.api schemas and the public global command reference", sources.api && { typed: sources.api.typed && sources.api.typed.length, globals: sources.api.globals && Object.keys(sources.api.globals).length });
check(env.daylight === false && env.environment && env.environment.eclipse === "solar" && env.environment.uv && env.environment.rain && env.environment.storm && env.environment.overcast, "live environment reports night, eclipse, UV, and weather layers", env.environment);
check(env.weather && env.weather.edmonton.temperature_c === 21.6 && env.weather.prague.temperature_c === 13.2 && env.weather.edmonton.forecast.length === 3 && env.weather.prague.forecast.length === 3, "Edmonton and Prague current weather plus three-day forecasts share the apps' model", env.weather);
check(s.csCatalog && s.csCatalog.monitor.some(function (a) { return a.id === "weather" && a.label === "počasí"; }) && s.csCatalog.phone.some(function (a) { return a.id === "notes" && a.label === "vzkazy"; }), "app catalog labels follow the current Czech UI", s.csCatalog);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

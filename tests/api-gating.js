#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}function A(id,args){var r=window.loft.api.describe(id,args||{});return !!(r.ok&&r.value.available);}function room(){var r=window.loft.api.query("room.current");return r.ok?r.value:null;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,oldMax=window.__maxUnlocked;window.__maxUnlocked=function(){return 0;};window.__secondRound=false;',
  ' var lower=["bathroom","dungeon","cinema","bedroom","entrance"],fresh={phase:api.query("game.status").value.phase,count:api.capabilities().length,roomGo:A("room.go",{room:"balcony"}),car:A("car.dashboard.set",{open:true}),roadtripStart:A("roadtrip.start"),roadtripChooser:A("roadtrip.chooser.open"),roadtripRoute:A("roadtrip.route.start",{route:"banff"}),lower:lower.map(function(name){return [name,A(name+".set",{open:true})];}),runtime:{roster:A("roster.set",{open:true}),fixture:A("bathroom.fixture.activate",{fixture:"sink"}),camp:A("camping.fire.open"),pause:A("roadtrip.pause.set",{on:true}),moment:A("garden.moment.start",{moment:"toasts"}),call:A("call.video.start",{contact:"prague"}),flair:A("minigame.start",{game:"flair-catch"}),invaders:A("minigame.start",{game:"invaders"})}};',
  ' var dashboard=await api.perform("car.dashboard.set",{open:true},{source:"test"}),afterDashboard={room:room(),phase:api.query("game.status").value.phase,secondRound:!!window.__secondRound};',
  ' var chooser=await api.perform("roadtrip.chooser.open",{},{source:"test"}),chooserOpen={opened:chooser.ok&&chooser.value.opened,state:api.query("roadtrip.status").value};document.getElementById("entrance-roadtrip-route-banff").dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));var chooserStarted={active:api.query("roadtrip.status").value.active,route:api.query("roadtrip.status").value.route};var chooserExit=await api.perform("roadtrip.exit",{}, {source:"test"});',
  ' var start=await api.perform("roadtrip.route.start",{route:"abraham"},{source:"test"}),during={active:api.query("roadtrip.status").value.active,route:api.query("roadtrip.status").value.route,pause:A("roadtrip.pause.set",{on:true}),startAgain:A("roadtrip.start"),phase:api.query("game.status").value.phase};',
  ' var exit=await api.perform("roadtrip.exit",{}, {source:"test"}),afterRoadtrip={active:api.query("roadtrip.status").value.active,pause:A("roadtrip.pause.set",{on:true}),camp:A("camping.fire.open"),phase:api.query("game.status").value.phase,secondRound:!!window.__secondRound};',
  ' var bathroom=await api.perform("room.go",{room:"bathroom"},{source:"test"}),bathroomReady={room:room(),fixture:A("bathroom.fixture.activate",{fixture:"sink"}),phase:api.query("game.status").value.phase};',
  ' await api.perform("room.go",{room:"kitchen"},{source:"test"});var kitchen={room:room(),cocktail:A("kitchen.cocktail.make",{drink:"negroni"}),mixer:A("kitchen.mixer.start",{recipe:"yale"}),flair:A("minigame.start",{game:"flair-catch"}),invaders:A("minigame.start",{game:"invaders"})};',
  ' await api.perform("room.go",{room:"garden"},{source:"test"});await api.perform("garden.set",{on:true},{source:"test"});window.__secondRound=false;var garden={room:room(),phase:api.query("game.status").value.phase,roster:A("roster.set",{open:true}),moment:A("garden.moment.start",{moment:"toasts"}),kids:A("scene.activity.start",{activity:"kids-chase"}),rainbow:A("scene.activity.start",{activity:"rainbow"}),dj:A("garden.dj.set",{dj:"danesh"}),slow:A("garden.dance.request",{style:"slow"})};',
  ' await api.perform("room.go",{room:"office"},{source:"test"});window.__secondRound=false;var office={room:room(),phase:api.query("game.status").value.phase,call:A("call.video.start",{contact:"prague"}),invaders:A("minigame.start",{game:"invaders"}),flair:A("minigame.start",{game:"flair-catch"}),dj:A("garden.dj.set",{dj:"sina"}),slow:A("garden.dance.request",{style:"slow"})};',
  ' await api.perform("garden.set",{on:false},{source:"test"});window.__maxUnlocked=oldMax;S("audit",{fresh:fresh,dashboard:dashboard,afterDashboard:afterDashboard,chooser:chooser,chooserOpen:chooserOpen,chooserStarted:chooserStarted,chooserExit:chooserExit,start:start,during:during,exit:exit,afterRoadtrip:afterRoadtrip,bathroom:bathroom,bathroomReady:bathroomReady,kitchen:kitchen,garden:garden,office:office});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html typed API story-gate audit:");
var result = lib.runPageSync("loft-day.html", HARNESS, 10500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var a = result.steps.audit || {}, fresh = a.fresh || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(fresh.count >= 195, "the catalogue contains the audited 195-capability baseline and any later extensions", fresh.count);
check(fresh.phase === 1 && fresh.roomGo && fresh.car && fresh.roadtripStart && fresh.roadtripChooser && fresh.roadtripRoute && (fresh.lower || []).every(function (entry) { return entry[1]; }), "navigation, every lower room, the car, and every Road Trip entry are available in a fresh Phase 1 game", fresh);
check(fresh.runtime && fresh.runtime.roster && !fresh.runtime.fixture && !fresh.runtime.camp && !fresh.runtime.pause && !fresh.runtime.moment && !fresh.runtime.call && fresh.runtime.flair && !fresh.runtime.invaders, "story-independent controls and true active-surface gates reflect the fresh Kitchen state", fresh.runtime);
check(a.dashboard && a.dashboard.ok && a.afterDashboard && a.afterDashboard.room === "entrance" && a.afterDashboard.phase === 1 && !a.afterDashboard.secondRound, "opening the car performs its explicit navigation while Phase 1 is active", a.afterDashboard);
check(a.chooser && a.chooser.ok && a.chooserOpen && a.chooserOpen.opened && a.chooserOpen.state.routeChooserOpen && a.chooserStarted && a.chooserStarted.active && a.chooserStarted.route === "banff" && a.chooserExit && a.chooserExit.ok, "the visible route chooser works in Phase 1 through its normal route button", { chooser: a.chooser, opened: a.chooserOpen, started: a.chooserStarted });
check(a.start && a.start.ok && a.start.value.started && a.during && a.during.active && a.during.route === "abraham" && a.during.pause && !a.during.startAgain && a.during.phase === 1, "a direct selected Road Trip starts in Phase 1 and then enforces active-trip exclusivity", { start: a.start, during: a.during });
check(a.exit && a.exit.ok && a.afterRoadtrip && !a.afterRoadtrip.active && !a.afterRoadtrip.pause && !a.afterRoadtrip.camp && a.afterRoadtrip.phase === 1 && !a.afterRoadtrip.secondRound, "Road Trip exits cleanly and leaves finite/lifecycle gates intact in Phase 1", { exit: a.exit, after: a.afterRoadtrip });
check(a.bathroom && a.bathroom.ok && a.bathroomReady && a.bathroomReady.room === "bathroom" && a.bathroomReady.fixture, "direct lower-room navigation enables its room-owned actions from a fresh game", a.bathroomReady);
check(a.kitchen && a.kitchen.room === "kitchen" && a.kitchen.cocktail && a.kitchen.mixer && a.kitchen.flair && !a.kitchen.invaders, "fresh-game Kitchen actions are gated only by room ownership and runtime conflicts", a.kitchen);
check(a.garden && a.garden.room === "garden" && a.garden.phase === 1 && a.garden.roster && a.garden.moment && a.garden.kids && !a.garden.rainbow && a.garden.dj && a.garden.slow, "live Party actions ignore the story phase while retaining Garden ownership", a.garden);
check(a.office && a.office.room === "office" && a.office.phase === 1 && a.office.call && a.office.invaders && !a.office.flair && !a.office.dj && !a.office.slow, "Office actions ignore the story phase while Garden-owned physical actions do not pan there", a.office);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All API story-gate checks passed.");

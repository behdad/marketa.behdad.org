#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,oldMax=window.__maxUnlocked;window.__maxUnlocked=function(){return 4;};',
  ' var caps=api.query("api.capabilities",{kind:"query"});var info=api.query("api.info");var describe=api.describe("messages.recent",{limit:12});var badDescribe=api.describe("messages.recent",{limit:13});',
  ' var people=api.query("person.list"),person=api.query("person.get",{person:"aspen"}),badPerson=api.query("person.get",{person:"unknown"});',
  ' var attendance=api.query("attendance.status"),apps=api.query("apps.status"),messages=api.query("messages.recent",{limit:2}),badLimit=api.query("messages.recent",{limit:2.5}),calendar=api.query("calendar.upcoming",{limit:3}),media=api.query("media.status"),environment=api.query("scene.environment"),game=api.query("game.status");',
  ' var openDesc=api.describe("app.open",{app:"browser"}),sendDesc=api.describe("message.send",{text:"hello"}),emptySend=await api.perform("message.send",{text:""},{source:"test"}),longSend=await api.perform("message.send",{text:"x".repeat(501)},{source:"test"}),badVolume=await api.perform("volume.set",{level:1.1},{source:"test"});',
  ' S("queries",{caps:caps,info:info,describe:describe,badDescribe:badDescribe,people:people,person:person,badPerson:badPerson,attendance:attendance,apps:apps,messages:messages,badLimit:badLimit,calendar:calendar,media:media,environment:environment,game:game,openDesc:openDesc,sendDesc:sendDesc,emptySend:emptySend,longSend:longSend,badVolume:badVolume});',
  ' var events=[],off=api.subscribe(function(event){events.push(event);});window.goToStage("kitchen");events=[];var v0=api.stateVersion;',
  ' window.goToStage("garden");var directRoom={delta:api.stateVersion-v0,event:events[events.length-1],events:events.slice()};events=[];var v1=api.stateVersion;',
  ' var apiRoom=await api.perform("room.go",{room:"office"},{source:"test"});var typedRoom={delta:api.stateVersion-v1,event:events[events.length-1],result:apiRoom};events=[];var v2=api.stateVersion;',
  ' var noRoom=await api.perform("room.go",{room:"office"},{source:"test"});var noopRoom={delta:api.stateVersion-v2,eventCount:events.length,result:noRoom};events=[];',
  ' var balcony=document.getElementById("stage-balcony"),wasNight=!!(balcony&&balcony.classList.contains("dusk")),v3=api.stateVersion;window.__setDayNight(!wasNight);var daylight={delta:api.stateVersion-v3,event:events[events.length-1]};events=[];',
  ' var v4=api.stateVersion,party=await api.perform("garden.set",{on:true},{source:"test"});var typedParty={delta:api.stateVersion-v4,events:events.slice(),result:party};off();if(window.__setPartyMode)window.__setPartyMode(false,true);window.__maxUnlocked=oldMax;S("versions",{directRoom:directRoom,typedRoom:typedRoom,noopRoom:noopRoom,daylight:daylight,typedParty:typedParty,stateVersion:api.stateVersion});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html expanded typed API:");
var result = lib.runPageSync("rsvp.html", HARNESS, 3500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var q = result.steps.queries || {}, v = result.steps.versions || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(q.info.ok && !Object.prototype.hasOwnProperty.call(q.info.value, "version") && Number.isInteger(q.info.value.stateVersion) && q.caps.ok && q.caps.value.every(function (cap) { return cap.kind === "query" && typeof cap.group === "string"; }), "API self-description reports its state revision, groups, and filtered capabilities", { info: q.info, count: q.caps && q.caps.value && q.caps.value.length });
check(q.describe.ok && q.describe.value.args.limit.type === "integer" && q.describe.value.args.limit.max === 12 && q.describe.value.args_checked.limit === 12 && !q.badDescribe.ok, "describe exposes and enforces numeric bounds", { good: q.describe, bad: q.badDescribe });
check(q.people.ok && q.people.value.length >= 38 && q.people.value.every(function (person) { return !!person.id; }) && q.person.ok && q.person.value.id === "aspen" && /photographer/i.test(q.person.value.role) && !q.badPerson.ok, "person queries expose stable bounded public profiles", { count: q.people && q.people.value && q.people.value.length, person: q.person });
check(q.attendance.ok && q.attendance.value.locations && Array.isArray(q.attendance.value.present_ids) && q.apps.ok && q.apps.value.current && q.apps.value.catalog.phone.length > 10, "attendance and app status combine canonical public state", { attendance: q.attendance, apps: q.apps && q.apps.value && q.apps.value.current });
check(q.messages.ok && q.messages.value.length <= 2 && !q.badLimit.ok && q.calendar.ok && q.calendar.value.upcoming.length <= 3, "message and calendar reads honor hard list caps", { messages: q.messages, bad: q.badLimit, calendar: q.calendar });
check(q.media.ok && typeof q.media.value.master_volume === "number" && q.media.value.video && typeof q.media.value.video.playing === "boolean" && q.environment.ok && typeof q.environment.value.daylight === "boolean" && q.game.ok && q.game.value.busy && Array.isArray(q.game.value.unlocked_rooms), "combined media, environment, and game status stay structured", { media: q.media, environment: q.environment, game: q.game });
check(q.openDesc.ok && q.openDesc.value.available && q.sendDesc.ok && q.sendDesc.value.args.text.maxLength === 500 && !q.emptySend.ok && !q.longSend.ok && !q.badVolume.ok, "expanded app and utility actions advertise and enforce their schemas", { open: q.openDesc, send: q.sendDesc, empty: q.emptySend, long: q.longSend, volume: q.badVolume });
check(v.directRoom.delta >= 1 && v.directRoom.events.filter(function (event) { return event.id === "room.change" && event.source === "ui"; }).length === 1, "direct room changes advance the revision with one semantic room event", v.directRoom);
check(v.typedRoom.delta === 1 && v.typedRoom.event.id === "room.go" && v.typedRoom.event.source === "test" && v.typedRoom.result.changed, "typed room actions reuse the central hook without a duplicate revision", v.typedRoom);
check(v.noopRoom.delta === 0 && v.noopRoom.eventCount === 0 && v.noopRoom.result.ok && !v.noopRoom.result.changed, "no-op room actions do not advance the revision", v.noopRoom);
check(v.daylight.delta === 1 && v.daylight.event.id === "environment.daylight", "direct daylight changes advance the revision", v.daylight);
check(v.typedParty.delta === 1 && v.typedParty.events.length === 1 && v.typedParty.events[0].id === "garden.set" && v.typedParty.events[0].source === "test", "composite typed actions coalesce central mutations into one revision", v.typedParty);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'async function ready(test,label,timeout){var started=performance.now();while(performance.now()-started<(timeout||3000)){if(test())return true;await new Promise(function(resolve){setTimeout(resolve,40);});}throw new Error(label+" did not become ready");}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},350);});',
  'async function run(){',
  ' var api=window.loft.api,oldMax=window.__maxUnlocked;window.__maxUnlocked=function(){return 4;};',
  ' var caps=api.query("api.capabilities",{kind:"query"});var info=api.query("api.info");var describe=api.describe("messages.recent",{limit:12});var badDescribe=api.describe("messages.recent",{limit:13});',
  ' var people=api.query("person.list"),person=api.query("person.get",{person:"aspen"}),badPerson=api.query("person.get",{person:"unknown"});',
  ' var attendance=api.query("attendance.status"),apps=api.query("apps.status"),python=api.query("app.python.status"),messages=api.query("messages.recent",{limit:2}),badLimit=api.query("messages.recent",{limit:2.5}),calendar=api.query("calendar.upcoming",{limit:3}),media=api.query("media.status"),environment=api.query("scene.environment"),game=api.query("game.status");',
  ' var openDesc=api.describe("app.open",{app:"browser"}),sendDesc=api.describe("message.send",{text:"hello"}),emptySend=await api.perform("message.send",{text:""},{source:"test"}),longSend=await api.perform("message.send",{text:"x".repeat(501)},{source:"test"}),badVolume=await api.perform("volume.set",{level:1.1},{source:"test"});',
  ' S("queries",{caps:caps,info:info,describe:describe,badDescribe:badDescribe,people:people,person:person,badPerson:badPerson,attendance:attendance,apps:apps,python:python,messages:messages,badLimit:badLimit,calendar:calendar,media:media,environment:environment,game:game,openDesc:openDesc,sendDesc:sendDesc,emptySend:emptySend,longSend:longSend,badVolume:badVolume});',
  ' var events=[],off=api.subscribe(function(event){events.push(event);});window.__goToStage("kitchen");events=[];var v0=api.stateVersion;',
  ' window.__goToStage("garden");var directRoom={delta:api.stateVersion-v0,event:events[events.length-1],events:events.slice()};events=[];var v1=api.stateVersion;',
  ' var apiRoom=await api.perform("room.go",{room:"office"},{source:"test"});var typedRoom={delta:api.stateVersion-v1,event:events[events.length-1],result:apiRoom};events=[];var v2=api.stateVersion;',
  ' var noRoom=await api.perform("room.go",{room:"office"},{source:"test"});var noopRoom={delta:api.stateVersion-v2,eventCount:events.length,result:noRoom};events=[];',
  ' var balcony=document.getElementById("stage-balcony"),wasNight=!!(balcony&&balcony.classList.contains("dusk")),v3=api.stateVersion;window.__setDayNight(!wasNight);var daylight={delta:api.stateVersion-v3,event:events[events.length-1]};events=[];',
  ' var v4=api.stateVersion,party=await api.perform("garden.set",{on:true},{source:"test"});var typedParty={delta:api.stateVersion-v4,events:events.slice(),result:party};off();if(window.__setPartyMode)window.__setPartyMode(false,true);window.__maxUnlocked=oldMax;S("versions",{directRoom:directRoom,typedRoom:typedRoom,noopRoom:noopRoom,daylight:daylight,typedParty:typedParty,stateVersion:api.stateVersion});',
  ' var monitor=document.getElementById("office-monitor");if(window.__loftControllers.computer&&!window.__loftControllers.computer.status())window.__loftControllers.computer.set(true);await ready(function(){var current=api.query("app.current");return current.ok&&current.value.monitor==="desktop"&&monitor&&monitor.classList.contains("screen-on")&&!monitor.classList.contains("show-fedora");},"PC desktop",3000);',
  ' var lifeOpen=await api.perform("app.open",{app:"life"},{source:"test"});await ready(function(){var current=api.query("app.current");return current.ok&&current.value.monitor==="life"&&window.__monitorAppRunning&&window.__monitorAppRunning("life");},"Life",1200);var lifeBefore=api.query("app.current"),killStart=performance.now(),lifeKill=await api.perform("app.kill",{app:"life",device:"monitor"},{source:"test"}),lifeAfter=api.query("app.current");',
  ' var notesOpen=await api.perform("app.open",{app:"notes"},{source:"test"});await ready(function(){var current=api.query("app.current");return current.ok&&current.value.phone_open&&current.value.phone==="notes";},"phone Notes",800);var notesBefore=api.query("app.current"),notesKill=await api.perform("app.kill",{app:"notes",device:"phone"},{source:"test"}),notesAfter=api.query("app.current");S("kill",{pcReady:true,open:lifeOpen,before:lifeBefore,kill:lifeKill,after:lifeAfter,duration:performance.now()-killStart,running:window.__monitorAppRunning&&window.__monitorAppRunning("life"),phone:{open:notesOpen,before:notesBefore,kill:notesKill,after:notesAfter}});',
  ' var reduced=api.query("presentation.reduced.status"),trailerRun=api.perform("trailer.play",{},{source:"test"});await ready(function(){var preview=api.query("session.preview.status"),overlay=document.getElementById("cine-overlay");return !!(window.__cinematic&&preview.ok&&preview.value.active&&overlay);},"Trailer presentation",2600);',
  ' var card=await api.perform("presentation.card.show",{card:"final"},{source:"test"}),caption=await api.perform("presentation.caption.show",{caption:"cine_signoff"},{source:"test"}),chapter=await api.perform("presentation.chapter.show",{chapter:"cine_chapter_camp"},{source:"test"}),cutOut=await api.perform("presentation.cut",{phase:"out"},{source:"test"}),overlay=document.getElementById("cine-overlay"),cutWasOut=!!(overlay&&overlay.classList.contains("cine-cut")),cutIn=await api.perform("presentation.cut",{phase:"in"},{source:"test"}),point=await api.perform("presentation.point",{interaction:"cinema.bike"},{source:"test"}),isolated=await api.perform("message.send",{text:"blocked"},{source:"test"});var oldPreviewEnd=window.__loftPreviewEnd;window.__loftPreviewEnd=undefined;var isolatedNoController=await api.perform("message.send",{text:"still blocked"},{source:"test"});window.__loftPreviewEnd=oldPreviewEnd;var oldStartCinematic=window.__startCinematic;window.__startCinematic=undefined;var trailerCompound=api.describe("trailer.play",{}).value.availability;window.__startCinematic=oldStartCinematic;',
  ' var presentationView={final:!!(overlay&&overlay.classList.contains("cine-final")),caption:(document.getElementById("hunt-caption")||{}).textContent||"",chapter:overlay&&overlay.querySelector(".cine-chapter")&&overlay.querySelector(".cine-chapter").textContent||"",chapterShown:!!(overlay&&overlay.querySelector(".cine-chapter.show")),cutWasOut:cutWasOut,cutCleared:!!(overlay&&!overlay.classList.contains("cine-cut"))};var trailerStop=await api.perform("trailer.stop",{disposition:"restore"},{source:"test"}),previewAfter=api.query("session.preview.status");S("presentation",{reduced:reduced,card:card,caption:caption,chapter:chapter,cutOut:cutOut,cutIn:cutIn,point:point,isolated:isolated,isolatedNoController:isolatedNoController,trailerCompound:trailerCompound,view:presentationView,stop:trailerStop,stopped:!window.__cinematic&&previewAfter.ok&&!previewAfter.value.active,runStarted:!!trailerRun});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("rsvp.html expanded typed API:");
var result = lib.runPageSync("rsvp.html", HARNESS, 12000, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var q = result.steps.queries || {}, v = result.steps.versions || {};
var kill = result.steps.kill || {};
var presentation = result.steps.presentation || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(q.info.ok && !Object.prototype.hasOwnProperty.call(q.info.value, "version") && Number.isInteger(q.info.value.stateVersion) && q.caps.ok && q.caps.value.every(function (cap) { return cap.kind === "query" && typeof cap.group === "string"; }), "API self-description reports its state revision, groups, and filtered capabilities", { info: q.info, count: q.caps && q.caps.value && q.caps.value.length });
check(q.describe.ok && q.describe.value.args.limit.type === "integer" && q.describe.value.args.limit.max === 12 && q.describe.value.args_checked.limit === 12 && !q.badDescribe.ok, "describe exposes and enforces numeric bounds", { good: q.describe, bad: q.badDescribe });
check(q.people.ok && q.people.value.length >= 38 && q.people.value.every(function (person) { return !!person.id; }) && q.person.ok && q.person.value.id === "aspen" && /photographer/i.test(q.person.value.role) && !q.badPerson.ok, "person queries expose stable bounded public profiles", { count: q.people && q.people.value && q.people.value.length, person: q.person });
check(q.attendance.ok && q.attendance.value.locations && Array.isArray(q.attendance.value.present_ids) && q.apps.ok && q.apps.value.current && q.apps.value.catalog.phone.length > 10, "attendance and app status combine canonical public state", { attendance: q.attendance, apps: q.apps && q.apps.value && q.apps.value.current });
check(q.python.ok && q.python.value.app === "python" && q.python.value.device === "monitor" && !q.python.value.open && !q.python.value.ready && q.python.value.state === "stopped", "Python readiness starts from the runtime owner's honest stopped state", q.python);
check(q.messages.ok && q.messages.value.length <= 2 && !q.badLimit.ok && q.calendar.ok && q.calendar.value.upcoming.length <= 3, "message and calendar reads honor hard list caps", { messages: q.messages, bad: q.badLimit, calendar: q.calendar });
check(q.media.ok && typeof q.media.value.master_volume === "number" && q.media.value.video && typeof q.media.value.video.playing === "boolean" && q.environment.ok && typeof q.environment.value.daylight === "boolean" && q.game.ok && q.game.value.busy && Array.isArray(q.game.value.unlocked_rooms), "combined media, environment, and game status stay structured", { media: q.media, environment: q.environment, game: q.game });
check(q.openDesc.ok && q.openDesc.value.available && q.sendDesc.ok && q.sendDesc.value.args.text.maxLength === 500 && !q.emptySend.ok && !q.longSend.ok && !q.badVolume.ok, "expanded app and utility actions advertise and enforce their schemas", { open: q.openDesc, send: q.sendDesc, empty: q.emptySend, long: q.longSend, volume: q.badVolume });
check(v.directRoom.delta >= 1 && v.directRoom.events.filter(function (event) { return event.id === "room.change" && event.source === "ui"; }).length === 1, "direct room changes advance the revision with one semantic room event", v.directRoom);
check(v.typedRoom.delta === 1 && v.typedRoom.event.id === "room.go" && v.typedRoom.event.source === "test" && v.typedRoom.result.changed, "typed room actions reuse the central hook without a duplicate revision", v.typedRoom);
check(v.noopRoom.delta === 0 && v.noopRoom.eventCount === 0 && v.noopRoom.result.ok && !v.noopRoom.result.changed, "no-op room actions do not advance the revision", v.noopRoom);
check(v.daylight.delta === 1 && v.daylight.event.id === "environment.daylight", "direct daylight changes advance the revision", v.daylight);
check(v.typedParty.delta === 1 && v.typedParty.events.length === 1 && v.typedParty.events[0].id === "garden.set" && v.typedParty.events[0].source === "test", "composite typed actions coalesce central mutations into one revision", v.typedParty);
check(kill.pcReady && kill.open && kill.open.ok && kill.before && kill.before.value.monitor === "life" && kill.kill && kill.kill.ok && kill.kill.value.device === "monitor" && kill.after && kill.after.value.monitor !== "life" && !kill.running && kill.duration >= 2200,
  "app.kill awaits the real monitor Kill/reset lifecycle instead of aliasing Close", kill);
check(kill.phone && kill.phone.open && kill.phone.open.ok && kill.phone.before && kill.phone.before.value.phone === "notes" && kill.phone.kill && kill.phone.kill.ok && kill.phone.kill.value.device === "phone" && kill.phone.after && kill.phone.after.value.phone_open && kill.phone.after.value.phone === "home",
  "app.kill delegates phone force-stop to the phone owner and returns to its launcher", kill.phone);
check(presentation.reduced && presentation.reduced.ok && typeof presentation.reduced.value.on === "boolean" && [presentation.card,presentation.caption,presentation.chapter,presentation.cutOut,presentation.cutIn,presentation.point,presentation.stop].every(function (entry) { return entry && entry.ok; }) && presentation.view && presentation.view.final && presentation.view.caption && presentation.view.chapter && presentation.view.chapterShown && presentation.view.cutWasOut && presentation.view.cutCleared && presentation.point.value.interaction === "cinema.bike" && presentation.stopped,
  "presentation.* drives only the active Trailer's bounded cards, captions, chapters, cuts, and pointer, then restores cleanly", presentation);
check(presentation.isolated && !presentation.isolated.ok && presentation.isolated.code === "PREVIEW_ISOLATION" && presentation.isolated.availability && presentation.isolated.availability.reason === "External and destructive actions are blocked inside a preview transaction." && presentation.isolated.availability.remedy.id === "session.preview.end" && presentation.isolated.availability.remedy.args.disposition === "restore",
  "preview isolation failures expose their exact transaction remedy", presentation.isolated);
check(presentation.isolatedNoController && !presentation.isolatedNoController.ok && presentation.isolatedNoController.code === "PREVIEW_ISOLATION" && presentation.isolatedNoController.availability && !presentation.isolatedNoController.availability.remedy,
  "preview isolation omits its exit remedy when the transaction controller is unavailable", presentation.isolatedNoController);
check(presentation.trailerCompound && !presentation.trailerCompound.remedy && /already playing inside an active preview session/.test(presentation.trailerCompound.reason) && /Trailer controller is not ready/.test(presentation.trailerCompound.reason),
  "Trailer stop is not advertised when its start controller would remain unavailable", presentation.trailerCompound);

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

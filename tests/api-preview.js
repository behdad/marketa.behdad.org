#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'var report={errors:[],steps:{}};function S(k,v){report.steps[k]=v;}',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(e){window.__errs.push(String(e&&e.stack||e));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},400);});',
  'async function run(){',
  ' var raw="{ \\"byte\\": \\"for byte\\", \\"spacing\\": true }",key="loftCheckpoint:v1";localStorage.setItem(key,raw);localStorage.setItem("preview-test","before");window.__secondRound=false;window.__deliverOccasionText("occ_preview_guard","msg_behdad_from","occ_invite_wed_edm","occ");window.__secondRound=true;',
  ' var before={room:window.currentStageName,album:window.__albumList().length,messages:window.loft.api.query("messages.summary").value.total};',
  ' var begin1=await window.loft.session.preview.begin("focused-test"),begin2=await window.loft.session.preview.begin("again"),live=window.loft.session.preview.status();',
  ' var rewriteCalls=0;Math.random=function(){return .5;};window.__monitorMessageRewrite=function(){rewriteCalls++;return new Promise(function(){});};var heldFlush=window.__flushHeldPhoneMessages(),autonomous=window.__deliverAutonomousPhoneMessage("athena_banter");await Promise.resolve();var previewRewriteCalls=rewriteCalls;',
  ' var room=await window.loft.room.go("bathroom"),finite=window.loft.api.describe("room.go",{room:"bathroom"}).value.completion;',
  ' var album=window.__albumAddRoom("bathroom",true),message=window.__deliverPhoneMessage("downstairs_entrance"),external=await window.loft.api.perform("message.send",{text:"preview leak"}),destructive=await window.loft.api.perform("album.remove",{id:1});',
  ' var party=window.loft.garden.set(true),partyImmediate=!!window.__gardenPartyOn;await party;',
  ' var route=await window.loft.roadtrip.preview.show({route:"calgary",distance:0}),road=window.loft.roadtrip.status();',
  ' localStorage.setItem("preview-test","during");localStorage.setItem(key,"mutated");',
  ' var ended=await window.loft.session.preview.end("restore");await Promise.resolve();var releasedRewriteCalls=rewriteCalls,after={room:window.currentStageName,party:!!window.__gardenPartyOn,album:window.__albumList().length,messages:window.loft.api.query("messages.summary").value.total,raw:localStorage.getItem(key),custom:localStorage.getItem("preview-test"),active:window.loft.session.preview.status().value.active};',
  ' var beginFresh=await window.loft.session.preview.begin("fresh-test");await window.loft.room.go("garden");var reset=await window.loft.game.reset("instant"),resetRoom=window.currentStageName;localStorage.setItem(key,"fresh-mutated");var fresh=await window.loft.session.preview.end("fresh"),freshAfter={room:window.currentStageName,raw:localStorage.getItem(key),custom:localStorage.getItem("preview-test")};',
  ' S("preview",{raw:raw,before:before,begin1:begin1,begin2:begin2,live:live,room:room,finite:finite,suppressed:{album:album,message:message,external:external,destructive:destructive,heldFlush:heldFlush,autonomous:autonomous,previewRewriteCalls:previewRewriteCalls,releasedRewriteCalls:releasedRewriteCalls},partyImmediate:partyImmediate,route:route,road:road,ended:ended,after:after,beginFresh:beginFresh,reset:reset,resetRoom:resetRoom,fresh:fresh,freshAfter:freshAfter});',
  '}',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else { failures++; console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
}

console.log("loft-day.html API preview transaction:");
var result = lib.runPageSync("loft-day.html", HARNESS, 10500, { patchRaf: true });
if (!result) { console.log("  ✗ harness produced no report"); process.exit(1); }
var s = result.steps.preview || {};
check(result.errors.length === 0, "no uncaught page errors", result.errors);
check(s.begin1 && s.begin1.ok && s.begin2 && s.begin2.ok && s.begin1.value.generation === s.begin2.value.generation && s.live && s.live.value.active, "preview begin is idempotent and status is generation-scoped", { first: s.begin1, second: s.begin2, live: s.live });
check(s.finite === "finite" && s.room && s.room.ok && s.room.value.room === "bathroom", "lower-room navigation uses the real owner and settles as a finite action", { room: s.room, completion: s.finite });
check(s.suppressed && s.suppressed.album === null && s.suppressed.message === false && s.suppressed.external.code === "PREVIEW_ISOLATION" && s.suppressed.destructive.code === "PREVIEW_ISOLATION", "preview suppresses album, notification, external, and destructive writes", s.suppressed);
check(s.suppressed && s.suppressed.heldFlush === 0 && s.suppressed.autonomous === false && s.suppressed.previewRewriteCalls === 0 && s.suppressed.releasedRewriteCalls === 1, "preview defers autonomous rewrites without consuming the held delivery", s.suppressed);
check(s.partyImmediate && s.route && s.route.ok && s.route.value.shown && s.road && s.road.ok && s.road.value.active, "party and the exact renderer-owned Road Trip are usable inside preview", { party: s.partyImmediate, route: s.route, road: s.road });
check(s.ended && s.ended.ok && s.ended.value.checkpointPreserved && s.after && s.after.room === s.before.room && !s.after.party && s.after.album === s.before.album && s.after.messages === s.before.messages && s.after.raw === s.raw && s.after.custom === "before" && !s.after.active, "restore returns semantic state and browser storage byte-for-byte", { ended: s.ended, before: s.before, after: s.after });
check(s.reset && s.reset.ok && s.reset.value.reset && s.resetRoom === "kitchen" && s.fresh && s.fresh.ok && s.fresh.value.checkpointPreserved && s.freshAfter.room === "kitchen" && s.freshAfter.raw === s.raw && s.freshAfter.custom === "before", "canonical reset is allowed and fresh completion leaves clean Kitchen with recovery storage intact", { reset: s.reset, fresh: s.fresh, after: s.freshAfter });

console.log("");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All checks passed.");

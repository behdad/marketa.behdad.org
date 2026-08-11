#!/usr/bin/env node
// Road Trip owns the foreground without ending or rerolling the upstairs party.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function fg() { return window.__partyForegroundState ? copy(window.__partyForegroundState()) : null; }
  function runtime() { return window.__partyForegroundRuntimeState ? copy(window.__partyForegroundRuntimeState()) : null; }
  function act() { return window.__actTwoState ? copy(window.__actTwoState()) : null; }
  function codaReceived() {
    return ["piano", "dawn", "mb"].filter(function (id) {
      return window.__phoneMessageReceived && window.__phoneMessageReceived(id);
    });
  }
  function arrivedGuests() {
    return Array.prototype.map.call(document.querySelectorAll("#garden-guests .guest.arrived"), function (node) {
      return (node.getAttribute("class") || "").split(/\s+/).filter(function (name) { return /^g-/.test(name); })[0] || "";
    }).filter(Boolean).sort();
  }
  function partyIdentity() {
    return {
      on: !!window.__gardenPartyOn,
      startedAt: window.__partyStartedAt,
      dance: window.__partyDance,
      dj: !!window.__djB,
      guests: arrivedGuests(),
      balcony: window.__balconyPeopleNow ? window.__balconyPeopleNow().slice().sort() : [],
      attended: window.__partyLifecycleState ? window.__partyLifecycleState().attended : null,
      beat: window.__actBeat ? window.__actBeat() : null
    };
  }
  function sameIdentity(a, b) {
    return a.on === b.on && a.startedAt === b.startedAt && a.dance === b.dance && a.dj === b.dj &&
      JSON.stringify(a.guests) === JSON.stringify(b.guests) &&
      JSON.stringify(a.balcony) === JSON.stringify(b.balcony) && a.attended === b.attended && a.beat === b.beat;
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  async function firstLoad() {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setGardenParty(true, false);
    window.__setPartyDance("salsa");
    window.__resetActTwo();
    window.__armActTwo(true);
    window.__goToStage("garden");
    window.__summonGuests();
    window.__goToStage("balcony");
    if (window.__updateBalconyHangout) window.__updateBalconyHangout();
    await sleep(120);
    var audience = window.__balconyAudienceNoticed ? window.__balconyAudienceNoticed(true) : null;
    var before = partyIdentity();
    report.steps.before = {
      identity: before,
      foreground: fg(), runtime: runtime(), act: act(), audience: audience,
      callout: !!document.querySelector(".balcony-audience-callout")
    };

    window.__openEntranceRoom();
    await sleep(40);
    report.steps.entrance = { foreground: fg(), active: window.__entranceRoomState().drive.roadtrip.active };
    window.__openEntrancePorscheDriveHud();
    report.steps.hud = { foreground: fg(), active: window.__entranceRoomState().drive.roadtrip.active };

    var started = window.__entranceRoadtripDevStart();
    report.steps.started = {
      started: started, foreground: fg(), runtime: runtime(), act: act(), identity: partyIdentity(),
      classed: document.documentElement.classList.contains("party-foreground-suspended"),
      callout: !!document.querySelector(".balcony-audience-callout")
    };
    await sleep(1800);
    report.steps.settled = {
      foreground: fg(), runtime: runtime(), act: act(), identity: partyIdentity(),
      coda: codaReceived(),
      reception: ["pouria", "group", "album", "irene_games"].filter(function (id) {
        return window.__phoneMessageReceived && window.__phoneMessageReceived(id);
      })
    };

    window.__toggleEntranceRoadtripTransport();
    report.steps.roadPaused = {
      foreground: fg(), transport: window.__entranceRoadtripTransportState(), coda: codaReceived()
    };
    window.__toggleEntranceRoadtripTransport();
    window.__entranceRoadtripSetRoute("camp", 0);
    report.steps.camping = {
      foreground: fg(), route: window.__entranceRoomState().drive.roadtrip.route,
      transport: window.__entranceRoadtripTransportState(), coda: codaReceived()
    };
    window.__exitEntranceRoadtrip();
    await sleep(420);
    report.steps.resumed = {
      foreground: fg(), runtime: runtime(), act: act(), identity: partyIdentity(),
      classed: document.documentElement.classList.contains("party-foreground-suspended"),
      same: sameIdentity(before, partyIdentity()), coda: codaReceived()
    };

    // An explicit user transport pause is independent: a Road Trip round-trip must not unpause it.
    window.__toggleMusicPlayback();
    var pausedBefore = !!window.__musicPaused;
    window.__entranceRoadtripDevStart();
    await sleep(920);
    window.__exitEntranceRoadtrip();
    report.steps.transport = {
      pausedBefore: pausedBefore,
      pausedAfter: !!window.__musicPaused,
      dance: window.__partyDance,
      playing: !!(window.__anyMusicPlaying && window.__anyMusicPlaying())
    };
    window.__toggleMusicPlayback();
    report.steps.transport.resumed = !window.__musicPaused &&
      !!(window.__anyMusicPlaying && window.__anyMusicPlaying());

    window.__setPartyMode(false, true);
    await sleep(5200);
    report.steps.ended = { party: !!window.__gardenPartyOn, act: act(), coda: codaReceived(), caption: window.__captionKey() };
    sessionStorage.setItem("party-roadtrip-lifecycle-first", JSON.stringify(report.steps));
    sessionStorage.setItem("party-roadtrip-lifecycle-reload", "1");
    location.reload();
  }
  async function secondLoad() {
    await sleep(5600);
    report.steps = JSON.parse(sessionStorage.getItem("party-roadtrip-lifecycle-first") || "{}");
    report.steps.reload = {
      foreground: fg(), act: act(), coda: codaReceived(), caption: window.__captionKey(),
      classed: document.documentElement.classList.contains("party-foreground-suspended")
    };
    finish();
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      var task = sessionStorage.getItem("party-roadtrip-lifecycle-reload") ? secondLoad() : firstLoad();
      task.catch(function (error) { report.errors.push(String(error && error.stack || error)); finish(); });
    }, 260);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 18000, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?date=2026-07-15&time=23:00",
  chromeFlags: "--autoplay-policy=no-user-gesture-required --window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}

console.log("loft-day.html party/Road Trip foreground ownership:");
check(result && result.errors.length === 0, "the lifecycle probe has no page errors", result && result.errors);
var s = result && result.steps || {};
check(s.before && s.before.identity.on && !s.before.foreground.suspended && s.before.runtime.rotation &&
  s.before.runtime.lifecycle.running && s.before.act.running,
  "the seeded Phase 2 party is live before entering the car", s.before);
check(s.entrance && s.hud && !s.entrance.foreground.suspended && !s.hud.foreground.suspended &&
  !s.entrance.active && !s.hud.active,
  "Entrance and its HUD do not claim party foreground ownership", { entrance: s.entrance, hud: s.hud });
check(s.started && s.started.started && s.started.foreground.suspended && s.started.foreground.reason === "roadtrip" &&
  s.started.classed && !s.started.callout,
  "actual Road Trip launch synchronously claims the foreground and retires the balcony callout", s.started);
check(s.started && s.settled && s.started.identity.startedAt === s.before.identity.startedAt &&
  s.started.identity.dance === s.before.identity.dance && s.started.identity.dj === s.before.identity.dj &&
  s.settled.identity.attended === s.before.identity.attended && s.settled.identity.beat === s.before.identity.beat,
  "party identity, attendance, dance, DJ, and Act Two beat stay frozen", { before: s.before, settled: s.settled });
check(s.settled && !s.settled.runtime.rotation && !s.settled.runtime.confetti &&
  !s.settled.runtime.disco && !s.settled.runtime.flash && !s.settled.runtime.photo &&
  !s.settled.runtime.album && !s.settled.runtime.chase && !s.settled.runtime.kidFormation &&
  s.settled.runtime.guests && !s.settled.runtime.guests.trickle &&
  !s.settled.runtime.guests.hostSolo && !s.settled.runtime.guests.handoff &&
  !s.settled.runtime.lifecycle.running && !s.settled.act.running && s.settled.reception.length === 0 &&
  s.settled.runtime.audio.every(function (row) { return row.target === 0 && row.gain < .02; }),
  "party timers, particles, moments, and the dance audio graph are parked after the fade", s.settled);
check(s.roadPaused && s.roadPaused.foreground.suspended && s.roadPaused.transport.active &&
  s.roadPaused.transport.paused && s.camping && s.camping.foreground.suspended &&
  s.camping.route === "camp" && s.camping.transport.active,
  "Road Trip transport-pause and Camping retain foreground ownership", { road: s.roadPaused, camp: s.camping });
check(s.resumed && !s.resumed.foreground.suspended && !s.resumed.classed && s.resumed.same &&
  s.resumed.runtime.rotation && s.resumed.runtime.lifecycle.running && s.resumed.act.running &&
  s.resumed.runtime.audio.filter(function (row) { return row.target === 1; }).length === 1,
  "parking returns the exact party state and one active dance bed without a reroll", s.resumed);
check(s.transport && s.transport.pausedBefore && s.transport.pausedAfter && !s.transport.playing && s.transport.resumed,
  "explicit global music pause survives a Road Trip round-trip and resumes deliberately", s.transport);
check(s.ended && !s.ended.party && s.ended.act && !s.ended.act.armed && s.ended.act.retired && !s.ended.act.running &&
  s.ended.coda.length === 0 && s.ended.caption !== "rsvp_exit",
  "party teardown has no automatic piano, dawn, or direct-RSVP coda", s.ended);
check(s.reload && !s.reload.foreground.suspended && !s.reload.classed && s.reload.act &&
  !s.reload.act.armed && !s.reload.act.running && s.reload.coda.length === 0 && s.reload.caption !== "rsvp_exit",
  "reload leaves no stale party/coda owner, timer, message, or RSVP caption", s.reload);

if (failures) process.exit(1);
console.log("Party/Road Trip foreground assertions passed.");

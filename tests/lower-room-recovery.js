#!/usr/bin/env node
// A checkpoint taken downstairs returns to the matching lower room without
// reviving transient props, media, or embedded games.
"use strict";

var lib = require("./lib");

var CASES = [
  { id: "bathroom", room: "kitchen", label: "bathroom" },
  { id: "dungeon", room: "garden", label: "dungeon" },
  { id: "cinema", room: "cuddly", label: "cinema" },
  { id: "bedroom", room: "office", label: "bedroom" },
  { id: "entrance", room: "balcony", label: "entrance" }
];

function harness(testCase) {
  var openClass = {
    bathroom: "bathroom-room-open",
    dungeon: "prince-basement-open",
    cinema: "cinema-room-open",
    bedroom: "bedroom-room-open",
    entrance: "entrance-room-open"
  }[testCase.id];
  var elementId = {
    bathroom: "bathroom-room",
    dungeon: "prince-basement",
    cinema: "cinema-room",
    bedroom: "bedroom-room",
    entrance: "entrance-room"
  }[testCase.id];
  var saved = {
    version: 1,
    savedAt: Date.now() - 120000,
    progress: {
      room: testCase.room,
      lowerRoom: testCase.id,
      maxUnlocked: 4,
      phase2: true,
      party: false,
      daylight: true,
      bbq: false
    },
    puzzle: {},
    phone: null,
    album: null,
    systems: {}
  };
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    "var saved=" + JSON.stringify(saved) + ";",
    "var openClass=" + JSON.stringify(openClass) + ",elementId=" + JSON.stringify(elementId) + ";",
    'if(!sessionStorage.getItem("lower-recovery-seeded")){sessionStorage.setItem("lower-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
    'window.addEventListener("load",function(){setTimeout(function(){',
    'var gate=document.getElementById("loft-recovery-gate"),summary=document.getElementById("hunt-caption").textContent,viewport=document.querySelector(".hunt-viewport"),element=document.getElementById(elementId),princeBefore=window.__princeState&&window.__princeState(),cinemaBefore=window.__cinemaRoomState&&window.__cinemaRoomState();',
    'var gateZ=getComputedStyle(gate).zIndex,elementZ=getComputedStyle(element).zIndex;var preview={shown:!element.hidden&&viewport.classList.contains("recovery-lower-preview")&&viewport.classList.contains(openClass),ariaHidden:element.getAttribute("aria-hidden"),floorPan:getComputedStyle(viewport).getPropertyValue("--floor-pan").trim(),transition:getComputedStyle(viewport).transition,gateAbove:gateZ!=="auto"&&(elementZ==="auto"||+gateZ>+elementZ),live:{bathroom:!!window.__bathroomRoomOpen,dungeon:!!(princeBefore&&princeBefore.basement),cinema:!!window.__cinemaRoomOpen,bedroom:!!window.__bedroomRoomOpen,entrance:!!window.__entranceRoomOpen},checkpoint:localStorage.getItem("loftCheckpoint:v1")===JSON.stringify(saved),discovered:localStorage.getItem("lowerRoomDiscovered:v1"),frames:{dungeon:document.querySelectorAll("#prince-basement iframe").length,cinema:document.querySelectorAll("#cinema-player").length},cinemaPowered:!!(cinemaBefore&&cinemaBefore.powered)};',
    'if(gate)gate.querySelector(".loft-recovery-btn.primary").click();',
    'setTimeout(function(){var prince=window.__princeState&&window.__princeState(),cinema=window.__cinemaRoomState&&window.__cinemaRoomState(),bedroom=window.__bedroomRoomState&&window.__bedroomRoomState(),ttt=window.__bedroomTicTacToeState&&window.__bedroomTicTacToeState(),persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1"));',
    'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,preview:preview,summary:summary,room:window.__currentStageName,persisted:persisted&&persisted.progress&&persisted.progress.lowerRoom,open:{bathroom:!!window.__bathroomRoomOpen,dungeon:!!(prince&&prince.basement),cinema:!!window.__cinemaRoomOpen,bedroom:!!window.__bedroomRoomOpen,entrance:!!window.__entranceRoomOpen},dungeon:{initiated:!!(prince&&prince.initiated),playing:!!(prince&&prince.playing),input:!!window.__princeInputActive,frames:document.querySelectorAll("#prince-basement iframe").length},cinema:cinema&&{powered:cinema.powered,playing:cinema.playing,video:cinema.video,frames:document.querySelectorAll("#cinema-player").length},bedroom:bedroom&&{spraying:bedroom.spraying,bedWet:bedroom.bedWet,ttt:ttt&&ttt.phase}});',
    '},220);},80);});',
    '})();</script>'
  ].join("\n");
}

function mismatchHarness() {
  return harness({ id: "cinema", room: "kitchen" });
}

function restartHarness() {
  var saved = {
    version: 1,
    savedAt: Date.now() - 120000,
    progress: { room: "kitchen", lowerRoom: "bathroom", maxUnlocked: 4, phase2: true, party: false, daylight: true, bbq: false },
    puzzle: {},
    phone: null,
    album: null,
    systems: {}
  };
  return [
    '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
    '<script>(function(){',
    "var saved=" + JSON.stringify(saved) + ";",
    'if(!sessionStorage.getItem("lower-recovery-restart-seeded")){sessionStorage.setItem("lower-recovery-restart-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));localStorage.setItem("lowerRoomDiscovered:v1","1");location.reload();return;}',
    'window.addEventListener("load",function(){setTimeout(function(){',
    'var gate=document.getElementById("loft-recovery-gate");gate.querySelector(".loft-recovery-btn:not(.primary)").click();',
    'setTimeout(function(){var viewport=document.querySelector(".hunt-viewport"),room=document.getElementById("bathroom-room");document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,gate:!!document.getElementById("loft-recovery-gate"),preview:viewport.classList.contains("recovery-lower-preview"),openClass:viewport.classList.contains("bathroom-room-open"),hidden:room.hidden,ariaHidden:room.getAttribute("aria-hidden"),live:!!window.__bathroomRoomOpen,save:!!localStorage.getItem("loftCheckpoint:v1"),discovered:localStorage.getItem("lowerRoomDiscovered:v1"),clickMe:!!document.getElementById("click-me-overlay")});},120);',
    '},80);});',
    '})();</script>'
  ].join("\n");
}

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else {
    failures++;
    console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("loft-day.html lower-room checkpoint recovery:");
CASES.forEach(function (testCase) {
  var result = lib.runPageSync("loft-day.html", harness(testCase), 1200, {
    patchRaf: true,
  });
  check(result && result.errors.length === 0, testCase.id + " recovery has no uncaught errors", result && result.errors);
  check(result && result.preview && result.preview.shown && result.preview.ariaHidden === null &&
      result.preview.floorPan === "100%" && result.preview.transition === "none" &&
      result.preview.gateAbove,
    testCase.id + " opens directly on the saved lower room behind the recovery gate", result && result.preview);
  check(result && result.preview && Object.keys(result.preview.live).every(function (id) {
      return !result.preview.live[id];
    }) && result.preview.checkpoint && result.preview.discovered === null,
    testCase.id + " preview does not open a room, discover it, or mutate the checkpoint", result && result.preview);
  if (testCase.id === "dungeon") {
    check(result.preview.frames.dungeon === 0,
      "dungeon preview stays on the play wall without creating Prince", result.preview);
  } else if (testCase.id === "cinema") {
    check(result.preview.frames.cinema === 0 && !result.preview.cinemaPowered,
      "cinema preview stays powered off without creating a player", result.preview);
  }
  check(result && result.room === testCase.room && result.open[testCase.id] &&
      Object.keys(result.open).filter(function (id) { return result.open[id]; }).length === 1,
    testCase.id + " Continue returns to its paired lower room", result);
  check(result && result.persisted === testCase.id &&
      result.summary.indexOf("Saved " + testCase.label + " · ") === 0,
    testCase.id + " remains the checkpoint target and labels the recovery summary", result);
  if (testCase.id === "dungeon") {
    check(!result.dungeon.initiated && !result.dungeon.playing &&
        !result.dungeon.input && result.dungeon.frames === 0,
      "dungeon recovery stops at the play wall without starting Prince", result.dungeon);
  } else if (testCase.id === "cinema") {
    check(result.cinema && !result.cinema.powered && !result.cinema.playing &&
        !result.cinema.video && result.cinema.frames === 0,
      "cinema recovery leaves the projector and remote player off", result.cinema);
  } else if (testCase.id === "bedroom") {
    check(result.bedroom && !result.bedroom.spraying && !result.bedroom.bedWet &&
        result.bedroom.ttt === "idle",
      "bedroom recovery keeps its transient props and game fresh", result.bedroom);
  }
});

var mismatch = lib.runPageSync("loft-day.html", mismatchHarness(), 1200, {
  patchRaf: true,
});
check(mismatch && mismatch.errors.length === 0, "mismatched lower-room recovery has no uncaught errors", mismatch && mismatch.errors);
check(mismatch && mismatch.room === "kitchen" &&
    Object.keys(mismatch.open).every(function (id) { return !mismatch.open[id]; }) &&
    mismatch.persisted === undefined,
  "a lower-room id is accepted only for its paired upstairs room", mismatch);

var restarted = lib.runPageSync("loft-day.html", restartHarness(), 1200, {
  patchRaf: true,
});
check(restarted && restarted.errors.length === 0, "lower-room Start over has no uncaught errors", restarted && restarted.errors);
check(restarted && !restarted.gate && !restarted.preview && !restarted.openClass &&
    restarted.hidden && restarted.ariaHidden === null && !restarted.live &&
    !restarted.save && restarted.discovered === null && restarted.clickMe,
  "Start over removes the lower-room preview and discovery unlock, then returns to fresh entry", restarted);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

#!/usr/bin/env node
// A checkpoint taken downstairs returns to the matching lower room without
// reviving transient props, media, or embedded games.
"use strict";

var lib = require("./lib");

var CASES = [
  { id: "bathroom", room: "kitchen", label: "Bathroom" },
  { id: "dungeon", room: "garden", label: "Dungeon" },
  { id: "cinema", room: "cuddly", label: "Cinema" },
  { id: "bedroom", room: "office", label: "Bedroom" },
  { id: "entrance", room: "balcony", label: "Entrance" }
];

function harness(testCase) {
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
    'if(!sessionStorage.getItem("lower-recovery-seeded")){sessionStorage.setItem("lower-recovery-seeded","1");localStorage.setItem("loftCheckpoint:v1",JSON.stringify(saved));location.reload();return;}',
    'window.addEventListener("load",function(){setTimeout(function(){',
    'var gate=document.getElementById("loft-recovery-gate"),summary=document.getElementById("hunt-caption").textContent;',
    'if(gate)gate.querySelector(".loft-recovery-btn.primary").click();',
    'setTimeout(function(){var prince=window.__princeState&&window.__princeState(),cinema=window.__cinemaRoomState&&window.__cinemaRoomState(),bedroom=window.__bedroomRoomState&&window.__bedroomRoomState(),ttt=window.__bedroomTicTacToeState&&window.__bedroomTicTacToeState(),persisted=JSON.parse(localStorage.getItem("loftCheckpoint:v1"));',
    'document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs,summary:summary,room:window.currentStageName,persisted:persisted&&persisted.progress&&persisted.progress.lowerRoom,open:{bathroom:!!window.__bathroomRoomOpen,dungeon:!!(prince&&prince.basement),cinema:!!window.__cinemaRoomOpen,bedroom:!!window.__bedroomRoomOpen,entrance:!!window.__entranceRoomOpen},dungeon:{initiated:!!(prince&&prince.initiated),playing:!!(prince&&prince.playing),input:!!window.__princeInputActive,frames:document.querySelectorAll("#prince-basement iframe").length},cinema:cinema&&{powered:cinema.powered,playing:cinema.playing,video:cinema.video,frames:document.querySelectorAll("#cinema-player").length},bedroom:bedroom&&{spraying:bedroom.spraying,bedWet:bedroom.bedWet,ttt:ttt&&ttt.phase}});',
    '},220);},80);});',
    '})();</script>'
  ].join("\n");
}

function mismatchHarness() {
  return harness({ id: "cinema", room: "kitchen" });
}

var failures = 0;
function check(ok, msg, detail) {
  if (ok) console.log("  ✓ " + msg);
  else {
    failures++;
    console.log("  ✗ " + msg + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}

console.log("rsvp.html lower-room checkpoint recovery:");
CASES.forEach(function (testCase) {
  var result = lib.runPageSync("rsvp.html", harness(testCase), 1200, {
    patchRaf: true,
    urlSuffix: "#play"
  });
  check(result && result.errors.length === 0, testCase.id + " recovery has no uncaught errors", result && result.errors);
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

var mismatch = lib.runPageSync("rsvp.html", mismatchHarness(), 1200, {
  patchRaf: true,
  urlSuffix: "#play"
});
check(mismatch && mismatch.errors.length === 0, "mismatched lower-room recovery has no uncaught errors", mismatch && mismatch.errors);
check(mismatch && mismatch.room === "kitchen" &&
    Object.keys(mismatch.open).every(function (id) { return !mismatch.open[id]; }) &&
    mismatch.persisted === undefined,
  "a lower-room id is accepted only for its paired upstairs room", mismatch);

console.log("");
if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");

#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function snapshot() {
    return {
      seen: window.__seenRooms(),
      key: window.__captionKey(),
      caption: document.getElementById("hunt-caption").textContent,
      flash: window.__flashCaptionState()
    };
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__endAttract();
    window.__setLang("en");
    window.__secondRound = false;
    window.__setSeenRooms(["kitchen"]);
    window.__goToStage("garden");
    var phaseOne = snapshot();
    check("Phase 1 tracks an upstairs visit without replacing its game clue",
      phaseOne.seen.length === 2 && phaseOne.key !== "room_progress" &&
      (!phaseOne.flash || phaseOne.flash.owner !== "room-progress"), phaseOne);

    window.__secondRound = true;
    window.__goToStage("cuddly");
    var english = snapshot();
    check("a first Phase 2 visit reports compact English progress",
      english.seen.length === 3 && english.key === "room_progress" &&
      english.caption === "Rooms seen: 3/10 · keep exploring." &&
      english.flash && english.flash.owner === "room-progress", english);

    window.__setLang("cs");
    var czechLive = snapshot();
    check("a live progress caption keeps its count when switched to Czech",
      czechLive.caption === "Navštíveno: 3/10 · pokračuj dál.", czechLive);
    window.__setLang("en");

    window.__clearFlashCaption("room-progress");
    window.__setSeenRooms([
      "kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom"
    ]);
    window.__gardenPartyOn = true;
    window.__markRoomSeen("entrance");
    var partyComplete = snapshot();
    check("completion points toward the street even while the party remains optional",
      partyComplete.key === "room_visit_entrance_complete_party" &&
      partyComplete.caption === "You’ve seen the whole loft. The road is right outside.", partyComplete);
    window.__setLang("cs");
    var partyCompleteCzech = snapshot();
    check("party-on completion keeps the same street direction in Czech",
      partyCompleteCzech.caption === "Celý loft je prozkoumaný. Silnice čeká hned venku.", partyCompleteCzech);
    window.__setLang("en");
    window.__gardenPartyOn = false;

    window.__clearFlashCaption("room-progress");
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony", "dungeon"]);
    window.__markRoomSeen("bathroom");
    var bathroom = snapshot();
    check("a Bathroom first visit gives its own order-independent remaining count",
      bathroom.seen.length === 7 && bathroom.key === "room_visit_bathroom_few" &&
      bathroom.caption === "Here’s the bathroom. 3 more rooms to go.", bathroom);
    window.__setLang("cs");
    var bathroomCzech = snapshot();
    check("room-specific progress remains grammatical and live in Czech",
      bathroomCzech.caption === "Tady je koupelna. Zbývají ještě 3 místnosti.", bathroomCzech);
    window.__setLang("en");

    window.__clearFlashCaption("room-progress");
    window.__setSeenRooms(["kitchen", "garden", "cuddly"]);
    window.__goToStage("kitchen");
    var revisit = snapshot();
    check("revisiting a room neither increments nor replays progress",
      revisit.seen.length === 3 && (!revisit.flash || revisit.flash.owner !== "room-progress"), revisit);

    window.__cinematic = true;
    window.__goToStage("office");
    window.__cinematic = false;
    var editorial = snapshot();
    check("editorial cinematic cuts do not count as room visits",
      editorial.seen.length === 3 && editorial.seen.indexOf("office") === -1, editorial);

    window.__goToStage("garden");
    window.__saveLoftCheckpoint();
    var checkpoint = window.__loadLoftCheckpoint();
    check("checkpoints persist the exact seen-room set",
      checkpoint && checkpoint.progress &&
      JSON.stringify(checkpoint.progress.seenRooms) === JSON.stringify(["kitchen", "garden", "cuddly"]),
      checkpoint && checkpoint.progress);

    window.__setSeenRooms(["kitchen", "garden", "dungeon"]);
    window.__goToStage("garden");
    window.__openGardenPrince();
    await sleep(40);
    window.__navigateLowerRoom("cuddly");
    await sleep(800);
    var lowerPan = snapshot();
    check("a lower-floor pan counts only its settled lower-room destination",
      JSON.stringify(lowerPan.seen) === JSON.stringify(["kitchen", "garden", "dungeon", "cinema"]) &&
      lowerPan.seen.indexOf("cuddly") === -1 &&
      lowerPan.caption === "This is the cinema. 6 more rooms to go.",
      lowerPan);
    window.__navigateLowerRoom("balcony");
    await sleep(800);
    var entrancePan = snapshot();
    check("continuing downstairs still skips every hidden paired upstairs room",
      JSON.stringify(entrancePan.seen) === JSON.stringify(["kitchen", "garden", "dungeon", "cinema", "entrance"]) &&
      entrancePan.seen.indexOf("balcony") === -1 &&
      entrancePan.caption === "Here’s the front entrance. Explore 5 more rooms before the Road Trip.",
      entrancePan);
    window.__closeEntranceRoom();
    var balconyReturn = snapshot();
    check("returning Up from Entrance counts Balcony when it becomes visible",
      JSON.stringify(balconyReturn.seen) === JSON.stringify(["kitchen", "garden", "balcony", "dungeon", "cinema", "entrance"]) &&
      balconyReturn.caption.indexOf("6/10") !== -1,
      balconyReturn);

    window.__setLang("en");
    window.__unlockAllRooms();
    window.__setSeenRooms([
      "kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom"
    ]);
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    var complete = snapshot();
    check("the completion line fires only on the tenth distinct room",
      complete.seen.length === 10 && complete.key === "room_visit_entrance_complete" &&
      complete.caption === "You’ve seen the whole loft. The road is right outside." &&
      complete.flash && complete.flash.owner === "room-progress", complete);

    window.__setLang("cs");
    var czechComplete = snapshot();
    check("the live completion line switches to Czech",
      czechComplete.caption === "Celý loft je prozkoumaný. Silnice čeká hned venku.", czechComplete);
    window.__setLang("en");

    window.__clearFlashCaption("room-progress");
    window.__closeEntranceRoom();
    await sleep(760);
    window.__openEntranceRoom();
    await sleep(40);
    var completedRevisit = snapshot();
    check("a revisit after completion does not replay the completion line",
      completedRevisit.seen.length === 10 &&
      (!completedRevisit.flash || completedRevisit.flash.owner !== "room-progress"), completedRevisit);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) {
        out.errors.push("harness: " + String(error && error.stack || error));
      }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 9000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("room progress: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + JSON.stringify(item.detail)));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var officePremature = /if \(glass\) glass\.classList\.add\("done", "zoomed"\);[\s\S]{0,180}?setCaption\("complete"\)/.test(source);
console.log("  " + (!officePremature ? "✓" : "✗") +
  " solving Office no longer claims that the whole loft was seen");
if (officePremature) failed = true;
var checkpointTracksSeen = /seenRooms: seenRoomList\(\)/.test(source) &&
  /setSeenRooms\(Array\.isArray\(p\.seenRooms\)/.test(source);
console.log("  " + (checkpointTracksSeen ? "✓" : "✗") +
  " checkpoint capture and recovery both own the seen-room set");
if (!checkpointTracksSeen) failed = true;
var legacyFallback = /setSeenRooms\(Array\.isArray\(p\.seenRooms\) \? p\.seenRooms : \["kitchen", p\.room, p\.lowerRoom\]\)/.test(source);
console.log("  " + (legacyFallback ? "✓" : "✗") +
  " legacy checkpoints conservatively fall back to rooms known to have been visible");
if (!legacyFallback) failed = true;

if (failed) process.exit(1);
console.log("room progress: all checks passed");

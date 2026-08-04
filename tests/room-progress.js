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
    setLang("en");
    window.__setSeenRooms(["kitchen"]);
    window.goToStage("garden");
    var english = snapshot();
    check("a first intermediate visit reports compact English progress",
      english.seen.length === 2 && english.key === "room_progress" &&
      english.caption === "Rooms seen: 2/10 · keep exploring." &&
      english.flash && english.flash.owner === "room-progress", english);

    setLang("cs");
    var czechLive = snapshot();
    check("a live progress caption keeps its count when switched to Czech",
      czechLive.caption === "Navštíveno: 2/10 · pokračuj dál.", czechLive);
    setLang("en");

    window.goToStage("kitchen");
    var revisit = snapshot();
    check("revisiting a room neither increments nor replays progress",
      revisit.seen.length === 2 && (!revisit.flash || revisit.flash.owner !== "room-progress"), revisit);

    window.__cinematic = true;
    window.goToStage("cuddly");
    window.__cinematic = false;
    var editorial = snapshot();
    check("editorial cinematic cuts do not count as room visits",
      editorial.seen.length === 2 && editorial.seen.indexOf("cuddly") === -1, editorial);

    window.goToStage("garden");
    window.__saveLoftCheckpoint();
    var checkpoint = window.__loadLoftCheckpoint();
    check("checkpoints persist the exact seen-room set",
      checkpoint && checkpoint.progress &&
      JSON.stringify(checkpoint.progress.seenRooms) === JSON.stringify(["kitchen", "garden"]),
      checkpoint && checkpoint.progress);

    setLang("en");
    window.__unlockAllRooms();
    window.__setSeenRooms([
      "kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom"
    ]);
    window.goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(40);
    var complete = snapshot();
    check("the completion line fires only on the tenth distinct room",
      complete.seen.length === 10 && complete.key === "complete" &&
      complete.caption === "You’ve seen the whole loft ♥" &&
      complete.flash && complete.flash.owner === "room-progress", complete);

    setLang("cs");
    var czechComplete = snapshot();
    check("the live completion line switches to Czech",
      czechComplete.caption === "Prohlédli jste si celý loft ♥", czechComplete);
    setLang("en");

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

var result = lib.runPageSync("rsvp.html", harness, 7000, { patchRaf: true, seedRandom: true });
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

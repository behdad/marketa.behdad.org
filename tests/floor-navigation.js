#!/usr/bin/env node
"use strict";

// The lower floor uses one persistent bottom-chrome Up/Down control. A still-locked
// adjacent room keeps the same deliberate double-press contract as the main floor.
var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  }
  function floorState() {
    var button = document.getElementById("hunt-floor-btn");
    var coach = document.getElementById("hunt-floor-coach");
    return {
      hidden: button.hidden,
      mark: button.textContent,
      label: button.getAttribute("aria-label"),
      title: button.title,
      coachHidden: coach.hidden,
      coach: coach.textContent,
      room: window.currentStageName,
      max: window.__maxUnlocked(),
      bathroom: !!window.__bathroomRoomOpen,
      dungeon: !!(window.__princeState && window.__princeState().basement)
    };
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    window.__endAttract();
    window.__resetLowerRoomDiscovery();
    window.goToStage("kitchen");
    check("fresh upstairs chrome hides Down until discovery", floorState().hidden, floorState());

    window.__openBathroomRoom();
    await sleep(30);
    var first = floorState();
    check("first lower-room arrival shows a labelled Up control and its coach",
      !first.hidden && first.mark === "↑" && first.label === "Go upstairs" &&
      first.title === first.label && !first.coachHidden && first.coach === "Up gets you back.", first);
    var dots = document.getElementById("hunt-dots").getBoundingClientRect();
    var button = document.getElementById("hunt-floor-btn").getBoundingClientRect();
    check("Up sits to the right of the room dots with breathing room", button.left - dots.right >= 6,
      { dotsRight: dots.right, buttonLeft: button.left });

    setLang("cs");
    var czech = floorState();
    check("the live control and coach switch to Czech",
      czech.label === "Jít nahoru" && czech.title === czech.label && czech.coach === "Nahoru se vrátíš.", czech);
    setLang("en");

    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    var upstairs = floorState();
    check("Up returns upstairs and becomes the inverse Down control",
      !upstairs.hidden && upstairs.mark === "↓" && upstairs.label === "Go downstairs" &&
      !upstairs.bathroom && upstairs.coachHidden, upstairs);
    document.getElementById("hunt-floor-btn").click();
    await sleep(30);
    check("Down re-enters the paired lower room", floorState().bathroom && floorState().mark === "↑", floorState());

    window.__setMaxUnlocked(0);
    var next = document.getElementById("hunt-next");
    next.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await sleep(40);
    var pointerFirst = floorState();
    check("one pointer press cannot enter the locked next lower room",
      pointerFirst.room === "kitchen" && pointerFirst.bathroom && pointerFirst.max === 0, pointerFirst);
    next.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }));
    await sleep(40);
    var pointerSecond = floorState();
    check("the second pointer press unlocks and enters the next lower room",
      pointerSecond.room === "garden" && pointerSecond.dungeon && pointerSecond.max === 1, pointerSecond);

    await sleep(760);
    window.__closeMonitorPrince();
    await sleep(760);
    window.__setMaxUnlocked(0);
    window.goToStage("kitchen");
    window.__openBathroomRoom();
    key("ArrowRight");
    await sleep(40);
    var keyboardFirst = floorState();
    check("one keyboard press cannot enter the locked next lower room",
      keyboardFirst.room === "kitchen" && keyboardFirst.bathroom && keyboardFirst.max === 0, keyboardFirst);
    key("ArrowRight");
    await sleep(40);
    var keyboardSecond = floorState();
    check("the second keyboard press unlocks and enters the next lower room",
      keyboardSecond.room === "garden" && keyboardSecond.dungeon && keyboardSecond.max === 1, keyboardSecond);

    await sleep(760);
    window.__closeMonitorPrince();
    await sleep(760);
    window.__unlockAllRooms();
    window.goToStage("balcony");
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__toggleEntrancePorscheEngine();
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Shift", code: "ShiftLeft", shiftKey: true, bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "ArrowDown", code: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true
    }));
    var shiftedDown = window.__entranceRoomState().drive;
    check("Shift then Down changes gear without counting as brake",
      shiftedDown.gear === -1 && shiftedDown.holds.clutch && !shiftedDown.holds.brake, shiftedDown);
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: "ArrowDown", code: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true
    }));
    document.dispatchEvent(new KeyboardEvent("keyup", {
      key: "Shift", code: "ShiftLeft", bubbles: true, cancelable: true
    }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push("harness: " + String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 7000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("floor navigation: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + JSON.stringify(item.detail)));
  if (!item.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }

var source = fs.readFileSync(path.join(__dirname, "..", "rsvp.html"), "utf8");
var oldCloseIds = ["bathroom-room-close", "cinema-room-close", "prince-basement-close", "bedroom-room-close", "entrance-room-close"];
var oldClosePresent = oldCloseIds.filter(function (id) { return source.indexOf('id="' + id + '"') !== -1; });
console.log("  " + (!oldClosePresent.length ? "✓" : "✗") + " lower rooms no longer render corner dismiss X controls" +
  (!oldClosePresent.length ? "" : " — " + oldClosePresent.join(", ")));
if (oldClosePresent.length) failed = true;

if (failed) process.exit(1);
console.log("floor navigation: all checks passed");

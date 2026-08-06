#!/usr/bin/env node
"use strict";

// The whole-loft picker is a Phase-2 reward for finding downstairs. It shares the
// existing floor-control coach, exposes only visited rooms, and owns Tab/Escape while open.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name) {
    var event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    return event.defaultPrevented;
  }
  function state() { return window.__dollhouseState(); }
  function roomButton(name) {
    return [].slice.call(document.querySelectorAll(".loft-dollhouse-room")).filter(function (button) {
      var row = state().rooms[Array.prototype.indexOf.call(document.querySelectorAll(".loft-dollhouse-room"), button)];
      return row && row.room === name;
    })[0];
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    if (window.__removeClickMe) window.__removeClickMe();
    if (window.__stopHintBlink) window.__stopHintBlink();
    key("?");
    await sleep(20);
    var tabChip = [].slice.call(document.querySelectorAll(".kbd-keys")).filter(function (row) { return row.textContent === "Tab"; })[0];
    check("the keyboard dialog documents Tab as the whole-loft picker",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent === "open / close the whole-loft view",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent);
    key("Escape");
    await sleep(280);
    setLang("cs"); key("?"); await sleep(20);
    tabChip = [].slice.call(document.querySelectorAll(".kbd-keys")).filter(function (row) { return row.textContent === "Tab"; })[0];
    check("the keyboard dialog mirrors the Tab help in Czech",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent === "otevřít / zavřít pohled na celý loft",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent);
    key("Escape");
    await sleep(280);
    setLang("en");
    window.__resetLowerRoomDiscovery();
    window.__setSeenRooms(["kitchen", "bathroom"]);
    window.__markLowerRoomDiscovered();

    var phaseOneTab = key("Tab");
    check("Phase 1 keeps the picker locked even after a downstairs discovery",
      !phaseOneTab && !state().eligible && !state().button && !state().open, JSON.stringify(state()));

    window.__setSecondRound(true, { releaseHeld: false });
    check("starting Phase 2 reveals the grid button without inventing a coach",
      state().eligible && state().button && !state().coach, JSON.stringify(state()));

    window.goToStage("kitchen");
    window.__openBathroomRoom();
    await sleep(260);
    check("the first Phase-2 downstairs visit coaches both flanking controls together",
      !document.getElementById("hunt-floor-btn").hidden &&
      !document.getElementById("hunt-dollhouse-btn").hidden && state().coach &&
      document.getElementById("hunt-floor-coach-text").textContent ===
        "Whole loft on the left · floors on the right.", document.getElementById("hunt-floor-coach-text").textContent);
    setLang("cs");
    check("the combined coach follows Czech live",
      document.getElementById("hunt-floor-coach-text").textContent === "Celý loft vlevo · patra vpravo.",
      document.getElementById("hunt-floor-coach-text").textContent);
    setLang("en");

    document.getElementById("hunt-floor-coach-dismiss").click();
    check("the usual coach dismiss retires the one shared coach", state().coachRetired && !state().coach, JSON.stringify(state()));

    window.__setDollhouseCoachRetired(false, { silent: true });
    document.getElementById("hunt-dollhouse-btn").click();
    check("using the grid button opens the picker and retires its coach",
      state().open && state().coachRetired, JSON.stringify(state()));
    key("Tab");
    check("Tab closes the same picker without leaving the lower room", !state().open && window.__bathroomRoomOpen, JSON.stringify(state()));

    window.__setDollhouseCoachRetired(false, { silent: true });
    var tabHandled = key("Tab");
    var opened = state(), locked = opened.rooms.filter(function (room) { return room.locked; });
    check("Tab opens the same picker and retires its coach",
      tabHandled && opened.open && opened.coachRetired, JSON.stringify(opened));
    check("the 5×2 overview exposes only the two rooms actually visited",
      opened.rooms.length === 10 && locked.length === 8 &&
      opened.rooms.filter(function (room) { return !room.locked; }).map(function (room) { return room.room; }).join(",") === "kitchen,bathroom",
      JSON.stringify(opened.rooms));
    check("locked cells reveal no room names",
      [].slice.call(document.querySelectorAll(".loft-dollhouse-room:disabled span")).every(function (span) { return span.textContent === "?"; }));
    var roomBeforeKey = window.currentStageName;
    key("ArrowRight");
    check("the open picker blocks room shortcuts from acting underneath it",
      state().open && window.currentStageName === roomBeforeKey && window.__bathroomRoomOpen,
      JSON.stringify({ room: window.currentStageName, open: state().open }));

    setLang("cs");
    check("the open overview follows Czech live",
      document.getElementById("loft-dollhouse-title").textContent === "Celý loft" &&
      document.getElementById("loft-dollhouse-main-label").textContent === "Hlavní patro" &&
      roomButton("kitchen").textContent.indexOf("Kuchyň") !== -1,
      document.getElementById("loft-dollhouse-title").textContent);
    setLang("en");

    var lockedDungeon = roomButton("dungeon"), before = window.currentStageName;
    lockedDungeon.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    check("a scripted click cannot use an undiscovered room as a navigation shortcut",
      state().open && window.currentStageName === before && window.__bathroomRoomOpen,
      JSON.stringify({ room: window.currentStageName, open: state().open }));

    key("Escape");
    check("Escape closes the picker without changing rooms",
      !state().open && window.currentStageName === before && window.__bathroomRoomOpen, JSON.stringify(state()));
    key("Tab");

    roomButton("kitchen").click();
    check("a discovered main-floor cell closes the picker and returns upstairs",
      !state().open && window.currentStageName === "kitchen" && !window.__bathroomRoomOpen, JSON.stringify(state()));
    key("Tab");
    roomButton("bathroom").click();
    check("a discovered lower-floor cell opens its paired room",
      !state().open && window.currentStageName === "kitchen" && window.__bathroomRoomOpen, JSON.stringify(state()));

    window.__saveLoftCheckpoint();
    var saved = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
    check("coach retirement belongs to the loft checkpoint",
      saved && saved.progress && saved.progress.dollhouseCoachRetired === true, JSON.stringify(saved && saved.progress));

    window.__resetLowerRoomDiscovery();
    check("Start-over ownership clears discovery, picker, button, and coach retirement together",
      !state().eligible && !state().button && !state().open && !state().coachRetired, JSON.stringify(state()));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push(String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 7000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("dollhouse: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("dollhouse: all checks passed");

#!/usr/bin/env node
"use strict";

// Tab and the grid button own a full-loft picker from the beginning. Downstairs
// discovery later reveals the shared floor coach; visited rooms stay sharp.
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
    return document.querySelector('.loft-dollhouse-room[data-dollhouse-room="' + name + '"]');
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

    var undiscoveredTab = key("Tab");
    check("Tab opens The Loft before downstairs is discovered and its grid button is already present",
      undiscoveredTab && state().eligible && !state().controlsUnlocked && state().button && state().open,
      JSON.stringify(state()));
    check("the first Cuddly-puddly thumbnail is initialized with a warm projector image",
      document.getElementById("cuddly-wallscreen").classList.contains("chan-fire") &&
      !!document.getElementById("cuddly-flame-img").getAttribute("href") &&
      document.getElementById("cuddly-flame-img").style.filter === "none");
    check("the Entrance thumbnail uses the real scene's daylight state",
      document.getElementById("entrance-room-art").classList.contains("dollhouse-day-preview") &&
      !document.getElementById("entrance-sky-bg").getAttribute("style"));
    check("the first Bathroom thumbnail has a towel paint fallback",
      document.getElementById("bathroom-waffle-towel").getAttribute("fill") ===
        "url(#bathroom-waffle) #a8a39e");
    key("Tab");

    document.getElementById("stage-balcony").classList.add("dusk");
    key("Tab");
    check("the Entrance thumbnail follows the live night state",
      !document.getElementById("entrance-room-art").classList.contains("dollhouse-day-preview"));
    key("Tab");
    document.getElementById("stage-balcony").classList.remove("dusk");

    await sleep(0);
    var tabStops = [].slice.call(document.querySelectorAll("button,a[href],input,select,textarea,summary,iframe,[contenteditable],[tabindex]"))
      .filter(function (el) { return el.tabIndex >= 0; });
    check("the game exposes no browser tab stops", !tabStops.length,
      tabStops.map(function (el) { return el.id || el.className || el.tagName; }).join(","));

    window.__markLowerRoomDiscovered();
    check("discovering downstairs reveals the grid button without inventing a coach",
      state().eligible && state().controlsUnlocked && state().button && !state().coach, JSON.stringify(state()));

    window.goToStage("kitchen");
    window.__openBathroomRoom();
    await sleep(260);
    check("the first downstairs visit coaches both flanking controls together",
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
    check("locked cells retain their real names and blur both name and thumbnail",
      roomButton("garden").classList.contains("locked") &&
      roomButton("garden").querySelector("span").textContent === "Garden" &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter.indexOf("blur") !== -1 &&
      getComputedStyle(roomButton("garden").querySelector("svg")).filter.indexOf("blur") !== -1);
    check("all lower previews are SVG uses of their real art or the Dungeon portrait",
      ["bathroom", "cinema", "bedroom", "entrance"].every(function (name) {
        return roomButton(name).querySelector('use.loft-dollhouse-live-preview');
      }) && roomButton("dungeon").querySelector('use[href="#loft-dollhouse-dungeon-art"]'));
    check("Cinema click targets stay transparent in the cloned room art",
      getComputedStyle(document.querySelector("#cinema-room-art .cinema-hit")).fill === "rgba(0, 0, 0, 0)",
      getComputedStyle(document.querySelector("#cinema-room-art .cinema-hit")).fill);
    var roomBeforeKey = window.currentStageName;
    key("ArrowRight");
    check("the open picker blocks room shortcuts from acting underneath it",
      state().open && window.currentStageName === roomBeforeKey && window.__bathroomRoomOpen,
      JSON.stringify({ room: window.currentStageName, open: state().open }));

    setLang("cs");
    check("the open overview follows Czech live",
      document.getElementById("loft-dollhouse-title").textContent === "Loft" &&
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

    key("Tab");
    document.getElementById("loft-game-strip").classList.add("party-on");
    window.__closeDollhouse(); key("Tab");
    check("the Kitchen / Bar cell switches its complete live stage to the Bar with the party",
      roomButton("kitchen").classList.contains("bar-active") &&
      roomButton("kitchen").querySelector("span").textContent === "Kitchen / Bar" &&
      roomButton("kitchen").querySelector("use.loft-dollhouse-live-preview").getAttribute("href") === "#stage-kitchen" &&
      document.getElementById("kitchen-bar").style.opacity === "1" &&
      document.getElementById("kitchen-post").style.opacity === "1");
    document.getElementById("loft-game-strip").classList.remove("party-on");
    window.__closeDollhouse();

    document.getElementById("stage-kitchen").classList.add("dusk");
    key("Tab");
    check("the Kitchen / Bar cell also switches to the Bar at night",
      roomButton("kitchen").classList.contains("bar-active") &&
      document.getElementById("kitchen-bar").style.opacity === "1");
    document.getElementById("stage-kitchen").classList.remove("dusk");
    window.__closeDollhouse();

    window.__saveLoftCheckpoint();
    var saved = JSON.parse(localStorage.getItem("loftCheckpoint:v1"));
    check("coach retirement belongs to the loft checkpoint",
      saved && saved.progress && saved.progress.dollhouseCoachRetired === true, JSON.stringify(saved && saved.progress));

    window.__resetLowerRoomDiscovery();
    check("Start-over clears discovery and coach retirement but leaves both picker entrances available",
      state().eligible && !state().controlsUnlocked && state().button && !state().open && !state().coachRetired,
      JSON.stringify(state()));

    key("Tab");
    roomButton("garden").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    check("double-clicking a locked destination deliberately unlocks and enters it",
      !state().open && window.currentStageName === "garden" && window.__roomSeen("garden"),
      JSON.stringify({ room: window.currentStageName, open: state().open }));

    window.__setSeenRooms(["kitchen"]);
    key("Tab");
    var touchTarget = roomButton("office");
    touchTarget.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    touchTarget.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    check("double-tapping a locked destination does the same deliberate mobile unlock",
      !state().open && window.currentStageName === "office" && window.__roomSeen("office"),
      JSON.stringify({ room: window.currentStageName, open: state().open }));
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

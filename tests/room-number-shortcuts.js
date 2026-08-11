#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(value) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true }));
  }
  function lowerId() {
    if (window.__bathroomRoomOpen) return "bathroom";
    if (window.__princeState && window.__princeState().basement) return "dungeon";
    if (window.__cinemaRoomOpen) return "cinema";
    if (window.__bedroomRoomOpen) return "bedroom";
    if (window.__entranceRoomOpen) return "entrance";
    return null;
  }
  async function run() {
    window.__unlockAllRooms();
    var upper = ["kitchen", "garden", "cuddly", "office", "balcony"];
    var lower = ["bathroom", "dungeon", "cinema", "bedroom", "entrance"];
    var lowerKeys = ["6", "7", "8", "9", "0"];
    for (var i = 0; i < upper.length; i++) {
      window.__goToStage("kitchen");
      key(lowerKeys[i]);
      await sleep(60);
      check(lowerKeys[i] + " opens " + lower[i],
        window.__currentStageName === upper[i] && lowerId() === lower[i],
        window.__currentStageName + "/" + lowerId());
      key("Escape");
      await sleep(20);
      var afterEscape = lowerId();
      key("Backspace");
      await sleep(20);
      check("bare back keys keep " + lower[i] + " open",
        window.__currentStageName === upper[i] && afterEscape === lower[i] && lowerId() === lower[i],
        window.__currentStageName + "/" + afterEscape + "/" + lowerId());
      key(String(i + 1));
      await sleep(800);
      check(String(i + 1) + " returns to " + upper[i] + " upstairs",
        window.__currentStageName === upper[i] && lowerId() === null,
        window.__currentStageName + "/" + lowerId());
    }
    key("0");
    await sleep(60);
    key("6");
    await sleep(800);
    check("6–0 navigate directly along the lower floor",
      window.__currentStageName === "kitchen" && lowerId() === "bathroom",
      window.__currentStageName + "/" + lowerId());
    key("?");
    await sleep(30);
    var english = document.querySelector(".kbd-dialog");
    check("English shortcut card names both fixed floors", english &&
      english.textContent.indexOf("upstairs room") !== -1 &&
      english.textContent.indexOf("downstairs room") !== -1, english && english.textContent);
    key("?");
    await sleep(280);
    window.__setLang("cs");
    key("?");
    await sleep(30);
    var czech = document.querySelector(".kbd-dialog");
    check("Czech shortcut card names both fixed floors", czech &&
      czech.textContent.indexOf("místnost nahoře") !== -1 &&
      czech.textContent.indexOf("místnost dole") !== -1, czech && czech.textContent);
    key("?");
    await sleep(280);
    window.__setLang("en");
    key("5");
    await sleep(60);
    window.__openEntranceRoom();
    window.__openEntrancePorscheDriveHud();
    window.__entranceDriveTransmissionMode("auto", false);
    window.__entranceRoadtripDevStart();
    window.__entranceRoadtripSetRouteDistance("banff", 420);
    var beforeDetour = window.__entranceRoomState().drive.roadtrip;
    window.__exitEntranceRoadtrip();
    window.__hideEntrancePorscheDriveHud();
    key("2");
    await sleep(800);
    var parked = window.__entranceRoomState().drive.roadtrip;
    key("0");
    await sleep(80);
    var returnedState = window.__entranceRoomState();
    var returned = returnedState.drive.roadtrip;
    check("0 restores the exact parked Entrance state without resuming Road Trip",
      window.__currentStageName === "balcony" && window.__entranceRoomOpen &&
      beforeDetour.active && !parked.active && parked.paused && !returned.active &&
      returned.paused && returnedState.drive.hud === false &&
      returned.route === beforeDetour.route && returned.banffDistance === beforeDetour.banffDistance,
      JSON.stringify({ parked: parked, hud: returnedState.drive.hud, returned: returned }));
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push(String(error && error.stack || error)); }).then(function () {
        out.errors = out.errors.concat((window.__errs || []).slice());
        var pre = document.createElement("pre");
        pre.id = "__report";
        pre.textContent = JSON.stringify(out);
        document.body.appendChild(pre);
      });
    }, 250);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 12000, { patchRaf: true, seedRandom: true });
if (!result) { console.error("room number shortcuts: no report"); process.exit(1); }
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
console.log("room number shortcuts: all " + result.checks.length + " checks passed");

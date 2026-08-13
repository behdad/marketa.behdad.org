#!/usr/bin/env node
// Road Trip remains unlocked and directly reachable while the optional Party continues.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre><script>
window.addEventListener("load", function () { setTimeout(function () {
  var report = { errors: [] };
  try {
    window.__unlockAllRooms();
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setGardenParty(true, false);
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    var partyBefore = !!window.__gardenPartyOn;
    window.__openEntrancePorscheDriveHud();
    var after = window.__entranceRoomState();
    report = {
      errors: [],
      partyBefore: partyBefore,
      partyAfter: !!window.__gardenPartyOn,
      authorized: !!after.drive.roadtrip.authorized,
      unlocked: !!after.drive.roadtrip.unlocked,
      hud: !!after.drive.hud
    };
  } catch (error) { report.errors.push(String(error && error.stack || error)); }
  document.getElementById("__report").textContent = JSON.stringify(report);
}, 250); });
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4000, {
  patchRaf: true,
  urlSuffix: "?fresh=roadtrip-party-authorization-" + Date.now()
});
var ok = result && !result.errors.length && result.partyBefore && result.partyAfter &&
  result.authorized && result.unlocked && result.hud;
if (!ok) {
  console.error("Road Trip Party authorization failed:", JSON.stringify(result));
  process.exit(1);
}
console.log("Road Trip stays authorized and directly reachable while Party remains active.");

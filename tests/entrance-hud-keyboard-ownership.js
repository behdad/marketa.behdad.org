#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function state() { return window.__entranceRoomState(); }
  function ownership() {
    if (window.__entranceDriveKeyboardOwnership) {
      return copy(window.__entranceDriveKeyboardOwnership());
    }
    var saved = window.__captureCheckpointSystems().entrance.drive;
    return { owned: false, hudOpen: !!saved.hud, partyStopPending: false };
  }
  function key(type, key, code, target, options) {
    var event = new KeyboardEvent(type, Object.assign({
      key: key, code: code || key, bubbles: true, cancelable: true
    }, options || {}));
    (target || document).dispatchEvent(event);
    return event;
  }
  function snap(extra) {
    var room = document.getElementById("entrance-room");
    return Object.assign({
      room: window.__currentStageName,
      entranceOpen: !!window.__entranceRoomOpen,
      lowerSlide: copy(window.__lowerRoomNavigationState()),
      hudClass: room.classList.contains("drive-hud-visible"),
      coach: document.getElementById("entrance-drive-coach").classList.contains("show"),
      ownership: ownership(),
      state: copy(state())
    }, extra || {});
  }
  async function run() {
    try {
      Object.defineProperty(document, "hasFocus", {
        value: function () { return true; }, configurable: true
      });
      window.__unlockAllRooms();
      window.__goToStage("garden");
      window.__openGardenPrince();
      await sleep(50);

      // This is the reported route: a one-step lower-floor shortcut from Dungeon
      // to Entrance, followed by selecting the road without relying on Tab focus.
      var shortcut = key("keydown", "0", "Digit0", document);
      await sleep(780);
      var viewport = document.querySelector(".hunt-viewport");
      var road = document.querySelector(".entrance-road-cursor");
      road.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      report.steps.opened = snap({ shortcutPrevented: shortcut.defaultPrevented,
        focus: document.activeElement && (document.activeElement.id || document.activeElement.className) });

      // A presentation repaint can lag restore/transition ownership. Remove only
      // the painted class: controller state must still route Enter to ignition.
      document.getElementById("entrance-room").classList.remove("drive-hud-visible");
      try { viewport.focus({ preventScroll: true }); } catch (_error) { viewport.focus(); }
      var enter = key("keydown", "Enter", "Enter", document.activeElement || document);
      report.steps.enter = snap({ prevented: enter.defaultPrevented,
        target: enter.target && (enter.target.id || enter.target.className) });

      // Repeat the same repaint gap for steering. Keyup must release the hold and
      // neither edge may leak to lower-room navigation.
      document.getElementById("entrance-room").classList.remove("drive-hud-visible");
      var leftDown = key("keydown", "ArrowLeft", "ArrowLeft", document);
      var held = copy(state().drive.holds);
      var leftUp = key("keyup", "ArrowLeft", "ArrowLeft", document);
      await sleep(40);
      report.steps.steer = snap({ downPrevented: leftDown.defaultPrevented,
        upPrevented: leftUp.defaultPrevented, held: held });

      // Road Trip no longer requires ending Party. Reopening the HUD while Party is
      // live must immediately transfer keyboard ownership to its fresh coach.
      window.__dismissEntrancePorscheDriveHud();
      window.__setSecondRound(false, { releaseHeld: false });
      window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
        "bathroom", "dungeon", "cinema", "bedroom", "entrance"]);
      window.__setSecondRound(true, { releaseHeld: false });
      window.__setGardenParty(true, false);
      road.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      report.steps.partyOpen = snap({ party: !!window.__gardenPartyOn });
      var handoffEnter = key("keydown", "Enter", "Enter", document);
      report.steps.handoff = snap({ enterPrevented: handoffEnter.defaultPrevented });
    } catch (error) {
      report.errors.push(String(error && error.stack || error));
    }
    report.errors = (window.__errs || []).concat(report.errors);
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  window.addEventListener("load", function () { setTimeout(function () {
    run();
  }, 220); });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 4200, {
  patchRaf: true,
  forceMotion: true,
  urlSuffix: "?fresh=entrance-hud-keyboard-ownership",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}

console.log("loft-day.html Entrance HUD keyboard ownership:");
var s = result && result.steps || {};
check(result && result.errors.length === 0,
  "the focused keyboard probe has no page errors", result && result.errors);
check(s.opened && s.opened.shortcutPrevented && s.opened.room === "balcony" &&
  s.opened.entranceOpen && !s.opened.lowerSlide.active && s.opened.hudClass && s.opened.coach &&
  s.opened.ownership.owned && s.opened.ownership.hudOpen,
  "Dungeon → Entrance → road opens a coach-owned driving HUD", s.opened);
check(s.enter && s.enter.prevented && s.enter.state.car.engineOn && s.enter.coach &&
  s.enter.ownership.owned && s.enter.room === "balcony" && s.enter.entranceOpen,
  "controller ownership starts the engine even when the presentation class is between paints", s.enter);
check(s.steer && s.steer.downPrevented && s.steer.upPrevented && s.steer.held.steerLeft &&
  !s.steer.state.drive.holds.steerLeft && s.steer.room === "balcony" &&
  s.steer.entranceOpen && !s.steer.lowerSlide.active,
  "steering press/release cannot leak into lower-room navigation during a repaint gap", s.steer);
check(s.partyOpen && s.partyOpen.party && s.partyOpen.state.drive.hud &&
  s.partyOpen.ownership.owned && !s.partyOpen.ownership.partyStopPending &&
  !s.partyOpen.state.car.engineOn && s.partyOpen.room === "balcony" &&
  s.partyOpen.entranceOpen && !s.partyOpen.lowerSlide.active,
  "Road Trip opens immediately and owns the keyboard while Party stays live", s.partyOpen);
check(s.handoff && s.handoff.enterPrevented && s.handoff.state.drive.hud &&
  s.handoff.state.car.engineOn && s.handoff.coach && s.handoff.ownership.owned &&
  s.handoff.ownership.hudOpen && !s.handoff.ownership.partyStopPending,
  "the fresh coach keeps ownership and Enter starts the car", s.handoff);

if (failures) process.exit(1);
console.log("Entrance HUD keyboard ownership assertions passed.");

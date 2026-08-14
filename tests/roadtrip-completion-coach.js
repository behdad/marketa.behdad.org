#!/usr/bin/env node
// Ten-room Road Trip coach: delayed attention, bilingual responsive card, persistence, and actions.
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report" style="position:fixed;left:-9999px">pending</pre>
<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function coach() { return copy(window.__roadtripCompletionCoachState()); }
  function saved() {
    window.__saveLoftCheckpoint();
    var row = JSON.parse(localStorage.getItem("loftCheckpoint:v1") || "null");
    return row && row.progress;
  }
  function box(node) {
    var r = node.getBoundingClientRect();
    return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
  }
  function restoreShown() {
    window.__restoreRoadtripCompletionCoach({
      roadtripCompletionCoachPending: false,
      roadtripCompletionCoachShown: true,
      roadtripCompletionCoachAcknowledged: false
    });
  }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        if (window.__removeClickMe) window.__removeClickMe();
        window.__unlockAllRooms();
        window.__goToStage("garden");
        window.__setSecondRound(true, { releaseHeld: false });
        window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
          "bathroom", "dungeon", "cinema", "bedroom"]);
        if (window.__setDeviceNotificationHold) window.__setDeviceNotificationHold(true);
        var blocker = document.createElement("div");
        blocker.className = "pb-dialog-backdrop";
        document.body.appendChild(blocker);
        window.__markRoomSeen("entrance");
        report.armed = { state: coach(), caption: copy(window.__captionState()), saved: saved() };
        await sleep(2450);
        report.blocked = { state: coach(), visible: document.getElementById("roadtrip-completion-coach").classList.contains("show"), caption: copy(window.__captionState()) };
        blocker.remove();
        await sleep(420);
        var root = document.getElementById("roadtrip-completion-coach");
        var card = root.querySelector(".hunt-coach-card");
        var action = root.querySelector(".roadtrip-completion-action");
        var area = document.getElementById("hunt-fullscreen-area");
        report.shown = {
          state: coach(), caption: copy(window.__captionState()), saved: saved(),
          en: { copy: root.querySelector(".hunt-coach-copy").textContent, action: action.textContent },
          geometry: { area: box(area), card: box(card), action: box(action) }
        };
        window.__setLang("cs");
        report.shown.cs = { copy: root.querySelector(".hunt-coach-copy").textContent, action: action.textContent };
        window.__setLang("en");
        card.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.cardGrace = { state: coach(), caption: copy(window.__captionState()) };
        await sleep(1050);
        card.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.cardDismiss = { state: coach(), caption: copy(window.__captionState()) };

        restoreShown(); await sleep(1300);
        root.querySelector(".hunt-coach-x").dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        report.xDismiss = { state: coach(), caption: copy(window.__captionState()) };

        restoreShown(); await sleep(420);
        var space = new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true, cancelable: true });
        document.dispatchEvent(space);
        report.spaceDismiss = { state: coach(), caption: copy(window.__captionState()), prevented: space.defaultPrevented, saved: saved() };

        restoreShown(); await sleep(1300);
        action.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        await sleep(120);
        report.action = { state: coach(), room: window.__currentStageName, entrance: !!window.__entranceRoomOpen };
      } catch (error) { report.errors.push(String(error && error.stack || error)); }
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 250);
  });
})();
</script>`;

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : "   [" + JSON.stringify(detail) + "]")); }
}
function run(name, width, height) {
  var result = lib.runPageSync("loft-day.html", HARNESS, 8500, {
    patchRaf: true, forceMotion: true,
    urlSuffix: "?fresh=roadtrip-completion-coach-" + name + "-" + Date.now(),
    chromeFlags: "--window-size=" + width + "," + height
  });
  console.log("\n" + name + ":");
  check(result && result.errors.length === 0, "the coach lifecycle has no uncaught errors", result && result.errors);
  var armed = result && result.armed;
  check(armed && armed.state.pending && !armed.state.shown && !armed.state.acknowledged && armed.state.scheduled &&
    armed.caption.base && armed.caption.base.owner === "roadtrip-departure" &&
    armed.saved && armed.saved.roadtripCompletionCoachPending && !armed.saved.roadtripCompletionCoachShown &&
    !armed.saved.roadtripCompletionCoachAcknowledged,
    "the tenth visit checkpoints a delayed coach while pinning the departure caption", armed);
  check(result && result.blocked && result.blocked.state.pending && result.blocked.state.scheduled && !result.blocked.visible &&
    result.blocked.caption.base && result.blocked.caption.base.owner === "roadtrip-departure",
    "higher-priority modal attention keeps the due coach serialized and leaves its caption base intact", result && result.blocked);
  var shown = result && result.shown;
  check(shown && shown.state.shown && shown.state.visible && !shown.state.pending && !shown.state.acknowledged &&
    shown.saved && shown.saved.roadtripCompletionCoachShown && !shown.saved.roadtripCompletionCoachPending &&
    shown.caption.base && shown.caption.base.owner === "roadtrip-departure",
    "the card appears once attention clears and checkpoints its shown state without replacing the caption", shown);
  check(shown && shown.en.copy === "You’ve seen the whole Loft. Let’s go on a Road Trip." &&
    shown.en.action === "Go to the car →" && shown.cs.copy === "Prošl(a) jsi celý Loft. Co takhle vyrazit na výlet?" &&
    shown.cs.action === "Jít k autu →", "English and Czech coach copy/actions stay paired", shown && { en:shown.en, cs:shown.cs });
  var g = shown && shown.geometry;
  check(g && g.card.left >= g.area.left - 1 && g.card.right <= g.area.right + 1 &&
    g.card.top >= g.area.top - 1 && g.card.bottom <= g.area.bottom + 1 &&
    g.action.left >= g.card.left && g.action.right <= g.card.right && g.action.height >= 36,
    "the responsive card and primary action fit inside the game surface", g);
  check(result && result.cardGrace && !result.cardGrace.state.acknowledged &&
    result.cardGrace.state.visible && result.cardGrace.caption.base &&
    result.cardGrace.caption.base.owner === "roadtrip-departure",
    "the card body ignores an accidental click during its pointer grace", result && result.cardGrace);
  check(result && result.cardDismiss && result.cardDismiss.state.acknowledged &&
    !result.cardDismiss.state.visible && result.cardDismiss.caption.base &&
    result.cardDismiss.caption.base.owner === "roadtrip-departure",
    "the card body dismisses after its pointer grace", result && result.cardDismiss);
  ["xDismiss", "spaceDismiss"].forEach(function (kind) {
    var row = result && result[kind];
    check(row && row.state.acknowledged && !row.state.visible && row.caption.base &&
      row.caption.base.owner === "roadtrip-departure" && (kind !== "spaceDismiss" || row.prevented),
      kind + " acknowledges the coach while preserving the pinned departure caption", row);
  });
  check(result && result.spaceDismiss && result.spaceDismiss.saved &&
    result.spaceDismiss.saved.roadtripCompletionCoachAcknowledged &&
    result.spaceDismiss.saved.roadtripCompletionCoachShown && !result.spaceDismiss.saved.roadtripCompletionCoachPending,
    "acknowledgement is durable in the checkpoint", result && result.spaceDismiss);
  check(result && result.action && result.action.state.acknowledged && result.action.room === "balcony" && result.action.entrance,
    "Go to the car opens Entrance through the ordinary navigation owners", result && result.action);
}

console.log("loft-day.html Road Trip completion coach:");
run("desktop", 1100, 900);
run("mobile-landscape", 759, 390);
if (failures) process.exit(1);
console.log("\nRoad Trip completion-coach checks passed.");

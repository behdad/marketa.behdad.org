#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = JSON.parse(sessionStorage.getItem("roadtrip-caption-report") || '{"errors":[],"steps":{}}');
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function snapshot(label, extra) {
    var state = window.__captionState();
    report.steps[label] = Object.assign({
      text: document.getElementById("hunt-caption").textContent.trim(),
      key: window.__captionKey(),
      caption: state,
      departure: window.__roadtripDepartureCaptionState(),
      party: !!window.__gardenPartyOn,
      room: window.__currentStageName,
      entrance: !!window.__entranceRoomOpen,
      departureClass: document.getElementById("hunt-caption").classList.contains("roadtrip-departure-caption")
    }, extra || {});
  }
  function finish() {
    report.errors = (window.__errs || []).concat(report.errors || []);
    sessionStorage.removeItem("roadtrip-caption-step");
    sessionStorage.removeItem("roadtrip-caption-report");
    document.getElementById("__report").textContent = JSON.stringify(report);
  }
  function saveAndReload(step) {
    if (!window.__saveLoftCheckpoint()) throw new Error("checkpoint save failed");
    sessionStorage.setItem("roadtrip-caption-step", step);
    sessionStorage.setItem("roadtrip-caption-report", JSON.stringify(report));
    location.reload();
  }
  async function continueCheckpoint() {
    var gate = document.getElementById("loft-recovery-gate");
    if (!gate) throw new Error("missing recovery gate");
    gate.querySelector(".loft-recovery-btn.primary").click();
    await sleep(650);
  }
  async function fresh() {
    window.__endAttract();
    if (window.__finishOpeningGuide) window.__finishOpeningGuide();
    if (window.__removeClickMe) window.__removeClickMe();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "dungeon", "cinema", "bedroom", "entrance"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__setPartyMode(true, true, false);
    if (window.__stopCueDrip) window.__stopCueDrip();
    window.__goToStage("office");
    snapshot("nine");

    window.__markRoomSeen("bathroom");
    await sleep(80);
    snapshot("tenth");
    window.__setLang("cs");
    snapshot("czech");
    window.__setLang("en");

    var low = window.__captionOverlay("room_progress", {
      owner: "ordinary-chatter", scope: "stage:office", priority: 30,
      replacements: { n: 10 }, duration: 1000
    });
    window.__setCaption("office");
    window.__goToStage("kitchen");
    snapshot("ordinary-blocked", { lowAccepted: !!low });

    var modal = window.__captionExclusive("party_rooms_complete", {
      owner: "modal-probe", scope: "stage:kitchen", priority: 120
    });
    snapshot("modal");
    window.__cancelCaption("modal-probe");
    snapshot("after-modal");

    window.__cinematic = true;
    window.__captionExclusive("cine_anywhere", {
      owner: "cinematic", scope: "global", priority: 120
    });
    snapshot("cinematic");
    window.__cancelCaption("cinematic");
    window.__cinematic = false;
    snapshot("after-cinematic");
    saveAndReload("pending");
  }
  async function entranceLast() {
    window.__closeEntranceRoom();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony",
      "bathroom", "dungeon", "cinema", "bedroom"]);
    window.__setSecondRound(true, { releaseHeld: false });
    window.__goToStage("balcony");
    window.__openEntranceRoom();
    await sleep(80);
    snapshot("entrance-last", { seen: window.__seenRooms() });
    finish();
  }
  async function resumed(step) {
    await continueCheckpoint();
    if (step === "pending") {
      snapshot("continued-pending");
      window.__goToStage("balcony");
      window.__openEntranceRoom();
      await sleep(80);
      snapshot("reached-car");
      await entranceLast();
      return;
    }
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      var step = sessionStorage.getItem("roadtrip-caption-step");
      (step ? resumed(step) : fresh()).catch(function (error) {
        report.errors.push(String(error && error.stack || error));
        finish();
      });
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("loft-day.html", HARNESS, 7500, {
  patchRaf: true,
  seedRandom: true,
  forceMotion: true,
  urlSuffix: "?fresh=roadtrip-departure-caption",
  chromeFlags: "--window-size=1100,900"
});
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail))); }
}
function step(name) { return result && result.steps && result.steps[name]; }
var exact = "Who wants to go on a Road Trip? Head out to the car.";

console.log("loft-day.html tenth-room Road Trip caption:");
check(result && result.errors.length === 0, "the checkpoint round-trip has no page errors", result && result.errors);
check(step("nine") && !step("nine").departure.pending && step("nine").text !== exact,
  "nine rooms do not publish the departure caption", step("nine"));
check(step("tenth") && step("tenth").text === exact && step("tenth").key === "roadtrip_departure_caption" &&
  step("tenth").departure.pending && !step("tenth").departure.acknowledged && step("tenth").party &&
  step("tenth").departureClass,
  "the tenth room pins the exact departure line while Party remains live", step("tenth"));
check(step("czech") && step("czech").text === "Kdo chce vyrazit na výlet? Vydej se ven k autu.",
  "the pinned line repaints naturally in Czech", step("czech"));
check(step("ordinary-blocked") && !step("ordinary-blocked").lowAccepted &&
  step("ordinary-blocked").text === exact && step("ordinary-blocked").room === "kitchen" &&
  step("ordinary-blocked").caption.base.owner === "roadtrip-departure",
  "ordinary feedback and room rotation cannot replace the pinned line", step("ordinary-blocked"));
check(step("modal") && step("modal").caption.exclusive.owner === "modal-probe" &&
  step("modal").text !== exact && step("after-modal").text === exact,
  "a higher-priority modal overrides the line and reveals it again on dismissal",
  { modal: step("modal"), after: step("after-modal") });
check(step("cinematic") && step("cinematic").key === "cine_anywhere" && step("cinematic").text !== exact &&
  step("after-cinematic").text === exact,
  "Trailer copy can own the caption and ordinary restoration returns the pin",
  { cinematic: step("cinematic"), after: step("after-cinematic") });
check(step("continued-pending") && step("continued-pending").text === exact &&
  step("continued-pending").departure.pending && step("continued-pending").party,
  "Continue restores the pending caption with Party still running", step("continued-pending"));
check(step("reached-car") && step("reached-car").entrance && step("reached-car").party &&
  !step("reached-car").departure.pending && step("reached-car").departure.acknowledged &&
  step("reached-car").key === "lower_entrance" && step("reached-car").text !== exact &&
  !step("reached-car").departureClass,
  "direct Entrance navigation hands the caption to the car without requiring Party-off",
  step("reached-car"));
check(step("entrance-last") && step("entrance-last").entrance && step("entrance-last").seen.length === 10 &&
  step("entrance-last").key === "lower_entrance" &&
  step("entrance-last").text.indexOf("explore all 10 rooms") === -1,
  "unlocking Entrance last records 10/10 before the car chooses its first caption",
  step("entrance-last"));

if (failures) process.exit(1);
console.log("Road Trip departure caption assertions passed.");

#!/usr/bin/env node
"use strict";

// Aspen's upstairs photo-pose bubble must never survive into a lower-room viewport.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var report = { errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__unlockAllRooms();
        window.__setGardenParty(true, false);
        window.__goToStage("balcony");
        window.__photoMomentNow();
        await sleep(60);
        var bubble = document.querySelector(".egg-bubble");
        report.upstairs = { bubble: !!bubble, shown: !!(bubble && bubble.classList.contains("show")), freeze: !!window.__photoFreeze };

        window.__openEntranceRoom();
        bubble = document.querySelector(".egg-bubble");
        report.entered = {
          lower: window.__lowerRoomOwnsViewport(),
          entrance: !!window.__entranceRoomOpen,
          bubbleShown: !!(bubble && bubble.classList.contains("show")),
          freeze: !!window.__photoFreeze
        };
        await sleep(360);
        report.settled = { bubble: !!document.querySelector(".egg-bubble"), freeze: !!window.__photoFreeze };

        window.__photoMomentNow();
        await sleep(60);
        report.retrigger = { bubble: !!document.querySelector(".egg-bubble"), freeze: !!window.__photoFreeze };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = report.errors.concat(window.__errs || []);
      var pre = document.createElement("pre");
      pre.id = "__report";
      pre.textContent = JSON.stringify(report);
      document.body.appendChild(pre);
    }, 320);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true, seedRandom: true });
var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else { failures++; console.log("  ✗ " + message + (detail ? " — " + JSON.stringify(detail) : "")); }
}

console.log("rsvp.html Aspen lower-room callout ownership:");
check(result && result.errors.length === 0, "the focused lifecycle raises no page errors", result && result.errors);
check(result && result.upstairs && result.upstairs.bubble && result.upstairs.shown && result.upstairs.freeze,
  "an attended upstairs photo pose owns its visible callout", result && result.upstairs);
check(result && result.entered && result.entered.lower && result.entered.entrance &&
  !result.entered.bubbleShown && !result.entered.freeze,
  "entering the lower Entrance synchronously retires the upstairs pose and bubble", result && result.entered);
check(result && result.settled && !result.settled.bubble && !result.settled.freeze,
  "the dismissed bubble is removed instead of clamping into a viewport corner", result && result.settled);
check(result && result.retrigger && !result.retrigger.bubble && !result.retrigger.freeze,
  "the photo-pose timer cannot restart behind Road Trip or Camping", result && result.retrigger);

if (failures) process.exit(1);
console.log("Aspen lower-room callout assertions passed.");

#!/usr/bin/env node
"use strict";

// Retargeting the room-strip transition must not park a room that the live transform is
// still crossing. Otherwise rapid Left/Right presses expose the viewport background.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function visibleRooms() {
    return window.__stageParkingState().filter(function (room) { return !room.parked; })
      .map(function (room) { return room.room; });
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
  }
  try {
    window.__unlockSolvedRoom("balcony");
    window.__goToStage("garden");
    setTimeout(function () {
      window.__goToStage("cuddly");
      check("second rapid leg retains the first origin",
        visibleRooms().join("|") === "kitchen|garden|cuddly", visibleRooms().join(","));
      setTimeout(function () {
        window.__goToStage("office");
        check("third rapid leg retains every still-crossed room",
          visibleRooms().join("|") === "kitchen|garden|cuddly|office", visibleRooms().join(","));
        setTimeout(function () {
          check("settling parks every intermediate room", visibleRooms().join("|") === "office", visibleRooms().join(","));
          report();
        }, 900);
      }, 40);
    }, 40);
  } catch (error) {
    out.errors.push("setup: " + (error && error.stack || error));
    report();
  }
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 3000, {
  forceMotion: true,
  seedRandom: true
});

if (!result) { console.error("rapid navigation: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (result.errors.length) { failed = true; console.error("runtime errors:\n  " + result.errors.join("\n  ")); }
if (failed) process.exit(1);
console.log("rapid navigation: all " + result.checks.length + " checks passed");
